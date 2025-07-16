import { usePlayerStore } from '@renderer/state/stores/player.store'
import type { SubtitleItem } from '@types'
import { Button } from 'antd'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { useSubtitleEngine } from '../hooks'
import { useSubtitles } from '../state/player-context'
import { ImportSubtitleButton } from './'

interface EmptyAction {
  key?: string
  label: string
  onClick: () => void
  icon?: ReactNode
  type?: 'primary' | 'default'
}

interface SubtitleListPannelProps {
  /** 空状态主标题（可选） */
  emptyTitle?: string
  /** 空状态副标题/说明（可选） */
  emptyDescription?: string
  /** 空状态操作按钮（可选） */
  emptyActions?: EmptyAction[]
}

function SubtitleListPanel({
  emptyTitle,
  emptyDescription,
  emptyActions
}: SubtitleListPannelProps) {
  const subtitles = useSubtitles()
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolled, setUserScrolled] = useState(false)
  const [showBackToCurrent, setShowBackToCurrent] = useState(false)

  const currentTime = usePlayerStore((s) => s.currentTime)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const subtitleFollow = usePlayerStore((s) => s.subtitleFollow)
  const setSubtitleFollow = usePlayerStore((s) => s.setSubtitleFollow)

  // 使用字幕引擎
  const { currentIndex } = useSubtitleEngine(subtitles, currentTime)

  // 格式化时间显示
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // 点击字幕行跳转
  const handleSubtitleClick = useCallback(
    (subtitle: SubtitleItem) => {
      setCurrentTime(subtitle.startTime)
    },
    [setCurrentTime]
  )

  // 滚动到当前字幕
  const scrollToCurrentSubtitle = useCallback(() => {
    if (currentIndex >= 0 && containerRef.current) {
      const container = containerRef.current
      const items = container.querySelectorAll('[data-subtitle-item]')
      const currentItem = items[currentIndex] as HTMLElement

      if (currentItem) {
        const containerRect = container.getBoundingClientRect()
        const itemRect = currentItem.getBoundingClientRect()

        // 检查是否需要滚动
        const isVisible =
          itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom

        if (!isVisible) {
          currentItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }
    }
    setUserScrolled(false)
    setShowBackToCurrent(false)
  }, [currentIndex])

  // 自动滚动逻辑
  useEffect(() => {
    if (subtitleFollow && !userScrolled && currentIndex >= 0) {
      scrollToCurrentSubtitle()
    }
  }, [subtitleFollow, userScrolled, currentIndex, scrollToCurrentSubtitle])

  // 监听用户滚动
  const handleScroll = useCallback(() => {
    if (!userScrolled) {
      setUserScrolled(true)
      setShowBackToCurrent(true)
      // 暂时关闭自动跟随
      if (subtitleFollow) {
        setSubtitleFollow(false)
      }
    }
  }, [userScrolled, subtitleFollow, setSubtitleFollow])

  // 回到当前字幕
  const handleBackToCurrent = useCallback(() => {
    setSubtitleFollow(true)
    scrollToCurrentSubtitle()
  }, [setSubtitleFollow, scrollToCurrentSubtitle])

  if (subtitles.length === 0) {
    return (
      <Container role="complementary" aria-label="caption-list">
        <EmptyState>
          <PrimaryText>{emptyTitle ?? '在视频文件同目录下未找到匹配的字幕文件'}</PrimaryText>
          <SecondaryText>
            {emptyDescription ?? '您可以点击下方按钮选择字幕文件，或将字幕文件拖拽到此区域'}
          </SecondaryText>
          {emptyActions && emptyActions.length > 0 && (
            <ActionsRow>
              {emptyActions.map((action, idx) => (
                <ActionButton
                  key={action.key ?? String(idx)}
                  type={action.type ?? 'primary'}
                  icon={action.icon}
                  onClick={action.onClick}
                >
                  {action.label}
                </ActionButton>
              ))}
            </ActionsRow>
          )}
          {/* 直接在空态区域提供导入字幕按钮 */}
          <ActionsRow>
            <ImportSubtitleButton />
          </ActionsRow>
        </EmptyState>
      </Container>
    )
  }

  return (
    <Container role="complementary" aria-label="caption-list">
      <ScrollContainer ref={containerRef} onScroll={handleScroll}>
        {subtitles.map((subtitle, index) => (
          <SubtitleItem
            key={subtitle.id}
            data-subtitle-item
            active={index === currentIndex}
            onClick={() => handleSubtitleClick(subtitle)}
          >
            <TimesRow>
              <TimeStamp>{formatTime(subtitle.startTime)}</TimeStamp>
              <EndStamp>{formatTime(subtitle.endTime)}</EndStamp>
            </TimesRow>
            <TextContent>{subtitle.originalText}</TextContent>
          </SubtitleItem>
        ))}
      </ScrollContainer>

      {showBackToCurrent && (
        <BackToCurrentButton onClick={handleBackToCurrent}>回到当前</BackToCurrentButton>
      )}
    </Container>
  )
}

export default SubtitleListPanel

const Container = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
  min-height: 0;
  background: transparent; /* 避免与右侧面板背景冲突，使用外层背景 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const ScrollContainer = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border, #2a2a2a);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-3, #666);
  }
`

const EmptyState = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 24px;
`

const PrimaryText = styled.div`
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1, #ddd);
`

const SecondaryText = styled.div`
  margin-top: 2px;
  font-size: 13px;
  color: var(--color-text-3, #666);
  max-width: 460px;
  line-height: 1.6;
`

const ActionsRow = styled.div`
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
`

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
`

const SubtitleItem = styled.div<{ active: boolean }>`
  display: block;
  margin: 6px 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 12px;
  background: ${(p) =>
    p.active ? 'var(--color-primary-bg, rgba(22,119,255,.12))' : 'transparent'};
  box-shadow: ${(p) => (p.active ? '0 1px 6px rgba(0,0,0,.25)' : 'none')};
  transition: background 0.2s;

  &:hover {
    background: ${(p) =>
      p.active ? 'var(--color-primary-bg, rgba(22,119,255,.12))' : 'var(--color-bg-2, #1a1a1a)'};
  }
`

const TimesRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--color-text-3, #666);
`

const TimeStamp = styled.div`
  font-family: monospace;
`

const EndStamp = styled.div`
  margin-left: auto;
  font-family: monospace;
`

const TextContent = styled.div`
  font-size: 13px;
  color: var(--color-text-1, #ddd);
  line-height: 1.5;
  word-break: break-word;
`

const BackToCurrentButton = styled.button`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: var(--color-primary, #1677ff);
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;

  &:hover {
    background: var(--color-primary-hover, #0958d9);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`
