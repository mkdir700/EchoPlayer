"""
会话级播放模型
支持跨窗口连续播放的会话管理
"""

import time
import uuid
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field, computed_field

from .audio_track import AudioTrackProfile
from .window import TranscodeProfile, WindowCache


class SessionStatus(str, Enum):
    """会话状态"""

    CREATING = "creating"  # 正在创建
    PREPROCESSING = "preprocessing"  # 音频预处理中
    TRANSCODING = "transcoding"  # 转码中
    INITIALIZING = "initializing"  # 初始化中
    ACTIVE = "active"  # 活跃状态
    IDLE = "idle"  # 空闲状态
    EXPIRED = "expired"  # 已过期
    ERROR = "error"  # 错误状态


class WindowReference(BaseModel):
    """窗口引用信息"""

    window_id: int = Field(description="窗口ID")
    asset_hash: str = Field(description="资产哈希")
    profile_hash: str = Field(description="配置哈希")
    start_time: float = Field(description="窗口开始时间（秒）")
    duration: float = Field(gt=0, description="窗口时长（秒）")
    end_time: float = Field(description="窗口结束时间（秒）")
    segments: list[str] = Field(default_factory=list, description="片段文件名列表")
    ready: bool = Field(default=False, description="是否已准备好")
    needs_discontinuity: bool = Field(default=False, description="是否需要不连续标记")

    @computed_field
    @property
    def time_range(self) -> tuple[float, float]:
        """获取时间范围"""
        return (self.start_time, self.end_time)

    def overlaps_with(self, other: "WindowReference") -> bool:
        """检查是否与另一个窗口重叠"""
        return not (
            self.end_time <= other.start_time or other.end_time <= self.start_time
        )

    def is_adjacent_to(self, other: "WindowReference") -> bool:
        """检查是否与另一个窗口相邻"""
        return (
            abs(self.end_time - other.start_time) < 0.1
            or abs(other.end_time - self.start_time) < 0.1
        )


class PrecomputedSegment(BaseModel):
    """预计算的分片信息"""

    segment_index: int = Field(description="分片在窗口内的索引")
    window_id: int = Field(description="所属窗口ID")
    start_time: float = Field(description="分片开始时间")
    duration: float = Field(gt=0, description="分片时长")
    sequence_number: int = Field(description="全局序列号")

    @computed_field
    @property
    def url(self) -> str:
        """生成分片URL"""
        # 这将在SessionPlaylistGenerator中填充实际的asset_hash和profile_hash
        return f"seg_{self.segment_index:05d}.m4s"

    @computed_field
    @property
    def end_time(self) -> float:
        """分片结束时间"""
        return self.start_time + self.duration


class PlaylistSegment(BaseModel):
    """播放列表片段信息"""

    url: str = Field(description="片段URL")
    duration: float = Field(gt=0, description="片段时长")
    sequence_number: int = Field(description="序列号")
    window_id: int = Field(description="所属窗口ID")
    discontinuity_before: bool = Field(
        default=False, description="之前是否需要不连续标记"
    )
    available: bool = Field(default=True, description="片段是否已转码可用")

    def to_m3u8_lines(self, include_unavailable: bool = True) -> list[str]:
        """转换为m3u8格式的行

        Args:
            include_unavailable: 是否包含未转码的片段
        """
        # 如果片段不可用且不包含未转码片段，返回空列表
        if not self.available and not include_unavailable:
            return []

        lines = []
        if self.discontinuity_before:
            lines.append("#EXT-X-DISCONTINUITY")
            # 只有在真正不连续时才添加新的EXT-X-MAP
            # 相邻窗口间已经没有DISCONTINUITY，所以不会到达这里
            init_path = self._get_init_segment_path(self.url)
            if init_path:
                lines.append(f'#EXT-X-MAP:URI="{init_path}"')
        lines.append(f"#EXTINF:{self.duration:.1f},")
        lines.append(self.url)
        return lines

    def _get_init_segment_path(self, segment_url: str) -> str | None:
        """从片段URL推导出初始化段路径"""
        try:
            # 片段URL格式: /api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id:06d}/{segment_file}
            parts = segment_url.strip("/").split("/")
            if (
                len(parts) >= 7
                and parts[0] == "api"
                and parts[1] == "v1"
                and parts[2] == "jit"
            ):
                asset_hash = parts[4]
                profile_hash = parts[5]
                window_id = parts[6]
                return (
                    f"/api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id}/init.mp4"
                )
        except Exception:
            pass
        return None


class SessionPlaylist(BaseModel):
    """会话播放列表"""

    session_id: str = Field(description="会话ID")
    target_duration: float = Field(gt=0, description="目标片段时长")
    segments: list[PlaylistSegment] = Field(
        default_factory=list, description="片段列表"
    )
    version: int = Field(default=6, ge=1, description="HLS版本")
    sequence_number: int = Field(default=0, ge=0, description="媒体序列号")
    is_live: bool = Field(default=False, description="是否为直播")
    # 混合模式音频支持
    has_audio_track: bool = Field(default=False, description="是否有独立音频轨道")
    audio_track_id: str | None = Field(default=None, description="音频轨道ID")

    def get_total_duration(self) -> float:
        """获取播放列表总时长"""
        return sum(segment.duration for segment in self.segments)

    def get_window_count(self) -> int:
        """获取窗口数量"""
        return len({segment.window_id for segment in self.segments})

    def to_m3u8(self) -> str:
        """生成m3u8播放列表内容

        优化版本：使用全局统一EXT-X-MAP，减少DISCONTINUITY标记
        支持混合模式音频轨道
        """
        # 检查是否为混合模式且有独立音频轨道
        if self.has_audio_track and self.audio_track_id:
            return self._generate_master_playlist()
        return self._generate_media_playlist()

    def _generate_master_playlist(self) -> str:
        """生成主播放列表(Master Playlist)用于混合模式"""
        lines = ["#EXTM3U", "#EXT-X-VERSION:6"]

        # 定义音频轨道
        if self.audio_track_id:
            audio_url = f"/api/v1/audio/{self.audio_track_id}/playlist.m3u8"
            lines.extend(
                [
                    f'#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="default",DEFAULT=YES,AUTOSELECT=YES,URI="{audio_url}"'
                ]
            )

        # 定义视频流（只有视频，音频通过上面的音频轨道提供）
        video_playlist_url = f"/api/v1/session/{self.session_id}/video.m3u8"
        lines.extend(
            [
                '#EXT-X-STREAM-INF:BANDWIDTH=2000000,CODECS="avc1.64001e,mp4a.40.2",AUDIO="audio"',
                video_playlist_url,
            ]
        )

        return "\n".join(lines)

    def _generate_media_playlist(self) -> str:
        """生成媒体播放列表(Media Playlist)用于传统模式或混合模式的视频轨道"""
        # 计算实际的最大片段时长，避免0.0时长问题
        if self.segments:
            valid_durations = [
                seg.duration for seg in self.segments if seg.duration > 0
            ]
            max_duration = max(valid_durations, default=self.target_duration)
        else:
            max_duration = self.target_duration

        target_duration = max(int(max_duration) + 1, int(self.target_duration) + 1)

        lines = [
            "#EXTM3U",
            f"#EXT-X-VERSION:{self.version}",
            f"#EXT-X-TARGETDURATION:{target_duration}",
        ]

        lines.append("#EXT-X-PLAYLIST-TYPE:VOD")

        # 添加全局统一的fMP4初始化段引用
        if self.segments:
            # 使用第一个窗口的init.mp4作为全局初始化段
            # 由于编码参数已统一，所有窗口的init.mp4兼容
            first_segment = self.segments[0]
            init_path = self._get_init_segment_path(first_segment.url)
            if init_path:
                lines.append(f'#EXT-X-MAP:URI="{init_path}"')

            # 添加独立片段标记（用于更好的seek支持）
            lines.append("#EXT-X-INDEPENDENT-SEGMENTS")

            lines.append(f"#EXT-X-MEDIA-SEQUENCE:{self.sequence_number}")

        # 添加片段 - 优化后减少了不必要的DISCONTINUITY
        for segment in self.segments:
            # 包含所有片段（包括未转码的），让客户端看到完整结构
            lines.extend(segment.to_m3u8_lines(include_unavailable=True))

        lines.append("#EXT-X-ENDLIST")

        return "\n".join(lines)

    def _get_init_segment_path(self, segment_url: str) -> str | None:
        """从片段URL推导出初始化段路径"""
        try:
            # 片段URL格式: /api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id:06d}/{segment_file}
            parts = segment_url.strip("/").split("/")
            if (
                len(parts) >= 7
                and parts[0] == "api"
                and parts[1] == "v1"
                and parts[2] == "jit"
            ):
                asset_hash = parts[4]
                profile_hash = parts[5]
                window_id = parts[6]
                return (
                    f"/api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id}/init.mp4"
                )
        except Exception:
            pass
        return None


class PlaybackSession(BaseModel):
    """播放会话"""

    session_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="会话ID"
    )
    file_path: Path = Field(default_factory=lambda: Path(), description="文件路径")
    asset_hash: str = Field(default="", description="资产哈希")
    profile: TranscodeProfile = Field(
        default_factory=TranscodeProfile, description="转码配置"
    )
    profile_hash: str = Field(default="", description="配置哈希")

    # 会话状态
    status: SessionStatus = Field(
        default=SessionStatus.CREATING, description="会话状态"
    )
    created_at: float = Field(default_factory=time.time, description="创建时间")
    last_access: float = Field(default_factory=time.time, description="最后访问时间")
    expires_at: float = Field(
        default_factory=lambda: time.time() + 3600, description="过期时间（默认1小时）"
    )

    # 创建进度信息
    progress_percent: float = Field(
        default=0.0, ge=0, le=100, description="创建进度百分比"
    )
    progress_stage: str = Field(default="初始化", description="当前进度阶段描述")
    error_message: str | None = Field(default=None, description="错误信息")

    # 播放状态
    current_time: float = Field(default=0.0, ge=0, description="当前播放时间")
    duration: float | None = Field(default=None, description="视频总时长")

    # 窗口管理
    windows: dict[int, WindowReference] = Field(
        default_factory=dict, description="窗口引用"
    )
    loaded_windows: set[int] = Field(default_factory=set, description="已加载的窗口")
    preloading_windows: set[int] = Field(
        default_factory=set, description="正在预加载的窗口"
    )

    # 播放列表
    playlist: SessionPlaylist | None = Field(default=None, description="播放列表")
    playlist_dirty: bool = Field(default=True, description="播放列表是否需要重新生成")

    # 音频轨道管理（混合转码模式）
    audio_track_id: str | None = Field(default=None, description="音频轨道标识符")
    audio_profile: AudioTrackProfile | None = Field(
        default=None, description="音频配置"
    )
    audio_track_ready: bool = Field(default=False, description="音频轨道是否已准备好")
    hybrid_mode: bool = Field(default=False, description="是否启用混合转码模式")

    # 配置
    max_windows_in_playlist: int = Field(
        default=10, ge=1, description="播放列表中最大窗口数"
    )
    preload_window_count: int = Field(default=1, ge=0, description="预加载窗口数量")

    class Config:
        arbitrary_types_allowed = True

    ttl_seconds: int = 3600  # 会话生存时间

    def is_expired(self) -> bool:
        """检查会话是否过期"""
        return time.time() > self.expires_at

    def is_idle(self, idle_timeout: int = 300) -> bool:
        """检查会话是否空闲（默认5分钟）"""
        return time.time() - self.last_access > idle_timeout

    def update_access(self) -> None:
        """更新访问时间"""
        self.last_access = time.time()
        if self.status == SessionStatus.IDLE:
            self.status = SessionStatus.ACTIVE

    def get_current_window_id(self) -> int:
        """获取当前时间对应的窗口ID"""
        window_duration = self.profile.window_duration
        return int(self.current_time // window_duration)

    def get_time_range_window_ids(
        self, start_time: float, end_time: float
    ) -> list[int]:
        """获取时间范围对应的窗口ID列表"""
        window_duration = self.profile.window_duration
        start_window = int(start_time // window_duration)
        end_window = int(end_time // window_duration)
        return list(range(start_window, end_window + 1))

    def add_window(self, window_id: int, window_cache: WindowCache) -> None:
        """添加窗口引用"""
        if window_id not in self.windows:
            start_time = window_id * self.profile.window_duration
            end_time = start_time + self.profile.window_duration

            window_ref = WindowReference(
                window_id=window_id,
                asset_hash=window_cache.asset_hash,
                profile_hash=window_cache.profile_hash,
                start_time=start_time,
                duration=self.profile.window_duration,
                end_time=end_time,
                ready=True,
            )

            self.windows[window_id] = window_ref
            self.loaded_windows.add(window_id)
            self.playlist_dirty = True

    def get_required_windows(self) -> list[int]:
        """获取需要的窗口ID列表（基于当前播放位置）"""
        current_window = self.get_current_window_id()
        required_windows = []

        # 当前窗口及前后窗口
        for offset in range(-1, self.preload_window_count + 1):
            window_id = current_window + offset
            if window_id >= 0:
                required_windows.append(window_id)

        return required_windows

    def needs_playlist_rebuild(self) -> bool:
        """检查是否需要重建播放列表"""
        return self.playlist_dirty or self.playlist is None

    def mark_playlist_clean(self) -> None:
        """标记播放列表为最新"""
        self.playlist_dirty = False

    def cleanup_old_windows(self) -> list[int]:
        """清理不再需要的旧窗口"""
        current_window = self.get_current_window_id()
        cleanup_threshold = current_window - self.max_windows_in_playlist

        removed_windows = []
        for window_id in list(self.windows.keys()):
            if window_id < cleanup_threshold:
                del self.windows[window_id]
                self.loaded_windows.discard(window_id)
                removed_windows.append(window_id)
                self.playlist_dirty = True

        return removed_windows

    def enable_hybrid_mode(self, audio_track_id: str) -> None:
        """启用混合转码模式"""
        self.hybrid_mode = True
        self.audio_track_id = audio_track_id
        # 注意: profile.hybrid_mode 在创建时就已确定，不需要修改
        self.playlist_dirty = True

    def set_audio_track_ready(self, ready: bool = True) -> None:
        """设置音频轨道就绪状态"""
        if self.audio_track_ready != ready:
            self.audio_track_ready = ready
            # 音频轨道状态变化时，需要重新生成播放列表
            self.playlist_dirty = True

    def is_audio_ready(self) -> bool:
        """检查音频轨道是否已准备好"""
        if not self.hybrid_mode:
            return True  # 非混合模式，不需要独立音频轨道
        return self.audio_track_ready

    def get_audio_track_identifier(self) -> str | None:
        """获取音频轨道标识符"""
        return self.audio_track_id if self.hybrid_mode else None

    def update_progress(
        self, percent: float, stage: str, status: SessionStatus | None = None
    ) -> None:
        """
        更新创建进度

        Args:
            percent: 进度百分比 (0-100)
            stage: 当前阶段描述
            status: 可选的会话状态更新
        """
        self.progress_percent = min(100.0, max(0.0, percent))
        self.progress_stage = stage
        if status is not None:
            self.status = status
        self.update_access()

    def mark_creation_complete(self) -> None:
        """标记创建完成"""
        self.progress_percent = 100.0
        self.progress_stage = "就绪"
        self.status = SessionStatus.ACTIVE

    def mark_creation_failed(self, error: str) -> None:
        """标记创建失败"""
        self.status = SessionStatus.ERROR
        self.error_message = error
        self.progress_stage = f"失败: {error}"


class SessionStats(BaseModel):
    """会话统计信息"""

    total_sessions: int = Field(default=0, ge=0, description="总会话数")
    active_sessions: int = Field(default=0, ge=0, description="活跃会话数")
    idle_sessions: int = Field(default=0, ge=0, description="空闲会话数")
    expired_sessions: int = Field(default=0, ge=0, description="过期会话数")
    total_windows_loaded: int = Field(default=0, ge=0, description="已加载窗口总数")
    cache_hit_rate: float = Field(default=0.0, ge=0, le=1, description="缓存命中率")
    avg_session_duration: float = Field(default=0.0, ge=0, description="平均会话时长")
