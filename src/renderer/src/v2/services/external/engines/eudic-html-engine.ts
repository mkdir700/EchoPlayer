/**
 * 欧陆词典HTML引擎 / Eudic HTML Dictionary Engine
 *
 * 基于网页抓取的免费欧陆词典服务
 * Free Eudic dictionary service based on web scraping
 */

import { BaseDictionaryEngine } from './base-dictionary-engine'
import {
  DictionaryQueryResult,
  DictionaryServiceStatus,
  DictionaryTestResult,
  DictionaryConfig
} from '../../../infrastructure/types/service/dictionary.types'

/**
 * 欧陆词典HTML引擎实现 / Eudic HTML Engine Implementation
 */
export class EudicHtmlEngine extends BaseDictionaryEngine {
  constructor(config: DictionaryConfig) {
    super('欧陆词典 (网页版) / Eudic (Web Version)', 'eudic-html', config)
  }

  /**
   * 测试连接 / Test Connection
   */
  async testConnection(): Promise<DictionaryTestResult> {
    try {
      // 使用一个简单的查词请求来测试连接 / Use a simple word query to test connection
      const result = await this.onQueryWord('test')

      if (result.word) {
        return {
          success: true,
          message: '欧陆词典网页版连接测试成功！ / Eudic web version connection test successful!'
        }
      } else {
        return {
          success: false,
          message: '连接失败：无法获取查词结果 / Connection failed: Unable to get word query result'
        }
      }
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  /**
   * 查询单词实现 / Query Word Implementation
   */
  protected async onQueryWord(word: string, context?: string): Promise<DictionaryQueryResult> {
    try {
      // 调用IPC接口进行HTML解析查词 / Call IPC interface for HTML parsing word query
      const result = await window.api.dictionary.eudicHtmlRequest(word, context)

      if (result.success && result.data) {
        return {
          word: result.data.word,
          phonetic: result.data.phonetic,
          definitions: result.data.definitions || [],
          translations: result.data.translations,
          metadata: {
            source: this.engine,
            timestamp: Date.now(),
            cacheHit: false
          }
        }
      } else {
        throw this.createError(result.error || '查词失败 / Word query failed', 'QUERY_FAILED')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误 / Unknown error'
      throw this.createError(errorMessage, 'NETWORK_ERROR')
    }
  }

  /**
   * 获取服务状态 / Get Service Status
   */
  async getStatus(): Promise<DictionaryServiceStatus> {
    try {
      // HTML解析服务不需要认证，直接测试连接 / HTML parsing service doesn't require authentication, test connection directly
      const testResult = await this.testConnection()

      return {
        connected: testResult.success,
        authenticated: true, // HTML解析不需要认证 / HTML parsing doesn't require authentication
        rateLimited: false, // 网页抓取通常没有明显的速率限制 / Web scraping usually has no obvious rate limits
        lastError: testResult.success ? undefined : testResult.error
      }
    } catch (error) {
      return {
        connected: false,
        authenticated: false,
        rateLimited: false,
        lastError: error instanceof Error ? error.message : '未知错误 / Unknown error'
      }
    }
  }

  /**
   * 验证配置 / Validate Configuration
   */
  protected validateConfig(): boolean {
    // HTML解析服务不需要特殊配置 / HTML parsing service doesn't require special configuration
    return true
  }
}
