import { app } from 'electron'
import { Conf } from 'electron-conf/main'
import * as path from 'path'
import type { AppConfig, ThemeCustomization, UpdateNotificationConfig } from '../../../types/shared'

// 获取默认数据目录 / Get default data directory
export function getDefaultDataDirectory(): string {
  return path.join(app.getPath('userData'), 'data')
}

// 默认主题自定义配置 / Default theme customization configuration
const defaultThemeCustomization: ThemeCustomization = {
  colorPrimary: '#007AFF',
  colorSuccess: '#34C759',
  colorWarning: '#FF9500',
  colorError: '#FF3B30',
  borderRadius: 8,
  fontSize: 16,
  algorithm: 'default'
}

// 默认更新通知配置 / Default update notification configuration
const defaultUpdateNotificationConfig: UpdateNotificationConfig = {
  currentVersion: app.getVersion(), // ensures a sensible default
  latestVersion: null,
  lastChecked: null,
  lastSeenVersion: null,
  skippedVersions: [],
  autoCheckEnabled: true,
  checkInterval: 24 * 60 * 60 * 1000 // 24小时 / 24 hours
}

// 默认应用配置 / Default application configuration
export const defaultAppConfig: AppConfig = {
  useWindowFrame: false, // 默认使用自定义标题栏 / Default to custom title bar
  appTheme: 'system', // 默认跟随系统主题 / Default to system theme
  autoCheckUpdates: true, // 默认自动检查更新 / Default to auto check updates
  language: 'zh-CN', // 默认语言为中文 / Default language is Chinese
  dataDirectory: getDefaultDataDirectory(), // 默认数据目录使用系统位置 / Default data directory uses system location
  themeCustomization: defaultThemeCustomization, // 默认主题自定义配置 / Default theme customization configuration
  updateNotification: defaultUpdateNotificationConfig // 默认更新通知配置 / Default update notification configuration
}

// 创建主要的 store 实例（用于最近播放等数据）/ Create main store instance (for recent plays and other data)
export const mainStore = new Conf({
  name: 'echolab-recent-plays',
  defaults: {
    recentPlays: [],
    settings: {
      maxRecentItems: 20,
      playback: {
        isAutoScrollEnabled: true,
        displayMode: 'bilingual',
        volume: 1,
        playbackRate: 1.0,
        isSingleLoop: false,
        loopSettings: {
          count: -1 // 默认无限循环 / Default infinite loop
        },
        isAutoPause: false
      },
      update: {
        autoUpdate: true,
        lastChecked: 0,
        updateChannel: 'stable'
      }
    }
  }
})

// 创建独立的应用配置 store 实例 / Create separate app config store instance
export const appConfigStore = new Conf({
  name: 'config', // 这将创建 config.json 文件 / This will create config.json file
  defaults: defaultAppConfig
})

// 生成唯一 ID / Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
