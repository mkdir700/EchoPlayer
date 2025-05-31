import React, { useCallback, useState } from 'react'
import { Select, Tooltip } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'

interface PlaybackRateSelectorProps {
  isVideoLoaded: boolean
  onPlaybackRateChange: (value: number) => void
  className?: string
}

export function PlaybackRateSelector({
  isVideoLoaded,
  onPlaybackRateChange,
  className = ''
}: PlaybackRateSelectorProps): React.JSX.Element {
  const { playbackRateRef, setPlaybackRate } = useVideoPlayerContext()
  const [displayPlaybackRate, setDisplayPlaybackRate] = useState(playbackRateRef.current)

  const handlePlaybackRateChange = useCallback(
    (value: number) => {
      console.log('播放速度变化:', value)
      setPlaybackRate(value)
      onPlaybackRateChange(value)
      setDisplayPlaybackRate(value)
    },
    [onPlaybackRateChange, setPlaybackRate]
  )

  return (
    <div className={className}>
      <Tooltip title="播放速度">
        <Select
          value={displayPlaybackRate}
          onChange={handlePlaybackRateChange}
          disabled={!isVideoLoaded}
          size="small"
          suffixIcon={<ThunderboltOutlined />}
          style={{ minWidth: '80px' }}
          options={[
            { value: 0.25, label: '0.25x' },
            { value: 0.5, label: '0.5x' },
            { value: 0.75, label: '0.75x' },
            { value: 1, label: '1x' },
            { value: 1.25, label: '1.25x' },
            { value: 1.5, label: '1.5x' },
            { value: 1.75, label: '1.75x' },
            { value: 2, label: '2x' }
          ]}
        />
      </Tooltip>
    </div>
  )
}
