const { sql } = require('kysely')

/**
 * Migration: Add player settings table for per-video configuration
 *
 * Creates the `playerSettings` table to store individual player configurations
 * for each video in the library, replacing the global player settings approach.
 */
async function up(db) {
  // 创建播放器设置表
  await db.schema
    .createTable('playerSettings')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('videoId', 'integer', (col) =>
      col.notNull().references('videoLibrary.id').onDelete('cascade')
    )
    .addColumn('playbackRate', 'real', (col) => col.notNull().defaultTo(1.0))
    .addColumn('volume', 'real', (col) => col.notNull().defaultTo(1.0))
    .addColumn('muted', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('loopSettings', 'text') // JSON: {enabled, count, mode, remainingCount}
    .addColumn('autoPauseSettings', 'text') // JSON: {enabled, pauseOnSubtitleEnd, resumeEnabled, resumeDelay}
    .addColumn('subtitleOverlaySettings', 'text') // JSON: subtitleOverlay完整配置
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .addColumn('updated_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .execute()

  // 创建索引
  await db.schema
    .createIndex('idx_playerSettings_videoId')
    .ifNotExists()
    .on('playerSettings')
    .column('videoId')
    .execute()

  await db.schema
    .createIndex('idx_playerSettings_updated_at')
    .ifNotExists()
    .on('playerSettings')
    .column('updated_at')
    .execute()

  // 创建唯一约束确保每个视频只有一个设置记录
  await db.schema
    .createIndex('idx_playerSettings_videoId_unique')
    .ifNotExists()
    .on('playerSettings')
    .column('videoId')
    .unique()
    .execute()
}

/**
 * Reverts the migration by removing the playerSettings table and its indices.
 */
async function down(db) {
  // 删除索引
  await db.schema.dropIndex('idx_playerSettings_videoId_unique').ifExists().execute()
  await db.schema.dropIndex('idx_playerSettings_updated_at').ifExists().execute()
  await db.schema.dropIndex('idx_playerSettings_videoId').ifExists().execute()

  // 删除表（外键约束会自动删除）
  await db.schema.dropTable('playerSettings').ifExists().execute()
}

module.exports = { up, down }
