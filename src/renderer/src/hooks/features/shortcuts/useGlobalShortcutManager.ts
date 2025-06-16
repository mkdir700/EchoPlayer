import { useEffect, useCallback } from 'react'
import { useShortcuts } from './useShortcuts'
import { matchesShortcut as matchesShortcutUtil } from '@renderer/utils/shortcutMatcher'

export interface GlobalShortcutHandler {
  id: string
  shortcutKey: string
  handler: () => void
  priority: number
  scope?: string
  description?: string
  enabled?: boolean
  condition?: () => boolean
}

class GlobalShortcutManager {
  private handlers = new Map<string, GlobalShortcutHandler>()
  private shortcuts: Record<string, string> = {}

  register(handler: GlobalShortcutHandler): () => void {
    this.handlers.set(handler.id, handler)
    console.log(`🎯 注册快捷键: ${handler.shortcutKey} -> ${handler.description || handler.id}`)

    return () => {
      this.handlers.delete(handler.id)
      console.log(`🗑️ 注销快捷键: ${handler.shortcutKey} -> ${handler.description || handler.id}`)
    }
  }

  updateShortcuts(shortcuts: Record<string, string>): void {
    this.shortcuts = shortcuts
  }

  handleKeyEvent(event: KeyboardEvent): boolean {
    // 避免在文本输入框中触发快捷键
    if (event.target && (event.target as HTMLElement).tagName === 'TEXTAREA') {
      return false
    }

    // 收集所有可用的处理器
    const availableHandlers = Array.from(this.handlers.values())
      .filter((handler) => {
        // 检查是否启用
        if (handler.enabled === false) return false

        // 检查条件
        if (handler.condition && !handler.condition()) return false

        // 检查快捷键匹配
        return matchesShortcutUtil(event, handler.shortcutKey, this.shortcuts)
      })
      .sort((a, b) => b.priority - a.priority) // 按优先级排序

    if (availableHandlers.length === 0) return false

    // 检查冲突
    if (availableHandlers.length > 1) {
      const topPriority = availableHandlers[0].priority
      const conflictHandlers = availableHandlers.filter((h) => h.priority === topPriority)

      if (conflictHandlers.length > 1) {
        console.warn('⚠️ 快捷键冲突:', {
          key: availableHandlers[0].shortcutKey,
          conflicts: conflictHandlers.map((h) => `${h.scope || 'global'}:${h.id}`)
        })
      }
    }

    // 执行最高优先级的处理器
    const selectedHandler = availableHandlers[0]
    console.log(
      `⌨️ 执行快捷键: ${selectedHandler.shortcutKey} -> ${selectedHandler.description || selectedHandler.id}`
    )

    event.preventDefault()
    selectedHandler.handler()
    return true
  }

  getRegisteredShortcuts(): GlobalShortcutHandler[] {
    return Array.from(this.handlers.values())
  }

  getConflicts(): Array<{ key: string; handlers: GlobalShortcutHandler[] }> {
    const groupedByKey = new Map<string, GlobalShortcutHandler[]>()

    for (const handler of this.handlers.values()) {
      const key = handler.shortcutKey
      if (!groupedByKey.has(key)) {
        groupedByKey.set(key, [])
      }
      groupedByKey.get(key)!.push(handler)
    }

    return Array.from(groupedByKey.entries())
      .filter(([, handlers]) => handlers.length > 1)
      .map(([key, handlers]) => ({ key, handlers }))
  }
}

// 全局实例
const globalShortcutManager = new GlobalShortcutManager()

// 全局快捷键管理 Hook
export function useGlobalShortcutManager(): {
  register: (handler: GlobalShortcutHandler) => () => void
  getConflicts: () => Array<{ key: string; handlers: GlobalShortcutHandler[] }>
  getRegisteredShortcuts: () => GlobalShortcutHandler[]
} {
  const { shortcuts } = useShortcuts()

  useEffect(() => {
    globalShortcutManager.updateShortcuts(shortcuts)
  }, [shortcuts])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      globalShortcutManager.handleKeyEvent(event)
    }

    window.addEventListener('keydown', handleKeyPress, true)
    return (): void => {
      window.removeEventListener('keydown', handleKeyPress, true)
    }
  }, [])

  return {
    register: useCallback((handler: GlobalShortcutHandler) => {
      return globalShortcutManager.register(handler)
    }, []),
    getConflicts: useCallback(() => {
      return globalShortcutManager.getConflicts()
    }, []),
    getRegisteredShortcuts: useCallback(() => {
      return globalShortcutManager.getRegisteredShortcuts()
    }, [])
  }
}

// 简化的快捷键注册 Hook
export function useRegisterShortcut(
  id: string,
  shortcutKey: string,
  handler: () => void,
  options?: {
    priority?: number
    scope?: string
    description?: string
    enabled?: boolean
    condition?: () => boolean
  }
): void {
  const { register } = useGlobalShortcutManager()

  useEffect(() => {
    const shortcutHandler: GlobalShortcutHandler = {
      id,
      shortcutKey,
      handler,
      priority: options?.priority ?? 0,
      scope: options?.scope,
      description: options?.description,
      enabled: options?.enabled,
      condition: options?.condition
    }

    const unregister = register(shortcutHandler)
    return unregister
  }, [
    id,
    shortcutKey,
    handler,
    options?.priority,
    options?.scope,
    options?.description,
    options?.enabled,
    options?.condition,
    register
  ])
}
