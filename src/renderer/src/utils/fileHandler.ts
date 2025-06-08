/**
 * 文件处理工具
 * File handling utilities for Electron environment
 */

import RendererLogger from './logger'
import { ipcFileSystem } from './ipcClient'

/**
 * 将文件路径转换为 File 对象
 * Convert file path to File object
 */
export async function filePathToFile(filePath: string): Promise<File> {
  try {
    // 处理 file:// URL 格式，转换为普通文件路径
    // Handle file:// URL format, convert to regular file path
    let actualFilePath = filePath
    if (filePath.startsWith('file://')) {
      // 使用 URL 构造函数来正确解析和解码 file:// URL
      const url = new URL(filePath)
      actualFilePath = decodeURIComponent(url.pathname)

      // Windows 路径处理：移除开头的斜杠
      // 在渲染进程中使用 navigator.platform 或 navigator.userAgent 来检测平台
      const isWindows =
        navigator.platform.toLowerCase().includes('win') ||
        navigator.userAgent.toLowerCase().includes('windows')

      if (isWindows && actualFilePath.startsWith('/')) {
        actualFilePath = actualFilePath.substring(1)
      }
    }

    RendererLogger.info('文件路径处理:', {
      原始路径: filePath,
      处理后路径: actualFilePath,
      平台: navigator.platform
    })

    // 首先检查文件是否存在
    const fileExists = await ipcFileSystem.checkFileExists(actualFilePath)
    RendererLogger.info('文件存在性检查:', {
      路径: actualFilePath,
      存在: fileExists
    })

    if (!fileExists) {
      throw new Error(`文件不存在: ${actualFilePath}`)
    }

    // 在 Electron 环境中，使用 file:// URL 读取文件
    // In Electron environment, use file:// URL to read file
    RendererLogger.info('开始读取文件为 ArrayBuffer:', actualFilePath)
    const fileUrl = await ipcFileSystem.getFileUrl(actualFilePath)
    if (!fileUrl) {
      throw new Error(`无法获取文件 URL: ${actualFilePath}`)
    }

    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`读取文件失败: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    RendererLogger.info('文件读取结果:', {
      arrayBuffer类型: typeof arrayBuffer,
      arrayBuffer为空: arrayBuffer === null || arrayBuffer === undefined,
      大小: arrayBuffer ? arrayBuffer.byteLength : 0
    })

    if (!arrayBuffer) {
      throw new Error(`主进程返回空的 ArrayBuffer，文件路径: ${actualFilePath}`)
    }

    // 提取文件名
    const fileName =
      actualFilePath.split('/').pop() || actualFilePath.split('\\').pop() || 'unknown'

    // 根据文件扩展名推断 MIME 类型
    const mimeType = getMimeTypeFromFileName(fileName)

    // 创建 File 对象
    const file = new File([arrayBuffer], fileName, { type: mimeType })

    RendererLogger.info('文件路径转换为 File 对象成功:', {
      fileName,
      size: file.size,
      type: file.type
    })

    return file
  } catch (error) {
    RendererLogger.error('文件路径转换失败:', error)
    throw new Error(`文件路径转换失败: ${error}`)
  }
}

/**
 * 根据文件名推断 MIME 类型
 * Infer MIME type from file name
 */
function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop()

  const mimeTypes: Record<string, string> = {
    // 视频格式
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    ogv: 'video/ogg',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    m4v: 'video/x-m4v',
    '3gp': 'video/3gpp',
    ts: 'video/mp2t',
    mts: 'video/mp2t',
    m2ts: 'video/mp2t',

    // 音频格式
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    wma: 'audio/x-ms-wma',
    m4a: 'audio/x-m4a'
  }

  return mimeTypes[extension || ''] || 'application/octet-stream'
}

/**
 * 检查文件是否存在
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fileUrl = filePath.startsWith('file://') ? filePath : `file://${filePath}`
    const response = await fetch(fileUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 获取文件大小
 * Get file size
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const fileUrl = filePath.startsWith('file://') ? filePath : `file://${filePath}`
    const response = await fetch(fileUrl, { method: 'HEAD' })

    if (!response.ok) {
      throw new Error(`无法获取文件信息: ${response.statusText}`)
    }

    const contentLength = response.headers.get('Content-Length')
    return contentLength ? parseInt(contentLength, 10) : 0
  } catch (error) {
    RendererLogger.error('获取文件大小失败:', error)
    return 0
  }
}

/**
 * 创建临时文件 URL
 * Create temporary file URL
 */
export function createTempFileUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * 释放临时文件 URL
 * Revoke temporary file URL
 */
export function revokeTempFileUrl(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * 下载 Blob 为文件
 * Download Blob as file
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = createTempFileUrl(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // 延迟释放 URL，确保下载完成
  setTimeout(() => {
    revokeTempFileUrl(url)
  }, 1000)
}

/**
 * 验证文件是否为视频文件
 * Validate if file is a video file
 */
export function isVideoFile(fileName: string): boolean {
  const videoExtensions = [
    'mp4',
    'avi',
    'mov',
    'mkv',
    'webm',
    'ogg',
    'wmv',
    'flv',
    'm4v',
    '3gp',
    'ts',
    'mts',
    'm2ts'
  ]

  const extension = fileName.toLowerCase().split('.').pop()
  return videoExtensions.includes(extension || '')
}

/**
 * 获取视频文件的预估信息
 * Get estimated video file information
 */
export function getVideoFileInfo(
  fileName: string,
  fileSize: number
): {
  extension: string
  mimeType: string
  estimatedDuration: string
  sizeFormatted: string
  isLikelyH265: boolean
  isLikelyAC3: boolean
} {
  const extension = fileName.toLowerCase().split('.').pop() || ''
  const mimeType = getMimeTypeFromFileName(fileName)

  // 格式化文件大小
  const sizeFormatted = formatFileSize(fileSize)

  // 根据文件扩展名和大小预估可能的编解码器问题
  const isLikelyH265 = extension === 'mkv' || extension === 'm2ts' || extension === 'ts'
  const isLikelyAC3 = extension === 'mkv' || extension === 'ts' || extension === 'm2ts'

  // 根据文件大小粗略估算时长（假设码率）
  const estimatedBitrateMbps = extension === 'mkv' ? 10 : 5 // MKV 通常码率更高
  const estimatedDurationMinutes = Math.round(
    (fileSize * 8) / (estimatedBitrateMbps * 1024 * 1024 * 60)
  )
  const estimatedDuration =
    estimatedDurationMinutes > 0 ? `约 ${estimatedDurationMinutes} 分钟` : '未知'

  return {
    extension,
    mimeType,
    estimatedDuration,
    sizeFormatted,
    isLikelyH265,
    isLikelyAC3
  }
}

/**
 * 格式化文件大小
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 从file://URL提取并解码文件名
 * Extract and decode filename from file:// URL
 */
export function getDecodedFileName(filePath: string): string {
  try {
    if (filePath.startsWith('file://')) {
      const url = new URL(filePath)
      const fileName = url.pathname.split('/').pop() || ''
      return decodeURIComponent(fileName)
    } else {
      return filePath.split(/[/\\]/).pop() || ''
    }
  } catch (error) {
    RendererLogger.warn('解码文件名失败', { filePath, error })
    return filePath.split(/[/\\]/).pop() || ''
  }
}

/**
 * 截断超长文件名，保留扩展名
 * Truncate long filenames while preserving extension
 */
export function truncateFileName(fileName: string, maxLength: number = 50): string {
  if (fileName.length <= maxLength) {
    return fileName
  }

  // 找到文件扩展名 / Find file extension
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) {
    // 没有扩展名，直接截断 / No extension, truncate directly
    return fileName.substring(0, maxLength - 3) + '...'
  }

  const extension = fileName.substring(lastDotIndex)
  const nameWithoutExt = fileName.substring(0, lastDotIndex)
  const maxNameLength = maxLength - extension.length - 3 // 3 for "..."

  if (maxNameLength <= 0) {
    // 扩展名太长，只显示部分扩展名 / Extension too long, show partial extension
    return fileName.substring(0, maxLength - 3) + '...'
  }

  return nameWithoutExt.substring(0, maxNameLength) + '...' + extension
}
