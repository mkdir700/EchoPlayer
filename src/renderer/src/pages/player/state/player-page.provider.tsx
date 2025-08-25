import { loggerService } from '@logger'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { SubtitleReader } from '@renderer/services/subtitles/SubtitleReader'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import { useVideoProjectStore } from '@renderer/state/stores/video-project.store'
import React, { PropsWithChildren, useEffect, useRef } from 'react'

const logger = loggerService.withContext('PlayerPageProvider')

/**
 * PlayerPageProvider - 播放器页面数据提供者
 *
 * 职责分工：
 * 1. 【本组件负责】用户偏好设置的初始化和持久化（字幕显示模式、跟随设置等）
 * 2. 【本组件负责】字幕数据的加载和管理
 * 3. 【本组件负责】UI交互逻辑（自动隐藏控制条等）
 * 4. 【PlayerEngine负责】播放器核心状态管理（currentTime、duration、playing、volume等）
 * 5. 【PlayerEngine负责】播放控制命令的执行和状态同步
 *
 * 重要说明：
 * - 播放状态（currentTime、duration、activeCueIndex）现由 PlayerEngine 自动管理
 * - 避免在此处手动设置这些状态，以防止与 PlayerEngine 产生竞争条件
 */
export interface PlayerPageProviderProps {
  videoId: number | null
  autoHideMs?: number
}

export function PlayerPageProvider({
  children,
  videoId,
  autoHideMs
}: PropsWithChildren<PlayerPageProviderProps>) {
  // 读取与设置 store（严格在顶层调用；使用单字段 selector 避免对象引用变化导致重渲染）
  // 注意：currentTime、duration、activeCueIndex 现由 PlayerEngine 自动同步，这里不再需要手动设置
  const setSubtitleDisplayMode = usePlayerStore((s) => s.setSubtitleDisplayMode)
  const setSubtitleFollow = usePlayerStore((s) => s.setSubtitleFollow)

  const getConfig = useVideoProjectStore((s) => s.getConfig)
  const updateProgress = useVideoProjectStore((s) => s.updateProgress)
  const upsertConfig = useVideoProjectStore((s) => s.upsertConfig)

  const setAutoHideMsAction = usePlayerUIStore((s) => s.setAutoHideMs)
  const hideControls = usePlayerUIStore((s) => s.hideControls)

  const setSubtitles = usePlayerSubtitlesStore((s) => s.setSubtitles)
  const setSubtitlesLoading = usePlayerSubtitlesStore((s) => s.setLoading)

  // 初始化：从 VideoProjectStore 应用用户偏好配置 → PlayerStore
  // 注意：播放状态（currentTime、duration、activeCueIndex）现由 PlayerEngine 负责管理
  useEffect(() => {
    if (!videoId) return
    const cfg = getConfig(videoId)

    // 只初始化用户偏好设置，播放状态由 PlayerEngine 管理
    setSubtitleDisplayMode(cfg.subtitle.displayMode)
    setSubtitleFollow(cfg.subtitle.follow)

    // UI 自动隐藏时间
    if (typeof autoHideMs === 'number') {
      setAutoHideMsAction(autoHideMs)
    }

    logger.debug('Hydrate user preferences from project config', {
      videoId,
      displayMode: cfg.subtitle.displayMode,
      follow: cfg.subtitle.follow
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

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

  // currentTime/activeCueIndex 回写（currentTime 使用 useVideoEvents 自带节流）
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const activeCueIndex = usePlayerStore((s) => s.activeCueIndex)

  useEffect(() => {
    if (!videoId) return
    updateProgress(videoId, currentTime, duration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, currentTime, duration])

  useEffect(() => {
    if (!videoId) return
    // 仅在值变化时 upsert，避免无意义写入导致的级联渲染
    const cfg = getConfig(videoId)
    if (cfg.subtitle.activeCueIndex === activeCueIndex) return
    upsertConfig(videoId, {
      subtitle: {
        displayMode: cfg.subtitle.displayMode,
        follow: cfg.subtitle.follow,
        activeCueIndex
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, activeCueIndex])

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

  // 字幕同步现在由新的播放器引擎处理
  // PlayerEngine 通过 usePlayerEngine Hook 自动处理：
  // - 播放状态同步到 Store
  // - 字幕索引根据播放时间自动更新
  // - 循环、自动暂停等策略自动执行

  return <>{children}</>
}
