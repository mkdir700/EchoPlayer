import type { ColumnType, Generated } from 'kysely'
import { SqlBool } from 'kysely'

export type FileTypes = 'video' | 'audio' | 'subtitle' | 'image' | 'other'

export interface FileMetadataTable {
  /**
   * 文件的唯一标识符
   */
  id: string
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
   * SelectType | InsertType | UpdateType
   */
  created_at: ColumnType<Date, number | undefined, never>
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
  isFinished: Generated<SqlBool>
  /** 是否收藏 */
  isFavorite: Generated<SqlBool>
  /** 缩略图路径 */
  thumbnailPath: string | null
}

export interface SubtitleLibraryTable {
  id: Generated<number>
  videoId: number
  filePath: string
  subtitles: string | null
  parsed_at: ColumnType<Date, number | undefined, never> | null
  created_at: ColumnType<Date, number | undefined, never>
}

export interface PlayerSettingsTable {
  /** 自增主键 */
  id: Generated<number>
  /** 关联的视频库ID */
  videoId: number
  /** 播放速度 */
  playbackRate: number
  /** 音量 (0-1) */
  volume: number
  /** 是否静音 */
  muted: Generated<SqlBool>
  /** 循环设置 JSON */
  loopSettings: string | null
  /** 自动暂停设置 JSON */
  autoPauseSettings: string | null
  /** 字幕覆盖层设置 JSON */
  subtitleOverlaySettings: string | null
  /** 创建时间戳 */
  created_at: ColumnType<Date, number | undefined, never>
  /** 更新时间戳 */
  updated_at: ColumnType<Date, number | undefined, number>
}

export interface DB {
  files: FileMetadataTable
  videoLibrary: VideoLibraryTable
  subtitleLibrary: SubtitleLibraryTable
  playerSettings: PlayerSettingsTable
}
