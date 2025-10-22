import { BORDER_RADIUS, SPACING } from '@renderer/infrastructure/styles/theme'
import type { SubtitleItem as SubtitleItemType } from '@types'
import { Edit3, Languages, MessageCircle, MoreHorizontal } from 'lucide-react'
import { useCallback } from 'react'
import styled from 'styled-components'

interface SubtitleActionButtonsProps {
  /** 字幕数据 */
  subtitle: SubtitleItemType
  /** 字幕在列表中的索引 */
  index: number
  /** 是否可见 */
  visible: boolean
  /** 点击事件处理 */
  onClick: (
    action: 'ai-ask' | 'translate' | 'edit' | 'more',
    subtitle: SubtitleItemType,
    index: number,
    event?: React.MouseEvent
  ) => void
}

/**
 * 字幕操作按钮组件
 *
 * 提供悬停时显示的快捷操作按钮：
 * - AI 询问
 * - 翻译
 * - 编辑
 * - 更多操作（打开右键菜单）
 */
function SubtitleActionButtons({ subtitle, index, visible, onClick }: SubtitleActionButtonsProps) {
  const handleActionClick = useCallback(
    (action: 'ai-ask' | 'translate' | 'edit' | 'more', event: React.MouseEvent) => {
      event.stopPropagation()
      onClick(action, subtitle, index, event)
    },
    [onClick, subtitle, index]
  )

  return (
    <Container $visible={visible}>
      <ActionButton
        type="button"
        onClick={(e) => handleActionClick('ai-ask', e)}
        title="向 AI 询问关于此字幕的问题"
        aria-label="AI 询问"
      >
        <MessageCircle size={14} />
      </ActionButton>

      <ActionButton
        type="button"
        onClick={(e) => handleActionClick('translate', e)}
        title="翻译此字幕"
        aria-label="翻译字幕"
      >
        <Languages size={14} />
      </ActionButton>

      <ActionButton
        type="button"
        onClick={(e) => handleActionClick('edit', e)}
        title="编辑此字幕"
        aria-label="编辑字幕"
      >
        <Edit3 size={14} />
      </ActionButton>

      <ActionButton
        type="button"
        onClick={(e) => handleActionClick('more', e)}
        title="更多操作"
        aria-label="更多操作"
      >
        <MoreHorizontal size={14} />
      </ActionButton>
    </Container>
  )
}

export default SubtitleActionButtons

const Container = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  right: ${SPACING.SM}px;
  transform: translateY(-50%);
  display: flex;
  gap: ${SPACING.XS}px;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  visibility: ${(p) => (p.$visible ? 'visible' : 'hidden')};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: ${(p) => (p.$visible ? 'auto' : 'none')};
  z-index: 10;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: ${BORDER_RADIUS.SM}px;
  background: var(--color-fill-2, rgba(255, 255, 255, 0.08));
  color: var(--color-text-2, #999);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  &:hover {
    background: var(--color-primary, #1890ff);
    color: white;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary, #1890ff);
    outline-offset: 2px;
  }
`
