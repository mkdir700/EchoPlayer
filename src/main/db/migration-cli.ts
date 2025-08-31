#!/usr/bin/env node
/* eslint-disable no-restricted-syntax */

/**
 * 数据库迁移命令行工具
 * 用法:
 *   npm run migrate up              # 升级到最新版本
 *   npm run migrate down            # 回退一个版本
 *   npm run migrate down <version>  # 回退到指定版本
 *   npm run migrate status          # 查看迁移状态
 *   npm run migrate create <name>   # 创建新的迁移文件
 *   npm run migrate validate        # 验证迁移文件
 */

import { app } from 'electron'

import {
  createMigration,
  downgradeDatabase,
  getMigrationStatus,
  upgradeDatabase,
  validateMigrations
} from './migrate'

// 如果在主进程中运行，需要准备 app
if (!app.isReady()) {
  app.whenReady().then(main).catch(console.error)
} else {
  main().catch(console.error)
}

/**
 * Entry point for the migration CLI: parses command-line arguments and dispatches to the appropriate migration handlers.
 *
 * Supported commands: `up|upgrade`, `down|downgrade [targetVersion]`, `status`, `create <name>`, `validate`, and `help`.
 * On unknown commands or on handler errors this function writes an error to stderr and terminates the process with exit code 1.
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case 'up':
      case 'upgrade':
        await handleUpgrade()
        break

      case 'down':
      case 'downgrade':
        await handleDowngrade(args[1])
        break

      case 'status':
        await handleStatus()
        break

      case 'create':
        await handleCreate(args[1])
        break

      case 'validate':
        await handleValidate()
        break

      case 'help':
      case '--help':
      case '-h':
        printHelp()
        break

      default:
        console.error(`Unknown command: ${command}`)
        printHelp()
        process.exit(1)
    }
  } catch (error) {
    console.error('Migration command failed:', error)
    process.exit(1)
  }
}

/**
 * Upgrade the database to the latest migration and print a concise summary to stdout.
 *
 * Calls `upgradeDatabase()` and logs a start message. If migrations were applied, prints
 * a success header and the names of each successfully executed migration; otherwise logs
 * that the database is already up to date.
 *
 * @returns A promise that resolves when the upgrade operation and its console output complete.
 */
async function handleUpgrade() {
  console.log('🔄 Upgrading database to latest version...')
  const result = await upgradeDatabase()

  if (result.results && result.results.length > 0) {
    console.log('✅ Database upgrade completed successfully:')
    for (const migration of result.results) {
      if (migration.status === 'Success') {
        console.log(`  • ${migration.migrationName}`)
      }
    }
  } else {
    console.log('ℹ️  Database is already up to date')
  }
}

/**
 * Downgrades the database either to a specific migration version or by a single step.
 *
 * If `targetVersion` is provided, attempts to downgrade to that version; otherwise downgrades one migration.
 * Prints a summary of rolled-back migrations (only those with status `'Success'`) or a notice when there are none.
 *
 * @param targetVersion - Optional migration version identifier to downgrade to; omit to step back one migration.
 */
async function handleDowngrade(targetVersion?: string) {
  if (targetVersion) {
    console.log(`🔄 Downgrading database to version: ${targetVersion}`)
  } else {
    console.log('🔄 Downgrading database by one version...')
  }

  const result = await downgradeDatabase(targetVersion)

  if (result.results && result.results.length > 0) {
    console.log('✅ Database downgrade completed successfully:')
    for (const migration of result.results) {
      if (migration.status === 'Success') {
        console.log(`  • Rolled back: ${migration.migrationName}`)
      }
    }
  } else {
    console.log('ℹ️  No migrations to rollback')
  }
}

/**
 * Print the current migration status to stdout.
 *
 * Fetches executed and pending migrations via `getMigrationStatus()` and writes a human-readable
 * summary to the console. Executed migrations include their execution timestamp (ISO 8601) when available;
 * pending migrations list only their names.
 *
 * Side effects:
 * - Writes output to `console.log`.
 */
async function handleStatus() {
  console.log('📊 Database Migration Status:')
  const status = await getMigrationStatus()

  console.log(`\n✅ Executed Migrations (${status.executed.length}):`)
  if (status.executed.length === 0) {
    console.log('  (none)')
  } else {
    for (const migration of status.executed) {
      const executedAt = migration.executedAt
        ? new Date(migration.executedAt).toISOString()
        : 'unknown'
      console.log(`  • ${migration.name} (executed at: ${executedAt})`)
    }
  }

  console.log(`\n⏳ Pending Migrations (${status.pending.length}):`)
  if (status.pending.length === 0) {
    console.log('  (none)')
  } else {
    for (const migration of status.pending) {
      console.log(`  • ${migration.name}`)
    }
  }
}

/**
 * Create a new migration file with the given name and prompt the user to implement its up/down functions.
 *
 * If `name` is not provided, logs an error and exits the process with code 1.
 *
 * Side effects:
 * - Calls `createMigration(name)` to generate the migration file on disk.
 * - Writes user-facing messages to stdout/stderr and may call `process.exit`.
 *
 * @param name - The migration identifier used to generate the file name (typically appended to an ISO-8601 timestamp)
 */
async function handleCreate(name?: string) {
  if (!name) {
    console.error('❌ Migration name is required')
    console.log('Usage: npm run migrate create <migration-name>')
    process.exit(1)
  }

  console.log(`📝 Creating new migration: ${name}`)
  const filepath = createMigration(name)
  console.log(`✅ Migration file created: ${filepath}`)
  console.log('\n📝 Please edit the migration file to add your schema changes:')
  console.log(`  • Implement the up() function for schema changes`)
  console.log(`  • Implement the down() function to reverse the changes`)
}

/**
 * Validate migration files and terminate the process on failure.
 *
 * Calls `validateMigrations()` and prints a success message when validation passes.
 * If validation fails, prints an error and exits the process with code `1`.
 *
 * @returns A promise that resolves when validation completes (or does not return if the process exits).
 */
async function handleValidate() {
  console.log('🔍 Validating migration files...')
  const isValid = await validateMigrations()

  if (isValid) {
    console.log('✅ All migration files are valid')
  } else {
    console.error('❌ Migration validation failed')
    process.exit(1)
  }
}

/**
 * Print the CLI usage help text for the database migration tool to stdout.
 *
 * The help includes available commands, examples, migration filename conventions,
 * and a reference link to additional migration documentation.
 */
function printHelp() {
  console.log(`
🗃️  Database Migration Tool

Usage:
  npm run migrate <command> [options]

Commands:
  up, upgrade              Upgrade database to latest version
  down, downgrade [name]   Downgrade database (one version or to specific version)
  status                   Show migration status
  create <name>           Create new migration file
  validate                Validate all migration files
  help                    Show this help message

Examples:
  npm run migrate up                    # Upgrade to latest
  npm run migrate down                  # Rollback one version
  npm run migrate down init             # Rollback to 'init' migration
  npm run migrate create add-user-table # Create new migration
  npm run migrate status                # Check current status

Migration File Naming:
  Files are named with ISO 8601 timestamps for proper ordering:
  2024-01-01T00-00-00-000Z_description.ts

For more information, see: https://kysely.dev/docs/migrations
`)
}
