import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Tooltip } from 'antd'
import { TranslationOutlined } from '@ant-design/icons'
import type { DisplayMode } from '@renderer/types'
import styles from '../VideoControlsCompact.module.css'
import { useSubtitleDisplayModeControls } from '@renderer/hooks/useSubtitleDisplayMode'
import { useShortcutCommand } from '@renderer/hooks/useCommandShortcuts'
import { useSubtitleDisplayMode } from '@renderer/hooks/useVideoPlaybackSettingsHooks'
import { RendererLogger } from '@renderer/utils/logger'

// 显示模式配置
const DISPLAY_MODE_CONFIG = {
  none: { label: '隐藏' },
  original: { label: '原始' },
  chinese: { label: '中文' },
  english: { label: 'English' },
  bilingual: { label: '双语' }
}

export function SubtitleModeSelector(): React.JSX.Element {
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

  // 点击外部关闭字幕模式选择器
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

  // 获取当前模式的配置
  const validDisplayMode = Object.keys(DISPLAY_MODE_CONFIG).includes(displayMode)
    ? displayMode
    : 'bilingual'
  const currentModeConfig = DISPLAY_MODE_CONFIG[validDisplayMode]

  RendererLogger.debug(`SubtitleModeSelector, displayMode: ${displayMode}`)
  return (
    <div className={styles.subtitleModeControl}>
      {/* 字幕模式切换按钮 */}
      <Tooltip
        title={`字幕模式: ${currentModeConfig.label}`}
        open={showSubtitleModeSelector ? false : undefined}
      >
        <Button
          type="text"
          size="small"
          icon={<TranslationOutlined />}
          onClick={handleSubtitleModeSelectorClick}
          className={`${styles.controlBtn} ${showSubtitleModeSelector ? styles.activeBtn : ''}`}
        />
      </Tooltip>

      {/* 展开的模式选择器 */}
      {showSubtitleModeSelector && (
        <div className={styles.controlPopup} ref={subtitleModeSelectorRef}>
          {Object.entries(DISPLAY_MODE_CONFIG).map(([mode, config]) => (
            <Button
              key={mode}
              type={displayMode === mode ? 'primary' : 'text'}
              size="small"
              onClick={() => {
                setDisplayMode(mode as DisplayMode)
                setShowSubtitleModeSelector(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              {config.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
