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

type Handler = (...args: any[]) => void
type HandlerMap = Record<string, Handler[]>

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

describe('DeepgramTranscriber.makeValidationRequest', () => {
  let transcriber: InstanceType<DeepgramTranscriberClass>
  let requestSpy: SpyInstance

  beforeEach(() => {
    transcriber = new DeepgramTranscriber(1)
    requestSpy = vi.spyOn(https, 'request')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('返回验证成功当 Deepgram 返回 200', async () => {
    const apiKey = 'valid-api-key'

    requestSpy.mockImplementation((options: any, callback: any) => {
      expect(options.hostname).toBe('api.deepgram.com')
      expect(options.path).toBe('/v1/auth/token')
      expect(options.method).toBe('GET')
      expect(options.headers.Authorization).toBe(`Token ${apiKey}`)
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(options.timeout).toBe(8000)

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
      emitResponse(response, responseHandlers, 200, [Buffer.from('{"access_token": "test-token"}')])

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: true })
    expect(mockLogger.info).toHaveBeenCalledWith('API Key 验证成功')
  })

  it('返回验证失败当 Deepgram 返回 401 INVALID_AUTH', async () => {
    const apiKey = 'invalid-api-key'

    requestSpy.mockImplementation((_options: any, callback: any) => {
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
      const errorBody = JSON.stringify({
        err_code: 'INVALID_AUTH',
        message: 'Invalid credentials.'
      })
      emitResponse(response, responseHandlers, 401, [Buffer.from(errorBody)])

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: false, error: 'API Key 无效' })
  })

  it('返回验证失败当 Deepgram 返回 401 INSUFFICIENT_PERMISSIONS', async () => {
    const apiKey = 'insufficient-permissions-key'

    requestSpy.mockImplementation((_options: any, callback: any) => {
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
      const errorBody = JSON.stringify({
        err_code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions.'
      })
      emitResponse(response, responseHandlers, 401, [Buffer.from(errorBody)])

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: false, error: 'API Key 权限不足' })
  })

  it('返回验证失败当 Deepgram 返回 401 但响应体不是有效 JSON', async () => {
    const apiKey = 'invalid-api-key'

    requestSpy.mockImplementation((_options: any, callback: any) => {
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
      emitResponse(response, responseHandlers, 401, ['Invalid credentials'])

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: false, error: 'API Key 认证失败' })
  })

  it('返回验证失败当 Deepgram 返回 403', async () => {
    const apiKey = 'forbidden-api-key'

    requestSpy.mockImplementation((_options: any, callback: any) => {
      const responseHandlers: HandlerMap = {}
      const response = {
        statusCode: 403,
        on: vi.fn((event: string, handler: Handler) => {
          ;(responseHandlers[event] ||= []).push(handler)
          return response
        })
      }

      callback?.(response as any)

      const requestState = createFakeRequest()
      emitResponse(response, responseHandlers, 403)

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: false, error: 'API Key 权限不足或访问被拒绝' })
  })

  it('返回验证失败当收到其他 HTTP 状态码', async () => {
    const apiKey = 'test-api-key'

    requestSpy.mockImplementation((_options: any, callback: any) => {
      const responseHandlers: HandlerMap = {}
      const response = {
        statusCode: 500,
        on: vi.fn((event: string, handler: Handler) => {
          ;(responseHandlers[event] ||= []).push(handler)
          return response
        })
      }

      callback?.(response as any)

      const requestState = createFakeRequest()
      emitResponse(response, responseHandlers, 500, [Buffer.from('Internal Server Error')])

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: false, error: '验证失败 (HTTP 500)' })
    expect(mockLogger.warn).toHaveBeenCalledWith('API Key 验证收到意外状态码', {
      statusCode: 500,
      body: 'Internal Server Error'
    })
  })

  it('返回验证失败当网络请求出错', async () => {
    const apiKey = 'test-api-key'

    requestSpy.mockImplementation((_options: any, callback: any) => {
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

      process.nextTick(() => {
        requestState.handlers.error?.forEach((handler) => handler(new Error('ECONNRESET')))
      })

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: false, error: '网络连接失败，请检查网络设置' })
    expect(mockLogger.error).toHaveBeenCalledWith('API Key 验证请求失败', { error: 'ECONNRESET' })
  })

  it('返回验证失败当请求超时', async () => {
    const apiKey = 'test-api-key'

    requestSpy.mockImplementation((_options: any, callback: any) => {
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

      // 模拟超时
      process.nextTick(() => {
        requestState.handlers.timeout?.forEach((handler) => handler())
      })

      return requestState.req as any
    })

    const result = await (transcriber as any).makeValidationRequest(apiKey)

    expect(result).toEqual({ valid: false, error: '验证请求超时，请稍后重试' })
    expect(mockLogger.error).toHaveBeenCalledWith('API Key 验证请求超时')
    expect(requestSpy.mock.results[0].value.destroy).toHaveBeenCalled()
  })
})
