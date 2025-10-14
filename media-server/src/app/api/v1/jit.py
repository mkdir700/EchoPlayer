"""
v1 JIT 转码 API 路由
"""

import asyncio
import logging
import pathlib
import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.api.deps import (
    CacheManager,
    JITTranscoder,
    PreloadStrategy,
    get_cache_manager,
    get_jit_transcoder,
    get_preload_strategy,
)
from app.config import ConfigManager
from app.models.window import TranscodeProfile
from app.schemas.jit_request import (
    CacheCleanupRequest,
    CacheCleanupResponse,
    CacheStatsResponse,
    FileCacheCleanupRequest,
    FileCacheCleanupResponse,
    JITTranscodeRequest,
    JITTranscodeResponse,
    WindowStatusResponse,
)
from app.utils.hash import (
    calculate_asset_hash,
    calculate_profile_hash,
    calculate_window_id,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jit", tags=["JIT 转码"])


@router.post("/transcode", response_model=JITTranscodeResponse)
async def transcode_window(
    request: JITTranscodeRequest,
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
):
    """
    JIT 转码指定时间点的窗口

    - 如果缓存命中，立即返回 URL
    - 如果缓存未命中，启动转码任务并等待完成
    - 支持自定义转码参数
    """
    try:
        # 检查文件是否存在
        file_path = pathlib.Path(request.file_path)
        if not file_path.exists():
            raise HTTPException(
                status_code=404, detail=f"文件不存在: {request.file_path}"
            )

        # 构建转码配置
        profile = TranscodeProfile()
        if request.video_codec:
            profile.video_codec = request.video_codec
        if request.video_preset:
            profile.video_preset = request.video_preset
        if request.video_bitrate:
            profile.video_bitrate = request.video_bitrate
        if request.hls_time:
            profile.hls_time = request.hls_time
        if request.window_duration:
            profile.window_duration = request.window_duration

        # 记录开始时间
        start_time = time.time()

        # 执行 JIT 转码
        playlist_url = await jit_transcoder.ensure_window(
            request.file_path, request.time_seconds, profile
        )

        # 计算耗时
        elapsed_time = time.time() - start_time

        asset_hash = calculate_asset_hash(file_path)
        profile_hash = calculate_profile_hash(profile.__dict__, profile.version)
        window_id = calculate_window_id(request.time_seconds, profile.window_duration)

        # 检查是否命中缓存（通过转码时间判断）
        cached = elapsed_time < 1.0  # 小于1秒认为是缓存命中

        return JITTranscodeResponse(
            success=True,
            playlist_url=playlist_url,
            window_id=window_id,
            asset_hash=asset_hash,
            profile_hash=profile_hash,
            cached=cached,
            transcode_time=elapsed_time if not cached else None,
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/hls/{asset_hash}/{profile_hash}/{window_id}/{file_name}")
@router.head("/hls/{asset_hash}/{profile_hash}/{window_id}/{file_name}")
async def serve_hls_file(
    asset_hash: str,
    profile_hash: str,
    window_id: str,
    file_name: str,
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
    preload_strategy: PreloadStrategy = Depends(get_preload_strategy),
):
    """
    提供 HLS 文件服务

    - 支持 m3u8 播放列表和 ts 分片文件
    - 直接从缓存目录读取文件
    - 自动触发前 N 个窗口的后台预加载
    """
    # 获取文件路径
    file_path = jit_transcoder.get_window_url(
        asset_hash, profile_hash, int(window_id), file_name
    )

    input_file = None
    profile = None

    if not file_path or not file_path.exists():
        # 文件不存在，尝试立即转码
        try:
            # 先查找现有的窗口获取转码信息
            existing_windows = await jit_transcoder.find_existing_windows(
                asset_hash, profile_hash
            )

            if not existing_windows:
                # 没有找到现有窗口
                raise HTTPException(
                    status_code=404,
                    detail=f"No existing windows found for asset {asset_hash} "
                    f"with profile {profile_hash}",
                )

            # 使用第一个存在的窗口获取转码信息
            first_window_id = existing_windows[0]
            (
                input_file,
                _,
                duration,
                profile,
            ) = await jit_transcoder.get_transcoding_info(
                asset_hash, profile_hash, first_window_id
            )

            if not input_file or not profile:
                raise HTTPException(
                    status_code=404,
                    detail=f"Cannot get transcoding info for {asset_hash}/"
                    f"{profile_hash}",
                )

            # 根据 window_id 重新计算正确的 start_time
            correct_start_time = int(window_id) * profile.window_duration

            # 立即启动转码并等待完成
            logger.info(
                f"开始为 {asset_hash}/{profile_hash}/{window_id}/{file_name} 同步转码"
            )
            playlist_url = await jit_transcoder.ensure_window(
                input_file, correct_start_time, profile
            )
            logger.info(f"转码完成，播放列表: {playlist_url}")

            # 重新获取文件路径
            file_path = jit_transcoder.get_window_url(
                asset_hash, profile_hash, int(window_id), file_name
            )

            if not file_path or not file_path.exists():
                raise HTTPException(
                    status_code=500,
                    detail=f"Transcoding completed but file not found: {file_name}",
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"同步转码失败: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Transcoding failed: {str(e)}",
            )

    # 触发后台预加载（非阻塞）
    # 如果还没有获取 input_file 和 profile，从缓存中获取
    if input_file is None or profile is None:
        try:
            (
                input_file,
                _,
                _,
                profile,
            ) = await jit_transcoder.get_transcoding_info(
                asset_hash, profile_hash, int(window_id)
            )
        except Exception as e:
            logger.warning(f"获取转码信息用于预加载失败: {e}")

    # 如果成功获取了转码信息，触发预加载
    if input_file and profile:
        config = ConfigManager()
        preload_count = config.app_settings.preload_previous_windows
        if preload_count > 0:
            # 创建后台任务，不等待完成
            asyncio.create_task(
                preload_strategy.preload_previous_windows(
                    input_file, int(window_id), profile, preload_count
                )
            )
            logger.debug(
                f"已触发窗口 {window_id} 前 {preload_count} 个窗口的后台预加载"
            )

    # 确定媒体类型
    if file_name.endswith(".m3u8"):
        media_type = "application/vnd.apple.mpegurl"
    elif file_name.endswith(".ts"):
        media_type = "video/mp2t"
    elif file_name.endswith((".m4s", ".mp4")):
        # fMP4 分段和初始化文件
        media_type = "video/mp4"
    else:
        media_type = "application/octet-stream"

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=3600",  # 缓存1小时
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/cache/stats", response_model=CacheStatsResponse)
async def get_cache_stats(
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
    cache_manager: CacheManager = Depends(get_cache_manager),
):
    """
    获取缓存统计信息

    - 显示缓存使用情况
    - 命中率统计
    - LRU 候选信息
    """
    stats = await cache_manager.get_detailed_stats(jit_transcoder)

    return CacheStatsResponse(
        total_windows=stats.total_windows,
        total_size_bytes=stats.total_size_bytes,
        total_size_mb=round(stats.total_size_bytes / (1024 * 1024), 2),
        total_hit_count=stats.total_hit_count,
        avg_window_size=stats.avg_window_size,
        cache_hit_rate=stats.cache_hit_rate,
        oldest_window_age=stats.oldest_window_age,
        lru_candidates=stats.lru_candidates,
    )


@router.post("/cache/cleanup", response_model=CacheCleanupResponse)
async def cleanup_cache(
    request: CacheCleanupRequest,
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
    cache_manager: CacheManager = Depends(get_cache_manager),
):
    """
    手动清理缓存

    支持多种清理策略:
    - lru: LRU 策略清理
    - age: 按年龄清理
    - pattern: 按模式清理
    """
    removed_windows = 0
    freed_bytes = 0

    if request.strategy == "lru":
        removed_windows, freed_bytes = await cache_manager.enforce_cache_limits(
            jit_transcoder
        )

    elif request.strategy == "age":
        if not request.max_age_hours:
            raise HTTPException(
                status_code=400, detail="age 策略需要提供 max_age_hours"
            )
        removed_windows = await cache_manager.cleanup_by_age(
            jit_transcoder, request.max_age_hours
        )

    elif request.strategy == "pattern":
        removed_windows, pattern_freed_bytes = await cache_manager.cleanup_by_pattern(
            jit_transcoder, request.asset_hash
        )
        freed_bytes += pattern_freed_bytes

    else:
        raise HTTPException(
            status_code=400, detail=f"不支持的清理策略: {request.strategy}"
        )

    return CacheCleanupResponse(
        success=True,
        strategy=request.strategy,
        removed_windows=removed_windows,
        freed_bytes=freed_bytes,
        freed_mb=round(freed_bytes / (1024 * 1024), 2),
    )


@router.get("/window/{asset_hash}/{profile_hash}/{window_id:06d}/status")
async def get_window_status(
    asset_hash: str,
    profile_hash: str,
    window_id: int,
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
) -> WindowStatusResponse:
    """
    获取窗口状态信息

    - 显示窗口转码状态
    - 文件大小和缓存信息
    """
    # 检查缓存
    cache_key = (asset_hash, profile_hash, window_id)
    await jit_transcoder._ensure_cache_loaded()

    if cache_key in jit_transcoder.cache_index:
        cache = jit_transcoder.cache_index[cache_key]
        return WindowStatusResponse(
            window_id=window_id,
            asset_hash=asset_hash,
            profile_hash=profile_hash,
            status="cached",
            created_at=cache.created_at,
            duration_seconds=cache.get_age_seconds(),
            cached=True,
            file_size_bytes=cache.file_size_bytes,
            playlist_url=f"/api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id:06d}/index.m3u8",
        )

    # 检查运行中的任务
    if cache_key in jit_transcoder.running_windows:
        window = jit_transcoder.running_windows[cache_key]
        return WindowStatusResponse(
            window_id=window_id,
            asset_hash=asset_hash,
            profile_hash=profile_hash,
            status=window.status.value,
            created_at=window.created_at,
            duration_seconds=window.duration_seconds,
            cached=False,
            file_size_bytes=0,
            playlist_url=None,
        )

    # 窗口不存在
    raise HTTPException(status_code=404, detail="窗口不存在")


@router.post("/cache/cleanup/file", response_model=FileCacheCleanupResponse)
async def cleanup_file_cache(
    request: FileCacheCleanupRequest,
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
    cache_manager: CacheManager = Depends(get_cache_manager),
):
    """
    清空指定文件路径的所有缓存

    - 根据文件路径计算资产哈希
    - 删除该文件的所有转码缓存窗口
    - 支持不同转码配置下的所有缓存
    """
    try:
        # 检查文件是否存在
        file_path = pathlib.Path(request.file_path)
        if not file_path.exists():
            return FileCacheCleanupResponse(
                success=False,
                file_path=request.file_path,
                asset_hash=None,
                removed_windows=0,
                freed_bytes=0,
                freed_mb=0.0,
                message=f"文件不存在: {request.file_path}",
            )

        # 计算文件的资产哈希
        asset_hash = calculate_asset_hash(file_path)

        # 使用缓存管理器按模式清理（指定asset_hash）
        removed_windows, freed_bytes = await cache_manager.cleanup_by_pattern(
            jit_transcoder, asset_hash=asset_hash
        )

        freed_mb = round(freed_bytes / (1024 * 1024), 2)

        message = (
            f"成功清理文件 {request.file_path} 的缓存，删除了 {removed_windows} 个窗口"
            if removed_windows > 0
            else f"文件 {request.file_path} 没有找到任何缓存"
        )

        return FileCacheCleanupResponse(
            success=True,
            file_path=request.file_path,
            asset_hash=asset_hash,
            removed_windows=removed_windows,
            freed_bytes=freed_bytes,
            freed_mb=freed_mb,
            message=message,
        )

    except Exception as e:
        logger.error(f"清理文件缓存失败: {e}")
        return FileCacheCleanupResponse(
            success=False,
            file_path=request.file_path,
            asset_hash=None,
            removed_windows=0,
            freed_bytes=0,
            freed_mb=0.0,
            message=f"清理失败: {str(e)}",
        )


@router.get("/config")
async def get_config(
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
    cache_manager: CacheManager = Depends(get_cache_manager),
):
    """
    获取 JIT 转码器配置

    - 显示当前配置参数
    - 缓存管理设置
    """
    return {
        "cache_config": cache_manager.get_config(),
        "transcoder_config": {
            "cache_root": str(jit_transcoder.cache_root),
            "max_concurrent": jit_transcoder.max_concurrent,
            "running_tasks": len(jit_transcoder.running_windows),
            "cache_loaded": jit_transcoder.cache_loaded,
        },
    }
