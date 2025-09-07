import { loggerService } from '@logger'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { SubtitleReader } from '@renderer/services/subtitles/SubtitleReader'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { FileMetadata } from '@shared/types/database'
import { SubtitleFormat } from '@types'
import { Button, message, Tooltip } from 'antd'
import { Captions } from 'lucide-react'
import { type FC, useCallback, useMemo } from 'react'
import styled from 'styled-components'

import { useCurrentVideo } from '../state/player-context'

const logger = loggerService.withContext('ImportSubtitleButton')

interface ImportSubtitleButtonProps {
  onImported?: (file: FileMetadata) => void
  size?: 'small' | 'middle' | 'large'
  type?: 'link' | 'text' | 'default' | 'primary'
  label?: string
}

const ImportSubtitleButton: FC<ImportSubtitleButtonProps> = ({
  onImported,
  size = 'middle',
  type = 'default',
  label
}) => {
  // 顶层读取 store：遵循 selector 规范，避免对象选择器
  const currentVideoId = useCurrentVideo()?.id
  const setSubtitles = usePlayerSubtitlesStore((s) => s.setSubtitles)
  const setSource = usePlayerSubtitlesStore((s) => s.setSource)
  const setLoading = usePlayerSubtitlesStore((s) => s.setLoading)

  // 基于 SubtitleFormat 构建支持的扩展名
  const supportedExts = useMemo(() => {
    const map: Record<SubtitleFormat, string> = {
      [SubtitleFormat.SRT]: 'srt',
      [SubtitleFormat.VTT]: 'vtt',
      [SubtitleFormat.ASS]: 'ass',
      [SubtitleFormat.SSA]: 'ssa',
      [SubtitleFormat.JSON]: 'json'
    }
    const exts = Object.values(map)
    return {
      // Electron filter - 为兼容项目里 videoExts 的写法，同时提供带点与不带点两种写法
      filterExts: exts, // ['srt','vtt','ass','ssa','json']
      validateSet: new Set(exts.map((e) => `.${e}`)) // ['.srt','.vtt',...]
    }
  }, [])

  const handleClick = useCallback(async () => {
    try {
      const files = await window.api.file.select({
        properties: ['openFile'],
        filters: [
          { name: 'Subtitle Files', extensions: supportedExts.filterExts },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (!files || files.length === 0) {
        return
      }

      const file = files[0]
      const extLower = (file.ext || '').toLowerCase()
      if (!supportedExts.validateSet.has(extLower)) {
        message.error('不支持的文件类型，请选择 .srt / .vtt / .ass / .ssa / .json 文件')
        return
      }

      if (!currentVideoId) {
        message.error('当前没有正在播放的视频，无法导入字幕')
        return
      }

      // 读取并解析字幕
      setLoading(true)
      const reader = SubtitleReader.create('ImportSubtitleButton')
      const items = await reader.readFromFile(file.path)

      if (!items || items.length === 0) {
        message.error('字幕文件解析失败或为空')
        setLoading(false)
        return
      }

      // 更新播放器字幕列表
      setSubtitles(items)
      setSource({ type: 'file', name: file.origin_name || file.name })

      // 写入字幕库记录，包含解析后的字幕数据
      try {
        const svc = new SubtitleLibraryService()
        await svc.addRecordWithSubtitles({
          videoId: currentVideoId,
          filePath: file.path,
          subtitles: items
        })
        logger.info('字幕数据已缓存到数据库', { count: items.length })
      } catch (e) {
        logger.warn('写入字幕库记录失败（不影响本次使用）', { error: e })
      }

      message.success(`已导入字幕：${file.origin_name || file.name}（共 ${items.length} 条）`)
      onImported?.(file)
    } catch (err: any) {
      const msg = err?.message || '导入字幕失败'
      message.error(msg)
      logger.error('导入字幕失败', { error: err })
    } finally {
      setLoading(false)
    }
  }, [onImported, supportedExts, currentVideoId, setLoading, setSource, setSubtitles])

  return (
    <Tooltip title={label ?? '导入字幕'} mouseEnterDelay={0.6}>
      <NoDrag>
        <StyledButton type={type} size={size} icon={<Captions size={16} />} onClick={handleClick}>
          {label ?? '导入字幕'}
        </StyledButton>
      </NoDrag>
    </Tooltip>
  )
}

export default ImportSubtitleButton

// 将按钮包裹在一个可点击区域内，避免与 app-region: drag 冲突
const NoDrag = styled.div`
  -webkit-app-region: none;
`

// 使用 styled-components 定制 antd Button，优先使用 CSS 变量
const StyledButton = styled(Button)`
  height: 32px;
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-1);
  border-color: var(--color-border, #333);
  background: var(--color-bg-2, transparent);
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: var(--color-hover, rgba(255, 255, 255, 0.06));
    color: var(--color-text-1);
  }

  &:active {
    background: var(--color-active, rgba(255, 255, 255, 0.08));
  }
`
