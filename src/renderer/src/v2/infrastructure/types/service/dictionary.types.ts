/**
 * 词典服务类型定义
 * Dictionary Service Types
 */

import { ServiceResult, ServiceConfig } from './base.types'

// 词典引擎类型 / Dictionary Engine Type
export type DictionaryEngine = 'eudic' | 'youdao' | 'eudic-html' | 'openai'

// 词典配置 / Dictionary Configuration
export interface DictionaryConfig extends ServiceConfig {
  engine: DictionaryEngine
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
  maxRetries?: number
  cacheEnabled?: boolean
  cacheTtl?: number
}

// 词典查询结果 / Dictionary Query Result
export interface DictionaryQueryResult {
  word: string
  phonetic?: string
  pronunciations?: Array<{
    type: 'us' | 'uk' | 'general'
    phonetic: string
    audioUrl?: string
  }>
  definitions: Array<{
    partOfSpeech?: string
    meaning: string
    examples?: string[]
    tags?: string[]
  }>
  translations?: string[]
  synonyms?: string[]
  antonyms?: string[]
  etymology?: string
  frequency?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  metadata?: {
    source: string
    timestamp: number
    cacheHit: boolean
  }
}

// 词典服务状态 / Dictionary Service Status
export interface DictionaryServiceStatus {
  connected: boolean
  authenticated: boolean
  rateLimited: boolean
  quotaRemaining?: number
  quotaResetTime?: number
  lastError?: string
}

// 词典服务测试结果 / Dictionary Service Test Result
export interface DictionaryTestResult {
  success: boolean
  message: string
  responseTime?: number
  error?: string
  details?: Record<string, unknown>
}

// 词典服务统计信息 / Dictionary Service Statistics
export interface DictionaryServiceStats {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  cacheHits: number
  averageResponseTime: number
  quotaUsed: number
  quotaLimit: number
}

// 词典服务接口 / Dictionary Service Interface
export interface IDictionaryService {
  readonly engine: DictionaryEngine
  configure(config: DictionaryConfig): Promise<void>
  testConnection(): Promise<DictionaryTestResult>
  queryWord(word: string, context?: string): Promise<ServiceResult<DictionaryQueryResult>>
  getServiceStatus(): Promise<DictionaryServiceStatus>
  getStatistics(): Promise<DictionaryServiceStats>
  clearCache(): Promise<void>
}

// 词典缓存项 / Dictionary Cache Item
export interface DictionaryCacheItem {
  word: string
  result: DictionaryQueryResult
  timestamp: number
  ttl: number
  accessCount: number
}

// 词典批量查询请求 / Dictionary Batch Query Request
export interface DictionaryBatchQueryRequest {
  words: string[]
  context?: string
  priority?: 'high' | 'normal' | 'low'
}

// 词典批量查询结果 / Dictionary Batch Query Result
export interface DictionaryBatchQueryResult {
  results: Record<string, DictionaryQueryResult>
  errors: Record<string, string>
  statistics: {
    total: number
    successful: number
    failed: number
    fromCache: number
  }
}
