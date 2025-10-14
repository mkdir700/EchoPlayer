"""
配置管理器
负责加载、验证和管理所有配置，基于 Pydantic-Settings
"""

import logging
import tempfile
from pathlib import Path
from typing import Literal, overload

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from .schemas import (
    AudioConfig,
    CacheConfig,
    HLSConfig,
    HttpConfig,
    QualityConfig,
    TranscodeConfig,
    VideoConfig,
)

logger = logging.getLogger(__name__)


class AppSettings(BaseSettings):
    """应用程序设置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="ignore",
    )

    # 服务配置
    host: str = Field(default="127.0.0.1", description="服务主机地址")
    port: int = Field(default=8799, gt=0, le=65535, description="服务端口")
    debug: bool = Field(default=False, description="调试模式")

    # 路径配置
    sessions_root: str = Field(
        default_factory=lambda: str(
            Path(tempfile.gettempdir()) / "echoplayer-transcoder" / "sessions"
        ),
        description="会话缓存根目录",
    )
    hls_segment_cache_root: str = Field(
        default_factory=lambda: str(
            Path(__file__).parent.parent.parent.parent / "cache" / "hls_segments"
        ),
        description="HLS 分片缓存根目录",
    )
    audio_cache_root: str = Field(
        default_factory=lambda: str(
            Path(__file__).parent.parent.parent.parent / "cache" / "audio_tracks"
        ),
        description="音频轨道缓存根目录",
    )

    # HLS 配置
    hls_time: float = Field(default=4, gt=0, description="HLS分片时长")
    hls_list_size: int = Field(default=3, ge=1, description="HLS播放列表大小")
    gop_seconds: float = Field(default=4, gt=0, description="GOP时长")

    # 并发控制
    max_concurrent: int = Field(default=3, ge=1, description="最大并发转码数")
    session_ttl: int = Field(default=120, gt=0, description="会话TTL（秒）")

    # FFmpeg 配置
    ffmpeg_path: str = Field(default="ffmpeg", description="FFmpeg可执行文件路径")
    ffprobe_path: str = Field(default="ffprobe", description="FFprobe可执行文件路径")
    prefer_hw: bool = Field(default=True, description="优先使用硬件加速")

    # 性能配置
    seek_buffer: float = Field(default=0.5, ge=0, description="seek前置缓冲时间")
    session_reuse_tolerance: float = Field(
        default=30.0, ge=0, description="会话复用容差时间"
    )
    cleanup_interval: int = Field(default=30, gt=0, description="清理检查间隔")

    # 混合转码配置
    enable_hybrid_mode: bool = Field(default=True, description="启用混合转码模式")
    audio_preprocessor_concurrent: int = Field(
        default=2, ge=1, description="音频预处理器并发数"
    )
    audio_track_ttl_hours: int = Field(
        default=48, gt=0, description="音频轨道TTL（小时）"
    )

    # 预加载配置
    preload_previous_windows: int = Field(
        default=1, ge=0, description="预加载前N个窗口数量"
    )

    @field_validator("sessions_root", "hls_segment_cache_root", "audio_cache_root")
    @classmethod
    def validate_paths(cls, v: str) -> str:
        """验证路径配置"""
        path = Path(v)
        path.mkdir(parents=True, exist_ok=True)
        return str(path.absolute())


class ConfigManager:
    """配置管理器"""

    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):  # noqa: ARG004
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, config_dir: str | Path | None = None):
        if self._initialized:
            return

        self.config_dir = Path(config_dir or self._get_default_config_dir())
        self.config_dir.mkdir(parents=True, exist_ok=True)

        # 加载主配置
        self.app_settings = AppSettings()

        # 组件配置缓存
        self._video_config: VideoConfig
        self._audio_config: AudioConfig
        self._hls_config: HLSConfig
        self._cache_config: CacheConfig
        self._http_config: HttpConfig
        self._transcode_config: TranscodeConfig
        self._quality_configs: dict[str, QualityConfig]

        self._load_all_configs()
        self._initialized = True

    def _get_default_config_dir(self) -> Path:
        """获取默认配置目录"""
        return Path(__file__).parent.parent.parent.parent / "config"

    def _load_all_configs(self) -> None:
        """从主配置生成组件配置"""
        try:
            # 从主配置生成组件配置
            self._video_config = self._create_video_config()
            self._audio_config = self._create_audio_config()
            self._hls_config = self._create_hls_config()
            self._cache_config = self._create_cache_config()
            self._http_config = self._create_http_config()
            self._transcode_config = self._create_transcode_config()
            self._quality_configs = self._create_quality_configs()

            logger.info("配置加载完成")

        except Exception as e:
            logger.error(f"配置加载失败: {e}")
            # 使用默认配置
            self._load_fallback_configs()

    # 配置创建方法
    def _create_video_config(self) -> VideoConfig:
        """从主配置创建视频配置"""
        return VideoConfig()

    def _create_audio_config(self) -> AudioConfig:
        """从主配置创建音频配置"""
        return AudioConfig()

    def _create_hls_config(self) -> HLSConfig:
        """从主配置创建HLS配置"""
        return HLSConfig(
            time=self.app_settings.hls_time,
            list_size=self.app_settings.hls_list_size,
        )

    def _create_cache_config(self) -> CacheConfig:
        """从主配置创建缓存配置"""
        return CacheConfig(
            sessions_root=self.app_settings.sessions_root,
            hls_segment_cache_root=self.app_settings.hls_segment_cache_root,
            audio_cache_root=self.app_settings.audio_cache_root,
            session_ttl=self.app_settings.session_ttl,
            audio_track_ttl_hours=self.app_settings.audio_track_ttl_hours,
            cleanup_interval=self.app_settings.cleanup_interval,
        )

    def _create_http_config(self) -> HttpConfig:
        """从主配置创建HTTP配置"""
        return HttpConfig()

    def _create_transcode_config(self) -> TranscodeConfig:
        """从主配置创建转码配置"""
        return TranscodeConfig(
            ffmpeg_executable=self.app_settings.ffmpeg_path,
            ffprobe_executable=self.app_settings.ffprobe_path,
            prefer_hw=self.app_settings.prefer_hw,
            max_concurrent=self.app_settings.max_concurrent,
            audio_preprocessor_concurrent=self.app_settings.audio_preprocessor_concurrent,
            seek_buffer=self.app_settings.seek_buffer,
            session_reuse_tolerance=self.app_settings.session_reuse_tolerance,
            enable_hybrid_mode=self.app_settings.enable_hybrid_mode,
        )

    def _create_quality_configs(self) -> dict[str, QualityConfig]:
        """创建质量档位配置"""
        return {
            "480p": QualityConfig(
                name="480p",
                video_bitrate="1000k",
                audio_bitrate="128k",
                gop_size=48,
                keyint_min=48,
                crf=25,
            ),
            "720p": QualityConfig(
                name="720p",
                video_bitrate="2000k",
                audio_bitrate="192k",
                gop_size=96,
                keyint_min=96,
                crf=23,
            ),
            "1080p": QualityConfig(
                name="1080p",
                video_bitrate="4000k",
                audio_bitrate="256k",
                resolution="1920x1080",
                gop_size=144,
                keyint_min=144,
                crf=21,
            ),
        }

    def _load_fallback_configs(self) -> None:
        """加载回退配置"""
        logger.warning("使用回退默认配置")
        self._video_config = VideoConfig()
        self._audio_config = AudioConfig()
        self._hls_config = HLSConfig()
        self._cache_config = CacheConfig()
        self._http_config = HttpConfig()
        self._transcode_config = TranscodeConfig()
        self._quality_configs = self._create_quality_configs()

    # 公共访问方法
    @property
    def video(self) -> VideoConfig:
        """获取视频配置"""
        return self._video_config or VideoConfig()

    @property
    def audio(self) -> AudioConfig:
        """获取音频配置"""
        return self._audio_config or AudioConfig()

    @property
    def hls(self) -> HLSConfig:
        """获取HLS配置"""
        return self._hls_config or HLSConfig()

    @property
    def cache(self) -> CacheConfig:
        """获取缓存配置"""
        return self._cache_config or CacheConfig()

    @property
    def http(self) -> HttpConfig:
        """获取HTTP配置"""
        return self._http_config or HttpConfig()

    @property
    def transcode(self) -> TranscodeConfig:
        """获取转码配置"""
        return self._transcode_config or TranscodeConfig()

    @overload
    def get_quality_config(
        self, quality: Literal["480p", "720p", "1080p"]
    ) -> QualityConfig: ...

    @overload
    def get_quality_config(self, quality: str) -> QualityConfig | None: ...

    def get_quality_config(self, quality: str) -> QualityConfig | None:
        """获取质量档位配置"""
        return self._quality_configs.get(quality)

    def get_available_qualities(self) -> list[str]:
        """获取可用的质量档位"""
        if not self._quality_configs:
            return ["480p", "720p", "1080p"]
        return list(self._quality_configs.keys())

    def reload_configs(self) -> None:
        """重新加载配置"""
        logger.info("重新加载配置...")
        self._load_all_configs()


# 全局配置管理器实例
config_manager = ConfigManager()
