import type { Kysely } from 'kysely'
import { sql } from 'kysely'

/**
 * Migration: Initial database schema
 */
export async function up(db: Kysely<any>): Promise<void> {
  // 创建文件表
  await db.schema
    .createTable('files')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('origin_name', 'text', (col) => col.notNull())
    .addColumn('path', 'text', (col) => col.notNull().unique())
    .addColumn('size', 'integer', (col) => col.notNull())
    .addColumn('ext', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) =>
      col.notNull().check(sql`type IN ('video', 'audio', 'subtitle', 'image')`)
    )
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`datetime('now')`))
    .execute()

  // 创建文件表索引
  await db.schema.createIndex('idx_files_name').on('files').column('name').execute()
  await db.schema.createIndex('idx_files_type').on('files').column('type').execute()
  await db.schema.createIndex('idx_files_created_at').on('files').column('created_at').execute()
  await db.schema.createIndex('idx_files_ext').on('files').column('ext').execute()

  // 创建视频库表
  await db.schema
    .createTable('videoLibrary')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('fileId', 'text', (col) => col.notNull())
    .addColumn('currentTime', 'real', (col) => col.notNull().defaultTo(0))
    .addColumn('duration', 'real', (col) => col.notNull().defaultTo(0))
    .addColumn('playedAt', 'integer', (col) => col.notNull())
    .addColumn('firstPlayedAt', 'integer', (col) => col.notNull())
    .addColumn('playCount', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('isFinished', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('isFavorite', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('thumbnailPath', 'text')
    .execute()

  // 创建视频库表索引
  await db.schema
    .createIndex('idx_videoLibrary_fileId_playedAt')
    .on('videoLibrary')
    .columns(['fileId', 'playedAt'])
    .execute()
  await db.schema
    .createIndex('idx_videoLibrary_playedAt')
    .on('videoLibrary')
    .column('playedAt')
    .execute()
  await db.schema
    .createIndex('idx_videoLibrary_playCount')
    .on('videoLibrary')
    .column('playCount')
    .execute()
  await db.schema
    .createIndex('idx_videoLibrary_isFavorite')
    .on('videoLibrary')
    .column('isFavorite')
    .execute()

  // 创建字幕库表
  await db.schema
    .createTable('subtitleLibrary')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('videoId', 'integer', (col) => col.notNull())
    .addColumn('filePath', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`datetime('now')`))
    .execute()

  // 创建字幕库表索引
  await db.schema
    .createIndex('idx_subtitleLibrary_videoId_filePath')
    .on('subtitleLibrary')
    .columns(['videoId', 'filePath'])
    .execute()
  await db.schema
    .createIndex('idx_subtitleLibrary_created_at')
    .on('subtitleLibrary')
    .column('created_at')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // 删除所有索引
  await db.schema.dropIndex('idx_subtitleLibrary_created_at').ifExists().execute()
  await db.schema.dropIndex('idx_subtitleLibrary_videoId_filePath').ifExists().execute()
  await db.schema.dropIndex('idx_videoLibrary_isFavorite').ifExists().execute()
  await db.schema.dropIndex('idx_videoLibrary_playCount').ifExists().execute()
  await db.schema.dropIndex('idx_videoLibrary_playedAt').ifExists().execute()
  await db.schema.dropIndex('idx_videoLibrary_fileId_playedAt').ifExists().execute()
  await db.schema.dropIndex('idx_files_ext').ifExists().execute()
  await db.schema.dropIndex('idx_files_created_at').ifExists().execute()
  await db.schema.dropIndex('idx_files_type').ifExists().execute()
  await db.schema.dropIndex('idx_files_name').ifExists().execute()

  // 删除所有表
  await db.schema.dropTable('subtitleLibrary').ifExists().execute()
  await db.schema.dropTable('videoLibrary').ifExists().execute()
  await db.schema.dropTable('files').ifExists().execute()
}
