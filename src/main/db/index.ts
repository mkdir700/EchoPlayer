import fs from 'node:fs'
import path from 'node:path'

import type { Database as BetterSqlite3Database } from 'better-sqlite3'
import Database from 'better-sqlite3'
import { app } from 'electron'
import { Kysely, SqliteDialect } from 'kysely'
import type { DB } from 'packages/shared/schema'

let _sqlite: BetterSqlite3Database | null = null
let _kysely: Kysely<DB> | null = null

/**
 * Compute filesystem paths for the app's SQLite data storage and backup directory.
 *
 * Determines the user data directory via Electron's `app.getPath('userData')`, then
 * returns:
 * - `dbDir`: the data directory (<userData>/data)
 * - `dbFile`: the SQLite file path within `dbDir` — `app-dev.sqlite3` when `NODE_ENV === 'development'`, otherwise `app.sqlite3`
 * - `backupDir`: the backup directory within `dbDir` (<userData>/data/backup)
 *
 * @returns An object with `dbDir`, `dbFile`, and `backupDir` absolute paths.
 */
export function getDbPaths() {
  const userData = app.getPath('userData')
  const dbDir = path.join(userData, 'data')
  const dbFile = path.join(
    dbDir,
    process.env.NODE_ENV === 'development' ? 'app-dev.sqlite3' : 'app.sqlite3'
  )
  const backupDir = path.join(dbDir, 'backup')
  return { dbDir, dbFile, backupDir }
}

/**
 * Ensures the database data and backup directories exist, creating them if missing.
 *
 * Uses getDbPaths() to determine the data directory and backup directory and creates
 * each directory recursively when it does not already exist.
 */
function ensureDirs() {
  const { dbDir, backupDir } = getDbPaths()
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
}

/**
 * Open (or return) the singleton Kysely-backed SQLite database connection.
 *
 * Ensures required data directories exist, initializes a Better-SQLite3 Database
 * at the environment-specific file path, applies recommended PRAGMA settings
 * (WAL journal, synchronous normal, foreign keys ON, busy timeout, in-memory temp
 * store, ~16MB cache), and constructs a Kysely<DB> instance bound to that
 * connection. Subsequent calls return the same Kysely instance.
 *
 * Side effects: creates or overwrites module singletons `_sqlite` and `_kysely`
 * and may create the database file on disk.
 *
 * @returns The initialized singleton Kysely<DB> instance.
 */
export function openDatabase() {
  if (_kysely) return _kysely
  ensureDirs()
  const { dbFile } = getDbPaths()

  _sqlite = new Database(dbFile)

  // 性能 & 稳定性：PRAGMA
  _sqlite.pragma('journal_mode = WAL') // 并发 + 崩溃安全
  _sqlite.pragma('synchronous = normal') // dev 可用 FULL，prod 建议 NORMAL
  _sqlite.pragma('foreign_keys = ON')
  _sqlite.pragma('busy_timeout = 5000') // 防止数据库繁忙抛错
  _sqlite.pragma('temp_store = memory')
  _sqlite.pragma('cache_size = -16000') // 约 16MB page cache（负数表示 KB）

  _kysely = new Kysely<DB>({
    dialect: new SqliteDialect({ database: _sqlite })
  })
  return _kysely
}

/**
 * Returns the singleton Kysely database instance, initializing and opening the database if needed.
 *
 * @returns The shared Kysely<DB> instance.
 */
export function getKysely() {
  if (!_kysely) return openDatabase()
  return _kysely
}

/**
 * Closes and cleans up the module's database instances.
 *
 * Destroys the Kysely instance (if any), closes the underlying Better‑SQLite3 connection (if any),
 * and resets the internal singletons so the database can be reopened later. Safe to call multiple times.
 */
export function closeDatabase() {
  _kysely?.destroy()
  _kysely = null
  _sqlite?.close()
  _sqlite = null
}
