import { useCallback, useEffect, useRef } from 'react'
import { create } from 'zustand'

export type MenuId = 'loop' | 'pause' | 'volume' | 'playback-rate' | 'captions' | 'settings'

interface ControlMenuState {
  activeMenuId: MenuId | null
  setActiveMenu: (menuId: MenuId | null) => void
  isMenuActive: (menuId: MenuId) => boolean
  closeAllMenus: () => void
}

const useControlMenuStore = create<ControlMenuState>((set, get) => ({
  activeMenuId: null,
  setActiveMenu: (menuId) => set({ activeMenuId: menuId }),
  isMenuActive: (menuId) => get().activeMenuId === menuId,
  closeAllMenus: () => set({ activeMenuId: null })
}))

export interface UseControlMenuManagerOptions {
  menuId: MenuId
  onOpen?: () => void
  onClose?: () => void
}

export interface UseControlMenuManagerResult {
  isMenuOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * 控制菜单管理器 Hook
 * 确保同一时刻只能有一个控制菜单打开
 * 支持点击外部区域关闭菜单
 */
export function useControlMenuManager({
  menuId,
  onOpen,
  onClose
}: UseControlMenuManagerOptions): UseControlMenuManagerResult {
  const { activeMenuId, setActiveMenu, isMenuActive, closeAllMenus } = useControlMenuStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const isMenuOpen = isMenuActive(menuId)

  const closeMenu = useCallback(() => {
    if (isMenuActive(menuId)) {
      setActiveMenu(null)
      onClose?.()
    }
  }, [menuId, isMenuActive, setActiveMenu, onClose])

  const openMenu = useCallback(() => {
    if (activeMenuId && activeMenuId !== menuId) {
      // 如果有其他菜单打开，先关闭
      closeAllMenus()
    }
    setActiveMenu(menuId)
    onOpen?.()
  }, [activeMenuId, menuId, onOpen, setActiveMenu, closeAllMenus])

  const toggleMenu = useCallback(() => {
    if (isMenuOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [isMenuOpen, openMenu, closeMenu])

  // 点击外部关闭菜单的效果
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // 检查点击是否在当前菜单容器内
      if (containerRef.current && !containerRef.current.contains(target)) {
        closeMenu()
      }
    }

    // 延迟添加监听器，避免立即触发
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen, closeMenu])

  return {
    isMenuOpen,
    openMenu,
    closeMenu,
    toggleMenu,
    containerRef
  }
}
