import { loggerService } from '@logger'
import { isWin } from '@renderer/infrastructure/constants/platform'
import { KB, MB } from '@shared/config/constant'

const logger = loggerService.withContext('file-utils')

/**
 * 从文件路径中提取目录路径。
 * @param {string} filePath 文件路径
 * @returns {string} 目录路径
 */
export function getFileDirectory(filePath: string): string {
  const parts = filePath.split('/')
  const directory = parts.slice(0, -1).join('/')
  return directory
}

/**
 * 从文件路径中提取文件扩展名，增强 Windows 兼容性。
 * @param {string} filePath 文件路径
 * @returns {string} 文件扩展名（小写），如果没有则返回空字符串
 */
export function getFileExtension(filePath: string): string {
  if (!filePath) {
    return ''
  }

  // 标准化路径分隔符和清理路径
  let normalizedPath = filePath.trim()

  // 处理反斜杠（Windows 路径）
  normalizedPath = normalizedPath.replace(/\\/g, '/')

  // 获取文件名部分（移除路径）
  const fileName = normalizedPath.split('/').pop() || normalizedPath

  // 分割文件名以获取扩展名
  const parts = fileName.split('.')
  if (parts.length > 1) {
    const extension = parts.slice(-1)[0].toLowerCase()

    // 验证扩展名有效性：不能为空，不能包含路径分隔符
    if (extension && !extension.includes('/') && !extension.includes('\\')) {
      return '.' + extension
    }
  }

  return ''
}

/**
 * 格式化文件大小，根据大小返回以 MB 或 KB 为单位的字符串。
 * @param {number} size 文件大小（字节）
 * @returns {string} 格式化后的文件大小字符串
 */
export function formatFileSize(size: number): string {
  if (size >= MB) {
    return (size / MB).toFixed(1) + ' MB'
  }

  if (size >= KB) {
    return (size / KB).toFixed(0) + ' KB'
  }

  return (size / KB).toFixed(2) + ' KB'
}

/**
 * 从文件名中移除特殊字符：
 * - 替换非法字符为下划线
 * - 替换换行符为空格。
 * @param {string} str 输入字符串
 * @returns {string} 处理后的文件名字符串
 */
export function removeSpecialCharactersForFileName(str: string): string {
  return str
    .replace(/[<>:"/\\|?*.]/g, '_')
    .replace(/[\r\n]+/g, ' ')
    .trim()
}

/**
 * 将 file:// URL 转换为本地文件路径
 * 注意：HTTP URL 不是有效的本地文件路径，会返回空字符串
 * @param {string} fileUrl file:// URL 或本地路径
 * @returns {string} 本地文件路径
 */
export function fileUrlToPath(fileUrl: string): string {
  if (!fileUrl) return ''

  // 如果是 HTTP/HTTPS URL，不是本地文件路径
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    logger.warn('尝试将 HTTP URL 转换为本地路径', { fileUrl })
    return ''
  }

  // 如果已经是本地路径，直接返回
  if (!fileUrl.startsWith('file://')) {
    return fileUrl
  }

  // 移除 file:// 前缀
  let path = fileUrl.slice(7) // 移除 'file://'

  // 在 Windows 下，路径可能是 /C:/... 格式，需要移除开头的 /
  if (isWin && /^\/[A-Za-z]:/.test(path)) {
    path = path.slice(1)
  }

  // URL 解码，处理空格等特殊字符
  try {
    path = decodeURIComponent(path)
  } catch (error) {
    logger.warn('URL 解码失败，使用原始路径', { path, error })
  }

  return path
}
