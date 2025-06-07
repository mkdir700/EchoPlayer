import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { TranslationOutlined } from '@ant-design/icons'
import type { DisplayMode } from '@renderer/types'
import { useTheme } from '@renderer/hooks/useTheme'
import { useSubtitleDisplayModeControls } from '@renderer/hooks/useSubtitleDisplayMode'
import { useShortcutCommand } from '@renderer/hooks/useCommandShortcuts'
import { useSubtitleDisplayMode } from '@renderer/hooks/useVideoPlaybackHooks'
import { RendererLogger } from '@renderer/utils/logger'

// 字幕显示模式配置 - 遵循苹果设计美学
const DISPLAY_MODE_CONFIG = {
  none: { label: '隐藏' },
  original: { label: '原始' },
  chinese: { label: '中文' },
  english: { label: '原文' },
  bilingual: { label: '双语' }
}

interface SubtitleModeSelectorProps {
  variant?: 'compact' | 'fullscreen'
}

/**
 * Renders a subtitle mode selector that allows users to switch between different subtitle display modes with a UI styled according to Apple design principles and the application's theme.
 *
 * The selector provides options such as none, original, Chinese, English, and bilingual subtitles. It ensures accessibility, keyboard shortcut support, and robust handling of invalid display modes by defaulting to bilingual. The component manages focus and click-outside behavior for an optimal user experience.
 *
 * @param variant - Display variant: 'compact' for compact mode, 'fullscreen' for fullscreen mode.
 * @returns The rendered subtitle mode selector component.
 */
export function SubtitleModeSelector({
  variant = 'compact'
}: SubtitleModeSelectorProps): React.JSX.Element {
  const { styles, token } = useTheme()
  // 使用新的订阅模式 hooks
  const { setDisplayMode, toggleDisplayMode } = useSubtitleDisplayModeControls()
  const displayMode = useSubtitleDisplayMode()
  // 注册快捷键 - 使用稳定的引用避免重新绑定
  useShortcutCommand('toggleSubtitleMode', toggleDisplayMode)

  const [showSubtitleModeSelector, setShowSubtitleModeSelector] = useState(false)
  const subtitleModeSelectorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSubtitleModeSelectorClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setShowSubtitleModeSelector((prev) => !prev)
      e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
    },
    [] // 移除依赖，使用函数式更新
  )

  // 点击外部关闭字幕模式选择器 - 增强用户体验的交互设计
  // 遵循苹果设计指南中的即时反馈原则
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSubtitleModeSelector(false)
      }
    }

    if (showSubtitleModeSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSubtitleModeSelector])

  // 获取当前模式的配置 - 确保即使遇到无效模式也能提供合理的默认值
  // 这种防御性编程方式提高了组件的健壮性
  const validDisplayMode = Object.keys(DISPLAY_MODE_CONFIG).includes(displayMode)
    ? displayMode
    : 'bilingual'
  const currentModeConfig = DISPLAY_MODE_CONFIG[validDisplayMode]

  // 根据变体类型选择样式 / Choose styles based on variant type
  const getButtonStyles = (): React.CSSProperties => {
    const baseStyles = {
      fontSize: token.fontSizeLG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }

    if (variant === 'fullscreen') {
      // 全屏模式使用主题系统样式 / Fullscreen mode uses theme system styles
      return {
        ...styles.fullscreenControlBtn,
        ...(showSubtitleModeSelector ? styles.fullscreenControlBtnActive : {}),
        ...baseStyles
      }
    }

    // 默认紧凑模式样式 / Default compact mode styles
    return {
      ...styles.controlBtn,
      ...(showSubtitleModeSelector ? styles.controlBtnActive : {}),
      ...baseStyles
    }
  }

  // 获取弹出窗口样式 - 在全屏模式下强制使用暗黑主题
  const getSelectorStyles = (): React.CSSProperties => {
    const baseStyles = {
      ...styles.subtitleModeSelector,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      animation: `${token.motionDurationMid} ${token.motionEaseOut} fadeIn`,
      transform: 'translateY(0)',
      opacity: 1,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`
    }

    if (variant === 'fullscreen') {
      // 全屏模式强制使用暗黑主题
      return {
        ...baseStyles,
        background: 'rgba(20, 20, 20, 0.95)', // 强制使用暗色背景
        border: '1px solid rgba(255, 255, 255, 0.1)', // 暗色边框
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)', // 更深的阴影
        color: 'rgba(255, 255, 255, 0.9)' // 强制使用白色文字
      }
    }

    // 默认主题色
    return {
      ...baseStyles,
      boxShadow: `0 8px 24px rgba(0, 0, 0, 0.12)`,
      border: `1px solid ${token.colorBorderSecondary}`
    }
  }

  // 获取选项按钮样式 - 在全屏模式下强制使用暗黑主题
  const getOptionButtonStyles = (mode: string): React.CSSProperties => {
    const isActive = displayMode === mode

    const baseStyles = {
      width: '100%',
      textAlign: 'left' as const,
      marginBottom: token.marginXXS,
      padding: `${token.paddingXS}px ${token.paddingSM}px`,
      borderRadius: token.borderRadiusSM,
      fontSize: token.fontSizeSM,
      fontWeight: isActive ? 600 : 400,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`
    }

    if (variant === 'fullscreen') {
      // 全屏模式强制使用暗黑主题
      return {
        ...baseStyles,
        background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        color: 'rgba(255, 255, 255, 0.9)',
        boxShadow: isActive ? '0 2px 8px rgba(255, 255, 255, 0.3)' : 'none'
      }
    }

    // 默认主题色
    return {
      ...baseStyles,
      boxShadow: isActive ? `0 2px 8px ${token.colorPrimary}30` : 'none'
    }
  }

  // 记录组件状态和样式使用情况，便于调试
  RendererLogger.debug(
    `SubtitleModeSelector: 当前显示模式=${displayMode}, 有效模式=${validDisplayMode}, variant=${variant}`
  )
  RendererLogger.debug(
    `SubtitleModeSelector: 样式使用情况 - subtitleModeControl=${!!styles.subtitleModeControl}, subtitleModeSelector=${!!styles.subtitleModeSelector}`
  )

  return (
    <div style={styles.subtitleModeControl} ref={containerRef}>
      {/* 字幕模式切换按钮 */}
      <Tooltip
        title={`字幕模式: ${currentModeConfig.label}`}
        open={showSubtitleModeSelector ? false : undefined}
        placement="top"
      >
        <Button
          type="text"
          size="small"
          icon={<TranslationOutlined />}
          onClick={handleSubtitleModeSelectorClick}
          style={getButtonStyles()}
        />
      </Tooltip>

      {/* 展开的模式选择器 - 使用毛玻璃效果和平滑过渡动画 */}
      {showSubtitleModeSelector && (
        <div
          // 响应式设计 - 确保在不同屏幕尺寸下的良好表现
          style={getSelectorStyles()}
          ref={subtitleModeSelectorRef}
        >
          {Object.entries(DISPLAY_MODE_CONFIG).map(([mode, config]) => {
            const isActive = displayMode === mode
            return (
              <Button
                key={mode}
                type={isActive ? 'primary' : 'text'}
                size="small"
                onClick={() => {
                  setDisplayMode(mode as DisplayMode)
                  setShowSubtitleModeSelector(false)
                }}
                style={getOptionButtonStyles(mode)}
              >
                {config.label}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
