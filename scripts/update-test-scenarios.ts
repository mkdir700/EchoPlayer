#!/usr/bin/env tsx

/**
 * 更新测试场景脚本 / Update Test Scenarios Script
 *
 * 快速生成不同的更新测试场景，用于测试各种UI/UX情况
 * Quickly generate different update test scenarios for testing various UI/UX situations
 */

import fs from 'fs'
import path from 'path'

const UPDATE_DATA_DIR = path.join(__dirname, '..', 'dev-update-data')

// 测试场景配置 / Test scenario configurations
interface TestScenario {
  name: string
  description: string
  version: string
  hasUpdate: boolean
  isMandatory?: boolean
  releaseNotes: string
  fileSize?: number
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'normal-update',
    description: '正常更新 - 有新版本可用',
    version: '1.1.0',
    hasUpdate: true,
    releaseNotes: `# 🎉 EchoLab v1.1.0

## ✨ 新功能
- 🎵 新增智能音频分析功能
- 🎨 界面优化，支持更多主题
- 🚀 性能提升 50%

## 🐛 问题修复
- 修复音频播放卡顿问题
- 解决兼容性问题
- 优化内存使用

这是一个常规更新，包含新功能和问题修复。`,
    fileSize: 85000000 // 85MB
  },
  {
    name: 'no-update',
    description: '无更新 - 已是最新版本',
    version: '0.1.0', // 低于当前版本
    hasUpdate: false,
    releaseNotes: '',
    fileSize: 0
  },
  {
    name: 'mandatory-update',
    description: '强制更新 - 包含重要安全修复',
    version: '1.2.0',
    hasUpdate: true,
    isMandatory: true,
    releaseNotes: `# 🚨 EchoLab v1.2.0 - 重要安全更新

## 🔒 安全修复
- **重要**: 修复了关键安全漏洞
- 更新了加密算法
- 增强了数据保护

## ⚠️ 重要提示
此更新包含重要的安全修复，强烈建议立即更新。

**此更新为强制更新，无法跳过。**`,
    fileSize: 90000000 // 90MB
  },
  {
    name: 'large-update',
    description: '大型更新 - 测试下载进度',
    version: '2.0.0',
    hasUpdate: true,
    releaseNotes: `# 🚀 EchoLab v2.0.0 - 重大版本更新

## 🎯 重大更新
- 🔄 全新架构重构
- 🎨 全新UI设计
- 🧠 AI功能大幅增强
- 📱 移动端支持

## 📦 更新内容
这是一个大型更新，包含大量新功能和改进。
下载大小较大，请确保网络连接稳定。

预计下载时间：5-10分钟（取决于网络速度）`,
    fileSize: 250000000 // 250MB
  },
  {
    name: 'beta-update',
    description: '测试版更新 - Beta 渠道',
    version: '1.1.0-beta.1',
    hasUpdate: true,
    releaseNotes: `# 🧪 EchoLab v1.1.0-beta.1

## 🧪 测试版功能
- 🆕 实验性AI音频分析
- 🎨 新的界面主题（测试中）
- ⚡ 性能优化（实验性）

## ⚠️ 注意事项
这是测试版本，可能包含未知问题。
建议在非生产环境中使用。

如果遇到问题，请及时反馈。`,
    fileSize: 88000000 // 88MB
  }
]

// 获取当前版本 / Get current version
function getCurrentVersion(): string {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version
  } catch {
    return '1.0.0'
  }
}

// 生成更新清单 / Generate update manifest
function generateManifest(scenario: TestScenario): void {
  if (!scenario.hasUpdate) {
    console.log(`📭 场景 "${scenario.name}": 无更新，跳过生成清单`)
    return
  }

  const platforms = ['win', 'mac', 'linux']

  platforms.forEach((platform) => {
    const fileName = platform === 'win' ? 'latest.yml' : `latest-${platform}.yml`
    const filePath = path.join(UPDATE_DATA_DIR, fileName)

    const fileInfo = {
      win: {
        url: `echolab-${scenario.version}-setup.exe`,
        size: scenario.fileSize || 85000000
      },
      mac: {
        url: `echolab-${scenario.version}.dmg`,
        size: scenario.fileSize || 120000000
      },
      linux: {
        url: `echolab-${scenario.version}.AppImage`,
        size: scenario.fileSize || 95000000
      }
    }

    const file = fileInfo[platform as keyof typeof fileInfo]
    const sha512 = `mock-sha512-hash-for-${platform}-${scenario.name}-${Date.now()}`

    let yamlContent = `version: ${scenario.version}
files:
  - url: ${file.url}
    sha512: ${sha512}
    size: ${file.size}
path: ${file.url}
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
releaseName: 'EchoLab v${scenario.version}'`

    if (scenario.releaseNotes) {
      yamlContent += `\nreleaseNotes: |\n${scenario.releaseNotes
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}`
    }

    if (scenario.isMandatory) {
      yamlContent += `\nminimumSystemVersion: '999.0.0'`
      yamlContent += `\nstagingPercentage: 100`
    }

    // 确保目录存在
    if (!fs.existsSync(UPDATE_DATA_DIR)) {
      fs.mkdirSync(UPDATE_DATA_DIR, { recursive: true })
    }

    fs.writeFileSync(filePath, yamlContent, 'utf-8')
  })
}

// 清理旧文件 / Clean old files
function cleanOldFiles(): void {
  if (fs.existsSync(UPDATE_DATA_DIR)) {
    const files = fs.readdirSync(UPDATE_DATA_DIR)
    files.forEach((file) => {
      const filePath = path.join(UPDATE_DATA_DIR, file)
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath)
      }
    })
  }
}

// 显示可用场景 / Show available scenarios
function showScenarios(): void {
  console.log('\n📋 可用的测试场景:')
  TEST_SCENARIOS.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`)
    console.log(`   📝 ${scenario.description}`)
    console.log(`   📦 版本: ${scenario.version}`)
    console.log(`   🔄 有更新: ${scenario.hasUpdate ? '是' : '否'}`)
    if (scenario.isMandatory) {
      console.log(`   🚨 强制更新: 是`)
    }
  })
  console.log('\n0. 清理所有测试数据')
}

// 应用场景 / Apply scenario
function applyScenario(scenarioName: string): void {
  const scenario = TEST_SCENARIOS.find((s) => s.name === scenarioName)
  if (!scenario) {
    console.error(`❌ 找不到场景: ${scenarioName}`)
    return
  }

  console.log(`\n🎬 应用测试场景: ${scenario.name}`)
  console.log(`📝 描述: ${scenario.description}`)

  // 清理旧文件
  cleanOldFiles()

  // 生成新的清单文件
  generateManifest(scenario)

  if (scenario.hasUpdate) {
    console.log(`✅ 已生成更新清单 (版本 ${scenario.version})`)
    console.log(`💡 现在可以在应用中测试更新功能`)
  } else {
    console.log(`✅ 已配置无更新场景`)
    console.log(`💡 应用将显示"已是最新版本"`)
  }
}

// 主函数 / Main function
function main(): void {
  const args = process.argv.slice(2)
  const currentVersion = getCurrentVersion()

  console.log(`🚀 EchoLab 更新测试场景工具`)
  console.log(`📦 当前版本: ${currentVersion}`)

  if (args.length === 0) {
    showScenarios()
    console.log(`\n使用方法:`)
    console.log(`  npm run test-scenarios <scenario-name>`)
    console.log(`  npm run test-scenarios clean`)
    console.log(`\n示例:`)
    console.log(`  npm run test-scenarios normal-update`)
    console.log(`  npm run test-scenarios mandatory-update`)
    return
  }

  const command = args[0]

  if (command === 'clean') {
    console.log('\n🧹 清理测试数据...')
    cleanOldFiles()
    console.log('✅ 清理完成')
    return
  }

  if (command === 'list') {
    showScenarios()
    return
  }

  // 应用指定场景
  applyScenario(command)
}

// 运行主函数
if (require.main === module) {
  main()
}
