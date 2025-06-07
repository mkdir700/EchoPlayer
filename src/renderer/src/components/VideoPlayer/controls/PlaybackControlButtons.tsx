import React from 'react'
import { Button, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useVideoPlayState } from '@renderer/hooks/useVideoPlayerHooks'
import { useTheme } from '@renderer/hooks/useTheme'

interface PlaybackControlButtonsProps {
  isVideoLoaded: boolean
  videoError: string | null
  onPreviousSubtitle: () => void
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onNextSubtitle: () => void
  variant?: 'compact' | 'fullscreen'
  className?: string
  buttonClassName?: string
  playPauseClassName?: string
}

export function PlaybackControlButtons({
  isVideoLoaded,
  videoError,
  onPreviousSubtitle,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onNextSubtitle,
  variant = 'compact',
  className = '',
  buttonClassName = '',
  playPauseClassName = ''
}: PlaybackControlButtonsProps): React.JSX.Element {
  const isPlaying = useVideoPlayState()
  const { styles } = useTheme()

  const getButtonStyles = (): React.CSSProperties => {
    if (buttonClassName) {
      return {}
    }

    if (variant === 'fullscreen') {
      return styles.fullscreenControlBtn
    }

    return styles.controlBtn
  }

  const getPlayPauseButtonStyles = (): React.CSSProperties => {
    if (playPauseClassName || buttonClassName) {
      return {}
    }

    if (variant === 'fullscreen') {
      return styles.fullscreenPlayPauseBtn
    }

    return { ...styles.controlBtn, ...styles.playPauseBtn }
  }

  const getButtonClassName = (): string => {
    if (buttonClassName) {
      return buttonClassName
    }
    return ''
  }

  const getPlayPauseButtonClassName = (): string => {
    if (playPauseClassName || buttonClassName) {
      return `${buttonClassName} ${playPauseClassName}`
    }
    return ''
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        ...({} as React.CSSProperties) // Allow className styles to override
      }}
    >
      {/* 上一句字幕 */}
      <Tooltip title="上一句字幕">
        <Button
          icon={<StepBackwardOutlined />}
          onClick={(e) => {
            onPreviousSubtitle()
            e.currentTarget.blur()
          }}
          type="text"
          style={getButtonStyles()}
          className={getButtonClassName()}
          disabled={!isVideoLoaded}
          size="small"
        />
      </Tooltip>

      {/* 后退10秒 */}
      <Tooltip title="后退10秒">
        <Button
          icon={<LeftOutlined />}
          onClick={(e) => {
            onStepBackward()
            e.currentTarget.blur()
          }}
          type="text"
          style={getButtonStyles()}
          className={getButtonClassName()}
          disabled={!isVideoLoaded}
          size="small"
        />
      </Tooltip>

      {/* 播放/暂停 */}
      <Button
        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        onClick={(e) => {
          onPlayPause()
          e.currentTarget.blur()
        }}
        type="text"
        style={getPlayPauseButtonStyles()}
        className={getPlayPauseButtonClassName()}
        disabled={!isVideoLoaded && !videoError}
      />

      {/* 前进10秒 */}
      <Tooltip title="前进10秒">
        <Button
          icon={<RightOutlined />}
          onClick={(e) => {
            onStepForward()
            e.currentTarget.blur()
          }}
          type="text"
          style={getButtonStyles()}
          className={getButtonClassName()}
          disabled={!isVideoLoaded}
          size="small"
        />
      </Tooltip>

      {/* 下一句字幕 */}
      <Tooltip title="下一句字幕">
        <Button
          icon={<StepForwardOutlined />}
          onClick={(e) => {
            onNextSubtitle()
            e.currentTarget.blur()
          }}
          type="text"
          style={getButtonStyles()}
          className={getButtonClassName()}
          disabled={!isVideoLoaded}
          size="small"
        />
      </Tooltip>
    </div>
  )
}
