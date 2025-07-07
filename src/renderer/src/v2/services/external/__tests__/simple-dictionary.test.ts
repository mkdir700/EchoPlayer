/**
 * 简化词典服务测试 / Simplified Dictionary Service Tests
 */

import { describe, test, expect, vi } from 'vitest'

// Mock logger first
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock window.api
const mockApi = {
  dictionary: {
    eudicHtmlRequest: vi.fn(),
    eudicRequest: vi.fn(),
    youdaoRequest: vi.fn(),
    sha256: vi.fn()
  }
}

// Mock location and window objects for testing environment
Object.defineProperty(global, 'window', {
  value: {
    api: mockApi,
    location: {
      href: 'http://localhost:3000'
    }
  },
  configurable: true
})

import { DictionaryEngineFactory } from '../engines/engine-factory'
import { DictionaryService } from '../dictionary.service'

describe('Dictionary System Basic Tests', () => {
  describe('DictionaryEngineFactory Basic Tests', () => {
    test('应该返回支持的引擎列表 / Should return supported engines list', () => {
      const engines = DictionaryEngineFactory.getSupportedEngines()
      expect(engines).toContain('eudic-html')
      expect(engines).toContain('eudic')
      expect(engines).toContain('youdao')
    })

    test('应该检查引擎是否支持 / Should check if engine is supported', () => {
      expect(DictionaryEngineFactory.isEngineSupported('eudic-html')).toBe(true)
      expect(DictionaryEngineFactory.isEngineSupported('invalid')).toBe(false)
    })

    test('应该返回正确的显示名称 / Should return correct display names', () => {
      const name = DictionaryEngineFactory.getEngineDisplayName('eudic-html')
      expect(name).toContain('欧陆词典')
    })

    test('应该返回配置要求 / Should return configuration requirements', () => {
      const requirements = DictionaryEngineFactory.getEngineConfigRequirements('eudic-html')
      expect(requirements.apiKey).toBe(false)
      expect(requirements.apiSecret).toBe(false)
      expect(requirements.baseUrl).toBe(false)

      const eudicRequirements = DictionaryEngineFactory.getEngineConfigRequirements('eudic')
      expect(eudicRequirements.apiKey).toBe(true)
    })

    test('应该验证引擎配置 / Should validate engine configuration', () => {
      const validation = DictionaryEngineFactory.validateEngineConfig('eudic-html', {
        engine: 'eudic-html'
      })
      expect(validation.valid).toBe(true)
      expect(validation.missingFields).toHaveLength(0)
    })

    test('应该创建引擎实例 / Should create engine instances', () => {
      const engine = DictionaryEngineFactory.createEngine('eudic-html', {
        engine: 'eudic-html'
      })
      expect(engine).toBeDefined()
      expect(engine.engine).toBe('eudic-html')
    })
  })

  describe('DictionaryService Basic Tests', () => {
    test('应该创建词典服务实例 / Should create dictionary service instance', () => {
      const service = new DictionaryService()
      expect(service).toBeDefined()
      expect(service.isInitialized).toBe(false)
      expect(service.isDisposed).toBe(false)
    })

    test('应该初始化服务 / Should initialize service', async () => {
      mockApi.dictionary.eudicHtmlRequest.mockResolvedValue({
        success: true,
        data: {
          word: 'test',
          phonetic: '/test/',
          definitions: [{ meaning: 'a test' }],
          translations: ['测试']
        }
      })

      const service = new DictionaryService()
      await service.initialize()

      expect(service.isInitialized).toBe(true)
      expect(service.engine).toBe('eudic-html')
    })

    test('应该配置服务 / Should configure service', async () => {
      mockApi.dictionary.eudicHtmlRequest.mockResolvedValue({
        success: true,
        data: {
          word: 'test',
          phonetic: '/test/',
          definitions: [{ meaning: 'a test' }],
          translations: ['测试']
        }
      })

      const service = new DictionaryService()
      await service.initialize()

      await service.configure({
        engine: 'eudic-html',
        cacheEnabled: true
      })

      expect(service.engine).toBe('eudic-html')
    })

    test('应该处理简单的单词查询 / Should handle simple word query', async () => {
      mockApi.dictionary.eudicHtmlRequest.mockResolvedValue({
        success: true,
        data: {
          word: 'hello',
          phonetic: '/həˈloʊ/',
          definitions: [{ meaning: 'used as a greeting' }],
          translations: ['你好']
        }
      })

      const service = new DictionaryService()
      await service.initialize()

      const result = await service.queryWord('hello')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.word).toBe('hello')
    })

    test('应该处理空字符串查询 / Should handle empty string query', async () => {
      const service = new DictionaryService()
      await service.initialize()

      const result = await service.queryWord('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Word parameter is required')
    })

    test('应该获取服务统计信息 / Should get service statistics', async () => {
      const service = new DictionaryService()
      await service.initialize()

      const stats = await service.getStatistics()

      expect(stats).toBeDefined()
      expect(stats.totalQueries).toBe(0)
      expect(stats.successfulQueries).toBe(0)
      expect(stats.failedQueries).toBe(0)
    })

    test('应该销毁服务 / Should dispose service', async () => {
      const service = new DictionaryService()
      await service.initialize()
      await service.dispose()

      expect(service.isDisposed).toBe(true)

      // 使用已销毁的服务应该抛出错误 / Using disposed service should throw error
      await expect(service.queryWord('test')).rejects.toThrow()
    })
  })
})
