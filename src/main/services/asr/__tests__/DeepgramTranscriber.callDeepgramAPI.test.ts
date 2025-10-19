import type { DeepgramResponse } from '@shared/types'
import https from 'https'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

type SpyInstance = any

const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

vi.mock('../../LoggerService', () => ({
  loggerService: {
    withContext: () => mockLogger
  }
}))

const statMock = vi.fn()
const createReadStreamMock = vi.fn()

vi.mock('fs', () => {
  const mockModule = {
    createReadStream: createReadStreamMock,
    promises: {
      stat: statMock
    }
  }

  return {
    __esModule: true,
    default: mockModule,
    ...mockModule
  }
})

type Handler = (...args: any[]) => void
type HandlerMap = Record<string, Handler[]>

const createFakeReadStream = () => {
  const handlers: HandlerMap = {}
  const stream = {
    pipe: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn((event: string, handler: Handler) => {
      ;(handlers[event] ||= []).push(handler)
      return stream
    })
  }

  return { stream, handlers }
}

const createFakeRequest = () => {
  const handlers: HandlerMap = {}
  const req = {
    on: vi.fn((event: string, handler: Handler) => {
      ;(handlers[event] ||= []).push(handler)
      return req
    }),
    setTimeout: vi.fn((_: number, handler: Handler) => {
      ;(handlers.timeout ||= []).push(handler)
      return req
    }),
    destroy: vi.fn(),
    end: vi.fn()
  }

  return { req, handlers }
}

const emitResponse = (
  response: { statusCode: number },
  handlers: HandlerMap,
  statusCode: number,
  bodyChunks: Array<string | Buffer> = []
) => {
  response.statusCode = statusCode

  process.nextTick(() => {
    for (const chunk of bodyChunks) {
      handlers.data?.forEach((handler) => handler(chunk))
    }

    handlers.end?.forEach((handler) => handler())
  })
}

type DeepgramTranscriberClass = typeof import('../DeepgramTranscriber').default
let DeepgramTranscriber: DeepgramTranscriberClass

beforeAll(async () => {
  DeepgramTranscriber = (await import('../DeepgramTranscriber')).default
})

describe('DeepgramTranscriber.callDeepgramAPI', () => {
  let transcriber: InstanceType<DeepgramTranscriberClass>
  let requestSpy: SpyInstance

  beforeEach(() => {
    createReadStreamMock.mockReset()
    transcriber = new DeepgramTranscriber(1)

    statMock.mockResolvedValue({ size: 1024 } as any)
    requestSpy = vi.spyOn(https, 'request')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    statMock.mockReset()
    createReadStreamMock.mockReset()
  })

  it('resolves with parsed response when Deepgram returns 200', async () => {
    const audioPath = '/tmp/audio.m4a'
    const callOptions = {
      apiKey: 'test-key',
      model: 'nova-2' as const,
      language: 'en',
      smartFormat: true,
      utterances: true,
      utteranceEndMs: 750
    }

    const fakeResponse: DeepgramResponse = {
      results: {
        channels: [
          {
            alternatives: [
              {
                transcript: 'hello world',
                confidence: 0.95,
                words: []
              }
            ],
            utterances: []
          }
        ]
      },
      metadata: {
        request_id: 'req-123',
        duration: 1.23,
        channels: 1
      }
    }

    const readStream = createFakeReadStream()
    createReadStreamMock.mockReturnValue(readStream.stream as any)

    let currentRequest: ReturnType<typeof createFakeRequest> | undefined

    requestSpy.mockImplementation((url: string, options: any, callback: any) => {
      const searchParams = new URL(url).searchParams
      expect(searchParams.get('model')).toBe('nova-2')
      expect(searchParams.get('language')).toBe('en')
      expect(searchParams.get('detect_language')).toBeNull()
      expect(searchParams.get('smart_format')).toBe('true')
      expect(searchParams.get('utterances')).toBe('true')
      expect(searchParams.get('utterance_end_ms')).toBe('750')

      expect(options.method).toBe('POST')
      expect(options.headers['Content-Type']).toBe('audio/mp4')
      expect(options.headers['Content-Length']).toBe(1024)
      expect(options.headers.Authorization).toBe(`Token ${callOptions.apiKey}`)

      const responseHandlers: HandlerMap = {}
      const response = {
        statusCode: 200,
        on: vi.fn((event: string, handler: Handler) => {
          ;(responseHandlers[event] ||= []).push(handler)
          return response
        })
      }

      callback?.(response as any)

      currentRequest = createFakeRequest()
      readStream.stream.pipe.mockReturnValue(currentRequest.req as any)

      emitResponse(response, responseHandlers, 200, [Buffer.from(JSON.stringify(fakeResponse))])

      return currentRequest.req as any
    })

    const result = await (transcriber as any).callDeepgramAPI(audioPath, callOptions)

    expect(result).toEqual(fakeResponse)
    expect(statMock).toHaveBeenCalledWith(audioPath)
    expect(readStream.stream.pipe).toHaveBeenCalledWith(currentRequest?.req)
  })

  it('rejects with specific error when Deepgram returns 401', async () => {
    const audioPath = '/tmp/audio.wav'
    const callOptions = {
      apiKey: 'test-key',
      model: 'nova-3' as const,
      language: 'auto' as const,
      smartFormat: false,
      utterances: false,
      utteranceEndMs: 500
    }

    const readStream = createFakeReadStream()
    createReadStreamMock.mockReturnValue(readStream.stream as any)

    requestSpy.mockImplementation((url: string, options: any, callback: any) => {
      const params = new URL(url).searchParams
      expect(params.get('model')).toBe('nova-3')
      expect(params.get('language')).toBeNull()
      expect(params.get('detect_language')).toBe('true')
      expect(params.get('smart_format')).toBe('false')
      expect(params.get('utterances')).toBe('false')
      expect(params.get('utterance_end_ms')).toBe('500')

      expect(options.headers['Content-Type']).toBe('audio/wav')

      const responseHandlers: HandlerMap = {}
      const response = {
        statusCode: 401,
        on: vi.fn((event: string, handler: Handler) => {
          ;(responseHandlers[event] ||= []).push(handler)
          return response
        })
      }

      callback?.(response as any)

      const requestState = createFakeRequest()
      readStream.stream.pipe.mockReturnValue(requestState.req as any)

      emitResponse(response, responseHandlers, 401, ['Unauthorized'])

      return requestState.req as any
    })

    await expect((transcriber as any).callDeepgramAPI(audioPath, callOptions)).rejects.toThrow(
      'API Key 无效'
    )
  })

  it('rejects when Deepgram returns invalid JSON body', async () => {
    const audioPath = '/tmp/audio.flac'
    const callOptions = {
      apiKey: 'test-key'
    }

    const readStream = createFakeReadStream()
    createReadStreamMock.mockReturnValue(readStream.stream as any)

    requestSpy.mockImplementation((_url: string, _options: any, callback: any) => {
      const responseHandlers: HandlerMap = {}
      const response = {
        statusCode: 200,
        on: vi.fn((event: string, handler: Handler) => {
          ;(responseHandlers[event] ||= []).push(handler)
          return response
        })
      }

      callback?.(response as any)

      const requestState = createFakeRequest()
      readStream.stream.pipe.mockReturnValue(requestState.req as any)

      emitResponse(response, responseHandlers, 200, ['{ invalid json'])

      return requestState.req as any
    })

    await expect((transcriber as any).callDeepgramAPI(audioPath, callOptions)).rejects.toThrow(
      '解析 Deepgram 响应失败'
    )
  })

  it('rejects on network error and destroys read stream', async () => {
    const audioPath = '/tmp/audio.ogg'
    const callOptions = {
      apiKey: 'test-key'
    }

    const readStream = createFakeReadStream()
    createReadStreamMock.mockReturnValue(readStream.stream as any)

    requestSpy.mockImplementation((_url: string, _options: any, callback: any) => {
      const responseHandlers: HandlerMap = {}
      const response = {
        statusCode: 200,
        on: vi.fn((event: string, handler: Handler) => {
          ;(responseHandlers[event] ||= []).push(handler)
          return response
        })
      }

      callback?.(response as any)

      const requestState = createFakeRequest()
      readStream.stream.pipe.mockReturnValue(requestState.req as any)

      process.nextTick(() => {
        requestState.handlers.error?.forEach((handler) => handler(new Error('connection reset')))
      })

      return requestState.req as any
    })

    await expect((transcriber as any).callDeepgramAPI(audioPath, callOptions)).rejects.toThrow(
      '网络错误: connection reset'
    )

    expect(readStream.stream.destroy).toHaveBeenCalledTimes(1)
  })
})
