import React, { useCallback } from 'react'
import { Select, Tooltip } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'
import styles from '../VideoControlsCompact.module.css'
import { usePlaybackRate } from '@renderer/hooks/useVideoPlaybackSettingsHooks'

interface PlaybackRateSelectorProps {
  isVideoLoaded: boolean
}

export function PlaybackRateSelector({
  isVideoLoaded
}: PlaybackRateSelectorProps): React.JSX.Element {
  const { playerRef, isVideoLoadedRef } = useVideoPlayerContext()
  const playbackRate = usePlaybackRate()
  const { updatePlaybackRate } = useVideoPlaybackSettingsContext()

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

  return (
    <div className={styles.playbackRateControl}>
      <Tooltip title="播放速度">
        <Select
          value={playbackRate}
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
