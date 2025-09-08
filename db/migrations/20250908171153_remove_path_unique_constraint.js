const { sql } = require('kysely')

/**
 * 删除 files 表中 path 字段的唯一约束
 *
 * 由于 SQLite 不支持直接删除约束，我们需要：
 * 1. 创建新表（无 path 唯一约束）
 * 2. 迁移现有数据
 * 3. 删除旧表并重命名新表
 * 4. 重建必要的索引
 */
async function up(db) {
  // 1. 创建临时表，与原表结构相同但 path 字段无唯一约束
  await db.schema
    .createTable('files_temp')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('origin_name', 'text', (col) => col.notNull())
    .addColumn('path', 'text', (col) => col.notNull()) // 注意：这里去掉了 .unique()
    .addColumn('size', 'integer', (col) => col.notNull())
    .addColumn('ext', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .execute()

  // 2. 复制现有数据到临时表
  await db
    .insertInto('files_temp')
    .columns(['id', 'name', 'origin_name', 'path', 'size', 'ext', 'type', 'created_at'])
    .expression(
      db
        .selectFrom('files')
        .select(['id', 'name', 'origin_name', 'path', 'size', 'ext', 'type', 'created_at'])
    )
    .execute()

  // 3. 删除原表
  await db.schema.dropTable('files').execute()

  // 4. 将临时表重命名为原表名
  await db.schema.alterTable('files_temp').renameTo('files').execute()

  // 5. 重建所有索引（除了 path 的唯一约束）
  await db.schema.createIndex('idx_files_name').on('files').column('name').execute()
  await db.schema.createIndex('idx_files_type').on('files').column('type').execute()
  await db.schema.createIndex('idx_files_created_at').on('files').column('created_at').execute()
  await db.schema.createIndex('idx_files_ext').on('files').column('ext').execute()

  // 添加 path 字段的普通索引（非唯一）以保持查询性能
  await db.schema.createIndex('idx_files_path').on('files').column('path').execute()
}

/**
 * 回滚：重新添加 path 字段的唯一约束
 * 注意：如果数据中已存在重复路径，回滚可能会失败
 */
async function down(db) {
  // 1. 创建临时表，恢复 path 字段的唯一约束
  await db.schema
    .createTable('files_temp')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('origin_name', 'text', (col) => col.notNull())
    .addColumn('path', 'text', (col) => col.notNull().unique()) // 恢复唯一约束
    .addColumn('size', 'integer', (col) => col.notNull())
    .addColumn('ext', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .execute()

  // 2. 复制数据（如果有重复路径，这一步会失败）
  await db
    .insertInto('files_temp')
    .columns(['id', 'name', 'origin_name', 'path', 'size', 'ext', 'type', 'created_at'])
    .expression(
      db
        .selectFrom('files')
        .select(['id', 'name', 'origin_name', 'path', 'size', 'ext', 'type', 'created_at'])
    )
    .execute()

  // 3. 删除当前表
  await db.schema.dropTable('files').execute()

  // 4. 重命名临时表
  await db.schema.alterTable('files_temp').renameTo('files').execute()

  // 5. 重建索引（包括原有的所有索引）
  await db.schema.createIndex('idx_files_name').on('files').column('name').execute()
  await db.schema.createIndex('idx_files_type').on('files').column('type').execute()
  await db.schema.createIndex('idx_files_created_at').on('files').column('created_at').execute()
  await db.schema.createIndex('idx_files_ext').on('files').column('ext').execute()
}

module.exports = { up, down }
