/**
 * Migration: Add subtitle data storage columns to subtitleLibrary table
 *
 * Adds the `subtitles` column (JSON text) to store parsed subtitle data
 * and `parsed_at` column (integer timestamp) to track when subtitles were parsed.
 * This enables caching of parsed subtitle data in the database, eliminating
 * the need to re-parse subtitle files on every load.
 */
async function up(db) {
  // 为 subtitleLibrary 表添加新列
  await db.schema
    .alterTable('subtitleLibrary')
    .addColumn('subtitles', 'text') // JSON 格式的字幕数据
    .execute()

  await db.schema
    .alterTable('subtitleLibrary')
    .addColumn('parsed_at', 'integer') // 解析时间戳
    .execute()

  // 为新列创建索引，优化查询性能
  await db.schema
    .createIndex('idx_subtitleLibrary_parsed_at')
    .ifNotExists()
    .on('subtitleLibrary')
    .column('parsed_at')
    .execute()

  // 创建复合索引，优化按视频ID查询有解析数据的记录
  await db.schema
    .createIndex('idx_subtitleLibrary_videoId_parsed_at')
    .ifNotExists()
    .on('subtitleLibrary')
    .columns(['videoId', 'parsed_at'])
    .execute()
}

/**
 * Reverts the migration by removing the added columns and their indices.
 *
 * Note: SQLite doesn't support DROP COLUMN directly in older versions,
 * but modern SQLite (3.35.0+) does. This assumes a modern SQLite version.
 * If compatibility with older versions is needed, a more complex approach
 * involving table recreation would be required.
 */
async function down(db) {
  // 删除索引
  await db.schema.dropIndex('idx_subtitleLibrary_videoId_parsed_at').ifExists().execute()

  await db.schema.dropIndex('idx_subtitleLibrary_parsed_at').ifExists().execute()

  // 删除添加的列
  // 注意：这需要 SQLite 3.35.0+ 版本支持 DROP COLUMN
  await db.schema.alterTable('subtitleLibrary').dropColumn('parsed_at').execute()

  await db.schema.alterTable('subtitleLibrary').dropColumn('subtitles').execute()
}

module.exports = { up, down }
