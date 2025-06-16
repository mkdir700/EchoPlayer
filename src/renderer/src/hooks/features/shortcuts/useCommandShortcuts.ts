import { useEffect, useRef, useLayoutEffect } from 'react'
import { useShortcuts } from './useShortcuts'
import { matchesShortcut as matchesShortcutUtil } from '@renderer/utils/shortcutMatcher'
import { ReactCallback } from '@renderer/types/shared'

// 命令接口
export interface Command {
  id: string
  execute: () => void
  canExecute?: () => boolean
  description?: string
}

// 快捷键命令注册表
class ShortcutCommandRegistry {
  private commands = new Map<string, Command>()
  private shortcuts: Record<string, string> = {}
  private isListenerAttached = false

  registerCommand(shortcutKey: string, command: Command): void {
    this.commands.set(shortcutKey, command)
  }

  unregisterCommand(shortcutKey: string): void {
    this.commands.delete(shortcutKey)
  }

  updateShortcuts(shortcuts: Record<string, string>): void {
    this.shortcuts = shortcuts
  }

  handleKeyEvent(event: KeyboardEvent): boolean {
    // 避免在文本输入框中触发快捷键
    if (event.target && (event.target as HTMLElement).tagName === 'TEXTAREA') {
      return false
    }

    for (const [shortcutKey, command] of this.commands) {
      if (matchesShortcutUtil(event, shortcutKey, this.shortcuts)) {
        if (!command.canExecute || command.canExecute()) {
          event.preventDefault()
          command.execute()
          return true
        }
      }
    }
    return false
  }

  attachListener(): (() => void) | void {
    if (this.isListenerAttached) return

    const handleKeyPress = (event: KeyboardEvent): void => {
      this.handleKeyEvent(event)
    }

    window.addEventListener('keydown', handleKeyPress)
    this.isListenerAttached = true

    // 返回清理函数
    return (): void => {
      window.removeEventListener('keydown', handleKeyPress)
      this.isListenerAttached = false
    }
  }

  clear(): void {
    this.commands.clear()
  }
}

// 全局注册表实例
const globalRegistry = new ShortcutCommandRegistry()

// 命令式快捷键 Hook
export function useCommandShortcuts(): {
  registerCommand: (shortcutKey: string, command: Command) => () => void
} {
  const { shortcuts } = useShortcuts()
  const registryRef = useRef(globalRegistry)

  // 使用 useLayoutEffect 确保在第一次渲染时同步设置监听器
  useLayoutEffect(() => {
    const cleanup = registryRef.current.attachListener()
    return cleanup
  }, [])

  useEffect(() => {
    registryRef.current.updateShortcuts(shortcuts)
  }, [shortcuts])

  const registerCommand = (shortcutKey: string, command: Command): (() => void) => {
    registryRef.current.registerCommand(shortcutKey, command)
    return (): void => registryRef.current.unregisterCommand(shortcutKey)
  }

  return { registerCommand }
}

// 便捷的命令注册 Hook
export function useShortcutCommand(
  shortcutKey: string,
  execute: ReactCallback<() => void>,
  options?: {
    canExecute?: ReactCallback<() => boolean>
    description?: string
    enabled?: boolean
  }
): void {
  const { registerCommand } = useCommandShortcuts()

  useEffect(() => {
    if (options?.enabled === false) return

    const command: Command = {
      id: shortcutKey,
      execute,
      canExecute: options?.canExecute,
      description: options?.description
    }

    const unregister = registerCommand(shortcutKey, command)
    return unregister
  }, [
    shortcutKey,
    execute,
    options?.canExecute,
    options?.description,
    options?.enabled,
    registerCommand
  ])
}
