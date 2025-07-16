/**
 * 统一的测试常量定义 / Unified test constants definition
 * 所有测试相关的 ID、选择器和元素映射都在这里集中管理
 * All test-related IDs, selectors, and element mappings are centrally managed here
 */

// 通用测试 ID 常量 / Common test ID constants
export const COMMON_TEST_IDS = {
  // 首页相关 / HomePage related
  HOME_PAGE_ADD_VIDEO_BUTTON: 'home-page-add-video-button',
  EMPTY_STATE_ADD_VIDEO_BUTTON: 'empty-state-add-video-button',

  // 播放页面相关 / PlayPage related
  PLAY_PAGE_CONTAINER: 'play-page-container',
  PLAY_PAGE_CONTENT_AREA: 'play-page-content-area',
  PLAY_PAGE_VIDEO_CONTAINER: 'play-page-video-container',
  PLAY_PAGE_DIVIDER: 'play-page-divider',
  PLAY_PAGE_SIDEBAR_CONTAINER: 'play-page-sidebar-container',
  PLAY_PAGE_FULLSCREEN_TEST_INFO: 'play-page-fullscreen-test-info',

  // 应用侧边栏 / App Sidebar
  APP_HEADER: 'app-header',

  // 视频播放器相关 / Video Player related
  VIDEO_PLAYER: 'video-player',
  LOAD_VIDEO_BUTTON: 'load-video-button',
  PLAY_PAUSE_BUTTON: 'play-pause-button',
  CURRENT_SUBTITLE: 'current-subtitle',

  // 字幕相关 / Subtitle related
  LOAD_SUBTITLE_BUTTON: 'load-subtitle-button',
  SUBTITLE_LIST: 'subtitle-list',
  SUBTITLE_SENTENCE: 'subtitle-sentence' // 需要配合索引使用: subtitle-sentence-${index}
} as const

// 播放页面元素映射 / PlayPage element mapping
export const PLAY_PAGE_ELEMENTS = {
  container: 'container',
  contentArea: 'content-area',
  videoContainer: 'video-container',
  divider: 'divider',
  sidebarContainer: 'sidebar-container',
  fullscreenTestInfo: 'fullscreen-test-info'
} as const

// 首页元素映射 / HomePage element mapping
export const HOME_PAGE_ELEMENTS = {
  addVideoButton: 'add-video-button',
  emptyStateButton: 'empty-state-add-video-button',
  clearButton: 'clear-button',
  videoGrid: 'video-grid',
  videoCard: 'video-card'
} as const

// 视频播放器元素映射 / Video Player element mapping
export const VIDEO_PLAYER_ELEMENTS = {
  player: 'video-player',
  controls: 'video-controls',
  playPauseButton: 'play-pause-button',
  volumeControl: 'volume-control',
  progressBar: 'progress-bar',
  fullscreenButton: 'fullscreen-button'
} as const

// 字幕相关元素映射 / Subtitle element mapping
export const SUBTITLE_ELEMENTS = {
  container: 'subtitle-container',
  list: 'subtitle-list',
  item: 'subtitle-item',
  sentence: 'subtitle-sentence',
  currentSubtitle: 'current-subtitle',
  loadButton: 'load-subtitle-button'
} as const

// 工具函数：创建测试选择器 / Utility function: create test selector
export function createTestSelector(testId: string): string {
  return `[data-testid="${testId}"]`
}

// 工具函数：创建索引化的测试选择器 / Utility function: create indexed test selector
export function createIndexedTestSelector(baseTestId: string, index: number): string {
  return `[data-testid="${baseTestId}-${index}"]`
}

// 工具函数：创建测试ID属性对象 / Utility function: create test ID attribute object
export function withTestId(id: string): { 'data-testid': string } {
  return { 'data-testid': id }
}

// 工具函数：开发环境测试ID（生产环境返回空） / Utility function: dev environment test ID (returns empty in production)
export function devTestId(id: string): { 'data-testid': string } {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return { 'data-testid': id }
  }
  return { 'data-testid': '' }
}

// 复合选择器生成器 / Compound selector generators
export const SELECTORS = {
  // 播放页面选择器 / PlayPage selectors
  playPage: {
    container: createTestSelector(COMMON_TEST_IDS.PLAY_PAGE_CONTAINER),
    contentArea: createTestSelector(COMMON_TEST_IDS.PLAY_PAGE_CONTENT_AREA),
    videoContainer: createTestSelector(COMMON_TEST_IDS.PLAY_PAGE_VIDEO_CONTAINER),
    divider: createTestSelector(COMMON_TEST_IDS.PLAY_PAGE_DIVIDER),
    sidebarContainer: createTestSelector(COMMON_TEST_IDS.PLAY_PAGE_SIDEBAR_CONTAINER)
  },

  // 首页选择器 / HomePage selectors
  homePage: {
    addVideoButton: createTestSelector(COMMON_TEST_IDS.HOME_PAGE_ADD_VIDEO_BUTTON),
    emptyStateButton: createTestSelector(COMMON_TEST_IDS.EMPTY_STATE_ADD_VIDEO_BUTTON)
  },

  // 视频播放器选择器 / Video Player selectors
  videoPlayer: {
    player: createTestSelector(COMMON_TEST_IDS.VIDEO_PLAYER),
    playPauseButton: createTestSelector(COMMON_TEST_IDS.PLAY_PAUSE_BUTTON),
    loadVideoButton: createTestSelector(COMMON_TEST_IDS.LOAD_VIDEO_BUTTON)
  },

  // 字幕选择器 / Subtitle selectors
  subtitle: {
    list: createTestSelector(COMMON_TEST_IDS.SUBTITLE_LIST),
    loadButton: createTestSelector(COMMON_TEST_IDS.LOAD_SUBTITLE_BUTTON),
    currentSubtitle: createTestSelector(COMMON_TEST_IDS.CURRENT_SUBTITLE),
    getSentenceSelector: (index: number) =>
      createIndexedTestSelector(COMMON_TEST_IDS.SUBTITLE_SENTENCE, index)
  }
} as const

// 测试超时配置 / Test timeout configuration
export const TEST_TIMEOUTS = {
  SHORT: 2000, // 2秒 - 快速操作
  MEDIUM: 5000, // 5秒 - 普通操作
  LONG: 10000, // 10秒 - 慢操作
  VERY_LONG: 15000 // 15秒 - 非常慢的操作（如视频加载）
} as const

// 测试等待配置 / Test wait configuration
export const TEST_WAITS = {
  ANIMATION: 300, // 动画等待
  UI_UPDATE: 500, // UI更新等待
  FILE_LOAD: 1000, // 文件加载等待
  MODAL_OPEN: 800, // 弹窗打开等待
  NETWORK: 2000 // 网络请求等待
} as const

// 测试标识符前缀
const TEST_ID_PREFIX = 'echolab'

/**
 * 生成标准化的测试标识符
 * @param component 组件名称
 * @param element 元素名称
 * @param suffix 可选后缀
 */
export function testId(component: string, element?: string, suffix?: string): string {
  const parts = [TEST_ID_PREFIX, component]

  if (element) {
    parts.push(element)
  }

  if (suffix) {
    parts.push(suffix)
  }

  return parts.join('-')
}

/**
 * 创建组件级别的测试标识符生成器
 * @param componentName 组件名称
 */
export function createTestIdGenerator(componentName: string): {
  root: () => string
  element: (elementName: string) => string
  withSuffix: (elementName: string, suffix: string) => string
} {
  return {
    root: () => testId(componentName),
    element: (elementName: string) => testId(componentName, elementName),
    withSuffix: (elementName: string, suffix: string) => testId(componentName, elementName, suffix)
  }
}

/**
 * 批量生成测试标识符的配置对象
 */
export function createTestIds<T extends Record<string, string>>(
  componentName: string,
  elements: T
): Record<keyof T, string> {
  const result = {} as Record<keyof T, string>

  for (const [key, elementName] of Object.entries(elements)) {
    result[key as keyof T] = testId(componentName, elementName)
  }

  return result
}

/**
 * 为字幕项生成动态测试标识符
 */
export function subtitleItemTestId(index: number): string {
  return testId('subtitle', 'sentence', index.toString())
}

/**
 * 批量测试标识符映射类型
 */
export type TestIdMap<T extends string> = Record<T, string>
