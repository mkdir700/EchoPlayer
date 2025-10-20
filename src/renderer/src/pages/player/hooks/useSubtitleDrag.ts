/**
 * useSubtitleDrag Hook
 *
 * 封装字幕覆盖层的拖拽功能：
 * - 拖拽开始/结束处理
 * - 鼠标移动事件处理
 * - 边界限制计算
 * - 性能优化（requestAnimationFrame）
 * - 事件冒泡阻止
 */

import { loggerService } from '@logger'
import { useCallback, useRef } from 'react'

import {
  calculateDragBounds,
  clampPercent,
  ESTIMATED_SUBTITLE_HEIGHT_PX,
  type MaskLayout,
  MAX_ESTIMATED_HEIGHT_PERCENT,
  type Position,
  type Size,
  toMaskRelativePosition
} from '../utils/coordinateTransform'

const logger = loggerService.withContext('useSubtitleDrag')

export interface UseSubtitleDragOptions {
  overlayPosition: Position
  overlaySize: Size
  containerBounds: { width: number; height: number }
  isMaskMode: boolean
  maskViewport: MaskLayout | null
  isResizing: boolean
  autoPositioning: boolean
  onPositionChange: (position: Position) => void
  onDragStart: () => void
  onDragEnd: () => void
  onDisableAutoPositioning: () => void
  onMaskOnboardingComplete?: () => void
  overlayRef?: React.RefObject<HTMLDivElement | null>
}

export function useSubtitleDrag({
  overlayPosition,
  overlaySize,
  containerBounds,
  isMaskMode,
  maskViewport,
  isResizing,
  autoPositioning,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onDisableAutoPositioning,
  onMaskOnboardingComplete,
  overlayRef
}: UseSubtitleDragOptions) {
  // === 引用管理 ===
  const latestPositionRef = useRef(overlayPosition)
  const latestSizeRef = useRef(overlaySize)

  // === 更新最新位置引用 ===
  const updateLatestPosition = useCallback((position: Position) => {
    latestPositionRef.current = position
  }, [])

  // === 拖拽处理 ===
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (isResizing) return

      // 禁用自动定位
      if (autoPositioning) {
        onDisableAutoPositioning()
      }

      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件

      const startX = event.clientX
      const startY = event.clientY
      const startPosition = { x: overlayPosition.x, y: overlayPosition.y }

      onDragStart()

      let animationId: number

      // 抑制点击事件处理
      const suppressClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault()
        clickEvent.stopPropagation()
        document.removeEventListener('click', suppressClick, true)
      }

      // 鼠标移动处理
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 取消之前的动画帧
        if (animationId) {
          cancelAnimationFrame(animationId)
        }

        animationId = requestAnimationFrame(() => {
          const deltaX = moveEvent.clientX - startX
          const deltaY = moveEvent.clientY - startY

          // 使用估算的字幕高度（自适应模式下约为 160px）
          const estimatedHeightPercent = Math.min(
            MAX_ESTIMATED_HEIGHT_PERCENT,
            (ESTIMATED_SUBTITLE_HEIGHT_PX / containerBounds.height) * 100
          )

          // 计算拖拽边界
          const { xMin, xMax, yMin, yMax } = calculateDragBounds(
            isMaskMode,
            maskViewport,
            latestSizeRef.current,
            estimatedHeightPercent
          )

          // 在非遮罩模式下，x 位置保持居中，只允许 y 方向移动
          const newPosition = {
            x: isMaskMode
              ? Math.max(
                  xMin,
                  Math.min(xMax, startPosition.x + (deltaX / containerBounds.width) * 100)
                )
              : startPosition.x, // 非遮罩模式下保持 x 不变
            y: Math.max(
              yMin,
              Math.min(yMax, startPosition.y + (deltaY / containerBounds.height) * 100)
            )
          }

          // 确保位置在有效范围内
          const clampedPosition = {
            x: clampPercent(newPosition.x),
            y: clampPercent(newPosition.y)
          }

          // 更新最新位置引用
          updateLatestPosition(clampedPosition)

          // 转换为存储格式
          const positionForStore =
            isMaskMode && maskViewport
              ? toMaskRelativePosition(clampedPosition, maskViewport)
              : clampedPosition

          onPositionChange(positionForStore)
        })
      }

      // 鼠标释放处理
      const handleMouseUp = (upEvent: MouseEvent) => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }

        onDragEnd()

        logger.info('字幕覆盖层位置更新', { newPosition: overlayPosition })

        // 完成遮罩模式引导
        if (isMaskMode && onMaskOnboardingComplete) {
          onMaskOnboardingComplete()
        }

        // 检查是否在组件外部释放
        const releasedOutside =
          !overlayRef?.current ||
          !(upEvent.target instanceof Node && overlayRef.current.contains(upEvent.target))

        if (releasedOutside) {
          document.addEventListener('click', suppressClick, true)
          setTimeout(() => {
            document.removeEventListener('click', suppressClick, true)
          }, 0)
        }

        // 清理事件监听器
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      // 添加事件监听器
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
    },
    [
      overlayPosition,
      containerBounds,
      isMaskMode,
      maskViewport,
      isResizing,
      autoPositioning,
      onPositionChange,
      onDragStart,
      onDragEnd,
      onDisableAutoPositioning,
      onMaskOnboardingComplete,
      overlayRef,
      updateLatestPosition
    ]
  )

  return {
    handleMouseDown,
    updateLatestPosition
  }
}
