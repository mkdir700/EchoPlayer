import { usePlayerSessionStore } from '@renderer/state/stores/player-session.store'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import type { SubtitleItem } from '@types'

// 读取当前视频元数据（由 PlayerPage 注入）
export function useCurrentVideo() {
  return usePlayerSessionStore((s) => s.video)
}

export function useSubtitles(): SubtitleItem[] {
  return usePlayerSubtitlesStore((s) => s.subtitles)
}
