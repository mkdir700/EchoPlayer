import { VideoLibraryService } from '@renderer/services'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import useRuntimeStore from '@renderer/state/stores/runtime'
import { useVideoProjectStore } from '@renderer/state/stores/video-project.store'

// 简单防抖/节流实现
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 800) {
  let t: any
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

function throttle<T extends (...args: any[]) => void>(fn: T, wait = 1500) {
  let last = 0
  let timer: any
  return (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = wait - (now - last)
    if (remaining <= 0) {
      last = now
      fn(...args)
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn(...args)
      }, remaining)
    }
  }
}

export function bindPlayerToVideo(videoId: number) {
  // 访问一次 store 确保初始化（如无需要可移除）
  usePlayerStore.getState()
  const vp = useVideoProjectStore.getState()
  useRuntimeStore.setState({ currentVideoId: videoId })

  // 1) 载入配置并应用到 player（仅 per-video 字段）
  const cfg = vp.getConfig(videoId)
  // s.duration 可在 metadata 回调里更新
  usePlayerStore.setState({
    currentTime: cfg.progress.currentTime,
    loopEnabled: cfg.loop.enabled,
    loopMode: cfg.loop.mode,
    loopCount: cfg.loop.count,
    autoPauseEnabled: cfg.autoPause.enabled,
    pauseOnSubtitleEnd: cfg.autoPause.pauseOnSubtitleEnd,
    resumeDelay: cfg.autoPause.resumeDelay,
    subtitleDisplayMode: cfg.subtitle.displayMode,
    activeCueIndex: cfg.subtitle.activeCueIndex
  })

  // 2) 订阅 player 变更并写回 video project 配置
  const saveDebounced = debounce(
    (partial: {
      currentTime?: number
      duration?: number
      loopEnabled?: boolean
      loopMode?: any
      loopCount?: number
      autoPauseEnabled?: boolean
      pauseOnSubtitleEnd?: boolean
      resumeDelay?: number
      subtitleDisplayMode?: any
      activeCueIndex?: number
    }) => {
      const patch = {
        progress: {
          currentTime: partial.currentTime ?? usePlayerStore.getState().currentTime,
          duration: partial.duration ?? usePlayerStore.getState().duration
        },
        loop: {
          enabled: partial.loopEnabled ?? usePlayerStore.getState().loopEnabled,
          mode: partial.loopMode ?? usePlayerStore.getState().loopMode,
          count: partial.loopCount ?? usePlayerStore.getState().loopCount
        },
        autoPause: {
          enabled: partial.autoPauseEnabled ?? usePlayerStore.getState().autoPauseEnabled,
          pauseOnSubtitleEnd:
            partial.pauseOnSubtitleEnd ?? usePlayerStore.getState().pauseOnSubtitleEnd,
          resumeDelay: partial.resumeDelay ?? usePlayerStore.getState().resumeDelay
        },
        subtitle: {
          displayMode: partial.subtitleDisplayMode ?? usePlayerStore.getState().subtitleDisplayMode,
          follow: usePlayerStore.getState().subtitleFollow, // 交叉：本字段是全局偏好，也可记录
          activeCueIndex: partial.activeCueIndex ?? usePlayerStore.getState().activeCueIndex
        }
      }
      vp.upsertConfig(videoId, patch as any)
    },
    800
  )

  const unsubConfig = usePlayerStore.subscribe((s) => {
    saveDebounced({
      currentTime: s.currentTime,
      duration: s.duration,
      loopEnabled: s.loopEnabled,
      loopMode: s.loopMode,
      loopCount: s.loopCount,
      autoPauseEnabled: s.autoPauseEnabled,
      pauseOnSubtitleEnd: s.pauseOnSubtitleEnd,
      resumeDelay: s.resumeDelay,
      subtitleDisplayMode: s.subtitleDisplayMode,
      activeCueIndex: s.activeCueIndex
    })
  })

  // 3) 节流把进度写回 VideoLibrary（用于最近播放/完成度等）
  const svc = new VideoLibraryService()
  const writeProgress = throttle((ct: number, d: number) => {
    svc.updatePlayProgress(videoId, ct, d).catch(() => {})
  }, 2000)

  const unsubProgress = usePlayerStore.subscribe((s) => {
    writeProgress(s.currentTime, s.duration)
  })

  // 返回取消绑定函数
  return () => {
    unsubConfig()
    unsubProgress()
  }
}
