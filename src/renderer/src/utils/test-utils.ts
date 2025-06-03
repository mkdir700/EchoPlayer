/**
 * 测试工具函数
 * 提供高效的测试标识符生成和管理
 */

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
 * React组件的测试标识符属性生成器
 */
export function withTestId(id: string): { 'data-testid': string } {
  return { 'data-testid': id }
}

/**
 * 条件性测试标识符
 * 只在开发环境或测试环境中添加
 */
export function devTestId(id: string): { 'data-testid': string } {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return { 'data-testid': id }
  }
  return { 'data-testid': '' }
}

// 常用组件的测试标识符常量
export const COMMON_TEST_IDS = {
  // 应用级别
  APP_HEADER: testId('app', 'header'),
  VIDEO_SECTION: testId('video', 'section'),
  SUBTITLE_SECTION: testId('subtitle', 'section'),

  // 视频播放器
  VIDEO_PLAYER: testId('video', 'player'),
  PLAY_PAUSE_BUTTON: testId('video', 'play-pause-button'),
  PROGRESS_BAR: testId('video', 'progress-bar'),

  // 字幕相关
  SUBTITLE_LIST: testId('subtitle', 'list'),
  CURRENT_SUBTITLE: testId('subtitle', 'current'),

  // 按钮
  LOAD_VIDEO_BUTTON: testId('button', 'load-video'),
  LOAD_SUBTITLE_BUTTON: testId('button', 'load-subtitle'),
  SETTINGS_BUTTON: testId('button', 'settings'),

  // 模态框
  SETTINGS_MODAL: testId('modal', 'settings'),
  ERROR_MESSAGE: testId('message', 'error'),

  // 表单元素
  PLAYBACK_SPEED_SELECT: testId('form', 'playback-speed'),
  REPEAT_MODE_CHECKBOX: testId('form', 'repeat-mode'),
  SUBTITLE_FONT_SIZE: testId('form', 'subtitle-font-size'),
  SAVE_SETTINGS_BUTTON: testId('button', 'save-settings'),
  DISMISS_ERROR_BUTTON: testId('button', 'dismiss-error'),

  // 进度相关
  PROGRESS_INDICATOR: testId('progress', 'indicator'),
  MARK_LEARNED_BUTTON: testId('button', 'mark-learned')
} as const

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
