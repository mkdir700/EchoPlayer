/**
 * IPC 客户端
 * IPC client for renderer process
 */

// 文件系统相关的 IPC 调用
export const ipcFileSystem = {
  /**
   * 复制文件到临时目录
   * Copy file to temporary directory
   */
  async copyToTemp(filePath: string): Promise<{ tempPath: string; size: number } | null> {
    return window.electron.ipcRenderer.invoke('fs:copy-to-temp', filePath)
  },

  /**
   * 获取文件信息
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<{
    size: number
    mtime: number
    isFile: boolean
    isDirectory: boolean
  } | null> {
    return window.electron.ipcRenderer.invoke('fs:get-file-info', filePath)
  },

  /**
   * 检查文件是否存在
   * Check if file exists
   */
  async checkFileExists(filePath: string): Promise<boolean> {
    return window.electron.ipcRenderer.invoke('fs:check-file-exists', filePath)
  },

  /**
   * 获取文件的 file:// URL
   * Get file:// URL for file
   */
  async getFileUrl(filePath: string): Promise<string | null> {
    return window.electron.ipcRenderer.invoke('fs:get-file-url', filePath)
  },

  /**
   * 获取临时目录路径
   * Get temporary directory path
   */
  async getTempDir(): Promise<string> {
    return window.electron.ipcRenderer.invoke('fs:get-temp-dir')
  },

  /**
   * 保存转码后的文件
   * Save transcoded file
   */
  async saveTranscodedFile(sourcePath: string, defaultName: string): Promise<string | null> {
    return window.electron.ipcRenderer.invoke('fs:save-transcoded-file', sourcePath, defaultName)
  },

  /**
   * 删除临时文件
   * Delete temporary file
   */
  async deleteTempFile(tempPath: string): Promise<boolean> {
    return window.electron.ipcRenderer.invoke('fs:delete-temp-file', tempPath)
  }
}

// FFmpeg 相关的 IPC 调用
export const ipcFFmpeg = {
  /**
   * 检查 FFmpeg 是否可用
   * Check if FFmpeg is available
   */
  async checkAvailability(): Promise<boolean> {
    return window.electron.ipcRenderer.invoke('ffmpeg:check-availability')
  },

  /**
   * 获取视频信息
   * Get video information
   */
  async getVideoInfo(filePath: string): Promise<{
    duration?: number
    videoCodec?: string
    audioCodec?: string
    resolution?: string
    fps?: number
    bitrate?: number
  } | null> {
    return window.electron.ipcRenderer.invoke('ffmpeg:get-video-info', filePath)
  },

  /**
   * 转码视频
   * Transcode video
   */
  async transcode(
    inputPath: string,
    outputPath: string,
    options: {
      videoCodec?: string
      audioCodec?: string
      preset?: string
      crf?: number
      audioBitrate?: string
      customArgs?: string[]
    } = {}
  ): Promise<{ success: boolean; error?: string; outputPath?: string }> {
    return window.electron.ipcRenderer.invoke('ffmpeg:transcode', inputPath, outputPath, options)
  },

  /**
   * 生成输出文件路径
   * Generate output file path
   */
  async getOutputPath(inputPath: string, suffix: string = '_converted'): Promise<string> {
    return window.electron.ipcRenderer.invoke('ffmpeg:get-output-path', inputPath, suffix)
  },

  /**
   * 监听转码进度
   * Listen to transcoding progress
   */
  onProgress(
    callback: (progress: {
      progress: number
      currentTime: number
      totalDuration: number
      speed: number
      fps: number
    }) => void
  ): () => void {
    const handleProgress = (
      _: unknown,
      data: {
        progress: number
        currentTime: number
        totalDuration: number
        speed: number
        fps: number
      }
    ): void => callback(data)
    window.electron.ipcRenderer.on('ffmpeg:progress', handleProgress)

    // 返回取消监听的函数
    return () => {
      window.electron.ipcRenderer.removeListener('ffmpeg:progress', handleProgress)
    }
  }
}
