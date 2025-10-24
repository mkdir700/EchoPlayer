import { loggerService } from '@logger'
import { BORDER_RADIUS, SPACING } from '@renderer/infrastructure/styles/theme'
import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import type { SubtitleItem } from '@types'
import { Button } from 'antd'
import { FileText, Loader2, Search, Sparkles, Video, X } from 'lucide-react'
import { ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import styled from 'styled-components'

import { usePlayerEngine, useSubtitleEngine } from '../hooks'
import { usePlayerCommands } from '../hooks/usePlayerCommands'
import { useSubtitleInteraction } from '../hooks/useSubtitleInteraction'
import {
  SubtitleScrollState,
  useSubtitleScrollStateMachine
} from '../hooks/useSubtitleScrollStateMachine'
import { useSubtitleTranslation } from '../hooks/useSubtitleTranslation'
import { useSubtitles } from '../state/player-context'
import { ImportSubtitleButton } from './'
import SubtitleContextMenu from './SubtitleContextMenu'
import SubtitleItemComponent from './SubtitleItem'

const logger = loggerService.withContext('SubtitleListPannel')

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
  /** 是否有内置字幕 */
  hasEmbeddedSubtitles?: boolean
  /** 打开内置字幕选择对话框 */
  onOpenEmbeddedSubtitleSelector?: () => void
  /** 打开 ASR 字幕生成对话框 */
  onOpenASRGenerator?: () => void
  /** 是否启用 ASR 功能（当 API key 已配置时） */
  asrEnabled?: boolean
}

type SubtitleSearchResult = {
  subtitle: SubtitleItem
  index: number
}

/**
 * Render the subtitle list panel with search, virtualized list, and empty-state actions.
 *
 * Renders either an empty-state view with import/embedded/AI options and legacy actions when no subtitles are available,
 * or a searchable, virtualized list of subtitles with time formatting, range-based scrolling state management, and item selection.
 *
 * @param emptyDescription - Optional custom description to display in the empty-state header.
 * @param emptyActions - Optional list of custom action buttons to show in the empty-state legacy actions row.
 * @param hasEmbeddedSubtitles - When true, show the embedded-subtitle option card in the empty state.
 * @param onOpenEmbeddedSubtitleSelector - Callback invoked when the embedded-subtitle option's "select" button is clicked.
 * @returns The subtitle list panel element.
 */
function SubtitleListPanel({
  emptyDescription,
  emptyActions,
  hasEmbeddedSubtitles,
  onOpenEmbeddedSubtitleSelector,
  onOpenASRGenerator,
  asrEnabled = false
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
  const { t } = useTranslation()

  // 使用字幕交互 Hook
  const {
    contextMenuState,
    isSubtitleHovered,
    handleContextMenu,
    closeContextMenu,
    cancelCloseContextMenu,
    scheduleCloseContextMenu
  } = useSubtitleInteraction()

  // 使用字幕翻译 Hook
  const { translationState, translateSubtitle } = useSubtitleTranslation()

  // 从 store 读取搜索状态
  const isSearchVisible = usePlayerUIStore((s) => s.subtitleSearch.isSearchVisible)
  const hideSubtitleSearch = usePlayerUIStore((s) => s.hideSubtitleSearch)

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const normalizedQuery = searchQuery.trim()

  const searchResults = useMemo<SubtitleSearchResult[]>(() => {
    if (!normalizedQuery) {
      return []
    }

    const query = normalizedQuery.toLowerCase()
    return subtitles.reduce<SubtitleSearchResult[]>((acc, subtitle, index) => {
      if (subtitle.originalText.toLowerCase().includes(query)) {
        acc.push({ subtitle, index })
      }
      return acc
    }, [])
  }, [subtitles, normalizedQuery])

  const hasSearchQuery = normalizedQuery.length > 0

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

  // 搜索功能相关函数
  const handleSearchClose = useCallback(() => {
    hideSubtitleSearch()
    setSearchQuery('')
  }, [hideSubtitleSearch])

  // 当搜索框打开时，自动聚焦
  useEffect(() => {
    if (isSearchVisible) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isSearchVisible])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }, [])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ' ' || e.code === 'Space' || e.key === 'Spacebar') {
        e.stopPropagation()
        if (typeof e.nativeEvent.stopImmediatePropagation === 'function') {
          e.nativeEvent.stopImmediatePropagation()
        }
        return
      }

      // ESC 键关闭搜索
      if (e.key === 'Escape') {
        handleSearchClose()
      }
    },
    [handleSearchClose]
  )

  // 搜索防抖
  useEffect(() => {
    if (!hasSearchQuery) {
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [hasSearchQuery, normalizedQuery])

  // 操作处理函数
  const handleActionClick = useCallback(
    (
      action: 'ai-ask' | 'translate' | 'edit' | 'more',
      subtitle: SubtitleItem,
      index: number,
      event?: React.MouseEvent
    ) => {
      logger.info(`Action ${action} clicked for subtitle ${subtitle.id} at index ${index}`)

      switch (action) {
        case 'ai-ask':
          // TODO: 打开 AI 询问对话框
          break
        case 'translate':
          // 执行翻译操作
          translateSubtitle(subtitle.id, subtitle.originalText)
          break
        case 'edit':
          // TODO: 开始编辑模式
          break
        case 'more': {
          // 计算按钮位置并打开右键菜单
          if (event && event.currentTarget) {
            const buttonElement = event.currentTarget as HTMLElement
            const rect = buttonElement.getBoundingClientRect()

            // 使用按钮的中心位置作为点击位置
            const clickPosition = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            }

            // 创建一个模拟的 contextmenu 事件，使用按钮中心位置
            const contextMenuEvent = {
              clientX: clickPosition.x,
              clientY: clickPosition.y,
              preventDefault: () => {},
              stopPropagation: () => {}
            } as any

            handleContextMenu(contextMenuEvent, subtitle, index)
          }
          break
        }
      }
    },
    [handleContextMenu, translateSubtitle]
  )

  // 右键菜单操作处理
  const handleContextMenuAction = useCallback(
    (action: string, subtitle: SubtitleItem, index: number) => {
      logger.info(`Context menu action ${action} for subtitle ${subtitle.id} at index ${index}`)

      switch (action) {
        case 'ai-ask':
          // TODO: 打开 AI 询问对话框
          break
        case 'translate':
          // 执行翻译操作
          translateSubtitle(subtitle.id, subtitle.originalText)
          break
        case 'edit':
          // TODO: 开始编辑模式
          break
        case 'copy':
          // 复制字幕文本到剪贴板
          navigator.clipboard.writeText(subtitle.originalText)
          break
      }
    },
    [translateSubtitle]
  )

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
          <EmptyHeader>
            <EmptyTitle>
              {emptyDescription ?? t('player.subtitleList.empty.description')}
            </EmptyTitle>
          </EmptyHeader>

          <OptionsGrid>
            {/* 内置字幕选项 */}
            {hasEmbeddedSubtitles && onOpenEmbeddedSubtitleSelector && (
              <OptionCard>
                <OptionIconWrapper $color="var(--ant-color-success, #52c41a)">
                  <Video size={20} />
                </OptionIconWrapper>
                <OptionContent>
                  <OptionTitle>{t('player.subtitleList.empty.options.embedded.title')}</OptionTitle>
                  <OptionDescription>
                    {t('player.subtitleList.empty.options.embedded.description')}
                  </OptionDescription>
                </OptionContent>
                <Button type="primary" onClick={onOpenEmbeddedSubtitleSelector}>
                  {t('player.subtitleList.empty.options.embedded.action')}
                </Button>
              </OptionCard>
            )}

            {/* 外挂字幕选项 */}
            <OptionCard>
              <OptionIconWrapper $color="var(--ant-color-primary, #1890ff)">
                <FileText size={20} />
              </OptionIconWrapper>
              <OptionContent>
                <OptionTitle>{t('player.subtitleList.empty.options.external.title')}</OptionTitle>
                <OptionDescription>
                  {t('player.subtitleList.empty.options.external.description')}
                </OptionDescription>
              </OptionContent>
              <ImportSubtitleButton />
            </OptionCard>

            {/* AI 生成选项 */}
            <OptionCard $disabled={!asrEnabled}>
              <OptionIconWrapper $color="var(--ant-color-warning, #faad14)">
                <Sparkles size={20} />
              </OptionIconWrapper>
              <OptionContent>
                <OptionTitle>{t('player.subtitleList.empty.options.ai.title')}</OptionTitle>
                <OptionDescription>
                  {t('player.subtitleList.empty.options.ai.description')}
                </OptionDescription>
              </OptionContent>
              <Button
                type="primary"
                disabled={!asrEnabled}
                onClick={asrEnabled ? onOpenASRGenerator : undefined}
              >
                {asrEnabled
                  ? t('player.subtitleList.empty.options.ai.actionEnabled')
                  : t('player.subtitleList.empty.options.ai.action')}
              </Button>
            </OptionCard>
          </OptionsGrid>

          {/* 保留旧的自定义操作按钮（如果有） */}
          {emptyActions && emptyActions.length > 0 && (
            <LegacyActionsRow>
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
            </LegacyActionsRow>
          )}
        </EmptyState>
      </Container>
    )
  }

  return (
    <Container role="complementary" aria-label="caption-list">
      {/* Control Bar - 搜索控制栏（仅在搜索激活时显示）*/}
      {isSearchVisible && (
        <ControlBar>
          <SearchInputContainer>
            <SearchIconWrapper>
              {isSearching ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
            </SearchIconWrapper>
            <SearchInput
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('player.subtitleList.search.placeholder')}
              autoComplete="off"
            />
            {searchQuery && (
              <ClearButton onClick={handleSearchClear}>
                <X size={14} />
              </ClearButton>
            )}
            <CloseButton onClick={handleSearchClose}>
              <X size={16} />
            </CloseButton>
          </SearchInputContainer>
        </ControlBar>
      )}

      {/* 搜索结果提示 */}
      {hasSearchQuery && (
        <SearchResultsHeader>
          {isSearching ? (
            <span>{t('player.subtitleList.search.pending')}</span>
          ) : searchResults.length > 0 ? (
            <span>{t('player.subtitleList.search.count', { count: searchResults.length })}</span>
          ) : (
            <span>{t('player.subtitleList.search.none')}</span>
          )}
        </SearchResultsHeader>
      )}

      <ScrollContainer>
        {hasSearchQuery ? (
          <SubtitleSearchResultsPanel
            results={searchResults}
            query={normalizedQuery}
            currentIndex={currentIndex}
            onSelect={handleItemClick}
            formatTime={formatTime}
            onActionClick={handleActionClick}
            onContextMenu={handleContextMenu}
          />
        ) : (
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
              <SubtitleItemComponent
                subtitle={subtitle}
                index={index}
                isActive={index === currentIndex}
                formatTime={formatTime}
                onClick={handleItemClick}
                isHovered={isSubtitleHovered(subtitle.id)}
                onContextMenu={handleContextMenu}
                onActionClick={handleActionClick}
                isCurrentlyTranslating={translationState.translatingId === subtitle.id}
              />
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
        )}
      </ScrollContainer>

      {/* 右键上下文菜单 */}
      <SubtitleContextMenu
        isOpen={contextMenuState.isOpen}
        position={contextMenuState.position}
        subtitle={subtitles.find((s) => s.id === contextMenuState.subtitleId)}
        subtitleIndex={contextMenuState.subtitleIndex}
        isCurrentlyTranslating={
          translationState.isTranslating &&
          translationState.translatingId === contextMenuState.subtitleId
        }
        onActionClick={handleContextMenuAction}
        onClose={closeContextMenu}
        cancelCloseContextMenu={cancelCloseContextMenu}
        scheduleCloseContextMenu={scheduleCloseContextMenu}
      />
    </Container>
  )
}

export default SubtitleListPanel

interface SubtitleSearchResultsPanelProps {
  results: SubtitleSearchResult[]
  query: string
  onSelect: (subtitleIndex: number) => void
  currentIndex: number
  formatTime: (time: number) => string
  onActionClick?: (
    action: 'ai-ask' | 'translate' | 'edit' | 'more',
    subtitle: SubtitleItem,
    index: number,
    event?: React.MouseEvent
  ) => void
  onContextMenu?: (event: React.MouseEvent, subtitle: SubtitleItem, index: number) => void
}

function SubtitleSearchResultsPanel({
  results,
  query,
  onSelect,
  currentIndex,
  formatTime,
  onActionClick,
  onContextMenu
}: SubtitleSearchResultsPanelProps) {
  const { t } = useTranslation()

  if (results.length === 0) {
    return (
      <SearchResultsEmpty role="status">
        <span>{t('player.subtitleList.search.emptyTitle')}</span>
        <span>{t('player.subtitleList.search.emptySubtitle')}</span>
      </SearchResultsEmpty>
    )
  }

  return (
    <SearchResultsList role="list" aria-label="subtitle-search-results">
      {results.map(({ subtitle, index }) => (
        <SubtitleItemComponent
          key={subtitle.id}
          subtitle={subtitle}
          index={index}
          isActive={index === currentIndex}
          formatTime={formatTime}
          onClick={onSelect}
          searchQuery={query}
          onActionClick={onActionClick}
          onContextMenu={onContextMenu}
        />
      ))}
    </SearchResultsList>
  )
}

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

const SearchResultsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 0;
  width: 100%;
`

const SearchResultsEmpty = styled.div`
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  color: var(--color-text-3, #666);
  text-align: center;
`

const EmptyState = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: ${SPACING.XL}px ${SPACING.MD}px;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--ant-color-border, #2a2a2a);
    border-radius: 3px;
  }
`

const EmptyHeader = styled.div`
  text-align: center;
  margin-bottom: ${SPACING.XL}px;
`

const EmptyTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--ant-color-text, #ddd);
  margin-bottom: ${SPACING.XS}px;
`

const OptionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.MD}px;
  width: 100%;
  max-width: 480px;
`

const OptionCard = styled.div<{ $disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.SM}px;
  padding: ${SPACING.MD}px;
  background: var(--ant-color-bg-elevated, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--ant-color-border, rgba(255, 255, 255, 0.08));
  border-radius: ${BORDER_RADIUS.LG}px;
  transition: all 0.2s ease;
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'default')};

  &:hover {
    ${(p) =>
      !p.$disabled &&
      `
      background: var(--ant-color-bg-container, rgba(255, 255, 255, 0.06));
      border-color: var(--ant-color-border-secondary, rgba(255, 255, 255, 0.12));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `}
  }
`

const OptionIconWrapper = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${BORDER_RADIUS.BASE}px;
  background: ${(p) => p.$color}20;
  color: ${(p) => p.$color};
  flex-shrink: 0;
`

const OptionContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${SPACING.XXS}px;
`

const OptionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--ant-color-text, #ddd);
`

const OptionDescription = styled.div`
  font-size: 12px;
  color: var(--ant-color-text-tertiary, #666);
  line-height: 1.5;
`

const LegacyActionsRow = styled.div`
  margin-top: ${SPACING.LG}px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.SM}px;
  flex-wrap: wrap;
`

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 ${SPACING.MD}px;
  border-radius: ${BORDER_RADIUS.LG}px;
`

// 搜索相关样式组件
const ControlBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: stretch;
  min-height: 40px;
  padding: ${SPACING.XS}px ${SPACING.SM}px;
  background: var(--color-background-soft, rgba(255, 255, 255, 0.02));
  border-bottom: 1px solid var(--color-border-soft, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  flex-shrink: 0;
  transition: all 0.2s ease;
  animation: slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const SearchInputContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: ${SPACING.XXS}px;
  height: 28px;
  padding: 0 ${SPACING.XS}px;
  background: var(--color-fill-2, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--color-border-soft, rgba(255, 255, 255, 0.08));
  border-radius: ${BORDER_RADIUS.LG}px;
  animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: all 0.2s ease;

  &:focus-within {
    background: var(--color-fill-1, rgba(255, 255, 255, 0.06));
    border-color: var(--color-primary, #1890ff);
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`

const SearchIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-3, #666);

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

const SearchInput = styled.input`
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-1, #ddd);
  font-size: 12px;
  padding: 0;
  min-width: 0;

  &::placeholder {
    color: var(--color-text-3, #666);
  }
`

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-3, #666);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--color-fill-3, rgba(255, 255, 255, 0.1));
    color: var(--color-text-1, #ddd);
  }

  &:active {
    transform: scale(0.9);
  }
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: ${BORDER_RADIUS.SM}px;
  background: transparent;
  color: var(--color-text-3, #666);
  cursor: pointer;
  flex-shrink: 0;
  margin-left: ${SPACING.XXS}px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--color-fill-3, rgba(255, 255, 255, 0.08));
    color: var(--color-text-1, #ddd);
  }

  &:active {
    transform: scale(0.96);
  }
`

const SearchResultsHeader = styled.div`
  padding: ${SPACING.XXS}px ${SPACING.SM}px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-3, #666);
  background: var(--color-background-soft, rgba(255, 255, 255, 0.02));
  border-bottom: 1px solid var(--color-border-soft, rgba(255, 255, 255, 0.04));
  flex-shrink: 0;
  letter-spacing: 0.2px;
`
