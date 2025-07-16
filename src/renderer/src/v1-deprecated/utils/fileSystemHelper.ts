/**
 * 文件系统工具类
 * 提供安全的本地文件访问功能
 */

export interface FileInfo {
  size: number
  mtime: number
  isFile: boolean
  isDirectory: boolean
}

export interface FileValidationResult {
  exists: boolean
  valid: boolean
  fileInfo?: FileInfo
  error?: string
}

export class FileSystemHelper {
  /**
   * 检查文件是否存在
   */
  static async checkFileExists(filePath: string): Promise<boolean> {
    try {
      return await window.api.fileSystem.checkFileExists(filePath)
    } catch (error) {
      console.error('检查文件存在性失败:', error)
      return false
    }
  }

  /**
   * 获取文件信息
   */
  static async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      return await window.api.fileSystem.getFileInfo(filePath)
    } catch (error) {
      console.error('获取文件信息失败:', error)
      return null
    }
  }

  /**
   * 验证文件完整性
   */
  static async validateFile(
    filePath: string,
    expectedSize?: number,
    expectedMtime?: number
  ): Promise<FileValidationResult> {
    try {
      const exists = await this.checkFileExists(filePath)
      if (!exists) {
        return {
          exists: false,
          valid: false,
          error: '文件不存在'
        }
      }

      const fileInfo = await this.getFileInfo(filePath)
      if (!fileInfo) {
        return {
          exists: true,
          valid: false,
          error: '无法获取文件信息'
        }
      }

      const valid = await window.api.fileSystem.validateFile(filePath, expectedSize, expectedMtime)

      return {
        exists: true,
        valid,
        fileInfo,
        error: valid ? undefined : '文件已被修改或损坏'
      }
    } catch (error) {
      console.error('验证文件失败:', error)
      return {
        exists: false,
        valid: false,
        error: `验证失败: ${error}`
      }
    }
  }

  /**
   * 获取视频文件的 file:// URL
   */
  static async getVideoFileUrl(filePath: string): Promise<string | null> {
    try {
      return await window.api.fileSystem.getFileUrl(filePath)
    } catch (error) {
      console.error('获取视频文件URL失败:', error)
      return null
    }
  }

  /**
   * 读取字幕文件内容
   */
  static async readSubtitleFile(filePath: string): Promise<string | null> {
    try {
      return await window.api.fileSystem.readFile(filePath)
    } catch (error) {
      console.error('读取字幕文件失败:', error)
      return null
    }
  }

  /**
   * 打开文件选择对话框
   */
  static async openFileDialog(options: {
    title?: string
    filters?: Array<{ name: string; extensions: string[] }>
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>
  }): Promise<string[] | null> {
    try {
      const result = await window.api.fileSystem.openFileDialog(options)
      return result.canceled ? null : result.filePaths
    } catch (error) {
      console.error('打开文件对话框失败:', error)
      return null
    }
  }

  /**
   * 检查是否为有效的文件路径
   */
  static isValidFilePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') {
      return false
    }

    // 检查是否为绝对路径
    const isAbsolute = /^([a-zA-Z]:[\\/]|[\\/])/.test(filePath)
    if (!isAbsolute) {
      return false
    }

    // 检查路径长度 (Windows 限制)
    const isWindows = navigator.platform.toLowerCase().includes('win')
    if (filePath.length > 260 && isWindows) {
      return false
    }

    return true
  }

  /**
   * 规范化文件路径
   */
  static normalizePath(filePath: string): string {
    if (!filePath) return ''

    // 检测是否为 Windows 平台
    const isWindows = navigator.platform.toLowerCase().includes('win')

    // 在 Windows 上统一使用反斜杠
    if (isWindows) {
      return filePath.replace(/\//g, '\\')
    }

    // 在其他平台上统一使用正斜杠
    return filePath.replace(/\\/g, '/')
  }

  /**
   * 从文件路径提取文件名
   */
  static getFileName(filePath: string): string {
    if (!filePath) return ''

    const normalized = this.normalizePath(filePath)
    const isWindows = navigator.platform.toLowerCase().includes('win')
    const separator = isWindows ? '\\' : '/'
    const parts = normalized.split(separator)

    return parts[parts.length - 1] || ''
  }

  /**
   * 从文件路径提取目录路径
   */
  static getDirectoryPath(filePath: string): string {
    if (!filePath) return ''

    const normalized = this.normalizePath(filePath)
    const isWindows = navigator.platform.toLowerCase().includes('win')
    const separator = isWindows ? '\\' : '/'
    const parts = normalized.split(separator)

    if (parts.length <= 1) return ''

    return parts.slice(0, -1).join(separator)
  }

  /**
   * 检查文件扩展名
   */
  static getFileExtension(filePath: string): string {
    const fileName = this.getFileName(filePath)
    const lastDotIndex = fileName.lastIndexOf('.')

    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return ''
    }

    return fileName.substring(lastDotIndex + 1).toLowerCase()
  }

  /**
   * 检查是否为支持的视频格式
   */
  static isSupportedVideoFormat(filePath: string): boolean {
    const supportedFormats = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'ogg', 'm4v', 'flv', 'wmv']
    const extension = this.getFileExtension(filePath)

    return supportedFormats.includes(extension)
  }

  /**
   * 检查是否为支持的字幕格式
   */
  static isSupportedSubtitleFormat(filePath: string): boolean {
    const supportedFormats = ['srt', 'vtt', 'ass', 'ssa', 'sub', 'sbv']
    const extension = this.getFileExtension(filePath)

    return supportedFormats.includes(extension)
  }
}
