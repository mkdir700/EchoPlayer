import { FileService } from './FileService'
import { SubtitleLibraryService } from './SubtitleLibraryService'
import { VideoLibraryService } from './VideoLibraryService'

/**
 * 数据库服务聚合器 - 组合多个专门的数据库服务
 * 保持向后兼容性，同时提供清晰的职责分离
 */
class DatabaseService {
  private fileService: FileService
  private videoLibraryService: VideoLibraryService
  private subtitleLibraryService: SubtitleLibraryService

  constructor() {
    this.fileService = new FileService()
    this.videoLibraryService = new VideoLibraryService()
    this.subtitleLibraryService = new SubtitleLibraryService()
  }

  get files(): FileService {
    return this.fileService
  }

  get videoLibrary(): VideoLibraryService {
    return this.videoLibraryService
  }

  get subtitleLibrary(): SubtitleLibraryService {
    return this.subtitleLibraryService
  }
}

// 导出数据库服务实例
export const db = new DatabaseService()
export default db
