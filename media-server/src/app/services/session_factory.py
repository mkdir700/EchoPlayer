"""
会话工厂
专门负责会话的创建，确保配置的一致性和完整性
"""

import json
import logging
import time
from pathlib import Path

from app.config import ConfigManager
from app.models.audio_track import AudioTrackProfile
from app.models.session import PlaybackSession
from app.services.audio_preprocessor import AudioPreprocessor
from app.services.profile_builder import ProfileBuilder
from app.utils.hash import calculate_asset_hash, calculate_profile_hash

logger = logging.getLogger(__name__)


class SessionFactory:
    """会话工厂"""

    def __init__(self, audio_preprocessor: AudioPreprocessor | None = None):
        """
        初始化会话工厂

        Args:
            audio_preprocessor: 音频预处理器（可选）
        """
        self.audio_preprocessor = audio_preprocessor
        self.profile_builder = ProfileBuilder()

    async def create_session(
        self,
        file_path: Path,
        quality: str = "720p",
        initial_time: float = 0.0,
        enable_hybrid: bool | None = None,
        video_only: bool = False,
        progress_callback=None,
    ) -> PlaybackSession:
        """
        创建新的播放会话

        Args:
            file_path: 视频文件路径
            quality: 质量档位
            initial_time: 初始播放时间
            enable_hybrid: 是否启用混合模式（None=自动检测）
            video_only: 是否只转码视频
            progress_callback: 进度回调函数 (percent: float, stage: str) -> None

        Returns:
            PlaybackSession: 创建的会话

        Raises:
            FileNotFoundError: 文件不存在
            ValueError: 配置参数无效
        """
        if not file_path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")

        logger.info(f"创建会话: {file_path}, 质量={quality}, 初始时间={initial_time}s")

        # 1. 决定是否启用混合模式
        if enable_hybrid is None:
            enable_hybrid = await self.profile_builder.should_enable_hybrid_mode(
                file_path
            )

        # 2. 预处理音频（如果启用混合模式）
        audio_track_id = None
        if enable_hybrid and self.audio_preprocessor:
            try:
                # 创建音频配置用于预处理
                audio_profile = self._create_audio_profile()
                audio_track_id = await self.audio_preprocessor.ensure_audio_track(
                    file_path,
                    audio_profile,
                    progress_callback=progress_callback,
                )
                if not audio_track_id:
                    logger.warning("音频预处理失败，禁用混合模式")
                    enable_hybrid = False
            except Exception as e:
                logger.error(f"音频预处理出错: {e}")
                enable_hybrid = False

        # 3. 构建最终的转码配置（不可变）
        profile = await self.profile_builder.build_profile(
            file_path=file_path,
            quality=quality,
            enable_hybrid_mode=enable_hybrid,
            video_only=video_only,
        )

        # 4. 计算哈希值（一次性计算，永不改变）
        asset_hash = calculate_asset_hash(file_path)
        profile_hash = calculate_profile_hash(profile.__dict__, profile.version)

        # 5. 获取视频时长
        duration = await self._get_video_duration(file_path)

        # 6. 创建会话（配置不可变）
        session = PlaybackSession(
            file_path=file_path,
            asset_hash=asset_hash,
            profile=profile,
            profile_hash=profile_hash,
            current_time=initial_time,
            duration=duration,
            expires_at=time.time() + 3600,  # 默认1小时超时
        )

        # 7. 如果启用混合模式，设置音频信息
        if enable_hybrid and audio_track_id:
            session.enable_hybrid_mode(audio_track_id)
            session.set_audio_track_ready(True)

        logger.info(
            f"会话创建完成: {session.session_id}, "
            f"资产={asset_hash}, 配置={profile_hash}, "
            f"混合模式={enable_hybrid}, 音频轨道={audio_track_id}"
        )

        return session

    def _create_audio_profile(self) -> AudioTrackProfile:
        """创建音频轨道配置"""

        config_manager = ConfigManager()
        return AudioTrackProfile.from_config(config_manager.audio)

    async def _get_video_duration(self, file_path: Path) -> float | None:
        """获取视频文件时长"""
        try:
            config_manager = ConfigManager()
            cmd = [
                config_manager.transcode.ffprobe_executable,
                "-v",
                "quiet",
                "-show_entries",
                "format=duration",
                "-of",
                "json",
                str(file_path),
            ]

            import asyncio

            process = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.error(f"ffprobe获取视频时长失败: {stderr.decode()}")
                return None

            result = json.loads(stdout.decode())
            duration = float(result["format"]["duration"])
            logger.debug(f"视频 {file_path} 时长: {duration:.1f}s")
            return duration

        except Exception as e:
            logger.error(f"获取视频时长失败: {e}")
            return None

    def get_supported_qualities(self) -> list[str]:
        """获取支持的质量档位"""
        return self.profile_builder.get_available_qualities()
