/**
 * 词典引擎工厂测试 / Dictionary Engine Factory Tests
 */

import { describe, test, expect } from 'vitest'
import { DictionaryEngineFactory } from '../engines/engine-factory'
import { EudicHtmlEngine } from '../engines/eudic-html-engine'
import { EudicApiEngine } from '../engines/eudic-api-engine'
import { YoudaoApiEngine } from '../engines/youdao-api-engine'
import { DictionaryEngine } from '../../../infrastructure/types/service/dictionary.types'

describe('DictionaryEngineFactory', () => {
  describe('引擎创建 / Engine Creation', () => {
    test('应该创建欧陆词典HTML引擎 / Should create Eudic HTML engine', () => {
      const engine = DictionaryEngineFactory.createEngine('eudic-html', {
        engine: 'eudic-html'
      })

      expect(engine).toBeInstanceOf(EudicHtmlEngine)
      expect(engine.engine).toBe('eudic-html')
      expect(engine.name).toContain('欧陆词典')
    })

    test('应该创建欧陆词典API引擎 / Should create Eudic API engine', () => {
      const engine = DictionaryEngineFactory.createEngine('eudic', {
        engine: 'eudic',
        apiKey: 'test-api-key'
      })

      expect(engine).toBeInstanceOf(EudicApiEngine)
      expect(engine.engine).toBe('eudic')
    })

    test('应该创建有道词典API引擎 / Should create Youdao API engine', () => {
      const engine = DictionaryEngineFactory.createEngine('youdao', {
        engine: 'youdao',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret'
      })

      expect(engine).toBeInstanceOf(YoudaoApiEngine)
      expect(engine.engine).toBe('youdao')
    })

    test('应该拒绝不支持的引擎类型 / Should reject unsupported engine types', () => {
      expect(() => {
        DictionaryEngineFactory.createEngine('unsupported' as DictionaryEngine, {
          engine: 'unsupported' as DictionaryEngine
        })
      }).toThrow('Unsupported dictionary engine: unsupported')
    })
  })

  describe('支持的引擎列表 / Supported Engine List', () => {
    test('应该返回所有支持的引擎 / Should return all supported engines', () => {
      const supportedEngines = DictionaryEngineFactory.getSupportedEngines()

      expect(supportedEngines).toEqual(['eudic-html', 'eudic', 'youdao'])
      expect(supportedEngines.length).toBe(3)
    })

    test('应该正确检查引擎是否支持 / Should correctly check if engine is supported', () => {
      expect(DictionaryEngineFactory.isEngineSupported('eudic-html')).toBe(true)
      expect(DictionaryEngineFactory.isEngineSupported('eudic')).toBe(true)
      expect(DictionaryEngineFactory.isEngineSupported('youdao')).toBe(true)
      expect(DictionaryEngineFactory.isEngineSupported('unsupported')).toBe(false)
      expect(DictionaryEngineFactory.isEngineSupported('')).toBe(false)
    })
  })

  describe('引擎显示名称 / Engine Display Names', () => {
    test('应该返回正确的显示名称 / Should return correct display names', () => {
      expect(DictionaryEngineFactory.getEngineDisplayName('eudic-html')).toContain('欧陆词典')
      expect(DictionaryEngineFactory.getEngineDisplayName('eudic')).toContain('欧陆词典')
      expect(DictionaryEngineFactory.getEngineDisplayName('youdao')).toContain('有道词典')
      expect(DictionaryEngineFactory.getEngineDisplayName('openai')).toContain('OpenAI')
    })

    test('应该为未知引擎返回引擎名称本身 / Should return engine name itself for unknown engines', () => {
      const unknownEngine = 'unknown' as DictionaryEngine
      expect(DictionaryEngineFactory.getEngineDisplayName(unknownEngine)).toBe('unknown')
    })
  })

  describe('引擎配置要求 / Engine Configuration Requirements', () => {
    test('应该正确返回各引擎的配置要求 / Should correctly return configuration requirements for each engine', () => {
      const eudicHtmlReq = DictionaryEngineFactory.getEngineConfigRequirements('eudic-html')
      expect(eudicHtmlReq).toEqual({
        apiKey: false,
        apiSecret: false,
        baseUrl: false
      })

      const eudicReq = DictionaryEngineFactory.getEngineConfigRequirements('eudic')
      expect(eudicReq).toEqual({
        apiKey: true,
        apiSecret: false,
        baseUrl: false
      })

      const youdaoReq = DictionaryEngineFactory.getEngineConfigRequirements('youdao')
      expect(youdaoReq).toEqual({
        apiKey: true,
        apiSecret: true,
        baseUrl: false
      })

      const openaiReq = DictionaryEngineFactory.getEngineConfigRequirements('openai')
      expect(openaiReq).toEqual({
        apiKey: true,
        apiSecret: false,
        baseUrl: true
      })
    })

    test('应该为未知引擎返回默认要求 / Should return default requirements for unknown engines', () => {
      const unknownReq = DictionaryEngineFactory.getEngineConfigRequirements(
        'unknown' as DictionaryEngine
      )
      expect(unknownReq).toEqual({
        apiKey: false,
        apiSecret: false,
        baseUrl: false
      })
    })
  })

  describe('配置验证 / Configuration Validation', () => {
    test('应该验证欧陆词典HTML引擎配置 / Should validate Eudic HTML engine configuration', () => {
      const validation = DictionaryEngineFactory.validateEngineConfig('eudic-html', {
        engine: 'eudic-html'
      })

      expect(validation.valid).toBe(true)
      expect(validation.missingFields).toHaveLength(0)
      expect(validation.errors).toHaveLength(0)
    })

    test('应该验证欧陆词典API引擎配置 / Should validate Eudic API engine configuration', () => {
      // 完整配置 / Complete configuration
      const validConfig = DictionaryEngineFactory.validateEngineConfig('eudic', {
        engine: 'eudic',
        apiKey: '12345678-1234-5234-a234-123456789abc'
      })

      expect(validConfig.valid).toBe(true)
      expect(validConfig.missingFields).toHaveLength(0)
      expect(validConfig.errors).toHaveLength(0)

      // 缺少API Key / Missing API Key
      const missingKeyConfig = DictionaryEngineFactory.validateEngineConfig('eudic', {
        engine: 'eudic'
      })

      expect(missingKeyConfig.valid).toBe(false)
      expect(missingKeyConfig.missingFields).toContain('apiKey')

      // 无效的API Key格式 / Invalid API Key format
      const invalidKeyConfig = DictionaryEngineFactory.validateEngineConfig('eudic', {
        engine: 'eudic',
        apiKey: 'invalid-key'
      })

      expect(invalidKeyConfig.valid).toBe(false)
      expect(invalidKeyConfig.errors.length).toBeGreaterThan(0)
      expect(invalidKeyConfig.errors[0]).toContain('格式无效')
    })

    test('应该验证有道词典API引擎配置 / Should validate Youdao API engine configuration', () => {
      // 完整配置 / Complete configuration
      const validConfig = DictionaryEngineFactory.validateEngineConfig('youdao', {
        engine: 'youdao',
        apiKey: '1234567890123456',
        apiSecret: '1234567890123456'
      })

      expect(validConfig.valid).toBe(true)
      expect(validConfig.missingFields).toHaveLength(0)
      expect(validConfig.errors).toHaveLength(0)

      // 缺少配置项 / Missing configuration items
      const missingConfig = DictionaryEngineFactory.validateEngineConfig('youdao', {
        engine: 'youdao'
      })

      expect(missingConfig.valid).toBe(false)
      expect(missingConfig.missingFields).toContain('apiKey')
      expect(missingConfig.missingFields).toContain('apiSecret')

      // API Key太短 / API Key too short
      const shortKeyConfig = DictionaryEngineFactory.validateEngineConfig('youdao', {
        engine: 'youdao',
        apiKey: 'short',
        apiSecret: 'short'
      })

      expect(shortKeyConfig.valid).toBe(false)
      expect(shortKeyConfig.errors.length).toBeGreaterThan(0)
      expect(shortKeyConfig.errors.some((error) => error.includes('API Key 长度不足'))).toBe(true)
      expect(shortKeyConfig.errors.some((error) => error.includes('API Secret 长度不足'))).toBe(
        true
      )
    })

    test('应该验证OpenAI引擎配置 / Should validate OpenAI engine configuration', () => {
      // 完整配置 / Complete configuration
      const validConfig = DictionaryEngineFactory.validateEngineConfig('openai', {
        engine: 'openai',
        apiKey: 'sk-1234567890',
        baseUrl: 'https://api.openai.com'
      })

      expect(validConfig.valid).toBe(true)

      // 缺少配置项 / Missing configuration items
      const missingConfig = DictionaryEngineFactory.validateEngineConfig('openai', {
        engine: 'openai'
      })

      expect(missingConfig.valid).toBe(false)
      expect(missingConfig.missingFields).toContain('apiKey')
      expect(missingConfig.missingFields).toContain('baseUrl')
    })
  })

  describe('边界情况 / Boundary Cases', () => {
    test('应该处理空配置对象 / Should handle empty configuration object', () => {
      const engines: DictionaryEngine[] = ['eudic', 'youdao']

      engines.forEach((engine) => {
        const validation = DictionaryEngineFactory.validateEngineConfig(engine, {} as any)
        expect(validation.valid).toBe(false)
        expect(validation.missingFields.length).toBeGreaterThan(0)
      })
    })

    test('应该处理null和undefined值 / Should handle null and undefined values', () => {
      const validation = DictionaryEngineFactory.validateEngineConfig('youdao', {
        engine: 'youdao',
        apiKey: null as any,
        apiSecret: undefined as any
      })

      expect(validation.valid).toBe(false)
      expect(validation.missingFields).toContain('apiKey')
      expect(validation.missingFields).toContain('apiSecret')
    })

    test('应该处理极端长度的配置值 / Should handle extreme length configuration values', () => {
      const longKey = 'a'.repeat(1000)

      const validation = DictionaryEngineFactory.validateEngineConfig('youdao', {
        engine: 'youdao',
        apiKey: longKey,
        apiSecret: longKey
      })

      // 很长的key应该仍然有效（只要满足最小长度要求） / Very long keys should still be valid (as long as they meet minimum length requirements)
      expect(validation.valid).toBe(true)
    })
  })

  describe('类型安全 / Type Safety', () => {
    test('应该正确处理类型断言 / Should correctly handle type assertions', () => {
      const validEngine = 'eudic-html'
      const invalidEngine = 'invalid-engine'

      expect(DictionaryEngineFactory.isEngineSupported(validEngine)).toBe(true)
      expect(DictionaryEngineFactory.isEngineSupported(invalidEngine)).toBe(false)

      // TypeScript类型守卫应该正常工作 / TypeScript type guard should work properly
      if (DictionaryEngineFactory.isEngineSupported(validEngine)) {
        const engine = DictionaryEngineFactory.createEngine(validEngine, { engine: validEngine })
        expect(engine).toBeDefined()
      }
    })
  })
})
