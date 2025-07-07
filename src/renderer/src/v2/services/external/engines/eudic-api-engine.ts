/**
 * 欧陆词典API引擎 / Eudic API Dictionary Engine
 *
 * 基于官方API的欧陆词典服务
 * Official API-based Eudic dictionary service
 */

import { BaseDictionaryEngine } from './base-dictionary-engine'
import {
  DictionaryQueryResult,
  DictionaryServiceStatus,
  DictionaryTestResult,
  DictionaryConfig
} from '../../../infrastructure/types/service/dictionary.types'

/**
 * 欧陆词典API引擎实现 / Eudic API Engine Implementation
 */
export class EudicApiEngine extends BaseDictionaryEngine {
  private readonly baseUrl = 'https://api.frdic.com/api/open/v1'

  constructor(config: DictionaryConfig) {
    super('欧陆词典 / Eudic Dictionary', 'eudic', config)
  }

  /**
   * 验证配置 / Validate Configuration
   * 仅在需要使用API时检查 / Only check when API usage is required
   */
  protected validateConfig(): boolean {
    return true // 在初始化时不检查，在实际使用时检查 / Don't check during initialization, check during actual usage
  }

  /**
   * 检查API Key是否有效 / Check if API Key is valid
   */
  private validateApiKey(): boolean {
    return !!this._config.apiKey && this._config.apiKey.length >= 10 // 至少需要10个字符的有效API Key / At least 10 characters for valid API Key
  }

  /**
   * 测试连接 / Test Connection
   */
  async testConnection(): Promise<DictionaryTestResult> {
    if (!this.validateApiKey()) {
      return {
        success: false,
        message: '请先配置欧陆词典 API Token / Please configure Eudic API Token first'
      }
    }

    try {
      const startTime = Date.now()

      // 使用用户单词本接口测试连接 / Use user wordbook interface to test connection
      const result = await window.api.dictionary.eudicRequest(`${this.baseUrl}/studylist/words`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this._config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      const responseTime = Date.now() - startTime

      if (result.success) {
        return {
          success: true,
          message: '欧陆词典 API 连接测试成功！ / Eudic API connection test successful!',
          responseTime
        }
      } else {
        const errorMessage = this.mapErrorMessage(result.error || '未知错误 / Unknown error')
        return {
          success: false,
          message: errorMessage,
          error: result.error,
          responseTime
        }
      }
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  /**
   * 查询单词实现 / Query Word Implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onQueryWord(word: string, _context?: string): Promise<DictionaryQueryResult> {
    if (!this.validateApiKey()) {
      throw this.createError(
        '请先配置欧陆词典 API Token / Please configure Eudic API Token first',
        'CONFIG_REQUIRED'
      )
    }

    try {
      const result = await window.api.dictionary.eudicRequest(
        `${this.baseUrl}/studylist/words/${encodeURIComponent(word)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this._config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (result.success && result.data) {
        return this.parseEudicResponse(word, result.data)
      } else {
        const errorMessage = this.mapErrorToChineseMessage(
          result.error || '查词失败 / Word query failed'
        )
        throw this.createError(errorMessage, 'QUERY_FAILED')
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }

      throw this.createError(
        `网络请求失败: ${error instanceof Error ? error.message : '未知错误'} / Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR'
      )
    }
  }

  /**
   * 解析欧陆词典API响应 / Parse Eudic API Response
   */
  private parseEudicResponse(word: string, data: unknown): DictionaryQueryResult {
    try {
      // 根据欧陆词典API响应格式解析数据 / Parse data according to Eudic API response format
      // 这里需要根据实际的API响应格式进行调整 / This needs to be adjusted according to the actual API response format
      const responseData = data as {
        phonetic?: string
        pronunciations?: Array<{
          type: 'us' | 'uk' | 'general'
          phonetic: string
          audioUrl?: string
        }>
        definitions?: Array<{
          partOfSpeech?: string
          meaning: string
          examples?: string[]
        }>
        translations?: string[]
        synonyms?: string[]
        antonyms?: string[]
        etymology?: string
        frequency?: number
      }

      return {
        word,
        phonetic: responseData.phonetic,
        pronunciations: responseData.pronunciations,
        definitions: responseData.definitions || [],
        translations: responseData.translations,
        synonyms: responseData.synonyms,
        antonyms: responseData.antonyms,
        etymology: responseData.etymology,
        frequency: responseData.frequency,
        metadata: {
          source: this.engine,
          timestamp: Date.now(),
          cacheHit: false
        }
      }
    } catch (error) {
      console.error('Response data parsing failed:', error)
      throw this.createError('Response data parsing failed', 'PARSE_ERROR')
    }
  }

  /**
   * 获取服务状态 / Get Service Status
   */
  async getStatus(): Promise<DictionaryServiceStatus> {
    try {
      const testResult = await this.testConnection()

      const isRateLimited = testResult.error && testResult.error.includes('Rate limit')
      return {
        connected: testResult.success,
        authenticated: testResult.success,
        rateLimited: isRateLimited || false,
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
   * 映射错误消息到中文 / Map Error Message to Chinese
   */
  private mapErrorMessage(error: string): string {
    const errorMappings: Record<string, string> = {
      'Invalid API Key': 'API Key 验证失败 / API Key validation failed',
      'Quota exceeded': 'API 配额不足 / API quota insufficient',
      'Rate limit exceeded': '请求过于频繁 / Request too frequent'
    }

    return errorMappings[error] || `API 连接失败: ${error} / API connection failed: ${error}`
  }

  /**
   * 映射错误消息到中文（用于查词错误）/ Map Error Message to Chinese (for query errors)
   */
  private mapErrorToChineseMessage(error: string): string {
    const errorMappings: Record<string, string> = {
      'Invalid API Key': 'API Key 验证失败',
      'Quota exceeded': 'API 配额不足',
      'Rate limit exceeded': '请求过于频繁',
      'Word not found': '未找到单词'
    }

    return errorMappings[error] || error
  }
}
