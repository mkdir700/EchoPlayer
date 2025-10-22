import type { SubtitleItem as SubtitleItemType } from '@types'
import { MouseEvent, useCallback, useState } from 'react'
import styled from 'styled-components'

import SubtitleActionButtons from './SubtitleActionButtons'
import HighlightedText from './SubtitleSearchHighlight'

interface SubtitleItemProps {
  /** 字幕数据 */
  subtitle: SubtitleItemType
  /** 在列表中的索引 */
  index: number
  /** 是否为当前激活的字幕 */
  isActive: boolean
  /** 时间格式化函数 */
  formatTime: (time: number) => string
  /** 点击事件处理 */
  onClick: (index: number) => void
  /** 搜索查询（用于高亮） */
  searchQuery?: string
  /** 是否悬停状态 */
  isHovered?: boolean
  /** 悬停变化回调 */
  onHoverChange?: (isHovered: boolean) => void
  /** 右键菜单处理 */
  onContextMenu?: (event: MouseEvent, subtitle: SubtitleItemType, index: number) => void
  /** 操作按钮点击处理 */
  onActionClick?: (
    action: 'ai-ask' | 'translate' | 'edit' | 'more',
    subtitle: SubtitleItemType,
    index: number
  ) => void
}

/**
 * 字幕条目组件 - 支持交互功能的单个字幕项
 *
 * 该组件提供：
 * - 基础的字幕显示和时间戳
 * - 点击跳转功能
 * - 悬停效果支持
 * - 右键菜单支持
 * - 搜索结果高亮
 */
function SubtitleItem({
  subtitle,
  index,
  isActive,
  formatTime,
  onClick,
  searchQuery,
  isHovered = false,
  onHoverChange,
  onContextMenu,
  onActionClick
}: SubtitleItemProps) {
  const [isHovering, setIsHovering] = useState(false)

  const handleClick = useCallback(() => {
    onClick(index)
  }, [onClick, index])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
    onHoverChange?.(true)
  }, [onHoverChange])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    onHoverChange?.(false)
  }, [onHoverChange])

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      onContextMenu?.(event, subtitle, index)
    },
    [onContextMenu, subtitle, index]
  )

  return (
    <Container
      data-subtitle-item
      data-index={index}
      data-active={isActive}
      $active={isActive}
      $hovered={isHovering || isHovered}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      role="listitem"
      tabIndex={0}
      aria-label={`字幕 ${index + 1}: ${subtitle.originalText}`}
      aria-selected={isActive}
    >
      <TimesRow>
        <TimeStamp>{formatTime(subtitle.startTime)}</TimeStamp>
        <EndStamp>{formatTime(subtitle.endTime)}</EndStamp>
      </TimesRow>
      <TextContent>
        {searchQuery ? (
          <HighlightedText text={subtitle.originalText} query={searchQuery} />
        ) : (
          subtitle.originalText
        )}
      </TextContent>

      {onActionClick && (
        <SubtitleActionButtons
          subtitle={subtitle}
          index={index}
          visible={isHovering || isHovered}
          onClick={onActionClick}
        />
      )}
    </Container>
  )
}

export default SubtitleItem

const Container = styled.div<{ $active: boolean; $hovered: boolean }>`
  display: block;
  margin: 6px 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 12px;
  background: ${(p) => {
    if (p.$active) return 'var(--color-primary-mute)'
    if (p.$hovered) return 'var(--color-list-item-hover)'
    return 'transparent'
  }};
  box-shadow: ${(p) => (p.$active ? '0 1px 6px rgba(0,0,0,.25)' : 'none')};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  user-select: none;

  &:hover {
    background: ${(p) =>
      p.$active ? 'var(--color-primary-mute)' : 'var(--color-list-item-hover)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary, #1890ff);
    outline-offset: 2px;
  }
`

const TimesRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--color-text-3, #666);
  font-family: monospace;
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
