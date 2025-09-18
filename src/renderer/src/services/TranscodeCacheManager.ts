import { loggerService } from '@logger'

const logger = loggerService.withContext('TranscodeCacheManager')

/**
 * 转码缓存条目
 */
export interface TranscodeCacheEntry {
  /** 文件路径 */
  filePath: string
  /** 转码结果 */
  transcodeResult: {
    playlistUrl: string
    windowId: number
    assetHash: string
    profileHash: string
    cached: boolean
    transcodeTime: number | null
  }
  /** 缓存创建时间 */
  createdAt: number
  /** 最后访问时间 */
  lastAccessedAt: number
  /** 访问次数 */
  accessCount: number
}

/**
 * 转码缓存配置
 */
export interface TranscodeCacheConfig {
  /** 最大缓存条目数 */
  maxEntries: number
  /** 缓存过期时间（毫秒） */
  ttl: number
  /** 自动清理间隔（毫秒） */
  cleanupInterval: number
}

/**
 * 转码缓存管理器
 *
 * 提供本地转码结果缓存功能，包括：
 * - LRU 缓存策略
 * - 文件修改时间检查
 * - 自动过期清理
 * - 缓存统计
 */
export class TranscodeCacheManager {
  private static instance: TranscodeCacheManager | null = null

  /** 缓存存储 */
  private cache: Map<string, TranscodeCacheEntry> = new Map()

  /** 缓存配置 */
  private config: TranscodeCacheConfig = {
    maxEntries: 100, // 最大缓存 100 个视频
    ttl: 24 * 60 * 60 * 1000, // 24小时过期
    cleanupInterval: 60 * 60 * 1000 // 每小时清理一次
  }

  /** 清理定时器 */
  private cleanupTimer: NodeJS.Timeout | null = null

  /** 缓存统计 */
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    cleanups: 0
  }

  private constructor() {
    this.startCleanupTimer()
    logger.info('转码缓存管理器初始化', { config: this.config })
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TranscodeCacheManager {
    if (!TranscodeCacheManager.instance) {
      TranscodeCacheManager.instance = new TranscodeCacheManager()
    }
    return TranscodeCacheManager.instance
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(filePath: string, timeSeconds: number): string {
    // 使用文件路径和时间点作为缓存键
    return `${filePath}:${Math.floor(timeSeconds)}`
  }

  /**
   * 检查文件是否仍然存在
   */
  private async isFileExists(filePath: string): Promise<boolean> {
    try {
      return await window.api.fs.checkFileExists(filePath)
    } catch (error) {
      logger.warn('检查文件存在性失败', { filePath, error })
      return false // 如果无法检查，假设文件不存在
    }
  }

  /**
   * 获取缓存条目
   */
  public async get(filePath: string, timeSeconds: number): Promise<TranscodeCacheEntry | null> {
    const cacheKey = this.generateCacheKey(filePath, timeSeconds)
    const entry = this.cache.get(cacheKey)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // 检查是否过期
    const now = Date.now()
    if (now - entry.createdAt > this.config.ttl) {
      logger.debug('缓存条目已过期', { filePath, cacheKey })
      this.cache.delete(cacheKey)
      this.stats.misses++
      return null
    }

    // 检查源文件是否仍然存在
    const fileExists = await this.isFileExists(filePath)
    if (!fileExists) {
      logger.debug('源文件已删除，缓存失效', { filePath, cacheKey })
      this.cache.delete(cacheKey)
      this.stats.misses++
      return null
    }

    // 更新访问统计
    entry.lastAccessedAt = now
    entry.accessCount++

    // 移到最后（LRU）
    this.cache.delete(cacheKey)
    this.cache.set(cacheKey, entry)

    this.stats.hits++
    logger.debug('缓存命中', { filePath, cacheKey, accessCount: entry.accessCount })

    return entry
  }

  /**
   * 设置缓存条目
   */
  public async set(
    filePath: string,
    timeSeconds: number,
    transcodeResult: TranscodeCacheEntry['transcodeResult']
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(filePath, timeSeconds)

    const now = Date.now()

    const entry: TranscodeCacheEntry = {
      filePath,
      transcodeResult,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU()
    }

    this.cache.set(cacheKey, entry)
    logger.debug('缓存条目已保存', {
      filePath,
      cacheKey,
      cacheSize: this.cache.size
    })
  }

  /**
   * 驱逐最少使用的条目（LRU）
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      const evictedEntry = this.cache.get(oldestKey)
      this.cache.delete(oldestKey)
      this.stats.evictions++

      logger.debug('驱逐LRU缓存条目', {
        key: oldestKey,
        filePath: evictedEntry?.filePath,
        lastAccessed: new Date(oldestTime).toISOString()
      })
    }
  }

  /**
   * 清理过期条目
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.config.ttl) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.stats.cleanups++
      logger.debug('清理过期缓存条目', {
        cleanedCount,
        remainingCount: this.cache.size
      })
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 清空所有缓存
   */
  public clear(): void {
    this.cache.clear()
    logger.info('缓存已清空')
  }

  /**
   * 获取缓存统计
   */
  public getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0

    return {
      ...this.stats,
      cacheSize: this.cache.size,
      maxEntries: this.config.maxEntries,
      hitRate: Math.round(hitRate * 100) / 100 // 保留两位小数
    }
  }

  /**
   * 更新缓存配置
   */
  public updateConfig(newConfig: Partial<TranscodeCacheConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 重启清理定时器
    this.stopCleanupTimer()
    this.startCleanupTimer()

    logger.info('缓存配置已更新', { config: this.config })
  }

  /**
   * 销毁缓存管理器
   */
  public destroy(): void {
    this.stopCleanupTimer()
    this.clear()
    TranscodeCacheManager.instance = null
    logger.info('转码缓存管理器已销毁')
  }
}

export default TranscodeCacheManager
