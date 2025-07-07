/**
 * 有道词典API引擎 / Youdao API Dictionary Engine
 *
 * 基于官方API的有道词典服务
 * Official API-based Youdao dictionary service
 */

import { BaseDictionaryEngine } from './base-dictionary-engine'
import {
  DictionaryQueryResult,
  DictionaryServiceStatus,
  DictionaryTestResult,
  DictionaryConfig
} from '../../../infrastructure/types/service/dictionary.types'

/**
 * 有道词典API引擎实现 / Youdao API Engine Implementation
 */
export class YoudaoApiEngine extends BaseDictionaryEngine {
  private readonly baseUrl = 'https://openapi.youdao.com/api'

  constructor(config: DictionaryConfig) {
    super('有道词典 / Youdao Dictionary', 'youdao', config)
  }

  /**
   * 验证配置 / Validate Configuration
   */
  protected validateConfig(): boolean {
    return !!(this._config.apiKey && this._config.apiSecret)
  }

  /**
   * 测试连接 / Test Connection
   */
  async testConnection(): Promise<DictionaryTestResult> {
    if (!this.validateConfig()) {
      return {
        success: false,
        message:
          '请先配置有道词典 API Key 和 Secret / Please configure Youdao API Key and Secret first'
      }
    }

    try {
      // 使用一个简单的翻译请求来测试连接 / Use a simple translation request to test connection
      const result = await this.onQueryWord('test')

      if (result.word) {
        return {
          success: true,
          message: '有道词典 API 连接测试成功！ / Youdao API connection test successful!'
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onQueryWord(word: string, _context?: string): Promise<DictionaryQueryResult> {
    if (!this.validateConfig()) {
      throw this.createError(
        '请先配置有道词典 API Key 和 Secret / Please configure Youdao API Key and Secret first',
        'CONFIG_REQUIRED'
      )
    }

    try {
      const params = await this.buildYoudaoParams(word)
      const result = await window.api.dictionary.youdaoRequest(this.baseUrl, params)

      if (result.success && result.data) {
        return this.parseYoudaoResponse(word, result.data)
      } else {
        throw this.createError(
          result.error || '查词请求失败 / Word query request failed',
          'QUERY_FAILED'
        )
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
   * 构建有道API参数 / Build Youdao API Parameters
   */
  private async buildYoudaoParams(word: string): Promise<Record<string, string>> {
    // 按照官方示例生成时间戳参数 / Generate timestamp parameters according to official examples
    const salt = new Date().getTime().toString()
    const curtime = Math.round(new Date().getTime() / 1000).toString()

    // 构建签名字符串：appKey + truncate(query) + salt + curtime + key
    // Build signature string: appKey + truncate(query) + salt + curtime + key
    // 与官方JS示例保持完全一致的顺序和格式 / Maintain exactly the same order and format as the official JS example
    const signStr =
      this._config.apiKey + this.truncateQuery(word) + salt + curtime + this._config.apiSecret!
    const sign = await this.sha256(signStr)

    // 返回完整的API参数，严格遵循有道API v3规范 / Return complete API parameters, strictly following Youdao API v3 specification
    return {
      q: word, // 查询文本 / Query text
      from: 'auto', // 源语言，auto表示自动检测 / Source language, auto means automatic detection
      to: 'zh-CHS', // 目标语言，简体中文 / Target language, Simplified Chinese
      appKey: this._config.apiKey!, // 应用ID / Application ID
      salt, // 随机数，使用时间戳 / Random number, using timestamp
      sign, // 签名，SHA256加密 / Signature, SHA256 encryption
      signType: 'v3', // 签名类型，v3表示使用SHA256 / Signature type, v3 means using SHA256
      curtime // 当前UTC时间戳（秒） / Current UTC timestamp (seconds)
    }
  }

  /**
   * 截断查询字符串 / Truncate Query String
   */
  private truncateQuery(query: string): string {
    // 按照官方示例的truncate函数实现 / Implementation according to the official example truncate function
    const len = query.length
    if (len <= 20) return query
    return query.substring(0, 10) + len + query.substring(len - 10, len)
  }

  /**
   * SHA256加密 / SHA256 Encryption
   */
  private async sha256(str: string): Promise<string> {
    // 使用主进程的SHA256计算 / Use main process SHA256 calculation
    const hash = await window.api.dictionary.sha256(str)
    if (!hash) {
      throw this.createError('SHA256计算失败 / SHA256 calculation failed', 'CRYPTO_ERROR')
    }
    return hash
  }

  /**
   * 解析有道API响应 / Parse Youdao API Response
   */
  private parseYoudaoResponse(word: string, data: unknown): DictionaryQueryResult {
    try {
      const responseData = data as {
        errorCode: string
        basic?: {
          phonetic?: string
          'us-phonetic'?: string
          'uk-phonetic'?: string
          explains?: string[]
        }
        web?: Array<{
          key?: string
          value?: string[]
        }>
        translation?: string[]
      }

      // 检查错误码 / Check error code
      if (responseData.errorCode !== '0') {
        throw this.createError(
          `有道API错误: ${this.getYoudaoErrorMessage(responseData.errorCode)} / Youdao API error: ${this.getYoudaoErrorMessage(responseData.errorCode)}`,
          `YOUDAO_ERROR_${responseData.errorCode}`
        )
      }

      const definitions: Array<{
        partOfSpeech?: string
        meaning: string
        examples?: string[]
      }> = []

      // 解析基本释义 / Parse basic definitions
      if (responseData.basic && responseData.basic.explains) {
        responseData.basic.explains.forEach((explain: string) => {
          definitions.push({
            meaning: explain
          })
        })
      }

      // 解析网络释义 / Parse web definitions
      if (responseData.web) {
        responseData.web.forEach((item) => {
          if (item.value && item.value.length > 0) {
            definitions.push({
              partOfSpeech: '网络释义 / Web Definition',
              meaning: item.value.join('; ')
            })
          }
        })
      }

      // 构建发音信息 / Build pronunciation information
      const pronunciations: Array<{
        type: 'us' | 'uk' | 'general'
        phonetic: string
        audioUrl?: string
      }> = []

      if (responseData.basic) {
        if (responseData.basic['us-phonetic']) {
          pronunciations.push({
            type: 'us',
            phonetic: responseData.basic['us-phonetic']
          })
        }
        if (responseData.basic['uk-phonetic']) {
          pronunciations.push({
            type: 'uk',
            phonetic: responseData.basic['uk-phonetic']
          })
        }
        if (responseData.basic.phonetic && !pronunciations.length) {
          pronunciations.push({
            type: 'general',
            phonetic: responseData.basic.phonetic
          })
        }
      }

      return {
        word,
        phonetic: responseData.basic?.phonetic,
        pronunciations: pronunciations.length > 0 ? pronunciations : undefined,
        definitions,
        translations: responseData.translation,
        metadata: {
          source: this.engine,
          timestamp: Date.now(),
          cacheHit: false
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }

      throw this.createError('响应数据解析失败 / Response data parsing failed', 'PARSE_ERROR')
    }
  }

  /**
   * 获取有道错误信息 / Get Youdao Error Message
   */
  private getYoudaoErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      '101': '缺少必填的参数 / Missing required parameter',
      '102': '不支持的语言类型 / Unsupported language type',
      '103': '翻译文本过长 / Translation text too long',
      '104': '不支持的API类型 / Unsupported API type',
      '105': '不支持的签名类型 / Unsupported signature type',
      '106': '不支持的响应类型 / Unsupported response type',
      '107': '不支持的传输加密类型 / Unsupported transport encryption type',
      '108': 'appKey无效 / Invalid appKey',
      '109': 'batchLog格式不正确 / Invalid batchLog format',
      '110': '无相关服务的有效实例 / No valid instance of related service',
      '111': '开发者账号无效 / Invalid developer account',
      '201': '解密失败 / Decryption failed',
      '202': '签名检验失败 / Signature verification failed',
      '203': '访问IP地址不在可访问IP列表 / Access IP not in allowed list',
      '301': '辞典查询失败 / Dictionary query failed',
      '302': '翻译查询失败 / Translation query failed',
      '303': '服务端的其它异常 / Other server exceptions',
      '401': '账户已经欠费停 / Account suspended due to overdue payment'
    }

    return errorMessages[errorCode] || `未知错误码: ${errorCode} / Unknown error code: ${errorCode}`
  }

  /**
   * 获取服务状态 / Get Service Status
   */
  async getStatus(): Promise<DictionaryServiceStatus> {
    try {
      const testResult = await this.testConnection()

      return {
        connected: testResult.success,
        authenticated: testResult.success,
        rateLimited: false, // 需要根据实际API响应判断 / Need to determine based on actual API response
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
}
