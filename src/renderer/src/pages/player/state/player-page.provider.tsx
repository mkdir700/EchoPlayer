import { loggerService } from '@logger'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { SubtitleReader } from '@renderer/services/subtitles/SubtitleReader'
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

  // 注入字幕列表：从 SubtitleLibrary 按视频查询，并尝试加载 JSON 格式字幕
  useEffect(() => {
    let disposed = false
    async function loadSubtitles() {
      if (!videoId) return
      try {
        setSubtitlesLoading(true)
        const svc = new SubtitleLibraryService()
        const records = await svc.getRecordsByVideoId(videoId)
        if (!records || records.length === 0) {
          logger.info('未找到字幕记录', { videoId })
          if (!disposed) setSubtitles([])
          return
        }

        // 选择最新的一条记录（已按创建时间倒序）
        const record = records[0]
        const filePath = record.filePath

        // 读取并解析字幕（支持 JSON/SRT/VTT/ASS/SSA）
        const reader = SubtitleReader.create('PlayerPageProvider')
        const list = await reader.readFromFile(filePath)

        if (!disposed) setSubtitles(list)
        logger.info('已注入字幕', { count: list.length, filePath })
        return
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
