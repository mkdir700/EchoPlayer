/**
 * useContentWidth Hook
 *
 * 采用 YouTube 风格的字幕宽度控制方案：
 * - 使用 CSS 的 max-content (fit-content) 让内容自然决定宽度
 * - 通过 max-width 限制最大宽度为 95%
 * - 完全由 CSS 处理，无需 JavaScript 计算
 *
 * 优势：
 * - ✅ 零 JavaScript 计算开销
 * - ✅ 无渲染闪烁
 * - ✅ 单行内容：容器宽度 = 内容宽度
 * - ✅ 多行内容：容器宽度 = 95%（自动换行）
 */

export interface UseContentWidthOptions {
  /** 容器最大宽度百分比 */
  maxContainerWidthPercent?: number
}

export const useContentWidth = ({ maxContainerWidthPercent = 95 }: UseContentWidthOptions) => {
  // 返回固定的 CSS 宽度策略
  // width: max-content 让容器完全根据内容宽度扩展（不提前换行）
  // max-width: 95% 限制最大宽度
  // 当内容超过 max-width 时，容器会被限制，内容自然换行
  const widthStyle = 'max-content'
  const maxWidthStyle = `${maxContainerWidthPercent}%`

  return {
    widthStyle,
    maxWidthStyle
  }
}
