/**
 * SubtitleOverlay Component
 *
 * 字幕覆盖层组件，提供：
 * - 可拖拽和调整尺寸的字幕显示
 * - 多种显示模式（隐藏/原文/译文/双语）
 * - 自定义背景样式（透明/模糊/纯色）
 * - 与播放器引擎的时间同步
 * - 文本选中和复制功能
 * - 响应式定位和尺寸适配
 */

import { loggerService } from '@logger'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  EASING,
  FONT_SIZES,
  FONT_WEIGHTS,
  GLASS_EFFECT,
  SHADOWS,
  SPACING,
  Z_INDEX
} from '@renderer/infrastructure/styles/theme'
import { usePlayerStore } from '@renderer/state'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { Tooltip } from 'antd'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { useSubtitleOverlay, useSubtitleOverlayUI } from '../hooks'
import SubtitleContent from './SubtitleContent'

const logger = loggerService.withContext('SubtitleOverlay')

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

const MIN_SPAN_PERCENT = 1
const ESTIMATED_SUBTITLE_HEIGHT_PX = 160
const MAX_ESTIMATED_HEIGHT_PERCENT = 12
const MAX_OVERLAY_WIDTH_PERCENT = 95
const MAX_OVERLAY_HEIGHT_PERCENT_NORMAL_MODE = 40
const VIEWPORT_CHANGE_THRESHOLD = 0.1

const toMaskRelativePosition = (position: { x: number; y: number }, mask: MaskLayout) => {
  const width = Math.max(mask.size.width, MIN_SPAN_PERCENT)
  const height = Math.max(mask.size.height, MIN_SPAN_PERCENT)

  return {
    x: clampPercent(((position.x - mask.position.x) / width) * 100),
    y: clampPercent(((position.y - mask.position.y) / height) * 100)
  }
}

const fromMaskRelativePosition = (position: { x: number; y: number }, mask: MaskLayout) => {
  return {
    x: clampPercent(mask.position.x + (position.x / 100) * mask.size.width),
    y: clampPercent(mask.position.y + (position.y / 100) * mask.size.height)
  }
}

const toMaskRelativeSize = (size: { width: number; height: number }, mask: MaskLayout) => {
  const width = Math.max(mask.size.width, MIN_SPAN_PERCENT)
  const height = Math.max(mask.size.height, MIN_SPAN_PERCENT)

  return {
    width: clampPercent((size.width / width) * 100),
    height: clampPercent((size.height / height) * 100)
  }
}

const fromMaskRelativeSize = (size: { width: number; height: number }, mask: MaskLayout) => {
  return {
    width: clampPercent((size.width / 100) * mask.size.width),
    height: clampPercent((size.height / 100) * mask.size.height)
  }
}

type MaskLayout = {
  position: { x: number; y: number }
  size: { width: number; height: number }
}

// === 接口定义 ===
export interface SubtitleOverlayProps {
  /** 容器元素引用（用于计算边界） */
  containerRef?: React.RefObject<HTMLElement | null>
}

// === 组件实现 ===
export const SubtitleOverlay = memo(function SubtitleOverlay({
  containerRef
}: SubtitleOverlayProps) {
  // === i18n 翻译 ===
  const { t } = useTranslation()

  // === 状态集成（重构版） ===
  const integration = useSubtitleOverlay()

  // === UI 状态和操作（来自新的 Hook） ===
  const {
    isDragging,
    isResizing,
    showBoundaries,
    isHovered,
    containerBounds,
    startDragging,
    stopDragging,
    startResizing,
    stopResizing,
    setHovered,
    setSelectedText,
    updateContainerBounds,
    adaptToContainerResize,
    avoidCollision
  } = useSubtitleOverlayUI()

  // === 配置数据（来自当前视频项目） ===
  const currentConfig = usePlayerStore((s) => s.subtitleOverlay)
  const displayMode = currentConfig.displayMode
  const position = currentConfig.position
  const size = currentConfig.size
  const backgroundStyle = currentConfig.backgroundStyle
  const isMaskMode = currentConfig.isMaskMode
  const autoPositioning = currentConfig.autoPositioning

  // === 配置操作（通过 integration） ===
  const setPosition = integration.setPosition
  const setSize = integration.setSize
  const setMaskOnboardingComplete = integration.setMaskOnboardingComplete
  const maskOnboardingComplete = integration.maskOnboardingComplete

  // === 本地状态 ===
  const overlayRef = useRef<HTMLDivElement>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const hideToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [maskViewport, setMaskViewport] = useState<MaskLayout | null>(null)
  const previousMaskModeRef = useRef(isMaskMode)
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)
  const containerElementRef = useRef<HTMLElement | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const setOverlayConfig = usePlayerStore((s) => s.setSubtitleOverlay)

  const resolveElements = useCallback(() => {
    const providedContainer =
      containerRef?.current ||
      (document.querySelector('[data-testid="video-surface"]') as HTMLElement | null)

    let containerElement = containerElementRef.current
    if (providedContainer && providedContainer !== containerElement) {
      containerElement = providedContainer
    }

    if (!containerElement || !containerElement.isConnected) {
      containerElement = providedContainer
    }

    if (!containerElement) return null
    containerElementRef.current = containerElement

    let videoElement = videoElementRef.current
    if (
      !videoElement ||
      !videoElement.isConnected ||
      videoElement.closest('[data-testid="video-surface"]') !== containerElement
    ) {
      videoElement = containerElement.querySelector('video') as HTMLVideoElement | null
    }

    if (!videoElement) return null
    videoElementRef.current = videoElement

    return { containerElement, videoElement }
  }, [containerRef])

  useEffect(() => {
    const elements = resolveElements()
    if (!elements) return

    const { videoElement } = elements

    const updateAspectRatio = () => {
      const naturalWidth = videoElement.videoWidth
      const naturalHeight = videoElement.videoHeight
      if (naturalWidth > 0 && naturalHeight > 0) {
        const ratio = naturalWidth / naturalHeight
        setVideoAspectRatio((prev) =>
          prev !== null && Math.abs(prev - ratio) < 0.0001 ? prev : ratio
        )
      } else {
        setVideoAspectRatio((prev) => (prev === null ? prev : null))
      }
    }

    updateAspectRatio()

    videoElement.addEventListener('loadedmetadata', updateAspectRatio)
    videoElement.addEventListener('loadeddata', updateAspectRatio)
    videoElement.addEventListener('emptied', updateAspectRatio)

    return () => {
      videoElement.removeEventListener('loadedmetadata', updateAspectRatio)
      videoElement.removeEventListener('loadeddata', updateAspectRatio)
      videoElement.removeEventListener('emptied', updateAspectRatio)
    }
  }, [resolveElements])

  const computeContentRects = useCallback(() => {
    const elements = resolveElements()
    if (!elements) return null

    const { containerElement, videoElement } = elements
    const containerRect = containerElement.getBoundingClientRect()

    if (containerRect.width <= 0 || containerRect.height <= 0) {
      return null
    }

    const naturalWidth = videoElement.videoWidth
    const naturalHeight = videoElement.videoHeight
    const aspectRatio =
      videoAspectRatio ||
      (naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : null)

    if (!aspectRatio) {
      return {
        containerRect,
        contentRect: {
          left: containerRect.left,
          top: containerRect.top,
          right: containerRect.right,
          bottom: containerRect.bottom,
          width: containerRect.width,
          height: containerRect.height
        },
        aspectRatio: null
      }
    }

    const containerRatio = containerRect.width / containerRect.height

    let contentWidth = containerRect.width
    let contentHeight = containerRect.height

    if (containerRatio > aspectRatio) {
      contentHeight = containerRect.height
      contentWidth = contentHeight * aspectRatio
    } else {
      contentWidth = containerRect.width
      contentHeight = contentWidth / aspectRatio
    }

    const offsetX = (containerRect.width - contentWidth) / 2
    const offsetY = (containerRect.height - contentHeight) / 2

    const left = containerRect.left + offsetX
    const top = containerRect.top + offsetY
    const right = left + contentWidth
    const bottom = top + contentHeight

    const contentRect = {
      left,
      top,
      right,
      bottom,
      width: contentWidth,
      height: contentHeight
    }

    return { containerRect, contentRect, aspectRatio }
  }, [resolveElements, videoAspectRatio])

  const computeMaskViewport = useCallback(() => {
    const rects = computeContentRects()
    if (!rects) return null
    const { containerRect, contentRect, aspectRatio } = rects

    if (!aspectRatio) {
      return null
    }

    const position = {
      x: clampPercent(((contentRect.left - containerRect.left) / containerRect.width) * 100),
      y: clampPercent(((contentRect.top - containerRect.top) / containerRect.height) * 100)
    }

    const size = {
      width: Math.max(
        MIN_SPAN_PERCENT,
        clampPercent((contentRect.width / containerRect.width) * 100)
      ),
      height: Math.max(
        MIN_SPAN_PERCENT,
        clampPercent((contentRect.height / containerRect.height) * 100)
      )
    }

    return { position, size }
  }, [computeContentRects])

  const overlayPosition = useMemo(() => {
    if (isMaskMode && maskViewport) {
      return fromMaskRelativePosition(position, maskViewport)
    }
    return position
  }, [isMaskMode, maskViewport, position])

  const overlaySize = useMemo(() => {
    if (isMaskMode && maskViewport) {
      return fromMaskRelativeSize(size, maskViewport)
    }
    return size
  }, [isMaskMode, maskViewport, size])

  const latestPositionRef = useRef(overlayPosition)
  const latestSizeRef = useRef(overlaySize)

  useEffect(() => {
    const viewport = computeMaskViewport()

    if (!viewport) {
      if (!isMaskMode) {
        setMaskViewport((prev) => (prev !== null ? null : prev))
      }
      return
    }

    setMaskViewport((prev) => {
      if (
        prev &&
        Math.abs(prev.position.x - viewport.position.x) < VIEWPORT_CHANGE_THRESHOLD &&
        Math.abs(prev.position.y - viewport.position.y) < VIEWPORT_CHANGE_THRESHOLD &&
        Math.abs(prev.size.width - viewport.size.width) < VIEWPORT_CHANGE_THRESHOLD &&
        Math.abs(prev.size.height - viewport.size.height) < VIEWPORT_CHANGE_THRESHOLD
      ) {
        return prev
      }
      return viewport
    })
  }, [
    computeMaskViewport,
    containerBounds.height,
    containerBounds.width,
    isMaskMode,
    videoAspectRatio
  ])

  useEffect(() => {
    if (!maskViewport) {
      return
    }

    if (isMaskMode && !previousMaskModeRef.current) {
      const relativePosition = toMaskRelativePosition(position, maskViewport)
      const relativeSize = toMaskRelativeSize(size, maskViewport)
      setPosition(relativePosition)
      setSize(relativeSize)
      previousMaskModeRef.current = true
      return
    }

    if (!isMaskMode && previousMaskModeRef.current) {
      const absolutePosition = fromMaskRelativePosition(position, maskViewport)
      const absoluteSize = fromMaskRelativeSize(size, maskViewport)
      setPosition(absolutePosition)
      setSize(absoluteSize)
      previousMaskModeRef.current = false
      return
    }

    previousMaskModeRef.current = isMaskMode
  }, [isMaskMode, maskViewport, position, setPosition, setSize, size])

  // === 复制成功toast监听器 ===
  useEffect(() => {
    const handleSubtitleCopied = (event: CustomEvent<{ message: string }>) => {
      const { message } = event.detail
      setToastMessage(message)
      setToastVisible(true)

      // 2秒后自动隐藏toast（防抖）
      if (hideToastTimerRef.current) {
        clearTimeout(hideToastTimerRef.current)
      }
      hideToastTimerRef.current = setTimeout(() => {
        setToastVisible(false)
        hideToastTimerRef.current = null
      }, 800)
    }

    window.addEventListener('subtitle-copied', handleSubtitleCopied as EventListener)

    return () => {
      if (hideToastTimerRef.current) {
        clearTimeout(hideToastTimerRef.current)
        hideToastTimerRef.current = null
      }
      window.removeEventListener('subtitle-copied', handleSubtitleCopied as EventListener)
    }
  }, [])

  useEffect(() => {
    latestPositionRef.current = overlayPosition
  }, [overlayPosition])

  useEffect(() => {
    latestSizeRef.current = overlaySize
  }, [overlaySize])

  // === 初始化和容器边界更新 ===
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
          // calculateOptimalPosition(newBounds)
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

  // === 智能冲突检测 ===
  useEffect(() => {
    // 检测可能的冲突区域（控制面板、进度条等）
    const detectConflictAreas = () => {
      const conflictSelectors = [
        '[data-testid="controller-panel"]',
        '[data-testid="transport-bar"]',
        '[aria-label="transport-bar"]',
        '.progress-section',
        '.controller-panel'
      ]

      const conflictAreas: Array<{ x: number; y: number; width: number; height: number }> = []
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
    }

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
  }, [containerRef, displayMode, avoidCollision])

  // === 拖拽功能（优化版本） ===
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (isResizing) return

      if (autoPositioning) {
        setOverlayConfig({ autoPositioning: false })
      }

      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件
      const startX = event.clientX
      const startY = event.clientY
      const startPosition = { x: overlayPosition.x, y: overlayPosition.y }

      startDragging()

      let animationId: number
      const suppressClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault()
        clickEvent.stopPropagation()
        document.removeEventListener('click', suppressClick, true)
      }
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
          const xMin = isMaskMode && maskViewport ? maskViewport.position.x : 0
          const xMax =
            isMaskMode && maskViewport
              ? Math.max(
                  maskViewport.position.x,
                  maskViewport.position.x +
                    maskViewport.size.width -
                    Math.max(MIN_SPAN_PERCENT, latestSizeRef.current.width)
                )
              : 100 - latestSizeRef.current.width
          const yMin = isMaskMode && maskViewport ? maskViewport.position.y : 0
          const yMax =
            isMaskMode && maskViewport
              ? Math.max(
                  maskViewport.position.y,
                  maskViewport.position.y +
                    maskViewport.size.height -
                    Math.max(MIN_SPAN_PERCENT, latestSizeRef.current.height)
                )
              : 100 - estimatedHeightPercent

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

          latestPositionRef.current = newPosition
          const positionForStore =
            isMaskMode && maskViewport
              ? toMaskRelativePosition(newPosition, maskViewport)
              : newPosition
          setPosition(positionForStore)
        })
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        stopDragging()
        logger.info('字幕覆盖层位置更新', { newPosition: overlayPosition })

        if (isMaskMode && !maskOnboardingComplete) {
          setMaskOnboardingComplete(true)
          setToastVisible(false)
        }

        const releasedOutside =
          !overlayRef.current ||
          !(upEvent.target instanceof Node && overlayRef.current.contains(upEvent.target))

        if (releasedOutside) {
          document.addEventListener('click', suppressClick, true)
          setTimeout(() => {
            document.removeEventListener('click', suppressClick, true)
          }, 0)
        }

        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
    },
    [
      overlayPosition,
      containerBounds,
      startDragging,
      stopDragging,
      setPosition,
      isResizing,
      isMaskMode,
      maskOnboardingComplete,
      setMaskOnboardingComplete,
      maskViewport,
      autoPositioning,
      setOverlayConfig
    ]
  )

  // === 调整尺寸功能（优化版本） ===
  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件

      if (autoPositioning) {
        setOverlayConfig({ autoPositioning: false })
      }

      const startX = event.clientX
      const startY = event.clientY
      const startSize = { width: overlaySize.width, height: overlaySize.height }

      startResizing()

      let animationId: number
      const suppressClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault()
        clickEvent.stopPropagation()
        document.removeEventListener('click', suppressClick, true)
      }
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 取消之前的动画帧
        if (animationId) {
          cancelAnimationFrame(animationId)
        }

        animationId = requestAnimationFrame(() => {
          const deltaX = moveEvent.clientX - startX
          const deltaY = moveEvent.clientY - startY

          const maskRight =
            maskViewport?.position.x !== undefined && maskViewport?.size.width !== undefined
              ? maskViewport.position.x + maskViewport.size.width
              : null
          const maskBottom =
            maskViewport?.position.y !== undefined && maskViewport?.size.height !== undefined
              ? maskViewport.position.y + maskViewport.size.height
              : null

          const widthLimit =
            isMaskMode && maskRight !== null
              ? Math.max(MIN_SPAN_PERCENT, maskRight - latestPositionRef.current.x)
              : MAX_OVERLAY_WIDTH_PERCENT
          const heightLimit =
            isMaskMode && maskBottom !== null
              ? Math.max(MIN_SPAN_PERCENT, maskBottom - latestPositionRef.current.y)
              : MAX_OVERLAY_WIDTH_PERCENT
          const maxHeightPercent = isMaskMode ? heightLimit : MAX_OVERLAY_HEIGHT_PERCENT_NORMAL_MODE

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
          latestSizeRef.current = newSize
          const sizeForStore =
            isMaskMode && maskViewport ? toMaskRelativeSize(newSize, maskViewport) : newSize
          setSize(sizeForStore)
        })
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        stopResizing()
        logger.info('字幕覆盖层尺寸更新', { newSize: overlaySize })

        if (isMaskMode && !maskOnboardingComplete) {
          setMaskOnboardingComplete(true)
          setToastVisible(false)
        }

        const releasedOutside =
          !overlayRef.current ||
          !(upEvent.target instanceof Node && overlayRef.current.contains(upEvent.target))

        if (releasedOutside) {
          document.addEventListener('click', suppressClick, true)
          setTimeout(() => {
            document.removeEventListener('click', suppressClick, true)
          }, 0)
        }

        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
    },
    [
      overlaySize,
      containerBounds,
      startResizing,
      stopResizing,
      setSize,
      isMaskMode,
      maskOnboardingComplete,
      setMaskOnboardingComplete,
      maskViewport,
      autoPositioning,
      setOverlayConfig
    ]
  )

  // === 悬停状态处理 ===
  const handleMouseEnter = useCallback(() => {
    setHovered(true)
  }, [setHovered])

  const handleMouseLeave = useCallback(() => {
    if (!isDragging && !isResizing) {
      setHovered(false)
    }
  }, [setHovered, isDragging, isResizing])

  // === 文本选中处理 ===
  const handleTextSelection = useCallback(
    (selectedText: string) => {
      setSelectedText(selectedText)
    },
    [setSelectedText]
  )

  // === 通用点击处理（阻止冒泡到VideoSurface） ===
  const handleClick = useCallback((event: React.MouseEvent) => {
    // 阻止所有点击事件冒泡到VideoSurface，防止触发播放/暂停
    event.stopPropagation()
  }, [])

  useEffect(() => {
    if (isMaskMode && !maskOnboardingComplete) {
      if (hideToastTimerRef.current) {
        clearTimeout(hideToastTimerRef.current)
        hideToastTimerRef.current = null
      }
      setToastMessage(t('player.controls.subtitle.mask-mode.onboarding'))
      setToastVisible(true)
    } else if (!isMaskMode && toastVisible) {
      setToastVisible(false)
    }
  }, [isMaskMode, maskOnboardingComplete, t, toastVisible])

  // === ResizeHandle 双击扩展处理 ===
  const handleResizeDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件

      const maxWidth =
        isMaskMode && maskViewport ? maskViewport.size.width : MAX_OVERLAY_WIDTH_PERCENT // 最大宽度95%

      const newSize = {
        ...overlaySize,
        width: maxWidth
      }

      const newPosition = {
        ...overlayPosition,
        x:
          isMaskMode && maskViewport
            ? maskViewport.position.x
            : Math.max(0, Math.min(100 - maxWidth, 50 - maxWidth / 2))
      }

      // 同时更新尺寸和位置
      const sizeForStore =
        isMaskMode && maskViewport ? toMaskRelativeSize(newSize, maskViewport) : newSize
      const positionForStore =
        isMaskMode && maskViewport ? toMaskRelativePosition(newPosition, maskViewport) : newPosition

      setSize(sizeForStore)
      setPosition(positionForStore)
      latestSizeRef.current = newSize
      latestPositionRef.current = newPosition

      logger.info('字幕覆盖层双击扩展', {
        newSize,
        newPosition,
        centerFirst: true,
        thenExpand: true
      })

      if (isMaskMode && !maskOnboardingComplete) {
        setMaskOnboardingComplete(true)
        setToastVisible(false)
      }
    },
    [
      overlaySize,
      overlayPosition,
      setSize,
      setPosition,
      isMaskMode,
      maskOnboardingComplete,
      setMaskOnboardingComplete,
      maskViewport
    ]
  )

  // === 条件渲染：配置未加载或隐藏模式不显示 ===
  const shouldRender = useMemo(
    () => displayMode !== SubtitleDisplayMode.NONE && integration.shouldShow,
    [displayMode, integration.shouldShow]
  )

  if (!shouldRender) {
    return null
  }

  const effectiveBackgroundType = isMaskMode ? SubtitleBackgroundType.BLUR : backgroundStyle.type

  return (
    <>
      <OverlayContainer
        ref={overlayRef}
        $position={overlayPosition}
        $size={overlaySize}
        $showBoundaries={showBoundaries}
        $isDragging={isDragging}
        $isResizing={isResizing}
        $isHovered={isHovered}
        $isMaskMode={isMaskMode}
        $backgroundType={effectiveBackgroundType}
        $opacity={backgroundStyle.opacity}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid="subtitle-overlay"
        aria-label="字幕覆盖层"
        tabIndex={0}
      >
        <ContentContainer
          $backgroundType={effectiveBackgroundType}
          $opacity={backgroundStyle.opacity}
        >
          <SubtitleContent
            displayMode={displayMode}
            originalText={integration.currentSubtitle?.originalText || ''}
            translatedText={integration.currentSubtitle?.translatedText}
            onTextSelection={handleTextSelection}
            containerHeight={containerBounds.height}
          />
        </ContentContainer>

        {/* 只在遮罩模式下显示调整大小句柄 */}
        {isMaskMode && (
          <Tooltip
            title={t('settings.playback.subtitle.overlay.resizeHandle.tooltip')}
            placement="top"
            mouseEnterDelay={0.5}
            mouseLeaveDelay={0}
          >
            <ResizeHandle
              $visible={isHovered || isDragging || isResizing}
              onMouseDown={handleResizeMouseDown}
              onDoubleClick={handleResizeDoubleClick}
              data-testid="subtitle-resize-handle"
            />
          </Tooltip>
        )}

        <ToastContainer $visible={toastVisible} role="status" aria-live="polite" aria-atomic="true">
          <ToastContent>{toastMessage}</ToastContent>
        </ToastContainer>
      </OverlayContainer>
    </>
  )
})

export default SubtitleOverlay

// === 样式组件 ===
const OverlayContainer = styled.section<{
  $position: { x: number; y: number }
  $size: { width: number; height: number }
  $showBoundaries: boolean
  $isDragging: boolean
  $isResizing: boolean
  $isHovered: boolean
  $isMaskMode: boolean
  $backgroundType: SubtitleBackgroundType
  $opacity: number
}>`
  /* 基础定位和尺寸 */
  position: absolute;
  /* 非遮罩模式下，使用水平居中定位，忽略 position.x */
  left: ${(props) => (props.$isMaskMode ? `${props.$position.x}%` : '50%')};
  transform: ${(props) => (props.$isMaskMode ? 'none' : 'translateX(-50%)')};
  top: ${(props) => props.$position.y}%;
  /* 非遮罩模式下宽度自适应内容 */
  width: ${(props) => (props.$isMaskMode ? `${props.$size.width}%` : 'auto')};
  max-width: ${(props) => (props.$isMaskMode ? 'none' : '95%')};
  height: ${(props) =>
    props.$isMaskMode ? `${Math.max(props.$size.height, MIN_SPAN_PERCENT)}%` : 'auto'};
  min-height: ${(props) => (props.$isMaskMode ? '0' : '60px')};
  max-height: ${(props) => (props.$isMaskMode ? 'none' : '160px')};

  /* 基础样式 */
  pointer-events: auto;
  user-select: none;
  border-radius: 8px;

  /* 交互状态样式 */
  cursor: ${(props) => {
    if (props.$isDragging) return 'grabbing'
    if (props.$isResizing) return 'nw-resize'
    // 非遮罩模式下使用 ns-resize（垂直拖动）光标
    return props.$isMaskMode ? 'grab' : 'ns-resize'
  }};

  /* 边界显示 */
  border: ${(props) =>
    props.$showBoundaries || props.$isHovered
      ? '2px dashed rgba(102, 126, 234, 0.6)'
      : '2px dashed transparent'};

  /* 拖拽状态特效 */
  ${(props) =>
    props.$isDragging &&
    css`
      transform: ${props.$isMaskMode ? 'rotate(1deg)' : 'translateX(-50%) rotate(1deg)'};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border-color: rgba(102, 126, 234, 0.8);
    `}

  /* 动画过渡 */
  transition: all 200ms ease-out;
`

const ContentContainer = styled.div<{
  $backgroundType: SubtitleBackgroundType
  $opacity: number
}>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  box-sizing: border-box;
  position: relative;
  overflow: visible;

  /* 背景样式 */
  ${(props) => {
    switch (props.$backgroundType) {
      case SubtitleBackgroundType.TRANSPARENT:
        return css`
          background: transparent;
          backdrop-filter: none;
        `
      case SubtitleBackgroundType.BLUR:
        return css`
          background: rgba(0, 0, 0, ${props.$opacity * 0.6});
          backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        `
      case SubtitleBackgroundType.SOLID_BLACK:
        return css`
          background: rgba(0, 0, 0, ${props.$opacity});
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        `
      case SubtitleBackgroundType.SOLID_GRAY:
        return css`
          background: rgba(128, 128, 128, ${props.$opacity});
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        `
      default:
        return css`
          background: transparent;
        `
    }
  }}

  /* 文本选中支持 */
  user-select: text;
  -webkit-user-select: text;
`

const ResizeHandle = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: rgba(102, 126, 234, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  cursor: nw-resize;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: all 200ms ease;

  &:hover {
    background: var(--color-primary);
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  }
`

const ToastContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  visibility: ${(props) => (props.$visible ? 'visible' : 'hidden')};
  transition: opacity ${ANIMATION_DURATION.SLOW} ${EASING.APPLE};
  z-index: ${Z_INDEX.MODAL};
  pointer-events: none;
`

const ToastContent = styled.div`
  background: rgba(0, 0, 0, ${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT});
  color: #ffffff;
  padding: ${SPACING.XS}px ${SPACING.MD}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  white-space: nowrap;
  backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.SUBTLE}px);
  border: 1px solid rgba(255, 255, 255, ${GLASS_EFFECT.BORDER_ALPHA.SUBTLE});
  box-shadow: ${SHADOWS.SM};
`
