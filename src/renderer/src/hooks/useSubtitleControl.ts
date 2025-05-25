import { useState, useCallback, useEffect, useRef } from 'react'
import type { SubtitleItem } from '@renderer/types/shared'

interface SubtitleControlState {
  isSingleLoop: boolean // 是否开启单句循环
  isAutoPause: boolean // 是否开启自动暂停
}

interface UseSubtitleControlReturn extends SubtitleControlState {
  toggleSingleLoop: () => void
  toggleAutoPause: () => void
  goToNextSubtitle: () => void
  goToPreviousSubtitle: () => void
  resetState: () => void
}

interface UseSubtitleControlParams {
  subtitlesLength: number
  getSubtitle: (index: number) => SubtitleItem | undefined
  currentSubtitleIndex: number
  currentTime: number
  isPlaying: boolean
  isVideoLoaded: boolean
  onSeek: (time: number) => void
  onPause: () => void // 添加暂停回调
}

export function useSubtitleControl({
  subtitlesLength,
  getSubtitle,
  currentSubtitleIndex,
  currentTime,
  isPlaying,
  isVideoLoaded,
  onSeek,
  onPause
}: UseSubtitleControlParams): UseSubtitleControlReturn {
  const [state, setState] = useState<SubtitleControlState>({
    isSingleLoop: false,
    isAutoPause: false
  })

  // 用于单句循环的固定字幕索引和字幕对象
  const singleLoopSubtitleRef = useRef<SubtitleItem | null>(null)
  // 标记是否正在执行单句循环跳转，避免无限循环
  const isLoopingRef = useRef<boolean>(false)
  // 记录上次跳转的时间戳，用于去重
  const lastLoopTimeRef = useRef<number>(0)

  // 用于自动暂停的状态
  const lastSubtitleIndexRef = useRef<number>(-1)
  const shouldPauseRef = useRef<boolean>(false)

  // 使用ref来存储最新的状态，避免闭包问题
  const stateRef = useRef(state)
  const subtitlesLengthRef = useRef(subtitlesLength)
  const getSubtitleRef = useRef(getSubtitle)
  const currentSubtitleIndexRef = useRef(currentSubtitleIndex)
  const isVideoLoadedRef = useRef(isVideoLoaded)

  // 更新refs
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    subtitlesLengthRef.current = subtitlesLength
  }, [subtitlesLength])

  useEffect(() => {
    getSubtitleRef.current = getSubtitle
  }, [getSubtitle])

  useEffect(() => {
    currentSubtitleIndexRef.current = currentSubtitleIndex
  }, [currentSubtitleIndex])

  useEffect(() => {
    isVideoLoadedRef.current = isVideoLoaded
  }, [isVideoLoaded])

  // 切换单句循环 - 移除不必要的依赖
  const toggleSingleLoop = useCallback((): void => {
    setState((prev) => {
      const newSingleLoop = !prev.isSingleLoop
      const currentIndex = currentSubtitleIndexRef.current
      const currentSubtitle = getSubtitleRef.current(currentIndex)

      if (newSingleLoop) {
        if (currentIndex >= 0 && currentSubtitle) {
          // 情况1：当前有正在进行的字幕，锁定当前字幕
          singleLoopSubtitleRef.current = currentSubtitle
          console.log('🔄 开启单句循环，锁定当前字幕:', {
            index: currentIndex,
            text: currentSubtitle.text,
            startTime: currentSubtitle.startTime,
            endTime: currentSubtitle.endTime
          })
        } else {
          // 情况2：当前没有正在进行的字幕，标记为等待下一个字幕
          singleLoopSubtitleRef.current = null
          console.log('🔄 开启单句循环，等待下一个字幕')
        }
      } else {
        // 关闭单句循环时，重置相关状态
        singleLoopSubtitleRef.current = null
        isLoopingRef.current = false
        lastLoopTimeRef.current = 0
        console.log('🔄 关闭单句循环')
      }
      return {
        ...prev,
        isSingleLoop: newSingleLoop
      }
    })
  }, []) // 移除所有依赖

  // 切换自动暂停 - 移除不必要的依赖
  const toggleAutoPause = useCallback((): void => {
    setState((prev) => {
      const newAutoPause = !prev.isAutoPause
      const currentIndex = currentSubtitleIndexRef.current

      if (newAutoPause) {
        console.log('⏸️ 开启自动暂停')
        // 重置自动暂停状态
        lastSubtitleIndexRef.current = currentIndex
        shouldPauseRef.current = false
      } else {
        console.log('⏸️ 关闭自动暂停')
        // 清理自动暂停状态
        lastSubtitleIndexRef.current = -1
        shouldPauseRef.current = false
      }
      return {
        ...prev,
        isAutoPause: newAutoPause
      }
    })
  }, []) // 移除所有依赖

  // 跳转到下一句字幕 - 优化依赖
  const goToNextSubtitle = useCallback((): void => {
    const currentLength = subtitlesLengthRef.current
    const currentIndex = currentSubtitleIndexRef.current
    const currentState = stateRef.current
    const videoLoaded = isVideoLoadedRef.current
    const getSubtitleFn = getSubtitleRef.current

    if (!videoLoaded || currentLength === 0) return

    const nextIndex = currentIndex + 1
    if (nextIndex < currentLength) {
      const nextSubtitle = getSubtitleFn(nextIndex)
      if (nextSubtitle) {
        onSeek(nextSubtitle.startTime)

        // 如果开启了单句循环，更新锁定的字幕为新的字幕
        if (currentState.isSingleLoop) {
          singleLoopSubtitleRef.current = nextSubtitle
          console.log('🔄 单句循环：切换到下一句字幕', {
            index: nextIndex,
            text: nextSubtitle.text,
            startTime: nextSubtitle.startTime,
            endTime: nextSubtitle.endTime
          })
        }

        // 重置自动暂停状态，因为用户手动切换了字幕
        if (currentState.isAutoPause) {
          lastSubtitleIndexRef.current = nextIndex
          shouldPauseRef.current = false
        }
      }
    }
  }, [onSeek]) // 只依赖onSeek

  // 跳转到上一句字幕 - 优化依赖
  const goToPreviousSubtitle = useCallback((): void => {
    const currentLength = subtitlesLengthRef.current
    const currentIndex = currentSubtitleIndexRef.current
    const currentState = stateRef.current
    const videoLoaded = isVideoLoadedRef.current
    const getSubtitleFn = getSubtitleRef.current

    if (!videoLoaded || currentLength === 0) return

    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      const prevSubtitle = getSubtitleFn(prevIndex)
      if (prevSubtitle) {
        onSeek(prevSubtitle.startTime)

        // 如果开启了单句循环，更新锁定的字幕为新的字幕
        if (currentState.isSingleLoop) {
          singleLoopSubtitleRef.current = prevSubtitle
          console.log('🔄 单句循环：切换到上一句字幕', {
            index: prevIndex,
            text: prevSubtitle.text,
            startTime: prevSubtitle.startTime,
            endTime: prevSubtitle.endTime
          })
        }

        // 重置自动暂停状态，因为用户手动切换了字幕
        if (currentState.isAutoPause) {
          lastSubtitleIndexRef.current = prevIndex
          shouldPauseRef.current = false
        }
      }
    }
  }, [onSeek]) // 只依赖onSeek

  // 重置状态
  const resetState = useCallback((): void => {
    setState({
      isSingleLoop: false,
      isAutoPause: false
    })
    singleLoopSubtitleRef.current = null
    isLoopingRef.current = false
    lastLoopTimeRef.current = 0
    lastSubtitleIndexRef.current = -1
    shouldPauseRef.current = false
    console.log('🔄 重置字幕控制状态')
  }, [])

  // 处理单句循环逻辑
  useEffect(() => {
    if (!state.isSingleLoop || !isVideoLoaded || !isPlaying) {
      return
    }

    // 情况1：已经有锁定的字幕，进行循环
    if (singleLoopSubtitleRef.current) {
      const loopSubtitle = singleLoopSubtitleRef.current

      // 如果当前时间超过了循环字幕的结束时间，则跳回字幕开始
      if (currentTime > loopSubtitle.endTime) {
        // 防止重复触发：检查是否刚刚执行过跳转
        const now = Date.now()
        if (isLoopingRef.current || now - lastLoopTimeRef.current < 500) {
          return
        }

        console.log('🔄 单句循环触发：跳回字幕开始', {
          currentTime,
          endTime: loopSubtitle.endTime,
          startTime: loopSubtitle.startTime,
          text: loopSubtitle.text
        })

        // 设置循环标记，防止重复触发
        isLoopingRef.current = true
        lastLoopTimeRef.current = now

        // 执行跳转
        onSeek(loopSubtitle.startTime)

        // 延迟重置循环标记
        setTimeout(() => {
          isLoopingRef.current = false
        }, 200)
      }
    } else {
      // 情况2：没有锁定字幕，检查是否有当前字幕可以锁定
      const currentIndex = currentSubtitleIndexRef.current
      const currentSubtitle = getSubtitleRef.current(currentIndex)

      if (currentIndex >= 0 && currentSubtitle) {
        // 找到当前字幕，锁定它
        singleLoopSubtitleRef.current = currentSubtitle
        console.log('🔄 单句循环：自动锁定当前字幕', {
          index: currentIndex,
          text: currentSubtitle.text,
          startTime: currentSubtitle.startTime,
          endTime: currentSubtitle.endTime
        })
      }
    }
  }, [state.isSingleLoop, isVideoLoaded, isPlaying, currentTime, onSeek])

  // 处理自动暂停逻辑 - 监听字幕索引变化
  useEffect(() => {
    if (!state.isAutoPause || !isVideoLoaded || !isPlaying) {
      return
    }

    const prevIndex = lastSubtitleIndexRef.current

    // 字幕索引发生变化
    if (prevIndex !== currentSubtitleIndex) {
      // 如果从一个有效字幕切换到另一个有效字幕，或者从有效字幕切换到无字幕状态
      if (prevIndex >= 0 && prevIndex < subtitlesLength) {
        const prevSubtitle = getSubtitleRef.current(prevIndex)

        // 检查是否已经超过了前一个字幕的结束时间
        if (prevSubtitle && currentTime >= prevSubtitle.endTime) {
          console.log('⏸️ 自动暂停触发：字幕切换', {
            fromIndex: prevIndex,
            toIndex: currentSubtitleIndex,
            prevSubtitle: prevSubtitle.text,
            currentTime,
            prevEndTime: prevSubtitle.endTime
          })

          // 触发暂停
          shouldPauseRef.current = true
          onPause()
        }
      }

      // 更新记录的索引
      lastSubtitleIndexRef.current = currentSubtitleIndex
    }
  }, [
    state.isAutoPause,
    isVideoLoaded,
    isPlaying,
    currentSubtitleIndex,
    currentTime,
    subtitlesLength,
    onPause
  ])

  // 监听播放状态变化，重置自动暂停标记
  useEffect(() => {
    if (isPlaying && shouldPauseRef.current) {
      // 如果视频重新开始播放，重置自动暂停标记
      shouldPauseRef.current = false
      console.log('⏸️ 视频重新播放，重置自动暂停标记')
    }
  }, [isPlaying])

  return {
    ...state,
    toggleSingleLoop,
    toggleAutoPause,
    goToNextSubtitle,
    goToPreviousSubtitle,
    resetState
  }
}
