import React, { useState, useCallback } from 'react'
import { MARGIN_LIMITS } from './useSubtitleState'
import { SubtitleDisplaySettings } from '@types_/shared'
import { useVideoConfig } from './useVideoConfig'

interface DragAndResizeState {
  isDragging: boolean
  isResizing: boolean
  dragOffset: { x: number; y: number }
  resizeStartState: {
    margins: SubtitleDisplaySettings['margins']
    mouseX: number
    mouseY: number
    resizeDirection: 'se' | 'sw' | 'ne' | 'nw'
  } | null
}

export const useSubtitleDragAndResize = (
  subtitleState: SubtitleDisplaySettings,
  updateSubtitleState: (state: SubtitleDisplaySettings) => void,
  getParentBounds: () => { width: number; height: number },
  currentLayout: { left: number; top: number; width: number; height: number }
): {
  isDragging: boolean
  isResizing: boolean
  dragOffset: { x: number; y: number }
  resizeStartState: {
    margins: SubtitleDisplaySettings['margins']
    mouseX: number
    mouseY: number
    resizeDirection: 'se' | 'sw' | 'ne' | 'nw'
  } | null
  handleMouseDown: (
    e: React.MouseEvent,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => void
  handleResizeMouseDown: (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => void
  handleMouseMove: (e: MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => void
  handleMouseUp: () => void
} => {
  // Get subtitle layout lock state - 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useVideoConfig()

  const [dragState, setDragState] = useState<DragAndResizeState>({
    isDragging: false,
    isResizing: false,
    dragOffset: { x: 0, y: 0 },
    resizeStartState: null
  })

  // 简单验证边距值（用于拖拽，不强制调整宽高）
  const validateMarginsForDrag = useCallback(
    (margins: SubtitleDisplaySettings['margins']): SubtitleDisplaySettings['margins'] => {
      let { left, top, right, bottom } = margins

      // 确保所有边距都不为负数，并进行精度舍入
      left = Math.max(0, Math.round(left * 1000) / 1000)
      top = Math.max(0, Math.round(top * 1000) / 1000)
      right = Math.max(0, Math.round(right * 1000) / 1000)
      bottom = Math.max(0, Math.round(bottom * 1000) / 1000)

      // 确保单个边距不超过最大限制
      left = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, left) * 1000) / 1000
      top = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, top) * 1000) / 1000
      right = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, right) * 1000) / 1000
      bottom = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, bottom) * 1000) / 1000

      // 确保不会超出边界（保持当前宽高不变）
      if (left + right >= 100) {
        const totalMargin = left + right
        const scale = 99 / totalMargin
        left = Math.round(left * scale * 1000) / 1000
        right = Math.round(right * scale * 1000) / 1000
      }

      if (top + bottom >= 100) {
        const totalMargin = top + bottom
        const scale = 99 / totalMargin
        top = Math.round(top * scale * 1000) / 1000
        bottom = Math.round(bottom * scale * 1000) / 1000
      }

      return { left, top, right, bottom }
    },
    []
  )

  // 完整验证并修正边距值（用于调整大小）
  const validateMargins = useCallback(
    (margins: SubtitleDisplaySettings['margins']): SubtitleDisplaySettings['margins'] => {
      let { left, top, right, bottom } = margins

      // 确保所有边距都不为负数，并进行精度舍入
      left = Math.max(0, Math.round(left * 1000) / 1000)
      top = Math.max(0, Math.round(top * 1000) / 1000)
      right = Math.max(0, Math.round(right * 1000) / 1000)
      bottom = Math.max(0, Math.round(bottom * 1000) / 1000)

      // 计算当前的总宽度和高度
      const totalWidth = 100 - left - right
      const totalHeight = 100 - top - bottom

      // 如果总宽度小于最小要求，按比例调整左右边距
      if (totalWidth < MARGIN_LIMITS.MIN_TOTAL_WIDTH) {
        const requiredSpace = MARGIN_LIMITS.MIN_TOTAL_WIDTH
        const currentTotalMargin = left + right
        const targetTotalMargin = 100 - requiredSpace

        if (currentTotalMargin > 0) {
          const scale = targetTotalMargin / currentTotalMargin
          left = Math.round(left * scale * 1000) / 1000
          right = Math.round(right * scale * 1000) / 1000
        } else {
          left = Math.round((targetTotalMargin / 2) * 1000) / 1000
          right = Math.round((targetTotalMargin / 2) * 1000) / 1000
        }
      }

      // 如果总高度小于最小要求，按比例调整上下边距
      if (totalHeight < MARGIN_LIMITS.MIN_TOTAL_HEIGHT) {
        const requiredSpace = MARGIN_LIMITS.MIN_TOTAL_HEIGHT
        const currentTotalMargin = top + bottom
        const targetTotalMargin = 100 - requiredSpace

        if (currentTotalMargin > 0) {
          const scale = targetTotalMargin / currentTotalMargin
          top = Math.round(top * scale * 1000) / 1000
          bottom = Math.round(bottom * scale * 1000) / 1000
        } else {
          top = Math.round((targetTotalMargin / 2) * 1000) / 1000
          bottom = Math.round((targetTotalMargin / 2) * 1000) / 1000
        }
      }

      // 确保单个边距不超过最大限制
      left = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, left) * 1000) / 1000
      top = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, top) * 1000) / 1000
      right = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, right) * 1000) / 1000
      bottom = Math.round(Math.min(MARGIN_LIMITS.MAX_SINGLE_MARGIN, bottom) * 1000) / 1000

      return { left, top, right, bottom }
    },
    []
  )

  // 开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => {
      if (e.button !== 0) return

      // When subtitle layout is locked, don't allow dragging - 锁定布局时不允许拖拽
      if (isSubtitleLayoutLocked) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // 检查点击的目标是否是可点击的单词
      const target = e.target as HTMLElement
      const isClickableWord = target.closest('.clickableWord') !== null

      if (isClickableWord) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const containerRect = containerRef.current?.getBoundingClientRect()
      const parentBounds = getParentBounds()

      if (!containerRect || !parentBounds.width || !parentBounds.height) return

      setDragState((prev) => ({
        ...prev,
        isDragging: true,
        dragOffset: {
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top
        }
      }))
    },
    [getParentBounds, isSubtitleLayoutLocked]
  )

  // 开始调整大小
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
      if (e.button !== 0) return

      // When subtitle layout is locked, don't allow resizing - 锁定布局时不允许调整大小
      if (isSubtitleLayoutLocked) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      e.preventDefault()
      e.stopPropagation()

      setDragState((prev) => ({
        ...prev,
        isResizing: true,
        resizeStartState: {
          margins: { ...subtitleState.margins },
          mouseX: e.clientX,
          mouseY: e.clientY,
          resizeDirection: direction
        }
      }))
    },
    [subtitleState.margins, isSubtitleLayoutLocked]
  )

  // 拖拽过程中
  const handleMouseMove = useCallback(
    (e: MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => {
      if (dragState.isDragging) {
        const parentBounds = getParentBounds()
        const parent = containerRef.current?.parentElement

        if (!parent || !parentBounds.width || !parentBounds.height) return

        const parentRect = parent.getBoundingClientRect()

        // 计算新的左上角位置（百分比）
        const newLeftPx = e.clientX - dragState.dragOffset.x - parentRect.left
        const newTopPx = e.clientY - dragState.dragOffset.y - parentRect.top

        let newLeftPercent: number
        let newTopPercent: number

        if (subtitleState.isMaskMode) {
          // 遮罩模式下，相对于定位框计算
          const maskFrameLeft = parent.clientWidth * (subtitleState.maskFrame.left / 100)
          const maskFrameTop = parent.clientHeight * (subtitleState.maskFrame.top / 100)
          const maskFrameWidth = parent.clientWidth * (subtitleState.maskFrame.width / 100)
          const maskFrameHeight = parent.clientHeight * (subtitleState.maskFrame.height / 100)

          const relativeLeftPx = newLeftPx - maskFrameLeft
          const relativeTopPx = newTopPx - maskFrameTop

          newLeftPercent = Math.round((relativeLeftPx / maskFrameWidth) * 100 * 1000) / 1000
          newTopPercent = Math.round((relativeTopPx / maskFrameHeight) * 100 * 1000) / 1000
        } else {
          // 普通模式下，相对于整个播放器容器
          newLeftPercent = Math.round((newLeftPx / parentBounds.width) * 100 * 1000) / 1000
          newTopPercent = Math.round((newTopPx / parentBounds.height) * 100 * 1000) / 1000
        }

        // 限制拖拽边界，确保字幕区域不会超出容器
        const maxLeft = 100 - currentLayout.width
        const maxTop = 100 - currentLayout.height

        newLeftPercent = Math.max(0, Math.min(maxLeft, newLeftPercent))
        newTopPercent = Math.max(0, Math.min(maxTop, newTopPercent))

        // 计算新的边距值
        const newMargins = validateMarginsForDrag({
          left: newLeftPercent,
          top: newTopPercent,
          right: 100 - newLeftPercent - currentLayout.width,
          bottom: 100 - newTopPercent - currentLayout.height
        })

        updateSubtitleState({
          ...subtitleState,
          margins: newMargins
        })
      } else if (dragState.isResizing && dragState.resizeStartState) {
        // 调整大小逻辑
        const deltaX = e.clientX - dragState.resizeStartState.mouseX
        const deltaY = e.clientY - dragState.resizeStartState.mouseY
        const parentBounds = getParentBounds()

        if (!parentBounds.width || !parentBounds.height) return

        const deltaXPercent = (deltaX / parentBounds.width) * 100
        const deltaYPercent = (deltaY / parentBounds.height) * 100

        let newMargins = { ...dragState.resizeStartState.margins }

        // 根据拖拽方向调整相应的边距
        switch (dragState.resizeStartState.resizeDirection) {
          case 'se':
            // 右下角控制点：左右拖动同时调节左右两边，上下拖动同时调节上下两边
            // 水平拖动：同时调整左边距和右边距（保持中心位置不变）
            newMargins.left = dragState.resizeStartState.margins.left - deltaXPercent / 2
            newMargins.right = dragState.resizeStartState.margins.right - deltaXPercent / 2
            // 垂直拖动：同时调整上边距和下边距（保持中心位置不变）
            newMargins.top = dragState.resizeStartState.margins.top - deltaYPercent / 2
            newMargins.bottom = dragState.resizeStartState.margins.bottom - deltaYPercent / 2
            break
          case 'sw':
            newMargins.left = dragState.resizeStartState.margins.left + deltaXPercent
            newMargins.bottom = dragState.resizeStartState.margins.bottom - deltaYPercent
            break
          case 'ne':
            newMargins.right = dragState.resizeStartState.margins.right - deltaXPercent
            newMargins.top = dragState.resizeStartState.margins.top + deltaYPercent
            break
          case 'nw':
            newMargins.left = dragState.resizeStartState.margins.left + deltaXPercent
            newMargins.top = dragState.resizeStartState.margins.top + deltaYPercent
            break
        }

        newMargins = validateMargins(newMargins)

        updateSubtitleState({
          ...subtitleState,
          margins: newMargins
        })
      }
    },
    [
      dragState.isDragging,
      dragState.isResizing,
      dragState.resizeStartState,
      dragState.dragOffset,
      getParentBounds,
      subtitleState,
      currentLayout.width,
      currentLayout.height,
      validateMarginsForDrag,
      validateMargins,
      updateSubtitleState
    ]
  )

  // 结束拖拽或调整大小
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      isResizing: false,
      resizeStartState: null
    }))
  }, [])

  return {
    ...dragState,
    handleMouseDown,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
