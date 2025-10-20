/**
 * useContainerBounds Hook
 *
 * 管理容器尺寸变化和冲突检测：
 * - 容器边界更新
 * - ResizeObserver 监听
 * - 冲突区域检测
 * - 智能避让逻辑
 */

import { SubtitleDisplayMode } from '@types'
import { useCallback, useEffect } from 'react'

export interface ConflictArea {
  x: number
  y: number
  width: number
  height: number
}

export interface UseContainerBoundsOptions {
  containerRef?: React.RefObject<HTMLElement | null>
  displayMode: SubtitleDisplayMode
  currentConfig?: { isInitialized?: boolean }
  updateContainerBounds: (bounds: { width: number; height: number }) => void
  adaptToContainerResize: (bounds: { width: number; height: number }) => void
  avoidCollision: (conflicts: ConflictArea[]) => void
}

export function useContainerBounds({
  containerRef,
  displayMode,
  currentConfig,
  updateContainerBounds,
  adaptToContainerResize,
  avoidCollision
}: UseContainerBoundsOptions) {
  // === 容器边界更新 ===
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout

    const updateBounds = (isInitial = false) => {
      const container =
        containerRef?.current || document.querySelector('[data-testid="video-surface"]')
      if (container) {
        const rect = container.getBoundingClientRect()
        const newBounds = { width: rect.width, height: rect.height }

        if (isInitial || !currentConfig?.isInitialized) {
          // 初始化时使用 updateContainerBounds
          updateContainerBounds(newBounds)
        } else {
          // 容器尺寸变化时使用智能适应
          adaptToContainerResize(newBounds)
        }
      }
    }

    const handleResize = () => {
      // 防抖处理，避免频繁重新计算
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => updateBounds(false), 150)
    }

    // 初始化
    updateBounds(true)

    // 监听窗口尺寸变化
    window.addEventListener('resize', handleResize)

    // 监听全屏模式变化（可能导致容器尺寸变化）
    let observer: ResizeObserver | null = null

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (
            entry.target ===
            (containerRef?.current || document.querySelector('[data-testid="video-surface"]'))
          ) {
            handleResize()
          }
        }
      })

      const container =
        containerRef?.current || document.querySelector('[data-testid="video-surface"]')
      if (container) {
        observer.observe(container)
      }
    }

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect()
      }
    }
  }, [containerRef, updateContainerBounds, adaptToContainerResize, currentConfig?.isInitialized])

  // === 冲突区域检测 ===
  const detectConflictAreas = useCallback((): ConflictArea[] => {
    const conflictSelectors = [
      '[data-testid="controller-panel"]',
      '[data-testid="transport-bar"]',
      '[aria-label="transport-bar"]',
      '.progress-section',
      '.controller-panel'
    ]

    const conflictAreas: ConflictArea[] = []
    const container =
      containerRef?.current || document.querySelector('[data-testid="video-surface"]')

    if (!container) return conflictAreas

    const containerRect = container.getBoundingClientRect()

    conflictSelectors.forEach((selector) => {
      const element = document.querySelector(selector) as HTMLElement
      if (element && element.offsetParent) {
        // 确保元素可见
        const rect = element.getBoundingClientRect()

        // 转换为相对于容器的百分比坐标
        const relativeArea = {
          x: ((rect.left - containerRect.left) / containerRect.width) * 100,
          y: ((rect.top - containerRect.top) / containerRect.height) * 100,
          width: (rect.width / containerRect.width) * 100,
          height: (rect.height / containerRect.height) * 100
        }

        // 只关注可能与字幕区域重叠的元素
        if (relativeArea.y > 50) {
          // 只检测下半部分
          conflictAreas.push(relativeArea)
        }
      }
    })

    return conflictAreas
  }, [containerRef])

  // === 智能冲突检测 ===
  useEffect(() => {
    // 定期检测冲突区域（UI 元素可能动态显示/隐藏）
    const conflictCheckTimer = setInterval(() => {
      if (displayMode !== SubtitleDisplayMode.NONE) {
        const conflicts = detectConflictAreas()
        if (conflicts.length > 0) {
          avoidCollision(conflicts)
        }
      }
    }, 2000) // 每 2 秒检测一次

    return () => {
      clearInterval(conflictCheckTimer)
    }
  }, [detectConflictAreas, displayMode, avoidCollision])

  return {
    detectConflictAreas
  }
}
