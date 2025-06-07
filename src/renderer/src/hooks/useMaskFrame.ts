import { useState, useCallback, useEffect } from 'react'
import type { SubtitleMarginsState } from './useSubtitleState'
import { usePlayingVideoContext } from './usePlayingVideoContext'
import { useUIStore } from '@renderer/stores/slices/uiStore'

interface MaskFrameState {
  isHovering: boolean
  isDragging: boolean
  isResizing: boolean
  dragOffset: { x: number; y: number }
  resizeStartState: {
    maskFrame: SubtitleMarginsState['maskFrame']
    mouseX: number
    mouseY: number
    resizeDirection: 'se' | 'sw' | 'ne' | 'nw'
  } | null
}

// 计算视频在容器中的实际显示区域
const calculateVideoDisplayArea = (
  displayAspectRatio: number,
  containerWidth: number,
  containerHeight: number
): {
  left: number
  top: number
  width: number
  height: number
} => {
  if (containerWidth === 0 || containerHeight === 0) {
    return { left: 0, top: 0, width: 100, height: 100 }
  }

  const containerAspectRatio = containerWidth / containerHeight

  let videoDisplayWidth: number, videoDisplayHeight: number, videoLeft: number, videoTop: number

  if (displayAspectRatio > containerAspectRatio) {
    // 视频比容器更宽，以容器宽度为准进行缩放
    videoDisplayWidth = containerWidth
    videoDisplayHeight = containerWidth / displayAspectRatio
    videoLeft = 0
    videoTop = (containerHeight - videoDisplayHeight) / 2
  } else {
    // 视频比容器更高（或相等），以容器高度为准进行缩放
    videoDisplayHeight = containerHeight
    videoDisplayWidth = containerHeight * displayAspectRatio
    videoTop = 0
    videoLeft = (containerWidth - videoDisplayWidth) / 2
  }

  // 转换为百分比
  const videoLeftPercent = (videoLeft / containerWidth) * 100
  const videoTopPercent = (videoTop / containerHeight) * 100
  const videoWidthPercent = (videoDisplayWidth / containerWidth) * 100
  const videoHeightPercent = (videoDisplayHeight / containerHeight) * 100

  return {
    left: Math.max(0, Math.min(100, videoLeftPercent)),
    top: Math.max(0, Math.min(100, videoTopPercent)),
    width: Math.max(10, Math.min(100, videoWidthPercent)),
    height: Math.max(10, Math.min(100, videoHeightPercent))
  }
}

export const useMaskFrame = (
  maskFrame: SubtitleMarginsState['maskFrame'],
  updateMaskFrame: (maskFrame: SubtitleMarginsState['maskFrame']) => void,
  containerRef: React.RefObject<HTMLDivElement | null>
): MaskFrameState & {
  handleMouseDown: (e: React.MouseEvent) => void
  handleResizeMouseDown: (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => void
  handleMouseMove: (e: MouseEvent) => void
  handleMouseUp: () => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  resetInteractionState: () => void
} => {
  const { displayAspectRatio } = usePlayingVideoContext()

  // Get subtitle layout lock state - 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useUIStore()

  const [state, setState] = useState<MaskFrameState>({
    isHovering: false,
    isDragging: false,
    isResizing: false,
    dragOffset: { x: 0, y: 0 },
    resizeStartState: null
  })

  // 存储初始设置状态，用于判断是否需要自动调整
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // 验证并修正定位框值
  const validateMaskFrame = useCallback(
    (maskFrame: SubtitleMarginsState['maskFrame']): SubtitleMarginsState['maskFrame'] => {
      let { left, top, width, height } = maskFrame

      // 确保所有值都不为负数，并进行精度舍入
      left = Math.max(0, Math.round(left * 1000) / 1000)
      top = Math.max(0, Math.round(top * 1000) / 1000)
      width = Math.max(10, Math.round(width * 1000) / 1000) // 最小宽度10%
      height = Math.max(10, Math.round(height * 1000) / 1000) // 最小高度10%

      // 确保定位框不超出边界
      if (left + width > 100) {
        if (width <= 100) {
          left = 100 - width
        } else {
          left = 0
          width = 100
        }
      }

      if (top + height > 100) {
        if (height <= 100) {
          top = 100 - height
        } else {
          top = 0
          height = 100
        }
      }

      // 最大尺寸限制
      width = Math.min(100, width)
      height = Math.min(100, height)

      return {
        left: Math.round(left * 1000) / 1000,
        top: Math.round(top * 1000) / 1000,
        width: Math.round(width * 1000) / 1000,
        height: Math.round(height * 1000) / 1000
      }
    },
    []
  )

  // 监听窗口大小变化，自动调整定位框以始终框选视频
  useEffect(() => {
    const handleResize = (): void => {
      const parent = containerRef.current?.parentElement
      if (!parent || hasUserInteracted) {
        return // 如果用户已经手动调整过，就不再自动调整
      }

      const videoArea = calculateVideoDisplayArea(
        displayAspectRatio,
        parent.clientWidth,
        parent.clientHeight
      )

      // 检查当前定位框是否与计算出的视频区域差异很大
      const threshold = 2 // 差异阈值 2%
      const hasSignificantDifference =
        Math.abs(maskFrame.left - videoArea.left) > threshold ||
        Math.abs(maskFrame.top - videoArea.top) > threshold ||
        Math.abs(maskFrame.width - videoArea.width) > threshold ||
        Math.abs(maskFrame.height - videoArea.height) > threshold

      if (hasSignificantDifference) {
        console.log('🔧 窗口大小变化，自动调整定位框以框选视频...')
        console.log('📐 计算的视频区域:', videoArea)
        console.log('📐 当前定位框:', maskFrame)

        updateMaskFrame(validateMaskFrame(videoArea))
      }
    }

    // 防抖处理，避免频繁调整
    let timeoutId: NodeJS.Timeout
    const debouncedHandleResize = (): void => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedHandleResize)

    // 组件挂载时也执行一次调整
    debouncedHandleResize()

    return () => {
      window.removeEventListener('resize', debouncedHandleResize)
      clearTimeout(timeoutId)
    }
  }, [
    displayAspectRatio,
    maskFrame,
    containerRef,
    updateMaskFrame,
    validateMaskFrame,
    hasUserInteracted
  ])

  // 开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // 只响应左键

      // When subtitle layout is locked, don't allow dragging - 锁定布局时不允许拖拽
      if (isSubtitleLayoutLocked) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      e.preventDefault()
      e.stopPropagation()

      // 标记用户已经交互过
      setHasUserInteracted(true)

      const parent = containerRef.current?.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const maskFrameRect = {
        left: parent.clientWidth * (maskFrame.left / 100),
        top: parent.clientHeight * (maskFrame.top / 100)
      }

      // 计算鼠标相对于定位框左上角的偏移量
      setState((prev) => ({
        ...prev,
        isDragging: true,
        dragOffset: {
          x: e.clientX - parentRect.left - maskFrameRect.left,
          y: e.clientY - parentRect.top - maskFrameRect.top
        }
      }))
    },
    [containerRef, maskFrame, isSubtitleLayoutLocked]
  )

  // 开始调整大小
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
      if (e.button !== 0) return // 只响应左键

      // When subtitle layout is locked, don't allow resizing - 锁定布局时不允许调整大小
      if (isSubtitleLayoutLocked) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      e.preventDefault()
      e.stopPropagation()

      // 标记用户已经交互过
      setHasUserInteracted(true)

      setState((prev) => ({
        ...prev,
        isResizing: true,
        resizeStartState: {
          maskFrame: { ...maskFrame },
          mouseX: e.clientX,
          mouseY: e.clientY,
          resizeDirection: direction
        }
      }))
    },
    [maskFrame, isSubtitleLayoutLocked]
  )

  // 拖拽和调整大小过程中
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (state.isDragging) {
        // 定位框拖拽逻辑
        const parent = containerRef.current?.parentElement
        if (!parent) return

        const parentRect = parent.getBoundingClientRect()

        // 计算新的定位框位置（百分比）
        const newLeftPx = e.clientX - state.dragOffset.x - parentRect.left
        const newTopPx = e.clientY - state.dragOffset.y - parentRect.top

        const newLeftPercent = Math.max(
          0,
          Math.min(100 - maskFrame.width, (newLeftPx / parent.clientWidth) * 100)
        )
        const newTopPercent = Math.max(
          0,
          Math.min(100 - maskFrame.height, (newTopPx / parent.clientHeight) * 100)
        )

        updateMaskFrame(
          validateMaskFrame({
            ...maskFrame,
            left: newLeftPercent,
            top: newTopPercent
          })
        )
      } else if (state.isResizing && state.resizeStartState) {
        // 定位框调整大小逻辑
        const deltaX = e.clientX - state.resizeStartState.mouseX
        const deltaY = e.clientY - state.resizeStartState.mouseY
        const parent = containerRef.current?.parentElement

        if (!parent) return

        const deltaXPercent = (deltaX / parent.clientWidth) * 100
        const deltaYPercent = (deltaY / parent.clientHeight) * 100

        const newMaskFrame = { ...state.resizeStartState.maskFrame }

        // 根据拖拽方向调整定位框大小
        switch (state.resizeStartState.resizeDirection) {
          case 'se': {
            // 右下角 - 增加宽度和高度
            newMaskFrame.width = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.left,
                state.resizeStartState.maskFrame.width + deltaXPercent
              )
            )
            newMaskFrame.height = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.top,
                state.resizeStartState.maskFrame.height + deltaYPercent
              )
            )
            break
          }
          case 'sw': {
            // 左下角 - 调整左边距和高度
            const newLeftSW = Math.max(
              0,
              Math.min(
                newMaskFrame.left + newMaskFrame.width - 10,
                state.resizeStartState.maskFrame.left + deltaXPercent
              )
            )
            newMaskFrame.width =
              state.resizeStartState.maskFrame.width +
              (state.resizeStartState.maskFrame.left - newLeftSW)
            newMaskFrame.left = newLeftSW
            newMaskFrame.height = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.top,
                state.resizeStartState.maskFrame.height + deltaYPercent
              )
            )
            break
          }
          case 'ne': {
            // 右上角 - 调整上边距和宽度
            const newTopNE = Math.max(
              0,
              Math.min(
                newMaskFrame.top + newMaskFrame.height - 10,
                state.resizeStartState.maskFrame.top + deltaYPercent
              )
            )
            newMaskFrame.height =
              state.resizeStartState.maskFrame.height +
              (state.resizeStartState.maskFrame.top - newTopNE)
            newMaskFrame.top = newTopNE
            newMaskFrame.width = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.left,
                state.resizeStartState.maskFrame.width + deltaXPercent
              )
            )
            break
          }
          case 'nw': {
            // 左上角 - 调整左边距和上边距
            const newLeftNW = Math.max(
              0,
              Math.min(
                newMaskFrame.left + newMaskFrame.width - 10,
                state.resizeStartState.maskFrame.left + deltaXPercent
              )
            )
            const newTopNW = Math.max(
              0,
              Math.min(
                newMaskFrame.top + newMaskFrame.height - 10,
                state.resizeStartState.maskFrame.top + deltaYPercent
              )
            )
            newMaskFrame.width =
              state.resizeStartState.maskFrame.width +
              (state.resizeStartState.maskFrame.left - newLeftNW)
            newMaskFrame.height =
              state.resizeStartState.maskFrame.height +
              (state.resizeStartState.maskFrame.top - newTopNW)
            newMaskFrame.left = newLeftNW
            newMaskFrame.top = newTopNW
            break
          }
        }

        updateMaskFrame(validateMaskFrame(newMaskFrame))
      }
    },
    [
      state.isDragging,
      state.isResizing,
      state.resizeStartState,
      state.dragOffset,
      containerRef,
      maskFrame,
      validateMaskFrame,
      updateMaskFrame
    ]
  )

  // 结束拖拽或调整大小
  const handleMouseUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDragging: false,
      isResizing: false,
      resizeStartState: null
    }))
  }, [])

  // 悬停事件
  const handleMouseEnter = useCallback(() => {
    setState((prev) => ({ ...prev, isHovering: true }))
  }, [])

  const handleMouseLeave = useCallback(() => {
    setState((prev) => ({ ...prev, isHovering: false }))
  }, [])

  // 重置交互状态，重新启用自动调整
  const resetInteractionState = useCallback(() => {
    setHasUserInteracted(false)
    console.log('🔄 重置交互状态，重新启用自动调整')
  }, [])

  return {
    ...state,
    handleMouseDown,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave,
    resetInteractionState
  }
}
