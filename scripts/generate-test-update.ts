#!/usr/bin/env tsx

/**
 * 生成测试更新数据 - 创建用于本地测试的更新manifest文件和模拟安装包
 * Generate Test Update Data - Create update manifest files and mock installers for local testing
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// 配置 / Configuration
const UPDATE_DATA_DIR = path.join(__dirname, '..', 'dev-update-data')
const CURRENT_VERSION = '0.2.0-alpha.3' // 从package.json读取当前版本
const TEST_VERSION = '0.2.0-alpha.4' // 测试用的新版本

// 支持的更新渠道 / Supported update channels
const SUPPORTED_CHANNELS = ['stable', 'beta', 'alpha', 'dev'] as const
type UpdateChannel = (typeof SUPPORTED_CHANNELS)[number]

// 根据版本确定渠道 / Determine channel based on version
function getChannelFromVersion(version: string): UpdateChannel {
  if (version.includes('dev')) return 'dev'
  if (version.includes('alpha')) return 'alpha'
  if (version.includes('beta')) return 'beta'
  return 'stable'
}

// 更新信息接口 / Update info interface
interface UpdateManifest {
  version: string
  files: Array<{
    url: string
    sha512: string
    size: number
  }>
  path: string
  sha512: string
  releaseDate: string
  releaseNotes?: string
}

// 平台配置 / Platform configuration
interface PlatformConfig {
  name: string
  manifestFile: string
  installerFile: string
  installerSize: number
}

const PLATFORMS: PlatformConfig[] = [
  {
    name: 'macOS',
    manifestFile: `${getChannelFromVersion(TEST_VERSION)}-mac.yml`,
    installerFile: `echolab-${TEST_VERSION}-mac.dmg`,
    installerSize: 150 * 1024 * 1024 // 150MB
  },
  {
    name: 'Windows',
    manifestFile: `${getChannelFromVersion(TEST_VERSION)}.yml`,
    installerFile: `echolab-${TEST_VERSION}-setup.exe`,
    installerSize: 120 * 1024 * 1024 // 120MB
  },
  {
    name: 'Linux',
    manifestFile: `${getChannelFromVersion(TEST_VERSION)}-linux.yml`,
    installerFile: `echolab-${TEST_VERSION}.AppImage`,
    installerSize: 140 * 1024 * 1024 // 140MB
  }
]

// // 生成随机SHA512哈希 / Generate random SHA512 hash
// function generateRandomSHA512(): string {
//   return crypto.randomBytes(64).toString('hex')
// }

// 创建模拟安装包文件 / Create mock installer file
function createMockInstaller(filePath: string, size: number): void {
  const buffer = Buffer.alloc(size, 0)
  // 写入一些标识信息到文件开头 / Write some identification info to the beginning
  const header = `EchoLab Test Installer v${TEST_VERSION} - Generated at ${new Date().toISOString()}`
  buffer.write(header, 0, 'utf8')

  fs.writeFileSync(filePath, buffer)
  console.log(
    `📦 创建模拟安装包: ${path.basename(filePath)} (${(size / 1024 / 1024).toFixed(1)} MB)`
  )
}

// 生成更新manifest文件 / Generate update manifest file
function generateManifest(platform: PlatformConfig, channel: UpdateChannel): void {
  // 确保渠道目录存在 / Ensure channel directory exists
  const channelDir = UPDATE_DATA_DIR
  if (!fs.existsSync(channelDir)) {
    fs.mkdirSync(channelDir, { recursive: true })
  }

  const installerPath = path.join(channelDir, platform.installerFile)
  const manifestPath = path.join(channelDir, platform.manifestFile)

  // 创建模拟安装包 / Create mock installer
  createMockInstaller(installerPath, platform.installerSize)

  // 计算文件的实际SHA512 / Calculate actual SHA512 of the file
  const fileBuffer = fs.readFileSync(installerPath)
  const sha512 = crypto.createHash('sha512').update(fileBuffer).digest('base64')

  // 创建manifest数据 / Create manifest data
  const manifest: UpdateManifest = {
    version: TEST_VERSION,
    files: [
      {
        url: platform.installerFile,
        sha512,
        size: platform.installerSize
      }
    ],
    path: platform.installerFile,
    sha512,
    releaseDate: new Date().toISOString(),
    releaseNotes: generateReleaseNotes()
  }

  // 将manifest转换为YAML格式 / Convert manifest to YAML format
  const yamlContent = convertToYAML(manifest)

  // 写入manifest文件 / Write manifest file
  fs.writeFileSync(manifestPath, yamlContent, 'utf8')
  console.log(`📄 创建manifest文件: ${channel}/${platform.manifestFile}`)
}

// 生成发布说明 / Generate release notes
function generateReleaseNotes(): string {
  return `# EchoLab ${TEST_VERSION} 测试版本

## 🆕 新功能 / New Features
- 测试自动更新功能 / Test auto-update functionality
- 改进用户界面响应性 / Improved UI responsiveness
- 新增本地更新服务器支持 / Added local update server support

## 🐛 修复问题 / Bug Fixes
- 修复播放器偶尔卡顿的问题 / Fixed occasional player stuttering
- 优化内存使用 / Optimized memory usage
- 修复设置页面的显示问题 / Fixed settings page display issues

## 🔧 技术改进 / Technical Improvements
- 升级依赖包版本 / Updated dependency versions
- 改进错误处理机制 / Improved error handling
- 优化构建流程 / Optimized build process

---
**注意**: 这是一个测试版本，仅用于开发环境测试自动更新功能。
**Note**: This is a test version for development environment auto-update testing only.`
}

// 简单的YAML转换器 / Simple YAML converter
function convertToYAML(obj: UpdateManifest): string {
  const lines: string[] = []

  lines.push(`version: ${obj.version}`)
  lines.push(`files:`)

  obj.files.forEach((file) => {
    lines.push(`  - url: ${file.url}`)
    lines.push(`    sha512: ${file.sha512}`)
    lines.push(`    size: ${file.size}`)
  })

  lines.push(`path: ${obj.path}`)
  lines.push(`sha512: ${obj.sha512}`)
  lines.push(`releaseDate: '${obj.releaseDate}'`)

  if (obj.releaseNotes) {
    // 处理多行发布说明 / Handle multi-line release notes
    const releaseNotesLines = obj.releaseNotes.split('\n')
    lines.push(`releaseNotes: |`)
    releaseNotesLines.forEach((line) => {
      lines.push(`  ${line}`)
    })
  }

  return lines.join('\n')
}

// 主函数 / Main function
function main(): void {
  console.log(`🚀 开始生成测试更新数据...`)
  console.log(`📍 当前版本: ${CURRENT_VERSION}`)
  console.log(`📍 测试版本: ${TEST_VERSION}`)
  console.log(`📁 输出目录: ${UPDATE_DATA_DIR}`)

  // 确保输出目录存在 / Ensure output directory exists
  if (!fs.existsSync(UPDATE_DATA_DIR)) {
    fs.mkdirSync(UPDATE_DATA_DIR, { recursive: true })
    console.log(`📁 创建输出目录: ${UPDATE_DATA_DIR}`)
  }

  // 清理旧文件 / Clean old files
  if (fs.existsSync(UPDATE_DATA_DIR)) {
    const existingItems = fs.readdirSync(UPDATE_DATA_DIR)
    existingItems.forEach((item) => {
      const itemPath = path.join(UPDATE_DATA_DIR, item)
      const stats = fs.statSync(itemPath)
      if (stats.isDirectory()) {
        // 递归删除目录 / Recursively delete directory
        fs.rmSync(itemPath, { recursive: true, force: true })
        console.log(`🗑️  删除旧目录: ${item}`)
      } else {
        fs.unlinkSync(itemPath)
        console.log(`🗑️  删除旧文件: ${item}`)
      }
    })
  }

  // 确保各渠道目录存在 / Ensure channel directories exist
  SUPPORTED_CHANNELS.forEach((channel) => {
    const channelDir = path.join(UPDATE_DATA_DIR, channel)
    if (!fs.existsSync(channelDir)) {
      fs.mkdirSync(channelDir, { recursive: true })
      console.log(`📁 创建渠道目录: ${channel}`)
    }
  })

  // 确定测试版本的渠道 / Determine channel for test version
  const testChannel = getChannelFromVersion(TEST_VERSION)
  console.log(`📦 测试版本渠道: ${testChannel}`)

  // 为测试渠道的每个平台生成文件 / Generate files for each platform in test channel
  PLATFORMS.forEach((platform) => {
    console.log(`\n📱 生成 ${platform.name} 平台文件 (${testChannel} 渠道)...`)
    generateManifest(platform, testChannel)
  })

  console.log(`\n✅ 测试更新数据生成完成！`)
  console.log(`💡 现在可以启动更新服务器: npm run dev:update-server`)
  console.log(`💡 然后启动开发模式应用: npm run dev`)
  console.log(`💡 在应用中测试更新检查功能`)
  console.log(`💡 更新URL格式: http://localhost:8384/${testChannel}/latest-{platform}.yml`)

  // 显示生成的文件列表 / Show generated files list
  console.log(`\n📋 生成的文件列表:`)
  SUPPORTED_CHANNELS.forEach((channel) => {
    const channelDir = path.join(UPDATE_DATA_DIR, channel)
    if (fs.existsSync(channelDir)) {
      const files = fs.readdirSync(channelDir)
      if (files.length > 0) {
        console.log(`\n  � ${channel.toUpperCase()} 渠道:`)
        files.forEach((file) => {
          const filePath = path.join(channelDir, file)
          const stats = fs.statSync(filePath)
          const sizeInMB = (stats.size / 1024 / 1024).toFixed(1)
          console.log(`     - ${file} (${sizeInMB} MB)`)
        })
      }
    }
  })
}

// 运行主函数 / Run main function
if (require.main === module) {
  main()
}
