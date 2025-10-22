/**
 * Translation related types
 */

export interface TranslationOptions {
  /** Target language for translation (currently only supports 'zh-CN') */
  targetLanguage: 'zh-CN'
  /** Source language (auto-detected if not specified) */
  sourceLanguage?: string
  /** Batch size for translation requests */
  batchSize?: number
  /** Maximum number of concurrent requests */
  maxConcurrency?: number
  /** Video filename for context */
  videoFilename?: string
}

export type TranslationResult =
  | {
      /** Original text */
      originalText: string
      /** Translated text */
      translatedText: string
      /** Source language (detected) */
      sourceLanguage?: string
      /** Target language */
      targetLanguage: string
      /** Whether translation was successful */
      success: true
    }
  | {
      /** Original text */
      originalText: string
      /** Source language (detected) */
      sourceLanguage?: string
      /** Target language */
      targetLanguage: string
      /** Whether translation was successful */
      success: false
      /** Error message */
      error: string
    }

export interface TranslationBatchResult {
  /** Array of translation results */
  readonly results: readonly TranslationResult[]
  /** Number of successful translations */
  successCount: number
  /** Number of failed translations */
  failureCount: number
  /** Total processing time in milliseconds */
  processingTime: number
}

export interface TranslationProgress {
  /** Current batch being processed */
  currentBatch: number
  /** Total number of batches */
  totalBatches: number
  /** Number of items processed in current batch */
  currentBatchProgress: number
  /** Total number of items in current batch */
  currentBatchSize: number
  /** Overall progress percentage (0-100) */
  overallProgress: number
}

export interface TranslationServiceConfig {
  /** Zhipu API Key */
  apiKey: string
  /** Default translation options */
  defaultOptions: TranslationOptions
  /** Request timeout in milliseconds */
  timeout?: number
  /** Maximum retry attempts */
  maxRetries?: number
  /** Retry delay in milliseconds */
  retryDelay?: number
}

/**
 * Translation status for subtitle items
 */
export type TranslationStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Translation metadata for tracking translation state
 */
export interface TranslationMetadata {
  /** ID of the subtitle item */
  subtitleId: string
  /** Current translation status */
  status: TranslationStatus
  /** Last error message */
  lastError?: string
  /** Translation timestamp */
  translatedAt?: number
  /** Translation attempt count */
  attemptCount: number
}
