import { useEffect, useCallback, useRef } from 'react'
import { useShortcuts } from './useShortcuts'
import { matchesShortcut as matchesShortcutUtil } from '@renderer/utils/shortcutMatcher'

export interface ComponentShortcut {
  key: string
  handler: () => void
  enabled?: boolean
  priority?: number
  description?: string
}

// 组件快捷键管理 Hook
export function useComponentShortcuts(
  shortcuts: ComponentShortcut[],
  options?: {
    enabled?: boolean
    stopPropagation?: boolean
  }
): void {
  const { shortcuts: globalShortcuts } = useShortcuts()
  const shortcutsRef = useRef(shortcuts)
  const optionsRef = useRef(options)

  // 更新引用
  shortcutsRef.current = shortcuts
  optionsRef.current = options

  const handleKeyEvent = useCallback(
    (event: KeyboardEvent): void => {
      // 如果禁用则不处理
      if (optionsRef.current?.enabled === false) return

      // 避免在文本输入框中触发快捷键
      if (event.target && (event.target as HTMLElement).tagName === 'TEXTAREA') return

      // 按优先级排序处理
      const sortedShortcuts = [...shortcutsRef.current]
        .filter((s) => s.enabled !== false)
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

      for (const shortcut of sortedShortcuts) {
        if (matchesShortcutUtil(event, shortcut.key, globalShortcuts)) {
          event.preventDefault()
          if (optionsRef.current?.stopPropagation) {
            event.stopPropagation()
          }
          shortcut.handler()
          break // 只执行第一个匹配的快捷键
        }
      }
    },
    [globalShortcuts]
  )

  useEffect(() => {
    if (options?.enabled === false) return

    window.addEventListener('keydown', handleKeyEvent, true)
    return (): void => {
      window.removeEventListener('keydown', handleKeyEvent, true)
    }
  }, [handleKeyEvent, options?.enabled])
}

// 条件快捷键 Hook
export function useConditionalShortcut(
  key: string,
  handler: () => void,
  condition: boolean | (() => boolean),
  options?: {
    priority?: number
    description?: string
  }
): void {
  const shortcuts: ComponentShortcut[] = [
    {
      key,
      handler,
      enabled: typeof condition === 'function' ? condition() : condition,
      priority: options?.priority,
      description: options?.description
    }
  ]

  useComponentShortcuts(shortcuts, { enabled: true })
}

// 快捷键组合 Hook
export function useShortcutGroup(
  groupName: string,
  shortcuts: Record<string, () => void>,
  options?: {
    enabled?: boolean
    priority?: number
  }
): void {
  const shortcutList: ComponentShortcut[] = Object.entries(shortcuts).map(([key, handler]) => ({
    key,
    handler,
    enabled: options?.enabled,
    priority: options?.priority,
    description: `${groupName}: ${key}`
  }))

  useComponentShortcuts(shortcutList, { enabled: options?.enabled })
}
