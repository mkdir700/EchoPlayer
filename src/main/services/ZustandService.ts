import { ipcMain } from 'electron'
import { EventEmitter } from 'events'

import { loggerService } from './LoggerService'
import { WindowService } from './WindowService'

const logger = loggerService.withContext('ZustandStateSyncService')

type StoreValue = unknown
type Unsubscribe = () => void

interface ZustandState {
  [key: string]: StoreValue
}

interface BatchUpdate {
  storeName: string
  partialState: StoreValue
  replace?: boolean
}

type Selector<T> = string | ((state: ZustandState) => T)

class ZustandStateSyncService extends EventEmitter {
  private stateCache: ZustandState = {}
  private isReady = false
  private readonly STATUS_CHANGE_EVENT = 'statusChange'

  constructor() {
    super()
    this.setupIpcHandlers()
  }

  private setupIpcHandlers(): void {
    // 监听 store 就绪事件
    ipcMain.on('zustand:store-ready', () => {
      this.isReady = true
      this.emit('ready')
      logger.info('Zustand store is ready.')
    })

    // 监听 store 状态变化
    ipcMain.on('zustand:state-change', (_, newState: ZustandState) => {
      this.stateCache = newState
      this.emit(this.STATUS_CHANGE_EVENT, newState)
    })
  }

  private async waitForStoreReady(timeout = 10000): Promise<void> {
    if (this.isReady) return

    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      try {
        const mainWindow = WindowService.getInstance().getMainWindow()
        if (!mainWindow) {
          throw new Error('Main window is not available')
        }

        const isReady = await mainWindow.webContents.executeJavaScript(
          '!!window.storeManager && typeof window.storeManager.getState === "function"'
        )
        if (isReady) {
          this.isReady = true
          return
        }
      } catch {
        // 忽略错误，继续等待
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error('Timeout waiting for Zustand store to be ready')
  }

  // 同步获取状态
  getStateSync(): ZustandState {
    return this.stateCache
  }

  // 同步选择器
  selectSync<T>(selector: Selector<T>): T | undefined {
    try {
      const selectorFn =
        typeof selector === 'string'
          ? (new Function('state', `return ${selector}`) as (state: ZustandState) => T)
          : selector
      return selectorFn(this.stateCache)
    } catch (error) {
      logger.error('Failed to select from cache:', { error })
      return undefined
    }
  }

  // 异步选择器
  async select<T>(selector: Selector<T>): Promise<T> {
    try {
      // 如果已经准备就绪，先尝试从缓存中获取
      if (this.isReady) {
        const cachedValue = this.selectSync<T>(selector)
        if (cachedValue !== undefined) {
          return cachedValue
        }
      }

      const mainWindow = WindowService.getInstance().getMainWindow()
      if (!mainWindow) {
        throw new Error('Main window is not available')
      }

      await this.waitForStoreReady()

      const selectorStr = typeof selector === 'string' ? selector : selector.toString()

      const result = await mainWindow.webContents.executeJavaScript(`
        const state = window.storeManager.getState();
        let result;
        try {
          if (${JSON.stringify(typeof selector === 'string')}) {
            const fn = new Function('state', 'return ' + ${JSON.stringify(selectorStr)});
            result = fn(state);
          } else {
            result = (function ${selectorStr})(state);
          }
        } catch (e) {
          result = undefined;
        }
        result;
      `)

      return result as T
    } catch (error) {
      logger.error('Failed to select store value:', { error })
      throw error
    }
  }

  // 通过 store 名称获取状态
  async getStoreState(storeName: string): Promise<StoreValue> {
    const mainWindow = WindowService.getInstance().getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }

    await this.waitForStoreReady()

    const result = await mainWindow.webContents.executeJavaScript(
      `window.storeManager.getStoreState('${storeName}')`
    )
    return result
  }

  // 设置状态（类似 dispatch）
  async setState(storeName: string, partialState: StoreValue, replace?: boolean): Promise<void> {
    const mainWindow = WindowService.getInstance().getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }

    await this.waitForStoreReady()

    await mainWindow.webContents.executeJavaScript(
      `window.storeManager.setState('${storeName}', ${JSON.stringify(partialState)}, ${!!replace})`
    )
  }

  // 获取整个状态树
  async getState(): Promise<ZustandState> {
    const mainWindow = WindowService.getInstance().getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }

    await this.waitForStoreReady()

    const result = await mainWindow.webContents.executeJavaScript('window.storeManager.getState()')
    return result as ZustandState
  }

  // 订阅状态变化
  async subscribe<T>(selector: Selector<T>, callback: (newValue: T) => void): Promise<Unsubscribe> {
    const mainWindow = WindowService.getInstance().getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }

    await this.waitForStoreReady()

    // 主进程中的回调处理
    const handler = (): void => {
      try {
        const newValue = this.selectSync(selector)
        if (newValue !== undefined) {
          callback(newValue)
        }
      } catch (error) {
        logger.error('Error in subscription handler:', { error })
      }
    }

    this.on(this.STATUS_CHANGE_EVENT, handler)

    return (): void => {
      this.off(this.STATUS_CHANGE_EVENT, handler)
    }
  }

  // 批量执行状态更新
  async batch(updates: BatchUpdate[]): Promise<void> {
    const mainWindow = WindowService.getInstance().getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }

    await this.waitForStoreReady()

    for (const { storeName, partialState, replace = false } of updates) {
      await mainWindow.webContents.executeJavaScript(
        `window.storeManager.setState('${storeName}', ${JSON.stringify(partialState)}, ${!!replace})`
      )
    }
  }

  // 调用 store 方法
  async callStoreMethod<T>(storeName: string, methodName: string, ...args: unknown[]): Promise<T> {
    const mainWindow = WindowService.getInstance().getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }

    await this.waitForStoreReady()

    const result = await mainWindow.webContents.executeJavaScript(
      `window.storeManager.callStoreMethod('${storeName}', '${methodName}', ${JSON.stringify(args)})`
    )
    return result as T
  }
}

export const zustandStateSyncService = new ZustandStateSyncService()

/**
 * 使用示例
 *
 * async function example() {
 *   try {
 *     // 读取特定 store 的状态
 *     const settings = await zustandStateSyncService.getStoreState('settings')
 *     console.log('Settings:', settings)
 *
 *     // 读取特定路径的值
 *     const theme = await zustandStateSyncService.select('settings.theme')
 *     console.log('Theme:', theme)
 *
 *     // 更新状态（类似 dispatch）
 *     await zustandStateSyncService.setState('settings', { theme: 'dark' })
 *
 *     // 调用 store 方法
 *     await zustandStateSyncService.callStoreMethod<boolean>('user', 'login', 'username', 'password')
 *
 *     // 订阅状态变化
 *     const unsubscribe = await zustandStateSyncService.subscribe(
 *       (state) => state.settings.theme,
 *       (newTheme) => console.log('Theme changed:', newTheme)
 *     )
 *
 *     // 批量更新
 *     await zustandStateSyncService.batch([
 *       { storeName: 'settings', partialState: { language: 'zh-CN' } },
 *       { storeName: 'user', partialState: { lastOnline: Date.now() }, replace: true }
 *     ])
 *
 *     // 同步方法（快速但可能不是最新）
 *     const cachedTheme = zustandStateSyncService.selectSync('settings.theme')
 *     console.log('Cached theme:', cachedTheme)
 *
 *     // 获取完整状态
 *     const fullState = await zustandStateSyncService.getState()
 *     console.log('Full state:', fullState)
 *
 *     // 取消订阅
 *     unsubscribe()
 *   } catch (error) {
 *     console.error('Error:', error)
 *   }
 * }
 */
