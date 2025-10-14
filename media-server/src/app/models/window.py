"""
窗口化转码数据模型
"""

import asyncio
import logging
import time
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class WindowStatus(str, Enum):
    """窗口状态"""

    PENDING = "pending"  # 等待转码
    RUNNING = "running"  # 转码中
    COMPLETED = "completed"  # 转码完成
    FAILED = "failed"  # 转码失败
    CACHED = "cached"  # 缓存命中


# ffmpeg -hide_banner -y -ss 0 -t 30 -i "/Users/mark/Movies/老友记/老友记.H265.1080P.SE01.01.mkv" \
#   -map 0:v:0 -map 0:a:0 \
#   -c:v libx264 -preset veryfast -pix_fmt yuv420p \
#   -g 48 -keyint_min 48 -sc_threshold 0 \
#   -c:a aac -profile:a aac_low -ar 48000 -ac 2 -b:a 192k \
#   -fflags +genpts -avoid_negative_ts make_zero \
#   -af "aresample=async=1:first_pts=0" \
#   -f hls -hls_time 4 -hls_list_size 0 \
#   -hls_segment_type fmp4 \
#   -hls_fmp4_init_filename "init.mp4" \
#   -hls_segment_filename   "seg_%05d.m4s" \
#   "index.m3u8"


class TranscodeProfile(BaseModel):
    """转码配置 - 不可变对象，确保hash一致性"""

    # 视频配置
    video_codec: str = Field(default="libx264", description="视频编码器")
    video_preset: str = Field(default="veryfast", description="编码预设")
    video_bitrate: str = Field(default="2000k", description="视频码率")
    pixel_format: str = Field(default="yuv420p", description="像素格式")
    gop_size: int = Field(default=96, ge=1, description="GOP大小 - 调整为4秒，确保12秒窗口边界对齐")
    keyint_min: int = Field(default=96, ge=1, description="最小关键帧间隔")
    sc_threshold: int = Field(default=0, ge=0, description="场景切换检测阈值")

    # 音频配置
    audio_codec: str = Field(default="aac", description="音频编码器")
    audio_bitrate: str = Field(default="192k", description="音频码率")
    audio_sample_rate: int = Field(default=48000, gt=0, description="采样率")
    audio_channels: int = Field(default=2, ge=1, le=8, description="音频声道数")
    aac_profile: str = Field(default="aac_low", description="AAC 配置文件")

    # 音频滤镜配置
    audio_filter: str = Field(default="aresample=async=1:first_pts=0", description="音频重采样滤镜")

    # FFmpeg 标志配置
    fflags: str = Field(default="+genpts", description="FFmpeg 标志")
    avoid_negative_ts: str = Field(default="make_zero", description="避免负时间戳")

    # HLS 配置
    hls_time: float = Field(default=4.0, gt=0, description="分片时长")
    hls_list_size: int = Field(default=0, ge=0, description="播放列表大小（0=无限制）")
    hls_segment_type: str = Field(default="fmp4", description="分片类型")
    hls_fmp4_init_filename: str = Field(default="init.mp4", description="fMP4 初始化文件名")
    hls_segment_filename: str = Field(default="seg_%05d.m4s", description="分片文件名模板")

    # 窗口配置
    window_segments: int = Field(default=3, ge=1, description="每窗口分片数（基于 hls_time * 3 = 12s）")
    window_duration: float = Field(default=12.0, gt=0, description="窗口时长（秒）")

    # 混合转码配置
    hybrid_mode: bool = Field(default=False, description="是否启用混合转码（分离音视频）")
    video_only: bool = Field(default=False, description="是否只转码视频")

    # 版本控制
    version: str = Field(default="1", description="配置版本")

    class Config:
        frozen = True  # 等效于 dataclass(frozen=True)


class WindowCache(BaseModel):
    """窗口缓存信息"""

    window_id: int = Field(description="窗口ID")
    asset_hash: str = Field(description="资产哈希")
    profile_hash: str = Field(description="配置哈希")
    cache_dir: Path = Field(description="缓存目录")
    playlist_path: Path = Field(description="m3u8 文件路径")
    created_at: float = Field(default_factory=time.time, description="创建时间")
    last_access: float = Field(default_factory=time.time, description="最后访问时间")
    hit_count: int = Field(default=0, ge=0, description="命中次数")
    file_size_bytes: int = Field(default=0, ge=0, description="文件总大小")

    # 转码信息（用于后台转码）
    input_file_path: str | None = Field(default=None, description="原始文件路径")
    start_time: float | None = Field(default=None, description="窗口开始时间")
    duration: float | None = Field(default=None, description="窗口持续时间")
    profile_config: dict | None = Field(default=None, description="转码配置")

    class Config:
        arbitrary_types_allowed = True

    def update_access(self) -> None:
        """更新访问时间"""
        self.last_access = time.time()
        self.hit_count += 1

    def is_valid(self) -> bool:
        """检查缓存是否有效"""
        return self.playlist_path.exists()

    def get_age_seconds(self) -> float:
        """获取缓存年龄（秒）"""
        return time.time() - self.created_at

    def get_idle_seconds(self) -> float:
        """获取空闲时间（秒）"""
        return time.time() - self.last_access


class TranscodeWindow(BaseModel):
    """转码窗口"""

    window_id: int = Field(description="窗口ID")
    asset_hash: str = Field(description="资产哈希")
    profile_hash: str = Field(description="配置哈希")
    input_file: Path = Field(description="输入文件")
    start_time: float = Field(ge=0, description="窗口开始时间（秒）")
    duration: float = Field(gt=0, description="窗口时长（秒）")
    output_dir: Path = Field(description="输出目录")
    status: WindowStatus = Field(default=WindowStatus.PENDING, description="状态")
    created_at: float = Field(default_factory=time.time, description="创建时间")
    started_at: float | None = Field(default=None, description="开始转码时间")
    completed_at: float | None = Field(default=None, description="完成时间")
    error_message: str | None = Field(default=None, description="错误信息")
    process: asyncio.subprocess.Process | None = Field(default=None, description="FFmpeg 进程")
    future: asyncio.Future | None = Field(default=None, description="转码任务Future")

    class Config:
        arbitrary_types_allowed = True

    @property
    def playlist_path(self) -> Path:
        """获取 m3u8 文件路径"""
        return self.output_dir / "index.m3u8"

    @property
    def is_running(self) -> bool:
        """是否正在转码"""
        return self.status == WindowStatus.RUNNING

    @property
    def is_completed(self) -> bool:
        """是否已完成"""
        return self.status == WindowStatus.COMPLETED

    @property
    def is_failed(self) -> bool:
        """是否失败"""
        return self.status == WindowStatus.FAILED

    @property
    def duration_seconds(self) -> float:
        """获取转码耗时（秒）"""
        if self.started_at is None:
            return 0.0
        end_time = self.completed_at or time.time()
        return end_time - self.started_at

    def start_transcoding(self) -> None:
        """开始转码"""
        self.status = WindowStatus.RUNNING
        self.started_at = time.time()
        logger.info(f"窗口 {self.window_id} 开始转码")

    def complete_transcoding(self) -> None:
        """完成转码"""
        self.status = WindowStatus.COMPLETED
        self.completed_at = time.time()
        duration = self.duration_seconds
        logger.info(f"窗口 {self.window_id} 转码完成，耗时 {duration:.1f}s")

    def fail_transcoding(self, error: str) -> None:
        """转码失败"""
        self.status = WindowStatus.FAILED
        self.completed_at = time.time()
        self.error_message = error
        duration = self.duration_seconds
        logger.error(f"窗口 {self.window_id} 转码失败，耗时 {duration:.1f}s: {error}")

    def cleanup(self) -> None:
        """清理资源"""
        if self.process and not self.process.returncode:
            try:
                # 优雅终止：先尝试 terminate，再强制 kill
                self.process.terminate()
                logger.debug(f"窗口 {self.window_id} FFmpeg 进程已发送终止信号")
                # 注意：这里不等待进程退出，因为cleanup是同步方法
                # 实际的等待和强制kill在JITTranscoder的异步代码中处理
            except Exception as e:
                # 忽略关闭时的所有错误，只记录调试日志
                logger.debug(f"关闭 FFmpeg 进程时出现错误（已忽略）: {e}")

        if self.future and not self.future.done():
            try:
                self.future.cancel()
                logger.debug(f"窗口 {self.window_id} 转码任务已取消")
            except Exception as e:
                # 忽略取消任务时的错误
                logger.debug(f"取消转码任务时出现错误（已忽略）: {e}")


class CacheStats(BaseModel):
    """缓存统计信息"""

    total_windows: int = Field(default=0, ge=0, description="总窗口数")
    total_size_bytes: int = Field(default=0, ge=0, description="总大小（字节）")
    total_hit_count: int = Field(default=0, ge=0, description="总命中次数")
    avg_window_size: float = Field(default=0.0, ge=0, description="平均窗口大小")
    cache_hit_rate: float = Field(default=0.0, ge=0, le=1, description="缓存命中率")
    oldest_window_age: float = Field(default=0.0, ge=0, description="最老窗口年龄")
    lru_candidates: int = Field(default=0, ge=0, description="LRU 候选数量")
