/**
 * 事件类型定义
 * Event Type Definitions
 *
 * 定义应用中的事件系统相关类型
 * Defines event system related types in the application
 */

// 基础事件接口 / Base Event Interface
export interface BaseEvent {
  readonly type: string
  readonly timestamp: Date
  readonly source: string
  readonly id?: string
  readonly metadata?: Record<string, unknown>
}

// 用户操作类型枚举 / User Action Type Enum
export enum UserActionType {
  CLICK = 'click',
  DOUBLE_CLICK = 'double_click',
  RIGHT_CLICK = 'right_click',
  KEY_PRESS = 'key_press',
  KEY_DOWN = 'key_down',
  KEY_UP = 'key_up',
  SCROLL = 'scroll',
  DRAG = 'drag',
  DROP = 'drop',
  RESIZE = 'resize',
  FOCUS = 'focus',
  BLUR = 'blur',
  HOVER = 'hover',
  LEAVE = 'leave'
}

// 用户交互事件接口 / User Interaction Event Interface
export interface UserInteractionEvent extends BaseEvent {
  readonly action: UserActionType
  readonly target: string
  readonly position?: { x: number; y: number }
  readonly modifiers?: readonly ('ctrl' | 'alt' | 'shift' | 'meta')[]
  readonly data?: unknown
}

// 视频事件类型枚举 / Video Event Type Enum
export enum VideoEventType {
  LOADED = 'video:loaded',
  PLAY = 'video:play',
  PAUSE = 'video:pause',
  STOP = 'video:stop',
  SEEK = 'video:seek',
  TIME_UPDATE = 'video:time_update',
  DURATION_CHANGE = 'video:duration_change',
  VOLUME_CHANGE = 'video:volume_change',
  RATE_CHANGE = 'video:rate_change',
  ENDED = 'video:ended',
  ERROR = 'video:error',
  BUFFER_START = 'video:buffer_start',
  BUFFER_END = 'video:buffer_end',
  FULLSCREEN_CHANGE = 'video:fullscreen_change'
}

// 视频事件接口 / Video Event Interface
export interface VideoEvent extends BaseEvent {
  readonly type: VideoEventType
  readonly videoId: string
  readonly currentTime: number
  readonly duration?: number
  readonly volume?: number
  readonly playbackRate?: number
  readonly error?: string
}

// 字幕事件类型枚举 / Subtitle Event Type Enum
export enum SubtitleEventType {
  LOADED = 'subtitle:loaded',
  CHANGED = 'subtitle:changed',
  DISPLAY_MODE_CHANGED = 'subtitle:display_mode_changed',
  POSITION_CHANGED = 'subtitle:position_changed',
  STYLE_CHANGED = 'subtitle:style_changed',
  CLICKED = 'subtitle:clicked',
  COPIED = 'subtitle:copied',
  SEARCHED = 'subtitle:searched'
}

// 字幕事件接口 / Subtitle Event Interface
export interface SubtitleEvent extends BaseEvent {
  readonly type: SubtitleEventType
  readonly subtitleId?: string
  readonly subtitleIndex: number
  readonly text?: string
  readonly displayMode?: string
  readonly position?: { x: number; y: number }
}

// 系统事件类型枚举 / System Event Type Enum
export enum SystemEventType {
  APP_START = 'system:app_start',
  APP_READY = 'system:app_ready',
  APP_QUIT = 'system:app_quit',
  WINDOW_FOCUS = 'system:window_focus',
  WINDOW_BLUR = 'system:window_blur',
  WINDOW_RESIZE = 'system:window_resize',
  WINDOW_MINIMIZE = 'system:window_minimize',
  WINDOW_MAXIMIZE = 'system:window_maximize',
  THEME_CHANGE = 'system:theme_change',
  LANGUAGE_CHANGE = 'system:language_change',
  UPDATE_AVAILABLE = 'system:update_available',
  UPDATE_DOWNLOADED = 'system:update_downloaded',
  ERROR = 'system:error',
  WARNING = 'system:warning'
}

// 系统事件接口 / System Event Interface
export interface SystemEvent extends BaseEvent {
  readonly type: SystemEventType
  readonly level: LogLevel
  readonly message: string
  readonly error?: Error
  readonly data?: unknown
}

// 导航事件类型枚举 / Navigation Event Type Enum
export enum NavigationEventType {
  PAGE_CHANGE = 'navigation:page_change',
  ROUTE_CHANGE = 'navigation:route_change',
  BACK = 'navigation:back',
  FORWARD = 'navigation:forward',
  REFRESH = 'navigation:refresh'
}

// 导航事件接口 / Navigation Event Interface
export interface NavigationEvent extends BaseEvent {
  readonly type: NavigationEventType
  readonly from?: string
  readonly to: string
  readonly params?: Record<string, unknown>
}

// 文件事件类型枚举 / File Event Type Enum
export enum FileEventType {
  SELECTED = 'file:selected',
  UPLOADED = 'file:uploaded',
  DOWNLOADED = 'file:downloaded',
  DELETED = 'file:deleted',
  RENAMED = 'file:renamed',
  MOVED = 'file:moved',
  COPIED = 'file:copied',
  OPENED = 'file:opened',
  CLOSED = 'file:closed',
  SAVED = 'file:saved',
  ERROR = 'file:error'
}

// 文件事件接口 / File Event Interface
export interface FileEvent extends BaseEvent {
  readonly type: FileEventType
  readonly filePath: string
  readonly fileName: string
  readonly fileSize?: number
  readonly mimeType?: string
  readonly error?: string
}

// 网络事件类型枚举 / Network Event Type Enum
export enum NetworkEventType {
  ONLINE = 'network:online',
  OFFLINE = 'network:offline',
  REQUEST_START = 'network:request_start',
  REQUEST_SUCCESS = 'network:request_success',
  REQUEST_ERROR = 'network:request_error',
  UPLOAD_PROGRESS = 'network:upload_progress',
  DOWNLOAD_PROGRESS = 'network:download_progress'
}

// 网络事件接口 / Network Event Interface
export interface NetworkEvent extends BaseEvent {
  readonly type: NetworkEventType
  readonly url?: string
  readonly method?: string
  readonly status?: number
  readonly progress?: number
  readonly error?: string
}

// 事件监听器接口 / Event Listener Interface
export interface EventListener<T extends BaseEvent = BaseEvent> {
  readonly id: string
  readonly eventType: string
  readonly handler: (event: T) => void | Promise<void>
  readonly once?: boolean
  readonly priority?: number
}

// 事件发射器接口 / Event Emitter Interface
export interface EventEmitter {
  on<T extends BaseEvent>(eventType: string, handler: (event: T) => void): string
  once<T extends BaseEvent>(eventType: string, handler: (event: T) => void): string
  off(listenerId: string): boolean
  emit<T extends BaseEvent>(event: T): void
  removeAllListeners(eventType?: string): void
  getListeners(eventType: string): readonly EventListener[]
  hasListeners(eventType: string): boolean
}

// 事件总线配置接口 / Event Bus Config Interface
export interface EventBusConfig {
  readonly maxListeners: number
  readonly enableLogging: boolean
  readonly logLevel: LogLevel
  readonly enableMetrics: boolean
  readonly errorHandler?: (error: Error, event: BaseEvent) => void
}

// 事件过滤器接口 / Event Filter Interface
export interface EventFilter<T extends BaseEvent = BaseEvent> {
  readonly type?: string
  readonly source?: string
  readonly predicate?: (event: T) => boolean
}

// 事件中间件接口 / Event Middleware Interface
export interface EventMiddleware {
  readonly name: string
  readonly before?: (event: BaseEvent) => BaseEvent | Promise<BaseEvent>
  readonly after?: (event: BaseEvent) => void | Promise<void>
  readonly error?: (error: Error, event: BaseEvent) => void | Promise<void>
}

// 事件统计接口 / Event Statistics Interface
export interface EventStatistics {
  readonly totalEvents: number
  readonly eventsByType: Record<string, number>
  readonly eventsBySource: Record<string, number>
  readonly averageProcessingTime: number
  readonly errorCount: number
  readonly lastEventTime?: Date
}

// 日志级别枚举（从common.types导入避免重复定义）/ Log Level Enum
import { LogLevel } from './common.types'

// 事件类型联合类型 / Event Type Union
export type AppEvent =
  | UserInteractionEvent
  | VideoEvent
  | SubtitleEvent
  | SystemEvent
  | NavigationEvent
  | FileEvent
  | NetworkEvent

// 事件处理器类型 / Event Handler Types
export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => void | Promise<void>
export type AsyncEventHandler<T extends BaseEvent = BaseEvent> = (event: T) => Promise<void>

// 事件订阅选项接口 / Event Subscription Options Interface
export interface EventSubscriptionOptions {
  readonly once?: boolean
  readonly priority?: number
  readonly filter?: EventFilter
  readonly debounce?: number
  readonly throttle?: number
}

// 事件发布选项接口 / Event Publishing Options Interface
export interface EventPublishingOptions {
  readonly async?: boolean
  readonly timeout?: number
  readonly retries?: number
  readonly middleware?: readonly EventMiddleware[]
}
