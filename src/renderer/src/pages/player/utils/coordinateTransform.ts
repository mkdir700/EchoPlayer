/**
 * Coordinate Transform Utilities
 *
 * 提供字幕覆盖层的坐标转换功能：
 * - 百分比限制和范围检查
 * - 遮罩模式下的坐标转换
 * - 绝对坐标与相对坐标的相互转换
 * - 尺寸转换计算
 */

// === 常量定义 ===
export const MIN_SPAN_PERCENT = 1
export const ESTIMATED_SUBTITLE_HEIGHT_PX = 160
export const MAX_ESTIMATED_HEIGHT_PERCENT = 12
export const MAX_OVERLAY_WIDTH_PERCENT = 95
export const MAX_OVERLAY_HEIGHT_PERCENT_NORMAL_MODE = 40
export const VIEWPORT_CHANGE_THRESHOLD = 0.1

// === 类型定义 ===
export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface MaskLayout {
  position: Position
  size: Size
}

// === 核心工具函数 ===

/**
 * 限制百分比在有效范围内 (0-100)
 */
export const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

/**
 * 将绝对位置转换为遮罩相对位置
 */
export const toMaskRelativePosition = (position: Position, mask: MaskLayout): Position => {
  const width = Math.max(mask.size.width, MIN_SPAN_PERCENT)
  const height = Math.max(mask.size.height, MIN_SPAN_PERCENT)

  return {
    x: clampPercent(((position.x - mask.position.x) / width) * 100),
    y: clampPercent(((position.y - mask.position.y) / height) * 100)
  }
}

/**
 * 将遮罩相对位置转换为绝对位置
 */
export const fromMaskRelativePosition = (position: Position, mask: MaskLayout): Position => {
  return {
    x: clampPercent(mask.position.x + (position.x / 100) * mask.size.width),
    y: clampPercent(mask.position.y + (position.y / 100) * mask.size.height)
  }
}

/**
 * 将绝对尺寸转换为遮罩相对尺寸
 */
export const toMaskRelativeSize = (size: Size, mask: MaskLayout): Size => {
  const width = Math.max(mask.size.width, MIN_SPAN_PERCENT)
  const height = Math.max(mask.size.height, MIN_SPAN_PERCENT)

  return {
    width: clampPercent((size.width / width) * 100),
    height: clampPercent((size.height / height) * 100)
  }
}

/**
 * 将遮罩相对尺寸转换为绝对尺寸
 */
export const fromMaskRelativeSize = (size: Size, mask: MaskLayout): Size => {
  return {
    width: clampPercent((size.width / 100) * mask.size.width),
    height: clampPercent((size.height / 100) * mask.size.height)
  }
}

/**
 * 检查遮罩视口是否发生显著变化
 */
export const hasViewportChangedSignificantly = (
  prev: MaskLayout | null,
  curr: MaskLayout | null
): boolean => {
  if (!prev || !curr) return true

  return (
    Math.abs(prev.position.x - curr.position.x) > VIEWPORT_CHANGE_THRESHOLD ||
    Math.abs(prev.position.y - curr.position.y) > VIEWPORT_CHANGE_THRESHOLD ||
    Math.abs(prev.size.width - curr.size.width) > VIEWPORT_CHANGE_THRESHOLD ||
    Math.abs(prev.size.height - curr.size.height) > VIEWPORT_CHANGE_THRESHOLD
  )
}

/**
 * 计算拖拽边界限制
 */
export const calculateDragBounds = (
  isMaskMode: boolean,
  maskViewport: MaskLayout | null,
  currentSize: Size,
  estimatedHeightPercent?: number
): {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
} => {
  const heightPercent = estimatedHeightPercent || MAX_ESTIMATED_HEIGHT_PERCENT

  if (isMaskMode && maskViewport) {
    return {
      xMin: maskViewport.position.x,
      xMax: Math.max(
        maskViewport.position.x,
        maskViewport.position.x +
          maskViewport.size.width -
          Math.max(MIN_SPAN_PERCENT, currentSize.width)
      ),
      yMin: maskViewport.position.y,
      yMax: Math.max(
        maskViewport.position.y,
        maskViewport.position.y +
          maskViewport.size.height -
          Math.max(MIN_SPAN_PERCENT, currentSize.height)
      )
    }
  }

  return {
    xMin: 0,
    xMax: 100 - currentSize.width,
    yMin: 0,
    yMax: 100 - heightPercent
  }
}

/**
 * 计算尺寸调整限制
 */
export const calculateResizeBounds = (
  isMaskMode: boolean,
  maskViewport: MaskLayout | null,
  currentPosition: Position
): {
  widthLimit: number
  heightLimit: number
  maxHeightPercent: number
} => {
  if (isMaskMode && maskViewport) {
    const maskRight = maskViewport.position.x + maskViewport.size.width
    const maskBottom = maskViewport.position.y + maskViewport.size.height

    const widthLimit = Math.max(MIN_SPAN_PERCENT, maskRight - currentPosition.x)
    const heightLimit = Math.max(MIN_SPAN_PERCENT, maskBottom - currentPosition.y)

    return {
      widthLimit,
      heightLimit,
      maxHeightPercent: heightLimit
    }
  }

  return {
    widthLimit: MAX_OVERLAY_WIDTH_PERCENT,
    heightLimit: MAX_OVERLAY_WIDTH_PERCENT,
    maxHeightPercent: MAX_OVERLAY_HEIGHT_PERCENT_NORMAL_MODE
  }
}
