/**
 * 词典引擎基础类 / Base Dictionary Engine Class
 *
 * 为所有词典引擎提供基础功能和统一接口
 * Provides base functionality and unified interface for all dictionary engines
 */

import {
  DictionaryEngine,
  DictionaryConfig,
  DictionaryQueryResult,
  DictionaryServiceStatus,
  DictionaryTestResult
} from '../../../infrastructure/types/service/dictionary.types'

/**
 * 词典引擎基础抽象类 / Base Dictionary Engine Abstract Class
 */
export abstract class BaseDictionaryEngine {
  protected _config: DictionaryConfig
  protected _stats = {
    queries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageResponseTime: 0
  }

  constructor(
    public readonly name: string,
    public readonly engine: DictionaryEngine,
    config: DictionaryConfig
  ) {
    this._config = config
  }

  /**
   * 配置引擎 / Configure Engine
   */
  async configure(config: DictionaryConfig): Promise<void> {
    this._config = { ...this._config, ...config }
    await this.onConfigure()
  }

  /**
   * 测试连接 / Test Connection
   */
  abstract testConnection(): Promise<DictionaryTestResult>

  /**
   * 查询单词 / Query Word
   */
  async queryWord(word: string, context?: string): Promise<DictionaryQueryResult> {
    const startTime = Date.now()

    try {
      this._stats.queries++
      const result = await this.onQueryWord(word, context)

      const responseTime = Date.now() - startTime
      this._stats.successfulQueries++
      this._stats.averageResponseTime =
        (this._stats.averageResponseTime * (this._stats.successfulQueries - 1) + responseTime) /
        this._stats.successfulQueries

      return {
        ...result,
        metadata: {
          source: this.engine,
          timestamp: Date.now(),
          cacheHit: false,
          ...result.metadata
        }
      }
    } catch (error) {
      this._stats.failedQueries++
      throw error
    }
  }

  /**
   * 获取状态 / Get Status
   */
  abstract getStatus(): Promise<DictionaryServiceStatus>

  /**
   * 子类需要实现的配置逻辑 / Configuration logic to be implemented by subclasses
   */
  protected async onConfigure(): Promise<void> {
    // 默认实现为空 / Default implementation is empty
  }

  /**
   * 子类需要实现的查询逻辑 / Query logic to be implemented by subclasses
   */
  protected abstract onQueryWord(word: string, context?: string): Promise<DictionaryQueryResult>

  /**
   * 验证配置 / Validate Configuration
   */
  protected validateConfig(): boolean {
    return true // 默认验证通过 / Default validation passes
  }

  /**
   * 创建错误 / Create Error
   */
  protected createError(message: string, code?: string): Error & { code?: string } {
    const error = new Error(message) as Error & { code?: string }
    if (code) {
      error.code = code
    }
    return error
  }

  /**
   * 处理网络错误 / Handle Network Error
   */
  protected handleNetworkError(error: unknown): DictionaryTestResult {
    console.error(`${this.name} API error:`, error)
    return {
      success: false,
      message:
        '网络连接失败，请检查网络设置 / Network connection failed, please check network settings',
      error: error instanceof Error ? error.message : '未知错误 / Unknown error'
    }
  }

  /**
   * 获取统计信息 / Get Statistics
   */
  getStats(): typeof this._stats {
    return { ...this._stats }
  }
}
