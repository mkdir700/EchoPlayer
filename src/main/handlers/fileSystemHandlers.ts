import { ipcMain, dialog, shell } from 'electron'
import { readFile, access, constants, stat, copyFile } from 'fs/promises'
import { createReadStream, createWriteStream } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// 设置文件系统相关的 IPC 处理器
export function setupFileSystemHandlers(): void {
  // 检查文件是否存在
  ipcMain.handle('fs:check-file-exists', async (_, filePath: string): Promise<boolean> => {
    try {
      await access(filePath, constants.F_OK)
      return true
    } catch {
      return false
    }
  })

  // 读取文件内容（用于字幕文件）
  ipcMain.handle('fs:read-file', async (_, filePath: string): Promise<string | null> => {
    try {
      const content = await readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('读取文件失败:', error)
      return null
    }
  })

  // 获取文件的 file:// URL（用于视频文件）
  ipcMain.handle('fs:get-file-url', async (_, filePath: string): Promise<string | null> => {
    try {
      await access(filePath, constants.F_OK)

      // 使用 URL 构造函数来正确处理文件路径
      let fileUrl: string

      if (process.platform === 'win32') {
        // Windows 路径处理：使用 file:// 协议和正确的路径格式
        // 将反斜杠替换为正斜杠
        const normalizedPath = filePath.replace(/\\/g, '/')
        // 使用 URL 构造函数自动处理编码
        fileUrl = new URL(`file:///${normalizedPath}`).href
      } else {
        // Unix-like 系统
        fileUrl = new URL(`file://${filePath}`).href
      }

      console.log('生成文件URL:', {
        originalPath: filePath,
        fileUrl
      })

      return fileUrl
    } catch (error) {
      console.error('获取文件URL失败:', error)
      return null
    }
  })

  // 打开文件选择对话框
  ipcMain.handle('dialog:open-file', async (_, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(options)
    return result
  })

  // 获取文件信息
  ipcMain.handle('fs:get-file-info', async (_, filePath: string) => {
    try {
      const stats = await stat(filePath)
      return {
        size: stats.size,
        mtime: stats.mtime.getTime(),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      }
    } catch (error) {
      console.error('获取文件信息失败:', error)
      return null
    }
  })

  // 验证文件完整性（通过文件大小和修改时间）
  ipcMain.handle(
    'fs:validate-file',
    async (_, filePath: string, expectedSize?: number, expectedMtime?: number) => {
      try {
        const stats = await stat(filePath)

        if (expectedSize !== undefined && stats.size !== expectedSize) {
          return false
        }

        if (expectedMtime !== undefined && stats.mtime.getTime() !== expectedMtime) {
          return false
        }

        return true
      } catch {
        return false
      }
    }
  )

  // 打开外部链接 / Open external URL
  ipcMain.handle('shell:openExternal', async (_, url: string): Promise<boolean> => {
    try {
      await shell.openExternal(url)
      console.log('打开外部链接:', url)
      return true
    } catch (error) {
      console.error('打开外部链接失败:', error)
      return false
    }
  })

  // 在文件管理器中显示文件 / Show file in file manager
  ipcMain.handle('shell:showItemInFolder', async (_, filePath: string): Promise<boolean> => {
    try {
      let localPath = filePath

      // 如果是file://URL，需要转换为本地路径
      if (filePath.startsWith('file://')) {
        const url = new URL(filePath)
        localPath = decodeURIComponent(url.pathname)

        // Windows路径处理：移除开头的斜杠
        if (process.platform === 'win32' && localPath.startsWith('/')) {
          localPath = localPath.substring(1)
        }

        console.log('URL路径转换:', {
          原始URL: filePath,
          转换后路径: localPath
        })
      }

      shell.showItemInFolder(localPath)
      console.log('在文件管理器中显示文件:', localPath)
      return true
    } catch (error) {
      console.error('显示文件位置失败:', error)
      return false
    }
  })

  // 复制大文件到临时目录（用于 ffmpeg.wasm）
  ipcMain.handle(
    'fs:copy-to-temp',
    async (_, filePath: string): Promise<{ tempPath: string; size: number } | null> => {
      try {
        console.log('📁 [主进程] 开始复制文件到临时目录:', filePath)

        // 首先检查文件是否存在
        await access(filePath, constants.F_OK)
        console.log('✅ [主进程] 文件存在性检查通过')

        // 获取文件大小
        const stats = await stat(filePath)
        const fileSize = stats.size
        console.log(
          '📦 [主进程] 文件大小:',
          fileSize,
          'bytes (',
          (fileSize / 1024 / 1024 / 1024).toFixed(2),
          'GB)'
        )

        if (fileSize === 0) {
          console.error('❌ [主进程] 文件为空')
          return null
        }

        // 生成临时文件路径
        const fileName = filePath.split(/[/\\]/).pop() || 'temp_video'
        const tempPath = join(tmpdir(), `echolab_temp_${Date.now()}_${fileName}`)
        console.log('📂 [主进程] 临时文件路径:', tempPath)

        // 对于大文件，使用流式复制
        if (fileSize > 100 * 1024 * 1024) {
          console.log('🔄 [主进程] 大文件检测，使用流式复制')

          return new Promise((resolve, reject) => {
            let totalBytesRead = 0

            const readStream = createReadStream(filePath)
            const writeStream = createWriteStream(tempPath)

            readStream.on('data', (chunk: string | Buffer) => {
              const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
              totalBytesRead += bufferChunk.length

              // 每复制 100MB 打印一次进度
              if (totalBytesRead % (100 * 1024 * 1024) < bufferChunk.length) {
                const progress = ((totalBytesRead / fileSize) * 100).toFixed(2)
                console.log(`📖 [主进程] 复制进度: ${progress}% (${totalBytesRead}/${fileSize})`)
              }
            })

            readStream.on('error', (error) => {
              console.error('❌ [主进程] 读取流失败:', error)
              writeStream.destroy()
              reject(error)
            })

            writeStream.on('error', (error) => {
              console.error('❌ [主进程] 写入流失败:', error)
              reject(error)
            })

            writeStream.on('finish', () => {
              console.log('✅ [主进程] 文件复制完成，临时文件:', tempPath)
              resolve({ tempPath, size: fileSize })
            })

            readStream.pipe(writeStream)
          })
        } else {
          // 小文件直接复制
          console.log('📖 [主进程] 小文件，直接复制')
          await copyFile(filePath, tempPath)

          console.log('✅ [主进程] 文件复制成功，临时文件:', tempPath)
          return { tempPath, size: fileSize }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined
        console.error('❌ [主进程] 复制文件到临时目录失败:', {
          filePath,
          error: errorMessage,
          stack: errorStack
        })
        return null
      }
    }
  )

  // Note: FFmpeg handlers moved to ffmpegHandlers.ts to avoid duplication

  // 删除临时文件
  ipcMain.handle('fs:delete-temp-file', async (_, tempPath: string): Promise<boolean> => {
    try {
      const { unlink } = await import('fs/promises')
      await unlink(tempPath)
      console.log('🗑️ [主进程] 临时文件删除成功:', tempPath)
      return true
    } catch (error) {
      console.error('❌ [主进程] 删除临时文件失败:', error)
      return false
    }
  })

  // 保存转码结果文件
  ipcMain.handle(
    'fs:save-transcoded-file',
    async (_, sourcePath: string, defaultName: string): Promise<string | null> => {
      try {
        // 选择保存位置
        const result = await dialog.showSaveDialog({
          defaultPath: defaultName,
          filters: [
            { name: 'Video Files', extensions: ['mp4', 'webm', 'mkv'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        })

        if (result.canceled || !result.filePath) {
          return null
        }

        // 复制文件到目标位置
        await copyFile(sourcePath, result.filePath)

        console.log('💾 [主进程] 转码文件保存成功:', result.filePath)
        return result.filePath
      } catch (error) {
        console.error('❌ [主进程] 保存转码文件失败:', error)
        return null
      }
    }
  )

  // 获取临时目录路径
  ipcMain.handle('fs:get-temp-dir', async (): Promise<string> => {
    return join(tmpdir(), 'echolab-transcoded')
  })
}
