import React, { useCallback, useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Button, Slider, Tooltip, Typography } from 'antd'
import { SoundOutlined, SoundFilled } from '@ant-design/icons'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'

const { Text } = Typography

interface VolumeControlProps {
  onVolumeChange: (value: number) => void
  className?: string
  sliderClassName?: string
  sliderVerticalClassName?: string
  textClassName?: string
  buttonClassName?: string
}

export function VolumeControl({
  onVolumeChange,
  className = '',
  sliderClassName = '',
  sliderVerticalClassName = '',
  textClassName = '',
  buttonClassName = ''
}: VolumeControlProps): React.JSX.Element {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const volumeControlRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const { volumeRef, setVolume } = useVideoPlayerContext()
  // 添加本地状态来跟踪显示的音量值，确保UI更新
  const [displayVolume, setDisplayVolume] = useState(volumeRef.current)

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
      onVolumeChange(value)
      setDisplayVolume(value)
    },
    [onVolumeChange]
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

  // 确保displayVolume与volumeRef.current保持同步
  useEffect(() => {
    setVolume(volumeRef.current)
    // 使用volumeRef作为依赖项，而不是volumeRef.current
    setDisplayVolume(volumeRef.current)
  }, [setVolume, volumeRef])

  return (
    <div className={className} ref={volumeControlRef}>
      <Tooltip
        title={showVolumeSlider ? '' : `音量: ${Math.round(displayVolume * 100)}%`}
        open={showVolumeSlider ? false : undefined}
      >
        <Button
          icon={displayVolume > 0 ? <SoundFilled /> : <SoundOutlined />}
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
            value={displayVolume}
            onChange={handleVolumeChange}
            className={sliderVerticalClassName}
          />
          <Text className={textClassName}>{Math.round(displayVolume * 100)}%</Text>
        </div>
      )}
    </div>
  )
}
