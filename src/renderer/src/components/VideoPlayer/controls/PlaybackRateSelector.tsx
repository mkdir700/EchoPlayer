import React, { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button, Tooltip, Checkbox, Space } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useVideoPlayerContext } from '@renderer/hooks/core/useVideoPlayerContext'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { useVideoConfig } from '@renderer/hooks/features/video/useVideoConfig'
import {
  useSelectedPlaybackRates,
  useSetSelectedPlaybackRates
} from '@renderer/stores/slices/videoConfigStore'
import { usePlayingVideoContext } from '@renderer/hooks/core/usePlayingVideoContext'

interface PlaybackRateSelectorProps {
  isVideoLoaded: boolean
  variant?: 'compact' | 'fullscreen' // Display variant - 显示变体
  className?: string // Custom CSS class name - 自定义CSS类名
}

// Predefined playback speed options - 预定义的播放速度选项
const SPEED_OPTIONS = [
  { value: 0.25, label: '0.25' },
  { value: 0.5, label: '0.5' },
  { value: 0.75, label: '0.75' },
  { value: 1, label: '1' },
  { value: 1.25, label: '1.25' },
  { value: 1.5, label: '1.5' },
  { value: 1.75, label: '1.75' },
  { value: 2, label: '2' }
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
  const { styles } = useTheme()
  const { playerRef, isVideoLoadedRef } = useVideoPlayerContext()
  const { playbackRate, setPlaybackRate: updatePlaybackRate } = useVideoConfig()
  const { fileId } = usePlayingVideoContext()
  const selectedPlaybackRates = useSelectedPlaybackRates(fileId || '')
  const setSelectedPlaybackRates = useSetSelectedPlaybackRates()

  // Control dropdown panel visibility state - 控制下拉面板显示状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
        // Use smaller width in fullscreen mode to prevent overflow - 全屏模式下使用更小的宽度以防止溢出
        const dropdownWidth = variant === 'fullscreen' ? 320 : 400 // Dropdown width - 弹窗宽度
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const spaceAbove = buttonRect.top
        const spaceBelow = viewportHeight - buttonRect.bottom

        // Smart positioning logic - 智能选择弹出方向
        const shouldShowBelow = spaceAbove < dropdownHeight && spaceBelow > spaceAbove

        // Enhanced horizontal position adjustment for fullscreen mode - 增强的水平位置调整，特别针对全屏模式
        let adjustedLeft = buttonRect.left

        if (variant === 'fullscreen') {
          // In fullscreen mode, prefer right alignment to avoid overflow - 全屏模式下优先使用右对齐以避免溢出
          const spaceOnRight = viewportWidth - buttonRect.right
          const spaceOnLeft = buttonRect.left

          if (spaceOnRight < dropdownWidth && spaceOnLeft >= dropdownWidth) {
            // Right align if insufficient space on right but enough on left - 如果右侧空间不足但左侧空间充足，则右对齐
            adjustedLeft = buttonRect.right - dropdownWidth
          } else if (buttonRect.left + dropdownWidth > viewportWidth) {
            // Standard right overflow handling - 标准的右侧溢出处理
            adjustedLeft = Math.max(16, viewportWidth - dropdownWidth - 16)
          }
        } else {
          // Standard positioning for non-fullscreen mode - 非全屏模式的标准定位
          if (adjustedLeft + dropdownWidth > viewportWidth) {
            // If overflowing right, align to right - 如果右侧溢出，调整到右对齐
            adjustedLeft = Math.max(0, viewportWidth - dropdownWidth - 16)
          }
        }

        // Ensure left edge doesn't go off screen - 确保左边缘不会超出屏幕
        if (adjustedLeft < 16) {
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
  }, [isDropdownOpen, variant])

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
      const currentFileId = fileId || ''
      const safeRates = selectedPlaybackRates || [0.75, 1, 1.25, 1.5, 2]

      if (checked) {
        // 添加速度选项 / Add speed option
        const newRates = [...safeRates, rate].sort((a, b) => a - b)
        setSelectedPlaybackRates(currentFileId, newRates)
      } else {
        // 移除速度选项 / Remove speed option
        const newRates = safeRates.filter((r) => r !== rate)
        setSelectedPlaybackRates(currentFileId, newRates)

        // 如果当前播放速度被取消勾选，需要切换到一个已勾选的速度 / If current playback speed is deselected, switch to a selected speed
        if (rate === playbackRate && newRates.length > 0) {
          const firstSelectedRate = newRates[0]
          handlePlaybackRateChange(firstSelectedRate)
        }
      }
    },
    [
      fileId,
      selectedPlaybackRates,
      setSelectedPlaybackRates,
      playbackRate,
      handlePlaybackRateChange
    ]
  )

  const handleCurrentRateClick = useCallback(
    (rate: number) => {
      handlePlaybackRateChange(rate)
      setIsDropdownOpen(false)
    },
    [handlePlaybackRateChange]
  )

  // Get currently selected playback speed options for display - 获取当前选中的播放速度选项用于显示
  // Add defensive check to ensure selectedPlaybackRates is always an array - 添加防御性检查确保 selectedPlaybackRates 始终是数组
  const safeSelectedPlaybackRates = selectedPlaybackRates || [0.75, 1, 1.25, 1.5, 2]
  const selectedOptions = SPEED_OPTIONS.filter((option) =>
    safeSelectedPlaybackRates.includes(option.value)
  )

  // Format playback rate for display - 格式化播放速度用于显示
  const formatPlaybackRate = (rate: number): string => {
    // 如果是整数，显示为整数；否则显示为最多2位小数 / If integer, show as integer; otherwise show up to 2 decimal places
    return rate % 1 === 0 ? rate.toString() : rate.toFixed(2).replace(/\.?0+$/, '')
  }

  // Get display text for current playback rate - 获取当前播放速度的显示文本
  const currentRateDisplay = formatPlaybackRate(playbackRate)

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
      // Ensure width matches the width used in position calculation - 确保宽度与位置计算中使用的宽度匹配
      width: variant === 'fullscreen' ? '320px' : baseStyle.width || '400px',
      left: `${dropdownPosition.left}px`,
      top: `${dropdownPosition.top}px`,
      transform: dropdownPosition.showBelow ? 'translateY(0)' : 'translateY(-100%)'
    }
  }

  // Get config item style with fullscreen support - 获取配置项样式并支持全屏模式
  const getConfigItemStyle = (
    option: (typeof SPEED_OPTIONS)[0],
    isSelected: boolean
  ): React.CSSProperties => {
    // Base style based on variant - 根据变体选择基础样式
    let baseStyle: React.CSSProperties
    if (variant === 'fullscreen') {
      baseStyle = isSelected
        ? {
            ...styles.playbackRateConfigItemFullscreen,
            ...styles.playbackRateConfigItemSelectedFullscreen
          }
        : { ...styles.playbackRateConfigItemFullscreen }
    } else {
      baseStyle = isSelected
        ? { ...styles.playbackRateConfigItem, ...styles.playbackRateConfigItemSelected }
        : { ...styles.playbackRateConfigItem }
    }

    // Highlight current rate - 高亮当前速度
    if (option.value === playbackRate) {
      if (variant === 'fullscreen') {
        return { ...baseStyle, ...styles.playbackRateConfigItemCurrentFullscreen }
      } else {
        return { ...baseStyle, ...styles.playbackRateConfigItemCurrent }
      }
    }

    return baseStyle
  }

  return (
    <div style={{ ...styles.playbackRateControl, zIndex: 'auto' }} data-playback-rate-selector>
      <Tooltip title="播放速度设置" open={!isDropdownOpen && undefined}>
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
            style={
              variant === 'fullscreen'
                ? styles.playbackRateSpanTextFullscreen
                : styles.playbackRateSpanText
            }
          >
            {currentRateDisplay}x
          </span>
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
                style={
                  variant === 'fullscreen'
                    ? styles.playbackRateConfigSectionTitleFullscreen
                    : styles.playbackRateConfigSectionTitle
                }
              >
                选择可用速度:
              </div>
              <div style={styles.playbackRateConfigGrid}>
                {SPEED_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    style={getConfigItemStyle(
                      option,
                      safeSelectedPlaybackRates.includes(option.value)
                    )}
                    onClick={() =>
                      handleRateSelection(
                        option.value,
                        !safeSelectedPlaybackRates.includes(option.value)
                      )
                    }
                  >
                    <span
                      style={{
                        ...styles.playbackRateConfigItemText,
                        fontWeight: option.value === playbackRate ? 600 : 500
                      }}
                    >
                      {option.label}
                    </span>
                    <Checkbox
                      checked={safeSelectedPlaybackRates.includes(option.value)}
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
                  style={
                    variant === 'fullscreen'
                      ? styles.playbackRateQuickSectionTitleFullscreen
                      : styles.playbackRateQuickSectionTitle
                  }
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
