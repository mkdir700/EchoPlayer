/**
 * SubtitleOverlay UI Hook
 *
 * 管理字幕覆盖层的 UI 交互状态：
 * - 拖拽、调整尺寸等交互状态
 * - 悬停、边界显示等视觉状态
 * - 容器边界信息和响应式计算
 * - 文本选择状态
 *
 * 替代原有的 subtitle-overlay.store.ts，简化架构
 */

import { loggerService } from '@logger'
import { usePlayerStore } from '@renderer/state'
import { useCallback, useEffect, useState } from 'react'

const logger = loggerService.withContext('SubtitleOverlayUI')

const BOUNDS_CHANGE_THRESHOLD = 0.5

/**
 * 位置信息
 */
export interface Position {
  /** X 坐标（像素或百分比） */
  x: number
  /** Y 坐标（像素或百分比） */
  y: number
}

/**
 * 尺寸信息
 */
export interface Size {
  /** 宽度（像素或百分比） */
  width: number
  /** 高度（像素或百分比） */
  height: number
}

/**
 * SubtitleOverlay UI状态接口
 * 只包含UI交互状态，不包含配置数据
 */
export interface SubtitleOverlayUIState {
  /** 是否正在拖拽移动 */
  isDragging: boolean

  /** 是否正在调整尺寸 */
  isResizing: boolean

  /** 是否显示边界线（悬停时） */
  showBoundaries: boolean

  /** 是否悬停状态 */
  isHovered: boolean

  /** 是否显示控制按钮 */
  isControlsVisible: boolean

  /** 选中的文本 */
  selectedText: string

  /** 容器边界信息 */
  containerBounds: { width: number; height: number }
}

/**
 * SubtitleOverlay UI操作接口
 */
export interface SubtitleOverlayUIActions {
  // === UI交互状态控制 ===
  /** 开始拖拽 */
  startDragging: () => void

  /** 停止拖拽 */
  stopDragging: () => void

  /** 开始调整尺寸 */
  startResizing: () => void

  /** 停止调整尺寸 */
  stopResizing: () => void

  /** 设置悬停状态 */
  setHovered: (isHovered: boolean) => void

  /** 设置选中文本 */
  setSelectedText: (text: string) => void

  // === 响应式处理 ===
  /** 更新容器边界 */
  updateContainerBounds: (bounds: { width: number; height: number }) => void

  /** 适应容器尺寸变化 */
  adaptToContainerResize: (newBounds: { width: number; height: number }) => void

  /** 智能避让冲突区域 */
  avoidCollision: (
    conflictAreas: Array<{ x: number; y: number; width: number; height: number }>
  ) => void
}

export type SubtitleOverlayUI = SubtitleOverlayUIState & SubtitleOverlayUIActions

/**
 * 初始UI状态配置（不包含配置数据）
 */
const initialState: SubtitleOverlayUIState = {
  // UI交互状态
  isDragging: false,
  isResizing: false,
  showBoundaries: false,
  isHovered: false,
  isControlsVisible: false,
  selectedText: '',
  containerBounds: { width: 800, height: 600 }
}

/**
 * SubtitleOverlay UI Hook
 * 管理字幕覆盖层的UI交互状态，使用本地 React state
 */
export function useSubtitleOverlayUI(): SubtitleOverlayUI {
  // === 本地UI状态 ===
  const [isDragging, setIsDragging] = useState(initialState.isDragging)
  const [isResizing, setIsResizing] = useState(initialState.isResizing)
  const [showBoundaries, setShowBoundaries] = useState(initialState.showBoundaries)
  const [isHovered, setIsHovered] = useState(initialState.isHovered)
  const [isControlsVisible, setIsControlsVisible] = useState(initialState.isControlsVisible)
  const [selectedText, setSelectedText] = useState(initialState.selectedText)
  const [containerBounds, setContainerBounds] = useState(initialState.containerBounds)

  // === 配置数据访问（来自 PlayerStore） ===
  const subtitleOverlay = usePlayerStore((s) => s.subtitleOverlay)
  const setSubtitleOverlay = usePlayerStore((s) => s.setSubtitleOverlay)

  // === UI交互状态控制 ===
  const startDragging = useCallback(() => {
    setIsDragging(true)
    setShowBoundaries(true)
    logger.debug('开始拖拽覆盖层')
  }, [])

  const stopDragging = useCallback(() => {
    setIsDragging(false)
    setShowBoundaries(false)
    logger.debug('停止拖拽覆盖层')
  }, [])

  const startResizing = useCallback(() => {
    setIsResizing(true)
    setShowBoundaries(true)
    logger.debug('开始调整覆盖层尺寸')
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
    setShowBoundaries(false)
    logger.debug('停止调整覆盖层尺寸')
  }, [])

  const setHovered = useCallback((hovered: boolean) => {
    setIsHovered(hovered)
    // 需要同时更新控制按钮可见性，但避免循环依赖
    // 这里我们单独管理控制按钮的可见性逻辑
  }, [])

  const setSelectedTextHandler = useCallback((text: string) => {
    setSelectedText(text)
    logger.debug('设置选中文本', { textLength: text.length })
  }, [])

  // === 控制按钮可见性逻辑 ===
  useEffect(() => {
    setIsControlsVisible(isHovered || isDragging || isResizing)
  }, [isHovered, isDragging, isResizing])

  // === 响应式处理 ===
  const updateContainerBounds = useCallback((bounds: { width: number; height: number }) => {
    setContainerBounds((prev) => {
      const widthDiff = Math.abs(prev.width - bounds.width)
      const heightDiff = Math.abs(prev.height - bounds.height)

      if (widthDiff < BOUNDS_CHANGE_THRESHOLD && heightDiff < BOUNDS_CHANGE_THRESHOLD) {
        return prev
      }

      logger.debug('更新容器边界', { bounds })
      return bounds
    })
  }, [])

  const adaptToContainerResize = useCallback(
    (newBounds: { width: number; height: number }) => {
      const oldBounds = containerBounds
      const widthDiff = Math.abs(oldBounds.width - newBounds.width)
      const heightDiff = Math.abs(oldBounds.height - newBounds.height)

      if (widthDiff < BOUNDS_CHANGE_THRESHOLD && heightDiff < BOUNDS_CHANGE_THRESHOLD) {
        return
      }

      setContainerBounds(newBounds)

      if (!subtitleOverlay) return

      if (subtitleOverlay.isMaskMode) {
        logger.debug('遮罩模式下容器尺寸变化由遮罩布局管理', {
          newBounds
        })
        return
      }

      const widthRatio = newBounds.width / Math.max(oldBounds.width, 1)
      const heightRatio = newBounds.height / Math.max(oldBounds.height, 1)

      if (Math.abs(widthRatio - 1) > 0.05 || Math.abs(heightRatio - 1) > 0.05) {
        // 使用估算的字幕高度（自适应模式下约为 160px）
        const estimatedHeightPercent = Math.min(12, (160 / newBounds.height) * 100)

        const adjustedPosition = {
          x: Math.max(0, Math.min(100 - subtitleOverlay.size.width, subtitleOverlay.position.x)),
          y: Math.max(0, Math.min(100 - estimatedHeightPercent, subtitleOverlay.position.y))
        }

        // 保持原有尺寸，只进行必要的边界约束
        const newSize = { ...subtitleOverlay.size }

        // 确保尺寸在合理范围内，但不强制修改用户设置
        if (newSize.width > 95) newSize.width = 95
        if (newSize.width < 20) newSize.width = 20
        if (newSize.height > 40) newSize.height = 40
        if (newSize.height < 5) newSize.height = 5

        // 重新计算位置确保不超出边界
        adjustedPosition.x = Math.max(0, Math.min(100 - newSize.width, adjustedPosition.x))
        adjustedPosition.y = Math.max(0, Math.min(100 - newSize.height, adjustedPosition.y))

        // 使用 PlayerStore 的配置更新方法
        setSubtitleOverlay({
          position: adjustedPosition,
          size: newSize
        })

        logger.info('适应容器尺寸变化', {
          oldBounds,
          newBounds,
          widthRatio,
          heightRatio,
          newPosition: adjustedPosition,
          newSize
        })
      }
    },
    [containerBounds, setSubtitleOverlay, subtitleOverlay]
  )

  const avoidCollision = useCallback(
    (conflictAreas: Array<{ x: number; y: number; width: number; height: number }>) => {
      if (conflictAreas.length === 0 || !subtitleOverlay) return

      if (subtitleOverlay.isMaskMode) {
        logger.debug('遮罩模式下跳过冲突检测')
        return
      }

      // 使用估算的字幕高度（自适应模式下约为 160px）
      const estimatedHeightPercent = Math.min(12, (160 / containerBounds.height) * 100)

      const currentBounds = {
        x: subtitleOverlay.position.x,
        y: subtitleOverlay.position.y,
        width: subtitleOverlay.size.width,
        height: estimatedHeightPercent
      }

      const hasCollision = conflictAreas.some((area) => {
        return !(
          currentBounds.x + currentBounds.width < area.x ||
          area.x + area.width < currentBounds.x ||
          currentBounds.y + currentBounds.height < area.y ||
          area.y + area.height < currentBounds.y
        )
      })

      if (!hasCollision) return

      const candidates = [
        { x: 10, y: 80 },
        { x: 10, y: 60 },
        { x: 5, y: 75 },
        { x: 25, y: 75 },
        { x: 40, y: 85 }
      ]

      for (const candidate of candidates) {
        const candidateBounds = {
          ...candidate,
          width: subtitleOverlay.size.width,
          height: estimatedHeightPercent
        }

        const hasConflict = conflictAreas.some((area) => {
          return !(
            candidateBounds.x + candidateBounds.width < area.x ||
            area.x + area.width < candidateBounds.x ||
            candidateBounds.y + candidateBounds.height < area.y ||
            area.y + area.height < candidateBounds.y
          )
        })

        if (!hasConflict) {
          // 使用 PlayerStore 的配置更新方法
          setSubtitleOverlay({ position: candidate })
          logger.info('避让冲突区域，移动到新位置', {
            oldPosition: currentBounds,
            newPosition: candidate,
            conflictAreas
          })
          break
        }
      }
    },
    [containerBounds.height, setSubtitleOverlay, subtitleOverlay]
  )

  return {
    // UI状态
    isDragging,
    isResizing,
    showBoundaries,
    isHovered,
    isControlsVisible,
    selectedText,
    containerBounds,

    // UI操作
    startDragging,
    stopDragging,
    startResizing,
    stopResizing,
    setHovered,
    setSelectedText: setSelectedTextHandler,
    updateContainerBounds,
    adaptToContainerResize,
    avoidCollision
  }
}

export default useSubtitleOverlayUI
