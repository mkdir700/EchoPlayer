import React, { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button, Tooltip, Checkbox, Space } from 'antd'
import { ThunderboltOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'
import { useTheme } from '@renderer/hooks/useTheme'
import { usePlaybackRate } from '@renderer/hooks/useVideoPlaybackSettingsHooks'

interface PlaybackRateSelectorProps {
  isVideoLoaded: boolean
  variant?: 'compact' | 'fullscreen' // Display variant - 显示变体
  className?: string // Custom CSS class name - 自定义CSS类名
}

// Predefined playback speed options - 预定义的播放速度选项
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

interface DropdownPosition {
  left: number
  top: number
  showBelow?: boolean // Flag to indicate if showing below button - 标记是否在按钮下方显示
}

/**
 * Renders a playback rate selector for a video player, allowing users to customize available playback speeds and quickly switch between them.
 * 为视频播放器渲染播放速度选择器，允许用户自定义可用的播放速度并快速切换。
 *
 * Provides a dropdown panel where users can select which playback speeds are available for quick access. The current playback rate can be changed instantly via quick-select buttons. If the currently active speed is deselected, playback automatically switches to the next available selected speed.
 * 提供一个下拉面板，用户可以选择哪些播放速度可用于快速访问。当前播放速度可以通过快速选择按钮立即更改。如果当前活动速度被取消选择，播放会自动切换到下一个可用的选定速度。
 *
 * @param isVideoLoaded - Whether a video is currently loaded and playback controls should be enabled. - 是否已加载视频且应启用播放控件
 * @param variant - Display variant: 'compact' for compact mode, 'fullscreen' for fullscreen mode. - 显示变体：'compact'为紧凑模式，'fullscreen'为全屏模式
 * @param className - Optional CSS class name to override default styles. - 可选的CSS类名以覆盖默认样式
 * @returns The rendered playback rate selector component. - 渲染的播放速度选择器组件
 */
export function PlaybackRateSelector({
  isVideoLoaded,
  variant = 'compact',
  className
}: PlaybackRateSelectorProps): React.JSX.Element {
  const { styles, token } = useTheme()
  const { playerRef, isVideoLoadedRef } = useVideoPlayerContext()
  const playbackRate = usePlaybackRate()
  const { updatePlaybackRate } = useVideoPlaybackSettingsContext()

  // Control dropdown panel visibility state - 控制下拉面板显示状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Manage which speed options are checked (default common ones) - 管理哪些速度选项被勾选（默认勾选常用的几个）
  const [selectedRates, setSelectedRates] = useState<Set<number>>(new Set([0.75, 1, 1.25, 1.5, 2]))

  // Dropdown panel position state - 下拉面板位置状态
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    left: 0,
    top: 0,
    showBelow: false
  })

  // refs for positioning calculation - 用于位置计算的refs
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Calculate dropdown position using useLayoutEffect - 使用useLayoutEffect计算下拉位置
  useLayoutEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const calculatePosition = (): void => {
        const buttonRect = buttonRef.current!.getBoundingClientRect()
        const dropdownHeight = 300 // Estimated dropdown height - 估算的弹窗高度
        const dropdownWidth = 400 // Dropdown width - 弹窗宽度
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const spaceAbove = buttonRect.top
        const spaceBelow = viewportHeight - buttonRect.bottom

        // Smart positioning logic - 智能选择弹出方向
        const shouldShowBelow = spaceAbove < dropdownHeight && spaceBelow > spaceAbove

        // Horizontal position adjustment to prevent overflow - 水平位置调整，防止溢出屏幕
        let adjustedLeft = buttonRect.left
        if (adjustedLeft + dropdownWidth > viewportWidth) {
          // If overflowing right, align to right - 如果右侧溢出，调整到右对齐
          adjustedLeft = Math.max(0, viewportWidth - dropdownWidth - 16)
        }
        if (adjustedLeft < 0) {
          // If overflowing left, align to left - 如果左侧溢出，调整到左对齐
          adjustedLeft = 16
        }

        const newPosition = shouldShowBelow
          ? {
              left: adjustedLeft,
              top: buttonRect.bottom + 8,
              showBelow: true
            }
          : {
              left: adjustedLeft,
              top: buttonRect.top - 8,
              showBelow: false
            }

        setDropdownPosition(newPosition)
      }

      // Calculate position immediately - 立即计算位置
      calculatePosition()

      // If dropdown not rendered yet, recalculate next frame - 如果dropdown还没有渲染，等待下一帧再计算
      if (!dropdownRef.current) {
        requestAnimationFrame(calculatePosition)
      }
    }
  }, [isDropdownOpen])

  const handlePlaybackRateChange = useCallback(
    (value: number) => {
      console.log('播放速度变化:', value)
      updatePlaybackRate(value)
      // Directly control player playback speed - 直接控制播放器的播放速度
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
          // If current playback speed is deselected, switch to a selected speed - 如果当前播放速度被取消勾选，需要切换到一个已勾选的速度
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

  // Get currently selected playback speed options for display - 获取当前选中的播放速度选项用于显示
  const selectedOptions = SPEED_OPTIONS.filter((option) => selectedRates.has(option.value))
  const currentOption = SPEED_OPTIONS.find((option) => option.value === playbackRate)

  // Click outside to close dropdown - 点击外部关闭下拉框
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

  // Get button styles based on variant - 根据变体类型选择样式
  const getButtonStyle = (): React.CSSProperties => {
    if (className) {
      // If custom class name provided, return empty object to let CSS class control styles - 如果提供了自定义类名，返回空对象让CSS类名控制样式
      return {}
    }

    switch (variant) {
      case 'fullscreen':
        return styles.playbackRateButtonFullscreen
      case 'compact':
        return styles.playbackRateButtonCompact
      default:
        return styles.playbackRateButton
    }
  }

  // Get popup styles based on variant - 根据变体类型获取弹窗样式
  const getPopupStyle = (): React.CSSProperties => {
    const baseStyle =
      variant === 'fullscreen' ? styles.playbackRatePopupFullscreen : styles.playbackRatePopup

    return {
      ...baseStyle,
      left: `${dropdownPosition.left}px`,
      top: `${dropdownPosition.top}px`,
      transform: dropdownPosition.showBelow ? 'translateY(0)' : 'translateY(-100%)'
    }
  }

  // Get text color based on variant - 根据变体获取文本颜色
  const getTextColor = (): string => {
    if (variant === 'fullscreen') {
      return 'rgba(255, 255, 255, 0.9)' // Fullscreen mode forced white text - 全屏模式强制白色文字
    }
    return token.colorText
  }

  // Get config item style with fullscreen support - 获取配置项样式并支持全屏模式
  const getConfigItemStyle = (
    option: (typeof SPEED_OPTIONS)[0],
    isSelected: boolean
  ): React.CSSProperties => {
    const baseStyle = { ...styles.playbackRateConfigItem }

    if (variant === 'fullscreen') {
      baseStyle.background = isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'
      baseStyle.border = `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
      baseStyle.color = 'rgba(255, 255, 255, 0.9)'
    } else if (isSelected) {
      return { ...baseStyle, ...styles.playbackRateConfigItemSelected }
    }

    // Highlight current rate - 高亮当前速度
    if (option.value === playbackRate) {
      if (variant === 'fullscreen') {
        baseStyle.fontWeight = 600
        baseStyle.color = '#007AFF' // Use primary color even in fullscreen - 即使在全屏模式也使用主色
      } else {
        return { ...baseStyle, ...styles.playbackRateConfigItemCurrent }
      }
    }

    return baseStyle
  }

  return (
    <div style={{ ...styles.playbackRateControl, zIndex: 'auto' }} data-playback-rate-selector>
      <Tooltip title="播放速度设置">
        <Button
          ref={buttonRef}
          size="small"
          disabled={!isVideoLoaded}
          icon={<ThunderboltOutlined />}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={getButtonStyle()}
          className={className}
        >
          <span
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '12px',
              color: getTextColor()
            }}
          >
            {currentOption?.label || '1x'}
          </span>
          {isDropdownOpen ? (
            <DownOutlined style={{ fontSize: '10px', flexShrink: 0, color: getTextColor() }} />
          ) : (
            <UpOutlined style={{ fontSize: '10px', flexShrink: 0, color: getTextColor() }} />
          )}
        </Button>
      </Tooltip>

      {/* Dropdown selection panel - Portal rendered to body - 下拉选择面板 - 使用 Portal 渲染到 body */}
      {isDropdownOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={getPopupStyle()}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
          >
            {/* All options configuration area - horizontal grid layout - 所有选项配置区域 - 横向网格布局 */}
            <div style={styles.playbackRateConfigSection}>
              <div
                style={{
                  fontSize: token.fontSizeSM,
                  color:
                    variant === 'fullscreen'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : token.colorTextSecondary,
                  marginBottom: token.marginXS,
                  fontWeight: 500
                }}
              >
                选择可用速度:
              </div>
              <div style={styles.playbackRateConfigGrid}>
                {SPEED_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    style={getConfigItemStyle(option, selectedRates.has(option.value))}
                    onClick={() =>
                      handleRateSelection(option.value, !selectedRates.has(option.value))
                    }
                  >
                    <span
                      style={{
                        fontSize: token.fontSizeSM,
                        fontWeight: option.value === playbackRate ? 600 : 500,
                        flex: 1,
                        userSelect: 'none'
                      }}
                    >
                      {option.label}
                    </span>
                    <Checkbox
                      checked={selectedRates.has(option.value)}
                      onChange={() => {}} // Empty function, actual click handled by parent div - 空函数，实际点击由父div处理
                      style={{
                        marginLeft: '4px',
                        pointerEvents: 'none' // Disable direct checkbox clicks - 禁用checkbox的直接点击
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider - 分隔线 */}
            {selectedOptions.length > 0 && <div style={styles.playbackRateDivider} />}

            {/* Quick selection area - show checked options - 快速选择区域 - 显示已勾选的选项 */}
            {selectedOptions.length > 0 && (
              <div style={styles.playbackRateQuickSection}>
                <div
                  style={{
                    fontSize: token.fontSizeSM,
                    color:
                      variant === 'fullscreen'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : token.colorTextSecondary,
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
                          ...styles.playbackRateQuickButton,
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
          </div>,
          document.body
        )}
    </div>
  )
}
