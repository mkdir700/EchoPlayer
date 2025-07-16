import { loggerService } from '@logger'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { SubtitleReader } from '@renderer/services/subtitles/SubtitleReader'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import { useVideoProjectStore } from '@renderer/state/stores/video-project.store'
import React, { PropsWithChildren, useEffect, useRef } from 'react'

const logger = loggerService.withContext('PlayerPageProvider')

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
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const setSubtitleDisplayMode = usePlayerStore((s) => s.setSubtitleDisplayMode)
  const setSubtitleFollow = usePlayerStore((s) => s.setSubtitleFollow)
  const setActiveCueIndexAction = usePlayerStore((s) => s.setActiveCueIndex)

  const getConfig = useVideoProjectStore((s) => s.getConfig)
  const updateProgress = useVideoProjectStore((s) => s.updateProgress)
  const upsertConfig = useVideoProjectStore((s) => s.upsertConfig)

  const setAutoHideMsAction = usePlayerUIStore((s) => s.setAutoHideMs)
  const hideControls = usePlayerUIStore((s) => s.hideControls)

  const setSubtitles = usePlayerSubtitlesStore((s) => s.setSubtitles)
  const setSubtitlesLoading = usePlayerSubtitlesStore((s) => s.setLoading)

  // 初始化：从 VideoProjectStore 应用配置 → PlayerStore
  useEffect(() => {
    if (!videoId) return
    const cfg = getConfig(videoId)

    setCurrentTime(cfg.progress.currentTime)
    if (typeof cfg.progress.duration === 'number') {
      setDuration(cfg.progress.duration)
    }

    // 循环/自动暂停/字幕设置
    // 这些字段在 player.store.ts 中已有字段与 actions（此处只演示字幕设置）
    setSubtitleDisplayMode(cfg.subtitle.displayMode)
    setSubtitleFollow(cfg.subtitle.follow)
    setActiveCueIndexAction(cfg.subtitle.activeCueIndex)

    // UI 自动隐藏时间
    if (typeof autoHideMs === 'number') {
      setAutoHideMsAction(autoHideMs)
    }

    logger.debug('Hydrate from project config', { videoId, cfg })
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

  // 整合 video 事件 → isLoading 与 play/pause
  // const { handleWaiting, handleCanPlay, handlePlay, handlePause } = useVideoEvents()
  useEffect(() => {
    // 这里不直接绑定 DOM 事件，交给具体 Video 组件调用这些回调
    // 仅记录存在性，供消费方获取
    logger.debug('Video events ready')
  }, [])

  return <>{children}</>
}
