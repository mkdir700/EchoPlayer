"""
会话管理器
负责管理播放会话的生命周期和状态
"""

import asyncio
import logging
import time
from pathlib import Path

from app.models.session import (
    PlaybackSession,
    SessionStats,
    SessionStatus,
)
from app.services.jit_transcoder import JITTranscoder
from app.services.session_factory import SessionFactory
from app.services.session_playlist_generator import SessionPlaylistGenerator

logger = logging.getLogger(__name__)


class SessionManager:
    """会话管理器"""

    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):  # noqa: ARG004
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, jit_transcoder: JITTranscoder, audio_preprocessor=None):
        if self._initialized:
            return

        self.jit_transcoder = jit_transcoder
        self.session_factory = SessionFactory(audio_preprocessor)
        self.playlist_generator = SessionPlaylistGenerator(
            jit_transcoder, audio_preprocessor
        )

        # 会话存储
        self.sessions: dict[str, PlaybackSession] = {}
        self.sessions_by_file: dict[str, set[str]] = {}  # 文件路径 -> 会话ID集合

        # 配置
        self.session_timeout = 3600  # 会话超时时间（秒）
        self.idle_timeout = 300  # 空闲超时时间（秒）
        self.cleanup_interval = 60  # 清理检查间隔（秒）

        # 背景任务
        self.cleanup_task: asyncio.Task | None = None
        self.running = True

        logger.info("会话管理器初始化完成")
        self._initialized = True

    async def create_session(
        self,
        file_path: Path,
        quality: str = "720p",
        initial_time: float = 0.0,
        enable_hybrid: bool | None = None,
        video_only: bool = False,
    ) -> PlaybackSession:
        """
        创建新的播放会话（立即返回，后台异步处理）

        Args:
            file_path: 视频文件路径
            quality: 质量档位 (480p, 720p, 1080p)
            initial_time: 初始播放时间
            enable_hybrid: 是否启用混合模式（None=自动检测）
            video_only: 是否只转码视频

        Returns:
            PlaybackSession: 创建的会话（状态为CREATING）
        """
        # 先创建一个占位会话，立即返回
        from app.models.session import PlaybackSession, SessionStatus

        session = PlaybackSession(
            file_path=file_path,
            status=SessionStatus.CREATING,
            current_time=initial_time,
        )
        session.update_progress(0.0, "初始化会话")

        # 存储会话
        self.sessions[session.session_id] = session

        # 按文件路径索引
        file_key = str(file_path)
        if file_key not in self.sessions_by_file:
            self.sessions_by_file[file_key] = set()
        self.sessions_by_file[file_key].add(session.session_id)

        logger.info(f"开始创建会话 {session.session_id}: {file_path} @ {initial_time}s")

        # 启动后台任务进行实际的创建工作
        asyncio.create_task(
            self._create_session_background(
                session.session_id,
                file_path,
                quality,
                initial_time,
                enable_hybrid,
                video_only,
            )
        )

        # 启动清理任务（如果还未启动）
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_loop())

        return session

    async def _create_session_background(
        self,
        session_id: str,
        file_path: Path,
        quality: str,
        initial_time: float,
        enable_hybrid: bool | None,
        video_only: bool,
    ) -> None:
        """
        后台异步创建会话

        Args:
            session_id: 会话ID
            file_path: 文件路径
            quality: 质量档位
            initial_time: 初始时间
            enable_hybrid: 是否启用混合模式
            video_only: 是否只转码视频
        """
        from app.models.session import SessionStatus

        session = self.sessions.get(session_id)
        if not session:
            logger.error(f"会话 {session_id} 不存在，无法完成后台创建")
            return

        try:
            # 阶段1: 使用SessionFactory创建配置（10%）
            session.update_progress(5.0, "正在分析视频文件", SessionStatus.CREATING)

            # 定义进度回调函数
            async def on_progress(percent: float, stage: str):
                session.update_progress(percent, stage, SessionStatus.PREPROCESSING)

            created_session = await self.session_factory.create_session(
                file_path=file_path,
                quality=quality,
                initial_time=initial_time,
                enable_hybrid=enable_hybrid,
                video_only=video_only,
                progress_callback=on_progress,
            )

            # 阶段2: 更新会话配置
            # 如果音频已预处理，进度应该在30%左右（由回调更新）
            # 如果没有启用混合模式，手动设置为20%
            if not created_session.hybrid_mode:
                session.update_progress(20.0, "正在生成转码配置")

            session.asset_hash = created_session.asset_hash
            session.profile = created_session.profile
            session.profile_hash = created_session.profile_hash
            session.duration = created_session.duration

            # 如果启用了混合模式，复制音频配置
            if created_session.hybrid_mode:
                # 音频预处理完成，进度应该在85%左右
                session.update_progress(
                    85.0, "音频预处理完成", SessionStatus.PREPROCESSING
                )
                session.hybrid_mode = True
                session.audio_track_id = created_session.audio_track_id
                session.audio_profile = created_session.audio_profile
                session.audio_track_ready = created_session.audio_track_ready

            # 阶段3: 预加载初始窗口（85%-90%）
            session.update_progress(85.0, "正在转码初始窗口", SessionStatus.TRANSCODING)
            await self._preload_initial_windows(session)

            # 阶段4: 完成初始化（90%-100%）
            session.update_progress(
                90.0, "正在生成播放列表", SessionStatus.INITIALIZING
            )

            # 标记完成
            session.mark_creation_complete()
            logger.info(f"会话 {session_id} 创建完成")

        except Exception as e:
            logger.error(f"会话 {session_id} 创建失败: {e}")
            session.mark_creation_failed(str(e))

    async def get_session(self, session_id: str) -> PlaybackSession | None:
        """获取会话"""
        session = self.sessions.get(session_id)
        if session:
            session.update_access()
        return session

    async def update_session_time(
        self, session_id: str, current_time: float
    ) -> PlaybackSession | None:
        """
        更新会话播放时间

        Args:
            session_id: 会话ID
            current_time: 当前播放时间

        Returns:
            更新后的会话，如果不存在返回None
        """
        session = await self.get_session(session_id)
        if not session:
            return None

        old_time = session.current_time
        session.current_time = current_time

        logger.debug(
            f"会话 {session_id} 时间更新: {old_time:.1f}s -> {current_time:.1f}s"
        )

        # 检查是否需要预加载新窗口
        await self._ensure_windows_available(session)

        return session

    async def seek_session(
        self, session_id: str, seek_time: float
    ) -> PlaybackSession | None:
        """
        会话内seek操作

        Args:
            session_id: 会话ID
            seek_time: 目标时间

        Returns:
            更新后的会话
        """
        session = await self.get_session(session_id)
        if not session:
            return None

        logger.info(
            f"会话 {session_id} seek: {session.current_time:.1f}s -> {seek_time:.1f}s"
        )

        # 更新播放列表（处理跨窗口seek）
        updated_playlist = await self.playlist_generator.update_playlist_for_seek(
            session, seek_time
        )

        if updated_playlist:
            logger.debug(f"会话 {session_id} 播放列表已更新 (seek)")

        # 确保新位置的窗口可用
        await self._ensure_windows_available(session)

        # 更新分片可用性
        await self.playlist_generator.update_segment_availability(session)

        return session

    async def get_session_playlist(self, session_id: str) -> str | None:
        """获取会话的播放列表内容"""
        session = await self.get_session(session_id)
        if not session:
            return None

        # 生成或更新播放列表
        playlist = await self.playlist_generator.generate_playlist(session)

        # 验证播放列表
        if not await self.playlist_generator.validate_playlist(playlist):
            logger.error(f"会话 {session_id} 播放列表验证失败")
            return None

        return playlist.to_m3u8()

    async def get_session_video_playlist(self, session_id: str) -> str | None:
        """获取会话的视频轨道播放列表内容（用于混合模式）"""
        session = await self.get_session(session_id)
        if not session:
            return None

        # 生成或更新播放列表
        playlist = await self.playlist_generator.generate_playlist(session)

        # 验证播放列表
        if not await self.playlist_generator.validate_playlist(playlist):
            logger.error(f"会话 {session_id} 播放列表验证失败")
            return None

        # 对于混合模式，强制生成媒体播放列表（只包含视频）
        return playlist._generate_media_playlist()

    async def delete_session(self, session_id: str) -> bool:
        """删除会话"""
        session = self.sessions.get(session_id)
        if not session:
            return False

        # 从索引中移除
        file_key = str(session.file_path)
        if file_key in self.sessions_by_file:
            self.sessions_by_file[file_key].discard(session_id)
            if not self.sessions_by_file[file_key]:
                del self.sessions_by_file[file_key]

        # 删除会话
        del self.sessions[session_id]

        logger.info(f"删除会话 {session_id}")
        return True

    async def _preload_initial_windows(self, session: PlaybackSession) -> None:
        """预加载初始窗口"""
        current_window_id = session.get_current_window_id()
        await self._load_windows(session, [current_window_id])

    async def _ensure_windows_available(self, session: PlaybackSession) -> None:
        """确保所需的窗口可用"""
        required_windows = session.get_required_windows()
        missing_windows = [
            wid
            for wid in required_windows
            if wid not in session.loaded_windows
            and wid not in session.preloading_windows
        ]

        if missing_windows:
            logger.debug(f"会话 {session.session_id} 需要加载窗口: {missing_windows}")
            await self._load_windows(session, missing_windows)

            # 更新分片可用性
            await self.playlist_generator.update_segment_availability(session)

    async def _load_windows(
        self, session: PlaybackSession, window_ids: list[int]
    ) -> None:
        """加载指定的窗口"""
        for window_id in window_ids:
            if (
                window_id in session.loaded_windows
                or window_id in session.preloading_windows
            ):
                continue

            try:
                # 标记正在预加载
                session.preloading_windows.add(window_id)

                # 计算窗口时间
                start_time = window_id * session.profile.window_duration

                # 使用JIT转码器确保窗口可用
                await self.jit_transcoder.ensure_window(
                    session.file_path, start_time, session.profile
                )

                # 获取窗口缓存信息
                cache_key = (session.asset_hash, session.profile_hash, window_id)
                await self.jit_transcoder._ensure_cache_loaded()

                if cache_key in self.jit_transcoder.cache_index:
                    window_cache = self.jit_transcoder.cache_index[cache_key]

                    # 添加到会话窗口列表
                    session.add_window(window_id, window_cache)

                    logger.debug(f"会话 {session.session_id} 窗口 {window_id} 已加载")
                else:
                    logger.warning(f"窗口 {window_id} 转码完成但未在缓存索引中找到")

            except Exception as e:
                logger.error(f"加载窗口 {window_id} 失败: {e}")
            finally:
                # 清除预加载标记
                session.preloading_windows.discard(window_id)

    async def _cleanup_loop(self) -> None:
        """背景清理任务循环"""
        logger.info("会话清理任务启动")

        while self.running:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_expired_sessions()
            except Exception as e:
                logger.error(f"会话清理任务出错: {e}")

    async def _cleanup_expired_sessions(self) -> None:
        """清理过期的会话"""
        expired_sessions = []

        for session_id, session in self.sessions.items():
            if session.is_expired():
                expired_sessions.append(session_id)
                session.status = SessionStatus.EXPIRED
            elif session.is_idle(self.idle_timeout):
                session.status = SessionStatus.IDLE

        # 删除过期的会话
        for session_id in expired_sessions:
            await self.delete_session(session_id)

        if expired_sessions:
            logger.info(f"清理了 {len(expired_sessions)} 个过期会话")

    async def get_session_stats(self) -> SessionStats:
        """获取会话统计信息"""
        total_sessions = len(self.sessions)
        active_sessions = sum(
            1 for s in self.sessions.values() if s.status == SessionStatus.ACTIVE
        )
        idle_sessions = sum(
            1 for s in self.sessions.values() if s.status == SessionStatus.IDLE
        )
        expired_sessions = sum(
            1 for s in self.sessions.values() if s.status == SessionStatus.EXPIRED
        )

        total_windows = sum(len(s.loaded_windows) for s in self.sessions.values())

        # 计算平均会话时长
        avg_duration = 0.0
        if total_sessions > 0:
            total_duration = sum(
                time.time() - s.created_at for s in self.sessions.values()
            )
            avg_duration = total_duration / total_sessions

        return SessionStats(
            total_sessions=total_sessions,
            active_sessions=active_sessions,
            idle_sessions=idle_sessions,
            expired_sessions=expired_sessions,
            total_windows_loaded=total_windows,
            avg_session_duration=avg_duration,
        )

    async def list_sessions(self) -> list[PlaybackSession]:
        """列出所有会话"""
        return list(self.sessions.values())

    async def get_sessions_for_file(self, file_path: Path) -> list[PlaybackSession]:
        """获取指定文件的所有会话"""
        file_key = str(file_path)
        session_ids = self.sessions_by_file.get(file_key, set())
        return [self.sessions[sid] for sid in session_ids if sid in self.sessions]

    def shutdown(self) -> None:
        """关闭会话管理器"""
        logger.info("会话管理器关闭中...")

        self.running = False

        if self.cleanup_task:
            self.cleanup_task.cancel()

        # 清理所有会话
        self.sessions.clear()
        self.sessions_by_file.clear()

        logger.info("会话管理器已关闭")
