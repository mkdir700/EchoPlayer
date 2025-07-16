export const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']
export const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac']

export const KB = 1024
export const MB = 1024 * KB
export const GB = 1024 * MB
export const defaultLanguage = 'zh-CN'

export enum FeedUrl {
  PRODUCTION = 'https://releases.cherry-ai.com',
  GITHUB_LATEST = 'https://github.com/CherryHQ/cherry-studio/releases/latest/download',
  PRERELEASE_LOWEST = 'https://github.com/CherryHQ/cherry-studio/releases/download/v1.4.0'
}

export enum UpgradeChannel {
  LATEST = 'latest', // 最新稳定版本
  RC = 'rc', // 公测版本
  BETA = 'beta' // 预览版本
}

export const defaultTimeout = 10 * 1000 * 60

export const occupiedDirs = ['logs', 'Network', 'Partitions/webview/Network']
