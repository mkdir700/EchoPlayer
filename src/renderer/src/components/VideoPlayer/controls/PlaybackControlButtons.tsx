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

interface PlaybackControlButtonsProps {
  isPlaying: boolean
  isVideoLoaded: boolean
  videoError: string | null
  onPreviousSubtitle: () => void
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onNextSubtitle: () => void
  className?: string
  buttonClassName?: string
  playPauseClassName?: string
}

export function PlaybackControlButtons({
  isPlaying,
  isVideoLoaded,
  videoError,
  onPreviousSubtitle,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onNextSubtitle,
  className = '',
  buttonClassName = '',
  playPauseClassName = ''
}: PlaybackControlButtonsProps): React.JSX.Element {
  return (
    <div className={className}>
      {/* 上一句字幕 */}
      <Tooltip title="上一句字幕">
        <Button
          icon={<StepBackwardOutlined />}
          onClick={(e) => {
            onPreviousSubtitle()
            e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
          }}
          type="text"
          className={buttonClassName}
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
            e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
          }}
          type="text"
          className={buttonClassName}
          disabled={!isVideoLoaded}
          size="small"
        />
      </Tooltip>

      {/* 播放/暂停 */}
      <Button
        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        onClick={(e) => {
          onPlayPause()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        className={`${buttonClassName} ${playPauseClassName}`}
        disabled={!isVideoLoaded && !videoError}
      />

      {/* 前进10秒 */}
      <Tooltip title="前进10秒">
        <Button
          icon={<RightOutlined />}
          onClick={(e) => {
            onStepForward()
            e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
          }}
          type="text"
          className={buttonClassName}
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
            e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
          }}
          type="text"
          className={buttonClassName}
          disabled={!isVideoLoaded}
          size="small"
        />
      </Tooltip>
    </div>
  )
}
