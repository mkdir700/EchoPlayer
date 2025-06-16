import React, { useEffect, useState } from 'react'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { useFullscreenMode } from '@renderer/hooks/features/ui/useFullscreenMode'
import type { DisplayMode } from '@renderer/types'

interface SubtitleModeOverlayProps {
  mode: DisplayMode // 当前字幕模式 / Current subtitle mode
  visible: boolean // 是否显示覆盖层 / Whether to show the overlay
  onHide?: () => void // 隐藏回调 / Hide callback
}

// 字幕模式显示配置 / Subtitle mode display configuration
const SUBTITLE_MODE_LABELS: Record<DisplayMode, string> = {
  none: '隐藏字幕',
  original: '原始字幕',
  chinese: '中文字幕',
  english: '英文字幕',
  bilingual: '双语字幕'
}

/**
 * Subtitle mode feedback overlay component that displays the current subtitle mode in the center of the video player
 * 字幕模式反馈覆盖层组件，在视频播放器中央显示当前字幕模式
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
export function SubtitleModeOverlay({
  mode,
  visible,
  onHide
}: SubtitleModeOverlayProps): React.JSX.Element {
  const { styles } = useTheme()
  const { isFullscreen } = useFullscreenMode()
  const [isAnimating, setIsAnimating] = useState(false)

  // 获取模式标签 / Get mode label
  const getModeLabel = (mode: DisplayMode): string => {
    return SUBTITLE_MODE_LABELS[mode] || '未知模式'
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
  const getAccessibilityLabel = (mode: DisplayMode): string => {
    const locale = navigator.language || 'zh-CN'
    const modeLabel = getModeLabel(mode)

    // 根据语言环境返回相应的标签 / Return appropriate label based on locale
    if (locale.startsWith('zh')) {
      return `字幕模式已更改为 ${modeLabel}`
    } else {
      return `Subtitle mode changed to ${modeLabel}`
    }
  }

  return (
    <div
      style={overlayStyles}
      role="status"
      aria-live="polite"
      aria-label={getAccessibilityLabel(mode)}
    >
      <div style={textStyles}>{getModeLabel(mode)}</div>
    </div>
  )
}
