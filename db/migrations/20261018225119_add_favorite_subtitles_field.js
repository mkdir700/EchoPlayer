/**
 * Migration: Add favoriteSubtitles field to player settings
 *
 * Adds the following field to the playerSettings table:
 * - favoriteSubtitles: JSON string containing array of favorited subtitle cue snapshots
 *
 * Each snapshot stores { id, startTime, endTime, originalText } so favorites remain
 * displayable and seekable even if subtitle file identity shifts slightly.
 */
async function up(db) {
  await db.schema
    .alterTable('playerSettings')
    .addColumn('favoriteSubtitles', 'text', (col) => col.notNull().defaultTo(JSON.stringify([])))
    .execute()

  console.log('✅ Added favoriteSubtitles field to playerSettings table')
}

/**
 * Rollback: Remove favoriteSubtitles field from player settings
 */
async function down(db) {
  const { sql } = require('kysely')

  await db.schema
    .createTable('playerSettings_temp')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('videoId', 'integer', (col) =>
      col.notNull().references('videoLibrary.id').onDelete('cascade')
    )
    .addColumn('playbackRate', 'real', (col) => col.notNull().defaultTo(1.0))
    .addColumn('favoriteRates', 'text', (col) =>
      col.notNull().defaultTo(JSON.stringify([0.75, 1.0, 1.25, 1.5]))
    )
    .addColumn('volume', 'real', (col) => col.notNull().defaultTo(1.0))
    .addColumn('muted', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('loopSettings', 'text')
    .addColumn('autoPauseSettings', 'text')
    .addColumn('subtitleOverlaySettings', 'text')
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .addColumn('updated_at', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
    .execute()

  await db
    .insertInto('playerSettings_temp')
    .columns([
      'id',
      'videoId',
      'playbackRate',
      'favoriteRates',
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
          'favoriteRates',
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

  await db.schema.dropTable('playerSettings').execute()
  await db.schema.alterTable('playerSettings_temp').renameTo('playerSettings').execute()

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

  console.log('✅ Removed favoriteSubtitles field from playerSettings table')
}

module.exports = { up, down }
