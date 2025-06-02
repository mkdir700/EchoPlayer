import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react'
import { WordCard } from '@renderer/components/WordCard/WordCard'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import {
  useSubtitleState,
  createDefaultSubtitleDisplay,
  type SubtitleMarginsState,
  type BackgroundType
} from '@renderer/hooks/useSubtitleState'
import { useSubtitleDragAndResize } from '@renderer/hooks/useSubtitleDragAndResize'
import { useSubtitleStyles } from '@renderer/hooks/useSubtitleStyles'
import { SubtitleControls } from './SubtitleControls'
import { SubtitleContent } from './SubtitleContent'
import { MaskFrame } from './MaskFrame'
import RendererLogger from '@renderer/utils/logger'
import styles from './Subtitle.module.css'

interface SubtitleV3Props {
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

// 拆分子组件：遮罩覆盖层
const MaskOverlay = memo(
  ({ maskFrame }: { maskFrame: SubtitleMarginsState['maskFrame'] }): React.JSX.Element => {
    const style = useMemo(
      (): React.CSSProperties => ({
        position: 'absolute',
        left: '0%',
        top: '0%',
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
        transition: 'all 0.3s ease-in-out'
      }),
      [maskFrame.width, maskFrame.height, maskFrame.left, maskFrame.top]
    )

    return <div className={styles.maskOverlay} style={style} />
  }
)
MaskOverlay.displayName = 'MaskOverlay'

// 拆分子组件：控制按钮
const SubtitleControlsWrapper = memo(
  ({
    visible,
    currentLayout,
    subtitleState,
    buttonSize,
    iconSize,
    onToggleMaskMode,
    onToggleBackgroundType,
    onReset,
    onExpandHorizontally,
    onMouseEnter,
    onMouseLeave
  }: {
    visible: boolean
    currentLayout: { left: number; top: number; width: number; height: number }
    subtitleState: { isMaskMode: boolean; backgroundType: BackgroundType }
    buttonSize: number
    iconSize: number
    onToggleMaskMode: () => void
    onToggleBackgroundType: () => void
    onReset: () => void
    onExpandHorizontally: () => void
    onMouseEnter: () => void
    onMouseLeave: () => void
  }): React.JSX.Element | null => {
    const controlsStyle = useMemo(
      (): React.CSSProperties => ({
        position: 'absolute',
        left: `${Math.min(95, currentLayout.left + currentLayout.width)}%`,
        top: `${Math.max(5, currentLayout.top - 2)}%`,
        transform: 'translate(-100%, -100%)',
        zIndex: 150
      }),
      [currentLayout.left, currentLayout.top, currentLayout.width]
    )

    if (!visible) return null

    return (
      <div
        className={styles.subtitleControlsExternal}
        style={controlsStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <SubtitleControls
          isMaskMode={subtitleState.isMaskMode}
          backgroundType={subtitleState.backgroundType}
          buttonSize={buttonSize}
          iconSize={iconSize}
          onToggleMaskMode={onToggleMaskMode}
          onToggleBackgroundType={onToggleBackgroundType}
          onReset={onReset}
          onExpandHorizontally={onExpandHorizontally}
        />
      </div>
    )
  }
)
SubtitleControlsWrapper.displayName = 'SubtitleControlsWrapper'

// 拆分子组件：调整大小控制点
const ResizeHandle = memo(
  ({
    visible,
    buttonSize,
    onMouseDown
  }: {
    visible: boolean
    buttonSize: number
    onMouseDown: (e: React.MouseEvent) => void
  }): React.JSX.Element | null => {
    const handleStyle = useMemo(
      (): React.CSSProperties => ({
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
        height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
        cursor: 'se-resize'
      }),
      [buttonSize]
    )

    if (!visible) return null

    return (
      <div
        className={`${styles.resizeHandle} ${styles.resizeHandleSE}`}
        onMouseDown={onMouseDown}
        style={handleStyle}
      />
    )
  }
)
ResizeHandle.displayName = 'ResizeHandle'

function SubtitleV3({ onWordHover, onPauseOnHover }: SubtitleV3Props): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleV3',
    props: { onWordHover, onPauseOnHover }
  })

  // 获取视频上下文
  const { displayAspectRatio } = usePlayingVideoContext()

  // 本地状态
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isControlsHovering, setIsControlsHovering] = useState(false)
  const [isMaskFrameActive, setIsMaskFrameActive] = useState(false)
  const [isMaskFrameHovering, setIsMaskFrameHovering] = useState(false)

  // 引用
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maskFrameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const parentDimensionsRef = useRef({ width: 0, height: 0 })
  const renderCount = useRef(0)

  // 稳定的回调函数 - 使用 useRef 存储最新值，保持函数引用稳定
  const callbacksRef = useRef({
    onWordHover,
    onPauseOnHover
  })

  // 更新回调引用
  useEffect(() => {
    callbacksRef.current = {
      onWordHover,
      onPauseOnHover
    }
  }, [onWordHover, onPauseOnHover])

  // 获取父容器尺寸 - 只计算一次
  const parentDimensions = useMemo(() => {
    const parent = containerRef.current?.parentElement
    const dimensions = {
      width: parent?.clientWidth || 0,
      height: parent?.clientHeight || 0
    }
    parentDimensionsRef.current = dimensions
    return dimensions
  }, [])

  // 获取父容器边界的稳定函数
  const getParentBounds = useCallback(() => {
    const parent = containerRef.current?.parentElement
    if (parent) {
      const dimensions = {
        width: parent.clientWidth,
        height: parent.clientHeight
      }
      parentDimensionsRef.current = dimensions
      return dimensions
    }
    return parentDimensionsRef.current
  }, [])

  // 使用状态管理 hook
  const { subtitleState, updateSubtitleState, toggleBackgroundType, toggleMaskMode } =
    useSubtitleState(parentDimensions.width, parentDimensions.height, displayAspectRatio)

  // 计算当前布局 - 只依赖必要的状态
  const currentLayout = useMemo(() => {
    const { left, top, right, bottom } = subtitleState.margins
    return {
      left,
      top,
      width: 100 - left - right,
      height: 100 - top - bottom
    }
  }, [
    subtitleState.margins.left,
    subtitleState.margins.top,
    subtitleState.margins.right,
    subtitleState.margins.bottom
  ])

  // 使用拖拽和调整大小 hook
  const dragAndResizeProps = useSubtitleDragAndResize(
    subtitleState,
    updateSubtitleState,
    getParentBounds,
    currentLayout
  )

  // 使用样式 hook
  const {
    dynamicTextStyle,
    dynamicEnglishTextStyle,
    dynamicChineseTextStyle,
    buttonSize,
    iconSize
  } = useSubtitleStyles(currentLayout)

  // 稳定的事件处理函数
  const stableHandlers = useMemo(
    () => ({
      // 处理单词hover事件
      handleWordHover: (isHovering: boolean): void => {
        callbacksRef.current.onWordHover(isHovering)
        if (isHovering) {
          console.log('触发暂停视频')
          callbacksRef.current.onPauseOnHover()
        }
      },

      // 处理单词点击事件
      handleWordClick: (word: string, event: React.MouseEvent): void => {
        event.stopPropagation()
        event.preventDefault()

        const trimmedWord = word.trim()
        if (trimmedWord === '') {
          return
        }

        const wordElement = event.target as HTMLElement
        setSelectedWord({
          word: trimmedWord,
          element: wordElement
        })
      },

      // 检查是否是单词元素
      isWordElement: (element: HTMLElement): boolean => {
        if (
          element.classList.contains('subtitleWord') ||
          element.classList.contains('clickableWord')
        ) {
          return true
        }

        let parent = element.parentElement
        let depth = 0
        while (parent && depth < 3) {
          if (
            parent.classList.contains('subtitleWord') ||
            parent.classList.contains('clickableWord')
          ) {
            return true
          }
          parent = parent.parentElement
          depth++
        }
        return false
      },

      // 关闭单词卡片
      handleCloseWordCard: (): void => {
        setSelectedWord(null)
      },

      // 更新遮罩框
      updateMaskFrame: (maskFrame: SubtitleMarginsState['maskFrame']): void => {
        updateSubtitleState({
          ...subtitleState,
          maskFrame
        })
      },

      // 重置字幕状态
      resetSubtitleState: (): void => {
        const cleanState = createDefaultSubtitleDisplay()
        updateSubtitleState(cleanState)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 重置字幕状态到:', cleanState)
        }
      },

      // 一键铺满左右
      expandHorizontally: (): void => {
        const parent = containerRef.current?.parentElement
        if (!parent) {
          console.warn('⚠️ 无法获取父容器，使用默认边距')
          updateSubtitleState({
            ...subtitleState,
            margins: {
              ...subtitleState.margins,
              left: 5,
              right: 5
            }
          })
          return
        }

        // 计算视频在容器中的实际显示区域
        const containerWidth = parent.clientWidth
        const containerHeight = parent.clientHeight
        const containerAspectRatio = containerWidth / containerHeight

        let videoDisplayWidth: number, videoLeft: number

        if (displayAspectRatio > containerAspectRatio) {
          // 视频比容器更宽，以容器宽度为准进行缩放
          videoDisplayWidth = containerWidth
          videoLeft = 0
        } else {
          // 视频比容器更高（或相等），以容器高度为准进行缩放
          videoDisplayWidth = containerHeight * displayAspectRatio
          videoLeft = (containerWidth - videoDisplayWidth) / 2
        }

        // 转换为百分比
        const videoLeftPercent = (videoLeft / containerWidth) * 100
        const videoRightPercent =
          ((containerWidth - (videoLeft + videoDisplayWidth)) / containerWidth) * 100

        // 设置字幕区域的左右边距为视频显示区域的边界，再加上适当的内边距
        const horizontalPadding = 2 // 2% 的内边距，确保字幕不会紧贴视频边缘
        const leftMargin = Math.max(0, videoLeftPercent + horizontalPadding)
        const rightMargin = Math.max(0, videoRightPercent + horizontalPadding)

        updateSubtitleState({
          ...subtitleState,
          margins: {
            ...subtitleState.margins,
            left: leftMargin,
            right: rightMargin
          }
        })

        if (process.env.NODE_ENV === 'development') {
          console.log('↔ 一键铺满左右 - 基于视频显示区域:', {
            displayAspectRatio,
            containerAspectRatio,
            videoDisplayArea: {
              left: videoLeftPercent,
              width: (videoDisplayWidth / containerWidth) * 100
            },
            calculatedMargins: {
              left: leftMargin,
              right: rightMargin
            }
          })
        }
      },

      // 容器鼠标按下事件处理
      handleContainerMouseDown: (e: React.MouseEvent): void => {
        const target = e.target as HTMLElement
        if (stableHandlers.isWordElement(target)) {
          e.stopPropagation()
          return
        }
        dragAndResizeProps.handleMouseDown(e, containerRef)
      },

      // 悬停控制
      handleMouseEnter: (): void => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
          hideTimeoutRef.current = null
        }
        setIsHovering(true)
        // 在遮罩模式下，进入字幕区域时激活遮罩边框
        if (subtitleState.isMaskMode) {
          setIsMaskFrameActive(true)
        }
      },

      handleMouseLeave: (): void => {
        hideTimeoutRef.current = setTimeout(() => {
          if (!isControlsHovering) {
            setIsHovering(false)
          }
          hideTimeoutRef.current = null
        }, 100)

        // 单独的延时检查遮罩边框状态
        if (maskFrameCheckTimeoutRef.current) {
          clearTimeout(maskFrameCheckTimeoutRef.current)
        }
        maskFrameCheckTimeoutRef.current = setTimeout(() => {
          // 使用 DOM 查询来获取实时的悬停状态
          const subtitleHovering = containerRef.current?.matches(':hover') || false
          const controlsHovering =
            document.querySelector(`.${styles.subtitleControlsExternal}:hover`) !== null
          const maskFrameHovering = document.querySelector(`.${styles.maskFrame}:hover`) !== null

          if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
            setIsMaskFrameActive(false)
          }
        }, 150)
      },

      // 控制按钮悬停
      handleControlsMouseEnter: (): void => {
        setIsControlsHovering(true)
        // 在遮罩模式下，进入控制区域时激活遮罩边框
        if (subtitleState.isMaskMode) {
          setIsMaskFrameActive(true)
        }
      },

      handleControlsMouseLeave: (): void => {
        setIsControlsHovering(false)

        // 延时检查遮罩边框状态
        if (maskFrameCheckTimeoutRef.current) {
          clearTimeout(maskFrameCheckTimeoutRef.current)
        }
        maskFrameCheckTimeoutRef.current = setTimeout(() => {
          const subtitleHovering = containerRef.current?.matches(':hover') || false
          const controlsHovering =
            document.querySelector(`.${styles.subtitleControlsExternal}:hover`) !== null
          const maskFrameHovering = document.querySelector(`.${styles.maskFrame}:hover`) !== null

          if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
            setIsMaskFrameActive(false)
          }
        }, 150)
      },

      // 遮罩框悬停处理
      handleMaskFrameMouseEnter: (): void => {
        setIsMaskFrameHovering(true)
        setIsMaskFrameActive(true)
      },

      handleMaskFrameMouseLeave: (): void => {
        setIsMaskFrameHovering(false)

        // 延时检查遮罩边框状态
        if (maskFrameCheckTimeoutRef.current) {
          clearTimeout(maskFrameCheckTimeoutRef.current)
        }
        maskFrameCheckTimeoutRef.current = setTimeout(() => {
          const subtitleHovering = containerRef.current?.matches(':hover') || false
          const controlsHovering =
            document.querySelector(`.${styles.subtitleControlsExternal}:hover`) !== null
          const maskFrameHovering = document.querySelector(`.${styles.maskFrame}:hover`) !== null

          if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
            setIsMaskFrameActive(false)
          }
        }, 150)
      },

      // 调整大小控制点
      handleResizeMouseDown: (e: React.MouseEvent): void => {
        dragAndResizeProps.handleResizeMouseDown(e, 'se')
      }
    }),
    [
      subtitleState,
      updateSubtitleState,
      dragAndResizeProps.handleMouseDown,
      dragAndResizeProps.handleResizeMouseDown,
      isControlsHovering,
      isHovering,
      isMaskFrameHovering,
      displayAspectRatio,
      containerRef
    ]
  )

  // 全局事件监听器管理
  useEffect(() => {
    const isDraggingOrResizing = dragAndResizeProps.isDragging || dragAndResizeProps.isResizing

    if (isDraggingOrResizing) {
      const handleMouseMove = (e: MouseEvent): void => {
        dragAndResizeProps.handleMouseMove(e, containerRef)
      }
      const handleMouseUp = (): void => {
        dragAndResizeProps.handleMouseUp()
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [
    dragAndResizeProps.isDragging,
    dragAndResizeProps.isResizing,
    dragAndResizeProps.handleMouseMove,
    dragAndResizeProps.handleMouseUp
  ])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
      if (maskFrameCheckTimeoutRef.current) {
        clearTimeout(maskFrameCheckTimeoutRef.current)
      }
    }
  }, [])

  // 监听遮罩模式变化，退出时重置相关状态
  useEffect(() => {
    if (!subtitleState.isMaskMode) {
      setIsMaskFrameActive(false)
      setIsMaskFrameHovering(false)
    }
  }, [subtitleState.isMaskMode])

  // 计算实际背景类型
  const actualBackgroundType = useMemo(() => {
    const isDraggingOrResizing = dragAndResizeProps.isDragging || dragAndResizeProps.isResizing
    return isDraggingOrResizing ? 'transparent' : subtitleState.backgroundType
  }, [dragAndResizeProps.isDragging, dragAndResizeProps.isResizing, subtitleState.backgroundType])

  // 容器样式
  const containerStyle = useMemo((): React.CSSProperties => {
    const isDraggingOrResizing = dragAndResizeProps.isDragging || dragAndResizeProps.isResizing
    const cursor = dragAndResizeProps.isDragging
      ? 'grabbing'
      : dragAndResizeProps.isResizing
        ? 'se-resize'
        : 'grab'

    const left = subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.left + (currentLayout.left * subtitleState.maskFrame.width) / 100}%`
      : `${currentLayout.left}%`

    const top = subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.top + (currentLayout.top * subtitleState.maskFrame.height) / 100}%`
      : `${currentLayout.top}%`

    const width = subtitleState.isMaskMode
      ? `${(currentLayout.width * subtitleState.maskFrame.width) / 100}%`
      : `${currentLayout.width}%`

    const height = subtitleState.isMaskMode
      ? `${(currentLayout.height * subtitleState.maskFrame.height) / 100}%`
      : `${currentLayout.height}%`

    return {
      position: 'absolute',
      left,
      top,
      width,
      height,
      cursor,
      zIndex: isDraggingOrResizing ? 100 : 10,
      userSelect: isDraggingOrResizing ? 'none' : 'auto'
    }
  }, [
    subtitleState.isMaskMode,
    subtitleState.maskFrame,
    currentLayout,
    dragAndResizeProps.isDragging,
    dragAndResizeProps.isResizing
  ])

  // 开发环境调试
  if (process.env.NODE_ENV === 'development') {
    renderCount.current += 1
    if (renderCount.current % 10 === 0) {
      console.log(`🔄 SubtitleV3 渲染 #${renderCount.current}`)
    }
  }

  return (
    <>
      {/* 遮罩模式效果 */}
      {subtitleState.isMaskMode && (
        <>
          <MaskOverlay maskFrame={subtitleState.maskFrame} />
          <MaskFrame
            maskFrame={subtitleState.maskFrame}
            updateMaskFrame={stableHandlers.updateMaskFrame}
            containerRef={containerRef}
            isMaskFrameActive={isMaskFrameActive}
            onMaskFrameMouseEnter={stableHandlers.handleMaskFrameMouseEnter}
            onMaskFrameMouseLeave={stableHandlers.handleMaskFrameMouseLeave}
          />
        </>
      )}

      {/* 控制按钮 */}
      <SubtitleControlsWrapper
        visible={!dragAndResizeProps.isDragging && (isHovering || isControlsHovering)}
        currentLayout={currentLayout}
        subtitleState={subtitleState}
        buttonSize={buttonSize}
        iconSize={iconSize}
        onToggleMaskMode={toggleMaskMode}
        onToggleBackgroundType={toggleBackgroundType}
        onReset={stableHandlers.resetSubtitleState}
        onExpandHorizontally={stableHandlers.expandHorizontally}
        onMouseEnter={stableHandlers.handleControlsMouseEnter}
        onMouseLeave={stableHandlers.handleControlsMouseLeave}
      />

      {/* 字幕容器 */}
      <div
        ref={containerRef}
        className={`${styles.subtitleContainer} ${dragAndResizeProps.isDragging ? styles.dragging : ''}`}
        style={containerStyle}
        onMouseDown={stableHandlers.handleContainerMouseDown}
        onMouseEnter={stableHandlers.handleMouseEnter}
        onMouseLeave={stableHandlers.handleMouseLeave}
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
          <SubtitleContent
            dynamicTextStyle={dynamicTextStyle}
            dynamicEnglishTextStyle={dynamicEnglishTextStyle}
            dynamicChineseTextStyle={dynamicChineseTextStyle}
            onWordHover={stableHandlers.handleWordHover}
            onWordClick={stableHandlers.handleWordClick}
          />
        </div>

        {/* 调整大小控制点 */}
        <ResizeHandle
          visible={isHovering}
          buttonSize={buttonSize}
          onMouseDown={stableHandlers.handleResizeMouseDown}
        />
      </div>

      {/* 单词卡片 */}
      {selectedWord && (
        <WordCard
          word={selectedWord.word}
          targetElement={selectedWord.element}
          onClose={stableHandlers.handleCloseWordCard}
        />
      )}
    </>
  )
}

// 使用更严格的比较函数
const MemoizedSubtitleV3 = memo(SubtitleV3, (prevProps, nextProps) => {
  return (
    prevProps.onWordHover === nextProps.onWordHover &&
    prevProps.onPauseOnHover === nextProps.onPauseOnHover
  )
})

export { MemoizedSubtitleV3 as SubtitleV3 }
