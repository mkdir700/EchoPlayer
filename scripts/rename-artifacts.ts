#!/usr/bin/env node

/**
 * 构建产物重命名脚本 / Build Artifacts Rename Script
 *
 * 功能 / Features:
 * 1. 重命名构建产物以符合发布要求 / Rename build artifacts to meet release requirements
 * 2. 处理不同平台的文件格式 / Handle different platform file formats
 * 3. 确保文件名一致性 / Ensure filename consistency
 * 4. 支持版本号和架构标识 / Support version and architecture identification
 */

import * as fs from 'fs'
import * as path from 'path'

// 项目根目录 / Project root directory
const PROJECT_ROOT = path.join(process.cwd())
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json')

interface PackageJson {
  version: string
  productName?: string
  [key: string]: unknown
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
 * 检查文件是否存在 / Check if file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

/**
 * 重命名文件 / Rename file
 */
function renameFile(oldPath: string, newPath: string): boolean {
  try {
    if (!fileExists(oldPath)) {
      console.log(`⚠️  源文件不存在: ${oldPath}`)
      return false
    }

    if (fileExists(newPath)) {
      console.log(`⚠️  目标文件已存在: ${newPath}`)
      return false
    }

    fs.renameSync(oldPath, newPath)
    console.log(`✅ 重命名成功: ${path.basename(oldPath)} -> ${path.basename(newPath)}`)
    return true
  } catch (error) {
    console.error(`❌ 重命名失败: ${oldPath} -> ${newPath}`, error)
    return false
  }
}

/**
 * 列出 dist 目录中的所有文件 / List all files in dist directory
 */
function listDistFiles(): string[] {
  try {
    const files = fs.readdirSync(DIST_DIR, { recursive: true })
    return files
      .filter(
        (file) => typeof file === 'string' && !fs.statSync(path.join(DIST_DIR, file)).isDirectory()
      )
      .map((file) => file.toString())
  } catch (error) {
    console.error('❌ 无法读取 dist 目录:', error)
    return []
  }
}

/**
 * 处理 Windows 构建产物 / Handle Windows build artifacts
 */
function handleWindowsArtifacts(version: string, productName: string, arch: string): number {
  let renamedCount = 0
  const files = listDistFiles()

  // 查找 Windows 安装程序 / Find Windows installer
  const setupPattern = /\.exe$/i
  const setupFiles = files.filter((file) => setupPattern.test(file))

  for (const file of setupFiles) {
    const oldPath = path.join(DIST_DIR, file)
    const expectedName = `${productName}-${version}-${arch}-setup.exe`
    const newPath = path.join(DIST_DIR, expectedName)

    if (path.basename(file) !== expectedName) {
      if (renameFile(oldPath, newPath)) {
        renamedCount++
      }
    } else {
      console.log(`✅ Windows 安装程序已是正确名称: ${file}`)
      renamedCount++
    }
  }

  // 更新 latest.yml 文件中的文件引用 / Update file references in latest.yml
  const latestYmlPath = path.join(DIST_DIR, 'latest.yml')
  if (fs.existsSync(latestYmlPath)) {
    try {
      let yamlContent = fs.readFileSync(latestYmlPath, 'utf8')
      let updated = false

      // 更新 EXE 文件引用 / Update EXE file references
      const oldExeName = `${productName}-${version}-setup.exe`
      const newExeName = `${productName}-${version}-${arch}-setup.exe`
      if (yamlContent.includes(oldExeName)) {
        yamlContent = yamlContent.replace(new RegExp(oldExeName, 'g'), newExeName)
        updated = true
        console.log(`✅ 更新 YAML 中的 EXE 文件引用: ${oldExeName} -> ${newExeName}`)
      }

      if (updated) {
        fs.writeFileSync(latestYmlPath, yamlContent, 'utf8')
        console.log(`✅ 已更新 latest.yml 文件`)
        renamedCount++
      }
    } catch (error) {
      console.error(`❌ 更新 latest.yml 文件失败:`, error)
    }
  }

  return renamedCount
}

/**
 * 处理 macOS 构建产物 / Handle macOS build artifacts
 */
function handleMacOSArtifacts(version: string, productName: string, arch: string): number {
  let renamedCount = 0
  const files = listDistFiles()

  // 查找 macOS DMG 文件 / Find macOS DMG files
  const dmgPattern = /\.dmg$/i
  const dmgFiles = files.filter((file) => dmgPattern.test(file))

  for (const file of dmgFiles) {
    const oldPath = path.join(DIST_DIR, file)
    const expectedName = `${productName}-${version}-${arch}.dmg`
    const newPath = path.join(DIST_DIR, expectedName)

    if (path.basename(file) !== expectedName) {
      if (renameFile(oldPath, newPath)) {
        renamedCount++
      }
    } else {
      console.log(`✅ macOS DMG 文件已是正确名称: ${file}`)
      renamedCount++
    }
  }

  // 查找 macOS ZIP 文件 / Find macOS ZIP files
  const zipPattern = /\.zip$/i
  const zipFiles = files.filter((file) => zipPattern.test(file))

  for (const file of zipFiles) {
    const oldPath = path.join(DIST_DIR, file)
    const expectedName = `${productName}-${version}-${arch}.zip`
    const newPath = path.join(DIST_DIR, expectedName)

    if (path.basename(file) !== expectedName) {
      if (renameFile(oldPath, newPath)) {
        renamedCount++
      }
    } else {
      console.log(`✅ macOS ZIP 文件已是正确名称: ${file}`)
      renamedCount++
    }
  }

  // 查找 macOS blockmap 文件 / Find macOS blockmap files
  const blockmapPattern = /\.blockmap$/i
  const blockmapFiles = files.filter((file) => blockmapPattern.test(file))

  for (const file of blockmapFiles) {
    const oldPath = path.join(DIST_DIR, file)
    let expectedName = ''

    if (file.includes('.dmg.blockmap')) {
      expectedName = `${productName}-${version}-${arch}.dmg.blockmap`
    } else if (file.includes('.zip.blockmap')) {
      expectedName = `${productName}-${version}-${arch}.zip.blockmap`
    } else {
      continue // 跳过不匹配的 blockmap 文件
    }

    const newPath = path.join(DIST_DIR, expectedName)

    if (path.basename(file) !== expectedName) {
      if (renameFile(oldPath, newPath)) {
        renamedCount++
      }
    } else {
      console.log(`✅ macOS blockmap 文件已是正确名称: ${file}`)
      renamedCount++
    }
  }

  // 更新 latest-mac.yml 文件中的文件引用 / Update file references in latest-mac.yml
  const latestMacYmlPath = path.join(DIST_DIR, 'latest-mac.yml')
  if (fs.existsSync(latestMacYmlPath)) {
    try {
      let yamlContent = fs.readFileSync(latestMacYmlPath, 'utf8')
      let updated = false

      // 更新 ZIP 文件引用 / Update ZIP file references
      const oldZipName = `${productName}-${version}-mac.zip`
      const newZipName = `${productName}-${version}-${arch}.zip`
      if (yamlContent.includes(oldZipName)) {
        yamlContent = yamlContent.replace(new RegExp(oldZipName, 'g'), newZipName)
        updated = true
        console.log(`✅ 更新 YAML 中的 ZIP 文件引用: ${oldZipName} -> ${newZipName}`)
      }

      // 更新 DMG 文件引用 / Update DMG file references
      const oldDmgName = `${productName}-${version}.dmg`
      const newDmgName = `${productName}-${version}-${arch}.dmg`
      if (yamlContent.includes(oldDmgName)) {
        yamlContent = yamlContent.replace(new RegExp(oldDmgName, 'g'), newDmgName)
        updated = true
        console.log(`✅ 更新 YAML 中的 DMG 文件引用: ${oldDmgName} -> ${newDmgName}`)
      }

      if (updated) {
        fs.writeFileSync(latestMacYmlPath, yamlContent, 'utf8')
        console.log(`✅ 已更新 latest-mac.yml 文件`)
        renamedCount++
      }
    } catch (error) {
      console.error(`❌ 更新 latest-mac.yml 文件失败:`, error)
    }
  }

  return renamedCount
}

/**
 * 处理 Linux 构建产物 / Handle Linux build artifacts
 */
function handleLinuxArtifacts(version: string, productName: string, arch: string): number {
  let renamedCount = 0
  const files = listDistFiles()

  // 查找 Linux AppImage 文件 / Find Linux AppImage files
  const appImagePattern = /\.AppImage$/i
  const appImageFiles = files.filter((file) => appImagePattern.test(file))

  for (const file of appImageFiles) {
    const oldPath = path.join(DIST_DIR, file)
    const expectedName = `${productName}-${version}-${arch}.AppImage`
    const newPath = path.join(DIST_DIR, expectedName)

    if (path.basename(file) !== expectedName) {
      if (renameFile(oldPath, newPath)) {
        renamedCount++
      }
    } else {
      console.log(`✅ Linux AppImage 文件已是正确名称: ${file}`)
      renamedCount++
    }
  }

  // 查找 Linux DEB 文件 / Find Linux DEB files
  const debPattern = /\.deb$/i
  const debFiles = files.filter((file) => debPattern.test(file))

  for (const file of debFiles) {
    const oldPath = path.join(DIST_DIR, file)
    const expectedName = `${productName}-${version}-${arch}.deb`
    const newPath = path.join(DIST_DIR, expectedName)

    if (path.basename(file) !== expectedName) {
      if (renameFile(oldPath, newPath)) {
        renamedCount++
      }
    } else {
      console.log(`✅ Linux DEB 文件已是正确名称: ${file}`)
      renamedCount++
    }
  }

  // 更新 latest-linux.yml 文件中的文件引用 / Update file references in latest-linux.yml
  const latestLinuxYmlPath = path.join(DIST_DIR, 'latest-linux.yml')
  if (fs.existsSync(latestLinuxYmlPath)) {
    try {
      let yamlContent = fs.readFileSync(latestLinuxYmlPath, 'utf8')
      let updated = false

      // 更新 AppImage 文件引用 / Update AppImage file references
      const oldAppImageName = `${productName}-${version}.AppImage`
      const newAppImageName = `${productName}-${version}-${arch}.AppImage`
      if (yamlContent.includes(oldAppImageName)) {
        yamlContent = yamlContent.replace(new RegExp(oldAppImageName, 'g'), newAppImageName)
        updated = true
        console.log(`✅ 更新 YAML 中的 AppImage 文件引用: ${oldAppImageName} -> ${newAppImageName}`)
      }

      // 更新 DEB 文件引用 / Update DEB file references
      const oldDebName = `${productName}-${version}.deb`
      const newDebName = `${productName}-${version}-${arch}.deb`
      if (yamlContent.includes(oldDebName)) {
        yamlContent = yamlContent.replace(new RegExp(oldDebName, 'g'), newDebName)
        updated = true
        console.log(`✅ 更新 YAML 中的 DEB 文件引用: ${oldDebName} -> ${newDebName}`)
      }

      if (updated) {
        fs.writeFileSync(latestLinuxYmlPath, yamlContent, 'utf8')
        console.log(`✅ 已更新 latest-linux.yml 文件`)
        renamedCount++
      }
    } catch (error) {
      console.error(`❌ 更新 latest-linux.yml 文件失败:`, error)
    }
  }

  return renamedCount
}

/**
 * 主函数 / Main function
 */
async function main(): Promise<void> {
  console.log('🔄 开始重命名构建产物...')
  console.log('🔄 Starting to rename build artifacts...')

  // 检查 dist 目录是否存在 / Check if dist directory exists
  if (!fileExists(DIST_DIR)) {
    console.error('❌ dist 目录不存在，请先运行构建命令')
    process.exit(1)
  }

  // 获取项目信息 / Get project info
  const { version, productName } = getPackageInfo()
  const { platform, arch } = getPlatformInfo()

  console.log(`📦 产品名称: ${productName}`)
  console.log(`🏷️  版本号: ${version}`)
  console.log(`💻 平台: ${platform}`)
  console.log(`🏗️  架构: ${arch}`)

  // 列出当前 dist 目录中的文件 / List current files in dist directory
  const distFiles = listDistFiles()
  console.log(`📁 dist 目录中的文件 (${distFiles.length} 个):`)
  distFiles.forEach((file) => console.log(`   - ${file}`))

  let totalRenamed = 0

  // 根据平台处理构建产物 / Handle build artifacts based on platform
  switch (platform) {
    case 'win':
    case 'windows':
      totalRenamed += handleWindowsArtifacts(version, productName, arch)
      break

    case 'mac':
    case 'macos':
    case 'darwin':
      totalRenamed += handleMacOSArtifacts(version, productName, arch)
      break

    case 'linux':
      totalRenamed += handleLinuxArtifacts(version, productName, arch)
      break

    default:
      console.log(`⚠️  未知平台: ${platform}，跳过重命名`)
      break
  }

  // 输出结果 / Output results
  console.log(`\n📊 重命名完成统计:`)
  console.log(`📊 Rename completion statistics:`)
  console.log(`✅ 成功重命名文件数: ${totalRenamed}`)
  console.log(`✅ Successfully renamed files: ${totalRenamed}`)

  if (totalRenamed === 0) {
    console.log('⚠️  没有文件需要重命名或重命名失败')
    console.log('⚠️  No files need to be renamed or rename failed')
  }

  console.log('🎉 构建产物重命名完成!')
  console.log('🎉 Build artifacts rename completed!')
}

// 运行主函数 / Run main function
main().catch((error) => {
  console.error('❌ 重命名过程中出现错误:', error)
  process.exit(1)
})
