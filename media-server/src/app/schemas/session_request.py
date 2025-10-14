"""
会话管理相关的请求/响应数据模型
"""

from pydantic import BaseModel, Field

from app.models.session import SessionStatus


class SessionCreateRequest(BaseModel):
    """创建会话请求"""

    file_path: str = Field(..., description="视频文件路径")
    initial_time: float = Field(default=0.0, ge=0, description="初始播放时间（秒）")

    # 新的配置方式
    quality: str = Field(default="720p", description="质量档位 (480p, 720p, 1080p)")
    enable_hybrid: bool | None = Field(
        None, description="是否启用混合模式（None=自动检测）"
    )
    video_only: bool = Field(default=False, description="是否只转码视频")

    # 兼容旧的转码配置（已废弃，但为了向后兼容保留）
    video_codec: str | None = Field(None, description="视频编码器（已废弃）")
    video_preset: str | None = Field(None, description="编码预设（已废弃）")
    video_bitrate: str | None = Field(None, description="视频码率（已废弃）")
    hls_time: float | None = Field(None, gt=0, description="分片时长（已废弃）")
    window_duration: float | None = Field(None, gt=0, description="窗口时长（已废弃）")


class SessionCreateResponse(BaseModel):
    """创建会话响应"""

    success: bool = Field(..., description="是否成功")
    session_id: str = Field(..., description="会话ID")
    playlist_url: str = Field(..., description="播放列表URL")
    asset_hash: str = Field(..., description="资产哈希")
    profile_hash: str = Field(..., description="配置哈希")
    initial_windows_loaded: int = Field(..., description="初始加载的窗口数")


class SessionSeekRequest(BaseModel):
    """会话seek请求"""

    time_seconds: float = Field(..., ge=0, description="目标时间（秒）")


class SessionSeekResponse(BaseModel):
    """会话seek响应"""

    success: bool = Field(..., description="是否成功")
    old_time: float = Field(..., description="之前的时间")
    new_time: float = Field(..., description="新的时间")
    playlist_updated: bool = Field(..., description="播放列表是否已更新")
    windows_loaded: int = Field(..., description="新加载的窗口数")


class SessionUpdateTimeRequest(BaseModel):
    """会话时间更新请求"""

    current_time: float = Field(..., ge=0, description="当前播放时间（秒）")


class SessionUpdateTimeResponse(BaseModel):
    """会话时间更新响应"""

    success: bool = Field(..., description="是否成功")
    windows_preloaded: int = Field(default=0, description="预加载的窗口数")


class SessionInfoResponse(BaseModel):
    """会话信息响应"""

    session_id: str = Field(..., description="会话ID")
    file_path: str = Field(..., description="文件路径")
    asset_hash: str = Field(..., description="资产哈希")
    profile_hash: str = Field(..., description="配置哈希")
    status: SessionStatus = Field(..., description="会话状态")
    created_at: float = Field(..., description="创建时间")
    last_access: float = Field(..., description="最后访问时间")
    expires_at: float = Field(..., description="过期时间")
    current_time: float = Field(..., description="当前播放时间")
    duration: float | None = Field(None, description="视频总时长")
    loaded_windows: list[int] = Field(..., description="已加载的窗口ID列表")
    preloading_windows: list[int] = Field(..., description="正在预加载的窗口ID列表")
    playlist_url: str = Field(..., description="播放列表URL")
    total_segments: int = Field(default=0, description="播放列表中的总片段数")
    total_duration: float = Field(default=0.0, description="播放列表总时长")


class SessionListResponse(BaseModel):
    """会话列表响应"""

    sessions: list[SessionInfoResponse] = Field(..., description="会话列表")
    total_count: int = Field(..., description="总会话数")


class SessionStatsResponse(BaseModel):
    """会话统计响应"""

    total_sessions: int = Field(..., description="总会话数")
    active_sessions: int = Field(..., description="活跃会话数")
    idle_sessions: int = Field(..., description="空闲会话数")
    expired_sessions: int = Field(..., description="过期会话数")
    total_windows_loaded: int = Field(..., description="总加载窗口数")
    cache_hit_rate: float = Field(default=0.0, description="缓存命中率")
    avg_session_duration: float = Field(..., description="平均会话时长")


class SessionDeleteResponse(BaseModel):
    """会话删除响应"""

    success: bool = Field(..., description="是否成功")
    session_id: str = Field(..., description="已删除的会话ID")


class SessionPlaylistResponse(BaseModel):
    """会话播放列表响应"""

    success: bool = Field(..., description="是否成功")
    session_id: str = Field(..., description="会话ID")
    playlist_content: str = Field(..., description="播放列表内容(m3u8)")
    segments_count: int = Field(..., description="片段数量")
    windows_count: int = Field(..., description="窗口数量")
    total_duration: float = Field(..., description="总时长")
    last_updated: float = Field(..., description="最后更新时间")


class SessionProgressResponse(BaseModel):
    """会话创建进度响应"""

    session_id: str = Field(..., description="会话ID")
    status: SessionStatus = Field(..., description="会话状态")
    progress_percent: float = Field(..., ge=0, le=100, description="进度百分比")
    progress_stage: str = Field(..., description="当前阶段描述")
    error_message: str | None = Field(None, description="错误信息（如果有）")
    is_ready: bool = Field(..., description="是否已准备好播放")
    playlist_url: str | None = Field(None, description="播放列表URL（就绪后可用）")

    # 音频转码进度（混合模式下可用）
    audio_progress: dict | None = Field(None, description="音频转码进度信息")
