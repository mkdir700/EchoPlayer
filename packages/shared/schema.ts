import type { ColumnType, Generated } from 'kysely'

export type FileTypes = 'video' | 'audio' | 'subtitle' | 'image'

export interface FileMetadataTable {
  /**
   * 文件的唯一标识符
   */
  id: Generated<number>
  /**
   * 文件名
   */
  name: string
  /**
   * 文件的原始名称（展示名称）
   */
  origin_name: string
  /**
   * 文件路径
   */
  path: string
  /**
   * 文件大小，单位为字节
   */
  size: number
  /**
   * 文件扩展名（包含.）
   */
  ext: string
  /**
   * 文件类型
   */
  type: FileTypes
  /**
   * 文件创建时间的ISO字符串
   */
  created_at: ColumnType<Date, string | undefined, never>
}

export interface VideoLibraryTable {
  /** 自增主键 */
  id: Generated<number>
  /** 关联的文件ID */
  fileId: string
  /** 当前播放时间（秒） */
  currentTime: number
  /** 视频总时长（秒） */
  duration: number
  /** 上次播放时间戳 */
  playedAt: number
  /** 首次播放时间戳 */
  firstPlayedAt: number
  /** 播放次数 */
  playCount: number
  /** 是否已播放完毕 */
  isFinished: boolean
  /** 是否收藏 */
  isFavorite: boolean
  /** 缩略图路径 */
  thumbnailPath?: string
}

export interface SubtitleLibraryTable {
  id: Generated<number>
  videoId: number
  filePath: string
  created_at: ColumnType<Date, string | undefined, never>
}

export interface DB {
  files: FileMetadataTable
  videoLibrary: VideoLibraryTable
  subtitleLibrary: SubtitleLibraryTable
}
