/**
 * Apply the initial database schema migration.
 *
 * Creates the tables `files`, `videoLibrary`, and `subtitleLibrary` (if not exists)
 * and their associated indices. Designed to be run as the migration "up" step.
 */
async function up(db) {
  // 创建文件表
  await db.schema
    .createTable('files')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('origin_name', 'text', (col) => col.notNull())
    .addColumn('path', 'text', (col) => col.notNull().unique())
    .addColumn('size', 'integer', (col) => col.notNull())
    .addColumn('ext', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo('unixepoch()'))
    .execute()

  // 创建文件表索引
  await db.schema.createIndex('idx_files_name').ifNotExists().on('files').column('name').execute()
  await db.schema.createIndex('idx_files_type').ifNotExists().on('files').column('type').execute()
  await db.schema
    .createIndex('idx_files_created_at')
    .ifNotExists()
    .on('files')
    .column('created_at')
    .execute()
  await db.schema.createIndex('idx_files_ext').ifNotExists().on('files').column('ext').execute()

  // 创建视频库表
  await db.schema
    .createTable('videoLibrary')
    .ifNotExists()
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
    .ifNotExists()
    .on('videoLibrary')
    .columns(['fileId', 'playedAt'])
    .execute()
  await db.schema
    .createIndex('idx_videoLibrary_playedAt')
    .ifNotExists()
    .on('videoLibrary')
    .column('playedAt')
    .execute()
  await db.schema
    .createIndex('idx_videoLibrary_playCount')
    .ifNotExists()
    .on('videoLibrary')
    .column('playCount')
    .execute()
  await db.schema
    .createIndex('idx_videoLibrary_isFavorite')
    .ifNotExists()
    .on('videoLibrary')
    .column('isFavorite')
    .execute()

  // 创建字幕库表
  await db.schema
    .createTable('subtitleLibrary')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('videoId', 'integer', (col) => col.notNull())
    .addColumn('filePath', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo('unixepoch()'))
    .execute()

  // 创建字幕库表索引
  await db.schema
    .createIndex('idx_subtitleLibrary_videoId_filePath')
    .ifNotExists()
    .on('subtitleLibrary')
    .columns(['videoId', 'filePath'])
    .execute()
  await db.schema
    .createIndex('idx_subtitleLibrary_created_at')
    .ifNotExists()
    .on('subtitleLibrary')
    .column('created_at')
    .execute()
}

/**
 * Reverts the migration by removing created indices and tables.
 *
 * Drops the migration's indices (using `ifExists`) in a safe order, then drops
 * the tables `subtitleLibrary`, `videoLibrary`, and `files` (also using `ifExists`).
 * The operation is idempotent and intended to fully revert the schema changes made by `up`.
 *
 * @returns {Promise<void>} Resolves when all drop statements have completed.
 */
async function down(db) {
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

module.exports = { up, down }
