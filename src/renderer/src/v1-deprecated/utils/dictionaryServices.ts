import type { DictionaryEngine, DictionarySettings } from '@renderer/types'

// 词典查询结果接口
export interface DictionaryResult {
  word: string
  phonetic?: string
  definitions: Array<{
    partOfSpeech?: string
    meaning: string
    examples?: string[]
  }>
  translations?: string[]
  success: boolean
  error?: string
}

// 词典服务测试结果接口
export interface DictionaryTestResult {
  success: boolean
  message: string
  error?: string
}

// 抽象词典服务基类
export abstract class BaseDictionaryService {
  protected apiKey: string
  protected apiSecret?: string

  constructor(apiKey: string, apiSecret?: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  // 抽象方法：测试API连接
  abstract testConnection(): Promise<DictionaryTestResult>

  // 抽象方法：查询单词
  abstract lookupWord(word: string): Promise<DictionaryResult>

  // 抽象方法：获取服务名称
  abstract getServiceName(): string

  // 通用方法：验证配置
  protected validateConfig(): boolean {
    return !!this.apiKey
  }

  // 通用方法：处理网络错误
  protected handleNetworkError(error: unknown): DictionaryTestResult {
    console.error(`${this.getServiceName()} API error:`, error)
    return {
      success: false,
      message: '网络连接失败，请检查网络设置',
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 欧陆词典服务类
export class EudicDictionaryService extends BaseDictionaryService {
  private readonly baseUrl = 'https://api.frdic.com/api/open/v1'

  constructor(apiToken: string) {
    super(apiToken)
  }

  getServiceName(): string {
    return '欧陆词典'
  }

  async testConnection(): Promise<DictionaryTestResult> {
    if (!this.validateConfig()) {
      return {
        success: false,
        message: '请先配置欧陆词典 API Token'
      }
    }

    try {
      // 使用一个简单的查词请求来测试连接
      const result = await window.api.dictionary.eudicRequest(`${this.baseUrl}/studylist/words`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (result.success) {
        return {
          success: true,
          message: '欧陆词典 API 连接测试成功！'
        }
      } else {
        return {
          success: false,
          message: `API 连接失败: ${result.error || '未知错误'}`,
          error: result.error
        }
      }
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  async lookupWord(word: string): Promise<DictionaryResult> {
    if (!this.validateConfig()) {
      return {
        word,
        definitions: [],
        success: false,
        error: '请先配置欧陆词典 API Token'
      }
    }

    try {
      const result = await window.api.dictionary.eudicRequest(
        `${this.baseUrl}/studylist/words/${encodeURIComponent(word)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (result.success && result.data) {
        return this.parseEudicResponse(word, result.data)
      } else {
        return {
          word,
          definitions: [],
          success: false,
          error: result.error || '查词失败'
        }
      }
    } catch (error) {
      return {
        word,
        definitions: [],
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  }

  private parseEudicResponse(word: string, data: unknown): DictionaryResult {
    try {
      // 根据欧陆词典API响应格式解析数据
      // 这里需要根据实际的API响应格式进行调整
      const responseData = data as {
        phonetic?: string
        definitions?: Array<{
          partOfSpeech?: string
          meaning: string
          examples?: string[]
        }>
        translations?: string[]
      }

      return {
        word,
        phonetic: responseData.phonetic,
        definitions: responseData.definitions || [],
        translations: responseData.translations,
        success: true
      }
    } catch {
      return {
        word,
        definitions: [],
        success: false,
        error: '响应数据解析失败'
      }
    }
  }
}

// 有道词典服务类
export class YoudaoDictionaryService extends BaseDictionaryService {
  private readonly baseUrl = 'https://openapi.youdao.com/api'

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret)
  }

  getServiceName(): string {
    return '有道词典'
  }

  protected validateConfig(): boolean {
    return !!(this.apiKey && this.apiSecret)
  }

  async testConnection(): Promise<DictionaryTestResult> {
    if (!this.validateConfig()) {
      return {
        success: false,
        message: '请先配置有道词典 API Key 和 Secret'
      }
    }

    try {
      // 使用一个简单的翻译请求来测试连接
      const result = await this.lookupWord('test')
      if (result.success) {
        return {
          success: true,
          message: '有道词典 API 连接测试成功！'
        }
      } else {
        return {
          success: false,
          message: `API 连接失败: ${result.error}`,
          error: result.error
        }
      }
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  async lookupWord(word: string): Promise<DictionaryResult> {
    if (!this.validateConfig()) {
      return {
        word,
        definitions: [],
        success: false,
        error: '请先配置有道词典 API Key 和 Secret'
      }
    }

    try {
      const params = await this.buildYoudaoParams(word)
      const result = await window.api.dictionary.youdaoRequest(`${this.baseUrl}`, params)

      if (result.success && result.data) {
        return this.parseYoudaoResponse(word, result.data)
      } else {
        return {
          word,
          definitions: [],
          success: false,
          error: result.error || '查词请求失败'
        }
      }
    } catch (error) {
      return {
        word,
        definitions: [],
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  }

  private async buildYoudaoParams(word: string): Promise<Record<string, string>> {
    // 按照官方示例生成时间戳参数
    const salt = new Date().getTime().toString()
    const curtime = Math.round(new Date().getTime() / 1000).toString()

    // 构建签名字符串：appKey + truncate(query) + salt + curtime + key
    // 与官方JS示例保持完全一致的顺序和格式
    const signStr = this.apiKey + this.truncateQuery(word) + salt + curtime + this.apiSecret!
    const sign = await this.sha256(signStr)

    // 返回完整的API参数，严格遵循有道API v3规范
    return {
      q: word, // 查询文本
      from: 'auto', // 源语言，auto表示自动检测
      to: 'zh-CHS', // 目标语言，简体中文
      appKey: this.apiKey, // 应用ID
      salt, // 随机数，使用时间戳
      sign, // 签名，SHA256加密
      signType: 'v3', // 签名类型，v3表示使用SHA256
      curtime // 当前UTC时间戳（秒）
    }
  }

  private truncateQuery(query: string): string {
    // 按照官方示例的truncate函数实现
    const len = query.length
    if (len <= 20) return query
    return query.substring(0, 10) + len + query.substring(len - 10, len)
  }

  private async sha256(str: string): Promise<string> {
    // 使用主进程的SHA256计算
    const hash = await window.api.dictionary.sha256(str)
    return hash || ''
  }

  private parseYoudaoResponse(word: string, data: unknown): DictionaryResult {
    try {
      const responseData = data as {
        errorCode: string
        basic?: {
          phonetic?: string
          explains?: string[]
        }
        web?: Array<{
          value?: string[]
        }>
        translation?: string[]
      }

      if (responseData.errorCode !== '0') {
        return {
          word,
          definitions: [],
          success: false,
          error: `有道API错误: ${responseData.errorCode}`
        }
      }

      const definitions: Array<{
        partOfSpeech?: string
        meaning: string
        examples?: string[]
      }> = []

      // 解析基本释义
      if (responseData.basic && responseData.basic.explains) {
        responseData.basic.explains.forEach((explain: string) => {
          definitions.push({
            meaning: explain
          })
        })
      }

      // 解析网络释义
      if (responseData.web) {
        responseData.web.forEach((item) => {
          if (item.value && item.value.length > 0) {
            definitions.push({
              partOfSpeech: '网络释义',
              meaning: item.value.join('; ')
            })
          }
        })
      }

      return {
        word,
        phonetic: responseData.basic?.phonetic,
        definitions,
        translations: responseData.translation,
        success: true
      }
    } catch {
      return {
        word,
        definitions: [],
        success: false,
        error: '响应数据解析失败'
      }
    }
  }
}

// 欧陆词典HTML解析服务类
export class EudicHtmlDictionaryService extends BaseDictionaryService {
  constructor() {
    // HTML解析服务不需要API密钥
    super('html-parser')
  }

  getServiceName(): string {
    return '欧陆词典 (网页版)'
  }

  protected validateConfig(): boolean {
    // HTML解析服务总是可用的
    return true
  }

  async testConnection(): Promise<DictionaryTestResult> {
    try {
      // 使用一个简单的查词请求来测试连接
      const result = await this.lookupWord('test')
      if (result.success) {
        return {
          success: true,
          message: '欧陆词典网页版连接测试成功！'
        }
      } else {
        return {
          success: false,
          message: `连接失败: ${result.error}`,
          error: result.error
        }
      }
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  async lookupWord(word: string, context?: string): Promise<DictionaryResult> {
    try {
      const result = await window.api.dictionary.eudicHtmlRequest(word, context)

      if (result.success && result.data) {
        return {
          word: result.data.word,
          phonetic: result.data.phonetic,
          definitions: result.data.definitions,
          translations: result.data.translations,
          success: true
        }
      } else {
        return {
          word,
          definitions: [],
          success: false,
          error: result.error || '查词失败'
        }
      }
    } catch (error) {
      return {
        word,
        definitions: [],
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  }
}

// 词典服务工厂类
export class DictionaryServiceFactory {
  static createService(
    engine: DictionaryEngine,
    settings: DictionarySettings
  ): BaseDictionaryService | null {
    switch (engine) {
      case 'eudic':
        if (!settings.eudicApiToken) return null
        return new EudicDictionaryService(settings.eudicApiToken)

      case 'youdao':
        if (!settings.youdaoApiKey || !settings.youdaoApiSecret) return null
        return new YoudaoDictionaryService(settings.youdaoApiKey, settings.youdaoApiSecret)

      case 'eudic-html':
        return new EudicHtmlDictionaryService()

      default:
        return null
    }
  }

  static async testService(
    engine: DictionaryEngine,
    settings: DictionarySettings
  ): Promise<DictionaryTestResult> {
    const service = this.createService(engine, settings)
    if (!service) {
      return {
        success: false,
        message: '无法创建词典服务，请检查配置'
      }
    }

    return await service.testConnection()
  }
}
