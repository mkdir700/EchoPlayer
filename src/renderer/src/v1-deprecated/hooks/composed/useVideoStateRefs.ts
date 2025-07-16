import { useVideoPlayerContext } from '../core/useVideoPlayerContext'

// 只需要读取其他状态 ref 的组件使用这个
export const useVideoStateRefs = (): {
  currentTimeRef: React.RefObject<number>
  durationRef: React.RefObject<number>
  isPlayingRef: React.RefObject<boolean>
  isDraggingRef: React.RefObject<boolean>
  isVideoLoadedRef: React.RefObject<boolean>
  videoErrorRef: React.RefObject<string | null>
} => {
  const {
    currentTimeRef,
    durationRef,
    isPlayingRef,
    isDraggingRef,
    isVideoLoadedRef,
    videoErrorRef
  } = useVideoPlayerContext()

  return {
    currentTimeRef,
    durationRef,
    isPlayingRef,
    isDraggingRef,
    isVideoLoadedRef,
    videoErrorRef
  }
}
