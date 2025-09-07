import { loggerService } from '@logger'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import { PropsWithChildren, useEffect, useRef } from 'react'

const logger = loggerService.withContext('PlayerPageProvider')

/**
 * PlayerPageProvider - 播放器页面数据提供者
 */
export interface PlayerPageProviderProps {
  videoId: number | null
}

export function PlayerPageProvider({
  children,
  videoId
}: PropsWithChildren<PlayerPageProviderProps>) {
  const hideControls = usePlayerUIStore((s) => s.hideControls)
  const setSubtitles = usePlayerSubtitlesStore((s) => s.setSubtitles)
  const setSubtitlesLoading = usePlayerSubtitlesStore((s) => s.setLoading)

  // 注入字幕列表：智能加载（优先数据库，降级到文件解析）
  useEffect(() => {
    let disposed = false
    async function loadSubtitles() {
      if (!videoId) return
      try {
        setSubtitlesLoading(true)
        const svc = new SubtitleLibraryService()

        // 使用智能加载方法（优先数据库，降级到文件）
        const subtitles = await svc.getSubtitlesForVideo(videoId)

        if (!disposed) {
          setSubtitles(subtitles)
          logger.info('字幕加载完成', { count: subtitles.length, videoId })
        }
      } catch (error) {
        logger.error('加载字幕列表出错', { videoId, error })
        if (!disposed) setSubtitles([])
      } finally {
        if (!disposed) setSubtitlesLoading(false)
      }
    }

    loadSubtitles()
    return () => {
      disposed = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  // 控制条自动隐藏：监听 lastInteractionAt + 定时器（由页面容器调用 pokeInteraction）
  const lastInteractionAt = usePlayerUIStore((s) => s.lastInteractionAt)
  const autoHide = usePlayerUIStore((s) => s.autoHideMs)
  const timeoutRef = useRef<number | null>(null)
  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    if (autoHide > 0 && lastInteractionAt > 0) {
      timeoutRef.current = window.setTimeout(() => {
        hideControls()
      }, autoHide)
    }
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastInteractionAt, autoHide])

  return <>{children}</>
}
