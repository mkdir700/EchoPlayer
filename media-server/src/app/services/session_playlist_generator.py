"""
会话级播放列表生成器
负责生成跨窗口连续播放的HLS播放列表
"""

import logging
import time

import aiofiles

from app.models.session import (
    PlaybackSession,
    PlaylistSegment,
    PrecomputedSegment,
    SessionPlaylist,
    WindowReference,
)
from app.services.audio_preprocessor import AudioPreprocessor
from app.services.jit_transcoder import JITTranscoder
from app.utils.hash import get_cache_path

logger = logging.getLogger(__name__)


class SessionPlaylistGenerator:
    """会话级播放列表生成器"""

    def __init__(
        self,
        jit_transcoder: JITTranscoder,
        audio_preprocessor: AudioPreprocessor | None = None,
    ):
        self.jit_transcoder = jit_transcoder
        self.audio_preprocessor = audio_preprocessor

    async def generate_playlist(self, session: PlaybackSession) -> SessionPlaylist:
        """
        为会话生成播放列表

        Args:
            session: 播放会话

        Returns:
            SessionPlaylist: 生成的播放列表
        """
        if not session.needs_playlist_rebuild() and session.playlist is not None:
            return session.playlist

        logger.debug(f"为会话 {session.session_id} 生成播放列表")

        # 创建新的播放列表
        playlist = SessionPlaylist(
            session_id=session.session_id,
            target_duration=session.profile.hls_time,
            version=6,
            is_live=False,
            has_audio_track=session.hybrid_mode and session.is_audio_ready(),
            audio_track_id=session.audio_track_id if session.hybrid_mode else None,
        )

        # 获取排序后的窗口
        sorted_windows = self._get_sorted_windows(session)
        if not sorted_windows:
            logger.warning(f"会话 {session.session_id} 没有可用的窗口")
            return playlist

        # 根据会话模式生成播放列表片段
        if session.hybrid_mode:
            # 混合模式：结合视频窗口和音频轨道
            segments = await self._generate_hybrid_segments(session)
        else:
            # 传统模式：基于预计算生成
            segments = await self._generate_precomputed_segments(session)

        playlist.segments = segments

        # 更新会话播放列表
        session.playlist = playlist
        session.mark_playlist_clean()

        logger.info(
            f"会话 {session.session_id} 播放列表生成完成: "
            f"{len(segments)} 个片段, {playlist.get_window_count()} 个窗口"
        )

        return playlist

    def _get_sorted_windows(self, session: PlaybackSession) -> list[WindowReference]:
        """获取排序后的窗口列表"""
        # 只选择已准备好的窗口
        ready_windows = [
            window
            for window in session.windows.values()
            if window.ready and window.window_id in session.loaded_windows
        ]

        # 按窗口ID排序
        return sorted(ready_windows, key=lambda w: w.window_id)

    async def _generate_precomputed_segments(
        self, session: PlaybackSession
    ) -> list[PlaylistSegment]:
        """基于预计算生成播放列表片段"""
        segments: list[PlaylistSegment] = []
        current_time = int(time.time())

        # 如果没有视频时长，无法生成完整播放列表
        if session.duration is None:
            logger.warning(
                f"会话 {session.session_id} 缺少视频时长信息，回退到基于窗口的生成"
            )
            sorted_windows = self._get_sorted_windows(session)
            return await self._generate_segments_from_windows(sorted_windows)

        # 预计算所有分片
        precomputed_segments = self._precompute_all_segments(session)

        sequence_number = 0
        prev_window_id = None

        for precomp_segment in precomputed_segments:
            # 检查是否需要不连续标记（只有非相邻窗口才需要）
            needs_discontinuity = (
                prev_window_id is not None
                and precomp_segment.window_id != prev_window_id
                and precomp_segment.window_id
                != prev_window_id + 1  # 相邻窗口不需要DISCONTINUITY
            )

            # 生成完整的分片URL
            segment_url = f"/api/v1/jit/hls/{session.asset_hash}/{session.profile_hash}/{precomp_segment.window_id:06d}/{precomp_segment.url}?ts={current_time}"

            # 检查分片是否可用（所属窗口是否已转码）
            is_available = precomp_segment.window_id in session.loaded_windows

            segment = PlaylistSegment(
                url=segment_url,
                duration=precomp_segment.duration,
                sequence_number=sequence_number,
                window_id=precomp_segment.window_id,
                discontinuity_before=needs_discontinuity,
                available=is_available,
            )

            segments.append(segment)
            sequence_number += 1  # noqa: SIM113
            prev_window_id = precomp_segment.window_id

        logger.info(
            f"会话 {session.session_id} 预计算生成 {len(segments)} 个片段，"
            f"可用片段: {sum(1 for s in segments if s.available)}"
        )

        return segments

    def _precompute_all_segments(
        self, session: PlaybackSession
    ) -> list[PrecomputedSegment]:
        """预计算视频的所有分片结构"""
        segments = []
        current_time = 0.0
        sequence_number = 0

        hls_time = session.profile.hls_time
        window_duration = session.profile.window_duration
        total_duration = session.duration

        # 确保total_duration不为None
        if total_duration is None:
            raise ValueError(f"会话 {session.session_id} 缺少视频时长信息")

        while current_time < total_duration:
            # 计算当前分片所属的窗口ID
            window_id = int(current_time // window_duration)

            # 计算窗口内分片索引
            window_start_time = window_id * window_duration
            segment_in_window = int((current_time - window_start_time) / hls_time)

            # 计算分片时长（处理最后一个分片）
            remaining_time = total_duration - current_time
            segment_duration = min(hls_time, remaining_time)

            # 创建预计算分片
            segment = PrecomputedSegment(
                segment_index=segment_in_window,
                window_id=window_id,
                start_time=current_time,
                duration=segment_duration,
                sequence_number=sequence_number,
            )

            segments.append(segment)
            current_time += segment_duration
            sequence_number += 1

        logger.debug(f"预计算生成 {len(segments)} 个分片，覆盖 {total_duration:.1f}s")
        return segments

    async def _generate_segments_from_windows(
        self, windows: list[WindowReference]
    ) -> list[PlaylistSegment]:
        """基于已转码窗口生成播放列表片段（回退方法）"""
        segments: list[PlaylistSegment] = []
        sequence_number = 0

        for i, window in enumerate(windows):
            # 加载窗口的片段信息
            window_segments = await self._load_window_segments(window)
            if not window_segments:
                logger.warning(f"窗口 {window.window_id} 没有可用的片段")
                continue

            # 检查是否需要不连续标记
            needs_discontinuity = self._needs_discontinuity_marker(i, windows)

            # 添加窗口片段到播放列表
            for j, (segment_url, duration) in enumerate(window_segments):
                segment = PlaylistSegment(
                    url=segment_url,
                    duration=duration,
                    sequence_number=sequence_number,
                    window_id=window.window_id,
                    discontinuity_before=(j == 0 and needs_discontinuity),
                    available=True,  # 从窗口加载的片段都是可用的
                )
                segments.append(segment)
                sequence_number += 1

        return segments

    async def _load_window_segments(
        self, window: WindowReference
    ) -> list[tuple[str, float]]:
        """加载窗口的片段信息"""
        try:
            # 获取窗口缓存路径
            cache_path = get_cache_path(
                self.jit_transcoder.cache_root,
                window.asset_hash,
                window.profile_hash,
                window.window_id,
            )

            # 读取窗口的m3u8文件
            playlist_path = cache_path / "index.m3u8"
            if not playlist_path.exists():
                logger.error(
                    f"窗口 {window.window_id} 的播放列表文件不存在: {playlist_path}"
                )
                return []

            segments = []
            async with aiofiles.open(playlist_path, encoding="utf-8") as f:
                content = await f.read()
                lines = [line.strip() for line in content.splitlines()]

            # 解析m3u8文件
            i = 0
            while i < len(lines):
                line = lines[i]

                # 查找EXTINF行
                if line.startswith("#EXTINF:"):
                    try:
                        # 解析时长
                        duration_str = line.split(":")[1].split(",")[0]
                        duration = float(duration_str)

                        # 验证时长有效性，避免0.0或负值
                        if duration <= 0.0:
                            # 使用窗口的默认分段时长作为回退
                            duration = window.duration / 10  # 假设窗口有10个分段
                            if duration <= 0.0:
                                duration = 4.0  # 最后的回退值
                            logger.warning(
                                f"窗口 {window.window_id} 片段时长无效 ({duration_str})，"
                                f"使用回退值: {duration:.1f}s"
                            )

                        # 下一行应该是片段文件名
                        if i + 1 < len(lines):
                            segment_file = lines[i + 1].strip()
                            if segment_file and not segment_file.startswith("#"):
                                # 构建完整的片段URL
                                segment_url = f"/api/v1/jit/hls/{window.asset_hash}/{window.profile_hash}/{window.window_id:06d}/{segment_file}"
                                segments.append((segment_url, duration))
                                i += 2  # 跳过片段文件行
                                continue
                    except (IndexError, ValueError) as e:
                        logger.warning(f"解析片段信息失败: {line}, 错误: {e}")

                i += 1

            logger.debug(f"窗口 {window.window_id} 加载了 {len(segments)} 个片段")
            return segments

        except Exception as e:
            logger.error(f"加载窗口 {window.window_id} 片段失败: {e}")
            return []

    def _needs_discontinuity_marker(
        self, window_index: int, windows: list[WindowReference]
    ) -> bool:
        """检查是否需要不连续标记

        关键修复：相邻窗口不需要DISCONTINUITY标记，只有在窗口不连续时才需要
        """
        # 第一个窗口不需要不连续标记
        if window_index == 0:
            return False

        current_window = windows[window_index]
        previous_window = windows[window_index - 1]

        # 相邻窗口（window_id 连续）不需要DISCONTINUITY标记
        # 这是关键修复：让HLS播放器认为相邻窗口的媒体是连续的
        if current_window.window_id == previous_window.window_id + 1:
            logger.debug(
                f"窗口 {current_window.window_id} 是相邻窗口，不需要不连续标记"
            )
            return False

        # 只有在窗口ID不连续时才需要DISCONTINUITY标记
        if current_window.window_id != previous_window.window_id + 1:
            logger.debug(
                f"窗口 {current_window.window_id} 不连续 (从 {previous_window.window_id} 跳跃)，需要不连续标记"
            )
            return True

        # 检查时间是否连续
        time_gap = abs(current_window.start_time - previous_window.end_time)

        # 如果时间间隙超过0.1秒，认为需要不连续标记
        if time_gap > 0.1:
            logger.debug(
                f"窗口 {current_window.window_id} 需要不连续标记 "
                f"(时间间隙: {time_gap:.2f}s)"
            )
            return True

        # 检查编码参数是否一致
        if (
            current_window.asset_hash != previous_window.asset_hash
            or current_window.profile_hash != previous_window.profile_hash
        ):
            logger.debug(
                f"窗口 {current_window.window_id} 需要不连续标记 (编码参数不同)"
            )
            return True

        return False

    async def update_playlist_for_seek(
        self, session: PlaybackSession, seek_time: float
    ) -> SessionPlaylist | None:
        """
        为seek操作更新播放列表

        Args:
            session: 播放会话
            seek_time: 目标时间

        Returns:
            更新后的播放列表，如果无需更新则返回None
        """
        # 更新会话的当前时间
        old_current_time = session.current_time
        session.current_time = seek_time

        # 检查是否跨窗口
        old_window = int(old_current_time // session.profile.window_duration)
        new_window = int(seek_time // session.profile.window_duration)

        if old_window != new_window:
            logger.info(
                f"会话 {session.session_id} seek跨窗口: {old_window} -> {new_window}"
            )

            # 标记需要重建播放列表
            session.playlist_dirty = True

            # 清理不再需要的旧窗口
            cleaned_windows = session.cleanup_old_windows()
            if cleaned_windows:
                logger.debug(
                    f"清理了 {len(cleaned_windows)} 个旧窗口: {cleaned_windows}"
                )

            # 重新生成播放列表
            return await self.generate_playlist(session)

        return None

    async def update_segment_availability(self, session: PlaybackSession) -> bool:
        """更新播放列表中分片的可用状态

        Args:
            session: 播放会话

        Returns:
            是否有分片状态发生变化
        """
        if session.playlist is None or not session.playlist.segments:
            return False

        changed = False
        for segment in session.playlist.segments:
            # 检查分片所属窗口是否已加载
            new_availability = segment.window_id in session.loaded_windows

            if segment.available != new_availability:
                segment.available = new_availability
                changed = True

        if changed:
            logger.debug(
                f"会话 {session.session_id} 分片可用性更新完成，"
                f"可用分片: {sum(1 for s in session.playlist.segments if s.available)}"
            )

        return changed

    def get_playlist_url(self, session_id: str) -> str:
        """获取会话播放列表URL"""
        return f"/api/v1/session/{session_id}/playlist.m3u8"

    async def validate_playlist(self, playlist: SessionPlaylist) -> bool:
        """验证播放列表的有效性"""
        if not playlist.segments:
            return False

        # 检查片段连续性
        for i in range(1, len(playlist.segments)):
            current_segment = playlist.segments[i]
            previous_segment = playlist.segments[i - 1]

            # 如果不是同一个窗口，应该有不连续标记或者窗口是相邻的
            if (
                current_segment.window_id != previous_segment.window_id
                and not current_segment.discontinuity_before
                and abs(current_segment.window_id - previous_segment.window_id) > 1
            ):
                logger.warning(
                    f"播放列表片段不连续: "
                    f"片段 {previous_segment.sequence_number} -> {current_segment.sequence_number}"
                )
                return False

        return True

    async def _generate_hybrid_segments(
        self, session: PlaybackSession
    ) -> list[PlaylistSegment]:
        """
        生成混合模式播放列表片段
        结合视频窗口（仅视频）和独立音频轨道
        """
        if not self.audio_preprocessor:
            logger.warning("混合模式需要音频预处理器，回退到传统模式")
            return await self._generate_precomputed_segments(session)

        if not session.is_audio_ready():
            logger.warning(
                f"会话 {session.session_id} 音频轨道未就绪，等待音频处理完成"
            )
            # 可以返回空列表或者部分视频片段
            return []

        segments: list[PlaylistSegment] = []
        current_time = int(time.time())

        # 如果没有视频时长，无法生成完整播放列表
        if session.duration is None:
            logger.warning(
                f"会话 {session.session_id} 缺少视频时长信息，无法生成混合播放列表"
            )
            return []

        # 预计算所有分片，基于视频窗口结构
        precomputed_segments = self._precompute_all_segments(session)

        sequence_number = 0
        prev_window_id = None

        for precomp_segment in precomputed_segments:
            # 检查是否需要不连续标记（相邻窗口不需要）
            needs_discontinuity = (
                prev_window_id is not None
                and precomp_segment.window_id != prev_window_id
                and precomp_segment.window_id != prev_window_id + 1
            )

            # 混合模式：视频使用窗口转码，音频使用独立轨道
            # 这里生成的是视频片段URL，音频会通过单独的轨道处理
            video_segment_url = f"/api/v1/jit/hls/{session.asset_hash}/{session.profile_hash}/{precomp_segment.window_id:06d}/{precomp_segment.url}?ts={current_time}"

            # 在混合模式下，我们需要生成包含音频信息的特殊播放列表
            # 这可能需要生成多轨道的HLS或者使用分离的音频轨道
            # 目前先使用视频片段，音频轨道将通过其他方式处理

            # 检查视频片段是否可用
            is_available = precomp_segment.window_id in session.loaded_windows

            segment = PlaylistSegment(
                url=video_segment_url,
                duration=precomp_segment.duration,
                sequence_number=sequence_number,
                window_id=precomp_segment.window_id,
                discontinuity_before=needs_discontinuity,
                available=is_available,
            )

            segments.append(segment)
            sequence_number += 1
            prev_window_id = precomp_segment.window_id

        logger.info(
            f"会话 {session.session_id} 混合模式生成 {len(segments)} 个视频片段，"
            f"可用片段: {sum(1 for s in segments if s.available)}"
        )

        return segments

    # async def _ensure_audio_track_for_session(self, session: PlaybackSession) -> bool:
    #     """
    #     确保会话的音频轨道已准备就绪
    #     """
    #     if not session.hybrid_mode or not self.audio_preprocessor:
    #         return True

    #     if session.audio_track_ready:
    #         return True

    #     try:
    #         # 启动音频轨道处理
    #         audio_track_id = await self.audio_preprocessor.ensure_audio_track(
    #             session.file_path, session.audio_profile
    #         )

    #         if audio_track_id:
    #             session.enable_hybrid_mode(audio_track_id)
    #             session.set_audio_track_ready(True)
    #             logger.info(
    #                 f"会话 {session.session_id} 音频轨道已准备: {audio_track_id}"
    #             )
    #             return True

    #     except Exception as e:
    #         logger.error(f"音频轨道处理失败: {e}")

    #     return False
