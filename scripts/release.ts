#!/usr/bin/env node

/**
 * 自动化发布脚本 / Automated Release Script
 *
 * 功能 / Features:
 * 1. 检查当前版本状态 / Check current version status
 * 2. 提示用户选择版本类型 / Prompt user to select version type
 * 3. 自动更新版本号 / Automatically update version number
 * 4. 构建项目 / Build project
 * 5. 创建 Git 标签 / Create Git tag
 * 6. 发布应用 / Publish application
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
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

function execCommand(command: string, description: string): void {
  console.log(`\n🔄 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} 完成`)
  } catch {
    console.error(`❌ ${description} 失败`)
    process.exit(1)
  }
}

function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function selectVersionType(): Promise<string> {
  console.log('\n📦 请选择版本类型 / Please select version type:')
  console.log('1. patch - 补丁版本 (0.2.0 -> 0.2.1)')
  console.log('2. minor - 次版本 (0.2.0 -> 0.3.0)')
  console.log('3. major - 主版本 (0.2.0 -> 1.0.0)')
  console.log('4. prerelease - 预发布递增 (0.2.0-alpha.2 -> 0.2.0-alpha.3)')
  console.log('5. beta - Beta 版本')
  console.log('6. beta-patch - Beta 补丁版本')
  console.log('7. custom - 自定义版本号')

  const choice = await promptUser('请输入选择 (1-7): ')

  switch (choice) {
    case '1':
      return 'patch'
    case '2':
      return 'minor'
    case '3':
      return 'major'
    case '4':
      return 'prerelease'
    case '5':
      return 'beta'
    case '6':
      return 'beta-patch'
    case '7': {
      const customVersion = await promptUser('请输入自定义版本号 (例如: 1.0.0 或 1.0.0-beta.1): ')
      return `custom:${customVersion}`
    }
    default: {
      console.log('无效选择，使用默认的 patch 版本')
      return 'patch'
    }
  }
}

async function confirmRelease(currentVersion: string, newVersion: string): Promise<boolean> {
  console.log(`\n📋 发布信息 / Release Information:`)
  console.log(`当前版本 / Current Version: ${currentVersion}`)
  console.log(`新版本 / New Version: ${newVersion}`)

  const confirm = await promptUser('\n确认发布? (y/N): ')
  return confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes'
}

async function selectReleaseChannel(): Promise<string> {
  console.log('\n🚀 请选择发布渠道 / Please select release channel:')
  console.log('1. draft - 草稿发布 (推荐)')
  console.log('2. onTagOrDraft - 标签或草稿发布')
  console.log('3. always - 总是发布')
  console.log('4. never - 仅构建不发布')

  const choice = await promptUser('请输入选择 (1-4): ')

  switch (choice) {
    case '1':
      return 'release:draft'
    case '2':
      return 'release'
    case '3':
      return 'release:all'
    case '4':
      return 'release:never'
    default: {
      console.log('无效选择，使用默认的草稿发布')
      return 'release:draft'
    }
  }
}

async function main(): Promise<void> {
  console.log('🎯 EchoLab 自动化发布工具 / Automated Release Tool')
  console.log('=====================================')

  // 检查当前版本 / Check current version
  const packageData = readPackageJson()
  const currentVersion = packageData.version
  console.log(`\n📍 当前版本 / Current Version: ${currentVersion}`)

  // 检查 Git 状态 / Check Git status
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
    if (gitStatus.trim()) {
      console.log('\n⚠️  检测到未提交的更改 / Uncommitted changes detected:')
      console.log(gitStatus)
      const proceed = await promptUser('是否继续发布? (y/N): ')
      if (proceed.toLowerCase() !== 'y') {
        console.log('发布已取消')
        process.exit(0)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.log('⚠️  无法检查 Git 状态，继续执行...')
  }

  // 选择版本类型 / Select version type
  const versionChoice = await selectVersionType()

  // 更新版本号 / Update version number
  let newVersion: string
  if (versionChoice.startsWith('custom:')) {
    const customVersion = versionChoice.replace('custom:', '')
    execCommand(`npm run version:set -- ${customVersion}`, '设置自定义版本')
    newVersion = customVersion
  } else {
    execCommand(`npm run version:${versionChoice}`, '更新版本号')
    const updatedPackageData = readPackageJson()
    newVersion = updatedPackageData.version
  }

  // 确认发布 / Confirm release
  const shouldRelease = await confirmRelease(currentVersion, newVersion)
  if (!shouldRelease) {
    console.log('发布已取消')
    process.exit(0)
  }

  // 运行测试 / Run tests
  const runTests = await promptUser('\n是否运行测试? (Y/n): ')
  if (runTests.toLowerCase() !== 'n' && runTests.toLowerCase() !== 'no') {
    execCommand('npm run test:run', '运行单元测试')
    execCommand('npm run lint', '代码检查')
    execCommand('npm run typecheck', '类型检查')
  }

  // 选择发布渠道 / Select release channel
  const releaseChannel = await selectReleaseChannel()

  // 提交版本更改 / Commit version changes
  try {
    execCommand(`git add package.json`, '添加版本文件到 Git')
    execCommand(`git commit -m "chore: release v${newVersion}"`, '提交版本更改')
    execCommand(`git tag v${newVersion}`, '创建 Git 标签')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.log('⚠️  Git 操作可能失败，继续构建...')
  }

  // 构建和发布 / Build and release
  execCommand(`npm run ${releaseChannel}`, '构建和发布应用')

  console.log('\n🎉 发布完成! / Release completed!')
  console.log(`✅ 版本 ${newVersion} 已成功发布`)

  // 推送到远程仓库 / Push to remote repository
  const pushToRemote = await promptUser('\n是否推送到远程仓库? (Y/n): ')
  if (pushToRemote.toLowerCase() !== 'n' && pushToRemote.toLowerCase() !== 'no') {
    try {
      execCommand('git push origin main', '推送代码到远程仓库')
      execCommand('git push origin --tags', '推送标签到远程仓库')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('⚠️  推送失败，请手动推送')
    }
  }

  console.log('\n🏁 所有操作完成!')
}

// 处理未捕获的异常 / Handle uncaught exceptions
process.on('unhandledRejection', (error) => {
  console.error('❌ 发布过程中出现错误:', error)
  process.exit(1)
})

main().catch((error) => {
  console.error('❌ 发布失败:', error)
  process.exit(1)
})
