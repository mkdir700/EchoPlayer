import type { Insertable, Selectable, Updateable } from 'kysely'

import type {
  FileMetadataTable,
  FileTypes,
  PlayerSettingsTable,
  SubtitleLibraryTable,
  VideoLibraryTable
} from '../schema'

/**
 * 文件元数据实体类型 - 适配前端使用
 */
export interface FileMetadata {
  id: string
  name: string
  origin_name: string
  path: string
  size: number
  ext: string
  type: FileTypes
  created_at: Date
}

export type VideoLibraryRecord = Selectable<VideoLibraryTable>
export type VideoLibraryInsert = Insertable<VideoLibraryTable>
export type VideoLibraryUpdate = Updateable<VideoLibraryTable>

export type FileMetadataRecord = Selectable<FileMetadataTable>
export type FileMetadataInsert = Insertable<FileMetadataTable>
export type FileMetadataUpdate = Updateable<FileMetadataTable>

export type SubtitleLibraryRecord = Selectable<SubtitleLibraryTable>
export type SubtitleLibraryInsert = Insertable<SubtitleLibraryTable>
export type SubtitleLibraryUpdate = Updateable<SubtitleLibraryTable>

export type PlayerSettingsRecord = Selectable<PlayerSettingsTable>
export type PlayerSettingsInsert = Insertable<PlayerSettingsTable>
export type PlayerSettingsUpdate = Updateable<PlayerSettingsTable>
