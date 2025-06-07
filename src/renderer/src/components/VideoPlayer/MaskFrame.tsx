import React, { useEffect, useCallback, memo } from 'react'
import type { SubtitleMarginsState } from '@renderer/hooks/useSubtitleState'
import { useMaskFrame } from '@renderer/hooks/useMaskFrame'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useTheme } from '@renderer/hooks/useTheme'
import RendererLogger from '@renderer/utils/logger'
import { useVideoConfig } from '@renderer/hooks/useVideoConfig'

interface MaskFrameProps {
  maskFrame: SubtitleMarginsState['maskFrame']
  updateMaskFrame: (maskFrame: SubtitleMarginsState['maskFrame']) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  onResetToVideo?: () => void
  isMaskFrameActive?: boolean
  onMaskFrameMouseEnter?: () => void
  onMaskFrameMouseLeave?: () => void
}

/**
 * Renders an interactive rectangular mask overlay for positioning subtitles or similar elements over a video.
 *
 * The mask frame can be dragged and resized within the container, and reset to match the video display area. Visual cues and controls are shown on hover or when active. Styling is dynamically derived from the current theme.
 *
 * @param maskFrame - The current position and size of the mask frame, as percentages relative to the container.
 * @param updateMaskFrame - Callback to update the mask frame's position and size.
 * @param containerRef - Ref to the container DOM element.
 * @param onResetToVideo - Optional callback invoked after resetting the mask frame to the video area.
 * @param isMaskFrameActive - If true, the mask frame border is shown as active regardless of hover state.
 * @param onMaskFrameMouseEnter - Optional callback for mouse enter events on the mask frame.
 * @param onMaskFrameMouseLeave - Optional callback for mouse leave events on the mask frame.
 *
 * @returns The rendered mask frame element with drag, resize, and reset controls.
 *
 * @remark The mask frame's minimum size is clamped to 10% of the container's width and height.
 */
function MaskFrame({
  maskFrame,
  updateMaskFrame,
  containerRef,
  onResetToVideo,
  isMaskFrameActive = false,
  onMaskFrameMouseEnter,
  onMaskFrameMouseLeave
}: MaskFrameProps): React.JSX.Element {
  const { displayAspectRatio } = usePlayingVideoContext()
  const maskFrameController = useMaskFrame(maskFrame, updateMaskFrame, containerRef)
  const { token } = useTheme()

  // Get subtitle layout lock state - 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useVideoConfig()

  // 添加全局事件监听
  useEffect(() => {
    if (maskFrameController.isDragging || maskFrameController.isResizing) {
      document.addEventListener('mousemove', maskFrameController.handleMouseMove)
      document.addEventListener('mouseup', maskFrameController.handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', maskFrameController.handleMouseMove)
        document.removeEventListener('mouseup', maskFrameController.handleMouseUp)
      }
    }
    return
  }, [
    maskFrameController.isDragging,
    maskFrameController.isResizing,
    maskFrameController.handleMouseMove,
    maskFrameController.handleMouseUp
  ])

  // 重置定位框到视频区域
  const handleResetToVideo = useCallback((): void => {
    const parent = containerRef.current?.parentElement
    if (!parent) return

    // 计算视频在容器中的实际显示区域
    const containerAspectRatio = parent.clientWidth / parent.clientHeight

    let videoDisplayWidth: number, videoDisplayHeight: number, videoLeft: number, videoTop: number

    if (displayAspectRatio > containerAspectRatio) {
      // 视频比容器更宽，以容器宽度为准进行缩放
      videoDisplayWidth = parent.clientWidth
      videoDisplayHeight = parent.clientWidth / displayAspectRatio
      videoLeft = 0
      videoTop = (parent.clientHeight - videoDisplayHeight) / 2
    } else {
      // 视频比容器更高（或相等），以容器高度为准进行缩放
      videoDisplayHeight = parent.clientHeight
      videoDisplayWidth = parent.clientHeight * displayAspectRatio
      videoTop = 0
      videoLeft = (parent.clientWidth - videoDisplayWidth) / 2
    }

    // 转换为百分比
    const videoLeftPercent = (videoLeft / parent.clientWidth) * 100
    const videoTopPercent = (videoTop / parent.clientHeight) * 100
    const videoWidthPercent = (videoDisplayWidth / parent.clientWidth) * 100
    const videoHeightPercent = (videoDisplayHeight / parent.clientHeight) * 100

    const newMaskFrame = {
      left: Math.max(0, Math.min(100, videoLeftPercent)),
      top: Math.max(0, Math.min(100, videoTopPercent)),
      width: Math.max(10, Math.min(100, videoWidthPercent)),
      height: Math.max(10, Math.min(100, videoHeightPercent))
    }

    console.log('🔄 重置定位框到视频区域:', newMaskFrame)
    updateMaskFrame(newMaskFrame)

    // 重新启用自动调整
    maskFrameController.resetInteractionState()

    // 调用父组件的回调
    if (onResetToVideo) {
      onResetToVideo()
    }
  }, [displayAspectRatio, updateMaskFrame, maskFrameController, onResetToVideo, containerRef])

  // 计算最终的边框显示状态：内部hover状态 或 外部激活状态（锁定时不显示）
  // Calculate final border display state: internal hover state or external active state (not shown when locked)
  const shouldShowBorder =
    !isSubtitleLayoutLocked &&
    (maskFrameController.isHovering ||
      maskFrameController.isDragging ||
      maskFrameController.isResizing ||
      isMaskFrameActive)

  // 处理鼠标进入事件
  const handleMouseEnter = (): void => {
    maskFrameController.handleMouseEnter()
    onMaskFrameMouseEnter?.()
  }

  // 处理鼠标离开事件
  const handleMouseLeave = (): void => {
    maskFrameController.handleMouseLeave()
    onMaskFrameMouseLeave?.()
  }

  // 计算遮罩框样式
  const maskFrameStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${maskFrame.left}%`,
    top: `${maskFrame.top}%`,
    width: `${maskFrame.width}%`,
    height: `${maskFrame.height}%`,
    border: shouldShowBorder ? `2px dashed ${token.colorPrimary}` : 'none',
    backgroundColor: 'transparent',
    zIndex: 6,
    pointerEvents: 'auto',
    borderRadius: token.borderRadiusLG,
    transition:
      maskFrameController.isDragging || maskFrameController.isResizing
        ? 'none'
        : `all ${token.motionDurationMid} ease-in-out`,
    cursor: maskFrameController.isDragging ? 'grabbing' : 'grab',
    minWidth: '10%',
    minHeight: '10%',
    maxWidth: '100%',
    maxHeight: '100%'
  }

  // 提示文字样式
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    top: token.paddingXS,
    left: token.paddingSM,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: token.fontSizeSM,
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: `${token.paddingXXS}px ${token.paddingXS}px`,
    borderRadius: token.borderRadiusSM,
    pointerEvents: 'none'
  }

  // 重置按钮样式
  const resetButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: token.paddingXS,
    right: token.paddingSM,
    background: `rgba(${token.colorPrimary
      .slice(1)
      .match(/.{2}/g)
      ?.map((hex) => parseInt(hex, 16))
      .join(', ')}, 0.8)`,
    color: 'white',
    border: 'none',
    borderRadius: token.borderRadiusSM,
    padding: `${token.paddingXXS}px ${token.paddingXS}px`,
    fontSize: token.fontSizeSM - 1,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: `all ${token.motionDurationFast} ease`,
    zIndex: 10,
    pointerEvents: 'auto'
  }

  // 调整大小控制点基础样式
  const resizeHandleBaseStyle: React.CSSProperties = {
    position: 'absolute',
    background: token.colorPrimary,
    border: '2px solid rgba(255, 255, 255, 0.9)',
    zIndex: 50,
    transition: `all ${token.motionDurationFast}`,
    pointerEvents: 'auto',
    width: '12px',
    height: '12px'
  }

  RendererLogger.componentRender({
    component: 'MaskFrame',
    props: {
      maskFrame,
      isHovering: maskFrameController.isHovering,
      isDragging: maskFrameController.isDragging,
      isResizing: maskFrameController.isResizing
    }
  })

  return (
    <div
      style={maskFrameStyle}
      onMouseDown={maskFrameController.handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 锁定布局时不展示任何控制元素 - When layout is locked, don't show any control elements */}
      {!isSubtitleLayoutLocked && (
        <>
          {/* 提示文字 - 只在悬停时显示 */}
          {maskFrameController.isHovering && (
            <div style={tooltipStyle}>定位框 - 可拖拽和调整大小</div>
          )}

          {/* 重置按钮 */}
          {maskFrameController.isHovering && (
            <button
              onClick={handleResetToVideo}
              style={resetButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = token.colorPrimary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `rgba(${token.colorPrimary
                  .slice(1)
                  .match(/.{2}/g)
                  ?.map((hex) => parseInt(hex, 16))
                  .join(', ')}, 0.8)`
              }}
              onMouseDown={(e) => {
                e.stopPropagation() // 防止触发拖拽
              }}
            >
              重置到视频
            </button>
          )}

          {/* 调整大小控制点 - 四个角 */}
          {maskFrameController.isHovering && (
            <>
              {/* 右下角 */}
              <div
                style={{
                  ...resizeHandleBaseStyle,
                  bottom: 0,
                  right: 0,
                  cursor: 'se-resize',
                  borderRadius: '3px 0 8px 0'
                }}
                onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'se')}
              />
              {/* 左下角 */}
              <div
                style={{
                  ...resizeHandleBaseStyle,
                  bottom: 0,
                  left: 0,
                  cursor: 'sw-resize',
                  borderRadius: '0 3px 8px 0'
                }}
                onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'sw')}
              />
              {/* 右上角 */}
              <div
                style={{
                  ...resizeHandleBaseStyle,
                  top: 0,
                  right: 0,
                  cursor: 'ne-resize',
                  borderRadius: '3px 0 0 8px'
                }}
                onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'ne')}
              />
              {/* 左上角 */}
              <div
                style={{
                  ...resizeHandleBaseStyle,
                  top: 0,
                  left: 0,
                  cursor: 'nw-resize',
                  borderRadius: '0 3px 0 8px'
                }}
                onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'nw')}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

// 自定义比较函数，避免不必要的重渲染
const arePropsEqual = (prevProps: MaskFrameProps, nextProps: MaskFrameProps): boolean => {
  // 比较maskFrame对象
  if (prevProps.maskFrame.left !== nextProps.maskFrame.left) return false
  if (prevProps.maskFrame.top !== nextProps.maskFrame.top) return false
  if (prevProps.maskFrame.width !== nextProps.maskFrame.width) return false
  if (prevProps.maskFrame.height !== nextProps.maskFrame.height) return false

  // 比较新增的 isMaskFrameActive 属性
  if (prevProps.isMaskFrameActive !== nextProps.isMaskFrameActive) return false

  // 回调函数通常不会改变，跳过比较
  return true
}

// 导出带有自定义比较函数的组件
const MemoizedMaskFrame = memo(MaskFrame, arePropsEqual)

export { MemoizedMaskFrame as MaskFrame }
