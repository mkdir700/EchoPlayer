import { loggerService } from '@logger'
import db from '@renderer/infrastructure/databases'
import useRuntimeStore from '@renderer/state/stores/runtime'
import { getFileDirectory } from '@renderer/utils'
import { FileMetadata } from '@types'

const logger = loggerService.withContext('FileManager')

class FileManager {
  static async selectFiles(options?: Electron.OpenDialogOptions): Promise<FileMetadata[] | null> {
    const files = await window.api.file.select(options)
    return files
  }

  static async addFile(file: FileMetadata): Promise<FileMetadata> {
    const startTime = performance.now()
    logger.info('💾 开始添加文件到数据库', { fileId: file.id, fileName: file.name })

    const queryStartTime = performance.now()
    const fileRecord = await db.files.get(file.id)
    const queryEndTime = performance.now()
    logger.info(`🔍 文件查询耗时: ${(queryEndTime - queryStartTime).toFixed(2)}ms`)

    if (fileRecord) {
      const updateStartTime = performance.now()
      await db.files.update(fileRecord.id, { ...fileRecord })
      const updateEndTime = performance.now()
      const totalTime = updateEndTime - startTime
      logger.info(`🔄 文件更新完成，总耗时: ${totalTime.toFixed(2)}ms`, {
        查询耗时: `${(queryEndTime - queryStartTime).toFixed(2)}ms`,
        更新耗时: `${(updateEndTime - updateStartTime).toFixed(2)}ms`,
        总耗时: `${totalTime.toFixed(2)}ms`
      })
      return fileRecord
    }

    const addStartTime = performance.now()
    await db.files.add(file)
    const addEndTime = performance.now()
    const totalTime = addEndTime - startTime
    logger.info(`✅ 文件添加完成，总耗时: ${totalTime.toFixed(2)}ms`, {
      查询耗时: `${(queryEndTime - queryStartTime).toFixed(2)}ms`,
      添加耗时: `${(addEndTime - addStartTime).toFixed(2)}ms`,
      总耗时: `${totalTime.toFixed(2)}ms`
    })

    return file
  }

  static async addFiles(files: FileMetadata[]): Promise<FileMetadata[]> {
    return Promise.all(files.map((file) => this.addFile(file)))
  }

  static async readBinaryImage(file: FileMetadata): Promise<Buffer> {
    const fileData = await window.api.file.binaryImage(file.id + file.ext)
    return fileData.data
  }

  static async readBase64File(file: FileMetadata): Promise<string> {
    const fileData = await window.api.file.base64File(file.id + file.ext)
    return fileData.data
  }

  static async addBase64File(file: FileMetadata): Promise<FileMetadata> {
    logger.info(`Adding base64 file: ${JSON.stringify(file)}`)

    const base64File = await window.api.file.base64File(file.id + file.ext)
    const fileRecord = await db.files.get(base64File.id)

    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord })
      return fileRecord
    }

    await db.files.add(base64File)

    return base64File
  }

  static async uploadFile(file: FileMetadata): Promise<FileMetadata> {
    logger.info(`Uploading file: ${JSON.stringify(file)}`)

    const uploadFile = await window.api.file.upload(file)
    logger.info('Uploaded file:', uploadFile)
    const fileRecord = await db.files.get(uploadFile.id)

    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord })
      return fileRecord
    }

    await db.files.add(uploadFile)

    return uploadFile
  }

  static async uploadFiles(files: FileMetadata[]): Promise<FileMetadata[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)))
  }

  static async getFile(id: string): Promise<FileMetadata | undefined> {
    const file = await db.files.get(id)

    if (file) {
      const filePath = useRuntimeStore.getState().filePath
      file.path = filePath + '/' + file.id + file.ext
    }

    return file
  }

  static getFilePath(file: FileMetadata) {
    const filePath = useRuntimeStore.getState().filePath
    return filePath + '/' + file.id + file.ext
  }

  static async deleteFile(id: string): Promise<void> {
    const file = await this.getFile(id)

    logger.info('Deleting file:', file)

    if (!file) {
      return
    }

    await db.files.delete(id)

    try {
      await window.api.file.delete(id + file.ext)
    } catch (error) {
      logger.error('Failed to delete file:', error as Error)
    }
  }

  static async deleteFiles(files: FileMetadata[]): Promise<void> {
    await Promise.all(files.map((file) => this.deleteFile(file.id)))
  }

  static async allFiles(): Promise<FileMetadata[]> {
    return db.files.toArray()
  }

  static isDangerFile(file: FileMetadata) {
    return ['.sh', '.bat', '.cmd', '.ps1', '.vbs', 'reg'].includes(file.ext)
  }

  static getSafePath(file: FileMetadata) {
    return this.isDangerFile(file) ? getFileDirectory(file.path) : file.path
  }

  static getFileUrl(file: FileMetadata) {
    const filePath = useRuntimeStore.getState().filePath
    return 'file://' + filePath + '/' + file.name
  }

  static async updateFile(file: FileMetadata) {
    if (!file.origin_name.includes(file.ext)) {
      file.origin_name = file.origin_name + file.ext
    }

    await db.files.update(file.id, file)
  }
}

export default FileManager
