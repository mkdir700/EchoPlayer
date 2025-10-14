"""
会话级播放API路由
支持跨窗口连续播放的会话管理
"""

import logging
import pathlib
import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.api.deps import get_session_manager
from app.schemas.session_request import (
    SessionCreateRequest,
    SessionCreateResponse,
    SessionDeleteResponse,
    SessionInfoResponse,
    SessionListResponse,
    SessionPlaylistResponse,
    SessionProgressResponse,
    SessionSeekRequest,
    SessionSeekResponse,
    SessionStatsResponse,
    SessionUpdateTimeRequest,
    SessionUpdateTimeResponse,
)
from app.services.session_manager import SessionManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/session", tags=["会话级播放"])


@router.post("/create", response_model=SessionCreateResponse)
async def create_session(
    request: SessionCreateRequest,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    创建新的播放会话（异步创建，立即返回）

    - 立即返回 session_id
    - 后台异步处理转码工作
    - 使用 /progress 接口查询创建进度
    - 支持跨窗口连续播放
    - 自动预加载相邻窗口
    """
    try:
        # 检查文件是否存在
        file_path = pathlib.Path(request.file_path)
        if not file_path.exists():
            raise HTTPException(
                status_code=404, detail=f"文件不存在: {request.file_path}"
            )

        # 创建会话（立即返回，后台处理）
        session = await session_manager.create_session(
            file_path=file_path,
            quality=request.quality,
            initial_time=request.initial_time,
            enable_hybrid=request.enable_hybrid,
            video_only=request.video_only,
        )

        # 生成播放列表URL
        playlist_url = f"/api/v1/session/{session.session_id}/playlist.m3u8"

        return SessionCreateResponse(
            success=True,
            session_id=session.session_id,
            playlist_url=playlist_url,
            asset_hash=session.asset_hash if session.asset_hash else "",
            profile_hash=session.profile_hash if session.profile_hash else "",
            initial_windows_loaded=len(session.loaded_windows),
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"创建会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建会话失败: {str(e)}")


@router.get("/{session_id}/playlist.m3u8")
async def get_session_playlist(
    session_id: str,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    获取会话的播放列表文件

    - 返回m3u8格式的播放列表
    - 包含跨窗口的连续片段
    - 在窗口边界自动插入EXT-X-DISCONTINUITY标记
    - 混合模式下返回主播放列表(Master Playlist)
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        from app.models.session import SessionStatus

        # 检查会话是否已准备好
        if session.status != SessionStatus.ACTIVE:
            raise HTTPException(
                status_code=425,  # Too Early
                detail=f"会话正在创建中，请稍后重试。当前进度: {session.progress_percent:.1f}%",
            )

        playlist_content = await session_manager.get_session_playlist(session_id)
        if not playlist_content:
            raise HTTPException(status_code=404, detail="播放列表无效")

        return Response(
            content=playlist_content,
            media_type="application/vnd.apple.mpegurl",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取会话播放列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"播放列表错误: {str(e)}")


@router.get("/{session_id}/video.m3u8")
async def get_session_video_playlist(
    session_id: str,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    获取会话的视频轨道播放列表

    - 专用于混合模式的视频轨道
    - 只包含视频片段（无音频）
    - 与独立音频轨道配合使用
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        # 生成视频专用播放列表
        playlist_content = await session_manager.get_session_video_playlist(session_id)
        if not playlist_content:
            raise HTTPException(status_code=404, detail="视频播放列表无效")

        return Response(
            content=playlist_content,
            media_type="application/vnd.apple.mpegurl",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取视频播放列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"视频播放列表错误: {str(e)}")


@router.get("/{session_id}/progress", response_model=SessionProgressResponse)
async def get_session_progress(
    session_id: str,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    获取会话创建进度

    - 实时返回创建进度百分比
    - 显示当前处理阶段
    - 包含音频转码进度（混合模式）
    - 用于前端展示加载动画
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        from app.models.session import SessionStatus

        # 判断是否已准备好播放
        is_ready = session.status == SessionStatus.ACTIVE

        # 获取音频转码进度（如果启用混合模式）
        audio_progress = None
        if session.hybrid_mode and session.audio_track_id:
            try:
                # 从 audio_track_id 解析出哈希值
                # audio_track_{asset_hash}_{profile_hash}
                parts = session.audio_track_id.split("_")
                if len(parts) == 4:
                    asset_hash = parts[2]
                    profile_hash = parts[3]

                    # 导入依赖
                    from app.api.deps import get_audio_preprocessor

                    audio_preprocessor = await get_audio_preprocessor()
                    progress = await audio_preprocessor.get_track_progress(
                        asset_hash, profile_hash
                    )

                    if progress:
                        audio_progress = progress
            except Exception as e:
                logger.warning(f"获取音频转码进度失败: {e}")

        return SessionProgressResponse(
            session_id=session.session_id,
            status=session.status,
            progress_percent=session.progress_percent,
            progress_stage=session.progress_stage,
            error_message=session.error_message,
            is_ready=is_ready,
            playlist_url=f"/api/v1/session/{session_id}/playlist.m3u8"
            if is_ready
            else None,
            audio_progress=audio_progress,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取会话进度失败: {e}")
        raise HTTPException(status_code=500, detail=f"进度查询错误: {str(e)}")


@router.get("/{session_id}/info", response_model=SessionInfoResponse)
async def get_session_info(
    session_id: str,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    获取会话信息

    - 显示会话状态和播放进度
    - 已加载和正在预加载的窗口信息
    - 播放列表统计信息
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        # 获取播放列表信息
        total_segments = 0
        total_duration = 0.0
        if session.playlist:
            total_segments = len(session.playlist.segments)
            total_duration = session.playlist.get_total_duration()

        return SessionInfoResponse(
            session_id=session.session_id,
            file_path=str(session.file_path),
            asset_hash=session.asset_hash,
            profile_hash=session.profile_hash,
            status=session.status,
            created_at=session.created_at,
            last_access=session.last_access,
            expires_at=session.expires_at,
            current_time=session.current_time,
            duration=session.duration,
            loaded_windows=list(session.loaded_windows),
            preloading_windows=list(session.preloading_windows),
            playlist_url=f"/api/v1/session/{session_id}/playlist.m3u8",
            total_segments=total_segments,
            total_duration=total_duration,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取会话信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"会话信息错误: {str(e)}")


@router.post("/{session_id}/seek", response_model=SessionSeekResponse)
async def seek_session(
    session_id: str,
    request: SessionSeekRequest,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    会话内seek操作

    - 支持跨窗口无缝跳转
    - 自动预加载目标位置的窗口
    - 更新播放列表以包含新的时间范围
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        old_time = session.current_time

        # 执行seek
        updated_session = await session_manager.seek_session(
            session_id, request.time_seconds
        )
        if not updated_session:
            raise HTTPException(status_code=500, detail="Seek操作失败")

        # 计算新加载的窗口数
        windows_loaded = len(updated_session.loaded_windows) - len(
            session.loaded_windows
        )

        return SessionSeekResponse(
            success=True,
            old_time=old_time,
            new_time=updated_session.current_time,
            playlist_updated=updated_session.playlist_dirty,
            windows_loaded=max(0, windows_loaded),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"会话seek失败: {e}")
        raise HTTPException(status_code=500, detail=f"Seek错误: {str(e)}")


@router.post("/{session_id}/update-time", response_model=SessionUpdateTimeResponse)
async def update_session_time(
    session_id: str,
    request: SessionUpdateTimeRequest,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    更新会话播放时间

    - 用于播放器定期报告播放进度
    - 自动预加载即将播放的窗口
    - 保持会话活跃状态
    """
    try:
        old_loaded_count = 0
        session = await session_manager.get_session(session_id)
        if session:
            old_loaded_count = len(session.loaded_windows)

        updated_session = await session_manager.update_session_time(
            session_id, request.current_time
        )
        if not updated_session:
            raise HTTPException(status_code=404, detail="会话不存在")

        windows_preloaded = len(updated_session.loaded_windows) - old_loaded_count

        return SessionUpdateTimeResponse(
            success=True,
            windows_preloaded=max(0, windows_preloaded),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新会话时间失败: {e}")
        raise HTTPException(status_code=500, detail=f"时间更新错误: {str(e)}")


@router.delete("/{session_id}", response_model=SessionDeleteResponse)
async def delete_session(
    session_id: str,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    删除会话

    - 清理会话资源
    - 释放相关的窗口缓存引用
    """
    try:
        success = await session_manager.delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="会话不存在")

        return SessionDeleteResponse(
            success=True,
            session_id=session_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除错误: {str(e)}")


@router.get("/list", response_model=SessionListResponse)
async def list_sessions(
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    列出所有会话

    - 显示所有活跃会话的基本信息
    - 用于管理和监控
    """
    try:
        sessions = await session_manager.list_sessions()

        session_infos = []
        for session in sessions:
            # 获取播放列表信息
            total_segments = 0
            total_duration = 0.0
            if session.playlist:
                total_segments = len(session.playlist.segments)
                total_duration = session.playlist.get_total_duration()

            session_info = SessionInfoResponse(
                session_id=session.session_id,
                file_path=str(session.file_path),
                asset_hash=session.asset_hash,
                profile_hash=session.profile_hash,
                status=session.status,
                created_at=session.created_at,
                last_access=session.last_access,
                expires_at=session.expires_at,
                current_time=session.current_time,
                duration=session.duration,
                loaded_windows=list(session.loaded_windows),
                preloading_windows=list(session.preloading_windows),
                playlist_url=f"/api/v1/session/{session.session_id}/playlist.m3u8",
                total_segments=total_segments,
                total_duration=total_duration,
            )
            session_infos.append(session_info)

        return SessionListResponse(
            sessions=session_infos,
            total_count=len(session_infos),
        )

    except Exception as e:
        logger.error(f"列出会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"列表错误: {str(e)}")


@router.get("/stats", response_model=SessionStatsResponse)
async def get_session_stats(
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    获取会话统计信息

    - 会话数量和状态分布
    - 平均会话时长
    - 窗口加载统计
    """
    try:
        stats = await session_manager.get_session_stats()

        return SessionStatsResponse(
            total_sessions=stats.total_sessions,
            active_sessions=stats.active_sessions,
            idle_sessions=stats.idle_sessions,
            expired_sessions=stats.expired_sessions,
            total_windows_loaded=stats.total_windows_loaded,
            cache_hit_rate=stats.cache_hit_rate,
            avg_session_duration=stats.avg_session_duration,
        )

    except Exception as e:
        logger.error(f"获取会话统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"统计错误: {str(e)}")


@router.get("/{session_id}/playlist-info", response_model=SessionPlaylistResponse)
async def get_session_playlist_info(
    session_id: str,
    session_manager: SessionManager = Depends(get_session_manager),
):
    """
    获取会话播放列表的详细信息

    - 不返回实际的m3u8内容，只返回统计信息
    - 用于调试和监控
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        playlist_content = await session_manager.get_session_playlist(session_id)
        if not playlist_content:
            raise HTTPException(status_code=404, detail="播放列表无效")

        # 统计播放列表信息
        segments_count = 0
        windows_count = 0
        total_duration = 0.0

        if session.playlist:
            segments_count = len(session.playlist.segments)
            windows_count = session.playlist.get_window_count()
            total_duration = session.playlist.get_total_duration()

        return SessionPlaylistResponse(
            success=True,
            session_id=session_id,
            playlist_content=playlist_content,
            segments_count=segments_count,
            windows_count=windows_count,
            total_duration=total_duration,
            last_updated=time.time(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取播放列表信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"播放列表信息错误: {str(e)}")
