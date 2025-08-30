import { loggerService } from '@logger'
import type { FileMetadata, FileMetadataInsert } from 'packages/shared/types/database'

const logger = loggerService.withContext('FileService')

/**
 * 文件数据库服务 - 专门处理文件相关操作
 */
export class FileService {
  /**
   * 添加文件到数据库
   */
  async addFile(file: FileMetadataInsert): Promise<FileMetadata> {
    const result = await window.api.db.files.add(file)
    if (!result) throw new Error('Failed to add file')
    const addedFile = await this.getFile(result.id)
    if (!addedFile) throw new Error('Failed to retrieve added file')
    return addedFile
  }

  async updateFile(id: string, data: Partial<FileMetadata>): Promise<FileMetadata | null> {
    try {
      const result = await window.api.db.files.update(id, data)
      if (!result) return null

      return {
        id: result.id,
        name: result.name,
        origin_name: result.origin_name,
        path: result.path,
        size: result.size,
        ext: result.ext,
        type: result.type as FileMetadata['type'],
        created_at: result.created_at
      }
    } catch (error) {
      logger.error('Failed to update file:', { error })
      throw error
    }
  }

  async getFile(id: string): Promise<FileMetadata | null> {
    try {
      const result = await window.api.db.files.findById(id)
      if (!result) return null

      return {
        id: result.id,
        name: result.name,
        origin_name: result.origin_name,
        path: result.path,
        size: result.size,
        ext: result.ext,
        type: result.type as FileMetadata['type'],
        created_at: result.created_at
      }
    } catch (error) {
      logger.error('Failed to get file by ID:', { error, fileId: id })
      return null
    }
  }

  /**
   * 根据路径获取文件信息
   */
  async getFileByPath(path: string): Promise<FileMetadata | null> {
    try {
      const result = await window.api.db.files.findByPath(path)
      if (!result) return null

      return {
        id: result.id,
        name: result.name,
        origin_name: result.origin_name,
        path: result.path,
        size: result.size,
        ext: result.ext,
        type: result.type as FileMetadata['type'],
        created_at: result.created_at
      }
    } catch (error) {
      logger.error('Failed to get file by path:', { error })
      return null
    }
  }

  /**
   * 根据类型获取文件列表
   */
  async getFilesByType(type: string): Promise<FileMetadata[]> {
    try {
      const files = await window.api.db.files.findByType(type)
      return files.map((file) => ({
        id: file.id,
        name: file.name,
        origin_name: file.origin_name,
        path: file.path,
        size: file.size,
        ext: file.ext,
        type: file.type as FileMetadata['type'],
        created_at: file.created_at
      }))
    } catch (error) {
      logger.error('Failed to get files by type:', { error })
      return []
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(id: string | number): Promise<void> {
    try {
      await window.api.db.files.delete(id)
    } catch (error) {
      logger.error('Failed to delete file:', { error })
      throw error
    }
  }
}
