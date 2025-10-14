"""
音频轨道API端点
支持混合转码模式的音频分片服务
"""

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import FileResponse, Response

from app.api.deps import get_audio_preprocessor
from app.config import ConfigManager
from app.services.audio_preprocessor import AudioPreprocessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audio", tags=["音频轨道"])

# 获取配置管理器
config_manager = ConfigManager()


@router.get("/{audio_track_id}/playlist.m3u8")
async def get_audio_playlist(
    audio_track_id: str,
    audio_preprocessor: AudioPreprocessor = Depends(get_audio_preprocessor),
):
    """
    获取音频轨道的HLS播放列表

    Args:
        audio_track_id: 音频轨道ID（格式: audio_track_{asset_hash}_{profile_hash}）
        audio_preprocessor: 音频预处理器

    Returns:
        Response: m3u8播放列表
    """
    try:
        # 解析轨道ID获取哈希值
        if not audio_track_id.startswith("audio_track_"):
            raise HTTPException(status_code=400, detail="无效的音频轨道ID")

        # 从 audio_track_{asset_hash}_{profile_hash} 中提取哈希值
        parts = audio_track_id.split("_")
        if len(parts) != 4:
            raise HTTPException(status_code=400, detail="音频轨道ID格式错误")

        asset_hash = parts[2]
        profile_hash = parts[3]

        # 生成音频播放列表
        playlist_content = await audio_preprocessor.get_audio_playlist(
            asset_hash, profile_hash
        )

        if not playlist_content:
            raise HTTPException(status_code=404, detail="音频轨道播放列表不存在")

        http_config = config_manager.http
        headers = {
            **http_config.no_cache_headers,
            "Access-Control-Allow-Origin": "*",
        }

        return Response(
            content=playlist_content,
            media_type=http_config.media_types["m3u8"],
            headers=headers,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取音频播放列表失败: {e}")
        raise HTTPException(status_code=500, detail="获取音频播放列表失败")


@router.get("/{asset_hash}/{profile_hash}/{filename}.aac")
async def get_audio_file(
    asset_hash: str,
    profile_hash: str,
    filename: str,
) -> FileResponse:
    """
    获取音频文件（统一返回完整音频文件）

    Args:
        asset_hash: 资产哈希
        profile_hash: 配置哈希
        filename: 请求的文件名（忽略，统一返回完整音频）

    Returns:
        FileResponse: 完整的音频文件
    """
    if not config_manager.transcode.enable_hybrid_mode:
        raise HTTPException(status_code=400, detail="混合模式未启用")

    try:
        # 构建完整音频文件路径，忽略请求的filename
        cache_config = config_manager.cache
        audio_cache_root = Path(cache_config.audio_cache_root)
        complete_audio_file = (
            audio_cache_root
            / asset_hash
            / profile_hash
            / cache_config.audio_track_filename
        )

        if not complete_audio_file.exists():
            raise HTTPException(status_code=404, detail="音频文件不存在")

        # 返回完整音频文件
        http_config = config_manager.http
        return FileResponse(
            path=complete_audio_file,
            media_type=http_config.media_types["aac"],
            headers={
                **http_config.static_cache_headers,
                "Content-Disposition": f"inline; filename={filename}.aac",
            },
        )

    except Exception as e:
        logger.error(f"获取音频文件失败: {e}")
        raise HTTPException(status_code=500, detail="获取音频文件失败")


@router.get("/{asset_hash}/{profile_hash}/progress")
async def get_audio_progress(
    asset_hash: str,
    profile_hash: str,
    audio_preprocessor: AudioPreprocessor = Depends(get_audio_preprocessor),
):
    """
    获取音频轨道转码进度

    Args:
        asset_hash: 资产哈希
        profile_hash: 配置哈希
        audio_preprocessor: 音频预处理器

    Returns:
        dict: 转码进度信息
    """
    try:
        progress = await audio_preprocessor.get_track_progress(asset_hash, profile_hash)

        if progress is None:
            raise HTTPException(status_code=404, detail="音频轨道不存在")

        return progress

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取音频进度失败: {e}")
        raise HTTPException(status_code=500, detail="获取进度失败")


@router.get("/{asset_hash}/{profile_hash}/stats")
async def get_audio_track_stats(
    asset_hash: str,
    profile_hash: str,
    audio_preprocessor: AudioPreprocessor = Depends(get_audio_preprocessor),
):
    """
    获取音频轨道统计信息

    Args:
        asset_hash: 资产哈希
        profile_hash: 配置哈希
        audio_preprocessor: 音频预处理器

    Returns:
        dict: 音频轨道统计信息
    """
    if not config_manager.transcode.enable_hybrid_mode:
        raise HTTPException(status_code=404, detail="混合模式未启用")

    try:
        # 检查轨道是否存在
        cache_key = (asset_hash, profile_hash)
        await audio_preprocessor._ensure_cache_loaded()

        if cache_key not in audio_preprocessor.track_cache:
            raise HTTPException(status_code=404, detail="音频轨道不存在")

        cache = audio_preprocessor.track_cache[cache_key]

        return {
            "asset_hash": asset_hash,
            "profile_hash": profile_hash,
            "duration": cache.duration,
            "total_size_bytes": cache.total_size,
            "hit_count": cache.hit_count,
            "created_at": cache.created_at,
            "last_access": cache.last_access,
            "age_seconds": cache.get_age_seconds(),
            "idle_seconds": cache.get_idle_seconds(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取音频轨道统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取统计信息失败")


@router.get("/stats")
async def get_audio_global_stats(
    audio_preprocessor: AudioPreprocessor = Depends(get_audio_preprocessor),
):
    """
    获取全局音频统计信息

    Args:
        audio_preprocessor: 音频预处理器

    Returns:
        dict: 全局统计信息
    """
    if not config_manager.transcode.enable_hybrid_mode:
        raise HTTPException(status_code=404, detail="混合模式未启用")

    try:
        stats = await audio_preprocessor.get_track_stats()

        return {
            "total_tracks": stats.total_tracks,
            "total_size_bytes": stats.total_size_bytes,
            "total_hit_count": stats.total_hit_count,
            "avg_track_size": stats.avg_track_size,
            "cache_hit_rate": stats.cache_hit_rate,
            "oldest_track_age": stats.oldest_track_age,
            "hybrid_mode_enabled": config_manager.transcode.enable_hybrid_mode,
            "audio_cache_root": config_manager.cache.audio_cache_root,
        }

    except Exception as e:
        logger.error(f"获取全局统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取统计信息失败")


@router.post("/cleanup")
async def cleanup_expired_tracks(
    max_age_hours: int | None = None,
    audio_preprocessor: AudioPreprocessor = Depends(get_audio_preprocessor),
):
    """
    清理过期的音频轨道

    Args:
        max_age_hours: 最大年龄（小时），默认使用配置值
        audio_preprocessor: 音频预处理器

    Returns:
        dict: 清理结果
    """
    if not config_manager.transcode.enable_hybrid_mode:
        raise HTTPException(status_code=404, detail="混合模式未启用")

    try:
        removed_count = await audio_preprocessor.cleanup_expired_tracks(max_age_hours)

        return {
            "removed_count": removed_count,
            "max_age_hours": max_age_hours
            or config_manager.cache.audio_track_ttl_hours,
            "message": f"成功清理 {removed_count} 个过期音频轨道",
        }

    except Exception as e:
        logger.error(f"清理音频轨道失败: {e}")
        raise HTTPException(status_code=500, detail="清理操作失败")
