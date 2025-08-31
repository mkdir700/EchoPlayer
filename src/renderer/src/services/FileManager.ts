import { loggerService } from '@logger'
import db from '@renderer/databases'
import type { FileMetadata } from 'packages/shared/types/database'

const logger = loggerService.withContext('FileManager')

class FileManager {
  static async selectFiles(options?: Electron.OpenDialogOptions): Promise<FileMetadata[] | null> {
    const files = await window.api.file.select(options)
    return files
  }

  static async getFile(fileId: string): Promise<FileMetadata | null> {
    const file = await db.files.getFile(fileId)
    return file
  }

  static async addFile(file: FileMetadata): Promise<FileMetadata> {
    logger.info('💾 开始添加文件到数据库', { fileName: file.name, filePath: file.path })

    // 先检查文件是否已存在（通过路径查找）
    const queryStartTime = performance.now()
    const existingFile = await db.files.getFileByPath(file.path)
    const queryEndTime = performance.now()
    logger.info(`🔍 文件查询耗时: ${(queryEndTime - queryStartTime).toFixed(2)}ms`)

    if (existingFile) {
      const updatedFile = await db.files.updateFile(existingFile.id, file)
      return updatedFile || existingFile
    }
    return await db.files.addFile({ ...file, created_at: file.created_at.getTime() })
  }
}

export default FileManager
