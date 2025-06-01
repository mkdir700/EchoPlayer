import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Typography, Button, Tooltip } from 'antd'
import type { SubtitleItem } from '@types_/shared'
import type { DisplayMode } from '@renderer/types'
import { WordCard } from '@renderer/components/WordCard/WordCard'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'

// 导入样式
import styles from './Subtitle.module.css'
import RendererLogger from '@renderer/utils/logger'

const { Text } = Typography

interface SubtitleV2Props {
  currentSubtitle: SubtitleItem | null
  isPlaying: boolean
  displayMode: DisplayMode
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

// 背景颜色类型
type BackgroundType = 'transparent' | 'blur' | 'solid-black' | 'solid-gray'

// 字幕边距状态接口 - 使用边距定位
interface SubtitleMarginsState {
  margins: {
    left: number // 左边距百分比 (0-80)
    top: number // 上边距百分比 (0-80)
    right: number // 右边距百分比 (0-80)
    bottom: number // 下边距百分比 (0-80)
  }
  backgroundType: BackgroundType
  isMaskMode: boolean // 遮罩模式状态
  // 定位框状态 - 相对于窗口的百分比和参考尺寸
  maskFrame: {
    left: number // 定位框左边距百分比（相对于播放器容器）
    top: number // 定位框上边距百分比（相对于播放器容器）
    width: number // 定位框宽度百分比（相对于播放器容器）
    height: number // 定位框高度百分比（相对于播放器容器）
  }
}

// 计算默认定位框尺寸的辅助函数 - 基于视频宽高比和播放器容器尺寸
const calculateDefaultMaskFrame = (
  displayAspectRatio: number,
  containerWidth: number,
  containerHeight: number
): {
  left: number
  top: number
  width: number
  height: number
} => {
  // 计算视频在播放器容器中的实际显示尺寸（object-fit: contain）
  const containerAspectRatio = containerWidth / containerHeight

  let videoDisplayWidth: number, videoDisplayHeight: number, videoLeft: number, videoTop: number

  if (displayAspectRatio > containerAspectRatio) {
    // 视频比容器更宽，以容器宽度为准进行缩放
    videoDisplayWidth = containerWidth
    videoDisplayHeight = containerWidth / displayAspectRatio
    videoLeft = 0 // 占满宽度
    videoTop = (containerHeight - videoDisplayHeight) / 2 // 垂直居中
  } else {
    // 视频比容器更高（或相等），以容器高度为准进行缩放
    videoDisplayHeight = containerHeight
    videoDisplayWidth = containerHeight * displayAspectRatio
    videoTop = 0 // 占满高度
    videoLeft = (containerWidth - videoDisplayWidth) / 2 // 水平居中
  }

  // 转换为相对于容器的百分比
  const videoLeftPercent = (videoLeft / containerWidth) * 100
  const videoTopPercent = (videoTop / containerHeight) * 100
  const videoWidthPercent = (videoDisplayWidth / containerWidth) * 100
  const videoHeightPercent = (videoDisplayHeight / containerHeight) * 100

  console.log('📐 定位框计算详情:', {
    containerSize: `${containerWidth}×${containerHeight}`,
    containerAspectRatio: containerAspectRatio.toFixed(3),
    videoAspectRatio: displayAspectRatio.toFixed(3),
    videoDisplaySize: `${videoDisplayWidth.toFixed(1)}×${videoDisplayHeight.toFixed(1)}`,
    videoPosition: `${videoLeft.toFixed(1)}, ${videoTop.toFixed(1)}`,
    percentages: {
      left: videoLeftPercent.toFixed(1) + '%',
      top: videoTopPercent.toFixed(1) + '%',
      width: videoWidthPercent.toFixed(1) + '%',
      height: videoHeightPercent.toFixed(1) + '%'
    }
  })

  // 定位框默认覆盖视频显示区域
  return {
    left: Math.max(0, Math.min(100, videoLeftPercent)),
    top: Math.max(0, Math.min(100, videoTopPercent)),
    width: Math.max(10, Math.min(100, videoWidthPercent)),
    height: Math.max(10, Math.min(100, videoHeightPercent))
  }
}

// 创建默认状态的函数 - 可选择是否使用动态定位框
const createDefaultSubtitleState = (dynamicMaskFrame?: {
  left: number
  top: number
  width: number
  height: number
  referenceWindowSize: { width: number; height: number }
}): SubtitleMarginsState => ({
  margins: {
    left: 20, // 左边距20%
    top: 75, // 上边距75%
    right: 20, // 右边距20%
    bottom: 5 // 下边距5%
  }, // 结果：宽度60%，高度20%，位置在底部中央
  backgroundType: 'transparent',
  isMaskMode: false, // 默认关闭遮罩模式
  // 定位框：使用动态计算或固定默认值
  maskFrame: dynamicMaskFrame || {
    left: 0, // 左边距0%
    top: 25, // 上边距25%
    width: 100, // 宽度100%
    height: 50 // 高度50%
  }
})

// 默认状态 - 使用固定值作为后备
const DEFAULT_SUBTITLE_STATE: SubtitleMarginsState = createDefaultSubtitleState()

// 背景类型配置
const BACKGROUND_TYPES: Array<{ type: BackgroundType; label: string; icon: string }> = [
  { type: 'transparent', label: '完全透明', icon: '○' },
  { type: 'blur', label: '模糊背景', icon: '◐' },
  { type: 'solid-black', label: '黑色背景', icon: '●' },
  { type: 'solid-gray', label: '灰色背景', icon: '◉' }
]

// 本地存储键名
const SUBTITLE_STATE_KEY = 'echolab_subtitle_state_v2'

// 边距限制常量
const MARGIN_LIMITS = {
  MIN_TOTAL_WIDTH: 20, // 最小宽度20%
  MIN_TOTAL_HEIGHT: 10, // 最小高度10%
  MAX_SINGLE_MARGIN: 80 // 单个边距最大80%
}

export function SubtitleV2({
  currentSubtitle,
  isPlaying,
  displayMode,
  onWordHover,
  onPauseOnHover
}: SubtitleV2Props): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleV2',
    props: {
      currentSubtitle,
      isPlaying,
      displayMode,
      onWordHover,
      onPauseOnHover
    }
  })

  // 获取视频上下文以访问显示宽高比
  const { displayAspectRatio } = usePlayingVideoContext()

  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)

  // 字幕状态管理
  const [subtitleState, setSubtitleState] = useState<SubtitleMarginsState>(() => {
    try {
      const saved = localStorage.getItem(SUBTITLE_STATE_KEY)
      if (saved) {
        const parsedState = JSON.parse(saved)

        // 验证边距配置的有效性
        const isValidMargins =
          parsedState.margins &&
          typeof parsedState.margins.left === 'number' &&
          typeof parsedState.margins.top === 'number' &&
          typeof parsedState.margins.right === 'number' &&
          typeof parsedState.margins.bottom === 'number' &&
          parsedState.margins.left >= 0 &&
          parsedState.margins.top >= 0 &&
          parsedState.margins.right >= 0 &&
          parsedState.margins.bottom >= 0 &&
          parsedState.margins.left <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          parsedState.margins.top <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          parsedState.margins.right <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          parsedState.margins.bottom <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          100 - parsedState.margins.left - parsedState.margins.right >=
            MARGIN_LIMITS.MIN_TOTAL_WIDTH &&
          100 - parsedState.margins.top - parsedState.margins.bottom >=
            MARGIN_LIMITS.MIN_TOTAL_HEIGHT

        const isValidBackgroundType =
          parsedState.backgroundType &&
          ['transparent', 'blur', 'solid-black', 'solid-gray'].includes(parsedState.backgroundType)

        const isValidMaskMode = typeof parsedState.isMaskMode === 'boolean'

        const isValidMaskFrame =
          parsedState.maskFrame &&
          typeof parsedState.maskFrame.left === 'number' &&
          typeof parsedState.maskFrame.top === 'number' &&
          typeof parsedState.maskFrame.width === 'number' &&
          typeof parsedState.maskFrame.height === 'number' &&
          parsedState.maskFrame.left >= 0 &&
          parsedState.maskFrame.top >= 0 &&
          parsedState.maskFrame.width > 0 &&
          parsedState.maskFrame.height > 0 &&
          parsedState.maskFrame.left + parsedState.maskFrame.width <= 100 &&
          parsedState.maskFrame.top + parsedState.maskFrame.height <= 100

        // 如果配置无效，使用默认配置并清理无效数据
        if (!isValidMargins || !isValidBackgroundType) {
          console.warn('🔧 检测到无效的字幕配置，已重置为默认配置')
          localStorage.removeItem(SUBTITLE_STATE_KEY)
          return DEFAULT_SUBTITLE_STATE
        }

        // 处理定位框数据，确保包含referenceWindowSize
        let maskFrame = isValidMaskFrame ? parsedState.maskFrame : DEFAULT_SUBTITLE_STATE.maskFrame

        // 如果是旧版数据，没有referenceWindowSize，则添加当前窗口尺寸作为参考
        if (maskFrame && (!maskFrame.referenceWindowSize || !maskFrame.referenceWindowSize.width)) {
          console.log('🔧 升级旧版定位框数据，添加窗口参考尺寸...')
          maskFrame = {
            ...maskFrame
          }
        }

        return {
          ...DEFAULT_SUBTITLE_STATE,
          ...parsedState,
          isMaskMode: isValidMaskMode ? parsedState.isMaskMode : false,
          maskFrame: maskFrame
        }
      }
      return DEFAULT_SUBTITLE_STATE
    } catch (error) {
      console.warn('🔧 解析字幕配置失败，已重置为默认配置:', error)
      localStorage.removeItem(SUBTITLE_STATE_KEY)
      return DEFAULT_SUBTITLE_STATE
    }
  })

  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isControlsHovering, setIsControlsHovering] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStartState, setResizeStartState] = useState<{
    margins: SubtitleMarginsState['margins']
    mouseX: number
    mouseY: number
    resizeDirection: 'se' | 'sw' | 'ne' | 'nw' // 调整大小的方向
  } | null>(null)

  // 定位框相关状态
  const [isMaskFrameHovering, setIsMaskFrameHovering] = useState(false)
  const [isMaskFrameDragging, setIsMaskFrameDragging] = useState(false)
  const [isMaskFrameResizing, setIsMaskFrameResizing] = useState(false)
  const [maskFrameDragOffset, setMaskFrameDragOffset] = useState({ x: 0, y: 0 })
  const [maskFrameResizeStartState, setMaskFrameResizeStartState] = useState<{
    maskFrame: SubtitleMarginsState['maskFrame']
    mouseX: number
    mouseY: number
    resizeDirection: 'se' | 'sw' | 'ne' | 'nw'
  } | null>(null)

  // 引用
  const containerRef = useRef<HTMLDivElement>(null)

  // 动态计算默认定位框的函数
  const getDefaultMaskFrame = useCallback(() => {
    const parent = containerRef.current?.parentElement
    if (!parent) {
      console.log('🔧 没有父容器，使用固定的默认值')
      // 如果没有父容器，使用固定的默认值
      return {
        left: 0,
        top: 25,
        width: 100,
        height: 50
      }
    }

    // 使用实际的播放器容器尺寸和视频宽高比计算
    const result = calculateDefaultMaskFrame(
      displayAspectRatio,
      parent.clientWidth,
      parent.clientHeight
    )
    console.log('🔧 动态计算的默认定位框:', result)
    return result
  }, [displayAspectRatio])

  // 基于窗口等比缩放计算定位框的实际位置和尺寸
  const getScaledMaskFrame = useCallback(() => {
    if (!subtitleState.isMaskMode) {
      return subtitleState.maskFrame
    }

    // 获取播放器容器尺寸
    const parent = containerRef.current?.parentElement
    if (!parent) return subtitleState.maskFrame

    // 计算窗口缩放比例
    const scaleX = parent.clientWidth / subtitleState.maskFrame.width
    const scaleY = parent.clientHeight / subtitleState.maskFrame.height

    // 使用较小的缩放比例，保持等比缩放
    const scale = Math.min(scaleX, scaleY)

    // 计算缩放后的定位框尺寸（相对于播放器容器的百分比）
    let scaledWidth = subtitleState.maskFrame.width * scale
    let scaledHeight = subtitleState.maskFrame.height * scale

    // 确保缩放后不超出边界
    scaledWidth = Math.min(100, Math.max(10, scaledWidth))
    scaledHeight = Math.min(100, Math.max(10, scaledHeight))

    // 计算缩放后的位置，保持相对位置
    let scaledLeft = subtitleState.maskFrame.left * scale
    let scaledTop = subtitleState.maskFrame.top * scale

    // 确保位置不超出边界
    scaledLeft = Math.min(100 - scaledWidth, Math.max(0, scaledLeft))
    scaledTop = Math.min(100 - scaledHeight, Math.max(0, scaledTop))

    return {
      left: scaledLeft,
      top: scaledTop,
      width: scaledWidth,
      height: scaledHeight
    }
  }, [subtitleState.isMaskMode, subtitleState.maskFrame])

  // 获取父容器尺寸 - 根据遮罩模式选择不同的计算方式
  const getParentBounds = useCallback(() => {
    const parent = containerRef.current?.parentElement
    if (!parent) return { width: 0, height: 0 }

    // if (subtitleState.isMaskMode) {
    //   // 遮罩模式下，使用缩放后的定位框实际尺寸作为参考
    //   const scaledFrame = getScaledMaskFrame()
    //   return {
    //     width: parent.clientWidth * (scaledFrame.width / 100), // 缩放后定位框的实际宽度
    //     height: parent.clientHeight * (scaledFrame.height / 100) // 缩放后定位框的实际高度
    //   }
    // } else {
    //   // 普通模式下，使用整个播放器容器
    return {
      width: parent.clientWidth,
      height: parent.clientHeight
    }
    // }
  }, [])

  // 计算当前字幕区域的尺寸和位置（百分比）
  const currentLayout = useMemo(() => {
    const { left, top, right, bottom } = subtitleState.margins
    return {
      left: left,
      top: top,
      width: 100 - left - right,
      height: 100 - top - bottom
    }
  }, [subtitleState.margins])

  // 保存状态到本地存储
  const saveSubtitleState = useCallback((state: SubtitleMarginsState) => {
    try {
      localStorage.setItem(SUBTITLE_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('无法保存字幕状态:', error)
    }
  }, [])

  // 切换背景类型
  const toggleBackgroundType = useCallback(() => {
    setSubtitleState((prev) => {
      const currentIndex = BACKGROUND_TYPES.findIndex((bg) => bg.type === prev.backgroundType)
      const nextIndex = (currentIndex + 1) % BACKGROUND_TYPES.length
      const newState = {
        ...prev,
        backgroundType: BACKGROUND_TYPES[nextIndex].type
      }
      saveSubtitleState(newState)
      return newState
    })
  }, [saveSubtitleState])

  // 切换遮罩模式
  const toggleMaskMode = useCallback(() => {
    setSubtitleState((prev) => {
      const newState = {
        ...prev,
        isMaskMode: !prev.isMaskMode
      }
      saveSubtitleState(newState)
      return newState
    })
  }, [saveSubtitleState])

  // 定位框拖拽开始
  const handleMaskFrameMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // 只响应左键

      e.preventDefault()
      e.stopPropagation()

      const parentBounds = getParentBounds()
      const parent = containerRef.current?.parentElement

      if (!parent || !parentBounds.width || !parentBounds.height) return

      const parentRect = parent.getBoundingClientRect()
      const maskFrameRect = {
        left: parent.clientWidth * (subtitleState.maskFrame.left / 100),
        top: parent.clientHeight * (subtitleState.maskFrame.top / 100)
      }

      // 计算鼠标相对于定位框左上角的偏移量
      setMaskFrameDragOffset({
        x: e.clientX - parentRect.left - maskFrameRect.left,
        y: e.clientY - parentRect.top - maskFrameRect.top
      })

      setIsMaskFrameDragging(true)
    },
    [getParentBounds, subtitleState.maskFrame]
  )

  // 定位框调整大小开始
  const handleMaskFrameResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
      if (e.button !== 0) return // 只响应左键

      e.preventDefault()
      e.stopPropagation()

      setMaskFrameResizeStartState({
        maskFrame: { ...subtitleState.maskFrame },
        mouseX: e.clientX,
        mouseY: e.clientY,
        resizeDirection: direction
      })

      setIsMaskFrameResizing(true)
    },
    [subtitleState.maskFrame]
  )

  // 重置字幕位置和大小到默认值
  const resetSubtitleState = useCallback(() => {
    // 使用基于视频宽高比的动态默认定位框
    const defaultMaskFrame = getDefaultMaskFrame()

    // 确保重置到干净的默认状态
    const cleanState = {
      margins: {
        left: 20,
        top: 75,
        right: 20,
        bottom: 5
      },
      backgroundType: 'transparent' as BackgroundType,
      isMaskMode: false,
      maskFrame: defaultMaskFrame
    }
    setSubtitleState(cleanState)
    saveSubtitleState(cleanState)

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 重置字幕状态到:', cleanState)
      console.log('📐 动态计算的默认定位框:', defaultMaskFrame)
      console.log('📐 视频宽高比:', displayAspectRatio)
    }
  }, [saveSubtitleState, getDefaultMaskFrame, displayAspectRatio])

  // 获取当前背景类型配置
  const currentBackgroundConfig = useMemo(() => {
    return (
      BACKGROUND_TYPES.find((bg) => bg.type === subtitleState.backgroundType) || BACKGROUND_TYPES[0]
    )
  }, [subtitleState.backgroundType])

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

  // 验证并修正边距值
  const validateMargins = useCallback(
    (margins: SubtitleMarginsState['margins']): SubtitleMarginsState['margins'] => {
      let { left, top, right, bottom } = margins

      // 首先确保所有边距都不为负数，并进行精度舍入
      left = Math.max(0, Math.round(left * 1000) / 1000) // 保留3位小数精度
      top = Math.max(0, Math.round(top * 1000) / 1000)
      right = Math.max(0, Math.round(right * 1000) / 1000)
      bottom = Math.max(0, Math.round(bottom * 1000) / 1000)

      // 计算当前的总宽度和高度
      let totalWidth = 100 - left - right
      let totalHeight = 100 - top - bottom

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
          // 如果当前边距为0，平均分配
          left = Math.round((targetTotalMargin / 2) * 1000) / 1000
          right = Math.round((targetTotalMargin / 2) * 1000) / 1000
        }
        totalWidth = requiredSpace
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
          // 如果当前边距为0，平均分配
          top = Math.round((targetTotalMargin / 2) * 1000) / 1000
          bottom = Math.round((targetTotalMargin / 2) * 1000) / 1000
        }
        totalHeight = requiredSpace
      }

      // 最后确保单个边距不超过最大限制，并再次进行精度舍入
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
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // 只响应左键

      // 检查点击的目标是否是可点击的单词或其子元素
      const target = e.target as HTMLElement
      const isClickableWord = target.closest(`.${styles.clickableWord}`) !== null

      // 如果点击的是可点击的单词，不启动拖拽
      if (isClickableWord) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const containerRect = containerRef.current?.getBoundingClientRect()
      const parentBounds = getParentBounds()

      if (!containerRect || !parentBounds.width || !parentBounds.height) return

      // 计算鼠标相对于字幕容器左上角的偏移量
      setDragOffset({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      })

      setIsDragging(true)
    },
    [getParentBounds]
  )

  // 开始调整大小
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
      if (e.button !== 0) return // 只响应左键

      e.preventDefault()
      e.stopPropagation()

      const parentBounds = getParentBounds()

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 开始调整大小:', {
          direction,
          currentMargins: subtitleState.margins,
          currentLayout,
          parentBounds,
          mousePos: { x: e.clientX, y: e.clientY }
        })
      }

      setResizeStartState({
        margins: { ...subtitleState.margins },
        mouseX: e.clientX,
        mouseY: e.clientY,
        resizeDirection: direction
      })

      setIsResizing(true)
    },
    [subtitleState.margins, currentLayout, getParentBounds]
  )

  // 拖拽过程中
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isMaskFrameDragging) {
        // 定位框拖拽逻辑
        const parent = containerRef.current?.parentElement
        if (!parent) return

        const parentRect = parent.getBoundingClientRect()

        // 计算新的定位框位置（百分比）
        const newLeftPx = e.clientX - maskFrameDragOffset.x - parentRect.left
        const newTopPx = e.clientY - maskFrameDragOffset.y - parentRect.top

        const newLeftPercent = Math.max(
          0,
          Math.min(100 - subtitleState.maskFrame.width, (newLeftPx / parent.clientWidth) * 100)
        )
        const newTopPercent = Math.max(
          0,
          Math.min(100 - subtitleState.maskFrame.height, (newTopPx / parent.clientHeight) * 100)
        )

        setSubtitleState((prev) => ({
          ...prev,
          maskFrame: validateMaskFrame({
            ...prev.maskFrame,
            left: newLeftPercent,
            top: newTopPercent
          })
        }))
      } else if (isMaskFrameResizing && maskFrameResizeStartState) {
        // 定位框调整大小逻辑
        const deltaX = e.clientX - maskFrameResizeStartState.mouseX
        const deltaY = e.clientY - maskFrameResizeStartState.mouseY
        const parent = containerRef.current?.parentElement

        if (!parent) return

        const deltaXPercent = (deltaX / parent.clientWidth) * 100
        const deltaYPercent = (deltaY / parent.clientHeight) * 100

        const newMaskFrame = { ...maskFrameResizeStartState.maskFrame }

        // 根据拖拽方向调整定位框大小
        switch (maskFrameResizeStartState.resizeDirection) {
          case 'se': {
            // 右下角 - 增加宽度和高度
            newMaskFrame.width = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.left,
                maskFrameResizeStartState.maskFrame.width + deltaXPercent
              )
            )
            newMaskFrame.height = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.top,
                maskFrameResizeStartState.maskFrame.height + deltaYPercent
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
                maskFrameResizeStartState.maskFrame.left + deltaXPercent
              )
            )
            newMaskFrame.width =
              maskFrameResizeStartState.maskFrame.width +
              (maskFrameResizeStartState.maskFrame.left - newLeftSW)
            newMaskFrame.left = newLeftSW
            newMaskFrame.height = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.top,
                maskFrameResizeStartState.maskFrame.height + deltaYPercent
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
                maskFrameResizeStartState.maskFrame.top + deltaYPercent
              )
            )
            newMaskFrame.height =
              maskFrameResizeStartState.maskFrame.height +
              (maskFrameResizeStartState.maskFrame.top - newTopNE)
            newMaskFrame.top = newTopNE
            newMaskFrame.width = Math.max(
              10,
              Math.min(
                100 - newMaskFrame.left,
                maskFrameResizeStartState.maskFrame.width + deltaXPercent
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
                maskFrameResizeStartState.maskFrame.left + deltaXPercent
              )
            )
            const newTopNW = Math.max(
              0,
              Math.min(
                newMaskFrame.top + newMaskFrame.height - 10,
                maskFrameResizeStartState.maskFrame.top + deltaYPercent
              )
            )
            newMaskFrame.width =
              maskFrameResizeStartState.maskFrame.width +
              (maskFrameResizeStartState.maskFrame.left - newLeftNW)
            newMaskFrame.height =
              maskFrameResizeStartState.maskFrame.height +
              (maskFrameResizeStartState.maskFrame.top - newTopNW)
            newMaskFrame.left = newLeftNW
            newMaskFrame.top = newTopNW
            break
          }
        }

        setSubtitleState((prev) => ({
          ...prev,
          maskFrame: validateMaskFrame(newMaskFrame)
        }))
      } else if (isDragging) {
        const parentBounds = getParentBounds()
        const parent = containerRef.current?.parentElement

        if (!parent || !parentBounds.width || !parentBounds.height) return

        const parentRect = parent.getBoundingClientRect()

        // 计算新的左上角位置（百分比）
        const newLeftPx = e.clientX - dragOffset.x - parentRect.left
        const newTopPx = e.clientY - dragOffset.y - parentRect.top

        let newLeftPercent: number
        let newTopPercent: number

        if (subtitleState.isMaskMode) {
          // 遮罩模式下，相对于定位框计算
          const maskFrameLeft = parent.clientWidth * (subtitleState.maskFrame.left / 100) // 定位框左边位置
          const maskFrameTop = parent.clientHeight * (subtitleState.maskFrame.top / 100) // 定位框顶部位置
          const maskFrameWidth = parent.clientWidth * (subtitleState.maskFrame.width / 100) // 定位框宽度
          const maskFrameHeight = parent.clientHeight * (subtitleState.maskFrame.height / 100) // 定位框高度

          // 调整相对于定位框的位置
          const relativeLeftPx = newLeftPx - maskFrameLeft
          const relativeTopPx = newTopPx - maskFrameTop

          newLeftPercent = Math.round((relativeLeftPx / maskFrameWidth) * 100 * 1000) / 1000
          newTopPercent = Math.round((relativeTopPx / maskFrameHeight) * 100 * 1000) / 1000
        } else {
          // 普通模式下，相对于整个播放器容器
          newLeftPercent = Math.round((newLeftPx / parentBounds.width) * 100 * 1000) / 1000
          newTopPercent = Math.round((newTopPx / parentBounds.height) * 100 * 1000) / 1000
        }

        // 计算新的边距值
        const currentWidth = currentLayout.width
        const currentHeight = currentLayout.height

        const newMargins = validateMargins({
          left: newLeftPercent,
          top: newTopPercent,
          right: 100 - newLeftPercent - currentWidth,
          bottom: 100 - newTopPercent - currentHeight
        })

        setSubtitleState((prev) => ({
          ...prev,
          margins: newMargins
        }))
      } else if (isResizing && resizeStartState) {
        // 调整大小逻辑 - 修复比例计算问题
        const deltaX = e.clientX - resizeStartState.mouseX
        const deltaY = e.clientY - resizeStartState.mouseY
        const parentBounds = getParentBounds()

        if (!parentBounds.width || !parentBounds.height) return

        // 计算实际的拖拽距离占容器的百分比
        const deltaXPercent = (deltaX / parentBounds.width) * 100
        const deltaYPercent = (deltaY / parentBounds.height) * 100

        // 从原始边距开始计算，确保比例正确
        let newMargins = { ...resizeStartState.margins }

        // 根据拖拽方向调整相应的边距
        switch (resizeStartState.resizeDirection) {
          case 'se': // 右下角 - 向右下拖拽减少右边距和下边距
            newMargins.right = resizeStartState.margins.right - deltaXPercent
            newMargins.bottom = resizeStartState.margins.bottom - deltaYPercent
            break
          case 'sw': // 左下角 - 向左下拖拽增加左边距，减少下边距
            newMargins.left = resizeStartState.margins.left + deltaXPercent
            newMargins.bottom = resizeStartState.margins.bottom - deltaYPercent
            break
          case 'ne': // 右上角 - 向右上拖拽减少右边距，增加上边距
            newMargins.right = resizeStartState.margins.right - deltaXPercent
            newMargins.top = resizeStartState.margins.top + deltaYPercent
            break
          case 'nw': // 左上角 - 向左上拖拽增加左边距和上边距
            newMargins.left = resizeStartState.margins.left + deltaXPercent
            newMargins.top = resizeStartState.margins.top + deltaYPercent
            break
        }

        // 验证并修正边距值，确保在有效范围内
        newMargins = validateMargins(newMargins)

        setSubtitleState((prev) => ({
          ...prev,
          margins: newMargins
        }))
      }
    },
    [
      isMaskFrameDragging,
      isMaskFrameResizing,
      maskFrameResizeStartState,
      isDragging,
      isResizing,
      resizeStartState,
      maskFrameDragOffset.x,
      maskFrameDragOffset.y,
      subtitleState.maskFrame.width,
      subtitleState.maskFrame.height,
      subtitleState.maskFrame.left,
      subtitleState.maskFrame.top,
      subtitleState.isMaskMode,
      validateMaskFrame,
      getParentBounds,
      dragOffset.x,
      dragOffset.y,
      currentLayout.width,
      currentLayout.height,
      validateMargins
    ]
  )

  // 结束拖拽或调整大小
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false)
      setIsResizing(false)
      setResizeStartState(null)
      // 保存最终状态
      setSubtitleState((prev) => {
        saveSubtitleState(prev)
        return prev
      })
    }
    if (isMaskFrameDragging || isMaskFrameResizing) {
      setIsMaskFrameDragging(false)
      setIsMaskFrameResizing(false)
      setMaskFrameResizeStartState(null)
      // 保存最终状态
      setSubtitleState((prev) => {
        saveSubtitleState(prev)
        return prev
      })
    }
  }, [isDragging, isResizing, isMaskFrameDragging, isMaskFrameResizing, saveSubtitleState])

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging || isResizing || isMaskFrameDragging || isMaskFrameResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [
    isDragging,
    isResizing,
    isMaskFrameDragging,
    isMaskFrameResizing,
    handleMouseMove,
    handleMouseUp
  ])

  // 在组件挂载时，如果定位框是默认状态，使用基于视频宽高比的计算进行更新
  useEffect(() => {
    // 检查当前定位框是否是初始的固定默认值
    const isDefaultMaskFrame =
      subtitleState.maskFrame.left === 0 &&
      subtitleState.maskFrame.top === 25 &&
      subtitleState.maskFrame.width === 100 &&
      subtitleState.maskFrame.height === 50

    if (isDefaultMaskFrame && displayAspectRatio !== 16 / 9) {
      // 只有当宽高比不是默认的16:9时才进行更新
      const dynamicMaskFrame = getDefaultMaskFrame()

      console.log('🔧 检测到视频宽高比变化，更新默认定位框...')
      console.log('📐 视频宽高比:', displayAspectRatio)
      console.log('📐 新的定位框:', dynamicMaskFrame)

      setSubtitleState((prev) => {
        const newState = {
          ...prev,
          maskFrame: dynamicMaskFrame
        }
        saveSubtitleState(newState)
        return newState
      })
    }
  }, [displayAspectRatio, getDefaultMaskFrame, saveSubtitleState, subtitleState.maskFrame])

  // 监听窗口大小变化，实现定位框的等比缩放
  useEffect(() => {
    const handleWindowResize = (): void => {
      if (subtitleState.isMaskMode) {
        // 基于窗口尺寸计算新的定位框位置和大小
        const scaledMaskFrame = getScaledMaskFrame()

        // 如果缩放后的位置或尺寸有显著变化，更新状态
        const threshold = 0.1 // 变化阈值，避免频繁更新
        const hasSignificantChange =
          Math.abs(scaledMaskFrame.left - subtitleState.maskFrame.left) > threshold ||
          Math.abs(scaledMaskFrame.top - subtitleState.maskFrame.top) > threshold ||
          Math.abs(scaledMaskFrame.width - subtitleState.maskFrame.width) > threshold ||
          Math.abs(scaledMaskFrame.height - subtitleState.maskFrame.height) > threshold

        if (hasSignificantChange) {
          console.log('🔧 窗口等比缩放，更新定位框尺寸...')

          setSubtitleState((prev) => {
            const newState = {
              ...prev,
              maskFrame: {
                ...scaledMaskFrame
              }
            }
            saveSubtitleState(newState)
            return newState
          })
        }
      }

      if (process.env.NODE_ENV === 'development') {
        const parentBounds = getParentBounds()
        const scaledFrame = getScaledMaskFrame()
        console.log('🪟 窗口大小变化:', {
          windowSize: `${window.innerWidth}×${window.innerHeight}`,
          parentSize: `${parentBounds.width}×${parentBounds.height}`,
          maskFrame: subtitleState.isMaskMode
            ? {
                original: `${subtitleState.maskFrame.left.toFixed(1)}%, ${subtitleState.maskFrame.top.toFixed(1)}%, ${subtitleState.maskFrame.width.toFixed(1)}% × ${subtitleState.maskFrame.height.toFixed(1)}%`,
                scaled: `${scaledFrame.left.toFixed(1)}%, ${scaledFrame.top.toFixed(1)}%, ${scaledFrame.width.toFixed(1)}% × ${scaledFrame.height.toFixed(1)}%`
              }
            : 'disabled',
          margins: {
            left: `${subtitleState.margins.left.toFixed(1)}%`,
            top: `${subtitleState.margins.top.toFixed(1)}%`,
            right: `${subtitleState.margins.right.toFixed(1)}%`,
            bottom: `${subtitleState.margins.bottom.toFixed(1)}%`
          }
        })
      }
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [
    getParentBounds,
    getScaledMaskFrame,
    subtitleState.margins,
    subtitleState.maskFrame,
    subtitleState.isMaskMode,
    saveSubtitleState
  ])

  // 处理单词hover事件
  const handleWordHover = useCallback(
    (isHovering: boolean) => {
      onWordHover(isHovering)
      if (isHovering && isPlaying) {
        console.log('触发暂停视频')
        onPauseOnHover()
      }
    },
    [onWordHover, onPauseOnHover, isPlaying]
  )

  // 处理单词点击事件
  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    // 阻止事件冒泡
    event.stopPropagation()
    event.preventDefault()

    // 过滤掉空白字符
    const trimmedWord = word.trim()
    if (trimmedWord === '') {
      return
    }

    // 保存单词元素的引用，用于动态计算位置
    const wordElement = event.target as HTMLElement

    setSelectedWord({
      word: trimmedWord,
      element: wordElement
    })
  }, [])

  // 关闭单词卡片
  const handleCloseWordCard = useCallback(() => {
    setSelectedWord(null)
  }, [])

  // 检测文本是否主要包含中文字符
  const isChinese = useCallback((text: string): boolean => {
    const chineseRegex = /[\u4e00-\u9fff]/g
    const chineseMatches = text.match(chineseRegex)
    const chineseCount = chineseMatches ? chineseMatches.length : 0
    const totalChars = text.replace(/\s/g, '').length
    return totalChars > 0 && chineseCount / totalChars > 0.5
  }, [])

  // 将中文文本分割成字符
  const splitChineseText = useCallback(
    (text: string) => {
      // 将中文文本按字符分割，每个字符都可以点击
      return text.split('').map((char, index) => {
        const isClickableChar = char.trim() !== '' && /[\u4e00-\u9fff]/.test(char)

        return (
          <span
            key={index}
            className={`${styles.subtitleWord} ${isClickableChar ? styles.clickableWord : ''}`}
            onMouseEnter={() => handleWordHover(true)}
            onMouseLeave={() => handleWordHover(false)}
            onClick={isClickableChar ? (e) => handleWordClick(char, e) : undefined}
            style={{ cursor: isClickableChar ? 'pointer' : 'default' }}
          >
            {char}
          </span>
        )
      })
    },
    [handleWordHover, handleWordClick]
  )

  // 将英文文本分割成单词
  const splitEnglishText = useCallback(
    (text: string) => {
      const words = text.split(/(\s+)/).map((word, index) => {
        if (word.trim() === '') {
          return <span key={index}>{word}</span>
        }

        // 一个单词的首尾不应该有特殊符号
        const trimWord = word.replace(/^[^\w\s]+|[^\w\s]+$/g, '')

        const isClickableWord = trimWord.trim() !== ''

        return (
          <span
            key={index}
            className={`${styles.subtitleWord} ${isClickableWord ? styles.clickableWord : ''}`}
            onMouseEnter={() => handleWordHover(true)}
            onMouseLeave={() => handleWordHover(false)}
            onClick={isClickableWord ? (e) => handleWordClick(trimWord, e) : undefined}
            style={{ cursor: isClickableWord ? 'pointer' : 'default' }}
          >
            {word}
          </span>
        )
      })

      return words
    },
    [handleWordHover, handleWordClick]
  )

  // 智能分割文本（根据语言类型选择分割方式）
  const splitTextIntoWords = useCallback(
    (text: string) => {
      if (isChinese(text)) {
        return splitChineseText(text)
      } else {
        return splitEnglishText(text)
      }
    },
    [isChinese, splitChineseText, splitEnglishText]
  )

  // 计算动态字体大小 - 基于容器尺寸和屏幕尺寸等比缩放
  const getDynamicFontSize = useCallback(() => {
    // 获取屏幕宽度，用于响应式调整
    const screenWidth = window.innerWidth

    // 根据屏幕宽度调整基础字体大小
    let baseSize: number
    if (screenWidth >= 2560) {
      baseSize = 1.8 // 4K 屏幕
    } else if (screenWidth >= 1440) {
      baseSize = 1.5 // 大屏幕
    } else if (screenWidth >= 1024) {
      baseSize = 1.2 // 中等屏幕
    } else if (screenWidth >= 768) {
      baseSize = 0.9 // 小屏幕，显著减小字体
    } else {
      baseSize = 0.7 // 更小屏幕
    }

    const baseSizeWidth = 60 // 基础容器宽度 (%)
    const baseSizeHeight = 20 // 基础容器高度 (%)

    // 基于容器尺寸计算缩放比例
    const widthScale = currentLayout.width / baseSizeWidth
    const heightScale = currentLayout.height / baseSizeHeight

    // 使用较小的缩放比例，确保文字不会超出容器
    const scale = Math.min(widthScale, heightScale)

    // 根据屏幕大小设置不同的字体大小限制
    let minSize: number, maxSize: number
    if (screenWidth >= 2560) {
      minSize = 1.2
      maxSize = 4.0
    } else if (screenWidth >= 1440) {
      minSize = 1.0
      maxSize = 3.0
    } else if (screenWidth >= 1024) {
      minSize = 0.8
      maxSize = 2.5
    } else if (screenWidth >= 768) {
      minSize = 0.6
      maxSize = 1.8
    } else {
      minSize = 0.5
      maxSize = 1.4
    }

    const dynamicSize = Math.max(minSize, Math.min(maxSize, baseSize * scale))
    return `${dynamicSize}rem`
  }, [currentLayout])

  // 计算英文和中文的动态字体大小
  const getDynamicEnglishFontSize = useCallback(() => {
    const baseDynamicSize = parseFloat(getDynamicFontSize())
    return `${baseDynamicSize * 1.17}rem` // 英文字体比基础字体大17%
  }, [getDynamicFontSize])

  const getDynamicChineseFontSize = useCallback(() => {
    const baseDynamicSize = parseFloat(getDynamicFontSize())
    return `${baseDynamicSize * 0.93}rem` // 中文字体比基础字体小7%
  }, [getDynamicFontSize])

  // 动态字体样式
  const dynamicTextStyle: React.CSSProperties = {
    fontSize: getDynamicFontSize()
  }

  const dynamicEnglishTextStyle: React.CSSProperties = {
    fontSize: getDynamicEnglishFontSize()
  }

  const dynamicChineseTextStyle: React.CSSProperties = {
    fontSize: getDynamicChineseFontSize()
  }

  // 计算动态控制按钮大小
  const getDynamicControlButtonSize = useCallback(() => {
    // 获取屏幕宽度
    const screenWidth = window.innerWidth

    // 根据屏幕宽度设置基础按钮大小
    let baseButtonSize: number
    let baseIconSize: number

    if (screenWidth >= 2560) {
      baseButtonSize = 40 // 4K 屏幕
      baseIconSize = 18
    } else if (screenWidth >= 1440) {
      baseButtonSize = 36 // 大屏幕
      baseIconSize = 16
    } else if (screenWidth >= 1024) {
      baseButtonSize = 34 // 中等屏幕
      baseIconSize = 15
    } else if (screenWidth >= 768) {
      baseButtonSize = 30 // 小屏幕
      baseIconSize = 13
    } else {
      baseButtonSize = 28 // 更小屏幕
      baseIconSize = 12
    }

    // 基于字幕容器大小计算缩放比例
    const baseSizeWidth = 60 // 基础容器宽度 (%)
    const baseSizeHeight = 20 // 基础容器高度 (%)

    const widthScale = currentLayout.width / baseSizeWidth
    const heightScale = currentLayout.height / baseSizeHeight
    const scale = Math.min(widthScale, heightScale)

    // 限制按钮大小范围
    const minButtonSize = 24
    const maxButtonSize = 50
    const minIconSize = 10
    const maxIconSize = 24

    const dynamicButtonSize = Math.max(
      minButtonSize,
      Math.min(maxButtonSize, baseButtonSize * scale)
    )
    const dynamicIconSize = Math.max(minIconSize, Math.min(maxIconSize, baseIconSize * scale))

    return {
      buttonSize: Math.round(dynamicButtonSize),
      iconSize: Math.round(dynamicIconSize)
    }
  }, [currentLayout])

  // 动态控制按钮样式
  const { buttonSize, iconSize } = getDynamicControlButtonSize()

  const dynamicControlButtonStyle: React.CSSProperties = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    fontSize: `${iconSize}px`
  }

  // 根据显示模式渲染字幕内容
  const renderSubtitleContent = useMemo(() => {
    if (!currentSubtitle || displayMode === 'none') {
      return (
        <div className={styles.subtitlePlaceholder}>
          <Text className={styles.subtitleHidden}>
            {displayMode === 'none' ? '字幕已隐藏 - 悬停显示控制' : '等待字幕 - 悬停显示控制'}
          </Text>
        </div>
      )
    }

    const { text, englishText, chineseText } = currentSubtitle

    switch (displayMode) {
      case 'original':
        return (
          <div className={styles.subtitleContentOriginal}>
            <Text className={styles.subtitleText} style={dynamicTextStyle}>
              {splitTextIntoWords(text)}
            </Text>
          </div>
        )

      case 'chinese':
        if (chineseText) {
          return (
            <div className={styles.subtitleContentChinese}>
              <Text className={styles.subtitleText} style={dynamicChineseTextStyle}>
                {splitTextIntoWords(chineseText)}
              </Text>
            </div>
          )
        }
        return (
          <div className={styles.subtitlePlaceholder}>
            <Text className={styles.subtitleHidden}>没有中文字幕</Text>
          </div>
        )

      case 'english':
        if (englishText) {
          return (
            <div className={styles.subtitleContentEnglish}>
              <Text className={styles.subtitleText} style={dynamicEnglishTextStyle}>
                {splitTextIntoWords(englishText)}
              </Text>
            </div>
          )
        }
        return (
          <div className={styles.subtitlePlaceholder}>
            <Text className={styles.subtitleHidden}>没有英文字幕</Text>
          </div>
        )

      case 'bilingual':
        return (
          <div className={styles.subtitleContentBilingual}>
            {englishText && (
              <div className={`${styles.subtitleLine} english`}>
                <Text className={`${styles.subtitleText} english`} style={dynamicEnglishTextStyle}>
                  {splitTextIntoWords(englishText)}
                </Text>
              </div>
            )}
            {chineseText && (
              <div className={`${styles.subtitleLine} chinese`}>
                <Text className={`${styles.subtitleText} chinese`} style={dynamicChineseTextStyle}>
                  {splitTextIntoWords(chineseText)}
                </Text>
              </div>
            )}
            {!englishText && !chineseText && (
              <div className={`${styles.subtitleLine} original`}>
                <Text className={styles.subtitleText} style={dynamicTextStyle}>
                  {splitTextIntoWords(text)}
                </Text>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }, [
    currentSubtitle,
    displayMode,
    splitTextIntoWords,
    dynamicTextStyle,
    dynamicEnglishTextStyle,
    dynamicChineseTextStyle
  ])

  // 计算实际显示的背景类型（拖拽或调整大小时强制透明）
  const actualBackgroundType = useMemo(() => {
    if (isDragging || isResizing) {
      return 'transparent'
    }
    return subtitleState.backgroundType
  }, [isDragging, isResizing, subtitleState.backgroundType])

  // 容器样式（基于边距计算）- 根据遮罩模式调整定位
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.left + (currentLayout.left * subtitleState.maskFrame.width) / 100}%` // 遮罩模式下，基于定位框位置和字幕区域在定位框内的相对位置
      : `${currentLayout.left}%`, // 普通模式下，使用原始位置
    top: subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.top + (currentLayout.top * subtitleState.maskFrame.height) / 100}%` // 遮罩模式下，基于定位框位置和字幕区域在定位框内的相对位置
      : `${currentLayout.top}%`, // 普通模式下，使用原始位置
    width: subtitleState.isMaskMode
      ? `${(currentLayout.width * subtitleState.maskFrame.width) / 100}%` // 遮罩模式下，宽度相对于定位框的实际尺寸
      : `${currentLayout.width}%`, // 普通模式下，使用原始宽度
    height: subtitleState.isMaskMode
      ? `${(currentLayout.height * subtitleState.maskFrame.height) / 100}%` // 遮罩模式下，高度相对于定位框的实际尺寸
      : `${currentLayout.height}%`, // 普通模式下，使用原始高度
    cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'grab',
    zIndex: isDragging || isResizing ? 100 : 10,
    userSelect: isDragging || isResizing ? 'none' : 'auto'
  }

  return (
    <>
      {/* 遮罩模式效果 */}
      {subtitleState.isMaskMode && (
        <>
          {/* 遮罩层 - 覆盖整个播放器区域，但定位框区域透明 */}
          <div
            className={styles.maskOverlay}
            style={{
              position: 'absolute',
              left: '0%',
              top: '0%',
              width: '100%',
              height: '100%',
              background: `
                radial-gradient(
                  ellipse ${getScaledMaskFrame().width}% ${getScaledMaskFrame().height}% 
                  at ${getScaledMaskFrame().left + getScaledMaskFrame().width / 2}% ${getScaledMaskFrame().top + getScaledMaskFrame().height / 2}%,
                  transparent 0%,
                  transparent 40%,
                  rgba(0, 0, 0, 0.7) 70%,
                  rgba(0, 0, 0, 0.9) 100%
                )
              `,
              zIndex: 5,
              pointerEvents: 'none', // 不阻挡鼠标事件
              transition: 'all 0.3s ease-in-out'
            }}
          />

          {/* 定位框边界 - 可拖拽和调整大小 */}
          <div
            className={styles.maskFrame}
            style={{
              position: 'absolute',
              left: `${getScaledMaskFrame().left}%`,
              top: `${getScaledMaskFrame().top}%`,
              width: `${getScaledMaskFrame().width}%`,
              height: `${getScaledMaskFrame().height}%`,
              border:
                isMaskFrameHovering || isMaskFrameDragging || isMaskFrameResizing
                  ? '2px dashed rgba(102, 126, 234, 0.8)'
                  : '2px dashed rgba(255, 255, 255, 0.6)',
              backgroundColor: 'transparent',
              zIndex: 6,
              pointerEvents: 'auto', // 允许鼠标事件
              borderRadius: '8px',
              transition:
                isMaskFrameDragging || isMaskFrameResizing ? 'none' : 'all 0.3s ease-in-out',
              cursor: isMaskFrameDragging ? 'grabbing' : 'grab',
              // 确保定位框在窗口变化时保持可见性
              minWidth: '10%',
              minHeight: '10%',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            onMouseDown={handleMaskFrameMouseDown}
            onMouseEnter={() => setIsMaskFrameHovering(true)}
            onMouseLeave={() => setIsMaskFrameHovering(false)}
          >
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '4px 8px',
                borderRadius: '4px',
                pointerEvents: 'none'
              }}
            >
              定位框 - 可拖拽和调整大小
            </div>

            {/* 定位框调整大小控制点 - 四个角 */}
            {isMaskFrameHovering && (
              <>
                {/* 右下角 */}
                <div
                  className={`${styles.resizeHandle} ${styles.resizeHandleSE}`}
                  onMouseDown={(e) => handleMaskFrameResizeMouseDown(e, 'se')}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    cursor: 'se-resize'
                  }}
                />
                {/* 左下角 */}
                <div
                  className={`${styles.resizeHandle} ${styles.resizeHandleSW}`}
                  onMouseDown={(e) => handleMaskFrameResizeMouseDown(e, 'sw')}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '12px',
                    height: '12px',
                    cursor: 'sw-resize'
                  }}
                />
                {/* 右上角 */}
                <div
                  className={`${styles.resizeHandle} ${styles.resizeHandleNE}`}
                  onMouseDown={(e) => handleMaskFrameResizeMouseDown(e, 'ne')}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    cursor: 'ne-resize'
                  }}
                />
                {/* 左上角 */}
                <div
                  className={`${styles.resizeHandle} ${styles.resizeHandleNW}`}
                  onMouseDown={(e) => handleMaskFrameResizeMouseDown(e, 'nw')}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '12px',
                    height: '12px',
                    cursor: 'nw-resize'
                  }}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* 控制按钮 - 独立定位在字幕区域右上方 */}
      {(isHovering || isControlsHovering) && (
        <div
          className={styles.subtitleControlsExternal}
          style={{
            position: 'absolute',
            left: `${Math.min(95, currentLayout.left + currentLayout.width)}%`, // 字幕区域右边缘，确保不溢出屏幕右侧
            top: `${Math.max(5, currentLayout.top - 2)}%`, // 字幕区域上边缘，减少边距
            transform: 'translate(-100%, -100%)', // 从右上角定位
            zIndex: 150
          }}
          onMouseEnter={() => setIsControlsHovering(true)}
          onMouseLeave={() => setIsControlsHovering(false)}
        >
          <div className={styles.subtitleControls}>
            <Tooltip title={`遮罩模式: ${subtitleState.isMaskMode ? '开启' : '关闭'}`}>
              <Button
                size="small"
                type={subtitleState.isMaskMode ? 'primary' : 'text'}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMaskMode()
                }}
                className={styles.controlButton}
                style={dynamicControlButtonStyle}
              >
                <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>
                  {subtitleState.isMaskMode ? '⊞' : '⊡'}
                </span>
              </Button>
            </Tooltip>
            <Tooltip title={`背景类型: ${currentBackgroundConfig.label}`}>
              <Button
                size="small"
                type="text"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleBackgroundType()
                }}
                className={styles.controlButton}
                style={dynamicControlButtonStyle}
              >
                <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>
                  {currentBackgroundConfig.icon}
                </span>
              </Button>
            </Tooltip>
            <Tooltip title="重置位置和大小">
              <Button
                size="small"
                type="text"
                onClick={(e) => {
                  e.stopPropagation()
                  resetSubtitleState()
                }}
                className={styles.controlButton}
                style={dynamicControlButtonStyle}
              >
                <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>↺</span>
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* 字幕容器 */}
      <div
        ref={containerRef}
        className={`${styles.subtitleContainer} ${isDragging ? styles.dragging : ''}`}
        style={containerStyle}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          // 延迟隐藏，给用户时间移动到控制按钮
          setTimeout(() => {
            if (!isControlsHovering) {
              setIsHovering(false)
            }
          }, 100)
        }}
      >
        {/* 字幕内容区域 */}
        <div
          className={`${styles.subtitleContent} ${
            actualBackgroundType === 'blur'
              ? styles.blurBackground
              : actualBackgroundType === 'solid-black'
                ? styles.solidBlackBackground
                : actualBackgroundType === 'solid-gray'
                  ? styles.solidGrayBackground
                  : styles.transparentBackground
          }`}
        >
          {renderSubtitleContent}
        </div>

        {/* 调整大小控制点 - 四个角 */}
        {isHovering && (
          <>
            {/* 右下角 */}
            <div
              className={`${styles.resizeHandle} ${styles.resizeHandleSE}`}
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                cursor: 'se-resize'
              }}
            />
            {/* 左下角 */}
            <div
              className={`${styles.resizeHandle} ${styles.resizeHandleSW}`}
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                cursor: 'sw-resize'
              }}
            />
            {/* 右上角 */}
            <div
              className={`${styles.resizeHandle} ${styles.resizeHandleNE}`}
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                cursor: 'ne-resize'
              }}
            />
            {/* 左上角 */}
            <div
              className={`${styles.resizeHandle} ${styles.resizeHandleNW}`}
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                cursor: 'nw-resize'
              }}
            />
          </>
        )}
      </div>

      {/* 单词卡片 - 渲染在根级别，避免被字幕容器限制 */}
      {selectedWord && (
        <WordCard
          word={selectedWord.word}
          targetElement={selectedWord.element}
          onClose={handleCloseWordCard}
        />
      )}
    </>
  )
}
