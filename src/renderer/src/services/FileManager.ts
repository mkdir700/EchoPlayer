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

    const addedFile = await db.files.addFile({ ...file, created_at: file.created_at.getTime() })
    logger.info(`✅ 文件添加成功`, {
      fileId: addedFile.id
    })

    return addedFile
  }
}

export default FileManager
