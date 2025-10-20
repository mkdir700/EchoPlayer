/**
 * useSubtitleResize Hook
 *
 * 封装字幕覆盖层的尺寸调整功能：
 * - 尺寸调整开始/结束处理
 * - 鼠标移动事件处理
 * - 最大/最小尺寸限制
 * - 双击扩展功能
 * - 性能优化（requestAnimationFrame）
 */

import { loggerService } from '@logger'
import { useCallback, useRef } from 'react'

import {
  calculateResizeBounds,
  clampPercent,
  type MaskLayout,
  MAX_OVERLAY_WIDTH_PERCENT,
  MIN_SPAN_PERCENT,
  type Position,
  type Size,
  toMaskRelativePosition,
  toMaskRelativeSize
} from '../utils/coordinateTransform'

const logger = loggerService.withContext('useSubtitleResize')

export interface UseSubtitleResizeOptions {
  overlayPosition: Position
  overlaySize: Size
  containerBounds: { width: number; height: number }
  isMaskMode: boolean
  maskViewport: MaskLayout | null
  autoPositioning: boolean
  onSizeChange: (size: Size) => void
  onPositionChange: (position: Position) => void
  onResizeStart: () => void
  onResizeEnd: () => void
  onDisableAutoPositioning: () => void
  onMaskOnboardingComplete?: () => void
  overlayRef?: React.RefObject<HTMLDivElement | null>
}

export function useSubtitleResize({
  overlayPosition,
  overlaySize,
  containerBounds,
  isMaskMode,
  maskViewport,
  autoPositioning,
  onSizeChange,
  onPositionChange,
  onResizeStart,
  onResizeEnd,
  onDisableAutoPositioning,
  onMaskOnboardingComplete,
  overlayRef
}: UseSubtitleResizeOptions) {
  // === 引用管理 ===
  const latestSizeRef = useRef(overlaySize)
  const latestPositionRef = useRef(overlayPosition)

  // === 更新最新引用 ===
  const updateLatestSize = useCallback((size: Size) => {
    latestSizeRef.current = size
  }, [])

  const updateLatestPosition = useCallback((position: Position) => {
    latestPositionRef.current = position
  }, [])

  // === 调整尺寸处理 ===
  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件

      // 禁用自动定位
      if (autoPositioning) {
        onDisableAutoPositioning()
      }

      const startX = event.clientX
      const startY = event.clientY
      const startSize = { width: overlaySize.width, height: overlaySize.height }

      onResizeStart()

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

          // 计算尺寸调整边界
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { widthLimit, heightLimit, maxHeightPercent } = calculateResizeBounds(
            isMaskMode,
            maskViewport,
            latestPositionRef.current
          )

          // 计算新尺寸
          const newSize = {
            width: Math.max(
              MIN_SPAN_PERCENT,
              Math.min(widthLimit, startSize.width + (deltaX / containerBounds.width) * 100)
            ),
            height: Math.max(
              MIN_SPAN_PERCENT,
              Math.min(maxHeightPercent, startSize.height + (deltaY / containerBounds.height) * 100)
            )
          }

          // 确保尺寸在有效范围内
          const clampedSize = {
            width: clampPercent(newSize.width),
            height: clampPercent(newSize.height)
          }

          // 更新最新尺寸引用
          updateLatestSize(clampedSize)

          // 转换为存储格式
          const sizeForStore =
            isMaskMode && maskViewport ? toMaskRelativeSize(clampedSize, maskViewport) : clampedSize

          onSizeChange(sizeForStore)
        })
      }

      // 鼠标释放处理
      const handleMouseUp = (upEvent: MouseEvent) => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }

        onResizeEnd()

        logger.info('字幕覆盖层尺寸更新', { newSize: overlaySize })

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
      overlaySize,
      containerBounds,
      isMaskMode,
      maskViewport,
      autoPositioning,
      onSizeChange,
      onResizeStart,
      onResizeEnd,
      onDisableAutoPositioning,
      onMaskOnboardingComplete,
      overlayRef,
      updateLatestSize
    ]
  )

  // === 双击扩展处理 ===
  const handleResizeDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件

      // 计算最大宽度
      const maxWidth =
        isMaskMode && maskViewport ? maskViewport.size.width : MAX_OVERLAY_WIDTH_PERCENT

      // 计算新尺寸（扩展到最大宽度）
      const newSize = {
        ...overlaySize,
        width: maxWidth
      }

      // 计算新位置（居中）
      const newPosition = {
        ...overlayPosition,
        x:
          isMaskMode && maskViewport
            ? maskViewport.position.x
            : Math.max(0, Math.min(100 - maxWidth, 50 - maxWidth / 2))
      }

      // 确保位置和尺寸在有效范围内
      const clampedSize = {
        width: clampPercent(newSize.width),
        height: clampPercent(newSize.height)
      }

      const clampedPosition = {
        x: clampPercent(newPosition.x),
        y: clampPercent(newPosition.y)
      }

      // 更新最新引用
      updateLatestSize(clampedSize)
      updateLatestPosition(clampedPosition)

      // 转换为存储格式
      const sizeForStore =
        isMaskMode && maskViewport ? toMaskRelativeSize(clampedSize, maskViewport) : clampedSize
      const positionForStore =
        isMaskMode && maskViewport
          ? toMaskRelativePosition(clampedPosition, maskViewport)
          : clampedPosition

      // 同时更新尺寸和位置
      onSizeChange(sizeForStore)
      onPositionChange(positionForStore)

      logger.info('字幕覆盖层双击扩展', {
        newSize: clampedSize,
        newPosition: clampedPosition,
        centerFirst: true,
        thenExpand: true
      })

      // 完成遮罩模式引导
      if (isMaskMode && onMaskOnboardingComplete) {
        onMaskOnboardingComplete()
      }
    },
    [
      overlaySize,
      overlayPosition,
      isMaskMode,
      maskViewport,
      onSizeChange,
      onPositionChange,
      onMaskOnboardingComplete,
      updateLatestSize,
      updateLatestPosition
    ]
  )

  return {
    handleResizeMouseDown,
    handleResizeDoubleClick,
    updateLatestSize,
    updateLatestPosition
  }
}
