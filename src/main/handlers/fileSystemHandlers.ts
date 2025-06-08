import { ipcMain, dialog, shell } from 'electron'
import { readFile, access, constants, stat } from 'fs/promises'

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
}
