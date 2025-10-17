import { loggerService } from '@logger'
import {
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING
} from '@renderer/infrastructure/styles/theme'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { SubtitleReader } from '@renderer/services/subtitles/SubtitleReader'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { IpcChannel } from '@shared/IpcChannel'
import type { SubtitleStream, SubtitleStreamsResponse } from '@types'
import { Divider, Empty, message, Modal, Spin, Tag } from 'antd'
import { AlertCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useCurrentVideo } from '../state/player-context'

const logger = loggerService.withContext('SubtitleTrackSelector')

interface SubtitleTrackSelectorProps {
  visible: boolean
  streams: SubtitleStreamsResponse | null
  originalFilePath?: string
  onClose: () => void
  onImported?: () => void
  onDismiss?: () => void
}

const SubtitleTrackSelector: React.FC<SubtitleTrackSelectorProps> = ({
  visible,
  streams,
  originalFilePath,
  onClose,
  onImported,
  onDismiss
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()

  const currentVideoId = useCurrentVideo()?.id
  const setSubtitles = usePlayerSubtitlesStore((s) => s.setSubtitles)
  const setSource = usePlayerSubtitlesStore((s) => s.setSource)

  // 分离文本和图像字幕轨道
  const { textStreams, imageStreams } = useMemo(() => {
    if (!streams) {
      return { textStreams: [], imageStreams: [] }
    }
    return {
      textStreams: streams.textStreams || [],
      imageStreams: streams.imageStreams || []
    }
  }, [streams])

  // 处理导入
  const handleImport = useCallback(
    async (streamIndex: number) => {
      setIsLoading(true)
      try {
        const stream = streams?.streams.find((s) => s.index === streamIndex)
        if (!stream) {
          message.error(t('player.subtitleTrackSelector.messages.importFailed'))
          return
        }

        // 调用主进程提取字幕（使用原始文件路径，而不是 HLS 播放源）
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.Media_ExtractSubtitle, {
          videoPath: originalFilePath || streams?.videoPath,
          streamIndex: stream.index,
          subtitleCodec: stream.codec
        })

        if (result.success && result.outputPath) {
          // 读取提取的字幕文件
          const reader = SubtitleReader.create('SubtitleTrackSelector')
          const items = await reader.readFromFile(result.outputPath)

          if (items && items.length > 0) {
            const source =
              stream.title ||
              stream.language ||
              t('player.subtitleTrackSelector.stream.label', { index: stream.index })

            setSubtitles(items)
            setSource({ type: 'embedded', name: source })

            // 写入字幕库记录，包含解析后的字幕数据
            if (currentVideoId) {
              try {
                const svc = new SubtitleLibraryService()
                await svc.addRecordWithSubtitles({
                  videoId: currentVideoId,
                  filePath: result.outputPath,
                  subtitles: items
                })
                logger.info('字幕数据已缓存到数据库', { count: items.length })
              } catch (e) {
                logger.warn('写入字幕库记录失败（不影响本次使用）', { error: e })
              }
            } else {
              logger.warn('当前没有视频ID，无法持久化字幕数据到数据库')
            }

            message.success(
              t('player.subtitleTrackSelector.messages.importSuccess', {
                source,
                count: items.length
              })
            )

            onImported?.()
            onClose()
          } else {
            message.error(t('player.subtitleTrackSelector.messages.importFailed'))
          }
        } else {
          message.error(t('player.subtitleTrackSelector.messages.importFailed'))
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : t('player.subtitleTrackSelector.messages.importFailed')
        message.error(msg)
        logger.error('Import subtitle failed', { error })
      } finally {
        setIsLoading(false)
      }
    },
    [streams, originalFilePath, currentVideoId, setSubtitles, setSource, onClose, onImported, t]
  )

  // 处理关闭
  const handleClose = useCallback(() => {
    onDismiss?.()
    onClose()
  }, [onClose, onDismiss])

  // 渲染字幕轨道项
  const renderStreamItem = (stream: SubtitleStream, disabled: boolean = false) => {
    const label =
      stream.title ||
      stream.language ||
      t('player.subtitleTrackSelector.stream.label', { index: stream.index })
    const codec = stream.codec.toUpperCase()

    const handleImportClick = async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled) return

      await handleImport(stream.index)
    }

    return (
      <StreamItemContainer key={stream.index} disabled={disabled}>
        <StreamLabel disabled={disabled}>
          {label}
          {stream.isDefault && (
            <Tag color="blue">{t('player.subtitleTrackSelector.stream.tags.default')}</Tag>
          )}
          {stream.isForced && (
            <Tag color="orange">{t('player.subtitleTrackSelector.stream.tags.forced')}</Tag>
          )}
        </StreamLabel>
        <CodecTag>{codec}</CodecTag>
        {disabled ? (
          <UnsupportedTag>
            {t('player.subtitleTrackSelector.stream.tags.unsupported')}
          </UnsupportedTag>
        ) : (
          <ImportButton onClick={handleImportClick}>
            {t('player.subtitleTrackSelector.actions.import')}
          </ImportButton>
        )}
      </StreamItemContainer>
    )
  }

  return (
    <Modal
      title={t('player.subtitleTrackSelector.title')}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={520}
      centered
      maskClosable={false}
    >
      <Spin spinning={isLoading}>
        {!streams || streams.streams.length === 0 ? (
          <Empty description={t('player.subtitleTrackSelector.empty')} />
        ) : (
          <Container>
            {/* 文本字幕轨道 */}
            {textStreams.length > 0 && (
              <Section>
                <SectionTitle>{t('player.subtitleTrackSelector.sections.text')}</SectionTitle>
                <StreamsList>
                  {textStreams.map((stream) => renderStreamItem(stream, false))}
                </StreamsList>
              </Section>
            )}

            {/* 分隔线 */}
            {textStreams.length > 0 && imageStreams.length > 0 && <Divider />}

            {/* PGS 图像字幕轨道 */}
            {imageStreams.length > 0 && (
              <Section>
                <SectionTitleWithWarning>
                  <AlertCircle size={16} style={{ marginRight: '8px', color: '#faad14' }} />
                  {t('player.subtitleTrackSelector.sections.image')}
                </SectionTitleWithWarning>
                <WarningText>{t('player.subtitleTrackSelector.warning.pgs')}</WarningText>
                <StreamsList>
                  {imageStreams.map((stream) => renderStreamItem(stream, true))}
                </StreamsList>
              </Section>
            )}
          </Container>
        )}
      </Spin>
    </Modal>
  )
}

export default SubtitleTrackSelector

// Styled Components
const Container = styled.div`
  padding: 12px 0;
`

const Section = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
`

const SectionTitleWithWarning = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
`

const WarningText = styled.div`
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(250, 173, 20, 0.1);
  border-left: 3px solid #faad14;
  border-radius: 4px;
`

const StreamsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const StreamItemContainer = styled.div<{ disabled?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.disabled ? 'var(--color-bg-2)' : 'var(--color-bg-3)')};
    border-color: ${(props) => (props.disabled ? 'var(--color-border)' : 'var(--color-primary)')};
  }
`

const StreamLabel = styled.div<{ disabled?: boolean }>`
  flex: 1;
  font-size: 13px;
  color: ${(props) => (props.disabled ? 'var(--color-text-3)' : 'var(--color-text-1)')};
  display: flex;
  align-items: center;
  gap: 8px;
`

const CodecTag = styled(Tag)`
  margin: 0;
  font-size: 11px;
`

const UnsupportedTag = styled(Tag)`
  margin: 0;
  background: #faad14;
  color: #fff;
  border-color: #faad14;
  font-size: 11px;
`

const ImportButton = styled.button`
  position: absolute;
  right: 12px;
  padding: ${SPACING.XS}px ${SPACING.MD}px;
  background: var(--ant-color-primary);
  border: 1px solid var(--ant-color-primary);
  border-radius: ${BORDER_RADIUS.SM}px;
  color: white;
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  pointer-events: none;

  ${StreamItemContainer}:hover & {
    opacity: 1;
    pointer-events: auto;
  }

  &:hover {
    background: var(--ant-color-primary-hover);
    border-color: var(--ant-color-primary-hover);
    transform: translateY(-1px);
  }
`
