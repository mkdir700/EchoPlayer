import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_SHORTCUTS } from '@renderer/hooks/features/shortcuts/useShortcutManager'
import { ShortcutContext, type ShortcutContextType } from './shortcut-context'
import { matchesShortcut as matchesShortcutUtil } from '@renderer/utils/shortcutMatcher'

export function ShortcutProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>(() => {
    // 从 localStorage 加载保存的快捷键配置
    const saved = localStorage.getItem('echolab-shortcuts')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {}
      }
    }
    return {}
  })

  // 获取当前快捷键（用户自定义或默认）
  const getCurrentShortcut = useCallback(
    (key: string): string => {
      return shortcuts[key] || DEFAULT_SHORTCUTS[key]?.defaultKey || ''
    },
    [shortcuts]
  )

  // 更新快捷键
  const updateShortcut = useCallback(
    (key: string, newKey: string) => {
      const newShortcuts = { ...shortcuts, [key]: newKey }
      setShortcuts(newShortcuts)
      localStorage.setItem('echolab-shortcuts', JSON.stringify(newShortcuts))

      // 触发自定义事件，通知其他组件快捷键已更新
      window.dispatchEvent(
        new CustomEvent('shortcutsUpdated', {
          detail: { shortcuts: newShortcuts }
        })
      )
    },
    [shortcuts]
  )

  // 重置快捷键
  const resetShortcuts = useCallback(() => {
    setShortcuts({})
    localStorage.removeItem('echolab-shortcuts')

    // 触发自定义事件，通知其他组件快捷键已重置
    window.dispatchEvent(
      new CustomEvent('shortcutsUpdated', {
        detail: { shortcuts: {} }
      })
    )
  }, [])

  // 检查按键事件是否匹配快捷键
  const matchesShortcut = useCallback(
    (event: KeyboardEvent, shortcutKey: string): boolean => {
      return matchesShortcutUtil(event, shortcutKey, shortcuts)
    },
    [shortcuts]
  )

  // 监听 localStorage 变化和自定义事件
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'echolab-shortcuts') {
        try {
          const newShortcuts = e.newValue ? JSON.parse(e.newValue) : {}
          setShortcuts(newShortcuts)
        } catch {
          setShortcuts({})
        }
      }
    }

    const handleShortcutsUpdate = (e: CustomEvent): void => {
      setShortcuts(e.detail.shortcuts)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('shortcutsUpdated', handleShortcutsUpdate as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('shortcutsUpdated', handleShortcutsUpdate as EventListener)
    }
  }, [])

  const value: ShortcutContextType = {
    shortcuts,
    getCurrentShortcut,
    updateShortcut,
    resetShortcuts,
    matchesShortcut
  }

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>
}
