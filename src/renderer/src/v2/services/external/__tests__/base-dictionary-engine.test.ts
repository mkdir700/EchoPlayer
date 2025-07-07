/**
 * 词典引擎基础类测试 / Base Dictionary Engine Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { BaseDictionaryEngine } from '../engines/base-dictionary-engine'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))
import {
  DictionaryEngine,
  DictionaryConfig,
  DictionaryQueryResult,
  DictionaryServiceStatus,
  DictionaryTestResult
} from '../../../infrastructure/types/service/dictionary.types'

// 创建测试用的具体实现类 / Create concrete implementation class for testing
class TestDictionaryEngine extends BaseDictionaryEngine {
  private mockQueryResult: DictionaryQueryResult = {
    word: 'test',
    phonetic: '/test/',
    definitions: [{ meaning: 'a test word' }],
    translations: ['测试']
  }

  private mockStatus: DictionaryServiceStatus = {
    connected: true,
    authenticated: true,
    rateLimited: false
  }

  private mockTestResult: DictionaryTestResult = {
    success: true,
    message: 'Test connection successful'
  }

  constructor(config: DictionaryConfig) {
    super('Test Dictionary Engine', 'eudic-html', config)
  }

  async testConnection(): Promise<DictionaryTestResult> {
    return this.mockTestResult
  }

  async getStatus(): Promise<DictionaryServiceStatus> {
    return this.mockStatus
  }

  protected async onQueryWord(word: string, context?: string): Promise<DictionaryQueryResult> {
    return {
      ...this.mockQueryResult,
      word,
      metadata: {
        source: this.engine,
        timestamp: Date.now(),
        context
      }
    }
  }

  // 暴露protected方法用于测试 / Expose protected methods for testing
  public testCreateError(message: string, code?: string) {
    return this.createError(message, code)
  }

  public testHandleNetworkError(error: unknown) {
    return this.handleNetworkError(error)
  }

  public testValidateConfig() {
    return this.validateConfig()
  }

  // 用于测试的mock方法 / Mock methods for testing
  setMockQueryResult(result: DictionaryQueryResult) {
    this.mockQueryResult = result
  }

  setMockStatus(status: DictionaryServiceStatus) {
    this.mockStatus = status
  }

  setMockTestResult(result: DictionaryTestResult) {
    this.mockTestResult = result
  }

  // 模拟抛出错误的查询 / Mock query that throws error
  throwOnQuery = false

  protected async onQueryWord_Original(
    word: string,
    context?: string
  ): Promise<DictionaryQueryResult> {
    if (this.throwOnQuery) {
      throw new Error('Query failed')
    }
    return this.onQueryWord(word, context)
  }
}

describe('BaseDictionaryEngine', () => {
  let engine: TestDictionaryEngine
  const mockConfig: DictionaryConfig = {
    engine: 'eudic-html',
    cacheEnabled: true,
    cacheTtl: 3600000
  }

  beforeEach(() => {
    engine = new TestDictionaryEngine(mockConfig)
  })

  describe('基础属性 / Basic Properties', () => {
    test('应该正确初始化引擎属性 / Should correctly initialize engine properties', () => {
      expect(engine.name).toBe('Test Dictionary Engine')
      expect(engine.engine).toBe('eudic-html')
    })

    test('应该正确存储配置 / Should correctly store configuration', () => {
      expect(engine['_config']).toEqual(mockConfig)
    })

    test('应该初始化统计信息 / Should initialize statistics', () => {
      const stats = engine.getStats()

      expect(stats.queries).toBe(0)
      expect(stats.successfulQueries).toBe(0)
      expect(stats.failedQueries).toBe(0)
      expect(stats.averageResponseTime).toBe(0)
    })
  })

  describe('配置管理 / Configuration Management', () => {
    test('应该正确更新配置 / Should correctly update configuration', async () => {
      const newConfig: DictionaryConfig = {
        engine: 'youdao',
        apiKey: 'new-api-key',
        cacheEnabled: false
      }

      await engine.configure(newConfig)

      expect(engine['_config']).toEqual({
        ...mockConfig,
        ...newConfig
      })
    })

    test('应该调用onConfigure钩子 / Should call onConfigure hook', async () => {
      const onConfigureSpy = vi.spyOn(engine as any, 'onConfigure').mockResolvedValue(undefined)

      await engine.configure({ engine: 'eudic-html' })

      expect(onConfigureSpy).toHaveBeenCalledOnce()
    })
  })

  describe('单词查询 / Word Query', () => {
    test('应该成功查询单词 / Should successfully query word', async () => {
      const result = await engine.queryWord('hello')

      expect(result.word).toBe('hello')
      expect(result.phonetic).toBe('/test/')
      expect(result.definitions).toHaveLength(1)
      expect(result.metadata?.source).toBe('eudic-html')
      expect(result.metadata?.timestamp).toBeDefined()
    })

    test('应该在查询中包含上下文 / Should include context in query', async () => {
      const context = 'test context'
      const result = await engine.queryWord('hello', context)

      expect(result.metadata?.context).toBe(context)
    })

    test('应该正确更新成功查询统计 / Should correctly update successful query statistics', async () => {
      // 模拟异步操作以产生实际的响应时间 / Mock async operation to generate actual response time
      const originalMethod = engine['onQueryWord']
      engine['onQueryWord'] = vi.fn().mockImplementation(async (word) => {
        await new Promise((resolve) => setTimeout(resolve, 10)) // 添加10ms延迟 / Add 10ms delay
        return originalMethod.call(engine, word)
      })

      await engine.queryWord('hello')
      await engine.queryWord('world')

      const stats = engine.getStats()

      expect(stats.queries).toBe(2)
      expect(stats.successfulQueries).toBe(2)
      expect(stats.failedQueries).toBe(0)
      expect(stats.averageResponseTime).toBeGreaterThan(0)

      // 恢复原方法 / Restore original method
      engine['onQueryWord'] = originalMethod
    })

    test('应该正确处理查询失败 / Should correctly handle query failures', async () => {
      // 设置模拟查询失败 / Set up mock query failure
      const originalMethod = engine['onQueryWord']
      engine['onQueryWord'] = vi.fn().mockRejectedValue(new Error('Query failed'))

      await expect(engine.queryWord('fail')).rejects.toThrow('Query failed')

      const stats = engine.getStats()
      expect(stats.queries).toBe(1)
      expect(stats.successfulQueries).toBe(0)
      expect(stats.failedQueries).toBe(1)

      // 恢复原方法 / Restore original method
      engine['onQueryWord'] = originalMethod
    })

    test('应该正确计算平均响应时间 / Should correctly calculate average response time', async () => {
      // 模拟不同的响应时间 / Mock different response times
      const delays = [50, 100, 150]

      for (const delay of delays) {
        const originalMethod = engine['onQueryWord']
        engine['onQueryWord'] = vi.fn().mockImplementation(async (word) => {
          await new Promise((resolve) => setTimeout(resolve, delay))
          return originalMethod.call(engine, word)
        })

        await engine.queryWord(`test${delay}`)

        // 恢复原方法以便下次测试 / Restore original method for next test
        engine['onQueryWord'] = originalMethod
      }

      const stats = engine.getStats()
      expect(stats.averageResponseTime).toBeGreaterThan(0)
      expect(stats.successfulQueries).toBe(3)
    })
  })

  describe('工具方法 / Utility Methods', () => {
    test('应该正确创建错误对象 / Should correctly create error objects', () => {
      const error = engine.testCreateError('Test error', 'TEST_CODE')

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error).toBeInstanceOf(Error)
    })

    test('应该正确创建无代码的错误 / Should correctly create error without code', () => {
      const error = engine.testCreateError('Test error without code')

      expect(error.message).toBe('Test error without code')
      expect(error.code).toBeUndefined()
    })

    test('应该正确处理网络错误 / Should correctly handle network errors', () => {
      const networkError = new Error('Network connection failed')
      const result = engine.testHandleNetworkError(networkError)

      expect(result.success).toBe(false)
      expect(result.message).toContain('网络连接失败')
      expect(result.error).toBe('Network connection failed')
    })

    test('应该处理未知类型的错误 / Should handle unknown type errors', () => {
      const unknownError = 'Unknown error string'
      const result = engine.testHandleNetworkError(unknownError)

      expect(result.success).toBe(false)
      expect(result.error).toBe('未知错误 / Unknown error')
    })

    test('应该验证配置（默认返回true） / Should validate configuration (default returns true)', () => {
      const isValid = engine.testValidateConfig()
      expect(isValid).toBe(true)
    })
  })

  describe('抽象方法实现 / Abstract Method Implementations', () => {
    test('应该实现testConnection方法 / Should implement testConnection method', async () => {
      const result = await engine.testConnection()

      expect(result.success).toBe(true)
      expect(result.message).toBe('Test connection successful')
    })

    test('应该实现getStatus方法 / Should implement getStatus method', async () => {
      const status = await engine.getStatus()

      expect(status.connected).toBe(true)
      expect(status.authenticated).toBe(true)
      expect(status.rateLimited).toBe(false)
    })
  })

  describe('边界情况 / Boundary Cases', () => {
    test('应该处理空字符串查询 / Should handle empty string query', async () => {
      const result = await engine.queryWord('')

      expect(result.word).toBe('')
      expect(result.metadata?.source).toBe('eudic-html')
    })

    test('应该处理非常长的单词查询 / Should handle very long word query', async () => {
      const longWord = 'a'.repeat(1000)
      const result = await engine.queryWord(longWord)

      expect(result.word).toBe(longWord)
    })

    test('应该处理特殊字符查询 / Should handle special character query', async () => {
      const specialWord = '@#$%^&*()'
      const result = await engine.queryWord(specialWord)

      expect(result.word).toBe(specialWord)
    })

    test('应该处理Unicode字符查询 / Should handle Unicode character query', async () => {
      const unicodeWord = '测试词汇café'
      const result = await engine.queryWord(unicodeWord)

      expect(result.word).toBe(unicodeWord)
    })
  })

  describe('统计准确性 / Statistics Accuracy', () => {
    test('应该在混合成功失败查询后正确统计 / Should correctly count after mixed success/failure queries', async () => {
      // 成功查询 / Successful queries
      await engine.queryWord('success1')
      await engine.queryWord('success2')

      // 失败查询 / Failed queries
      const originalMethod = engine['onQueryWord']
      engine['onQueryWord'] = vi.fn().mockRejectedValue(new Error('Failed'))

      try {
        await engine.queryWord('fail1')
      } catch {}

      try {
        await engine.queryWord('fail2')
      } catch {}

      // 恢复并再次成功查询 / Restore and successful query again
      engine['onQueryWord'] = originalMethod
      await engine.queryWord('success3')

      const stats = engine.getStats()
      expect(stats.queries).toBe(5)
      expect(stats.successfulQueries).toBe(3)
      expect(stats.failedQueries).toBe(2)
    })

    test('应该重置统计信息 / Should reset statistics', () => {
      // 先进行一些查询 / First perform some queries
      engine['_stats'].queries = 10
      engine['_stats'].successfulQueries = 8
      engine['_stats'].failedQueries = 2

      // 获取当前统计 / Get current statistics
      const stats = engine.getStats()
      expect(stats.queries).toBe(10)

      // 修改返回的对象不应影响内部统计 / Modifying returned object should not affect internal statistics
      stats.queries = 999
      const newStats = engine.getStats()
      expect(newStats.queries).toBe(10) // 应该仍然是原来的值 / Should still be the original value
    })
  })

  describe('异步操作 / Asynchronous Operations', () => {
    test('应该正确处理并发查询 / Should correctly handle concurrent queries', async () => {
      const promises = [
        engine.queryWord('concurrent1'),
        engine.queryWord('concurrent2'),
        engine.queryWord('concurrent3'),
        engine.queryWord('concurrent4'),
        engine.queryWord('concurrent5')
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result, index) => {
        expect(result.word).toBe(`concurrent${index + 1}`)
        expect(result.metadata?.source).toBe('eudic-html')
      })

      const stats = engine.getStats()
      expect(stats.queries).toBe(5)
      expect(stats.successfulQueries).toBe(5)
    })

    test('应该正确处理并发配置更新 / Should correctly handle concurrent configuration updates', async () => {
      const configs = [
        { engine: 'eudic-html' as DictionaryEngine, apiKey: 'key1' },
        { engine: 'eudic' as DictionaryEngine, apiKey: 'key2' },
        { engine: 'youdao' as DictionaryEngine, apiKey: 'key3' }
      ]

      const promises = configs.map((config) => engine.configure(config))
      await Promise.all(promises)

      // 最后的配置应该被应用 / The last configuration should be applied
      expect(engine['_config'].apiKey).toBeDefined()
    })
  })
})
