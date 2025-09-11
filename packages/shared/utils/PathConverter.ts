/**
 * 优化的路径转换工具
 * 提供高性能的文件路径转换和验证功能
 */

export interface PathValidationResult {
  isValid: boolean
  localPath: string
  error?: string
  isConverted: boolean // 是否进行了转换
}

/**
 * 路径转换器
 * 优化的路径转换逻辑，减少重复操作和性能开销
 */
export class PathConverter {
  // 缓存转换结果，避免重复转换
  private static conversionCache = new Map<string, string>()

  // 缓存大小限制
  private static readonly MAX_CACHE_SIZE = 1000

  // 路径验证正则表达式（预编译）
  private static readonly FILE_URL_REGEX = /^file:\/\//
  private static readonly WINDOWS_DRIVE_REGEX = /^\/[A-Za-z]:/

  /**
   * 快速检查是否为 file:// URL
   */
  static isFileUrl(path: string): boolean {
    return this.FILE_URL_REGEX.test(path)
  }

  /**
   * 优化的路径转换方法
   * 带缓存和错误处理
   */
  static convertToLocalPath(inputPath: string): PathValidationResult {
    // 如果不是 file:// URL，直接返回
    if (!this.isFileUrl(inputPath)) {
      return {
        isValid: true,
        localPath: inputPath,
        isConverted: false
      }
    }

    // 检查缓存
    const cached = this.conversionCache.get(inputPath)
    if (cached !== undefined) {
      return {
        isValid: true,
        localPath: cached,
        isConverted: true
      }
    }

    try {
      const url = new URL(inputPath)
      let localPath = decodeURIComponent(url.pathname)

      // Windows 路径处理：移除开头的斜杠
      if (process.platform === 'win32' && this.WINDOWS_DRIVE_REGEX.test(localPath)) {
        localPath = localPath.substring(1)
      }

      // 添加到缓存（控制缓存大小）
      if (this.conversionCache.size >= this.MAX_CACHE_SIZE) {
        // 删除最老的缓存项（简单的 LRU）
        const firstKey = this.conversionCache.keys().next().value
        if (firstKey) {
          this.conversionCache.delete(firstKey)
        }
      }
      this.conversionCache.set(inputPath, localPath)

      return {
        isValid: true,
        localPath,
        isConverted: true
      }
    } catch (error) {
      return {
        isValid: false,
        localPath: inputPath,
        error: error instanceof Error ? error.message : String(error),
        isConverted: false
      }
    }
  }

  /**
   * 批量路径转换
   * 用于批量操作优化
   */
  static convertPaths(inputPaths: string[]): PathValidationResult[] {
    return inputPaths.map((path) => this.convertToLocalPath(path))
  }

  /**
   * 清除转换缓存
   */
  static clearCache(): void {
    this.conversionCache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): {
    size: number
    maxSize: number
    hitRatio: number
  } {
    // 简化的统计（在真实应用中可以添加更详细的统计）
    return {
      size: this.conversionCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRatio: 0 // 需要额外的计数器来实现
    }
  }

  /**
   * 验证路径有效性（不进行转换）
   */
  static validatePath(inputPath: string): boolean {
    if (!inputPath || typeof inputPath !== 'string') {
      return false
    }

    // 检查基本路径格式
    if (this.isFileUrl(inputPath)) {
      try {
        new URL(inputPath)
        return true
      } catch {
        return false
      }
    }

    // 检查本地路径（简单验证）
    return inputPath.length > 0 && !inputPath.includes('\0')
  }

  /**
   * 规范化路径
   * 统一路径格式，减少后续处理的复杂性
   */
  static normalizePath(inputPath: string): string {
    const result = this.convertToLocalPath(inputPath)
    if (!result.isValid) {
      return inputPath
    }

    let normalizedPath = result.localPath

    // 统一路径分隔符（Windows）
    if (process.platform === 'win32') {
      normalizedPath = normalizedPath.replace(/\//g, '\\')
    }

    return normalizedPath
  }

  /**
   * 生成缓存键
   * 用于其他需要缓存路径相关计算的场景
   */
  static generateCacheKey(inputPath: string, suffix?: string): string {
    const normalized = this.normalizePath(inputPath)
    return suffix ? `${normalized}:${suffix}` : normalized
  }
}

/**
 * 便捷函数
 */

/**
 * 快速转换单个路径
 */
export function convertToLocalPath(inputPath: string): string {
  const result = PathConverter.convertToLocalPath(inputPath)
  return result.localPath
}

/**
 * 快速验证路径
 */
export function isValidPath(inputPath: string): boolean {
  return PathConverter.validatePath(inputPath)
}

/**
 * 快速规范化路径
 */
export function normalizePath(inputPath: string): string {
  return PathConverter.normalizePath(inputPath)
}
