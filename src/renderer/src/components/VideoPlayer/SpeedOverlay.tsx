import React, { useEffect, useState } from 'react'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { useFullscreenMode } from '@renderer/hooks/features/ui/useFullscreenMode'

interface SpeedOverlayProps {
  speed: number // 当前播放速度 / Current playback speed
  visible: boolean // 是否显示覆盖层 / Whether to show the overlay
  onHide?: () => void // 隐藏回调 / Hide callback
}

/**
 * Speed feedback overlay component that displays the current playback speed in the center of the video player
 * 速度反馈覆盖层组件，在视频播放器中央显示当前播放速度
 *
 * Features:
 * - Apple-style design with frosted glass effect
 * - Automatic theme adaptation for fullscreen mode
 * - Smooth fade-in/fade-out animations
 * - Centered positioning over video content
 *
 * 特性：
 * - 苹果风格设计，带毛玻璃效果
 * - 全屏模式下自动主题适配
 * - 平滑的淡入淡出动画
 * - 视频内容上方居中定位
 */
export function SpeedOverlay({ speed, visible, onHide }: SpeedOverlayProps): React.JSX.Element {
  const { styles } = useTheme()
  const { isFullscreen } = useFullscreenMode()
  const [isAnimating, setIsAnimating] = useState(false)

  // 格式化速度显示 / Format speed display
  const formatSpeed = (speed: number): string => {
    // 使用本地化数字格式 / Use localized number format
    const locale = navigator.language || 'zh-CN'
    const formattedNumber = speed.toLocaleString(locale, {
      minimumFractionDigits: speed % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 2
    })
    return `${formattedNumber}x`
  }

  // 处理动画状态 / Handle animation state
  useEffect(() => {
    if (visible) {
      setIsAnimating(true)
      // 当visible为true时，不需要返回清理函数 / No cleanup needed when visible is true
      return
    } else {
      // 延迟隐藏以完成淡出动画 / Delay hiding to complete fade-out animation
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onHide?.()
      }, 300) // 匹配CSS动画时长 / Match CSS animation duration

      return () => clearTimeout(timer)
    }
  }, [visible, onHide])

  // 如果不可见且不在动画中，不渲染组件 / Don't render if not visible and not animating
  if (!visible && !isAnimating) {
    return <></>
  }

  // 根据全屏模式选择样式 / Select styles based on fullscreen mode
  const baseOverlayStyles = isFullscreen ? styles.speedOverlayFullscreen : styles.speedOverlay
  const animationStyles = visible ? styles.speedOverlayVisible : styles.speedOverlayHidden
  const textStyles = isFullscreen ? styles.speedOverlayTextFullscreen : styles.speedOverlayText

  // 合并样式 / Merge styles
  const overlayStyles: React.CSSProperties = {
    ...baseOverlayStyles,
    ...animationStyles
  }

  // 获取无障碍访问标签 / Get accessibility label
  const getAccessibilityLabel = (speed: number): string => {
    const locale = navigator.language || 'zh-CN'
    const formattedSpeed = formatSpeed(speed)

    // 根据语言环境返回相应的标签 / Return appropriate label based on locale
    if (locale.startsWith('zh')) {
      return `播放速度已更改为 ${formattedSpeed}`
    } else {
      return `Playback speed changed to ${formattedSpeed}`
    }
  }

  return (
    <div
      style={overlayStyles}
      role="status"
      aria-live="polite"
      aria-label={getAccessibilityLabel(speed)}
    >
      <div style={textStyles}>{formatSpeed(speed)}</div>
    </div>
  )
}
