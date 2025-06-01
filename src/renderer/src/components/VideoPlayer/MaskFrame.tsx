import React, { useEffect } from 'react'
import type { SubtitleMarginsState } from '@renderer/hooks/useSubtitleState'
import { useMaskFrame } from '@renderer/hooks/useMaskFrame'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import styles from './Subtitle.module.css'
import RendererLogger from '@renderer/utils/logger'

interface MaskFrameProps {
  maskFrame: SubtitleMarginsState['maskFrame']
  updateMaskFrame: (maskFrame: SubtitleMarginsState['maskFrame']) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  onResetToVideo?: () => void
}

export function MaskFrame({
  maskFrame,
  updateMaskFrame,
  containerRef,
  onResetToVideo
}: MaskFrameProps): React.JSX.Element {
  const { displayAspectRatio } = usePlayingVideoContext()
  const maskFrameController = useMaskFrame(maskFrame, updateMaskFrame, containerRef)

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
  }, [
    maskFrameController.isDragging,
    maskFrameController.isResizing,
    maskFrameController.handleMouseMove,
    maskFrameController.handleMouseUp
  ])

  // 重置定位框到视频区域
  const handleResetToVideo = (): void => {
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
      className={styles.maskFrame}
      style={{
        position: 'absolute',
        left: `${maskFrame.left}%`,
        top: `${maskFrame.top}%`,
        width: `${maskFrame.width}%`,
        height: `${maskFrame.height}%`,
        border:
          maskFrameController.isHovering ||
          maskFrameController.isDragging ||
          maskFrameController.isResizing
            ? '2px dashed rgba(102, 126, 234, 0.8)'
            : 'none',
        backgroundColor: 'transparent',
        zIndex: 6,
        pointerEvents: 'auto', // 允许鼠标事件
        borderRadius: '8px',
        transition:
          maskFrameController.isDragging || maskFrameController.isResizing
            ? 'none'
            : 'all 0.3s ease-in-out',
        cursor: maskFrameController.isDragging ? 'grabbing' : 'grab',
        // 确保定位框在窗口变化时保持可见性
        minWidth: '10%',
        minHeight: '10%',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      onMouseDown={maskFrameController.handleMouseDown}
      onMouseEnter={maskFrameController.handleMouseEnter}
      onMouseLeave={maskFrameController.handleMouseLeave}
    >
      {/* 提示文字 - 只在悬停时显示 */}
      {maskFrameController.isHovering && (
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
      )}

      {/* 重置按钮 */}
      {maskFrameController.isHovering && (
        <button
          onClick={handleResetToVideo}
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'rgba(102, 126, 234, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10,
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.8)'
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
            className={`${styles.resizeHandle} ${styles.resizeHandleSE}`}
            onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'se')}
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
            onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'sw')}
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
            onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'ne')}
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
            onMouseDown={(e) => maskFrameController.handleResizeMouseDown(e, 'nw')}
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
  )
}
