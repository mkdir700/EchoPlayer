"""
音频预处理服务
负责音频轨道的整体转码和分片，确保时间戳连续性
"""

import asyncio
import json
import logging
import shutil
import time
from pathlib import Path

import aiofiles

from app.config import ConfigManager
from app.models.audio_track import (
    AudioTrack,
    AudioTrackCache,
    AudioTrackProfile,
    AudioTrackStats,
)
from app.utils.hash import calculate_asset_hash, calculate_profile_hash

logger = logging.getLogger(__name__)


def parse_ffmpeg_progress(line: str) -> dict | None:
    """
    解析 FFmpeg -progress 输出的进度信息

    使用 -progress pipe:2 后，FFmpeg 输出结构化的键值对格式：
    out_time_us=60436500
    out_time=00:01:00.436500
    speed= 120x
    progress=continue

    Args:
        line: FFmpeg stderr 输出的一行（键值对格式）

    Returns:
        dict: 包含进度信息的字典，如果无法解析则返回 None
            - time: 已转码时长（秒）
            - speed: 转码速度倍率
            - bitrate: 码率（kbits/s，可选）
            - size: 当前输出大小（字节，可选）
    """
    line = line.strip()

    # 解析 out_time=HH:MM:SS.ms 格式
    if line.startswith("out_time="):
        time_str = line.split("=", 1)[1]
        # 解析 HH:MM:SS.ms 格式
        parts = time_str.split(":")
        if len(parts) == 3:
            try:
                hours = int(parts[0])
                minutes = int(parts[1])
                seconds = float(parts[2])
                total_seconds = hours * 3600 + minutes * 60 + seconds
                return {"time": total_seconds}
            except (ValueError, IndexError):
                pass

    # 解析 speed=X.XXx 或 speed= XXXx 格式
    elif line.startswith("speed="):
        speed_str = line.split("=", 1)[1].strip()
        # 移除 'x' 后缀
        if speed_str.endswith("x"):
            speed_str = speed_str[:-1].strip()
            try:
                speed = float(speed_str)
                return {"speed": speed}
            except ValueError:
                pass

    # 解析 bitrate=XXX.Xkbits/s 格式（可选）
    elif line.startswith("bitrate="):
        bitrate_str = line.split("=", 1)[1].strip()
        # 移除 'kbits/s' 后缀
        if "kbits/s" in bitrate_str:
            bitrate_str = bitrate_str.replace("kbits/s", "").strip()
            try:
                bitrate = float(bitrate_str)
                return {"bitrate": bitrate}
            except ValueError:
                pass

    # 解析 total_size=XXXXX 格式（字节）
    elif line.startswith("total_size="):
        size_str = line.split("=", 1)[1].strip()
        try:
            size = int(size_str)
            return {"size": size}
        except ValueError:
            pass

    return None


class AudioPreprocessor:
    """音频预处理器"""

    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):  # noqa: ARG004
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self, cache_root: str | None = None, max_concurrent: int | None = None
    ):
        if self._initialized:
            return

        self.config = ConfigManager()
        self.cache_root = Path(cache_root or self.config.app_settings.audio_cache_root)
        self.max_concurrent = (
            max_concurrent or self.config.app_settings.audio_preprocessor_concurrent
        )

        # 运行中的任务
        self.running_tracks: dict[tuple[str, str], AudioTrack] = {}
        self.task_semaphore = asyncio.Semaphore(self.max_concurrent)

        # 缓存管理
        self.track_cache: dict[tuple[str, str], AudioTrackCache] = {}
        self.cache_loaded = False

        # 确保缓存目录存在
        self.audio_cache_root = self.cache_root
        self.audio_cache_root.mkdir(parents=True, exist_ok=True)

        logger.info(f"音频预处理器初始化完成，缓存目录: {self.audio_cache_root}")
        self._initialized = True

    async def ensure_audio_track(
        self,
        input_file: str | Path,
        profile: AudioTrackProfile,
        progress_callback=None,
    ) -> str:
        """
        确保音频轨道可用

        Args:
            input_file: 输入文件路径
            profile: 音频转码配置
            progress_callback: 进度回调函数 (percent: float, stage: str) -> None

        Returns:
            str: 音频轨道标识符
        """
        input_path = Path(input_file)
        if not input_path.exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")

        # 计算哈希值
        asset_hash = calculate_asset_hash(input_path)
        profile_hash = calculate_profile_hash(profile.to_dict(), profile.version)

        # 检查缓存
        cache_key = (asset_hash, profile_hash)
        if await self._check_cache_hit(cache_key):
            logger.info(f"音频轨道 {asset_hash[:8]} 缓存命中")
            return f"audio_track_{asset_hash}_{profile_hash}"

        # 检查是否正在处理
        if cache_key in self.running_tracks:
            track = self.running_tracks[cache_key]
            logger.info(f"音频轨道 {asset_hash[:8]} 正在处理中，等待完成...")

            # 等待处理完成
            while track.is_processing:
                await asyncio.sleep(0.1)

            if track.is_completed:
                return f"audio_track_{asset_hash}_{profile_hash}"
            raise RuntimeError(f"音频轨道处理失败: {track.error_message}")

        # 启动新的音频处理任务
        return await self._start_audio_processing(
            input_path,
            asset_hash,
            profile_hash,
            profile,
            progress_callback,
        )

    async def _check_cache_hit(self, cache_key: tuple[str, str]) -> bool:
        """检查缓存命中"""
        await self._ensure_cache_loaded()

        if cache_key not in self.track_cache:
            return False

        cache = self.track_cache[cache_key]
        if not cache.is_valid():
            # 缓存无效，移除
            del self.track_cache[cache_key]
            return False

        # 更新访问信息
        cache.update_access()
        await self._save_cache_metadata(cache)
        return True

    async def _start_audio_processing(
        self,
        input_file: Path,
        asset_hash: str,
        profile_hash: str,
        profile: AudioTrackProfile,
        progress_callback=None,
    ) -> str:
        """启动音频处理任务"""
        # 获取视频信息以确定时长
        video_info = await self._get_video_info(input_file)
        duration = video_info.get("duration", 0.0)

        if duration <= 0:
            raise RuntimeError(f"无法获取视频时长: {input_file}")

        # 创建输出目录
        output_dir = self.audio_cache_root / asset_hash / profile_hash
        output_dir.mkdir(parents=True, exist_ok=True)

        # 创建音频轨道
        track = AudioTrack(
            asset_hash=asset_hash,
            profile_hash=profile_hash,
            input_file=input_file,
            output_dir=output_dir,
            duration=duration,
            profile=profile,
        )

        cache_key = (asset_hash, profile_hash)
        self.running_tracks[cache_key] = track

        try:
            # 执行音频处理
            await self._process_audio_track(track, progress_callback)

            if track.is_completed:
                # 添加到缓存索引
                cache = AudioTrackCache(
                    asset_hash=asset_hash,
                    profile_hash=profile_hash,
                    track_dir=output_dir,
                    duration=duration,
                    total_size=track.total_size,
                )
                self.track_cache[cache_key] = cache
                await self._save_cache_metadata(cache)

                return f"audio_track_{asset_hash}_{profile_hash}"
            raise RuntimeError(f"音频处理失败: {track.error_message}")

        finally:
            # 清理运行状态
            if cache_key in self.running_tracks:
                del self.running_tracks[cache_key]

    async def _process_audio_track(
        self, track: AudioTrack, progress_callback=None
    ) -> None:
        """处理音频轨道（仅转码，不分片）"""
        async with self.task_semaphore:  # 控制并发数
            try:
                track.start_processing()

                # 第一步：提取完整音频轨道
                await self._extract_audio_track(track, progress_callback)

                # 第二步：保存元数据
                await self._save_track_metadata(track)

                track.complete_processing()
                logger.info(
                    f"音频轨道处理完成: {track.asset_hash[:8]}, 完整音频文件已生成"
                )

            except Exception as e:
                track.fail_processing(str(e))
                logger.error(f"音频轨道处理失败: {e}")
                raise

    async def _extract_audio_track(
        self, track: AudioTrack, progress_callback=None
    ) -> None:
        """提取完整音频轨道（带实时进度监控）"""
        profile = track.profile
        input_file = str(track.input_file)
        output_file = str(track.track_file_path)

        # 构建 FFmpeg 命令：只提取音频
        cmd_args = [
            self.config.app_settings.ffmpeg_path,
            "-hide_banner",
            "-y",  # 覆盖输出文件
            "-i",
            input_file,  # 输入文件
            "-vn",  # 禁用视频
            "-c:a",
            profile.codec,  # 音频编码器
            "-profile:a",
            profile.profile,  # AAC配置
            "-ar",
            str(profile.sample_rate),  # 采样率
            "-ac",
            str(profile.channels),  # 声道数
            "-b:a",
            profile.bitrate,  # 音频码率
            "-avoid_negative_ts",
            "disabled",  # 保持原始时间戳
            "-progress",
            "pipe:2",  # 输出进度信息到 stderr
            output_file,  # 输出文件
        ]

        logger.info(f"提取音频轨道: {' '.join(cmd_args)}")

        try:
            # 启动 FFmpeg 进程
            process = await asyncio.create_subprocess_exec(
                *cmd_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            # 实时读取 stderr 并解析进度
            stderr_lines = []
            last_progress_log = 0.0

            # 用于累积进度信息（因为每行只包含一个字段）
            current_progress = {"time": 0.0, "speed": 0.0}

            if process.stderr:
                async for line_bytes in process.stderr:
                    try:
                        line = line_bytes.decode("utf-8", errors="ignore").strip()
                        stderr_lines.append(line)

                        # 解析进度信息（键值对格式）
                        progress = parse_ffmpeg_progress(line)
                        if progress:
                            # 更新累积的进度信息
                            if "time" in progress:
                                current_progress["time"] = progress["time"]
                            if "speed" in progress:
                                current_progress["speed"] = progress["speed"]
                            if "bitrate" in progress:
                                current_progress["bitrate"] = progress["bitrate"]
                            if "size" in progress:
                                current_progress["size"] = progress["size"]

                            # 当有时间信息时，更新 track 进度
                            if current_progress["time"] > 0:
                                processed_time = current_progress["time"]
                                transcode_speed = current_progress.get("speed")

                                # 更新进度
                                track.update_progress(processed_time, transcode_speed)

                                # 调用进度回调（如果提供）
                                if progress_callback:
                                    # 音频预处理进度范围：5% ~ 85%（占80%份额）
                                    percent = (
                                        5.0 + (track.progress_percent / 100.0) * 80.0
                                    )
                                    await progress_callback(percent, "正在预处理音频")

                                # 定期打印日志（避免日志过多）
                                if processed_time - last_progress_log >= 5.0:
                                    eta_info = (
                                        f", 预计剩余: {track.eta_seconds:.0f}s"
                                        if track.eta_seconds
                                        else ""
                                    )
                                    logger.info(
                                        f"音频转码进度: {track.progress_percent:.1f}% "
                                        f"({track.processed_time:.1f}s/{track.duration:.1f}s), "
                                        f"速度: {track.transcode_speed:.2f}x{eta_info}"
                                    )
                                    last_progress_log = processed_time

                    except Exception as e:
                        logger.warning(f"解析 FFmpeg 输出失败: {e}")

            # 等待进程结束
            returncode = await process.wait()

            if returncode == 0:
                # 确保进度为 100%
                track.update_progress(track.duration, track.transcode_speed)

                # 验证输出文件
                if track.track_file_path.exists():
                    track.total_size = track.track_file_path.stat().st_size
                    logger.info(
                        f"音频轨道提取成功: {track.total_size} 字节, "
                        f"平均速度: {track.transcode_speed:.2f}x"
                    )
                else:
                    raise RuntimeError("音频轨道文件未生成")
            else:
                error_msg = (
                    "\n".join(stderr_lines[-10:])
                    if stderr_lines
                    else f"FFmpeg 返回代码: {returncode}"
                )
                raise RuntimeError(f"音频提取失败: {error_msg}")

        except Exception as e:
            logger.error(f"音频轨道提取失败: {e}")
            raise

    async def _get_video_info(self, input_file: Path) -> dict:
        """获取视频信息，特别是时长"""
        try:
            cmd_args = [
                self.config.app_settings.ffprobe_path,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
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
                if info.get("format"):
                    duration = float(info["format"].get("duration", 0))
                    return {"duration": duration}

            logger.warning(
                f"无法获取视频信息: {stderr.decode() if stderr else 'Unknown error'}"
            )

        except Exception as e:
            logger.error(f"获取视频信息失败: {e}")

        return {"duration": 0.0}

    async def _ensure_cache_loaded(self) -> None:
        """确保缓存索引已加载"""
        if self.cache_loaded:
            return

        logger.info("加载音频轨道缓存索引...")
        count = 0

        # 扫描缓存目录
        for asset_dir in self.audio_cache_root.iterdir():
            if not asset_dir.is_dir():
                continue

            for profile_dir in asset_dir.iterdir():
                if not profile_dir.is_dir():
                    continue

                track_file = profile_dir / "audio_track.aac"
                if not track_file.exists():
                    continue

                # 解析目录结构
                try:
                    asset_hash = asset_dir.name
                    profile_hash = profile_dir.name

                    # 加载元数据
                    cache = await self._load_cache_metadata(
                        asset_hash,
                        profile_hash,
                        profile_dir,
                    )

                    cache_key = (asset_hash, profile_hash)
                    self.track_cache[cache_key] = cache
                    count += 1
                except Exception as e:
                    logger.warning(f"加载音频轨道缓存失败 {profile_dir}: {e}")

        self.cache_loaded = True
        logger.info(f"音频轨道缓存索引加载完成，共 {count} 个轨道")

    async def _load_cache_metadata(
        self,
        asset_hash: str,
        profile_hash: str,
        track_dir: Path,
    ) -> AudioTrackCache:
        """加载缓存元数据"""
        meta_file = track_dir / "audio_track.meta.json"

        # 尝试从 meta 文件加载
        if meta_file.exists():
            try:
                with meta_file.open() as f:
                    meta = json.load(f)
                cache = AudioTrackCache(
                    asset_hash=asset_hash,
                    profile_hash=profile_hash,
                    track_dir=track_dir,
                    **meta,
                )

                # 计算总大小（如果未设置）
                if cache.total_size == 0:
                    cache.total_size = await self._calculate_dir_size(track_dir)

                return cache
            except Exception as e:
                logger.warning(f"读取音频轨道元数据失败 {meta_file}: {e}")

        # Fallback: meta 文件不存在，从实际文件生成缓存信息
        logger.info(f"元数据文件不存在，从实际文件重建缓存信息: {track_dir}")
        track_file = track_dir / "audio_track.aac"

        if not track_file.exists():
            raise FileNotFoundError(f"音频轨道文件不存在: {track_file}")

        # 获取视频信息以获取时长
        # 从目录结构推断原始文件路径（这里需要从实际音频文件获取时长）
        duration = 0.0
        try:
            # 使用 ffprobe 获取音频文件时长
            cmd_args = [
                self.config.app_settings.ffprobe_path,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                str(track_file),
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, _ = await process.communicate()

            if process.returncode == 0 and stdout:
                info = json.loads(stdout.decode())
                if info.get("format"):
                    duration = float(info["format"].get("duration", 0))
        except Exception as e:
            logger.warning(f"无法获取音频文件时长 {track_file}: {e}")

        # 获取文件大小
        total_size = track_file.stat().st_size
        created_at = track_file.stat().st_mtime

        # 创建缓存对象
        cache = AudioTrackCache(
            asset_hash=asset_hash,
            profile_hash=profile_hash,
            track_dir=track_dir,
            duration=duration,
            total_size=total_size,
            created_at=created_at,
            last_access=time.time(),
            hit_count=0,
        )

        # 保存元数据以便下次使用
        await self._save_cache_metadata(cache)
        logger.info(
            f"重建元数据完成: {track_dir}, 时长={duration:.1f}s, 大小={total_size}"
        )

        return cache

    async def _save_cache_metadata(self, cache: AudioTrackCache) -> None:
        """保存缓存元数据"""
        meta_file = cache.track_dir / "audio_track.meta.json"

        try:
            meta = {
                "duration": cache.duration,
                "total_size": cache.total_size,
                "hit_count": cache.hit_count,
                "last_access": cache.last_access,
                "created_at": cache.created_at,
            }

            # 原子性写入
            temp_file = meta_file.with_suffix(".tmp")
            async with aiofiles.open(temp_file, "w") as f:
                await f.write(json.dumps(meta, indent=2))

            temp_file.rename(meta_file)

        except Exception as e:
            logger.warning(f"保存音频轨道元数据失败 {meta_file}: {e}")

    async def _save_track_metadata(self, track: AudioTrack) -> None:
        """保存轨道元数据"""
        meta_file = track.metadata_file_path

        try:
            meta = {
                "asset_hash": track.asset_hash,
                "profile_hash": track.profile_hash,
                "duration": track.duration,
                "total_size": track.total_size,
                "profile": track.profile.to_dict(),
                "created_at": track.created_at,
                "completed_at": track.completed_at,
            }

            # 原子性写入
            temp_file = meta_file.with_suffix(".tmp")
            async with aiofiles.open(temp_file, "w") as f:
                await f.write(json.dumps(meta, indent=2))

            temp_file.rename(meta_file)

        except Exception as e:
            logger.warning(f"保存轨道元数据失败 {meta_file}: {e}")

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

    async def get_track_progress(
        self, asset_hash: str, profile_hash: str
    ) -> dict | None:
        """
        获取音频轨道转码进度

        Args:
            asset_hash: 资产哈希
            profile_hash: 配置哈希

        Returns:
            dict: 进度信息，如果轨道不存在或已完成则返回 None
        """
        cache_key = (asset_hash, profile_hash)

        # 检查是否正在处理
        if cache_key in self.running_tracks:
            track = self.running_tracks[cache_key]
            return {
                "status": track.status.value,
                "progress_percent": track.progress_percent,
                "processed_time": track.processed_time,
                "total_duration": track.duration,
                "transcode_speed": track.transcode_speed,
                "eta_seconds": track.eta_seconds,
                "error_message": track.error_message,
            }

        # 检查缓存
        await self._ensure_cache_loaded()
        if cache_key in self.track_cache:
            return {
                "status": "completed",
                "progress_percent": 100.0,
                "processed_time": self.track_cache[cache_key].duration,
                "total_duration": self.track_cache[cache_key].duration,
                "transcode_speed": 0.0,
                "eta_seconds": 0.0,
                "error_message": None,
            }

        return None

    async def get_track_stats(self) -> AudioTrackStats:
        """获取音频轨道统计信息"""
        await self._ensure_cache_loaded()

        if not self.track_cache:
            return AudioTrackStats()

        caches = list(self.track_cache.values())
        total_tracks = len(caches)
        total_size = sum(c.total_size for c in caches)
        total_hits = sum(c.hit_count for c in caches)
        avg_size = total_size / total_tracks if total_tracks > 0 else 0

        # 计算最老轨道年龄
        oldest_age = 0.0
        if caches:
            oldest_age = max(c.get_age_seconds() for c in caches)

        return AudioTrackStats(
            total_tracks=total_tracks,
            total_size_bytes=total_size,
            total_hit_count=total_hits,
            avg_track_size=avg_size,
            oldest_track_age=oldest_age,
        )

    async def cleanup_expired_tracks(self, max_age_hours: int | None = None) -> int:
        """清理过期的音频轨道"""
        await self._ensure_cache_loaded()

        max_age_hours = max_age_hours or self.config.app_settings.audio_track_ttl_hours
        max_age_seconds = max_age_hours * 3600
        removed_count = 0

        # 找出过期的轨道
        expired_keys = []
        for cache_key, cache in self.track_cache.items():
            if cache.get_age_seconds() > max_age_seconds:
                expired_keys.append(cache_key)

        # 删除过期轨道
        for cache_key in expired_keys:
            cache = self.track_cache[cache_key]
            try:
                if cache.track_dir.exists():
                    shutil.rmtree(cache.track_dir)
                del self.track_cache[cache_key]
                removed_count += 1
                logger.info(f"删除过期音频轨道: {cache.track_dir}")
            except Exception as e:
                logger.error(f"删除音频轨道失败 {cache.track_dir}: {e}")

        if removed_count > 0:
            logger.info(f"清理完成，删除 {removed_count} 个过期音频轨道")

        return removed_count

    async def get_audio_playlist(
        self, asset_hash: str, profile_hash: str
    ) -> str | None:
        """
        生成音频轨道的HLS播放列表（单文件）

        Args:
            asset_hash: 资产哈希
            profile_hash: 配置哈希

        Returns:
            str: m3u8播放列表内容，如果轨道不存在则返回None
        """
        try:
            await self._ensure_cache_loaded()
            cache_key = (asset_hash, profile_hash)

            if cache_key not in self.track_cache:
                logger.warning(f"音频轨道不存在: {asset_hash}/{profile_hash}")
                return None

            cache = self.track_cache[cache_key]

            # 检查轨道是否有效
            if not cache.is_valid():
                logger.warning(f"音频轨道无效: {asset_hash}/{profile_hash}")
                return None

            # 更新访问信息
            cache.update_access()
            await self._save_cache_metadata(cache)

            # 生成包含单个完整音频文件的m3u8播放列表
            audio_file_url = f"/api/v1/audio/{asset_hash}/{profile_hash}/audio.aac"

            # 生成m3u8播放列表
            lines = [
                "#EXTM3U",
                "#EXT-X-VERSION:6",
                f"#EXT-X-TARGETDURATION:{int(cache.duration) + 1}",
                "#EXT-X-PLAYLIST-TYPE:VOD",
                "#EXT-X-MEDIA-SEQUENCE:0",
                f"#EXTINF:{cache.duration:.6f},",
                audio_file_url,
                "#EXT-X-ENDLIST",
            ]

            logger.debug(f"生成音频播放列表: 单个文件，总时长{cache.duration:.1f}s")
            return "\n".join(lines)

        except Exception as e:
            logger.error(f"生成音频播放列表失败: {e}")
            return None

    def shutdown(self) -> None:
        """关闭音频预处理器"""
        logger.info("音频预处理器正在关闭...")

        # 取消所有运行中的任务
        for track in self.running_tracks.values():
            track.cleanup()

        self.running_tracks.clear()
        logger.info("音频预处理器已关闭")

    async def start_background_tasks(self) -> None:
        """启动后台任务"""
        # 启动缓存清理任务
        asyncio.create_task(self._background_cleanup_task())

    async def _background_cleanup_task(self) -> None:
        """后台缓存清理任务"""
        while True:
            try:
                await asyncio.sleep(3600)  # 每小时清理一次
                removed_count = await self.cleanup_expired_tracks()
                if removed_count > 0:
                    logger.info(f"后台清理完成，删除 {removed_count} 个过期音频轨道")
            except Exception as e:
                logger.error(f"后台清理任务失败: {e}")
                await asyncio.sleep(300)  # 出错后5分钟重试
