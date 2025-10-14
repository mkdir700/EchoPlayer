"""
v1 JIT 转码请求/响应数据模型
"""

from pydantic import BaseModel, Field


class JITTranscodeRequest(BaseModel):
    """JIT 转码请求"""

    file_path: str = Field(..., description="视频文件路径")
    time_seconds: float = Field(..., ge=0, description="目标时间点（秒）")

    # 转码配置（可选，使用默认值）
    video_codec: str | None = Field(None, description="视频编码器")
    video_preset: str | None = Field(None, description="编码预设")
    video_bitrate: str | None = Field(None, description="视频码率")
    hls_time: float | None = Field(None, gt=0, description="分片时长")
    window_duration: float | None = Field(None, gt=0, description="窗口时长")


class JITTranscodeResponse(BaseModel):
    """JIT 转码响应"""

    success: bool = Field(..., description="是否成功")
    playlist_url: str = Field(..., description="HLS 播放列表 URL")
    window_id: int = Field(..., description="窗口ID")
    asset_hash: str = Field(..., description="资产哈希")
    profile_hash: str = Field(..., description="配置哈希")
    cached: bool = Field(..., description="是否命中缓存")
    transcode_time: float | None = Field(None, description="转码耗时（秒）")


class CacheStatsResponse(BaseModel):
    """缓存统计响应"""

    total_windows: int = Field(..., description="总窗口数")
    total_size_bytes: int = Field(..., description="总大小（字节）")
    total_size_mb: float = Field(..., description="总大小（MB）")
    total_hit_count: int = Field(..., description="总命中次数")
    avg_window_size: float = Field(..., description="平均窗口大小")
    cache_hit_rate: float = Field(..., description="缓存命中率")
    oldest_window_age: float = Field(..., description="最老窗口年龄（秒）")
    lru_candidates: int = Field(..., description="LRU 候选数量")


class CacheCleanupRequest(BaseModel):
    """缓存清理请求"""

    strategy: str = Field(..., pattern="^(lru|age|pattern)$", description="清理策略")
    max_age_hours: int | None = Field(None, gt=0, description="最大年龄（小时）")
    asset_hash: str | None = Field(None, description="指定资产哈希")


class CacheCleanupResponse(BaseModel):
    """缓存清理响应"""

    success: bool = Field(..., description="是否成功")
    strategy: str = Field(..., description="清理策略")
    removed_windows: int = Field(..., description="删除的窗口数")
    freed_bytes: int = Field(..., description="释放的字节数")
    freed_mb: float = Field(..., description="释放的大小（MB）")


class PreloadRequest(BaseModel):
    """预加载请求"""

    file_path: str = Field(..., description="视频文件路径")
    time_ranges: list[tuple[float, float]] = Field(
        ..., description="时间范围列表 [(start, end), ...]"
    )
    priority: int = Field(default=5, ge=1, le=10, description="优先级 1-10")

    # 转码配置（可选）
    video_codec: str | None = Field(None, description="视频编码器")
    video_preset: str | None = Field(None, description="编码预设")
    video_bitrate: str | None = Field(None, description="视频码率")


class PreloadResponse(BaseModel):
    """预加载响应"""

    success: bool = Field(..., description="是否成功")
    queued_windows: int = Field(..., description="加入队列的窗口数")
    cached_windows: int = Field(..., description="已缓存的窗口数")
    estimated_time: float | None = Field(None, description="预估完成时间（秒）")


class WindowStatusResponse(BaseModel):
    """窗口状态响应"""

    window_id: int = Field(..., description="窗口ID")
    asset_hash: str = Field(..., description="资产哈希")
    profile_hash: str = Field(..., description="配置哈希")
    status: str = Field(..., description="状态")
    created_at: float = Field(..., description="创建时间")
    duration_seconds: float = Field(..., description="处理时长")
    cached: bool = Field(..., description="是否已缓存")
    file_size_bytes: int = Field(..., description="文件大小")
    playlist_url: str | None = Field(None, description="播放列表 URL")


class FileCacheCleanupRequest(BaseModel):
    """文件缓存清理请求"""

    file_path: str = Field(..., description="要清理缓存的文件路径")


class FileCacheCleanupResponse(BaseModel):
    """文件缓存清理响应"""

    success: bool = Field(..., description="是否成功")
    file_path: str = Field(..., description="文件路径")
    asset_hash: str | None = Field(None, description="文件资产哈希")
    removed_windows: int = Field(..., description="删除的窗口数")
    freed_bytes: int = Field(..., description="释放的字节数")
    freed_mb: float = Field(..., description="释放的大小（MB）")
    message: str = Field(..., description="详细信息")
