import fs from 'node:fs'
import path from 'node:path'

import type { Database as BetterSqlite3Database } from 'better-sqlite3'
import Database from 'better-sqlite3'
import { app } from 'electron'
import { Kysely, SqliteDialect } from 'kysely'
import type { DB } from 'packages/shared/schema'

let _sqlite: BetterSqlite3Database | null = null
let _kysely: Kysely<DB> | null = null

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

function ensureDirs() {
  const { dbDir, backupDir } = getDbPaths()
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
}

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

export function getKysely() {
  if (!_kysely) return openDatabase()
  return _kysely
}

export function closeDatabase() {
  _kysely?.destroy()
  _kysely = null
  _sqlite?.close()
  _sqlite = null
}
