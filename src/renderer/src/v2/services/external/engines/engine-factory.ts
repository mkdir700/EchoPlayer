/**
 * 词典引擎工厂 / Dictionary Engine Factory
 *
 * 负责创建和管理不同的词典引擎实例
 * Responsible for creating and managing different dictionary engine instances
 */

import { BaseDictionaryEngine } from './base-dictionary-engine'
import { EudicHtmlEngine } from './eudic-html-engine'
import { EudicApiEngine } from './eudic-api-engine'
import { YoudaoApiEngine } from './youdao-api-engine'
import {
  DictionaryEngine,
  DictionaryConfig
} from '../../../infrastructure/types/service/dictionary.types'

/**
 * 词典引擎工厂类 / Dictionary Engine Factory Class
 */
export class DictionaryEngineFactory {
  /**
   * 创建词典引擎实例 / Create Dictionary Engine Instance
   */
  static createEngine(engine: DictionaryEngine, config: DictionaryConfig): BaseDictionaryEngine {
    switch (engine) {
      case 'eudic-html':
        return new EudicHtmlEngine(config)

      case 'eudic':
        return new EudicApiEngine(config)

      case 'youdao':
        return new YoudaoApiEngine(config)

      default:
        throw new Error(`Unsupported dictionary engine: ${engine}`)
    }
  }

  /**
   * 获取支持的引擎列表 / Get Supported Engine List
   */
  static getSupportedEngines(): DictionaryEngine[] {
    return ['eudic-html', 'eudic', 'youdao']
  }

  /**
   * 检查引擎是否受支持 / Check if Engine is Supported
   */
  static isEngineSupported(engine: string): engine is DictionaryEngine {
    return this.getSupportedEngines().includes(engine as DictionaryEngine)
  }

  /**
   * 获取引擎显示名称 / Get Engine Display Name
   */
  static getEngineDisplayName(engine: DictionaryEngine): string {
    const displayNames: Record<DictionaryEngine, string> = {
      'eudic-html': '欧陆词典 (网页版) / Eudic (Web Version)',
      eudic: '欧陆词典 / Eudic Dictionary',
      youdao: '有道词典 / Youdao Dictionary',
      openai: 'OpenAI 词典 / OpenAI Dictionary'
    }

    return displayNames[engine] || engine
  }

  /**
   * 获取引擎配置要求 / Get Engine Configuration Requirements
   */
  static getEngineConfigRequirements(engine: DictionaryEngine): {
    apiKey: boolean
    apiSecret: boolean
    baseUrl: boolean
  } {
    const requirements: Record<
      DictionaryEngine,
      {
        apiKey: boolean
        apiSecret: boolean
        baseUrl: boolean
      }
    > = {
      'eudic-html': { apiKey: false, apiSecret: false, baseUrl: false },
      eudic: { apiKey: true, apiSecret: false, baseUrl: false },
      youdao: { apiKey: true, apiSecret: true, baseUrl: false },
      openai: { apiKey: true, apiSecret: false, baseUrl: true }
    }

    return requirements[engine] || { apiKey: false, apiSecret: false, baseUrl: false }
  }

  /**
   * 验证引擎配置 / Validate Engine Configuration
   */
  static validateEngineConfig(
    engine: DictionaryEngine,
    config: DictionaryConfig
  ): {
    valid: boolean
    missingFields: string[]
    errors: string[]
  } {
    const requirements = this.getEngineConfigRequirements(engine)
    const missingFields: string[] = []
    const errors: string[] = []

    // 检查必需的配置项 / Check required configuration items
    if (requirements.apiKey && !config.apiKey) {
      missingFields.push('apiKey')
    }

    if (requirements.apiSecret && !config.apiSecret) {
      missingFields.push('apiSecret')
    }

    if (requirements.baseUrl && !config.baseUrl) {
      missingFields.push('baseUrl')
    }

    // 特定引擎的额外验证 / Additional validation for specific engines
    if (engine === 'youdao') {
      if (config.apiKey && config.apiKey.length < 10) {
        errors.push('有道 API Key 长度不足 / Youdao API Key too short')
      }
      if (config.apiSecret && config.apiSecret.length < 10) {
        errors.push('有道 API Secret 长度不足 / Youdao API Secret too short')
      }
    }

    if (engine === 'eudic' && config.apiKey) {
      // 欧陆词典 API Token 通常是UUID格式 / Eudic API Token is usually in UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(config.apiKey)) {
        errors.push('欧陆词典 API Token 格式无效 / Invalid Eudic API Token format')
      }
    }

    return {
      valid: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors
    }
  }
}
