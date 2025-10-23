import { BORDER_RADIUS, SPACING } from '@renderer/infrastructure/styles/theme'
import type { SubtitleItem as SubtitleItemType } from '@types'
import { Copy, Edit3, HeartHandshake, Languages, Loader2, MessageCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import { calculateMenuPosition } from '../utils/calculateMenuPosition'

interface SubtitleContextMenuProps {
  /** 是否显示菜单 */
  isOpen: boolean
  /** 菜单位置 */
  position?: { x: number; y: number }
  /** 关联的字幕数据 */
  subtitle?: SubtitleItemType
  /** 字幕索引 */
  subtitleIndex?: number
  /** 是否正在翻译当前字幕 */
  isCurrentlyTranslating?: boolean
  /** 菜单项点击处理 */
  onActionClick: (action: string, subtitle: SubtitleItemType, index: number) => void
  /** 关闭菜单 */
  onClose: () => void
  /** 取消延迟关闭菜单 */
  cancelCloseContextMenu?: () => void
  /** 延迟关闭菜单 */
  scheduleCloseContextMenu?: () => void
}

type MenuItemType = {
  key: string
  label: string
  icon: React.ReactNode
  action: string
  danger?: boolean
  shortcut?: string
  loading?: boolean
  disabled?: boolean
}

/**
 * 字幕右键上下文菜单组件
 *
 * 提供完整的字幕操作选项：
 * - AI 询问
 * - 翻译
 * - 编辑
 * - 复制
 * - 删除
 */
function SubtitleContextMenu({
  isOpen,
  position,
  subtitle,
  subtitleIndex,
  isCurrentlyTranslating = false,
  onActionClick,
  onClose,
  cancelCloseContextMenu,
  scheduleCloseContextMenu
}: SubtitleContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 菜单项定义
  const menuItems = useMemo<MenuItemType[]>(
    () => [
      {
        key: 'ai-ask',
        label: '向 AI 询问',
        icon: <MessageCircle size={16} />,
        action: 'ai-ask'
      },
      {
        key: 'like',
        label: '收藏',
        icon: <HeartHandshake size={16} />,
        action: 'like'
      },
      {
        key: 'translate',
        label: isCurrentlyTranslating ? '正在翻译中...' : '翻译字幕',
        icon: isCurrentlyTranslating ? <LoadingSpinner size={16} /> : <Languages size={16} />,
        action: 'translate',
        loading: isCurrentlyTranslating,
        disabled: isCurrentlyTranslating
      },
      {
        key: 'edit',
        label: '编辑字幕',
        icon: <Edit3 size={16} />,
        action: 'edit'
      },
      {
        key: 'copy',
        label: '复制文本',
        icon: <Copy size={16} />,
        action: 'copy'
      }
    ],
    [isCurrentlyTranslating]
  )

  // 计算菜单位置（确保不超出屏幕边界，让光标对准第一个菜单项）
  const menuPosition = useMemo(() => {
    if (!position) return position
    return calculateMenuPosition(position, menuRef.current)
  }, [position])

  // 处理菜单项点击
  const handleMenuItemClick = useCallback(
    (item: MenuItemType) => {
      if (subtitle && subtitleIndex !== undefined) {
        onActionClick(item.action, subtitle, subtitleIndex)
      }
      onClose()
    },
    [subtitle, subtitleIndex, onActionClick, onClose]
  )

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !position || !subtitle || subtitleIndex === undefined) {
    return null
  }

  return createPortal(
    <Overlay>
      <Menu
        ref={menuRef}
        style={{
          left: menuPosition?.x ?? position.x,
          top: menuPosition?.y ?? position.y
        }}
        onMouseEnter={cancelCloseContextMenu}
        onMouseLeave={scheduleCloseContextMenu}
        role="menu"
        aria-label="字幕操作菜单"
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.key}
            onClick={() => handleMenuItemClick(item)}
            $danger={item.danger}
            $disabled={item.disabled}
            $loading={item.loading}
            role="menuitem"
            tabIndex={item.disabled ? -1 : 0}
            disabled={item.disabled}
          >
            <MenuItemIcon>{item.icon}</MenuItemIcon>
            <MenuItemLabel>{item.label}</MenuItemLabel>
            {item.shortcut && <MenuItemShortcut>{item.shortcut}</MenuItemShortcut>}
          </MenuItem>
        ))}
      </Menu>
    </Overlay>,
    document.body
  )
}

export default SubtitleContextMenu

const LoadingSpinner = styled(Loader2)`
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  animation: spin 1s linear infinite;
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
`

const Menu = styled.div`
  position: absolute;
  min-width: 180px;
  background: var(--modal-background-glass);
  border: 1px solid var(--modal-border-color);
  border-radius: ${BORDER_RADIUS.BASE}px;
  box-shadow: var(--modal-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: ${SPACING.XS}px 0;
  pointer-events: auto;
  animation: menuIn 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes menuIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`

const MenuItem = styled.button<{ $danger?: boolean; $disabled?: boolean; $loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${SPACING.SM}px;
  width: 100%;
  padding: ${SPACING.XS}px ${SPACING.SM}px;
  background: transparent;
  border: none;
  color: ${(p) => {
    if (p.$loading) return 'var(--color-primary, #1890ff)'
    if (p.$disabled) return 'var(--color-text-3, #666)'
    return p.$danger ? 'var(--color-error)' : 'var(--color-text)'
  }};
  font-size: 13px;
  text-align: left;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${(p) => {
      if (p.$loading) return 'transparent'
      if (p.$danger) return 'rgba(244, 67, 54, 0.1)'
      return 'var(--color-list-item-hover)'
    }};
  }

  &:active:not(:disabled) {
    background: ${(p) => {
      if (p.$loading) return 'transparent'
      if (p.$danger) return 'rgba(244, 67, 54, 0.2)'
      return 'var(--color-list-item)'
    }};
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  &:disabled {
    transform: none;
  }
`

const MenuItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`

const MenuItemLabel = styled.span`
  flex: 1;
  font-weight: 500;
`

const MenuItemShortcut = styled.span`
  font-size: 11px;
  color: var(--color-text-3);
  font-family: monospace;
`
