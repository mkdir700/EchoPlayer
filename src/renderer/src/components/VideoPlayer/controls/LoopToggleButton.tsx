import React, { useCallback, useEffect, useRef } from 'react'
import { Button, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useTheme } from '@renderer/hooks/useTheme'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import type { SubtitleItem } from '@types_/shared'
import RendererLogger from '@renderer/utils/logger'
import { useIsSingleLoop } from '@renderer/hooks/useVideoPlaybackSettingsHooks'

interface LoopToggleButtonProps {
  isVideoLoaded: boolean
}

export function LoopToggleButton({ isVideoLoaded }: LoopToggleButtonProps): React.JSX.Element {
  const { styles } = useTheme()
  const isLoopingDisplay = useIsSingleLoop()
  console.log('🔄 LoopToggleButton 渲染, isLoopingDisplay:', isLoopingDisplay)
  const subtitleControl = useSubtitleControl()
  // const [isLoopingDisplay, setIsLoopingDisplay] = useState(settings.isSingleLoop)
  // 单句循环相关状态
  const { currentTimeRef, isPlayingRef, isVideoLoadedRef, subscribeToTime } =
    useVideoPlayerContext()
  const { subtitleItemsRef } = useSubtitleListContext()
  const { seekTo } = useVideoControls()

  const handleLoopToggle = useCallback(() => {
    subtitleControl.toggleSingleLoop()
  }, [subtitleControl])

  // 内部状态管理
  const singleLoopSubtitleRef = useRef<SubtitleItem | null>(null)
  const lastLoopTimeRef = useRef<number>(0)

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

  // 处理单句循环逻辑
  useEffect(() => {
    console.log('🔄 LoopToggleButton useEffect 触发: isLooping =', isLoopingDisplay)
    if (!isLoopingDisplay) {
      // 清理状态
      singleLoopSubtitleRef.current = null
      lastLoopTimeRef.current = 0
      console.log('🔄 清理单句循环状态')
      return
    }

    console.log('🔄 开始设置单句循环监听器')

    const handleTimeUpdate = (currentTime: number): void => {
      if (!isLoopingDisplay || !isVideoLoadedRef.current || !isPlayingRef.current) {
        return
      }

      if (singleLoopSubtitleRef.current) {
        const loopSubtitle = singleLoopSubtitleRef.current

        if (currentTime > loopSubtitle.endTime) {
          const now = Date.now()
          if (!isLoopingDisplay || now - lastLoopTimeRef.current < 500) {
            return
          }

          console.log('🔄 单句循环触发：跳回字幕开始', {
            currentTime,
            endTime: loopSubtitle.endTime,
            startTime: loopSubtitle.startTime,
            text: loopSubtitle.text
          })

          lastLoopTimeRef.current = now

          seekTo(loopSubtitle.startTime)
        }
      } else {
        const currentIndex = getCurrentSubtitleIndex()
        const currentSubtitle = subtitleItemsRef.current?.[currentIndex]

        if (currentIndex >= 0 && currentSubtitle) {
          singleLoopSubtitleRef.current = currentSubtitle
          console.log('🔄 单句循环：自动锁定当前字幕', {
            index: currentIndex,
            text: currentSubtitle.text,
            startTime: currentSubtitle.startTime,
            endTime: currentSubtitle.endTime
          })
        }
      }
    }

    const unsubscribe = subscribeToTime(handleTimeUpdate)
    return unsubscribe
  }, [
    isLoopingDisplay,
    seekTo,
    subscribeToTime,
    getCurrentSubtitleIndex,
    subtitleItemsRef,
    isVideoLoadedRef,
    isPlayingRef,
    subtitleControl
  ])

  RendererLogger.info('LoopToggleButton', {
    isLooping: isLoopingDisplay,
    isVideoLoaded,
    isPlaying: isPlayingRef.current,
    currentTime: currentTimeRef.current,
    subtitleItems: subtitleItemsRef.current
  })

  return (
    <Tooltip title={isLoopingDisplay ? '关闭单句循环' : '开启单句循环'}>
      <Button
        icon={<ReloadOutlined />}
        onClick={(e) => {
          console.log('🔄 点击循环按钮，当前状态:', isLoopingDisplay)
          handleLoopToggle()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        style={{
          ...styles.controlBtn,
          ...(isLoopingDisplay ? styles.controlBtnActive : {})
        }}
        disabled={!isVideoLoaded}
        size="small"
      />
    </Tooltip>
  )
}
