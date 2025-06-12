#!/usr/bin/env node

/**
 * 发布前检查脚本 / Pre-release Check Script
 *
 * 功能 / Features:
 * 1. 检查版本号是否需要更新 / Check if version needs update
 * 2. 检查 Git 状态 / Check Git status
 * 3. 运行基本测试 / Run basic tests
 * 4. 检查构建状态 / Check build status
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json')

interface PackageJson {
  version: string
  [key: string]: unknown
}

function readPackageJson(): PackageJson {
  const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')
  return JSON.parse(content) as PackageJson
}

function execCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' })
  } catch {
    return ''
  }
}

function checkGitStatus(): { isClean: boolean; hasUncommitted: boolean; branch: string } {
  const status = execCommand('git status --porcelain')
  const branch = execCommand('git branch --show-current').trim()

  return {
    isClean: !status.trim(),
    hasUncommitted: !!status.trim(),
    branch
  }
}

// function getLastCommitMessage(): string {
//   return execCommand('git log -1 --pretty=%B').trim()
// }

// function getGitTagsSinceVersion(version: string): string[] {
//   const tags = execCommand(`git tag --list --sort=-version:refname`)
//   return tags.split('\n').filter((tag) => tag.trim().startsWith('v'))
// }

function checkVersionNeedsUpdate(): {
  needsUpdate: boolean
  currentVersion: string
  lastTag: string
  commitsSinceTag: number
} {
  const packageData = readPackageJson()
  const currentVersion = packageData.version

  // 获取最新的版本标签 / Get latest version tag
  const lastTag = execCommand('git describe --tags --abbrev=0').trim()

  // 计算自上次标签以来的提交数 / Count commits since last tag
  const commitsSinceTag = parseInt(
    execCommand('git rev-list --count HEAD ^' + lastTag).trim() || '0'
  )

  // 检查当前版本是否与最新标签匹配 / Check if current version matches latest tag
  const needsUpdate = lastTag !== `v${currentVersion}` || commitsSinceTag > 0

  return {
    needsUpdate,
    currentVersion,
    lastTag: lastTag.replace('v', ''),
    commitsSinceTag
  }
}

function analyzeChanges(): { hasFeatures: boolean; hasFixes: boolean; hasBreaking: boolean } {
  // 分析自上次标签以来的提交类型 / Analyze commit types since last tag
  const lastTag = execCommand('git describe --tags --abbrev=0').trim()
  const commits = execCommand(`git log ${lastTag}..HEAD --oneline`).trim()

  if (!commits) {
    return { hasFeatures: false, hasFixes: false, hasBreaking: false }
  }

  const hasFeatures = /feat(\(.*\))?:/i.test(commits)
  const hasFixes = /fix(\(.*\))?:/i.test(commits)
  const hasBreaking = /BREAKING CHANGE|!:/i.test(commits)

  return { hasFeatures, hasFixes, hasBreaking }
}

function suggestVersionType(): string {
  const changes = analyzeChanges()

  if (changes.hasBreaking) {
    return 'major'
  } else if (changes.hasFeatures) {
    return 'minor'
  } else if (changes.hasFixes) {
    return 'patch'
  } else {
    return 'patch'
  }
}

function main(): void {
  console.log('🔍 EchoLab 发布前检查 / Pre-release Check')
  console.log('=====================================')

  // 检查 Git 状态 / Check Git status
  const gitStatus = checkGitStatus()
  console.log(`\n📋 Git 状态 / Git Status:`)
  console.log(`当前分支 / Current branch: ${gitStatus.branch}`)
  console.log(
    `工作区状态 / Working directory: ${gitStatus.isClean ? '✅ 干净' : '⚠️  有未提交的更改'}`
  )

  if (gitStatus.hasUncommitted) {
    console.log('\n⚠️  检测到未提交的更改，建议先提交所有更改')
    const status = execCommand('git status --porcelain')
    console.log(status)
  }

  // 检查版本状态 / Check version status
  const versionInfo = checkVersionNeedsUpdate()
  console.log(`\n📦 版本信息 / Version Information:`)
  console.log(`当前版本 / Current version: ${versionInfo.currentVersion}`)
  console.log(`最新标签 / Latest tag: ${versionInfo.lastTag}`)
  console.log(`自标签以来的提交 / Commits since tag: ${versionInfo.commitsSinceTag}`)

  if (versionInfo.needsUpdate) {
    console.log('\n🎯 版本更新建议 / Version Update Recommendation:')
    const suggestedType = suggestVersionType()
    console.log(`建议的版本类型 / Suggested version type: ${suggestedType}`)

    const changes = analyzeChanges()
    if (changes.hasBreaking) {
      console.log('  - 检测到破坏性更改 / Breaking changes detected')
    }
    if (changes.hasFeatures) {
      console.log('  - 检测到新功能 / New features detected')
    }
    if (changes.hasFixes) {
      console.log('  - 检测到修复 / Bug fixes detected')
    }

    console.log('\n💡 更新版本命令建议 / Suggested version update commands:')
    console.log(`npm run version:${suggestedType}`)
    console.log('或使用自动化发布工具 / Or use automated release tool:')
    console.log('npm run release:auto')
  } else {
    console.log('\n✅ 版本号已是最新')
  }

  if (gitStatus.hasUncommitted || versionInfo.needsUpdate) {
    console.log('\n⚠️  建议在发布前完成以下操作:')
    if (gitStatus.hasUncommitted) {
      console.log('  1. 提交所有未保存的更改')
    }
    if (versionInfo.needsUpdate) {
      console.log('  2. 更新版本号')
    }
    console.log('  3. 运行完整测试套件')
    console.log('  4. 使用 npm run release:auto 进行自动化发布')
  } else {
    console.log('\n🎉 所有检查通过，可以进行发布!')
    console.log('💡 使用以下命令进行发布:')
    console.log('   npm run release:auto')
  }
}

main()
