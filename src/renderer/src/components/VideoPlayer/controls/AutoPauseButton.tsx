import React, { useCallback, useEffect, useRef } from 'react'
import { Button, Tooltip } from 'antd'
import { PauseCircleFilled } from '@ant-design/icons'
import { useIsAutoPause } from '@renderer/hooks/useVideoPlaybackHooks'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useTheme } from '@renderer/hooks/useTheme'

interface AutoPauseButtonProps {
  isVideoLoaded: boolean
  variant?: 'compact' | 'fullscreen'
}

/**
 * Renders a button that toggles automatic pausing of video playback at subtitle boundaries.
 *
 * When enabled, the video will automatically pause after each subtitle finishes displaying, allowing users to review subtitles at their own pace. The button is disabled if the video is not loaded and visually indicates whether auto-pause is active.
 *
 * @param isVideoLoaded - Indicates whether the video is currently loaded and ready for interaction.
 * @param variant - Display variant: 'compact' for compact mode, 'fullscreen' for fullscreen mode.
 * @param className - Optional CSS class name to override default styles.
 * @returns The rendered auto-pause toggle button component.
 */
export function AutoPauseButton({
  isVideoLoaded,
  variant = 'compact'
}: AutoPauseButtonProps): React.JSX.Element {
  const { styles } = useTheme()
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

  // 根据变体类型选择样式 / Choose styles based on variant type
  const getButtonStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      // 全屏模式使用主题系统样式 / Fullscreen mode uses theme system styles
      return {
        ...styles.fullscreenControlBtn,
        ...(isAutoPause ? styles.fullscreenControlBtnActive : {})
      }
    }

    // 默认紧凑模式样式 / Default compact mode styles
    return {
      ...styles.controlBtn,
      ...(isAutoPause ? styles.controlBtnActive : {})
    }
  }

  // 获取按钮的CSS类名 / Get button CSS class name
  const getButtonClassName = (): string => {
    // 不再需要处理 className 和 active 类名，完全依赖主题系统
    return ''
  }

  return (
    <Tooltip title={isAutoPause ? '关闭自动暂停' : '开启自动暂停'}>
      <Button
        icon={<PauseCircleFilled />}
        onClick={(e) => {
          handleAutoPauseToggle()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        style={getButtonStyles()}
        className={getButtonClassName()}
        disabled={!isVideoLoaded}
        size="small"
      />
    </Tooltip>
  )
}
