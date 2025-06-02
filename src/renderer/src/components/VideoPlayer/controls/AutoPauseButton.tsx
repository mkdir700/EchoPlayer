import React, { useCallback, useEffect, useRef } from 'react'
import { Button, Tooltip } from 'antd'
import { PauseCircleFilled } from '@ant-design/icons'
import { useIsAutoPause } from '@renderer/hooks/useVideoPlaybackSettingsHooks'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import styles from '../VideoControlsCompact.module.css'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'

interface AutoPauseButtonProps {
  isVideoLoaded: boolean
}

export function AutoPauseButton({ isVideoLoaded }: AutoPauseButtonProps): React.JSX.Element {
  const isAutoPause = useIsAutoPause()
  const subtitleControl = useSubtitleControl()

  // 自动暂停相关状态
  const {
    currentTimeRef,
    isPlayingRef,
    isVideoLoadedRef,
    subscribeToTime,
    subscribeToPlayState,
    pause
  } = useVideoPlayerContext()
  const { subtitleItemsRef } = useSubtitleListContext()

  const handleAutoPauseToggle = useCallback(() => {
    subtitleControl.toggleAutoPause()
  }, [subtitleControl])

  // 内部状态管理
  const lastSubtitleIndexRef = useRef<number>(-1)
  const shouldPauseRef = useRef<boolean>(false)

  // 当前字幕索引的计算函数
  const getCurrentSubtitleIndex = useCallback((): number => {
    const currentTime = currentTimeRef.current || 0
    const allSubtitles = subtitleItemsRef.current || []

    for (let i = 0; i < allSubtitles.length; i++) {
      const subtitle = allSubtitles[i]
      if (currentTime >= subtitle.startTime && currentTime <= subtitle.endTime) {
        return i
      }
    }
    return -1
  }, [currentTimeRef, subtitleItemsRef])

  // 处理自动暂停逻辑
  useEffect(() => {
    if (!isAutoPause) {
      // 清理状态
      lastSubtitleIndexRef.current = -1
      shouldPauseRef.current = false
      return
    }

    const handleTimeUpdate = (currentTime: number): void => {
      if (!isAutoPause || !isVideoLoadedRef.current || !isPlayingRef.current) {
        return
      }

      const currentIndex = getCurrentSubtitleIndex()
      const prevIndex = lastSubtitleIndexRef.current

      if (prevIndex !== currentIndex) {
        if (prevIndex >= 0 && prevIndex < (subtitleItemsRef.current?.length || 0)) {
          const prevSubtitle = subtitleItemsRef.current?.[prevIndex]

          if (prevSubtitle && currentTime >= prevSubtitle.endTime) {
            console.log('⏸️ 自动暂停触发：字幕切换', {
              fromIndex: prevIndex,
              toIndex: currentIndex,
              prevSubtitle: prevSubtitle.text,
              currentTime,
              prevEndTime: prevSubtitle.endTime
            })

            shouldPauseRef.current = true
            pause()
          }
        }

        lastSubtitleIndexRef.current = currentIndex
      }
    }

    const unsubscribe = subscribeToTime(handleTimeUpdate)
    return unsubscribe
  }, [
    isAutoPause,
    pause,
    subscribeToTime,
    getCurrentSubtitleIndex,
    subtitleItemsRef,
    isVideoLoadedRef,
    isPlayingRef
  ])

  // 监听播放状态变化，重置自动暂停标记
  useEffect(() => {
    if (!isAutoPause) {
      return
    }

    const handlePlayStateChange = (isPlaying: boolean): void => {
      if (isPlaying && shouldPauseRef.current) {
        shouldPauseRef.current = false
        console.log('⏸️ 视频重新播放，重置自动暂停标记')
      }
    }

    const unsubscribe = subscribeToPlayState(handlePlayStateChange)
    return unsubscribe
  }, [subscribeToPlayState, isAutoPause])

  return (
    <Tooltip title={isAutoPause ? '关闭自动暂停' : '开启自动暂停'}>
      <Button
        icon={<PauseCircleFilled />}
        onClick={(e) => {
          handleAutoPauseToggle()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        className={`${styles.controlBtn} ${isAutoPause ? styles.activeBtn : ''}`}
        disabled={!isVideoLoaded}
        size="small"
      />
    </Tooltip>
  )
}
