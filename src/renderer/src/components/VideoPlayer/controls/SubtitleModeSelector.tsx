import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { TranslationOutlined } from '@ant-design/icons'
import type { DisplayMode } from '@renderer/types'
import { useTheme } from '@renderer/hooks/useTheme'
import { useSubtitleDisplayModeControls } from '@renderer/hooks/useSubtitleDisplayMode'
import { useShortcutCommand } from '@renderer/hooks/useCommandShortcuts'
import { useSubtitleDisplayMode } from '@renderer/hooks/useVideoPlaybackSettingsHooks'
import { RendererLogger } from '@renderer/utils/logger'

// 字幕显示模式配置 - 遵循苹果设计美学
const DISPLAY_MODE_CONFIG = {
  none: { label: '隐藏' },
  original: { label: '原始' },
  chinese: { label: '中文' },
  english: { label: '原文' },
  bilingual: { label: '双语' }
}

/**
 * Renders a subtitle mode selector that allows users to switch between different subtitle display modes with a UI styled according to Apple design principles and the application's theme.
 *
 * The selector provides options such as none, original, Chinese, English, and bilingual subtitles. It ensures accessibility, keyboard shortcut support, and robust handling of invalid display modes by defaulting to bilingual. The component manages focus and click-outside behavior for an optimal user experience.
 *
 * @returns The rendered subtitle mode selector component.
 */
export function SubtitleModeSelector(): React.JSX.Element {
  const { styles, token } = useTheme()
  // 使用新的订阅模式 hooks
  const { setDisplayMode, toggleDisplayMode } = useSubtitleDisplayModeControls()
  const displayMode = useSubtitleDisplayMode()
  // 注册快捷键 - 使用稳定的引用避免重新绑定
  useShortcutCommand('toggleSubtitleMode', toggleDisplayMode)

  const [showSubtitleModeSelector, setShowSubtitleModeSelector] = useState(false)
  const subtitleModeSelectorRef = useRef<HTMLDivElement>(null)

  const handleSubtitleModeSelectorClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setShowSubtitleModeSelector(!showSubtitleModeSelector)
      e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
    },
    [showSubtitleModeSelector]
  )

  // 点击外部关闭字幕模式选择器 - 增强用户体验的交互设计
  // 遵循苹果设计指南中的即时反馈原则
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        subtitleModeSelectorRef.current &&
        !subtitleModeSelectorRef.current.contains(event.target as Node)
      ) {
        setShowSubtitleModeSelector(false)
      }
    }

    if (showSubtitleModeSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
    return undefined
  }, [showSubtitleModeSelector])

  // 获取当前模式的配置 - 确保即使遇到无效模式也能提供合理的默认值
  // 这种防御性编程方式提高了组件的健壮性
  const validDisplayMode = Object.keys(DISPLAY_MODE_CONFIG).includes(displayMode)
    ? displayMode
    : 'bilingual'
  const currentModeConfig = DISPLAY_MODE_CONFIG[validDisplayMode]

  // 记录组件状态和样式使用情况，便于调试
  RendererLogger.debug(
    `SubtitleModeSelector: 当前显示模式=${displayMode}, 有效模式=${validDisplayMode}`
  )
  RendererLogger.debug(
    `SubtitleModeSelector: 样式使用情况 - subtitleModeControl=${!!styles.subtitleModeControl}, subtitleModeSelector=${!!styles.subtitleModeSelector}`
  )
  return (
    <div style={styles.subtitleModeControl}>
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
          style={{
            ...styles.controlBtn,
            ...(showSubtitleModeSelector ? styles.controlBtnActive : {}),
            fontSize: token.fontSizeLG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Tooltip>

      {/* 展开的模式选择器 - 使用毛玻璃效果和平滑过渡动画 */}
      {showSubtitleModeSelector && (
        <div
          // 响应式设计 - 确保在不同屏幕尺寸下的良好表现
          style={{
            ...styles.subtitleModeSelector,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.12)`,
            border: `1px solid ${token.colorBorderSecondary}`,
            animation: `${token.motionDurationMid} ${token.motionEaseOut} fadeIn`,
            transform: 'translateY(0)',
            opacity: 1,
            transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`
          }}
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
                style={{
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: token.marginXXS,
                  padding: `${token.paddingXS}px ${token.paddingSM}px`,
                  borderRadius: token.borderRadiusSM,
                  fontSize: token.fontSizeSM,
                  fontWeight: isActive ? 600 : 400,
                  transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
                  boxShadow: isActive ? `0 2px 8px ${token.colorPrimary}30` : 'none'
                }}
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
