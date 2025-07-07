/**
 * 词典服务测试 / Dictionary Service Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { DictionaryService } from '../dictionary.service'

// Mock logger
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

describe('DictionaryService', () => {
  let dictionaryService: DictionaryService

  beforeEach(async () => {
    dictionaryService = new DictionaryService()

    // 重置所有mocks / Reset all mocks
    vi.clearAllMocks()

    // 设置默认的mock返回值 / Set default mock return values
    mockApi.dictionary.eudicHtmlRequest.mockResolvedValue({
      success: true,
      data: {
        word: 'test',
        phonetic: '/test/',
        definitions: [{ meaning: 'a test' }],
        translations: ['测试']
      }
    })

    mockApi.dictionary.sha256.mockResolvedValue('mocked-hash')

    // 初始化服务 / Initialize service
    await dictionaryService.initialize()
  })

  afterEach(async () => {
    if (dictionaryService && !dictionaryService.isDisposed) {
      await dictionaryService.dispose()
    }
  })

  describe('初始化 / Initialization', () => {
    test('应该正确初始化服务 / Should initialize service correctly', async () => {
      expect(dictionaryService.isInitialized).toBe(true)
      expect(dictionaryService.engine).toBe('eudic-html')
    })

    test('应该注册所有支持的引擎 / Should register all supported engines', async () => {
      const healthCheck = await dictionaryService.healthCheck()
      expect(healthCheck.healthy).toBe(true)
    })
  })

  describe('配置管理 / Configuration Management', () => {
    test('应该正确配置词典引擎 / Should configure dictionary engine correctly', async () => {
      await dictionaryService.configure({
        engine: 'eudic-html',
        cacheEnabled: true,
        cacheTtl: 1800000
      })

      expect(dictionaryService.engine).toBe('eudic-html')
    })

    test('应该切换到不同的引擎 / Should switch to different engine', async () => {
      await dictionaryService.configure({
        engine: 'eudic',
        apiKey: 'test-api-key'
      })

      expect(dictionaryService.engine).toBe('eudic')
    })
  })

  describe('连接测试 / Connection Testing', () => {
    test('应该成功测试eudic-html引擎连接 / Should successfully test eudic-html engine connection', async () => {
      // 模拟网络延迟以产生实际的响应时间 / Mock network delay to generate actual response time
      mockApi.dictionary.eudicHtmlRequest.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10)) // 添加10ms延迟 / Add 10ms delay
        return {
          success: true,
          data: {
            word: 'test',
            phonetic: '/test/',
            definitions: [{ meaning: 'a test' }],
            translations: ['测试']
          }
        }
      })

      const result = await dictionaryService.testConnection()

      expect(result.success).toBe(true)
      expect(result.responseTime).toBeGreaterThan(0)
    })

    test('应该处理连接测试失败 / Should handle connection test failure', async () => {
      mockApi.dictionary.eudicHtmlRequest.mockRejectedValue(new Error('Network error'))

      const result = await dictionaryService.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('单词查询 / Word Query', () => {
    test('应该成功查询单词 / Should successfully query word', async () => {
      const result = await dictionaryService.queryWord('test')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.word).toBe('test')
      expect(result.data!.phonetic).toBe('/test/')
      expect(result.data!.definitions).toHaveLength(1)
      expect(result.data!.metadata?.source).toBe('eudic-html')
      expect(result.data!.metadata?.cacheHit).toBe(false)
    })

    test('应该缓存查询结果 / Should cache query results', async () => {
      // 第一次查询 / First query
      const result1 = await dictionaryService.queryWord('test')
      expect(result1.success).toBe(true)
      expect(result1.data!.metadata?.cacheHit).toBe(false)

      // 第二次查询应该从缓存获取 / Second query should get from cache
      const result2 = await dictionaryService.queryWord('test')
      expect(result2.success).toBe(true)
      expect(result2.data!.metadata?.cacheHit).toBe(true)

      // 应该只调用一次API / Should only call API once
      expect(mockApi.dictionary.eudicHtmlRequest).toHaveBeenCalledTimes(1)
    })

    test('应该拒绝空的单词查询 / Should reject empty word query', async () => {
      const result = await dictionaryService.queryWord('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Word parameter is required')
      expect(result.code).toBe('INVALID_INPUT')
    })

    test('应该处理查询失败 / Should handle query failure', async () => {
      mockApi.dictionary.eudicHtmlRequest.mockResolvedValue({
        success: false,
        error: 'Word not found'
      })

      const result = await dictionaryService.queryWord('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('应该正规化单词查询 / Should normalize word query', async () => {
      await dictionaryService.queryWord('  TeSt  ')

      expect(mockApi.dictionary.eudicHtmlRequest).toHaveBeenCalledWith('test', undefined)
    })
  })

  describe('批量查询 / Batch Query', () => {
    test('应该成功批量查询多个单词 / Should successfully batch query multiple words', async () => {
      mockApi.dictionary.eudicHtmlRequest
        .mockResolvedValueOnce({
          success: true,
          data: { word: 'hello', definitions: [{ meaning: 'greeting' }] }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { word: 'world', definitions: [{ meaning: 'earth' }] }
        })

      const result = await dictionaryService.queryWords({
        words: ['hello', 'world']
      })

      expect(result.success).toBe(true)
      expect(result.data!.statistics.total).toBe(2)
      expect(result.data!.statistics.successful).toBe(2)
      expect(result.data!.statistics.failed).toBe(0)
      expect(Object.keys(result.data!.results)).toHaveLength(2)
    })

    test('应该处理部分失败的批量查询 / Should handle partially failed batch query', async () => {
      mockApi.dictionary.eudicHtmlRequest
        .mockResolvedValueOnce({
          success: true,
          data: { word: 'hello', definitions: [{ meaning: 'greeting' }] }
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Word not found'
        })

      const result = await dictionaryService.queryWords({
        words: ['hello', 'invalid']
      })

      expect(result.success).toBe(true)
      expect(result.data!.statistics.successful).toBe(1)
      expect(result.data!.statistics.failed).toBe(1)
      expect(Object.keys(result.data!.results)).toHaveLength(1)
      expect(Object.keys(result.data!.errors)).toHaveLength(1)
    })

    test('应该拒绝空的批量查询 / Should reject empty batch query', async () => {
      const result = await dictionaryService.queryWords({ words: [] })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Words array is required')
    })
  })

  describe('缓存管理 / Cache Management', () => {
    test('应该正确清空缓存 / Should clear cache correctly', async () => {
      // 查询一个单词以填充缓存 / Query a word to populate cache
      await dictionaryService.queryWord('test')

      let cacheStats = await dictionaryService.getCacheStats()
      expect(cacheStats.size).toBeGreaterThan(0)

      // 清空缓存 / Clear cache
      await dictionaryService.clearCache()

      cacheStats = await dictionaryService.getCacheStats()
      expect(cacheStats.size).toBe(0)
    })

    test('应该禁用缓存 / Should disable cache', async () => {
      await dictionaryService.configure({
        engine: 'eudic-html',
        cacheEnabled: false
      })

      // 查询同一个单词两次 / Query same word twice
      await dictionaryService.queryWord('test')
      await dictionaryService.queryWord('test')

      // 应该调用API两次 / Should call API twice
      expect(mockApi.dictionary.eudicHtmlRequest).toHaveBeenCalledTimes(2)
    })
  })

  describe('统计信息 / Statistics', () => {
    test('应该正确跟踪查询统计 / Should track query statistics correctly', async () => {
      // 模拟网络延迟以产生实际的响应时间 / Mock network delay to generate actual response time
      mockApi.dictionary.eudicHtmlRequest.mockImplementation(async (word) => {
        await new Promise((resolve) => setTimeout(resolve, 10)) // 添加10ms延迟 / Add 10ms delay
        return {
          success: true,
          data: {
            word: word || 'test',
            phonetic: '/test/',
            definitions: [{ meaning: 'a test' }],
            translations: ['测试']
          }
        }
      })

      // 执行一些查询 / Perform some queries
      await dictionaryService.queryWord('test1')
      await dictionaryService.queryWord('test2')
      await dictionaryService.queryWord('test1') // 缓存命中 / Cache hit

      const stats = await dictionaryService.getStatistics()

      expect(stats.totalQueries).toBe(3)
      expect(stats.successfulQueries).toBe(2) // 只有2次实际API调用 / Only 2 actual API calls
      expect(stats.cacheHits).toBe(1)
      expect(stats.averageResponseTime).toBeGreaterThan(0)
    })

    test('应该正确跟踪失败的查询 / Should track failed queries correctly', async () => {
      // 设置模拟失败 / Set up mock failure
      mockApi.dictionary.eudicHtmlRequest.mockRejectedValue(new Error('Network error'))

      await dictionaryService.queryWord('failtest')

      const stats = await dictionaryService.getStatistics()

      expect(stats.totalQueries).toBe(1)
      expect(stats.successfulQueries).toBe(0)
      expect(stats.failedQueries).toBe(1)
    })

    test('应该正确计算平均响应时间 / Should calculate average response time correctly', async () => {
      // 模拟不同的响应时间 / Mock different response times
      mockApi.dictionary.eudicHtmlRequest.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: { word: 'test', definitions: [{ meaning: 'test' }] }
                }),
              100
            )
          )
      )

      await dictionaryService.queryWord('test1')
      await dictionaryService.queryWord('test2')

      const stats = await dictionaryService.getStatistics()

      expect(stats.averageResponseTime).toBeGreaterThan(90) // 考虑到测试环境的延迟 / Consider test environment delays
    })
  })

  describe('服务状态 / Service Status', () => {
    test('应该返回正确的服务状态 / Should return correct service status', async () => {
      const status = await dictionaryService.getServiceStatus()

      expect(status.connected).toBe(true)
      expect(status.authenticated).toBe(true)
      expect(status.rateLimited).toBe(false)
    })
  })

  describe('健康检查 / Health Check', () => {
    test('应该通过健康检查 / Should pass health check', async () => {
      const healthCheck = await dictionaryService.healthCheck()

      expect(healthCheck.healthy).toBe(true)
      expect(healthCheck.details).toBeDefined()
      expect(healthCheck.details!.engine).toBe('eudic-html')
      expect(healthCheck.details!.cacheEnabled).toBe(true)
    })
  })

  describe('资源管理 / Resource Management', () => {
    test('应该正确销毁服务 / Should dispose service correctly', async () => {
      await dictionaryService.dispose()

      expect(dictionaryService.isDisposed).toBe(true)

      // 尝试使用已销毁的服务应该抛出错误 / Attempting to use disposed service should throw error
      await expect(dictionaryService.queryWord('test')).rejects.toThrow()
    })

    test('应该在dispose后清理所有资源 / Should clean up all resources after dispose', async () => {
      // 先添加一些缓存数据 / Add some cache data first
      await dictionaryService.queryWord('cleanup-test')

      const cacheStats = await dictionaryService.getCacheStats()
      expect(cacheStats.size).toBeGreaterThan(0)

      await dictionaryService.dispose()

      // 验证资源已清理 / Verify resources are cleaned up
      expect(dictionaryService.isDisposed).toBe(true)
    })
  })

  describe('边界情况和错误处理 / Boundary Cases and Error Handling', () => {
    test('应该处理网络超时 / Should handle network timeout', async () => {
      // 模拟网络超时 / Mock network timeout
      mockApi.dictionary.eudicHtmlRequest.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )

      const result = await dictionaryService.queryWord('timeout-test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Timeout')
    })

    test('应该处理特殊字符输入 / Should handle special character input', async () => {
      const specialWords = ['@#$%', '中文词汇', 'café', 'naïve', '']

      for (const word of specialWords) {
        if (word === '') continue // 空字符串已在其他测试中处理 / Empty string handled in other tests

        const result = await dictionaryService.queryWord(word)

        // 不应该抛出错误，即使查询失败 / Should not throw error even if query fails
        expect(result).toBeDefined()
        expect(typeof result.success).toBe('boolean')
      }
    })

    test('应该处理非常长的输入 / Should handle very long input', async () => {
      const longWord = 'a'.repeat(1000)

      const result = await dictionaryService.queryWord(longWord)

      expect(result).toBeDefined()
      expect(typeof result.success).toBe('boolean')
    })

    test('应该处理API返回格式错误 / Should handle API return format errors', async () => {
      // 模拟API返回错误格式 / Mock API returning wrong format
      mockApi.dictionary.eudicHtmlRequest.mockResolvedValue({
        success: true,
        data: null // 错误的数据格式 / Wrong data format
      })

      const result = await dictionaryService.queryWord('format-error-test')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('应该处理并发查询 / Should handle concurrent queries', async () => {
      const words = ['concurrent1', 'concurrent2', 'concurrent3', 'concurrent4', 'concurrent5']

      // 设置不同的返回结果 / Set different return results
      mockApi.dictionary.eudicHtmlRequest.mockImplementation((word) =>
        Promise.resolve({
          success: true,
          data: { word, definitions: [{ meaning: `meaning of ${word}` }] }
        })
      )

      const promises = words.map((word) => dictionaryService.queryWord(word))
      const results = await Promise.all(promises)

      // 所有查询都应该成功 / All queries should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.data?.word).toBe(words[index])
      })
    })

    test('应该处理缓存TTL过期 / Should handle cache TTL expiration', async () => {
      // 配置较短的缓存TTL / Configure short cache TTL
      await dictionaryService.configure({
        engine: 'eudic-html',
        cacheEnabled: true,
        cacheTtl: 100 // 100ms
      })

      // 第一次查询 / First query
      const result1 = await dictionaryService.queryWord('ttl-test')
      expect(result1.success).toBe(true)
      expect(result1.data?.metadata?.cacheHit).toBe(false)

      // 等待TTL过期 / Wait for TTL expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      // 第二次查询应该重新从API获取 / Second query should fetch from API again
      const result2 = await dictionaryService.queryWord('ttl-test')
      expect(result2.success).toBe(true)
      expect(result2.data?.metadata?.cacheHit).toBe(false)

      // 应该调用API两次 / Should call API twice
      expect(mockApi.dictionary.eudicHtmlRequest).toHaveBeenCalledTimes(2)
    })
  })

  describe('多引擎支持 / Multi-Engine Support', () => {
    test('应该支持切换到不同的引擎 / Should support switching to different engines', async () => {
      // 测试切换到有道词典 / Test switching to Youdao dictionary
      await dictionaryService.configure({
        engine: 'youdao',
        apiKey: 'test-youdao-key',
        apiSecret: 'test-youdao-secret'
      })

      expect(dictionaryService.engine).toBe('youdao')

      // 切换到欧陆词典API版本 / Switch to Eudic API version
      await dictionaryService.configure({
        engine: 'eudic',
        apiKey: 'test-eudic-key'
      })

      expect(dictionaryService.engine).toBe('eudic')
    })

    test('应该为不同引擎维护独立的配置 / Should maintain separate configuration for different engines', async () => {
      // 配置欧陆词典 / Configure Eudic
      await dictionaryService.configure({
        engine: 'eudic',
        apiKey: 'eudic-key'
      })

      // 配置有道词典 / Configure Youdao
      await dictionaryService.configure({
        engine: 'youdao',
        apiKey: 'youdao-key',
        apiSecret: 'youdao-secret'
      })

      // 验证当前引擎 / Verify current engine
      expect(dictionaryService.engine).toBe('youdao')
    })

    test('应该处理不支持的引擎 / Should handle unsupported engines', async () => {
      // 尝试配置不支持的引擎 / Try to configure unsupported engine
      await expect(
        dictionaryService.configure({
          engine: 'unsupported-engine' as any
        })
      ).rejects.toThrow()
    })
  })

  describe('性能和负载测试 / Performance and Load Testing', () => {
    test('应该处理大量连续查询 / Should handle large number of consecutive queries', async () => {
      const queryCount = 50
      const results = []

      for (let i = 0; i < queryCount; i++) {
        const result = await dictionaryService.queryWord(`word${i}`)
        results.push(result)
      }

      // 验证所有查询都得到了处理 / Verify all queries were processed
      expect(results.length).toBe(queryCount)

      const stats = await dictionaryService.getStatistics()
      expect(stats.totalQueries).toBe(queryCount)
    })

    test('应该限制缓存大小以避免内存泄漏 / Should limit cache size to prevent memory leaks', async () => {
      // 查询大量不同的单词 / Query many different words
      const words = Array.from({ length: 100 }, (_, i) => `cacheword${i}`)

      for (const word of words) {
        await dictionaryService.queryWord(word)
      }

      const cacheStats = await dictionaryService.getCacheStats()

      // 验证缓存已存储数据 / Verify cache has stored data
      expect(cacheStats.size).toBeGreaterThan(0)
      expect(cacheStats.size).toBeLessThanOrEqual(100)
    })
  })
})
