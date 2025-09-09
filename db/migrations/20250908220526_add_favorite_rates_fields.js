const { sql } = require('kysely')

/**
 * Migration: Add favorite rates field to player settings
 *
 * Adds the following field to the playerSettings table:
 * - favoriteRates: JSON string containing array of favorite playback rates
 *
 * Note: currentFavoriteIndex is a runtime state and doesn't need to be persisted
 *
 * This field supports the favorite playback rates feature that allows users to:
 * 1. Configure default favorite rates in global settings
 * 2. Customize favorite rates per video (persisted)
 * 3. Cycle through favorite rates with mouse clicks and keyboard shortcuts (runtime)
 */
async function up(db) {
  // Add favoriteRates column (JSON string)
  await db.schema
    .alterTable('playerSettings')
    .addColumn('favoriteRates', 'text', (col) =>
      col.notNull().defaultTo(JSON.stringify([0.75, 1.0, 1.25, 1.5]))
    )
    .execute()

  console.log('✅ Added favoriteRates field to playerSettings table')
}

/**
 * Rollback: Remove favorite rates field from player settings
 */
async function down(db) {
  // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
  // 1. Create temporary table without the favoriteRates column
  await db.schema
    .createTable('playerSettings_temp')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('videoId', 'integer', (col) =>
      col.notNull().references('videoLibrary.id').onDelete('cascade')
    )
    .addColumn('playbackRate', 'real', (col) => col.notNull().defaultTo(1.0))
    .addColumn('volume', 'real', (col) => col.notNull().defaultTo(1.0))
    .addColumn('muted', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('loopSettings', 'text')
    .addColumn('autoPauseSettings', 'text')
    .addColumn('subtitleOverlaySettings', 'text')
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .addColumn('updated_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .execute()

  // 2. Copy existing data (excluding the favoriteRates column)
  await db
    .insertInto('playerSettings_temp')
    .columns([
      'id',
      'videoId',
      'playbackRate',
      'volume',
      'muted',
      'loopSettings',
      'autoPauseSettings',
      'subtitleOverlaySettings',
      'created_at',
      'updated_at'
    ])
    .expression(
      db
        .selectFrom('playerSettings')
        .select([
          'id',
          'videoId',
          'playbackRate',
          'volume',
          'muted',
          'loopSettings',
          'autoPauseSettings',
          'subtitleOverlaySettings',
          'created_at',
          'updated_at'
        ])
    )
    .execute()

  // 3. Drop original table
  await db.schema.dropTable('playerSettings').execute()

  // 4. Rename temporary table
  await db.schema.alterTable('playerSettings_temp').renameTo('playerSettings').execute()

  // 5. Recreate original indices
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

  await db.schema
    .createIndex('idx_playerSettings_videoId_unique')
    .ifNotExists()
    .on('playerSettings')
    .column('videoId')
    .unique()
    .execute()

  console.log('✅ Removed favoriteRates field from playerSettings table')
}

module.exports = { up, down }
