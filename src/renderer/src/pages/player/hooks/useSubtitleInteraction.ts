import type { SubtitleItem as SubtitleItemType } from '@types'
import { useCallback, useEffect, useRef } from 'react'

import { usePlayerSubtitlesStore } from '../../../state/stores/player-subtitles.store'
import { calculateMenuPosition } from '../utils/calculateMenuPosition'

/**
 * 字幕交互管理 Hook
 *
 * 提供以下功能：
 * - 键盘事件处理
 * - 交互状态清理
 */
export function useSubtitleInteraction() {
  const hoveredTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 状态选择器（使用顶层调用）
  const hoveredSubtitleId = usePlayerSubtitlesStore(
    (state) => state.interactionState.hoveredSubtitleId
  )
  const editingSubtitleId = usePlayerSubtitlesStore(
    (state) => state.interactionState.editingSubtitleId
  )
  const contextMenuState = usePlayerSubtitlesStore((state) => state.contextMenuState)

  // Action 选择器
  const setEditingSubtitleId = usePlayerSubtitlesStore((state) => state.setEditingSubtitleId)
  const openContextMenu = usePlayerSubtitlesStore((state) => state.openContextMenu)
  const closeContextMenu = usePlayerSubtitlesStore((state) => state.closeContextMenu)

  // 右键菜单处理
  const handleContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent, subtitle: SubtitleItemType, subtitleIndex: number) => {
      event.preventDefault()

      // 获取点击位置
      const clickPosition = {
        x: (event as any).clientX,
        y: (event as any).clientY
      }

      // 计算菜单位置，确保光标对准第一个菜单项
      const menuPosition = calculateMenuPosition(clickPosition)

      openContextMenu(subtitle.id, subtitleIndex, menuPosition)
    },
    [openContextMenu]
  )

  // 编辑处理
  const startEditing = useCallback(
    (subtitleId: string) => {
      setEditingSubtitleId(subtitleId)
      closeContextMenu()
    },
    [setEditingSubtitleId, closeContextMenu]
  )

  const stopEditing = useCallback(() => {
    setEditingSubtitleId(undefined)
  }, [setEditingSubtitleId])

  // 延迟关闭菜单处理（兼容旧的接口）
  const scheduleCloseContextMenu = useCallback(() => {
    // 清除之前的 timeout
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
    }

    // 设置新的 timeout
    menuTimeoutRef.current = setTimeout(() => {
      closeContextMenu()
    }, 300)
  }, [closeContextMenu])

  // 取消延迟关闭
  const cancelCloseContextMenu = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
    }
  }, [])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC 键关闭菜单或取消编辑
      if (event.key === 'Escape') {
        if (contextMenuState.isOpen) {
          closeContextMenu()
        }
        if (editingSubtitleId) {
          stopEditing()
        }
      }

      // Enter 键在编辑状态下确认
      if (event.key === 'Enter' && editingSubtitleId) {
        stopEditing()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // 清理 timeout
      if (hoveredTimeoutRef.current) {
        clearTimeout(hoveredTimeoutRef.current)
      }
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current)
      }
    }
  }, [contextMenuState.isOpen, editingSubtitleId, closeContextMenu, stopEditing])

  // 计算悬停状态
  const isSubtitleHovered = useCallback(
    (subtitleId: string) => {
      return hoveredSubtitleId === subtitleId
    },
    [hoveredSubtitleId]
  )

  const isSubtitleEditing = useCallback(
    (subtitleId: string) => {
      return editingSubtitleId === subtitleId
    },
    [editingSubtitleId]
  )

  return {
    // 状态
    hoveredSubtitleId,
    editingSubtitleId,
    contextMenuState,

    // 计算属性
    isSubtitleHovered,
    isSubtitleEditing,

    // 事件处理
    handleContextMenu,

    // 编辑控制
    startEditing,
    stopEditing,

    // 菜单控制
    closeContextMenu,
    cancelCloseContextMenu,
    scheduleCloseContextMenu
  }
}
