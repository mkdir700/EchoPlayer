import { useCallback } from 'react'
import { useRegisterShortcut } from './useGlobalShortcutManager'
import { App } from 'antd'

// 字幕设置的本地存储键名
const SUBTITLE_STATE_KEY = 'echolab_subtitle_state'

export interface UseSubtitleResetReturn {
  resetSubtitleSettings: () => void
  hasSubtitleSettings: () => boolean
}

export function useSubtitleReset(): UseSubtitleResetReturn {
  let message: { success: (msg: string) => void; error: (msg: string) => void } | null = null

  try {
    const appContext = App.useApp()
    message = appContext.message
  } catch {
    // 如果不在 App 上下文中，message 为 null
  }

  // 重置字幕设置
  const resetSubtitleSettings = useCallback(() => {
    try {
      // 移除本地存储中的字幕设置
      localStorage.removeItem(SUBTITLE_STATE_KEY)
      message?.success('字幕设置已重置为默认配置')
      console.log('🔄 字幕设置已重置')
    } catch (error) {
      console.error('重置字幕设置失败:', error)
      message?.error('重置字幕设置失败')
    }
  }, [message])

  // 检查是否存在字幕设置
  const hasSubtitleSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem(SUBTITLE_STATE_KEY)
      return saved !== null
    } catch {
      return false
    }
  }, [])

  // 注册全局快捷键 Ctrl+Shift+R
  useRegisterShortcut('resetSubtitleSettings', 'ctrl+shift+r', resetSubtitleSettings, {
    priority: 100, // 高优先级
    scope: 'global',
    description: '重置字幕设置',
    enabled: true,
    condition: () => {
      // 检查是否有自定义字幕设置需要重置
      return hasSubtitleSettings()
    }
  })

  return {
    resetSubtitleSettings,
    hasSubtitleSettings
  }
}
