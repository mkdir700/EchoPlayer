import {
  useVideoTime,
  useVideoDuration,
  useVideoControls,
  useVideoTimeRef
} from '../features/video/useVideoPlayerHooks'

// 组合 hook - 用于进度条组件
export const useVideoProgress = (): {
  currentTime: number
  duration: number
  currentTimeRef: React.RefObject<number>
  seekTo: (time: number) => void
  setDragging: (dragging: boolean) => void
  isDraggingRef: React.RefObject<boolean>
  progress: number
} => {
  const currentTime = useVideoTime()
  const duration = useVideoDuration()
  const { seekTo, setDragging, isDraggingRef } = useVideoControls()
  const currentTimeRef = useVideoTimeRef()

  return {
    currentTime,
    duration,
    currentTimeRef,
    seekTo,
    setDragging,
    isDraggingRef,
    progress: duration > 0 ? currentTime / duration : 0
  }
}
