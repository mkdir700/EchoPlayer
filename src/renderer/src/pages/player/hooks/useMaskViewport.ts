/**
 * useMaskViewport Hook
 *
 * 管理遮罩模式下的视口计算和坐标系转换：
 * - 视频宽高比检测
 * - 遮罩视口计算（基于视频内容区域）
 * - 容器和视频元素的解析
 * - 坐标系转换（遮罩相对 ↔ 绝对坐标）
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  clampPercent,
  hasViewportChangedSignificantly,
  type MaskLayout,
  MIN_SPAN_PERCENT,
  type Position,
  type Size
} from '../utils/coordinateTransform'

export interface UseMaskViewportOptions {
  containerRef?: React.RefObject<HTMLElement | null>
  isMaskMode: boolean
  containerBounds: { width: number; height: number }
  onModeChange?: (
    isMaskMode: boolean,
    position: Position,
    size: Size,
    maskViewport: MaskLayout | null,
    setPosition: (pos: Position) => void,
    setSize: (size: Size) => void
  ) => void
}

export interface UseMaskViewportReturn {
  maskViewport: MaskLayout | null
  overlayPosition: Position
  overlaySize: Size
  videoAspectRatio: number | null
}

export function useMaskViewport({
  containerRef,
  isMaskMode,
  containerBounds,
  onModeChange
}: UseMaskViewportOptions): UseMaskViewportReturn {
  // === 状态管理 ===
  const [maskViewport, setMaskViewport] = useState<MaskLayout | null>(null)
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)

  // === 引用管理 ===
  const previousMaskModeRef = useRef(isMaskMode)
  const containerElementRef = useRef<HTMLElement | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  // === 元素解析 ===
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

  // === 视频宽高比检测 ===
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

  // === 内容区域计算 ===
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

  // === 遮罩视口计算 ===
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

  // === 遮罩视口更新 ===
  useEffect(() => {
    const viewport = computeMaskViewport()

    if (!viewport) {
      if (!isMaskMode) {
        setMaskViewport((prev) => (prev !== null ? null : prev))
      }
      return
    }

    setMaskViewport((prev) => {
      if (!hasViewportChangedSignificantly(prev, viewport)) {
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

  // === 模式切换处理 ===
  useEffect(() => {
    if (!maskViewport || !onModeChange) {
      return
    }

    if (isMaskMode && !previousMaskModeRef.current) {
      previousMaskModeRef.current = true
      return
    }

    if (!isMaskMode && previousMaskModeRef.current) {
      previousMaskModeRef.current = false
      return
    }

    previousMaskModeRef.current = isMaskMode
  }, [isMaskMode, maskViewport, onModeChange])

  return {
    maskViewport,
    overlayPosition: { x: 0, y: 0 }, // 将在主组件中计算
    overlaySize: { width: 0, height: 0 }, // 将在主组件中计算
    videoAspectRatio
  }
}
