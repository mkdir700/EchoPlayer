/**
 * IPC 通信客户端实现
 * IPC Communication Client Implementation
 *
 * 提供类型安全的 Electron IPC 通信封装
 * Provides type-safe Electron IPC communication wrapper
 */

import type { IpcChannel, IpcRequest, IpcResponse } from '../types/api/ipc.types'
import type { OperationResult } from '../types/shared/common.types'
import { createSuccessResult, createErrorResult } from '../utils/type-factories'

// IPC 客户端配置 / IPC Client Configuration
export interface IpcClientConfig {
  readonly timeout: number // 请求超时时间（毫秒）
  readonly retries: number // 重试次数
  readonly retryDelay: number // 重试延迟（毫秒）
  readonly enableLogging: boolean // 启用日志
}

// 默认配置 / Default Configuration
const DEFAULT_CONFIG: IpcClientConfig = {
  timeout: 30000, // 30秒
  retries: 3,
  retryDelay: 1000, // 1秒
  enableLogging: process.env.NODE_ENV === 'development'
}

// IPC 客户端实现 / IPC Client Implementation
export class IpcClient {
  private config: IpcClientConfig
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: unknown) => void
      reject: (error: unknown) => void
      timeout: NodeJS.Timeout
    }
  >()

  constructor(config: Partial<IpcClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupResponseHandler()
  }

  /**
   * 发送 IPC 请求 / Send IPC Request
   */
  async request<TRequest = unknown, TResponse = unknown>(
    channel: IpcChannel,
    data?: TRequest,
    timeout?: number
  ): Promise<OperationResult<TResponse>> {
    const requestId = this.generateRequestId()
    const requestTimeout = timeout || this.config.timeout

    const request: IpcRequest<TRequest> = {
      channel,
      data,
      requestId,
      timestamp: new Date(),
      timeout: requestTimeout
    }

    this.log('debug', `Sending IPC request: ${channel}`, { requestId, data })

    try {
      const response = await this.sendWithRetry(request, this.config.retries)

      if (response.success) {
        this.log('debug', `IPC request successful: ${channel}`, { requestId, response })
        return createSuccessResult(response.data as TResponse)
      } else {
        this.log('error', `IPC request failed: ${channel}`, { requestId, error: response.error })
        return createErrorResult<TResponse>(response.error || 'Unknown IPC error')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.log('error', `IPC request error: ${channel}`, { requestId, error: errorMessage })
      return createErrorResult<TResponse>(errorMessage)
    }
  }

  /**
   * 发送不需要响应的 IPC 消息 / Send IPC Message (No Response)
   */
  send<TData = unknown>(channel: IpcChannel, data?: TData): void {
    const request: IpcRequest<TData> = {
      channel,
      data,
      requestId: this.generateRequestId(),
      timestamp: new Date()
    }

    this.log('debug', `Sending IPC message: ${channel}`, { data })

    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send(channel, request)
    } else {
      this.log('error', 'Electron IPC not available')
    }
  }

  /**
   * 监听 IPC 事件 / Listen to IPC Events
   */
  on<TData = unknown>(channel: IpcChannel, handler: (data: TData) => void): () => void {
    if (!window.electron?.ipcRenderer) {
      this.log('error', 'Electron IPC not available')
      return (): void => {}
    }

    const wrappedHandler = (_event: unknown, data: TData): void => {
      this.log('debug', `Received IPC event: ${channel}`, { data })
      handler(data)
    }

    window.electron.ipcRenderer.on(channel, wrappedHandler)

    // 返回取消监听的函数 / Return unsubscribe function
    return (): void => {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners(channel)
      }
    }
  }

  /**
   * 监听一次性 IPC 事件 / Listen to One-time IPC Event
   */
  once<TData = unknown>(channel: IpcChannel, handler: (data: TData) => void): void {
    if (!window.electron?.ipcRenderer) {
      this.log('error', 'Electron IPC not available')
      return
    }

    const wrappedHandler = (_event: unknown, data: TData): void => {
      this.log('debug', `Received one-time IPC event: ${channel}`, { data })
      handler(data)
    }

    // 注意：现有的 electron.ipcRenderer 可能没有 once 方法，使用 on 并手动移除
    const onceHandler = (_event: unknown, data: TData): void => {
      window.electron?.ipcRenderer.removeAllListeners(channel)
      wrappedHandler(_event, data)
    }
    window.electron.ipcRenderer.on(channel, onceHandler)
  }

  /**
   * 移除所有监听器 / Remove All Listeners
   */
  removeAllListeners(channel?: IpcChannel): void {
    if (!window.electron?.ipcRenderer) {
      this.log('error', 'Electron IPC not available')
      return
    }

    if (channel) {
      window.electron.ipcRenderer.removeAllListeners(channel)
      this.log('debug', `Removed all listeners for channel: ${channel}`)
    } else {
      // 注意：这可能会影响其他组件的监听器
      this.log('warn', 'Removing all IPC listeners - this may affect other components')
    }
  }

  /**
   * 检查 IPC 是否可用 / Check if IPC is Available
   */
  isAvailable(): boolean {
    return !!window.electron?.ipcRenderer
  }

  /**
   * 获取待处理请求数量 / Get Pending Requests Count
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size
  }

  /**
   * 取消所有待处理请求 / Cancel All Pending Requests
   */
  cancelAllRequests(): void {
    for (const [, { reject, timeout }] of this.pendingRequests.entries()) {
      clearTimeout(timeout)
      reject(new Error('Request cancelled'))
    }
    this.pendingRequests.clear()
    this.log('debug', 'Cancelled all pending requests')
  }

  // 私有方法 / Private Methods

  private generateRequestId(): string {
    return `ipc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  private async sendWithRetry<TRequest, TResponse>(
    request: IpcRequest<TRequest>,
    retries: number
  ): Promise<IpcResponse<TResponse>> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.sendRequest<TRequest, TResponse>(request)
      } catch (error) {
        if (attempt === retries) {
          throw error
        }

        this.log('warn', `IPC request attempt ${attempt + 1} failed, retrying...`, {
          requestId: request.requestId,
          error
        })

        await this.delay(this.config.retryDelay * (attempt + 1))
      }
    }

    throw new Error('Max retries exceeded')
  }

  private sendRequest<TRequest, TResponse>(
    request: IpcRequest<TRequest>
  ): Promise<IpcResponse<TResponse>> {
    return new Promise((resolve, reject) => {
      if (!window.electron?.ipcRenderer) {
        reject(new Error('Electron IPC not available'))
        return
      }

      // 设置超时 / Set timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request.requestId)
        reject(new Error(`IPC request timeout: ${request.channel}`))
      }, request.timeout || this.config.timeout)

      // 存储待处理请求 / Store pending request
      this.pendingRequests.set(request.requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout
      })

      // 发送请求 / Send request
      window.electron.ipcRenderer
        .invoke(request.channel, request)
        .then((response: IpcResponse<TResponse>) => {
          const pending = this.pendingRequests.get(request.requestId)
          if (pending) {
            clearTimeout(pending.timeout)
            this.pendingRequests.delete(request.requestId)
            resolve(response)
          }
        })
        .catch((error: unknown) => {
          const pending = this.pendingRequests.get(request.requestId)
          if (pending) {
            clearTimeout(pending.timeout)
            this.pendingRequests.delete(request.requestId)
            reject(error)
          }
        })
    })
  }

  private setupResponseHandler(): void {
    // 这里可以设置全局响应处理器
    // 例如处理服务器推送的事件等
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (!this.config.enableLogging) return

    const logMethod = console[level] || console.log
    logMethod(`[IpcClient] ${message}`, data)
  }
}

// 全局 IPC 客户端实例 / Global IPC Client Instance
export const globalIpcClient = new IpcClient()

// 便捷函数 / Convenience Functions
export const ipcRequest = <TRequest = unknown, TResponse = unknown>(
  channel: IpcChannel,
  data?: TRequest,
  timeout?: number
): Promise<OperationResult<TResponse>> => {
  return globalIpcClient.request<TRequest, TResponse>(channel, data, timeout)
}

export const ipcSend = <TData = unknown>(channel: IpcChannel, data?: TData): void => {
  globalIpcClient.send<TData>(channel, data)
}

export const ipcOn = <TData = unknown>(
  channel: IpcChannel,
  handler: (data: TData) => void
): (() => void) => {
  return globalIpcClient.on<TData>(channel, handler)
}

export const ipcOnce = <TData = unknown>(
  channel: IpcChannel,
  handler: (data: TData) => void
): void => {
  globalIpcClient.once<TData>(channel, handler)
}

// 类型安全的 IPC 调用包装器 / Type-safe IPC Call Wrappers
export const createIpcCaller = <TRequest, TResponse>(channel: IpcChannel) => {
  return (data?: TRequest, timeout?: number): Promise<OperationResult<TResponse>> => {
    return ipcRequest<TRequest, TResponse>(channel, data, timeout)
  }
}

export const createIpcSender = <TData>(channel: IpcChannel) => {
  return (data?: TData): void => {
    ipcSend<TData>(channel, data)
  }
}

export const createIpcListener = <TData>(channel: IpcChannel) => {
  return (handler: (data: TData) => void): (() => void) => {
    return ipcOn<TData>(channel, handler)
  }
}
