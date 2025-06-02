import React, { useCallback, useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Button, Slider, Tooltip, Typography } from 'antd'
import { SoundOutlined, SoundFilled } from '@ant-design/icons'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { usePlaybackVolume } from '@renderer/hooks/useVideoPlaybackSettingsHooks'
import { useShortcutCommand } from '@renderer/hooks/useCommandShortcuts'
import { VOLUME_SETTINGS } from '@renderer/constants'
const { Text } = Typography

interface VolumeControlProps {
  className?: string
  sliderClassName?: string
  sliderVerticalClassName?: string
  textClassName?: string
  buttonClassName?: string
}

export function VolumeControl({
  className = '',
  sliderClassName = '',
  sliderVerticalClassName = '',
  textClassName = '',
  buttonClassName = ''
}: VolumeControlProps): React.JSX.Element {
  const { playerRef } = useVideoPlayerContext()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const volumeControlRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const { volumeRef, updateVolume } = useVideoPlaybackSettingsContext()
  const volume = usePlaybackVolume()

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

  return (
    <div className={className} ref={volumeControlRef}>
      <Tooltip
        title={showVolumeSlider ? '' : `音量: ${Math.round(volumeRef.current * 100)}%`}
        open={showVolumeSlider ? false : undefined}
      >
        <Button
          icon={volumeRef.current > 0 ? <SoundFilled /> : <SoundOutlined />}
          type="text"
          size="small"
          className={buttonClassName}
          onClick={handleVolumeButtonClick}
        />
      </Tooltip>

      {showVolumeSlider && (
        <div className={sliderClassName} ref={sliderRef}>
          <Slider
            vertical
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            className={sliderVerticalClassName}
          />
          <Text className={textClassName}>{Math.round(volume * 100)}%</Text>
        </div>
      )}
    </div>
  )
}
