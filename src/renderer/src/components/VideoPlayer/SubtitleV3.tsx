import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { SubtitleItem } from '@types_/shared'
import type { DisplayMode } from '@renderer/types'
import { WordCard } from '@renderer/components/WordCard/WordCard'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import {
  useSubtitleState,
  createDefaultSubtitleState,
  type SubtitleMarginsState
} from '@renderer/hooks/useSubtitleState'
import { useSubtitleDragAndResize } from '@renderer/hooks/useSubtitleDragAndResize'
import { useSubtitleStyles } from '@renderer/hooks/useSubtitleStyles'
import { SubtitleControls } from './SubtitleControls'
import { SubtitleContent } from './SubtitleContent'
import { MaskFrame } from './MaskFrame'
import RendererLogger from '@renderer/utils/logger'
import styles from './Subtitle.module.css'

interface SubtitleV3Props {
  currentSubtitle: SubtitleItem | null
  isPlaying: boolean
  displayMode: DisplayMode
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

export function SubtitleV3({
  currentSubtitle,
  isPlaying,
  displayMode,
  onWordHover,
  onPauseOnHover
}: SubtitleV3Props): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleV3',
    props: {
      currentSubtitle,
      isPlaying,
      displayMode,
      onWordHover,
      onPauseOnHover
    }
  })

  // 获取视频上下文
  const { displayAspectRatio } = usePlayingVideoContext()

  // 单词选择状态
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)

  // 悬停状态
  const [isHovering, setIsHovering] = useState(false)
  const [isControlsHovering, setIsControlsHovering] = useState(false)

  // 引用
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用状态管理 hook
  const { subtitleState, updateSubtitleState, toggleBackgroundType, toggleMaskMode } =
    useSubtitleState(
      containerRef.current?.parentElement?.clientWidth || 0,
      containerRef.current?.parentElement?.clientHeight || 0,
      displayAspectRatio
    )

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

  // 获取父容器尺寸
  const getParentBounds = useCallback(() => {
    const parent = containerRef.current?.parentElement
    if (!parent) return { width: 0, height: 0 }

    return {
      width: parent.clientWidth,
      height: parent.clientHeight
    }
  }, [])

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

  // 更新定位框的回调函数
  const updateMaskFrame = useCallback(
    (maskFrame: SubtitleMarginsState['maskFrame']) => {
      updateSubtitleState({
        ...subtitleState,
        maskFrame
      })
    },
    [subtitleState, updateSubtitleState]
  )

  // 重置字幕状态
  const resetSubtitleState = useCallback(() => {
    const cleanState = createDefaultSubtitleState()
    updateSubtitleState(cleanState)

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 重置字幕状态到:', cleanState)
    }
  }, [updateSubtitleState])

  // 一键铺满左右
  const expandHorizontally = useCallback(() => {
    updateSubtitleState({
      ...subtitleState,
      margins: {
        ...subtitleState.margins,
        left: 5, // 最小左边距5%
        right: 5 // 最小右边距5%
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('↔ 一键铺满左右')
    }
  }, [subtitleState, updateSubtitleState])

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
  }, [])

  // 关闭单词卡片
  const handleCloseWordCard = useCallback(() => {
    setSelectedWord(null)
  }, [])

  // 添加事件监听
  useEffect(() => {
    if (dragAndResizeProps.isDragging || dragAndResizeProps.isResizing) {
      const handleMouseMove = (e: MouseEvent): void => {
        dragAndResizeProps.handleMouseMove(e, containerRef)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', dragAndResizeProps.handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', dragAndResizeProps.handleMouseUp)
      }
    }
  }, [dragAndResizeProps])

  // 计算实际显示的背景类型（拖拽或调整大小时强制透明）
  const actualBackgroundType = useMemo(() => {
    if (dragAndResizeProps.isDragging || dragAndResizeProps.isResizing) {
      return 'transparent'
    }
    return subtitleState.backgroundType
  }, [dragAndResizeProps.isDragging, dragAndResizeProps.isResizing, subtitleState.backgroundType])

  // 容器样式
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.left + (currentLayout.left * subtitleState.maskFrame.width) / 100}%`
      : `${currentLayout.left}%`,
    top: subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.top + (currentLayout.top * subtitleState.maskFrame.height) / 100}%`
      : `${currentLayout.top}%`,
    width: subtitleState.isMaskMode
      ? `${(currentLayout.width * subtitleState.maskFrame.width) / 100}%`
      : `${currentLayout.width}%`,
    height: subtitleState.isMaskMode
      ? `${(currentLayout.height * subtitleState.maskFrame.height) / 100}%`
      : `${currentLayout.height}%`,
    cursor: dragAndResizeProps.isDragging
      ? 'grabbing'
      : dragAndResizeProps.isResizing
        ? 'se-resize'
        : 'grab',
    zIndex: dragAndResizeProps.isDragging || dragAndResizeProps.isResizing ? 100 : 10,
    userSelect: dragAndResizeProps.isDragging || dragAndResizeProps.isResizing ? 'none' : 'auto'
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
                  ellipse ${subtitleState.maskFrame.width}% ${subtitleState.maskFrame.height}% 
                  at ${subtitleState.maskFrame.left + subtitleState.maskFrame.width / 2}% ${subtitleState.maskFrame.top + subtitleState.maskFrame.height / 2}%,
                  transparent 0%,
                  transparent 40%,
                  rgba(0, 0, 0, 0.7) 70%,
                  rgba(0, 0, 0, 0.9) 100%
                )
              `,
              zIndex: 5,
              pointerEvents: 'none',
              transition: 'all 0.3s ease-in-out'
            }}
          />

          {/* 定位框边界 - 使用新的 MaskFrame 组件 */}
          <MaskFrame
            maskFrame={subtitleState.maskFrame}
            updateMaskFrame={updateMaskFrame}
            containerRef={containerRef}
          />
        </>
      )}

      {/* 控制按钮 */}
      {(isHovering || isControlsHovering) && (
        <div
          className={styles.subtitleControlsExternal}
          style={{
            position: 'absolute',
            left: `${Math.min(95, currentLayout.left + currentLayout.width)}%`,
            top: `${Math.max(5, currentLayout.top - 2)}%`,
            transform: 'translate(-100%, -100%)',
            zIndex: 150
          }}
          onMouseEnter={() => setIsControlsHovering(true)}
          onMouseLeave={() => setIsControlsHovering(false)}
        >
          <SubtitleControls
            isMaskMode={subtitleState.isMaskMode}
            backgroundType={subtitleState.backgroundType}
            buttonSize={buttonSize}
            iconSize={iconSize}
            onToggleMaskMode={toggleMaskMode}
            onToggleBackgroundType={toggleBackgroundType}
            onReset={resetSubtitleState}
            onExpandHorizontally={expandHorizontally}
          />
        </div>
      )}

      {/* 字幕容器 */}
      <div
        ref={containerRef}
        className={`${styles.subtitleContainer} ${dragAndResizeProps.isDragging ? styles.dragging : ''}`}
        style={containerStyle}
        onMouseDown={(e) => dragAndResizeProps.handleMouseDown(e, containerRef)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
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
          <SubtitleContent
            currentSubtitle={currentSubtitle}
            displayMode={displayMode}
            dynamicTextStyle={dynamicTextStyle}
            dynamicEnglishTextStyle={dynamicEnglishTextStyle}
            dynamicChineseTextStyle={dynamicChineseTextStyle}
            onWordHover={handleWordHover}
            onWordClick={handleWordClick}
          />
        </div>

        {/* 调整大小控制点 */}
        {isHovering && (
          <>
            {/* 只保留右下角控制点 */}
            <div
              className={`${styles.resizeHandle} ${styles.resizeHandleSE}`}
              onMouseDown={(e) => dragAndResizeProps.handleResizeMouseDown(e, 'se')}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
                cursor: 'se-resize'
              }}
            />
          </>
        )}
      </div>

      {/* 单词卡片 */}
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
