import type { DeepgramWord } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock logger using vi.hoisted to ensure it's available before imports
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}))

vi.mock('../LoggerService', () => ({
  loggerService: {
    withContext: () => mockLogger
  }
}))

// Mock Electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
    getVersion: vi.fn(() => '1.0.0')
  },
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn()
  }
}))

// Mock electron-conf
vi.mock('electron-conf/main', () => ({
  Conf: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn()
  }))
}))

// Mock other dependencies
vi.mock('../ConfigManager', () => ({
  configManager: {
    getDeepgramApiKey: vi.fn(() => 'mock-api-key'),
    getASRDefaultLanguage: vi.fn(() => 'en'),
    getASRModel: vi.fn(() => 'nova-2'),
    getZhipuApiKey: vi.fn(() => 'mock-zhipu-api-key')
  }
}))

vi.mock('../../db/dao', () => ({
  db: {
    subtitleLibrary: {
      addSubtitle: vi.fn()
    }
  }
}))

// Mock AudioPreprocessor
vi.mock('../audio/AudioPreprocessor', () => ({
  default: vi.fn().mockImplementation(() => ({
    createTempDir: vi.fn(() => '/mock/temp'),
    extractAudioTrack: vi.fn(),
    cleanupTempDir: vi.fn()
  }))
}))

// Mock SubtitleFormatter
vi.mock('../asr/SubtitleFormatter', () => ({
  default: vi.fn().mockImplementation(() => ({
    formatSubtitles: vi.fn(),
    exportToSRT: vi.fn(),
    exportToVTT: vi.fn()
  }))
}))

// Mock DeepgramTranscriber
vi.mock('../asr/DeepgramTranscriber', () => ({
  default: vi.fn().mockImplementation(() => ({
    transcribeFile: vi.fn(),
    validateApiKey: vi.fn(),
    cancelAll: vi.fn()
  }))
}))

describe('ASRSubtitleService - shouldBreakSentence', () => {
  let ASRSubtitleService: any
  let service: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Dynamically import the service
    const module = await import('../ASRSubtitleService')
    ASRSubtitleService = module.default
    service = new ASRSubtitleService()
  })

  /**
   * Helper function to access the private shouldBreakSentence method
   */
  const testShouldBreakSentence = (
    currentWord: DeepgramWord,
    nextWord: DeepgramWord | undefined,
    sentenceStartTime: number,
    isLastWord: boolean
  ): boolean => {
    // Access private method using bracket notation
    return service['shouldBreakSentence'](currentWord, nextWord, sentenceStartTime, isLastWord)
  }

  /**
   * Helper function to create a mock DeepgramWord
   */
  const createWord = (
    word: string,
    punctuated_word: string,
    start: number,
    end: number
  ): DeepgramWord => ({
    word,
    punctuated_word,
    start,
    end,
    confidence: 0.95
  })

  describe('Last word detection', () => {
    it('should break at the last word', () => {
      const word = createWord('world', 'world.', 1.0, 1.5)
      const result = testShouldBreakSentence(word, undefined, 0, true)
      expect(result).toBe(true)
    })
  })

  describe('Sentence ending punctuation (no pause required)', () => {
    it('should break on period with any pause', () => {
      const currentWord = createWord('world', 'world.', 1.0, 1.5)
      const nextWord = createWord('Hello', 'Hello', 2.0, 2.5) // 500ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })

    it('should break on question mark with any pause', () => {
      const currentWord = createWord('you', 'you?', 1.0, 1.5)
      const nextWord = createWord('Yes', 'Yes', 2.0, 2.5) // 500ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })

    it('should break on exclamation mark with any pause', () => {
      const currentWord = createWord('amazing', 'amazing!', 1.0, 1.5)
      const nextWord = createWord('Really', 'Really', 2.0, 2.5) // 500ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })

    it('should break on period even with short pause (< 300ms)', () => {
      const currentWord = createWord('world', 'world.', 1.0, 1.5)
      const nextWord = createWord('Hello', 'Hello', 1.7, 2.2) // 200ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true) // Now breaks on punctuation alone
    })

    it('should break on Chinese period regardless of pause', () => {
      const currentWord = createWord('世界', '世界。', 1.0, 1.5)
      const nextWord = createWord('你好', '你好', 2.0, 2.5) // 500ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })
  })

  describe('Long pause detection', () => {
    it('should break on pause > 800ms', () => {
      const currentWord = createWord('hello', 'hello', 1.0, 1.5)
      const nextWord = createWord('world', 'world', 2.5, 3.0) // 1000ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })

    it('should NOT break on pause < 800ms', () => {
      const currentWord = createWord('hello', 'hello', 1.0, 1.5)
      const nextWord = createWord('world', 'world', 2.0, 2.5) // 500ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(false)
    })
  })

  describe('Duration-based breaking (8-10 seconds)', () => {
    it('should break at 8s+ duration with comma', () => {
      const currentWord = createWord('word', 'word,', 8.5, 9.0)
      const nextWord = createWord('next', 'next', 9.2, 9.7)
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })

    it('should break at 8s+ duration with pause > 200ms', () => {
      const currentWord = createWord('word', 'word', 8.5, 9.0)
      const nextWord = createWord('next', 'next', 9.5, 10.0) // 500ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })

    it('should NOT break at 8s+ duration without punctuation or pause', () => {
      const currentWord = createWord('word', 'word', 8.5, 9.0)
      const nextWord = createWord('next', 'next', 9.1, 9.6) // 100ms pause, no punctuation
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(false)
    })

    it('should force break at 10s+ duration regardless of punctuation', () => {
      const currentWord = createWord('word', 'word', 10.5, 11.0)
      const nextWord = createWord('next', 'next', 11.1, 11.6) // No punctuation, short pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle word without punctuated_word field', () => {
      const currentWord: DeepgramWord = {
        word: 'hello',
        start: 1.0,
        end: 1.5,
        confidence: 0.95
      }
      const nextWord = createWord('world', 'world', 2.0, 2.5)
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(false)
    })

    it('should handle zero pause duration', () => {
      const currentWord = createWord('hello', 'hello', 1.0, 1.5)
      const nextWord = createWord('world', 'world', 1.5, 2.0) // 0ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(false)
    })

    it('should handle very short sentence with period and pause', () => {
      const currentWord = createWord('Hi', 'Hi.', 0.5, 1.0)
      const nextWord = createWord('Bye', 'Bye', 1.5, 2.0) // 500ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 0, false)
      expect(result).toBe(true)
    })
  })

  describe('Real-world test cases', () => {
    it('should break on sentence-ending punctuation even with minimal pause', () => {
      // Real data from user: "tell." followed by "It's" with 0ms pause
      // This should break because "tell." has sentence-ending punctuation
      const currentWord = createWord('tell', 'tell.', 50.745, 51.225)
      const nextWord = createWord("it's", "It's", 51.225, 51.385002) // 0ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 49.785, false)

      // ✅ Fixed: Now breaks on sentence-ending punctuation
      expect(result).toBe(true)
    })

    it('should break on sentence-ending punctuation with short pause (80ms)', () => {
      // Real data: "with." followed by "Come" with 80ms pause
      const currentWord = createWord('with', 'with.', 52.345, 52.825)
      const nextWord = createWord('come', 'Come', 52.905, 53.465) // 80ms pause
      const result = testShouldBreakSentence(currentWord, nextWord, 49.785, false)

      // ✅ Fixed: Now breaks on sentence-ending punctuation
      expect(result).toBe(true)
    })

    it('should handle complete real-world sentence sequence', () => {
      // Test the complete sequence from user's example
      const words: DeepgramWord[] = [
        {
          word: "there's",
          start: 49.785,
          end: 50.265,
          confidence: 0.9863529,
          punctuated_word: "There's"
        },
        {
          word: 'nothing',
          start: 50.265,
          end: 50.505,
          confidence: 0.99985075,
          punctuated_word: 'nothing'
        },
        { word: 'to', start: 50.505, end: 50.745, confidence: 0.99971515, punctuated_word: 'to' },
        {
          word: 'tell',
          start: 50.745,
          end: 51.225,
          confidence: 0.9826325,
          punctuated_word: 'tell.'
        },
        {
          word: "it's",
          start: 51.225,
          end: 51.385002,
          confidence: 0.8772707,
          punctuated_word: "It's"
        },
        {
          word: 'just',
          start: 51.385002,
          end: 51.545,
          confidence: 0.99974877,
          punctuated_word: 'just'
        },
        {
          word: 'some',
          start: 51.545,
          end: 51.705,
          confidence: 0.99927837,
          punctuated_word: 'some'
        },
        {
          word: 'guy',
          start: 51.705,
          end: 51.864998,
          confidence: 0.999765,
          punctuated_word: 'guy'
        },
        { word: 'i', start: 51.864998, end: 52.105, confidence: 0.9979578, punctuated_word: 'I' },
        {
          word: 'work',
          start: 52.105,
          end: 52.345,
          confidence: 0.98591065,
          punctuated_word: 'work'
        },
        {
          word: 'with',
          start: 52.345,
          end: 52.825,
          confidence: 0.9990688,
          punctuated_word: 'with.'
        },
        {
          word: 'come',
          start: 52.905,
          end: 53.465,
          confidence: 0.9908832,
          punctuated_word: 'Come'
        },
        { word: 'on', start: 53.465, end: 54.025, confidence: 0.96900225, punctuated_word: 'on.' },
        {
          word: "you're",
          start: 54.025,
          end: 54.505,
          confidence: 0.99452776,
          punctuated_word: "You're"
        },
        {
          word: 'going',
          start: 54.505,
          end: 54.745,
          confidence: 0.9983157,
          punctuated_word: 'going'
        },
        { word: 'out', start: 54.745, end: 54.905, confidence: 0.9927585, punctuated_word: 'out' },
        {
          word: 'with',
          start: 54.905,
          end: 55.065,
          confidence: 0.9994931,
          punctuated_word: 'with'
        },
        { word: 'the', start: 55.065, end: 55.145, confidence: 0.8043892, punctuated_word: 'the' },
        {
          word: 'guy',
          start: 55.145,
          end: 55.465,
          confidence: 0.99105775,
          punctuated_word: 'guy.'
        },
        {
          word: "there's",
          start: 55.465,
          end: 55.625,
          confidence: 0.9992779,
          punctuated_word: "There's"
        },
        {
          word: 'gotta',
          start: 55.625,
          end: 55.785,
          confidence: 0.7105091,
          punctuated_word: 'gotta'
        },
        { word: 'be', start: 55.785, end: 55.945, confidence: 0.9926218, punctuated_word: 'be' },
        {
          word: 'something',
          start: 55.945,
          end: 56.265,
          confidence: 0.99703157,
          punctuated_word: 'something'
        },
        {
          word: 'wrong',
          start: 56.265,
          end: 56.505,
          confidence: 0.99949515,
          punctuated_word: 'wrong'
        },
        {
          word: 'with',
          start: 56.505,
          end: 56.665,
          confidence: 0.9996629,
          punctuated_word: 'with'
        },
        { word: 'him', start: 56.665, end: 56.905, confidence: 0.9875486, punctuated_word: 'him.' }
      ]

      // Use the private method to group words into sentences
      const sentences = service['groupWordsIntoSentences'](words)

      // ✅ Fixed: Now correctly produces 5 sentences based on sentence-ending punctuation
      // Expected sentences:
      // 1. "There's nothing to tell."
      // 2. "It's just some guy I work with."
      // 3. "Come on."
      // 4. "You're going out with the guy."
      // 5. "There's gotta be something wrong with him."

      expect(sentences.length).toBe(5)
      expect(sentences[0].text).toBe("There's nothing to tell.")
      expect(sentences[1].text).toBe("It's just some guy I work with.")
      expect(sentences[2].text).toBe('Come on.')
      expect(sentences[3].text).toBe("You're going out with the guy.")
      expect(sentences[4].text).toBe("There's gotta be something wrong with him.")
    })
  })
})
