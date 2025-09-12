export const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']
export const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac']

/**
 * 将扩展名数组转换为 Electron dialog 所需的格式（不含点）
 * @param extArray 扩展名数组（可包含或不包含点）
 * @returns 不含点的扩展名数组
 */
export function toDialogExtensions(extArray: string[]): string[] {
  return extArray.map((ext) => (ext.startsWith('.') ? ext.slice(1) : ext))
}

/**
 * 获取用于 Electron dialog 的视频文件扩展名数组
 * @returns 不含点的视频扩展名数组
 */
export function getVideoDialogExtensions(): string[] {
  return toDialogExtensions(videoExts)
}

export const KB = 1024
export const MB = 1024 * KB
export const GB = 1024 * MB
export const defaultLanguage = 'zh-CN'

export enum FeedUrl {
  PRODUCTION = 'https://releases.echoplayer.cc',
  GITHUB_LATEST = 'https://github.com/mkdir700/EchoPlayer/releases/latest/download',
  PRERELEASE_LOWEST = 'https://github.com/mkdir700/EchoPlayer/releases/download/v0.1.0'
}

export enum UpgradeChannel {
  LATEST = 'latest', // 最新稳定版本
  ALPHA = 'alpha', // 内测版本
  BETA = 'beta' // 公测版本
}

export const defaultTimeout = 10 * 1000 * 60

export const occupiedDirs = ['logs', 'Network', 'Partitions/webview/Network']
