import React, { useCallback, useRef } from 'react'
import type { SubtitleItem } from '@types_/shared'
import { SubtitleControlContext, type SubtitleControlContextType } from './SubtitleControlContext'
import { useVideoPlaybackSettings } from '@renderer/hooks/useVideoPlaybackSettings'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'

export function SubtitleControlProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const { settings, setSingleLoop, setAutoPause } = useVideoPlaybackSettings()
  const { currentTimeRef, isVideoLoadedRef } = useVideoPlayerContext()
  const { subtitleItemsRef } = useSubtitleListContext()
  const { seekTo } = useVideoControls()

  // 直接使用 settings 中的状态
  const singleLoopState = settings.isSingleLoop
  const autoPauseState = settings.isAutoPause

  // 内部状态管理
  const singleLoopSubtitleRef = useRef<SubtitleItem | null>(null)
  const lastLoopTimeRef = useRef<number>(0)
  const lastSubtitleIndexRef = useRef<number>(-1)

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

  // 切换单句循环
  const toggleSingleLoop = useCallback((): void => {
    const newSingleLoop = !settings.isSingleLoop
    const currentIndex = getCurrentSubtitleIndex()
    const currentSubtitle = subtitleItemsRef.current?.[currentIndex]

    console.log(
      '🔄 toggleSingleLoop: 当前状态 =',
      settings.isSingleLoop,
      '=> 新状态 =',
      newSingleLoop
    )

    if (newSingleLoop) {
      if (currentIndex >= 0 && currentSubtitle) {
        console.log('🔄 开启单句循环，锁定当前字幕:', {
          index: currentIndex,
          text: currentSubtitle.text,
          startTime: currentSubtitle.startTime,
          endTime: currentSubtitle.endTime
        })
      } else {
        console.log('🔄 开启单句循环，等待下一个字幕')
      }
    } else {
      singleLoopSubtitleRef.current = null
      lastLoopTimeRef.current = 0
      console.log('🔄 关闭单句循环')
    }
    setSingleLoop(newSingleLoop)
  }, [setSingleLoop, settings.isSingleLoop, getCurrentSubtitleIndex, subtitleItemsRef])

  // 切换自动暂停
  const toggleAutoPause = useCallback((): void => {
    const newAutoPause = !settings.isAutoPause
    const currentIndex = getCurrentSubtitleIndex()

    if (newAutoPause) {
      console.log('⏸️ 开启自动暂停')
      lastSubtitleIndexRef.current = currentIndex
    } else {
      console.log('⏸️ 关闭自动暂停')
      lastSubtitleIndexRef.current = -1
    }
    setAutoPause(newAutoPause)
  }, [setAutoPause, settings.isAutoPause, getCurrentSubtitleIndex])

  // 跳转到下一句字幕
  const goToNextSubtitle = useCallback((): void => {
    const allSubtitles = subtitleItemsRef.current || []
    const currentLength = allSubtitles.length
    const currentIndex = getCurrentSubtitleIndex()
    const videoLoaded = isVideoLoadedRef.current

    if (!videoLoaded || currentLength === 0) return

    let nextIndex: number

    if (currentIndex === -1) {
      const currentTimeValue = currentTimeRef.current || 0
      nextIndex = allSubtitles.findIndex((sub) => sub.startTime > currentTimeValue)
      if (nextIndex === -1) {
        nextIndex = currentLength - 1
      }
    } else {
      nextIndex = currentIndex + 1
    }

    if (nextIndex < currentLength) {
      const nextSubtitle = allSubtitles[nextIndex]
      if (nextSubtitle) {
        seekTo(nextSubtitle.startTime)

        if (settings.isSingleLoop) {
          singleLoopSubtitleRef.current = nextSubtitle
          console.log('🔄 单句循环：切换到下一句字幕', {
            index: nextIndex,
            text: nextSubtitle.text,
            startTime: nextSubtitle.startTime,
            endTime: nextSubtitle.endTime
          })
        }

        if (settings.isAutoPause) {
          lastSubtitleIndexRef.current = nextIndex
        }
      }
    }
  }, [
    getCurrentSubtitleIndex,
    currentTimeRef,
    isVideoLoadedRef,
    seekTo,
    settings.isSingleLoop,
    settings.isAutoPause,
    subtitleItemsRef
  ])

  // 跳转到上一句字幕
  const goToPreviousSubtitle = useCallback((): void => {
    const allSubtitles = subtitleItemsRef.current || []
    const currentLength = allSubtitles.length
    const currentIndex = getCurrentSubtitleIndex()
    const videoLoaded = isVideoLoadedRef.current

    if (!videoLoaded || currentLength === 0) return

    let prevIndex: number

    if (currentIndex === -1) {
      const currentTimeValue = currentTimeRef.current || 0
      prevIndex = -1
      for (let i = allSubtitles.length - 1; i >= 0; i--) {
        if (allSubtitles[i].endTime < currentTimeValue) {
          prevIndex = i
          break
        }
      }
      if (prevIndex === -1) {
        prevIndex = 0
      }
    } else {
      prevIndex = currentIndex - 1
    }

    if (prevIndex >= 0) {
      const prevSubtitle = allSubtitles[prevIndex]
      if (prevSubtitle) {
        seekTo(prevSubtitle.startTime)

        if (settings.isSingleLoop) {
          singleLoopSubtitleRef.current = prevSubtitle
          console.log('🔄 单句循环：切换到上一句字幕', {
            index: prevIndex,
            text: prevSubtitle.text,
            startTime: prevSubtitle.startTime,
            endTime: prevSubtitle.endTime
          })
        }

        if (settings.isAutoPause) {
          lastSubtitleIndexRef.current = prevIndex
        }
      }
    }
  }, [
    getCurrentSubtitleIndex,
    currentTimeRef,
    isVideoLoadedRef,
    seekTo,
    settings.isSingleLoop,
    settings.isAutoPause,
    subtitleItemsRef
  ])

  // 重置状态
  const resetState = useCallback((): void => {
    setSingleLoop(false)
    setAutoPause(false)
    singleLoopSubtitleRef.current = null
    lastLoopTimeRef.current = 0
    lastSubtitleIndexRef.current = -1
    console.log('🔄 重置字幕控制状态')
  }, [setAutoPause, setSingleLoop])

  // 恢复状态
  const restoreState = useCallback(
    (isSingleLoop: boolean, isAutoPause: boolean): void => {
      setSingleLoop(isSingleLoop)
      setAutoPause(isAutoPause)

      singleLoopSubtitleRef.current = null
      lastLoopTimeRef.current = 0
      lastSubtitleIndexRef.current = getCurrentSubtitleIndex()

      console.log('🔄 恢复字幕控制状态:', { isSingleLoop, isAutoPause })
    },
    [setAutoPause, setSingleLoop, getCurrentSubtitleIndex]
  )

  // 获取当前状态 - 使用订阅机制确保状态同步
  const contextValue: SubtitleControlContextType = {
    isSingleLoop: singleLoopState,
    isAutoPause: autoPauseState,
    toggleSingleLoop,
    toggleAutoPause,
    goToNextSubtitle,
    goToPreviousSubtitle,
    resetState,
    restoreState
  }

  return (
    <SubtitleControlContext.Provider value={contextValue}>
      {children}
    </SubtitleControlContext.Provider>
  )
}
