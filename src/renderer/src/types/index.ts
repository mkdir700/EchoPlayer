// SubtitleItem 现在从共享类型中导入
import type { SubtitleItem } from '@types_/shared'

export interface VideoFileState {
  videoFile: string | null
  videoFileName: string
}

export interface UIState {
  showControls: boolean
  sidebarWidth: number
  isDragging: boolean
}

export interface SubtitleListItemProps {
  item: SubtitleItem
  index: number
  isActive: boolean
  onClick: (time: number) => void
  formatTime: (time: number) => string
}

export type DisplayMode = 'none' | 'original' | 'chinese' | 'english' | 'bilingual'

export interface VideoControlsProps {
  duration: number
  currentTime: number
  isVideoLoaded: boolean
  isPlaying: boolean
  videoError: string | null
  playbackRate: number
  volume: number
  isLooping: boolean
  autoPause: boolean
  autoSkipSilence: boolean
  subtitlePosition: 'top' | 'bottom'
  displayModeRef: React.RefObject<DisplayMode>
  onSeek: (value: number) => void
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onPlaybackRateChange: (value: number) => void
  onVolumeChange: (value: number) => void
  onLoopToggle: () => void
  onAutoSkipToggle: () => void
  onSubtitlePositionToggle: () => void
  onFullscreenToggle: () => void
  onPreviousSubtitle: () => void
  onNextSubtitle: () => void
  onDisplayModeChange: (mode: DisplayMode) => void
}

export interface VideoPlayerProps {
  videoFile: string | null
  isPlaying: boolean
  volume: number
  playbackRate: number
  onProgress: (progress: { played: number; playedSeconds: number }) => void
  onDuration: (duration: number) => void
  onReady: () => void
  onError: (error: Error | MediaError | string | null) => void
}

export interface SubtitleListProps {
  subtitles: SubtitleItem[]
  currentTime: number
  isAutoScrollEnabled: boolean
  onSeek: (time: number) => void
  onCenterCurrentSubtitle: () => void
  formatTime: (time: number) => string
}

export interface AppHeaderProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
}

export type ThrottledFunction<T extends (...args: never[]) => unknown> = T

// 页面类型定义
export type PageType = 'home' | 'play' | 'favorites' | 'about' | 'settings'

export interface NavigationItem {
  key: PageType
  label: string
  icon: React.ReactNode
}

// PlayPageProps 已移除 - PlayPage 现在直接使用 hooks

// 查单词相关类型定义
export type DictionaryEngine = 'eudic' | 'youdao' | 'eudic-html'

export interface DictionarySettings {
  selectedEngine: DictionaryEngine | null
  eudicApiToken: string
  youdaoApiKey: string
  youdaoApiSecret: string
}

export interface DictionaryEngineOption {
  key: DictionaryEngine
  label: string
  description: string
  requiresAuth: boolean
}

// OpenAI 相关类型定义
export type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-mini'

export interface OpenAISettings {
  apiKey: string
  selectedModel: OpenAIModel | null
  baseUrl: string
  maxTokens: number
  temperature: number
}

export interface OpenAIModelOption {
  key: OpenAIModel
  label: string
}

// 第三方服务配置类型定义
export interface ThirdPartyServicesSettings {
  openai: OpenAISettings
  dictionary: DictionarySettings
}

// 软件设置类型定义
export interface Settings {
  thirdPartyServices: ThirdPartyServicesSettings
}

// 重新导出共享类型，方便渲染进程使用
export type {
  RecentPlayItem as RecentPlayItem,
  StoreSettings,
  PlaybackSettings,
  StoreAPI,
  ApiResponse,
  ApiResponseWithCount
} from '@types_/shared'
