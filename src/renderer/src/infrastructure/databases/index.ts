import { FileMetadata, SubtitleLibraryRecord, VideoLibraryRecord } from '@types'
import { Dexie, type EntityTable } from 'dexie'

export const db = new Dexie('EchoLab') as Dexie & {
  files: EntityTable<FileMetadata, 'id'>
  videoLibrary: EntityTable<VideoLibraryRecord, 'id'>
  subtitleLibrary: EntityTable<SubtitleLibraryRecord, 'id'>
  // settings: EntityTable<{ id: string; value: any }, 'id'>
}

// 版本 1: 原始结构（包含冗余字段）
db.version(1).stores({
  files: 'id, name, origin_name, path, size, ext, type, created_at',
  videoLibrary:
    '++id, fileId, currentTime, duration, playedAt, firstPlayedAt, playCount, isFinished, isFavorite, thumbnailPath, [fileId+playedAt], [playedAt], [playCount], [isFavorite]',
  subtitleLibrary: '++id, videoId, filePath, [videoId+filePath], created_at'
})

export default db
