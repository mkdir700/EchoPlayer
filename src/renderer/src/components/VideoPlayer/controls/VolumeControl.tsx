import React, { useCallback, useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Button, Tooltip, Typography } from 'antd'
import { SoundOutlined, SoundFilled } from '@ant-design/icons'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { usePlaybackVolume } from '@renderer/hooks/useVideoPlaybackSettingsHooks'
import { useShortcutCommand } from '@renderer/hooks/useCommandShortcuts'
import { useTheme } from '@renderer/hooks/useTheme'
import { VOLUME_SETTINGS } from '@renderer/constants'
const { Text } = Typography

// Define key volume points for quick selection
const VOLUME_KEY_POINTS = [
  { value: 0, label: '静音' },
  { value: 0.25, label: '25%' },
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' }
]

interface VolumeControlProps {
  variant?: 'compact' | 'fullscreen' // 新增：支持不同的显示模式
}

// Custom Volume Slider Component
interface CustomVolumeSliderProps {
  value: number
  onChange: (value: number) => void
  onKeyPointClick: (value: number) => void
  styles: {
    customVolumeSlider: React.CSSProperties
    customVolumeSliderTrack: React.CSSProperties
    customVolumeSliderTrackFilled: React.CSSProperties
    customVolumeSliderHandle: React.CSSProperties
    customVolumeSliderKeyPoint: React.CSSProperties
    customVolumeSliderKeyPointActive: React.CSSProperties
  }
}

/**
 * Renders a custom horizontal volume slider with draggable handle and clickable key volume points.
 *
 * Allows users to adjust volume by dragging the slider handle or clicking on predefined key points (0%, 25%, 50%, 75%, 100%). The slider visually reflects the current volume and provides immediate feedback during interaction.
 *
 * @param value - The current volume level, between 0 and 1.
 * @param onChange - Callback invoked when the volume is changed via dragging.
 * @param onKeyPointClick - Callback invoked when a key volume point is clicked.
 * @param styles - Inline styles for customizing the slider's appearance.
 *
 * @returns The rendered custom volume slider component.
 */
function CustomVolumeSlider({
  value,
  onChange,
  onKeyPointClick,
  styles
}: CustomVolumeSliderProps): React.JSX.Element {
  const sliderRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const trackFilledRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const animationFrameRef = useRef<number | null>(null)

  const updateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onChange(percentage)
    },
    [onChange]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)

      // 禁用 transition 以获得即时响应
      if (handleRef.current) {
        handleRef.current.style.transition = 'none'
      }
      if (trackFilledRef.current) {
        trackFilledRef.current.style.transition = 'none'
      }

      // 立即更新值，无需 requestAnimationFrame
      updateValue(e.clientX)
    },
    [updateValue]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        // 取消之前的动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        // 使用 requestAnimationFrame 确保流畅更新
        animationFrameRef.current = requestAnimationFrame(() => {
          updateValue(e.clientX)
        })
      }
    },
    [isDragging, updateValue]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)

    // 取消待处理的动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // 重新启用 transition
    if (handleRef.current) {
      handleRef.current.style.transition = ''
    }
    if (trackFilledRef.current) {
      trackFilledRef.current.style.transition = ''
    }
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        // Clean up any pending animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    }
    // Always return a cleanup function to satisfy TypeScript
    return () => {}
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div ref={sliderRef} style={styles.customVolumeSlider} onMouseDown={handleMouseDown}>
      {/* Slider track background */}
      <div style={styles.customVolumeSliderTrack}>
        {/* Filled track */}
        <div
          ref={trackFilledRef}
          style={{
            ...styles.customVolumeSliderTrackFilled,
            width: `${value * 100}%`
          }}
        />
      </div>

      {/* Key volume points inside track */}
      {VOLUME_KEY_POINTS.map((point) => {
        const isActive = Math.abs(value - point.value) < 0.05
        const leftPosition = `${point.value * 100}%`

        return (
          <div
            key={point.value}
            style={{
              ...styles.customVolumeSliderKeyPoint,
              ...(isActive ? styles.customVolumeSliderKeyPointActive : {}),
              left: leftPosition
            }}
            onClick={(e) => {
              e.stopPropagation()
              onKeyPointClick(point.value)
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)'
                e.currentTarget.style.background = styles.customVolumeSliderKeyPointActive
                  .background as string
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                e.currentTarget.style.background = styles.customVolumeSliderKeyPoint
                  .background as string
              }
            }}
          />
        )
      })}

      {/* Slider handle */}
      <div
        ref={handleRef}
        style={{
          ...styles.customVolumeSliderHandle,
          left: `${value * 100}%`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />
    </div>
  )
}

/**
 * Renders a volume control button with a custom slider for adjusting video playback volume.
 *
 * Displays a button that toggles a horizontal slider popup for volume adjustment. The slider supports dragging and clicking on preset key points to set the volume. Volume changes are synchronized with the video player and playback settings context. Keyboard shortcuts for volume up and down are registered, and the slider popup closes automatically when clicking outside the control.
 *
 * @param variant - Display variant: 'compact' for compact mode, 'fullscreen' for fullscreen mode.
 * @returns The volume control UI element.
 */
export function VolumeControl({ variant = 'compact' }: VolumeControlProps = {}): React.JSX.Element {
  const { playerRef } = useVideoPlayerContext()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const volumeControlRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const { volumeRef, updateVolume } = useVideoPlaybackSettingsContext()
  const volume = usePlaybackVolume()
  const { styles } = useTheme()

  // 点击音量按钮切换滑块显示状态
  const handleVolumeButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setShowVolumeSlider(!showVolumeSlider)
      e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
    },
    [showVolumeSlider]
  )

  const handleVolumeChange = useCallback(
    (value: number) => {
      console.log('音量变化:', value)
      updateVolume(value)
      // 直接控制播放器的音量
      if (playerRef.current) {
        console.log('设置音量:', volumeRef.current)
        // ReactPlayer 的音量属性是只读的，但我们可以通过内部播放器来设置
        const internalPlayer = playerRef.current.getInternalPlayer()
        if (internalPlayer && 'volume' in internalPlayer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(internalPlayer as any).volume = volumeRef.current
        }
      }
    },
    [playerRef, updateVolume, volumeRef]
  )

  // Handle key point selection
  const handleKeyPointClick = useCallback(
    (value: number) => {
      handleVolumeChange(value)
    },
    [handleVolumeChange]
  )

  // NOTE: 注册快捷键
  useShortcutCommand('volumeUp', () =>
    handleVolumeChange(Math.min(VOLUME_SETTINGS.MAX, volumeRef.current + VOLUME_SETTINGS.STEP))
  )
  useShortcutCommand('volumeDown', () =>
    handleVolumeChange(Math.max(VOLUME_SETTINGS.MIN, volumeRef.current - VOLUME_SETTINGS.STEP))
  )

  // 点击外部区域关闭音量滑块
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (volumeControlRef.current && !volumeControlRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false)
      }
    }

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVolumeSlider])

  // 使用useLayoutEffect确保弹出窗口在DOM更新后立即渲染到正确位置
  // useLayoutEffect会在所有DOM变更后同步调用，确保在浏览器绘制前执行
  useLayoutEffect(() => {
    if (showVolumeSlider && sliderRef.current) {
      // 强制重新计算布局，确保弹出窗口位置正确
      // 设置transform属性，覆盖CSS中的动画效果，确保一开始就在正确位置
      sliderRef.current.style.transform = 'translateX(-50%)'
      sliderRef.current.style.opacity = '1'
    }
  }, [showVolumeSlider])

  // 根据变体类型选择样式 / Choose styles based on variant type
  const getButtonStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      // 全屏模式使用主题系统样式 / Fullscreen mode uses theme system styles
      return styles.fullscreenControlBtn
    }

    // 默认紧凑模式样式 / Default compact mode styles
    return styles.controlBtn
  }

  // 获取音量滑块容器样式 - 在全屏模式下强制使用暗黑主题
  const getVolumeSliderStyles = (): React.CSSProperties => {
    const baseStyles = styles.volumeSliderHorizontalContainer

    if (variant === 'fullscreen') {
      // 全屏模式强制使用暗黑主题
      return {
        ...baseStyles,
        background: 'rgba(20, 20, 20, 0.95)', // 强制使用暗色背景
        border: '1px solid rgba(255, 255, 255, 0.1)', // 暗色边框
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)', // 更深的阴影
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        color: 'rgba(255, 255, 255, 0.9)' // 强制使用白色文字
      }
    }

    // 默认主题色
    return baseStyles
  }

  // 获取音量文字样式 - 在全屏模式下强制使用暗黑主题
  const getVolumeTextStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      // 全屏模式强制使用白色文字
      return {
        ...styles.fullscreenVolumeText,
        color: 'rgba(255, 255, 255, 0.9)' // 强制使用白色文字
      }
    }

    // 默认主题色
    return styles.fullscreenVolumeText
  }

  return (
    <div style={styles.volumeControl} ref={volumeControlRef}>
      <Tooltip
        title={showVolumeSlider ? '' : `音量: ${Math.round(volumeRef.current * 100)}%`}
        open={showVolumeSlider ? false : undefined}
      >
        <Button
          icon={volumeRef.current > 0 ? <SoundFilled /> : <SoundOutlined />}
          type="text"
          size="small"
          style={getButtonStyles()}
          onClick={handleVolumeButtonClick}
        />
      </Tooltip>

      {showVolumeSlider && (
        <div style={getVolumeSliderStyles()} ref={sliderRef}>
          {/* Custom Volume Slider with embedded key points */}
          <CustomVolumeSlider
            value={volume}
            onChange={handleVolumeChange}
            onKeyPointClick={handleKeyPointClick}
            styles={styles}
          />

          {/* Volume percentage display */}
          <Text style={getVolumeTextStyles()}>{Math.round(volume * 100)}%</Text>
        </div>
      )}
    </div>
  )
}
