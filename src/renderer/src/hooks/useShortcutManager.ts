import { useState, useEffect, useCallback } from 'react'
import { matchesShortcut as matchesShortcutUtil } from '../utils/shortcutMatcher'

// 快捷键配置接口
export interface ShortcutConfig {
  key: string
  name: string
  description: string
  defaultKey: string
  category: 'playback' | 'subtitle' | 'appearance'
}

// 默认快捷键配置
export const DEFAULT_SHORTCUTS: Record<string, ShortcutConfig> = {
  playPause: {
    key: 'playPause',
    name: '播放/暂停',
    description: '控制视频播放状态',
    defaultKey: 'Space',
    category: 'playback'
  },
  stepBackward: {
    key: 'stepBackward',
    name: '后退5秒',
    description: '视频后退5秒',
    defaultKey: '←',
    category: 'playback'
  },
  stepForward: {
    key: 'stepForward',
    name: '前进5秒',
    description: '视频前进5秒',
    defaultKey: '→',
    category: 'playback'
  },
  volumeUp: {
    key: 'volumeUp',
    name: '音量增加',
    description: '增加音量10%',
    defaultKey: '↑',
    category: 'playback'
  },
  volumeDown: {
    key: 'volumeDown',
    name: '音量减少',
    description: '减少音量10%',
    defaultKey: '↓',
    category: 'playback'
  },
  toggleSubtitleMode: {
    key: 'toggleSubtitleMode',
    name: '切换字幕模式',
    description: '在原文/双语/隐藏字幕间切换',
    defaultKey: 'Ctrl+M',
    category: 'subtitle'
  },
  singleLoop: {
    key: 'singleLoop',
    name: '单句循环',
    description: '开启/关闭当前字幕单句循环',
    defaultKey: 'R',
    category: 'subtitle'
  },
  autoPause: {
    key: 'autoPause',
    name: '自动暂停',
    description: '开启/关闭字幕结束时自动暂停',
    defaultKey: 'Ctrl+P',
    category: 'subtitle'
  },
  previousSubtitle: {
    key: 'previousSubtitle',
    name: '上一句字幕',
    description: '跳转到上一句字幕',
    defaultKey: 'H',
    category: 'subtitle'
  },
  nextSubtitle: {
    key: 'nextSubtitle',
    name: '下一句字幕',
    description: '跳转到下一句字幕',
    defaultKey: 'L',
    category: 'subtitle'
  },
  resetSubtitleSettings: {
    key: 'resetSubtitleSettings',
    name: '重置字幕设置',
    description: '重置字幕位置、大小和背景为默认配置',
    defaultKey: 'Ctrl+Shift+R',
    category: 'appearance'
  },
  toggleFullscreen: {
    key: 'toggleFullscreen',
    name: '切换全屏模式',
    description: '在应用内切换全屏/窗口模式',
    defaultKey: 'F',
    category: 'appearance'
  }
}

// 快捷键管理 hook
export function useShortcutManager(): {
  shortcuts: Record<string, string>
  getCurrentShortcut: (key: string) => string
  updateShortcut: (key: string, newKey: string) => void
  resetShortcuts: () => void
  matchesShortcut: (event: KeyboardEvent, shortcutKey: string) => boolean
} {
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
    },
    [shortcuts]
  )

  // 重置快捷键
  const resetShortcuts = useCallback(() => {
    setShortcuts({})
    localStorage.removeItem('echolab-shortcuts')
  }, [])

  // 检查按键事件是否匹配快捷键
  const matchesShortcut = useCallback(
    (event: KeyboardEvent, shortcutKey: string): boolean => {
      return matchesShortcutUtil(event, shortcutKey, shortcuts)
    },
    [shortcuts]
  )

  // 监听 localStorage 变化（用于跨组件同步）
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

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return {
    shortcuts,
    getCurrentShortcut,
    updateShortcut,
    resetShortcuts,
    matchesShortcut
  }
}
