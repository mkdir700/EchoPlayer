"""
配置数据模型
定义各种配置的数据结构，基于 Pydantic
"""

from typing import Any

from pydantic import BaseModel, Field


class VideoConfig(BaseModel):
    """视频配置"""

    codec: str = Field(default="libx264", description="视频编码器")
    preset: str = Field(default="fast", description="编码预设")
    profile: str = Field(default="high", description="编码配置文件")
    level: str = Field(default="4.1", description="编码级别")
    pix_fmt: str = Field(default="yuv420p", description="像素格式")

    # GOP配置
    gop_seconds: float = Field(default=4, gt=0, description="GOP时长（秒）")
    keyint_min_factor: float = Field(
        default=1.0, ge=0, description="最小关键帧间隔因子"
    )

    # 率控制
    crf: int = Field(default=23, ge=0, le=51, description="恒定质量因子")
    max_bitrate_factor: float = Field(default=4, gt=0, description="最大码率因子")

    class Config:
        extra = "forbid"


class AudioConfig(BaseModel):
    """音频配置"""

    codec: str = Field(default="aac", description="音频编码器")
    profile: str = Field(default="aac_low", description="AAC配置文件")
    sample_rate: int = Field(default=48000, gt=0, description="采样率")
    channels: int = Field(default=2, ge=1, le=8, description="声道数")
    bitrate: str = Field(default="192k", description="音频码率")

    # 混合模式专用
    segment_duration: float = Field(default=4.0, gt=0, description="分片时长（秒）")
    enable_volume_normalization: bool = Field(
        default=False, description="启用音量标准化"
    )

    class Config:
        extra = "forbid"


class QualityConfig(BaseModel):
    """质量档位配置"""

    name: str = Field(description="质量档位名称")
    video_bitrate: str = Field(description="视频码率")
    audio_bitrate: str = Field(default="192k", description="音频码率")
    resolution: str | None = Field(
        default=None, description="分辨率，如1920x1080，None表示保持原分辨率"
    )

    # 视频特定参数
    gop_size: int | None = Field(default=None, ge=1, description="GOP大小")
    keyint_min: int | None = Field(default=None, ge=1, description="最小关键帧间隔")
    crf: int | None = Field(default=None, ge=0, le=51, description="恒定质量因子")

    # 其他选项
    extra_args: dict[str, Any] = Field(default_factory=dict, description="额外参数")

    class Config:
        extra = "forbid"


class HLSConfig(BaseModel):
    """HLS配置"""

    time: float = Field(default=4, gt=0, description="分片时长（秒）")
    list_size: int = Field(default=3, ge=1, description="播放器缓冲片段数")
    wrap: int = Field(default=0, ge=0, description="包装模式，0=无限制")
    allow_cache: bool = Field(default=False, description="是否允许缓存")

    # 混合模式
    master_playlist_name: str = Field(
        default="playlist.m3u8", description="主播放列表文件名"
    )
    video_playlist_name: str = Field(
        default="video.m3u8", description="视频播放列表文件名"
    )
    audio_playlist_name: str = Field(
        default="playlist.m3u8", description="音频播放列表文件名"
    )

    class Config:
        extra = "forbid"


class CacheConfig(BaseModel):
    """缓存配置"""

    # 路径配置
    sessions_root: str = Field(default="", description="会话缓存根目录")
    hls_segment_cache_root: str = Field(default="", description="HLS 分片缓存根目录")
    audio_cache_root: str = Field(default="", description="音频轨道缓存根目录")

    # 文件命名模式
    video_segment_pattern: str = Field(
        default="seg_{index:05d}.ts", description="视频分片文件名模式"
    )
    audio_segment_pattern: str = Field(
        default="audio_seg_{index:05d}.aac", description="音频分片文件名模式"
    )
    audio_track_filename: str = Field(
        default="audio_track.aac", description="音频轨道文件名"
    )
    metadata_filename: str = Field(
        default="audio_track.meta.json", description="元数据文件名"
    )

    # TTL配置
    session_ttl: int = Field(default=120, gt=0, description="会话TTL（秒）")
    audio_track_ttl_hours: int = Field(
        default=48, gt=0, description="音频轨道TTL（小时）"
    )

    # 清理配置
    cleanup_interval: int = Field(default=30, gt=0, description="清理检查间隔（秒）")

    class Config:
        extra = "forbid"


class HttpConfig(BaseModel):
    """HTTP响应配置"""

    # CORS配置
    allow_origins: list[str] = Field(default=["*"], description="允许的来源")
    allow_methods: list[str] = Field(
        default=["GET", "POST", "PUT", "DELETE"], description="允许的HTTP方法"
    )
    allow_headers: list[str] = Field(default=["*"], description="允许的请求头")

    # 缓存策略
    no_cache_headers: dict[str, str] = Field(
        default={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
        description="无缓存响应头",
    )

    static_cache_headers: dict[str, str] = Field(
        default={"Cache-Control": "public, max-age=3600"},
        description="静态资源缓存响应头",
    )

    # 媒体类型
    media_types: dict[str, str] = Field(
        default={
            "m3u8": "application/vnd.apple.mpegurl",
            "ts": "video/mp2t",
            "aac": "audio/aac",
            "mp4": "video/mp4",
        },
        description="媒体类型映射",
    )

    class Config:
        extra = "forbid"


class TranscodeConfig(BaseModel):
    """转码配置"""

    # FFmpeg配置
    ffmpeg_executable: str = Field(default="ffmpeg", description="FFmpeg可执行文件路径")
    ffprobe_executable: str = Field(
        default="ffprobe", description="FFprobe可执行文件路径"
    )

    # 硬件加速
    prefer_hw: bool = Field(default=True, description="优先使用硬件加速")
    hw_accel_priority: list[str] = Field(
        default=["videotoolbox", "nvenc", "vaapi", "qsv"], description="硬件加速优先级"
    )

    # 并发控制
    max_concurrent: int = Field(default=3, ge=1, description="最大并发转码数")
    audio_preprocessor_concurrent: int = Field(
        default=2, ge=1, description="音频预处理器并发数"
    )

    # 性能配置
    seek_buffer: float = Field(default=0.5, ge=0, description="seek前置缓冲时间（秒）")
    session_reuse_tolerance: float = Field(
        default=30.0, ge=0, description="会话复用容差时间（秒）"
    )

    # 混合模式
    enable_hybrid_mode: bool = Field(default=True, description="启用混合转码模式")
    hybrid_mode_threshold_mb: int = Field(
        default=100, gt=0, description="混合模式文件大小阈值（MB）"
    )

    # 窗口配置
    window_duration: float = Field(default=12.0, gt=0, description="窗口时长（秒）")
    window_segments: int = Field(default=3, ge=1, description="每窗口分片数")

    # 预加载配置
    preload_previous_windows: int = Field(
        default=1, ge=0, description="预加载前N个窗口数量"
    )

    class Config:
        extra = "forbid"
