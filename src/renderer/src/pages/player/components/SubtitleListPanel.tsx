import type { SubtitleItem } from '@types'
import { Button } from 'antd'
import { ReactNode, RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import styled from 'styled-components'

import { usePlayerEngine, useSubtitleEngine } from '../hooks'
import { usePlayerCommands } from '../hooks/usePlayerCommands'
import {
  SubtitleScrollState,
  useSubtitleScrollStateMachine
} from '../hooks/useSubtitleScrollStateMachine'
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
  usePlayerEngine()
  const virtuosoRef = useRef<VirtuosoHandle | null>(null)
  const scrollerElRef = useRef<HTMLElement | null>(null)
  const avgItemHeightRef = useRef<number>(56) // 初始估算单项高度
  const initialIndexRef = useRef<number | null>(null)
  const initialCenterAppliedRef = useRef(false)

  const { orchestrator } = usePlayerEngine()
  const { currentIndex } = useSubtitleEngine()
  const { seekToSubtitle } = usePlayerCommands()

  // 使用新的状态机Hook
  const { scrollState, handleItemClick, handleRangeChanged, initialize } =
    useSubtitleScrollStateMachine(
      currentIndex,
      subtitles.length,
      virtuosoRef as RefObject<VirtuosoHandle>,
      seekToSubtitle
    )

  // 计算首次加载的初始索引（仅在 Virtuoso 首次挂载前生效）
  const initialTopMostItemIndex = useMemo(() => {
    if (subtitles.length === 0) return undefined
    if (initialIndexRef.current === null) {
      let idx = -1
      const activeCueIndex = orchestrator.getActiveSubtitleIndex()
      if (activeCueIndex >= 0 && activeCueIndex < subtitles.length) {
        idx = activeCueIndex
      } else if (currentIndex >= 0) {
        idx = currentIndex
      } else {
        idx = 0
      }
      initialIndexRef.current = idx
    }
    return initialIndexRef.current === null || initialIndexRef.current < 0
      ? undefined
      : initialIndexRef.current
  }, [subtitles.length, orchestrator, currentIndex])

  // 格式化时间显示
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // 初始化状态机（当字幕加载完成时）
  useEffect(() => {
    if (subtitles.length > 0 && scrollState === SubtitleScrollState.DISABLED) {
      initialize()
    }
  }, [subtitles.length, scrollState, initialize])

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
      <ScrollContainer>
        <Virtuoso
          key={
            initialTopMostItemIndex !== undefined
              ? `virt-${initialTopMostItemIndex}-${subtitles.length}`
              : `virt-empty-${subtitles.length}`
          }
          ref={virtuosoRef as any}
          data={subtitles}
          totalCount={subtitles.length}
          defaultItemHeight={avgItemHeightRef.current}
          initialTopMostItemIndex={initialTopMostItemIndex}
          itemContent={(index, subtitle: SubtitleItem) => (
            <SubtitleItem
              data-subtitle-item
              data-index={index}
              data-active={index === currentIndex}
              $active={index === currentIndex}
              onClick={() => handleItemClick(index)}
            >
              <TimesRow>
                <TimeStamp>{formatTime(subtitle.startTime)}</TimeStamp>
                <EndStamp>{formatTime(subtitle.endTime)}</EndStamp>
              </TimesRow>
              <TextContent>{subtitle.originalText}</TextContent>
            </SubtitleItem>
          )}
          components={{}}
          alignToBottom
          increaseViewportBy={{ top: 160, bottom: 160 }}
          computeItemKey={(index, s: SubtitleItem) => s.id ?? index}
          atTopThreshold={24}
          atBottomThreshold={24}
          atTopStateChange={() => {
            // 状态由状态机管理，这里暂时保留但不执行任何操作
          }}
          atBottomStateChange={() => {
            // 状态由状态机管理，这里暂时保留但不执行任何操作
          }}
          scrollerRef={(ref) => {
            const el = (ref as HTMLElement) ?? null
            scrollerElRef.current = el
          }}
          rangeChanged={({ startIndex, endIndex }) => {
            const scroller = scrollerElRef.current
            if (scroller) {
              avgItemHeightRef.current = Math.max(
                56,
                scroller.clientHeight / Math.max(1, endIndex - startIndex + 1)
              )
            }

            // 初次挂载后，将初始索引项滚动到垂直居中（只执行一次）
            if (
              !initialCenterAppliedRef.current &&
              initialIndexRef.current !== null &&
              initialIndexRef.current >= 0 &&
              virtuosoRef.current
            ) {
              initialCenterAppliedRef.current = true
              virtuosoRef.current.scrollToIndex({
                index: initialIndexRef.current,
                align: 'center',
                behavior: 'auto'
              })
              return
            }

            // 使用新的状态机处理范围变化
            handleRangeChanged({ startIndex, endIndex })
          }}
        />
      </ScrollContainer>
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

const SubtitleItem = styled.div<{ $active: boolean }>`
  display: block;
  margin: 6px 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 12px;
  background: ${(p) => (p.$active ? 'var(--color-primary-mute)' : 'transparent')};
  box-shadow: ${(p) => (p.$active ? '0 1px 6px rgba(0,0,0,.25)' : 'none')};
  transition: background 0.2s;

  &:hover {
    background: ${(p) =>
      p.$active ? 'var(--color-primary-mute)' : 'var(--color-list-item-hover)'};
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
