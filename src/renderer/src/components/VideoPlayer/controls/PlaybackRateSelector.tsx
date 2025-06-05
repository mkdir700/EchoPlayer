import React, { useCallback, useState, useEffect } from 'react'
import { Button, Tooltip, Checkbox, Space } from 'antd'
import { ThunderboltOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'
import { useTheme } from '@renderer/hooks/useTheme'
import { usePlaybackRate } from '@renderer/hooks/useVideoPlaybackSettingsHooks'

interface PlaybackRateSelectorProps {
  isVideoLoaded: boolean
}

// 预定义的播放速度选项
const SPEED_OPTIONS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2, label: '2x' }
]

export function PlaybackRateSelector({
  isVideoLoaded
}: PlaybackRateSelectorProps): React.JSX.Element {
  const { styles, token } = useTheme()
  const { playerRef, isVideoLoadedRef } = useVideoPlayerContext()
  const playbackRate = usePlaybackRate()
  const { updatePlaybackRate } = useVideoPlaybackSettingsContext()

  // 控制下拉面板显示状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // 管理哪些速度选项被勾选（默认勾选常用的几个）
  const [selectedRates, setSelectedRates] = useState<Set<number>>(new Set([0.75, 1, 1.25, 1.5, 2]))

  const handlePlaybackRateChange = useCallback(
    (value: number) => {
      console.log('播放速度变化:', value)
      updatePlaybackRate(value)
      // 直接控制播放器的播放速度
      if (playerRef.current && isVideoLoadedRef.current) {
        console.log('设置播放速度:', value)
        const internalPlayer = playerRef.current.getInternalPlayer()
        if (internalPlayer && 'playbackRate' in internalPlayer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(internalPlayer as any).playbackRate = value
        }
      }
    },
    [updatePlaybackRate, playerRef, isVideoLoadedRef]
  )

  const handleRateSelection = useCallback(
    (rate: number, checked: boolean): void => {
      setSelectedRates((prev) => {
        const newSet = new Set(prev)
        if (checked) {
          newSet.add(rate)
        } else {
          newSet.delete(rate)
          // 如果当前播放速度被取消勾选，需要切换到一个已勾选的速度
          if (rate === playbackRate && newSet.size > 0) {
            const firstSelectedRate = Array.from(newSet)[0]
            handlePlaybackRateChange(firstSelectedRate)
          }
        }
        return newSet
      })
    },
    [playbackRate, handlePlaybackRateChange]
  )

  const handleCurrentRateClick = useCallback(
    (rate: number) => {
      handlePlaybackRateChange(rate)
      setIsDropdownOpen(false)
    },
    [handlePlaybackRateChange]
  )

  // 获取当前选中的播放速度选项用于显示
  const selectedOptions = SPEED_OPTIONS.filter((option) => selectedRates.has(option.value))
  const currentOption = SPEED_OPTIONS.find((option) => option.value === playbackRate)

  // 点击外部关闭下拉框
  useEffect((): (() => void) | void => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element
      if (!target.closest('[data-playback-rate-selector]')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return (): void => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <div style={{ ...styles.playbackRateControl, zIndex: 'auto' }} data-playback-rate-selector>
      <Tooltip title="播放速度设置">
        <Button
          size="small"
          disabled={!isVideoLoaded}
          icon={<ThunderboltOutlined />}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            width: '80px',
            height: '30px',
            fontSize: styles.playbackRateSelect.fontSize,
            padding: '0 8px',
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadius,
            background: token.colorBgContainer,
            cursor: 'pointer',
            transition: `all ${token.motionDurationMid} ease`,
            flexShrink: 0,
            color: token.colorText
          }}
          onMouseEnter={(e) => {
            if (!isVideoLoaded) return
            e.currentTarget.style.background = token.colorBgTextHover
            e.currentTarget.style.borderColor = token.colorPrimaryHover
          }}
          onMouseLeave={(e) => {
            if (!isVideoLoaded) return
            e.currentTarget.style.background = token.colorBgContainer
            e.currentTarget.style.borderColor = token.colorBorder
          }}
        >
          <span style={{ flex: 1, textAlign: 'center', fontSize: '12px' }}>
            {currentOption?.label || '1x'}
          </span>
          {isDropdownOpen ? (
            <DownOutlined style={{ fontSize: '10px', flexShrink: 0 }} />
          ) : (
            <UpOutlined style={{ fontSize: '10px', flexShrink: 0 }} />
          )}
        </Button>
      </Tooltip>

      {/* 下拉选择面板 */}
      {isDropdownOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 'auto',
            top: 'auto',
            left: 'auto',
            right: 'auto',
            transform: 'translateY(-100%)',
            background: token.colorBgElevated,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: styles.controlPopup.borderRadius,
            boxShadow: styles.controlPopup.boxShadow,
            backdropFilter: styles.controlPopup.backdropFilter,
            zIndex: 9999,
            minWidth: '400px',
            maxWidth: '480px',
            padding: '12px 16px'
          }}
          ref={(element) => {
            if (element) {
              // 动态计算位置，确保面板显示在按钮上方
              const button = element.parentElement?.querySelector('button')
              if (button) {
                const buttonRect = button.getBoundingClientRect()
                element.style.left = `${buttonRect.left}px`
                element.style.top = `${buttonRect.top - 8}px`
              }
            }
          }}
        >
          {/* 所有选项配置区域 - 横向网格布局 */}
          <div>
            <div
              style={{
                fontSize: token.fontSizeSM,
                color: token.colorTextSecondary,
                marginBottom: token.marginXS,
                fontWeight: 500
              }}
            >
              选择可用速度:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px'
              }}
            >
              {SPEED_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  style={{
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: `1px solid ${selectedRates.has(option.value) ? token.colorPrimary : token.colorBorder}`,
                    background: selectedRates.has(option.value)
                      ? token.colorPrimaryBg
                      : token.colorBgContainer,
                    transition: 'all 0.15s ease',
                    minHeight: '32px'
                  }}
                  onClick={() =>
                    handleRateSelection(option.value, !selectedRates.has(option.value))
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = selectedRates.has(option.value)
                      ? token.colorPrimaryBg
                      : token.colorBgTextHover
                    e.currentTarget.style.borderColor = token.colorPrimary
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = token.boxShadowSecondary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selectedRates.has(option.value)
                      ? token.colorPrimaryBg
                      : token.colorBgContainer
                    e.currentTarget.style.borderColor = selectedRates.has(option.value)
                      ? token.colorPrimary
                      : token.colorBorder
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span
                    style={{
                      fontSize: token.fontSizeSM,
                      fontWeight: option.value === playbackRate ? 600 : 500,
                      color: option.value === playbackRate ? token.colorPrimary : token.colorText,
                      flex: 1,
                      userSelect: 'none'
                    }}
                  >
                    {option.label}
                  </span>
                  <Checkbox
                    checked={selectedRates.has(option.value)}
                    onChange={() => {}} // 空函数，实际点击由父div处理
                    style={{
                      marginLeft: '4px',
                      pointerEvents: 'none' // 禁用checkbox的直接点击
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* 分隔线 */}
          {selectedOptions.length > 0 && (
            <div
              style={{
                height: '1px',
                background: token.colorBorderSecondary,
                margin: `0 0 ${token.marginSM}px`
              }}
            />
          )}
          {/* 快速选择区域 - 显示已勾选的选项 */}
          {selectedOptions.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: token.fontSizeSM,
                  color: token.colorTextSecondary,
                  marginBottom: token.marginXS,
                  fontWeight: 500
                }}
              >
                快速选择:
              </div>
              <div>
                <Space wrap size={6}>
                  {selectedOptions.map((option) => (
                    <Button
                      key={`quick-${option.value}`}
                      size="small"
                      type={option.value === playbackRate ? 'primary' : 'default'}
                      onClick={() => handleCurrentRateClick(option.value)}
                      style={{
                        height: '28px',
                        fontSize: '12px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        fontWeight: option.value === playbackRate ? 600 : 'normal'
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Space>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
