"""
转码配置构建器
负责根据文件特性和需求构建最优的转码配置
"""

import logging
from pathlib import Path

from app.config import ConfigManager
from app.models.window import TranscodeProfile

logger = logging.getLogger(__name__)


class ProfileBuilder:
    """转码配置构建器"""

    def __init__(self):
        """初始化构建器"""
        self.config = ConfigManager()

    async def build_profile(
        self,
        file_path: Path,
        quality: str = "720p",
        enable_hybrid_mode: bool = False,
        video_only: bool = False,
    ) -> TranscodeProfile:
        """
        构建转码配置

        Args:
            file_path: 输入文件路径
            quality: 质量档位 (480p, 720p, 1080p)
            enable_hybrid_mode: 是否启用混合模式
            video_only: 是否只转码视频

        Returns:
            TranscodeProfile: 不可变的转码配置
        """
        logger.debug(
            f"构建转码配置: {file_path}, 质量={quality}, 混合模式={enable_hybrid_mode}"
        )

        # 基础配置
        base_config = {
            "hybrid_mode": enable_hybrid_mode,
            "video_only": video_only,
            "version": "1",
        }

        # 根据质量档位设置视频参数
        video_config = self._get_video_config(quality)
        base_config.update(video_config)

        # 音频配置（仅在非纯视频模式下）
        if not video_only:
            audio_config = self._get_audio_config()
            base_config.update(audio_config)

        # HLS配置
        hls_config = self._get_hls_config()
        base_config.update(hls_config)

        # 窗口配置
        window_config = self._get_window_config()
        base_config.update(window_config)

        # 创建不可变配置
        profile = TranscodeProfile(**base_config)

        logger.info(
            f"转码配置已构建: {quality}, 混合模式={enable_hybrid_mode}, "
            f"纯视频={video_only}, 版本={profile.version}"
        )

        return profile

    def _get_video_config(self, quality: str) -> dict:
        """获取视频配置"""
        # 从配置管理器获取质量档位配置
        quality_config = self.config.get_quality_config(quality)
        if not quality_config:
            logger.warning(f"未找到质量档位配置: {quality}，使用默认720p")
            quality_config = self.config.get_quality_config("720p")

        video_config = self.config.video

        # 基础视频设置
        config = {
            "video_codec": video_config.codec,
            "video_preset": video_config.preset,
            "pixel_format": video_config.pix_fmt,
            "sc_threshold": 0,
            "video_bitrate": quality_config.video_bitrate,
        }

        # 添加质量特定参数
        if quality_config.gop_size:
            config["gop_size"] = quality_config.gop_size
        if quality_config.keyint_min:
            config["keyint_min"] = quality_config.keyint_min
        if quality_config.crf:
            config["crf"] = quality_config.crf

        return config

    def _get_audio_config(self) -> dict:
        """获取音频配置"""
        audio_config = self.config.audio
        return {
            "audio_codec": audio_config.codec,
            "audio_bitrate": audio_config.bitrate,
            "audio_sample_rate": audio_config.sample_rate,
            "audio_channels": audio_config.channels,
            "aac_profile": audio_config.profile,
            "audio_filter": "aresample=async=1:first_pts=0",
        }

    def _get_hls_config(self) -> dict:
        """获取HLS配置"""
        hls_config = self.config.hls
        return {
            "hls_time": hls_config.time,
            "hls_list_size": hls_config.list_size,
            "hls_segment_type": "fmp4",
            "hls_fmp4_init_filename": "init.mp4",
            "hls_segment_filename": "seg_%05d.m4s",
        }

    def _get_window_config(self) -> dict:
        """获取窗口配置"""
        transcode_config = self.config.transcode
        return {
            "window_segments": transcode_config.window_segments,
            "window_duration": transcode_config.window_duration,
        }

    def _get_ffmpeg_config(self) -> dict:
        """获取FFmpeg配置"""
        return {
            "fflags": "+genpts",
            "avoid_negative_ts": "make_zero",
        }

    async def should_enable_hybrid_mode(self, file_path: Path) -> bool:
        """
        检测是否应该启用混合模式

        Args:
            file_path: 输入文件路径

        Returns:
            bool: 是否建议启用混合模式
        """
        if not self.config.transcode.enable_hybrid_mode:
            return False

        try:
            # 获取音频信息
            audio_info = await self._get_audio_info(file_path)
            if not audio_info:
                logger.info(f"文件 {file_path} 无音频轨道，建议禁用混合模式")
                return False

            # 检查音频编码格式是否适合预处理
            audio_codec = audio_info.get("codec_name", "").lower()

            # 适合预处理的音频格式
            suitable_codecs = {"aac", "mp3", "ac3", "eac3", "dts", "flac", "opus"}

            if audio_codec not in suitable_codecs:
                logger.info(f"音频编码 {audio_codec} 不适合预处理，建议禁用混合模式")
                return False

            # 检查文件大小（大文件更适合混合模式）
            file_size_mb = file_path.stat().st_size / (1024 * 1024)
            if file_size_mb < 100:  # 小于100MB的文件
                logger.info(f"文件大小 {file_size_mb:.1f}MB 较小，建议禁用混合模式")
                return False

            logger.info(
                f"文件 {file_path} 适合混合模式: 音频={audio_codec}, 大小={file_size_mb:.1f}MB"
            )
            return True

        except Exception as e:
            logger.error(f"混合模式检测失败: {e}")
            return False

    async def _get_audio_info(self, file_path: Path) -> dict | None:
        """获取音频流信息"""
        try:
            import asyncio
            import json

            cmd = [
                self.config.app_settings.ffprobe_path,
                "-v",
                "quiet",
                "-select_streams",
                "a:0",  # 选择第一个音频流
                "-show_entries",
                "stream=codec_name,sample_rate,channels,duration",
                "-of",
                "json",
                str(file_path),
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.debug(f"ffprobe获取音频信息失败: {stderr.decode()}")
                return None

            result = json.loads(stdout.decode())
            streams = result.get("streams", [])

            if not streams:
                return None

            audio_stream = streams[0]
            logger.debug(f"音频信息: {audio_stream}")
            return audio_stream

        except Exception as e:
            logger.error(f"获取音频信息失败: {e}")
            return None

    def get_available_qualities(self) -> list[str]:
        """获取支持的质量档位"""
        return ["480p", "720p", "1080p"]
