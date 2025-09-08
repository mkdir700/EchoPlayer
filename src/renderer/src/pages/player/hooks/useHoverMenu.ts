import { useRef } from 'react'

export interface UseHoverMenuOptions {
  /** 鼠标悬停多长时间后显示菜单（毫秒），默认 200ms */
  openDelay?: number
  /** 鼠标离开多长时间后关闭菜单（毫秒），默认 100ms */
  closeDelay?: number
  /** 是否禁用hover菜单功能 */
  disabled?: boolean
  /** 当前菜单是否打开 */
  isMenuOpen: boolean
  /** 菜单打开时的回调 */
  onMenuOpen?: () => void
  /** 菜单关闭时的回调 */
  onMenuClose?: () => void
  /** 打开菜单的函数 */
  openMenu: () => void
  /** 关闭菜单的函数 */
  closeMenu: () => void
}

export interface UseHoverMenuReturn {
  /** 按钮的鼠标事件处理器 */
  buttonProps: {
    onMouseEnter: () => void
    onMouseLeave: () => void
    onClick: (originalOnClick?: () => void) => void
  }
  /** 菜单的鼠标事件处理器 */
  menuProps: {
    onMouseEnter: () => void
    onMouseLeave: () => void
  }
  /** 手动关闭菜单 */
  closeMenu: () => void
}

/**
 * 通用的hover菜单Hook
 * 提供按钮hover显示菜单、鼠标离开延迟关闭菜单的完整逻辑
 */
export function useHoverMenu({
  openDelay = 200,
  closeDelay = 100,
  disabled = false,
  isMenuOpen,
  onMenuOpen,
  onMenuClose,
  openMenu,
  closeMenu
}: UseHoverMenuOptions): UseHoverMenuReturn {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleButtonMouseEnter = () => {
    if (disabled) return

    // 清除离开定时器（如果存在）
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }

    // 清除之前的悬停定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // 延迟显示菜单
    hoverTimeoutRef.current = setTimeout(() => {
      openMenu()
      onMenuOpen?.()
    }, openDelay)
  }

  const handleButtonMouseLeave = () => {
    // 清除悬停定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    // 如果菜单已经打开，延迟关闭
    if (isMenuOpen) {
      leaveTimeoutRef.current = setTimeout(() => {
        closeMenu()
        onMenuClose?.()
      }, closeDelay)
    }
  }

  const handleButtonClick = (originalOnClick?: () => void) => {
    if (disabled) return

    // 如果菜单打开，先关闭菜单
    if (isMenuOpen) {
      closeMenu()
      onMenuClose?.()
    }

    // 执行原始点击处理
    originalOnClick?.()
  }

  const handleMenuMouseEnter = () => {
    // 鼠标进入菜单时清除关闭定时器
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }

  const handleMenuMouseLeave = () => {
    // 鼠标离开菜单时立即关闭
    closeMenu()
    onMenuClose?.()
  }

  return {
    buttonProps: {
      onMouseEnter: handleButtonMouseEnter,
      onMouseLeave: handleButtonMouseLeave,
      onClick: handleButtonClick
    },
    menuProps: {
      onMouseEnter: handleMenuMouseEnter,
      onMouseLeave: handleMenuMouseLeave
    },
    closeMenu: () => {
      closeMenu()
      onMenuClose?.()
    }
  }
}
