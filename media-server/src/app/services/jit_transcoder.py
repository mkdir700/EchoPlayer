"""
JIT (Just-In-Time) 转码服务
基于窗口的按需转码实现
"""

import asyncio
import json
import logging
import shutil
from pathlib import Path

import aiofiles

from app.config import ConfigManager
from app.models.window import (
    CacheStats,
    TranscodeProfile,
    TranscodeWindow,
    WindowCache,
)
from app.utils.hash import (
    calculate_asset_hash,
    calculate_profile_hash,
    calculate_window_id,
    get_cache_path,
)

logger = logging.getLogger(__name__)


class JITTranscoder:
    """JIT 转码器"""

    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):  # noqa: ARG004
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, cache_root: str | None = None, max_concurrent: int = 3):
        if self._initialized:
            return
        self.config = ConfigManager()
        self.cache_root = Path(cache_root or self.config.app_settings.hls_segment_cache_root)
        self.max_concurrent = max_concurrent

        # 运行中的任务
        self.running_windows: dict[tuple[str, str, int], TranscodeWindow] = {}
        self.task_semaphore = asyncio.Semaphore(max_concurrent)

        # 缓存管理
        self.cache_index: dict[tuple[str, str, int], WindowCache] = {}
        self.cache_loaded = False

        # 确保缓存目录存在
        self.cache_root.mkdir(parents=True, exist_ok=True)

        logger.info(f"JIT 转码器初始化完成，缓存目录: {self.cache_root}")

        self._initialized = True

    async def ensure_window(
        self,
        input_file: str | Path,
        time_seconds: float,
        profile: TranscodeProfile | None = None,
    ) -> str:
        """
        确保指定时间点的窗口可用

        Args:
            input_file: 输入文件路径
            time_seconds: 目标时间点（秒）
            profile: 转码配置

        Returns:
            str: m3u8 播放列表 URL
        """
        input_path = Path(input_file)
        if not input_path.exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")

        # 使用默认配置
        if profile is None:
            profile = TranscodeProfile()

        # 计算哈希值
        asset_hash = calculate_asset_hash(input_path)
        profile_hash = calculate_profile_hash(profile.__dict__, profile.version)
        window_id = calculate_window_id(time_seconds, profile.window_duration)

        # 检查缓存
        cache_key = (asset_hash, profile_hash, window_id)
        if await self._check_cache_hit(cache_key):
            cache_path = get_cache_path(
                self.cache_root, asset_hash, profile_hash, window_id
            )
            playlist_path = cache_path / "index.m3u8"
            logger.info(f"窗口 {window_id} 缓存命中: {playlist_path}")
            return f"/api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id:06d}/index.m3u8"

        # 检查是否正在转码
        if cache_key in self.running_windows:
            window = self.running_windows[cache_key]
            logger.info(f"窗口 {window_id} 正在转码中，等待完成...")

            # 等待转码完成
            if window.future:
                try:
                    await window.future
                except Exception as e:
                    logger.error(f"等待窗口 {window_id} 转码失败: {e}")
                    raise

            if window.is_completed:
                return f"/api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id:06d}/index.m3u8"
            raise RuntimeError(f"窗口 {window_id} 转码失败: {window.error_message}")

        # 启动新的转码任务
        return await self._start_transcoding(
            input_path, asset_hash, profile_hash, window_id, profile
        )

    async def _check_cache_hit(self, cache_key: tuple[str, str, int]) -> bool:
        """检查缓存命中"""
        await self._ensure_cache_loaded()

        if cache_key not in self.cache_index:
            return False

        cache = self.cache_index[cache_key]
        if not cache.is_valid():
            # 缓存无效，移除
            del self.cache_index[cache_key]
            return False

        # 更新访问信息
        cache.update_access()
        await self._save_cache_metadata(cache)
        return True

    async def _start_transcoding(
        self,
        input_file: Path,
        asset_hash: str,
        profile_hash: str,
        window_id: int,
        profile: TranscodeProfile,
    ) -> str:
        """启动转码任务"""
        # 计算窗口时间范围
        start_time = window_id * profile.window_duration
        duration = profile.window_duration

        # 创建输出目录
        output_dir = get_cache_path(
            self.cache_root, asset_hash, profile_hash, window_id
        )
        output_dir.mkdir(parents=True, exist_ok=True)

        # 创建转码窗口
        window = TranscodeWindow(
            window_id=window_id,
            asset_hash=asset_hash,
            profile_hash=profile_hash,
            input_file=input_file,
            start_time=start_time,
            duration=duration,
            output_dir=output_dir,
        )

        cache_key = (asset_hash, profile_hash, window_id)
        self.running_windows[cache_key] = window

        # 创建转码任务
        future = asyncio.create_task(self._transcode_window(window, profile))
        window.future = future

        try:
            # 等待转码完成
            await future

            if window.is_completed:
                # 添加到缓存索引
                cache = WindowCache(
                    window_id=window_id,
                    asset_hash=asset_hash,
                    profile_hash=profile_hash,
                    cache_dir=output_dir,
                    playlist_path=window.playlist_path,
                )
                cache.file_size_bytes = await self._calculate_dir_size(output_dir)
                self.cache_index[cache_key] = cache
                # 在保存前设置转码信息到缓存对象
                cache.input_file_path = str(window.input_file)
                cache.start_time = window.start_time
                cache.duration = window.duration
                cache.profile_config = profile.__dict__
                await self._save_cache_metadata(cache)

                return f"/api/v1/jit/hls/{asset_hash}/{profile_hash}/{window_id:06d}/index.m3u8"
            raise RuntimeError(f"窗口 {window_id} 转码失败: {window.error_message}")

        finally:
            # 清理运行状态
            if cache_key in self.running_windows:
                del self.running_windows[cache_key]

    async def _transcode_window(
        self, window: TranscodeWindow, profile: TranscodeProfile
    ) -> None:
        """执行窗口转码"""
        async with self.task_semaphore:  # 控制并发数
            try:
                await self._execute_ffmpeg(window, profile)
            except asyncio.CancelledError:
                # 应用关闭时忽略取消错误
                logger.debug(f"窗口 {window.window_id} 转码被取消（应用关闭）")
                raise
            except Exception as e:
                window.fail_transcoding(str(e))
                raise

    async def _execute_ffmpeg(
        self, window: TranscodeWindow, profile: TranscodeProfile
    ) -> None:
        """执行 FFmpeg 转码"""
        window.start_transcoding()

        # 获取视频信息用于动态GOP计算
        video_info = await self._get_video_info(window.input_file)

        # 构建 FFmpeg 命令
        cmd_args = await self._build_ffmpeg_command(window, profile, video_info)
        logger.info(f"执行 FFmpeg 命令: {' '.join(cmd_args)}")
        logger.debug(f"命令参数详情: {cmd_args}")

        try:
            # 启动 FFmpeg 进程
            process = await asyncio.create_subprocess_exec(
                *cmd_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            window.process = process

            # 等待进程完成
            stdout, stderr = await process.communicate()

            logger.debug(f"FFmpeg 返回代码: {process.returncode}")
            if stderr:
                logger.debug(
                    f"FFmpeg stderr: {stderr.decode()[:1000]}"
                )  # 只记录前1000字符

            if process.returncode == 0:
                # 验证输出文件
                if window.playlist_path.exists():
                    window.complete_transcoding()
                    logger.info(f"窗口 {window.window_id} 转码成功")
                else:
                    raise RuntimeError("m3u8 文件未生成")
            else:
                error_msg = (
                    stderr.decode()
                    if stderr
                    else f"FFmpeg 返回代码: {process.returncode}"
                )
                raise RuntimeError(error_msg)

        except asyncio.CancelledError:
            # 任务被取消（通常是应用关闭）
            if window.process:
                try:
                    # 优雅终止FFmpeg进程
                    window.process.terminate()
                    # 等待短时间让进程自行退出
                    try:
                        await asyncio.wait_for(window.process.wait(), timeout=2.0)
                        logger.debug(f"窗口 {window.window_id} FFmpeg 进程已优雅退出")
                    except TimeoutError:
                        # 超时则强制终止
                        window.process.kill()
                        logger.debug(f"窗口 {window.window_id} FFmpeg 进程已强制终止")
                except Exception as e:
                    # 忽略关闭时的所有错误
                    logger.debug(f"关闭 FFmpeg 进程时出现错误（已忽略）: {e}")
            raise
        except Exception as e:
            logger.error(f"FFmpeg 执行失败: {e}")
            raise

    async def _build_ffmpeg_command(
        self, window: TranscodeWindow, profile: TranscodeProfile, video_info: dict
    ) -> list[str]:
        """构建 FFmpeg 命令行

        支持混合转码模式：
        - 传统模式：音视频一起转码（原有逻辑）
        - 混合模式：只转码视频，音频由AudioPreprocessor单独处理
        """
        input_file = str(window.input_file)
        output_dir = str(window.output_dir)

        # 动态计算GOP设置
        fps = video_info.get("fps", 23.9)
        gop_size, keyint_min = self._calculate_gop_settings(fps, profile.hls_time)

        cmd_args = [
            self.config.app_settings.ffmpeg_path,
            "-hide_banner",  # 隐藏版本信息横幅
            "-y",  # 覆盖输出文件
            "-ss",
            str(window.start_time),  # 开始时间
            "-t",
            str(window.duration),  # 持续时间
            "-i",
            input_file,  # 输入文件
        ]

        # 根据转码模式选择流映射
        if profile.video_only or profile.hybrid_mode:
            # 混合模式/纯视频模式：只映射视频流，禁用音频
            cmd_args.extend(
                [
                    "-map",
                    "0:v:0",  # 只选择视频流
                    "-an",  # 禁用音频
                ]
            )
        else:
            # 传统模式：映射视频和音频流
            cmd_args.extend(
                [
                    "-map",
                    "0:v:0",  # 第一个视频流
                    "-map",
                    "0:a:0",  # 第一个音频流
                ]
            )

        # 视频编码设置
        cmd_args.extend(
            [
                "-c:v",
                profile.video_codec,
                "-preset",
                profile.video_preset,
                "-pix_fmt",
                profile.pixel_format,
                "-g",
                str(gop_size),
                "-keyint_min",
                str(keyint_min),
                "-sc_threshold",
                "0",  # 禁用场景变化检测
                "-force_key_frames",
                "expr:gte(t,0)",  # 强制在开始时生成关键帧
            ]
        )

        # 音频编码设置（仅在非纯视频模式下）
        if not (profile.video_only or profile.hybrid_mode):
            cmd_args.extend(
                [
                    "-c:a",
                    profile.audio_codec,
                    "-profile:a",
                    "aac_low",  # AAC低复杂度配置
                    "-ar",
                    "48000",  # 采样率
                    "-ac",
                    "2",  # 双声道
                    "-b:a",
                    profile.audio_bitrate,
                ]
            )

        # 时间戳处理
        if profile.hybrid_mode:
            # 混合模式：使用绝对时间戳，便于与独立音轨同步
            cmd_args.extend(
                [
                    "-copyts",
                    "-start_at_zero",
                    "-avoid_negative_ts",
                    "disabled",
                ]
            )
        else:
            # 传统模式：保持原有时间戳处理
            cmd_args.extend(
                [
                    "-copyts",
                    "-start_at_zero",
                    "-avoid_negative_ts",
                    "disabled",
                ]
            )

        # HLS 输出设置
        cmd_args.extend(
            [
                "-f",
                "hls",
                "-hls_time",
                str(profile.hls_time),
                "-hls_list_size",
                str(profile.hls_list_size),
                "-hls_segment_type",
                "fmp4",  # 使用 fMP4 分段格式
                "-hls_fmp4_init_filename",
                "init.mp4",  # 初始化文件名
                "-hls_segment_filename",
                f"{output_dir}/seg_%05d.m4s",  # 分段文件名
                # 输出播放列表
                f"{output_dir}/index.m3u8",
            ]
        )

        # 清理空字符串参数
        return [arg for arg in cmd_args if arg]

    async def _ensure_cache_loaded(self) -> None:
        """确保缓存索引已加载"""
        if self.cache_loaded:
            return

        logger.info("加载缓存索引...")
        count = 0

        # 扫描缓存目录
        for asset_dir in self.cache_root.iterdir():
            if not asset_dir.is_dir():
                continue

            for profile_dir in asset_dir.iterdir():
                if not profile_dir.is_dir():
                    continue

                for window_dir in profile_dir.iterdir():
                    if not window_dir.is_dir():
                        continue

                    playlist_path = window_dir / "index.m3u8"
                    if not playlist_path.exists():
                        continue

                    # 解析目录结构
                    try:
                        asset_hash = asset_dir.name
                        profile_hash = profile_dir.name
                        window_id = int(window_dir.name.replace("win_", ""))

                        # 加载元数据
                        cache = await self._load_cache_metadata(
                            window_id,
                            asset_hash,
                            profile_hash,
                            window_dir,
                            playlist_path,
                        )

                        cache_key = (asset_hash, profile_hash, window_id)
                        self.cache_index[cache_key] = cache
                        count += 1
                    except Exception as e:
                        logger.warning(f"加载缓存失败 {window_dir}: {e}")

        self.cache_loaded = True
        logger.info(f"缓存索引加载完成，共 {count} 个窗口")

    async def _load_cache_metadata(
        self,
        window_id: int,
        asset_hash: str,
        profile_hash: str,
        cache_dir: Path,
        playlist_path: Path,
    ) -> WindowCache:
        """加载缓存元数据"""
        meta_file = cache_dir / "index.meta.json"

        # 默认值
        cache = WindowCache(
            window_id=window_id,
            asset_hash=asset_hash,
            profile_hash=profile_hash,
            cache_dir=cache_dir,
            playlist_path=playlist_path,
        )

        # 尝试从 meta 文件加载
        if meta_file.exists():
            try:
                with meta_file.open() as f:
                    meta = json.load(f)
                    cache.hit_count = meta.get("hit_count", 0)
                    cache.last_access = meta.get("last_access_ts", cache.created_at)
                    cache.file_size_bytes = meta.get("bytes_total", 0)

                    # 加载转码信息
                    cache.input_file_path = meta.get("input_file")
                    cache.start_time = meta.get("start_time")
                    cache.duration = meta.get("duration")
                    cache.profile_config = meta.get("profile_config")
            except Exception as e:
                logger.warning(f"读取元数据失败 {meta_file}: {e}")

        # 计算文件大小（如果未设置）
        if cache.file_size_bytes == 0:
            cache.file_size_bytes = await self._calculate_dir_size(cache_dir)

        return cache

    async def _save_cache_metadata(
        self,
        cache: WindowCache,
        window: TranscodeWindow | None = None,
        profile: TranscodeProfile | None = None,
    ) -> None:
        """保存缓存元数据"""
        meta_file = cache.cache_dir / "index.meta.json"

        try:
            # 构建基础元数据
            meta = {
                "hit_count": cache.hit_count,
                "last_access_ts": cache.last_access,
                "bytes_total": cache.file_size_bytes,
                "created_at": cache.created_at,
            }

            # 从 WindowCache 对象直接获取转码信息，避免文件读取
            if cache.input_file_path:
                meta["input_file"] = cache.input_file_path
            if cache.start_time is not None:
                meta["start_time"] = cache.start_time
            if cache.duration is not None:
                meta["duration"] = cache.duration
            if cache.profile_config:
                meta["profile_config"] = cache.profile_config

            # 如果提供了新的窗口和配置信息，更新到 cache 对象并覆盖元数据
            if window and profile:
                cache.input_file_path = str(window.input_file)
                cache.start_time = window.start_time
                cache.duration = window.duration
                cache.profile_config = profile.__dict__

                meta.update(
                    {
                        "input_file": str(window.input_file),
                        "start_time": window.start_time,
                        "duration": window.duration,
                        "profile_config": profile.__dict__,
                    }
                )

            # 原子性写入：先写临时文件，再重命名
            temp_file = meta_file.with_suffix(".tmp")
            async with aiofiles.open(temp_file, "w") as f:
                await f.write(json.dumps(meta, indent=2))

            # 原子性重命名
            temp_file.rename(meta_file)

        except Exception as e:
            logger.warning(f"保存元数据失败 {meta_file}: {e}")
            # 清理可能的临时文件
            try:
                temp_file = meta_file.with_suffix(".tmp")
                if temp_file.exists():
                    temp_file.unlink()
            except Exception:
                pass

    async def _calculate_dir_size(self, directory: Path) -> int:
        """计算目录大小"""
        total_size = 0
        try:
            for file_path in directory.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
        except Exception as e:
            logger.warning(f"计算目录大小失败 {directory}: {e}")
        return total_size

    async def get_cache_stats(self) -> CacheStats:
        """获取缓存统计信息"""
        await self._ensure_cache_loaded()

        if not self.cache_index:
            return CacheStats()

        caches = list(self.cache_index.values())
        total_windows = len(caches)
        total_size = sum(c.file_size_bytes for c in caches)
        total_hits = sum(c.hit_count for c in caches)
        avg_size = total_size / total_windows if total_windows > 0 else 0

        # 计算最老窗口年龄
        oldest_age = 0.0
        if caches:
            oldest_age = max(c.get_age_seconds() for c in caches)

        return CacheStats(
            total_windows=total_windows,
            total_size_bytes=total_size,
            total_hit_count=total_hits,
            avg_window_size=avg_size,
            oldest_window_age=oldest_age,
        )

    async def cleanup_expired_caches(self, max_age_hours: int = 24) -> int:
        """清理过期缓存"""
        await self._ensure_cache_loaded()

        max_age_seconds = max_age_hours * 3600
        removed_count = 0

        # 找出过期的缓存
        expired_keys = []
        for cache_key, cache in self.cache_index.items():
            if cache.get_age_seconds() > max_age_seconds:
                expired_keys.append(cache_key)

        # 删除过期缓存
        for cache_key in expired_keys:
            cache = self.cache_index[cache_key]
            try:
                if cache.cache_dir.exists():
                    shutil.rmtree(cache.cache_dir)
                del self.cache_index[cache_key]
                removed_count += 1
                logger.info(f"删除过期缓存: {cache.cache_dir}")
            except Exception as e:
                logger.error(f"删除缓存失败 {cache.cache_dir}: {e}")

        if removed_count > 0:
            logger.info(f"清理完成，删除 {removed_count} 个过期缓存")

        return removed_count

    def get_window_url(
        self, asset_hash: str, profile_hash: str, window_id: int, file_name: str
    ) -> Path | None:
        """获取窗口文件路径"""
        cache_path = get_cache_path(
            self.cache_root, asset_hash, profile_hash, window_id
        )
        file_path = cache_path / file_name

        if file_path.exists():
            return file_path

        return None

    async def get_transcoding_info(
        self, asset_hash: str, profile_hash: str, window_id: int
    ) -> tuple[Path | None, float, float, TranscodeProfile | None]:
        """
        从缓存获取转码信息（高性能版本，直接从内存获取）

        Args:
            asset_hash: 资产哈希
            profile_hash: 配置哈希
            window_id: 窗口ID

        Returns:
            tuple: (输入文件路径, 开始时间, 持续时间, 转码配置) 或 (None, 0, 0, None)
        """
        # 尝试从缓存索引获取
        await self._ensure_cache_loaded()
        cache_key = (asset_hash, profile_hash, window_id)

        if cache_key in self.cache_index:
            cache = self.cache_index[cache_key]

            # 直接从 WindowCache 对象获取转码信息（高性能）
            if cache.input_file_path:
                input_file = Path(cache.input_file_path)
                start_time = cache.start_time or 0.0
                duration = cache.duration or 12.0

                # 重建转码配置
                if cache.profile_config:
                    try:
                        profile = TranscodeProfile(**cache.profile_config)
                    except Exception as e:
                        logger.warning(f"重建转码配置失败: {e}")
                        profile = TranscodeProfile()
                else:
                    profile = TranscodeProfile()

                if input_file.exists():
                    return input_file, start_time, duration, profile
                logger.warning(f"原始文件不存在: {input_file}")

        # 尝试从缓存目录直接读取（向后兼容）
        cache_path = get_cache_path(
            self.cache_root, asset_hash, profile_hash, window_id
        )
        meta_file = cache_path / "index.meta.json"

        if meta_file.exists():
            try:
                with meta_file.open() as f:
                    meta = json.load(f)

                input_file_str = meta.get("input_file")
                if input_file_str:
                    input_file = Path(input_file_str)
                    start_time = meta.get("start_time", 0.0)
                    duration = meta.get("duration", 12.0)

                    profile_config = meta.get("profile_config")
                    if profile_config:
                        profile = TranscodeProfile(**profile_config)
                    else:
                        profile = TranscodeProfile()

                    if input_file.exists():
                        return input_file, start_time, duration, profile

            except Exception as e:
                logger.warning(f"读取缓存元数据失败 {meta_file}: {e}")

        return None, 0.0, 0.0, None

    async def find_existing_windows(
        self, asset_hash: str, profile_hash: str
    ) -> list[int]:
        """
        查找给定资产和配置的所有现有窗口ID

        Args:
            asset_hash: 资产哈希
            profile_hash: 配置哈希

        Returns:
            list[int]: 现有窗口ID列表，按ID排序
        """
        await self._ensure_cache_loaded()

        existing_windows = []
        for cache_key in self.cache_index:
            cache_asset_hash, cache_profile_hash, window_id = cache_key
            if cache_asset_hash == asset_hash and cache_profile_hash == profile_hash:
                existing_windows.append(window_id)

        return sorted(existing_windows)

    def shutdown(self) -> None:
        """关闭转码器"""
        logger.info("JIT 转码器正在关闭...")

        # 取消所有运行中的任务
        for window in self.running_windows.values():
            window.cleanup()

        self.running_windows.clear()
        logger.info("JIT 转码器已关闭")

    async def _get_video_info(self, input_file: Path) -> dict:
        """获取视频信息，特别是帧率"""
        try:
            cmd_args = [
                self.config.app_settings.ffprobe_path,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_streams",
                "-select_streams",
                "v:0",
                str(input_file),
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0 and stdout:
                info = json.loads(stdout.decode())
                if info.get("streams"):
                    stream = info["streams"][0]
                    # 解析帧率
                    fps_str = stream.get("r_frame_rate", "25/1")
                    if "/" in fps_str:
                        num, den = fps_str.split("/")
                        fps = float(num) / float(den) if float(den) != 0 else 25.0
                    else:
                        fps = float(fps_str)

                    return {
                        "fps": fps,
                        "duration": float(stream.get("duration", 0)),
                        "width": int(stream.get("width", 0)),
                        "height": int(stream.get("height", 0)),
                    }

            logger.warning(
                f"无法获取视频信息: {stderr.decode() if stderr else 'Unknown error'}"
            )

        except Exception as e:
            logger.error(f"获取视频信息失败: {e}")

        # 返回默认值
        return {"fps": 25.0, "duration": 0, "width": 0, "height": 0}

    def _calculate_gop_settings(self, fps: float, hls_time: float) -> tuple[int, int]:
        """
        根据帧率和segment时长动态计算GOP设置

        Args:
            fps: 视频帧率
            hls_time: HLS segment时长（秒）

        Returns:
            tuple: (gop_size, keyint_min)
        """
        # 计算每个segment的帧数，确保GOP边界与segment边界对齐
        frames_per_segment = int(fps * hls_time)

        # GOP大小设为segment帧数，确保每个segment开始时都有关键帧
        gop_size = frames_per_segment

        # 最小关键帧间隔设为相同值，确保固定间隔
        keyint_min = gop_size

        logger.debug(
            f"动态GOP设置: fps={fps:.2f}, hls_time={hls_time}s, gop_size={gop_size}, keyint_min={keyint_min}"
        )

        return gop_size, keyint_min
