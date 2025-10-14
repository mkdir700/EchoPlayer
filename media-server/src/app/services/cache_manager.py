"""
HLS 缓存管理器
实现 LRU 清理策略和缓存配额管理
"""

import asyncio
import logging
import shutil
import time

from app.models.window import CacheStats, WindowCache

logger = logging.getLogger(__name__)


class CacheManager:
    """缓存管理器"""

    _instance = None
    _initilized = False

    def __new__(cls, *args, **kwargs):  # noqa: ARG004
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        max_windows: int = 3000,
        max_size_bytes: int = 10 * 1024 * 1024 * 1024,  # 10GB
        cleanup_interval: int = 300,  # 5分钟
    ):
        if self._initilized:
            return
        self.max_windows = max_windows
        self.max_size_bytes = max_size_bytes
        self.cleanup_interval = cleanup_interval
        self._cleanup_task: asyncio.Task | None = None
        self._running = False

        logger.info(
            f"缓存管理器初始化 - 最大窗口数: {max_windows}, "
            f"最大大小: {max_size_bytes / (1024**3):.1f}GB, "
            f"清理间隔: {cleanup_interval}s"
        )
        self._initilized = True

    def start_background_cleanup(self, jit_transcoder) -> None:
        """启动后台清理任务"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._running = True
            self._cleanup_task = asyncio.create_task(
                self._background_cleanup_loop(jit_transcoder)
            )
            logger.info("后台缓存清理任务已启动")

    def stop_background_cleanup(self) -> None:
        """停止后台清理任务"""
        self._running = False
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            logger.info("后台缓存清理任务已停止")

    async def _background_cleanup_loop(self, jit_transcoder) -> None:
        """后台清理循环"""
        while self._running:
            try:
                await asyncio.sleep(self.cleanup_interval)
                if self._running:
                    await self.enforce_cache_limits(jit_transcoder)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"后台缓存清理出错: {e}")

    async def enforce_cache_limits(self, jit_transcoder) -> tuple[int, int]:
        """
        执行缓存限制

        Args:
            jit_transcoder: JIT转码器实例

        Returns:
            Tuple[int, int]: (删除的窗口数, 释放的字节数)
        """
        await jit_transcoder._ensure_cache_loaded()

        cache_index = jit_transcoder.cache_index
        if not cache_index:
            return 0, 0

        total_windows = len(cache_index)
        total_bytes = sum(cache.file_size_bytes for cache in cache_index.values())

        removed_windows = 0
        freed_bytes = 0

        # 检查是否需要清理
        if total_windows <= self.max_windows and total_bytes <= self.max_size_bytes:
            return removed_windows, freed_bytes

        logger.info(
            f"开始缓存清理 - 当前: {total_windows} 窗口, {total_bytes / (1024**3):.2f}GB"
        )

        # 获取 LRU 候选列表
        candidates = self._get_lru_candidates(cache_index)

        # 计算需要删除的数量
        windows_to_remove = max(0, total_windows - self.max_windows)
        bytes_to_remove = max(0, total_bytes - self.max_size_bytes)

        # 执行清理
        for cache_key, cache in candidates:
            if windows_to_remove <= 0 and bytes_to_remove <= 0:
                break

            try:
                # 删除缓存目录
                if cache.cache_dir.exists():
                    cache_size = cache.file_size_bytes
                    shutil.rmtree(cache.cache_dir)

                    # 从索引中移除
                    del cache_index[cache_key]

                    removed_windows += 1
                    freed_bytes += cache_size
                    windows_to_remove -= 1
                    bytes_to_remove -= cache_size

                    logger.debug(
                        f"删除缓存窗口: {cache_key}, 大小: {cache_size / (1024**2):.1f}MB"
                    )

            except Exception as e:
                logger.error(f"删除缓存失败 {cache.cache_dir}: {e}")

        if removed_windows > 0:
            logger.info(
                f"缓存清理完成 - 删除 {removed_windows} 个窗口, "
                f"释放 {freed_bytes / (1024**3):.2f}GB 空间"
            )

        return removed_windows, freed_bytes

    def _get_lru_candidates(
        self, cache_index: dict
    ) -> list[tuple[tuple[str, str, int], WindowCache]]:
        """
        获取 LRU 候选列表（按最少使用顺序排序）

        Args:
            cache_index: 缓存索引字典

        Returns:
            List: 按LRU顺序排序的缓存条目列表
        """
        # 按以下优先级排序（从最应该删除到最不应该删除）：
        # 1. 最后访问时间（升序，越久越优先删除）
        # 2. 命中次数（升序，命中少的优先删除）
        # 3. 创建时间（升序，越老越优先删除）

        candidates = list(cache_index.items())

        candidates.sort(
            key=lambda x: (
                x[1].last_access,  # 最后访问时间
                x[1].hit_count,  # 命中次数
                x[1].created_at,  # 创建时间
            )
        )

        return candidates

    async def cleanup_by_age(self, jit_transcoder, max_age_hours: int = 24) -> int:
        """
        按年龄清理缓存

        Args:
            jit_transcoder: JIT转码器实例
            max_age_hours: 最大缓存年龄（小时）

        Returns:
            int: 删除的窗口数
        """
        await jit_transcoder._ensure_cache_loaded()

        cache_index = jit_transcoder.cache_index
        if not cache_index:
            return 0

        max_age_seconds = max_age_hours * 3600
        current_time = time.time()
        removed_count = 0

        # 找出过期的缓存
        expired_keys = []
        for cache_key, cache in cache_index.items():
            age_seconds = current_time - cache.created_at
            if age_seconds > max_age_seconds:
                expired_keys.append((cache_key, cache))

        # 删除过期缓存
        for cache_key, cache in expired_keys:
            try:
                if cache.cache_dir.exists():
                    shutil.rmtree(cache.cache_dir)
                del cache_index[cache_key]
                removed_count += 1
                logger.debug(f"删除过期缓存: {cache.cache_dir}")
            except Exception as e:
                logger.error(f"删除过期缓存失败 {cache.cache_dir}: {e}")

        if removed_count > 0:
            logger.info(f"年龄清理完成，删除 {removed_count} 个过期缓存")

        return removed_count

    async def cleanup_by_pattern(
        self, jit_transcoder, asset_hash: str | None = None
    ) -> tuple[int, int]:
        """
        按模式清理缓存

        Args:
            jit_transcoder: JIT转码器实例
            asset_hash: 指定资产哈希（如果提供，只清理该资产的缓存）

        Returns:
            tuple[int, int]: (删除的窗口数, 释放的字节数)
        """
        await jit_transcoder._ensure_cache_loaded()

        cache_index = jit_transcoder.cache_index
        if not cache_index:
            return 0, 0

        removed_count = 0
        freed_bytes = 0
        keys_to_remove = []

        for cache_key, cache in cache_index.items():
            cache_asset_hash, _, _ = cache_key

            # 如果指定了asset_hash，只处理匹配的缓存
            if asset_hash is not None and cache_asset_hash != asset_hash:
                continue

            keys_to_remove.append((cache_key, cache))

        # 删除匹配的缓存
        for cache_key, cache in keys_to_remove:
            try:
                if cache.cache_dir.exists():
                    # 先记录文件大小
                    cache_size = cache.file_size_bytes
                    shutil.rmtree(cache.cache_dir)

                    # 从索引中移除
                    del cache_index[cache_key]
                    removed_count += 1
                    freed_bytes += cache_size
                    logger.debug(
                        f"删除模式匹配缓存: {cache.cache_dir}, 大小: {cache_size / (1024**2):.1f}MB"
                    )
            except Exception as e:
                logger.error(f"删除模式匹配缓存失败 {cache.cache_dir}: {e}")

        if removed_count > 0:
            pattern_desc = f"资产 {asset_hash}" if asset_hash else "所有"
            logger.info(
                f"模式清理完成，删除 {removed_count} 个 {pattern_desc} 缓存，释放 {freed_bytes / (1024**3):.2f}GB 空间"
            )

        return removed_count, freed_bytes

    async def get_detailed_stats(self, jit_transcoder) -> CacheStats:
        """
        获取详细的缓存统计信息

        Args:
            jit_transcoder: JIT转码器实例

        Returns:
            CacheStats: 缓存统计信息
        """
        await jit_transcoder._ensure_cache_loaded()

        cache_index = jit_transcoder.cache_index
        if not cache_index:
            return CacheStats()

        caches = list(cache_index.values())
        total_windows = len(caches)
        total_size = sum(c.file_size_bytes for c in caches)
        total_hits = sum(c.hit_count for c in caches)

        # 计算平均值
        avg_size = total_size / total_windows if total_windows > 0 else 0.0

        # 计算缓存命中率（假设每次访问都是潜在的命中）
        cache_hit_rate = 0.0
        if total_hits > 0:
            # 简单估算：命中率 = 总命中数 / (总命中数 + 窗口数)
            # 这里假设每个窗口至少被请求过一次
            cache_hit_rate = total_hits / (total_hits + total_windows)

        # 找出最老的窗口
        oldest_age = 0.0
        if caches:
            current_time = time.time()
            oldest_age = max(current_time - c.created_at for c in caches)

        # 计算 LRU 候选数量（需要清理的窗口）
        lru_candidates = 0
        if total_windows > self.max_windows:
            lru_candidates = total_windows - self.max_windows

        # 如果超过大小限制，可能需要更多候选
        if total_size > self.max_size_bytes:
            # 估算需要删除多少个窗口来满足大小限制
            bytes_to_free = total_size - self.max_size_bytes
            avg_window_size = (
                avg_size if avg_size > 0 else (100 * 1024 * 1024)
            )  # 默认100MB
            size_based_candidates = int(bytes_to_free / avg_window_size) + 1
            lru_candidates = max(lru_candidates, size_based_candidates)

        return CacheStats(
            total_windows=total_windows,
            total_size_bytes=total_size,
            total_hit_count=total_hits,
            avg_window_size=avg_size,
            cache_hit_rate=cache_hit_rate,
            oldest_window_age=oldest_age,
            lru_candidates=lru_candidates,
        )

    def get_config(self) -> dict:
        """获取缓存管理器配置"""
        return {
            "max_windows": self.max_windows,
            "max_size_bytes": self.max_size_bytes,
            "max_size_gb": round(self.max_size_bytes / (1024**3), 2),
            "cleanup_interval": self.cleanup_interval,
            "is_running": self._running,
        }

    def update_config(
        self,
        max_windows: int | None = None,
        max_size_bytes: int | None = None,
        cleanup_interval: int | None = None,
    ) -> None:
        """更新缓存管理器配置"""
        if max_windows is not None:
            self.max_windows = max_windows
            logger.info(f"更新最大窗口数: {max_windows}")

        if max_size_bytes is not None:
            self.max_size_bytes = max_size_bytes
            logger.info(f"更新最大大小: {max_size_bytes / (1024**3):.1f}GB")

        if cleanup_interval is not None:
            self.cleanup_interval = cleanup_interval
            logger.info(f"更新清理间隔: {cleanup_interval}s")
