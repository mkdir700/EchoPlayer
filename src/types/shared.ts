// 共享类型定义文件 - 供主进程和渲染进程共同使用

// 字幕项接口
export interface SubtitleItem {
  startTime: number
  endTime: number
  text: string
  englishText?: string
  chineseText?: string
}

// 播放项接口
export interface RecentPlayItem {
  id: string // 唯一ID
  filePath: string // 文件路径
  fileName: string // 文件名
  lastOpenedAt: number // 最后打开时间
  duration?: number // 视频时长
  currentTime?: number // 当前播放时间
  subtitleFile?: string // 字幕文件路径
  subtitleIndex?: number // 字幕索引
  subtitles?: SubtitleItem[] // 字幕数据
}

// 播放设置接口
export interface PlaybackSettings {
  displayMode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual' // 字幕显示模式
  volume: number // 音量
  playbackRate: number // 播放速度
  isSingleLoop: boolean // 单句循环
  isAutoPause: boolean // 自动暂停
}

// 存储设置接口
export interface StoreSettings {
  maxRecentItems: number
  playback: PlaybackSettings // 播放设置
}

// 存储结构接口
export interface StoreSchema {
  recentPlays: RecentPlayItem[]
  settings: StoreSettings
}

// API 响应类型
export interface ApiResponse {
  success: boolean
  error?: string
}

export interface ApiResponseWithCount extends ApiResponse {
  removedCount: number
}

// Store API 接口定义
export interface StoreAPI {
  getRecentPlays: () => Promise<RecentPlayItem[]>
  addRecentPlay: (item: Omit<RecentPlayItem, 'id' | 'lastOpenedAt'>) => Promise<ApiResponse>
  updateRecentPlay: (
    id: string,
    updates: Partial<Omit<RecentPlayItem, 'id'>>
  ) => Promise<ApiResponse>
  removeRecentPlay: (id: string) => Promise<ApiResponse>
  clearRecentPlays: () => Promise<ApiResponse>
  getRecentPlayByPath: (filePath: string) => Promise<RecentPlayItem | null>
  getSettings: () => Promise<StoreSettings>
  updateSettings: (settings: Partial<StoreSettings>) => Promise<ApiResponse>
  removeMultipleRecentPlays: (ids: string[]) => Promise<ApiResponseWithCount>
  searchRecentPlays: (query: string) => Promise<RecentPlayItem[]>
}
