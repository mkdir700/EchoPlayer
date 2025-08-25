/* eslint-disable no-restricted-syntax */
import type { LogContextData, LogLevel, LogSourceWithContext } from '@shared/config/logger'
import { LEVEL, LEVEL_MAP } from '@shared/config/logger'

// check if the current process is a worker
const IS_WORKER = typeof window === 'undefined'
// check if we are in the dev env
// DO NOT use `constants.ts` here, because the files contains other dependencies that will fail in worker process
const IS_DEV = IS_WORKER ? false : window.electron?.process?.env?.NODE_ENV === 'development'

const DEFAULT_LEVEL = IS_DEV ? LEVEL.SILLY : LEVEL.INFO
const MAIN_LOG_LEVEL = LEVEL.WARN

// 日志导出相关接口
interface LogExportEntry {
  timestamp: string
  level: LogLevel
  module: string
  window: string
  message: string
  data?: any[]
  context?: Record<string, any>
  caller?: string
}

interface LogExportOptions {
  startDate?: Date
  endDate?: Date
  levels?: LogLevel[]
  modules?: string[]
  format?: 'json' | 'csv' | 'txt'
  includeStackTrace?: boolean
  maxEntries?: number
}

/**
 * IMPORTANT: How to use LoggerService
 * please refer to
 *   English: `docs/technical/how-to-use-logger-en.md`
 *   Chinese: `docs/technical/how-to-use-logger-zh.md`
 */
class LoggerService {
  private static instance: LoggerService

  // env variables, only used in dev mode
  // only affect console output, not affect logToMain
  private envLevel: LogLevel = LEVEL.NONE
  private envShowModules: string[] = []

  private level: LogLevel = DEFAULT_LEVEL
  private logToMainLevel: LogLevel = MAIN_LOG_LEVEL

  private window: string = ''
  private module: string = ''
  private context: Record<string, any> = {}

  // 日志导出相关
  private exportHistory: LogExportEntry[] = []
  private maxHistorySize: number = 10000

  private constructor() {
    if (IS_DEV) {
      if (
        window.electron?.process?.env?.CSLOGGER_RENDERER_LEVEL &&
        Object.values(LEVEL).includes(
          window.electron?.process?.env?.CSLOGGER_RENDERER_LEVEL as LogLevel
        )
      ) {
        this.envLevel = window.electron?.process?.env?.CSLOGGER_RENDERER_LEVEL as LogLevel

        console.log(
          `%c[LoggerService] env CSLOGGER_RENDERER_LEVEL loaded: ${this.envLevel}`,
          'color: blue; font-weight: bold'
        )
      }

      if (window.electron?.process?.env?.CSLOGGER_RENDERER_SHOW_MODULES) {
        const showModules = window.electron?.process?.env?.CSLOGGER_RENDERER_SHOW_MODULES.split(',')
          .map((module) => module.trim())
          .filter((module) => module !== '')
        if (showModules.length > 0) {
          this.envShowModules = showModules

          console.log(
            `%c[LoggerService] env CSLOGGER_RENDERER_SHOW_MODULES loaded: ${this.envShowModules.join(' ')}`,
            'color: blue; font-weight: bold'
          )
        }
      }
    }
  }

  /**
   * Get the singleton instance of LoggerService
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService()
    }
    return LoggerService.instance
  }

  /**
   * Initialize window source for renderer process (can only be called once)
   * @param window - The window identifier
   * @returns The logger service instance
   */
  public initWindowSource(window: string): LoggerService {
    if (this.window) {
      console.warn(
        '[LoggerService] window source already initialized, current: %s, want to set: %s',
        this.window,
        window
      )
      return this
    }
    this.window = window
    return this
  }

  /**
   * Create a new logger with module name and additional context
   * @param module - The module name for logging
   * @param context - Additional context data
   * @returns A new logger instance with the specified context
   */
  public withContext(module: string, context?: Record<string, any>): LoggerService {
    const newLogger = Object.create(this)

    // Copy all properties from the base logger
    newLogger.module = module
    newLogger.context = { ...this.context, ...context }

    return newLogger
  }

  // ---- 对象完全序列化方法 ----
  private deepSerialize(obj: any, visited = new WeakSet()): any {
    // 处理基本类型
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    // 防止循环引用
    if (visited.has(obj)) {
      return '[Circular Reference]'
    }
    visited.add(obj)

    try {
      // 处理日期对象
      if (obj instanceof Date) {
        return { __type: 'Date', value: obj.toISOString() }
      }

      // 处理错误对象
      if (obj instanceof Error) {
        return {
          __type: 'Error',
          name: obj.name,
          message: obj.message,
          stack: obj.stack,
          ...Object.getOwnPropertyNames(obj).reduce((acc, key) => {
            acc[key] = this.deepSerialize((obj as any)[key], visited)
            return acc
          }, {} as any)
        }
      }

      // 处理函数
      if (typeof obj === 'function') {
        return {
          __type: 'Function',
          name: obj.name,
          toString: obj.toString()
        }
      }

      // 处理数组
      if (Array.isArray(obj)) {
        return obj.map((item) => this.deepSerialize(item, visited))
      }

      // 处理普通对象
      const result: any = {}

      // 获取所有属性（包括不可枚举的）
      const keys = [
        ...Object.keys(obj),
        ...Object.getOwnPropertyNames(obj).filter(
          (key) => key !== 'constructor' && !Object.keys(obj).includes(key)
        )
      ]

      for (const key of keys) {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(obj, key)
          if (descriptor) {
            if (descriptor.get || descriptor.set) {
              // 处理 getter/setter
              result[key] = {
                __type: 'Property',
                hasGetter: !!descriptor.get,
                hasSetter: !!descriptor.set,
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable
              }
            } else {
              // 普通属性
              result[key] = this.deepSerialize(descriptor.value, visited)
            }
          }
        } catch (error) {
          result[key] = `[Error accessing property: ${
            error instanceof Error ? error.message : 'Unknown error'
          }]`
        }
      }

      // 添加原型信息
      const proto = Object.getPrototypeOf(obj)
      if (proto && proto !== Object.prototype) {
        result.__prototype = proto.constructor?.name || '[Unknown Prototype]'
      }

      return result
    } catch (error) {
      return `[Serialization Error: ${error instanceof Error ? error.message : 'Unknown error'}]`
    } finally {
      visited.delete(obj)
    }
  }

  // ---- ① 结构化抓栈 + 过滤 ----
  private pickFirstNonLoggerFrame(): {
    file?: string
    line?: number
    col?: number
    fn?: string
    text?: string
  } | null {
    // 允许配置要忽略的“文件/方法”特征（根据你的工程路径改一改）
    const IGNORE_FILE_PATTERNS = [
      /\/services\/Logger/i, // e.g. src/services/Logger.ts / LoggerService.ts
      /\/logger\.ts$/i,
      /\blogger-service\b/i
    ]
    const IGNORE_FUNC_PATTERNS = [
      /^LoggerService\./, // LoggerService.info / .debug / .processLog
      /^processLog$/,
      /^debug$|^info$|^warn$|^error$|^verbose$|^silly$/
    ]

    const origPrepare = (Error as any).prepareStackTrace
    ;(Error as any).prepareStackTrace = (_: any, stack: any[]) => stack

    const err = new Error()
    // 从 processLog 之上开始截栈，避免把本函数也算进去
    ;(Error as any).captureStackTrace?.(err, this.processLog as any)
    const stack = (err.stack || []) as any[]

    ;(Error as any).prepareStackTrace = origPrepare

    for (const cs of stack) {
      const file = cs.getFileName?.() || cs.getScriptNameOrSourceURL?.() || ''
      const fn = cs.getFunctionName?.() || cs.getMethodName?.() || ''
      const line = cs.getLineNumber?.()
      const col = cs.getColumnNumber?.()

      const isLoggerFile = IGNORE_FILE_PATTERNS.some((p) => p.test(String(file)))
      const isLoggerFunc = IGNORE_FUNC_PATTERNS.some((p) => p.test(String(fn)))

      if (!isLoggerFile && !isLoggerFunc && file && line) {
        // 模拟一条标准 stack 行（DevTools 会识别成可点击链接）
        const text = `at ${fn || '<anonymous>'} (${file}:${line}:${col ?? 0})`
        return { file, line, col, fn, text }
      }
    }
    return null
  }

  // ---- ② 控制台友好输出（可点击）----
  private logWithCaller(levelLabel: string, css: string, logMessage: string, data: any[]) {
    const caller = this.pickFirstNonLoggerFrame() // 取第一条“非 Logger”帧
    console.groupCollapsed(levelLabel, css, logMessage)
    // 原始 payload
    console.log(logMessage, ...data)
    // 追加“可点击调用点”
    if (caller?.text) {
      // 注意：不要再包额外对象/样式，保持这行看起来像标准堆栈
      // 这样 DevTools 才会把 (file:line:col) 变成可点击链接
      console.log(caller.text)
    }
    // 可选：展开完整堆栈（第二帧起就是业务代码）
    // console.trace();
    console.groupEnd()
  }

  /**
   * Process and output log messages based on level and configuration
   * @param level - The log level
   * @param message - The log message
   * @param data - Additional data to log
   */
  private processLog(level: LogLevel, message: string, data: any[]): void {
    if (!this.window) {
      console.error(
        '[LoggerService] window source not initialized, please initialize window source first'
      )
      return
    }

    const currentLevel = LEVEL_MAP[level]

    // --- Dev 环境下按 env 变量进行过滤 ---
    if (IS_DEV) {
      if (this.envLevel !== LEVEL.NONE && currentLevel < LEVEL_MAP[this.envLevel]) {
        return
      }
      if (
        this.module &&
        this.envShowModules.length > 0 &&
        !this.envShowModules.includes(this.module)
      ) {
        return
      }
    }

    // --- 统一等级门槛 ---
    if (currentLevel < LEVEL_MAP[this.level]) {
      return
    }

    const logMessage = this.module ? `[${this.module}] ${message}` : message

    // --- 抓取并清洗调用栈，定位第一个“非 logger.ts” 的业务调用帧 ---
    // 说明：
    // 1) V8/Electron 下 Error.captureStackTrace 可用；不行也有降级。
    // 2) 我们丢弃第一行 "Error" 及所有包含 logger.ts 的帧。
    // 3) 取第一条剩余帧作为 caller（通常可点击跳转）。
    let caller: string | null = null
    if (IS_DEV) {
      const e = new Error()
      ;(Error as any).captureStackTrace?.(e, this.processLog) // 从本方法之上开始采集
      const lines = (e.stack?.split('\n') ?? []).map((l) => l.trim()).filter(Boolean)

      const cleaned = lines
        .filter((_, i) => i !== 0) // 去掉 "Error" 行
        .filter((l) => !/logger\.ts[:)]?/.test(l)) // 去掉 logger.ts 自身帧
      // 如需进一步过滤中间层，可在此追加规则：
      // .filter((l) => !/IntentStrategyManager\.ts/.test(l))

      caller = cleaned.length > 0 ? cleaned[0] : null
    }

    // --- 控制台输出（保留你的配色风格），Dev 下展示 caller ---
    const label = {
      [LEVEL.ERROR]: '%c<error>',
      [LEVEL.WARN]: '%c<warn>',
      [LEVEL.INFO]: '%c<info>',
      [LEVEL.VERBOSE]: '%c<verbose>',
      [LEVEL.DEBUG]: '%c<debug>',
      [LEVEL.SILLY]: '%c<silly>'
    }[level]

    const style = {
      [LEVEL.ERROR]: 'color: red; font-weight: bold',
      [LEVEL.WARN]: 'color: #FFA500; font-weight: bold',
      [LEVEL.INFO]: 'color: #32CD32; font-weight: bold',
      [LEVEL.VERBOSE]: 'color: #808080',
      [LEVEL.DEBUG]: 'color: #7B68EE',
      [LEVEL.SILLY]: 'color: #808080'
    }[level]

    if (IS_DEV) {
      this.logWithCaller(label, style, logMessage, data)
    } else {
      // 生产环境保持最小输出
      switch (level) {
        case LEVEL.ERROR:
          console.error(label, style, logMessage, ...data)
          break
        case LEVEL.WARN:
          console.warn(label, style, logMessage, ...data)
          break
        case LEVEL.INFO:
          console.info(label, style, logMessage, ...data)
          break
        default:
          console.debug(label, style, logMessage, ...data)
          break
      }
    }

    // --- 记录到导出历史 ---
    this.addToExportHistory(level, logMessage, data, caller)

    // --- 是否强制发主进程 ---
    const forceLogToMain = data.length > 0 && (data[data.length - 1] as any)?.logToMain === true
    const payload = forceLogToMain ? data.slice(0, -1) : data

    if (currentLevel >= LEVEL_MAP[this.logToMainLevel] || forceLogToMain) {
      const source: LogSourceWithContext = {
        process: 'renderer',
        window: this.window,
        module: this.module
      }
      if (Object.keys(this.context).length > 0) source.context = this.context
      // 把 caller 一并带去主进程，方便落盘后定位
      if (caller) (source as any).caller = caller

      if (!IS_WORKER) {
        window.api.logToMain(source, level, message, payload)
      } else {
        // TODO: worker 场景转发
      }
    }
  }
  /**
   * Log error message
   */
  public error(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.ERROR, message, data)
  }

  /**
   * Log warning message
   */
  public warn(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.WARN, message, data)
  }

  /**
   * Log info message
   */
  public info(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.INFO, message, data)
  }

  /**
   * Log verbose message
   */
  public verbose(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.VERBOSE, message, data)
  }

  /**
   * Log debug message
   */
  public debug(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.DEBUG, message, data)
  }

  /**
   * Log silly level message
   */
  public silly(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.SILLY, message, data)
  }

  /**
   * Set the minimum log level
   * @param level - The log level to set
   */
  public setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * Get the current log level
   * @returns The current log level
   */
  public getLevel(): string {
    return this.level
  }

  /**
   * Reset log level to environment default
   */
  public resetLevel(): void {
    this.setLevel(DEFAULT_LEVEL)
  }

  /**
   * Set the minimum level for logging to main process
   * @param level - The log level to set
   */
  public setLogToMainLevel(level: LogLevel): void {
    this.logToMainLevel = level
  }

  /**
   * Get the current log to main level
   * @returns The current log to main level
   */
  public getLogToMainLevel(): LogLevel {
    return this.logToMainLevel
  }

  /**
   * Reset log to main level to default
   */
  public resetLogToMainLevel(): void {
    this.setLogToMainLevel(MAIN_LOG_LEVEL)
  }

  // ---- 日志导出方法 ----
  /**
   * 添加日志到导出历史
   */
  private addToExportHistory(
    level: LogLevel,
    message: string,
    data: any[],
    caller?: string | null
  ): void {
    const entry: LogExportEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      window: this.window,
      message,
      data: data.length > 0 ? data.map((item) => this.deepSerialize(item)) : undefined,
      context: Object.keys(this.context).length > 0 ? this.deepSerialize(this.context) : undefined,
      caller: caller || undefined
    }

    this.exportHistory.push(entry)

    // 限制历史记录数量
    if (this.exportHistory.length > this.maxHistorySize) {
      this.exportHistory = this.exportHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * 导出日志
   */
  public exportLogs(options: LogExportOptions = {}): string {
    const {
      startDate,
      endDate,
      levels = Object.values(LEVEL),
      modules,
      format = 'json',
      includeStackTrace = false,
      maxEntries
    } = options

    let filteredEntries = this.exportHistory

    // 按时间过滤
    if (startDate || endDate) {
      filteredEntries = filteredEntries.filter((entry) => {
        const entryTime = new Date(entry.timestamp)
        if (startDate && entryTime < startDate) return false
        if (endDate && entryTime > endDate) return false
        return true
      })
    }

    // 按级别过滤
    filteredEntries = filteredEntries.filter((entry) => levels.includes(entry.level))

    // 按模块过滤
    if (modules && modules.length > 0) {
      filteredEntries = filteredEntries.filter((entry) => modules.includes(entry.module))
    }

    // 限制数量
    if (maxEntries && filteredEntries.length > maxEntries) {
      filteredEntries = filteredEntries.slice(-maxEntries)
    }

    // 如果不包含堆栈信息，移除 caller
    if (!includeStackTrace) {
      filteredEntries = filteredEntries.map((entry) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { caller: _, ...entryWithoutCaller } = entry
        return entryWithoutCaller
      })
    }

    switch (format) {
      case 'json':
        return JSON.stringify(filteredEntries, null, 2)

      case 'csv':
        return this.exportToCSV(filteredEntries)

      case 'txt':
        return this.exportToText(filteredEntries)

      default:
        return JSON.stringify(filteredEntries, null, 2)
    }
  }

  /**
   * 导出为 CSV 格式
   */
  private exportToCSV(entries: LogExportEntry[]): string {
    if (entries.length === 0) return ''

    const headers = [
      'timestamp',
      'level',
      'module',
      'window',
      'message',
      'data',
      'context',
      'caller'
    ]
    const csvLines = [headers.join(',')]

    for (const entry of entries) {
      const row = headers.map((header) => {
        let value = (entry as any)[header]
        if (value === undefined || value === null) {
          return ''
        }
        if (typeof value === 'object') {
          value = JSON.stringify(value)
        }
        // 转义 CSV 中的引号和换行符
        value = String(value).replace(/"/g, '""')
        return `"${value}"`
      })
      csvLines.push(row.join(','))
    }

    return csvLines.join('\n')
  }

  /**
   * 导出为文本格式
   */
  private exportToText(entries: LogExportEntry[]): string {
    const lines: string[] = []

    for (const entry of entries) {
      lines.push(
        `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}@${entry.window}] ${entry.message}`
      )

      if (entry.data && entry.data.length > 0) {
        lines.push(`  Data: ${JSON.stringify(entry.data, null, 2)}`)
      }

      if (entry.context && Object.keys(entry.context).length > 0) {
        lines.push(`  Context: ${JSON.stringify(entry.context, null, 2)}`)
      }

      if (entry.caller) {
        lines.push(`  Caller: ${entry.caller}`)
      }

      lines.push('') // 空行分隔
    }

    return lines.join('\n')
  }

  /**
   * 清空导出历史
   */
  public clearExportHistory(): void {
    this.exportHistory = []
  }

  /**
   * 获取导出历史统计信息
   */
  public getExportStats(): {
    totalEntries: number
    entriesByLevel: Record<LogLevel, number>
    entriesByModule: Record<string, number>
    timeRange: { earliest: string; latest: string } | null
  } {
    if (this.exportHistory.length === 0) {
      return {
        totalEntries: 0,
        entriesByLevel: {} as Record<LogLevel, number>,
        entriesByModule: {},
        timeRange: null
      }
    }

    const entriesByLevel = {} as Record<LogLevel, number>
    const entriesByModule: Record<string, number> = {}

    for (const entry of this.exportHistory) {
      entriesByLevel[entry.level] = (entriesByLevel[entry.level] || 0) + 1
      entriesByModule[entry.module] = (entriesByModule[entry.module] || 0) + 1
    }

    const timestamps = this.exportHistory.map((entry) => entry.timestamp).sort()

    return {
      totalEntries: this.exportHistory.length,
      entriesByLevel,
      entriesByModule,
      timeRange: {
        earliest: timestamps[0],
        latest: timestamps[timestamps.length - 1]
      }
    }
  }

  /**
   * 设置导出历史最大数量
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(100, size) // 最少保留 100 条
    if (this.exportHistory.length > this.maxHistorySize) {
      this.exportHistory = this.exportHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * 获取当前导出历史最大数量
   */
  public getMaxHistorySize(): number {
    return this.maxHistorySize
  }
}

export const loggerService = LoggerService.getInstance()

// 在开发模式下暴露到全局，方便 console 调试
if (IS_DEV && typeof window !== 'undefined') {
  ;(window as any).loggerService = loggerService
}

// 导出类型供外部使用
export type { LogExportEntry, LogExportOptions }
