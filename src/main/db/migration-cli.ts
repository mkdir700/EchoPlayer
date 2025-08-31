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
