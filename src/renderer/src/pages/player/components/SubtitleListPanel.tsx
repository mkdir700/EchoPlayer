import { usePlayerStore } from '@renderer/state/stores/player.store'
import type { SubtitleItem } from '@types'
import { Button, FloatButton, Tooltip } from 'antd'
import { LocateFixed } from 'lucide-react'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import styled from 'styled-components'

import { usePlayerEngine, useSubtitleEngine } from '../hooks'
import { usePlayerCommands } from '../hooks/usePlayerCommands'
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
  const [userScrolled, setUserScrolled] = useState(false)
  const [showBackToCurrent, setShowBackToCurrent] = useState(false)
  usePlayerEngine()
  const virtuosoRef = useRef<VirtuosoHandle | null>(null)
  const scrollerElRef = useRef<HTMLElement | null>(null)
  const programmaticScrollRef = useRef(false)
  const resetProgrammaticTimerRef = useRef<number | null>(null)
  // 抑制“回到当前”按钮在点击后的短暂闪现
  const suppressShowBackRef = useRef(false)
  const suppressShowBackTimerRef = useRef<number | null>(null)
  const prevIndexRef = useRef<number>(-1)
  const prevTimeRef = useRef<number>(-1)
  const viewportHeightRef = useRef<number>(0)
  const avgItemHeightRef = useRef<number>(56) // 初始估算单项高度
  const initialIndexRef = useRef<number | null>(null)
  const initialCenterAppliedRef = useRef(false)
  const isAtTopRef = useRef(false)
  const isAtBottomRef = useRef(false)

  const currentTime = usePlayerStore((s) => s.currentTime)
  const { orchestrator } = usePlayerEngine()
  const { currentIndex } = useSubtitleEngine()
  const { seekToSubtitle } = usePlayerCommands()
  const [subtitleFollow, setSubtitleFollow] = useState(false)

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

  // 点击字幕行跳转 - 使用 orchestrator 命令
  const handleSubtitleClick = useCallback(
    (index: number) => {
      seekToSubtitle(index)
    },
    [seekToSubtitle]
  )

  // 根据阶段与跳转幅度滚动到当前字幕
  const scrollToCurrentRow = useCallback(
    (forceImmediate?: boolean) => {
      if (currentIndex < 0 || !virtuosoRef.current) return

      // 测量视口高度与当前项高度（粗略）
      const scroller = scrollerElRef.current
      if (scroller) {
        viewportHeightRef.current = scroller.clientHeight
        const activeEl = scroller.querySelector(
          `[data-subtitle-item][data-index="${currentIndex}"]`
        ) as HTMLElement | null
        const sampleEl =
          activeEl || (scroller.querySelector('[data-subtitle-item]') as HTMLElement | null)
        if (sampleEl) {
          const h = sampleEl.offsetHeight
          if (h > 0) avgItemHeightRef.current = h
        }
      }

      const total = subtitles.length
      const i = currentIndex
      const prevI = prevIndexRef.current
      const timeJump = prevTimeRef.current >= 0 ? Math.abs(currentTime - prevTimeRef.current) : 0
      const indexJump = prevI >= 0 ? Math.abs(i - prevI) : 0
      const largeJump = timeJump > 2 || indexJump > 3

      const viewportItems = Math.max(
        1,
        Math.floor(viewportHeightRef.current / Math.max(1, avgItemHeightRef.current))
      )
      const threshold = Math.ceil(viewportItems / 2)

      // 计算阶段对齐方式（结合顶部/底部状态与索引阶段）
      let align: 'start' | 'center' | 'end' | undefined
      if (isAtTopRef.current) {
        align = 'start'
      } else if (isAtBottomRef.current) {
        align = 'end'
      } else if (i === 0) {
        // 开始阶段：第一个字幕顶对齐
        align = 'start'
      } else if (i >= total - threshold) {
        // 结束阶段：靠近底部时底对齐
        align = 'end'
      } else if (i < threshold && !largeJump) {
        // 开始阶段过渡：不滚动，让聚焦项逐步下移到中间
        align = undefined
      } else {
        // 中间阶段：保持居中
        align = 'center'
      }

      // 执行滚动
      if (align) {
        programmaticScrollRef.current = true
        if (resetProgrammaticTimerRef.current) {
          window.clearTimeout(resetProgrammaticTimerRef.current)
          resetProgrammaticTimerRef.current = null
        }
        virtuosoRef.current.scrollToIndex({
          index: i,
          align,
          behavior: forceImmediate || largeJump ? 'auto' : 'smooth'
        })
        resetProgrammaticTimerRef.current = window.setTimeout(() => {
          programmaticScrollRef.current = false
        }, 200)
        setUserScrolled(false)
        setShowBackToCurrent(false)
      }

      // 记录历史
      prevIndexRef.current = i
      prevTimeRef.current = currentTime
    },
    [currentIndex, currentTime, subtitles.length]
  )

  // 自动滚动逻辑
  useEffect(() => {
    if (subtitleFollow && !userScrolled && currentIndex >= 0) {
      scrollToCurrentRow()
    }
  }, [subtitleFollow, userScrolled, currentIndex, scrollToCurrentRow])

  const handleBackToCurrent = useCallback(() => {
    setSubtitleFollow(true)
    setUserScrolled(false)
    setShowBackToCurrent(false)
    // 在点击后的短时间内抑制按钮再次出现，避免视觉闪烁
    suppressShowBackRef.current = true
    if (suppressShowBackTimerRef.current) {
      window.clearTimeout(suppressShowBackTimerRef.current)
      suppressShowBackTimerRef.current = null
    }
    suppressShowBackTimerRef.current = window.setTimeout(() => {
      suppressShowBackRef.current = false
    }, 600)

    // 使用立即滚动，避免平滑滚动期间 rangeChanged 中的临时“越界”导致按钮短暂回显
    scrollToCurrentRow(true)
  }, [setSubtitleFollow, scrollToCurrentRow])

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
              active={index === currentIndex}
              onClick={() => handleSubtitleClick(index)}
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
          atTopStateChange={(atTop) => {
            isAtTopRef.current = atTop
          }}
          atBottomStateChange={(atBottom) => {
            isAtBottomRef.current = atBottom
          }}
          scrollerRef={(ref) => {
            const el = (ref as HTMLElement) ?? null
            scrollerElRef.current = el
          }}
          rangeChanged={({ startIndex, endIndex }) => {
            const scroller = scrollerElRef.current
            if (scroller) {
              viewportHeightRef.current = scroller.clientHeight
            }

            // 初次挂载后，将初始索引项滚动到垂直居中（只执行一次）
            if (
              !initialCenterAppliedRef.current &&
              initialIndexRef.current !== null &&
              initialIndexRef.current >= 0 &&
              virtuosoRef.current
            ) {
              initialCenterAppliedRef.current = true
              programmaticScrollRef.current = true
              if (resetProgrammaticTimerRef.current) {
                window.clearTimeout(resetProgrammaticTimerRef.current)
                resetProgrammaticTimerRef.current = null
              }
              virtuosoRef.current.scrollToIndex({
                index: initialIndexRef.current,
                align: 'center',
                behavior: 'auto'
              })
              resetProgrammaticTimerRef.current = window.setTimeout(() => {
                programmaticScrollRef.current = false
              }, 200)
              return
            }

            if (programmaticScrollRef.current) return
            const out = currentIndex < startIndex || currentIndex > endIndex
            if (out) {
              if (!userScrolled && !suppressShowBackRef.current) {
                setUserScrolled(true)
                setShowBackToCurrent(true)
                if (subtitleFollow) setSubtitleFollow(false)
              }
            } else {
              if (userScrolled) {
                setUserScrolled(false)
                setShowBackToCurrent(false)
              }
            }
          }}
        />
      </ScrollContainer>

      <BackToCurrentWrapper $visible={showBackToCurrent} aria-hidden={!showBackToCurrent}>
        <Tooltip title="回到当前字幕">
          <BackToCurrentFloatButton
            type="primary"
            shape="circle"
            icon={<LocateFixed size={18} />}
            onClick={handleBackToCurrent}
            aria-label="回到当前字幕"
          />
        </Tooltip>
      </BackToCurrentWrapper>
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
  background: ${(p) => (p.active ? 'var(--color-primary-mute)' : 'transparent')};
  box-shadow: ${(p) => (p.active ? '0 1px 6px rgba(0,0,0,.25)' : 'none')};
  transition: background 0.2s;

  &:hover {
    background: ${(p) => (p.active ? 'var(--color-primary-mute)' : 'var(--color-list-item-hover)')};
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

const BackToCurrentWrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 16px;
  right: 16px;

  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.15s ease;
  pointer-events: ${(p) => (p.$visible ? 'auto' : 'none')};
  z-index: 2;
`

const BackToCurrentFloatButton = styled(FloatButton)`
  && {
    position: static !important; /* 在容器内定位 */
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`
