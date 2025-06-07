import React, { useState, useEffect } from 'react'
import { Button, Slider, Typography, Tooltip } from 'antd'
import {
  SoundOutlined,
  SoundFilled,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons'
import { FullScreenSettingsPanel } from './FullScreenSettingsPanel'
import styles from '../VideoControlsFullScreen.module.css'

const { Text } = Typography

interface FullScreenRightControlsProps {
  volume: number
  isFullscreen: boolean
  showControls: boolean
  onVolumeChange: (value: number) => void
  onFullscreenToggle: () => void
}

export function FullScreenRightControls({
  volume,
  isFullscreen,
  showControls,
  onVolumeChange,
  onFullscreenToggle
}: FullScreenRightControlsProps): React.JSX.Element {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // 自动隐藏设置面板 Auto hide settings panel
  useEffect(() => {
    if (!showControls) {
      setShowSettings(false)
      setShowVolumeSlider(false)
    }
  }, [showControls])

  return (
    <div className={styles.controlsRight}>
      <div className={styles.controlGroup}>
        {/* 音量控制 Volume Control */}
        <div
          className={styles.volumeControl}
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <Tooltip title={`音量: ${Math.round(volume * 100)}%`}>
            <Button
              icon={volume > 0 ? <SoundFilled /> : <SoundOutlined />}
              type="text"
              className={styles.controlBtn}
            />
          </Tooltip>

          {showVolumeSlider && (
            <div className={styles.volumeSliderPopup}>
              <Slider
                vertical
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={onVolumeChange}
                className={styles.volumeSliderVertical}
              />
              <Text className={styles.volumeText}>{Math.round(volume * 100)}%</Text>
            </div>
          )}
        </div>

        {/* 全屏按钮 Fullscreen Toggle */}
        <Tooltip title={isFullscreen ? '退出全屏' : '进入全屏'}>
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={onFullscreenToggle}
            type="text"
            className={styles.controlBtn}
          />
        </Tooltip>

        {/* 设置按钮 Settings Button */}
        <div className={styles.settingsControl}>
          <Tooltip title="更多设置">
            <Button
              icon={<SettingOutlined />}
              type="text"
              className={styles.controlBtn}
              onClick={() => setShowSettings(!showSettings)}
            />
          </Tooltip>

          <FullScreenSettingsPanel visible={showSettings} />
        </div>
      </div>
    </div>
  )
}
