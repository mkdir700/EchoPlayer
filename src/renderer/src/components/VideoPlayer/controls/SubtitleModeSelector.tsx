import React, { useState, useEffect, useRef } from 'react'
import { Button, Tooltip } from 'antd'
import { TranslationOutlined } from '@ant-design/icons'
import type { DisplayMode } from '@renderer/types'

// 显示模式配置
const DISPLAY_MODE_CONFIG = {
  none: { label: '隐藏', color: '#ff4d4f' },
  original: { label: '原始', color: '#1890ff' },
  chinese: { label: '中文', color: '#52c41a' },
  english: { label: 'English', color: '#722ed1' },
  bilingual: { label: '双语', color: '#fa8c16' }
}

interface SubtitleModeSelectorProps {
  displayModeRef: { current: DisplayMode }
  onDisplayModeChange: (mode: DisplayMode) => void
  className?: string
  selectorClassName?: string
}

export function SubtitleModeSelector({
  displayModeRef,
  onDisplayModeChange,
  className = '',
  selectorClassName = ''
}: SubtitleModeSelectorProps): React.JSX.Element {
  const [showSubtitleModeSelector, setShowSubtitleModeSelector] = useState(false)
  const subtitleModeSelectorRef = useRef<HTMLDivElement>(null)

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
  const validDisplayMode = Object.keys(DISPLAY_MODE_CONFIG).includes(displayModeRef.current)
    ? displayModeRef.current
    : 'bilingual'
  const currentModeConfig = DISPLAY_MODE_CONFIG[validDisplayMode]

  return (
    <div className={className}>
      {/* 字幕模式切换按钮 */}
      <Tooltip title={`字幕模式: ${currentModeConfig.label} (点击切换)`}>
        <Button
          type="text"
          size="small"
          icon={<TranslationOutlined />}
          onClick={(e) => {
            setShowSubtitleModeSelector(!showSubtitleModeSelector)
            e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
          }}
          style={{ color: currentModeConfig.color }}
          className={`${showSubtitleModeSelector ? 'active' : ''}`}
        />
      </Tooltip>

      {/* 展开的模式选择器 */}
      {showSubtitleModeSelector && (
        <div className={selectorClassName} ref={subtitleModeSelectorRef}>
          {Object.entries(DISPLAY_MODE_CONFIG).map(([mode, config]) => (
            <Button
              key={mode}
              type={displayModeRef.current === mode ? 'primary' : 'text'}
              size="small"
              onClick={() => {
                onDisplayModeChange(mode as DisplayMode)
                setShowSubtitleModeSelector(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                color: displayModeRef.current === mode ? '#fff' : config.color,
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
