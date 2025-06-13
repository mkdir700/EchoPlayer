#!/usr/bin/env node

/**
 * 构建产物验证脚本 / Build Artifacts Verification Script
 *
 * 功能 / Features:
 * 1. 验证构建产物是否存在 / Verify build artifacts exist
 * 2. 检查文件大小和完整性 / Check file size and integrity
 * 3. 输出构建结果摘要 / Output build results summary
 * 4. 验证自动更新文件 / Verify auto-update files
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// 项目根目录 / Project root directory
const PROJECT_ROOT = path.join(process.cwd())
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json')

interface PackageJson {
  version: string
  productName?: string
  [key: string]: unknown
}

interface FileInfo {
  name: string
  path: string
  size: number
  exists: boolean
  sha256?: string
}

interface VerificationResult {
  platform: string
  arch: string
  version: string
  productName: string
  files: FileInfo[]
  totalFiles: number
  existingFiles: number
  totalSize: number
  success: boolean
}

/**
 * 读取 package.json 获取版本信息 / Read package.json to get version info
 */
function getPackageInfo(): { version: string; productName: string } {
  try {
    const packageJson: PackageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'))
    return {
      version: packageJson.version,
      productName: packageJson.productName || 'echolab'
    }
  } catch (error) {
    console.error('❌ 无法读取 package.json:', error)
    process.exit(1)
  }
}

/**
 * 获取平台和架构信息 / Get platform and architecture info
 */
function getPlatformInfo(): { platform: string; arch: string } {
  // 优先使用 GitHub Actions 矩阵变量 / Prefer GitHub Actions matrix variables
  const buildPlatform = process.env.BUILD_PLATFORM
  const buildArch = process.env.BUILD_ARCH

  if (buildPlatform && buildArch) {
    console.log(`🎯 使用 GitHub Actions 矩阵配置: ${buildPlatform}-${buildArch}`)
    return {
      platform: buildPlatform,
      arch: buildArch
    }
  }

  // 回退到系统检测 / Fallback to system detection
  const platform = process.env.RUNNER_OS?.toLowerCase() || process.platform
  const arch = process.env.RUNNER_ARCH || process.arch

  // 标准化平台名称 / Normalize platform names
  const normalizedPlatform =
    platform === 'windows' || platform === 'win32'
      ? 'win'
      : platform === 'macos' || platform === 'darwin'
        ? 'mac'
        : platform === 'linux'
          ? 'linux'
          : platform

  // 标准化架构名称 / Normalize architecture names
  const normalizedArch =
    arch === 'x64' ? 'x64' : arch === 'arm64' ? 'arm64' : arch === 'x86_64' ? 'x64' : arch

  console.log(`🔍 使用系统检测: ${normalizedPlatform}-${normalizedArch}`)
  return {
    platform: normalizedPlatform,
    arch: normalizedArch
  }
}

/**
 * 计算文件 SHA256 哈希值 / Calculate file SHA256 hash
 */
function calculateFileHash(filePath: string): string | undefined {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  } catch (error) {
    console.error(`❌ 无法计算文件哈希值: ${filePath}`, error)
    return undefined
  }
}

/**
 * 获取文件信息 / Get file information
 */
function getFileInfo(fileName: string): FileInfo {
  const filePath = path.join(DIST_DIR, fileName)
  const exists = fs.existsSync(filePath)

  let size = 0
  let sha256: string | undefined

  if (exists) {
    try {
      const stats = fs.statSync(filePath)
      size = stats.size
      sha256 = calculateFileHash(filePath)
    } catch (error) {
      console.error(`❌ 无法获取文件信息: ${fileName}`, error)
    }
  }

  return {
    name: fileName,
    path: filePath,
    size,
    exists,
    sha256
  }
}

/**
 * 格式化文件大小 / Format file size
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 验证 Windows 构建产物 / Verify Windows build artifacts
 */
function verifyWindowsArtifacts(version: string, productName: string, arch: string): FileInfo[] {
  const expectedFiles = [`${productName}-${version}-${arch}-setup.exe`, 'latest.yml']

  return expectedFiles.map((fileName) => getFileInfo(fileName))
}

/**
 * 验证 macOS 构建产物 / Verify macOS build artifacts
 */
function verifyMacOSArtifacts(version: string, productName: string, arch: string): FileInfo[] {
  const expectedFiles = [
    `${productName}-${version}-${arch}.dmg`,
    `${productName}-${version}-${arch}.zip`,
    'latest-mac.yml'
  ]

  return expectedFiles.map((fileName) => getFileInfo(fileName))
}

/**
 * 验证 Linux 构建产物 / Verify Linux build artifacts
 */
function verifyLinuxArtifacts(version: string, productName: string): FileInfo[] {
  const expectedFiles = [
    `${productName}-${version}-amd64.AppImage`,
    `${productName}-${version}-amd64.deb`,
    'latest-linux.yml'
  ]

  return expectedFiles.map((fileName) => getFileInfo(fileName))
}

/**
 * 输出验证结果 / Output verification results
 */
function outputResults(result: VerificationResult): void {
  console.log('\n📊 构建产物验证结果 / Build Artifacts Verification Results')
  console.log('='.repeat(60))

  console.log(`📦 产品名称 / Product Name: ${result.productName}`)
  console.log(`🏷️  版本号 / Version: ${result.version}`)
  console.log(`💻 平台 / Platform: ${result.platform}`)
  console.log(`🏗️  架构 / Architecture: ${result.arch}`)
  console.log(`📁 总文件数 / Total Files: ${result.totalFiles}`)
  console.log(`✅ 存在文件数 / Existing Files: ${result.existingFiles}`)
  console.log(`📏 总大小 / Total Size: ${formatFileSize(result.totalSize)}`)

  console.log('\n📋 文件详情 / File Details:')
  console.log('-'.repeat(80))

  result.files.forEach((file) => {
    const status = file.exists ? '✅' : '❌'
    const size = file.exists ? formatFileSize(file.size) : 'N/A'
    const hash = file.sha256 ? file.sha256.substring(0, 16) + '...' : 'N/A'

    console.log(`${status} ${file.name}`)
    console.log(`   📏 大小 / Size: ${size}`)
    console.log(`   🔐 SHA256: ${hash}`)
    console.log()
  })

  // 输出总结 / Output summary
  if (result.success) {
    console.log('🎉 构建产物验证成功! / Build artifacts verification successful!')
    console.log('✅ 所有预期文件都已生成 / All expected files have been generated')
  } else {
    console.log('⚠️  构建产物验证失败! / Build artifacts verification failed!')
    console.log('❌ 部分预期文件缺失 / Some expected files are missing')
  }
}

/**
 * 列出所有 dist 目录中的文件 / List all files in dist directory
 */
function listAllDistFiles(): void {
  try {
    console.log('\n📁 dist 目录中的所有文件 / All files in dist directory:')
    console.log('-'.repeat(60))

    const files = fs.readdirSync(DIST_DIR, { recursive: true })
    files.forEach((file) => {
      const filePath = path.join(DIST_DIR, file.toString())
      const stats = fs.statSync(filePath)

      if (stats.isFile()) {
        const size = formatFileSize(stats.size)
        console.log(`📄 ${file} (${size})`)
      } else if (stats.isDirectory()) {
        console.log(`📁 ${file}/`)
      }
    })
  } catch (error) {
    console.error('❌ 无法列出 dist 目录文件:', error)
  }
}

/**
 * 主函数 / Main function
 */
async function main(): Promise<void> {
  console.log('🔍 开始验证构建产物...')
  console.log('🔍 Starting to verify build artifacts...')

  // 检查 dist 目录是否存在 / Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist 目录不存在，请先运行构建命令')
    process.exit(1)
  }

  // 获取项目信息 / Get project info
  const { version, productName } = getPackageInfo()
  const { platform, arch } = getPlatformInfo()

  // 列出所有文件 / List all files
  listAllDistFiles()

  let files: FileInfo[] = []

  // 根据平台验证构建产物 / Verify build artifacts based on platform
  switch (platform) {
    case 'win':
    case 'windows':
      files = verifyWindowsArtifacts(version, productName, arch)
      break

    case 'mac':
    case 'macos':
    case 'darwin':
      files = verifyMacOSArtifacts(version, productName, arch)
      break

    case 'linux':
      files = verifyLinuxArtifacts(version, productName)
      break

    default:
      console.log(`⚠️  未知平台: ${platform}，跳过验证`)
      process.exit(0)
  }

  // 计算统计信息 / Calculate statistics
  const existingFiles = files.filter((file) => file.exists).length
  const totalSize = files.reduce((sum, file) => sum + (file.exists ? file.size : 0), 0)
  const success = existingFiles === files.length && existingFiles > 0

  // 创建验证结果 / Create verification result
  const result: VerificationResult = {
    platform,
    arch,
    version,
    productName,
    files,
    totalFiles: files.length,
    existingFiles,
    totalSize,
    success
  }

  // 输出结果 / Output results
  outputResults(result)

  // 根据验证结果设置退出码 / Set exit code based on verification result
  if (!success) {
    process.exit(1)
  }
}

// 运行主函数 / Run main function
main().catch((error) => {
  console.error('❌ 验证过程中出现错误:', error)
  process.exit(1)
})
