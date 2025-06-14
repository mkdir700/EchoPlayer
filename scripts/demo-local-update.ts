#!/usr/bin/env tsx

/**
 * 本地更新功能演示脚本 - 展示完整的本地更新测试工作流程
 * Local Update Demo Script - Demonstrates the complete local update testing workflow
 */

import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

// 配置 / Configuration
const UPDATE_DATA_DIR = path.join(__dirname, '..', 'dev-update-data')
const SERVER_PORT = 8384

class LocalUpdateDemo {
  private serverProcess: ChildProcess | null = null
  private rl: readline.Interface

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  // 运行演示 / Run demo
  async runDemo(): Promise<void> {
    console.log('🎬 EchoLab 本地更新功能演示')
    console.log('='.repeat(50))
    console.log('这个演示将引导您完成本地更新测试的完整流程\n')

    try {
      await this.step1_Introduction()
      await this.step2_GenerateTestData()
      await this.step3_StartServer()
      await this.step4_TestInBrowser()
      await this.step5_TestInApp()
      await this.step6_Cleanup()

      console.log('\n🎉 演示完成！')
      console.log('您现在已经了解了如何在本地测试 EchoLab 的更新功能。')
    } catch (error) {
      console.error('\n❌ 演示过程中发生错误:', error)
    } finally {
      await this.cleanup()
      this.rl.close()
    }
  }

  // 步骤1: 介绍 / Step 1: Introduction
  private async step1_Introduction(): Promise<void> {
    console.log('📖 步骤 1: 了解本地更新测试')
    console.log('─'.repeat(30))
    console.log('本地更新测试包含以下组件:')
    console.log('• 测试数据生成器 - 创建模拟的更新文件')
    console.log('• 本地更新服务器 - 提供更新文件的HTTP服务')
    console.log('• EchoLab应用 - 在开发模式下连接本地服务器')
    console.log('')

    await this.waitForUser('按回车键继续...')
  }

  // 步骤2: 生成测试数据 / Step 2: Generate test data
  private async step2_GenerateTestData(): Promise<void> {
    console.log('📦 步骤 2: 生成测试更新数据')
    console.log('─'.repeat(30))

    // 检查是否已有数据 / Check if data already exists
    if (fs.existsSync(UPDATE_DATA_DIR)) {
      console.log('⚠️  检测到已存在的测试数据目录')
      const shouldRegenerate = await this.askYesNo('是否重新生成测试数据? (y/n): ')

      if (shouldRegenerate) {
        console.log('🗑️  删除旧数据...')
        fs.rmSync(UPDATE_DATA_DIR, { recursive: true, force: true })
      } else {
        console.log('✅ 使用现有测试数据')
        return
      }
    }

    console.log('🔄 正在生成测试数据...')

    try {
      await this.runCommand('tsx', ['scripts/generate-test-update.ts'])

      // 显示生成的文件 / Show generated files
      const files = fs.readdirSync(UPDATE_DATA_DIR)
      console.log('\n✅ 成功生成以下文件:')
      files.forEach((file) => {
        const filePath = path.join(UPDATE_DATA_DIR, file)
        const stats = fs.statSync(filePath)
        const size = (stats.size / 1024 / 1024).toFixed(1)
        console.log(`   • ${file} (${size} MB)`)
      })
    } catch (error) {
      throw new Error(`生成测试数据失败: ${error}`)
    }

    console.log('')
    await this.waitForUser('按回车键继续...')
  }

  // 步骤3: 启动服务器 / Step 3: Start server
  private async step3_StartServer(): Promise<void> {
    console.log('🌐 步骤 3: 启动本地更新服务器')
    console.log('─'.repeat(30))

    console.log('🚀 正在启动服务器...')

    try {
      this.serverProcess = spawn('tsx', ['scripts/dev-update-server.ts'], {
        stdio: 'pipe',
        detached: false
      })

      // 等待服务器启动 / Wait for server to start
      await this.waitForServer()

      console.log('✅ 服务器已启动')
      console.log(`📍 地址: http://localhost:${SERVER_PORT}`)
    } catch (error) {
      throw new Error(`启动服务器失败: ${error}`)
    }

    console.log('')
    await this.waitForUser('按回车键继续...')
  }

  // 步骤4: 在浏览器中测试 / Step 4: Test in browser
  private async step4_TestInBrowser(): Promise<void> {
    console.log('🌍 步骤 4: 在浏览器中查看更新服务器')
    console.log('─'.repeat(30))

    console.log('现在您可以在浏览器中查看更新服务器:')
    console.log(`🔗 打开: http://localhost:${SERVER_PORT}`)
    console.log('')
    console.log('在浏览器中您应该能看到:')
    console.log('• 服务器状态信息')
    console.log('• 可用文件列表')
    console.log('• 使用说明')
    console.log('')
    console.log('您还可以直接访问manifest文件:')
    console.log(`• http://localhost:${SERVER_PORT}/latest.yml`)
    console.log(`• http://localhost:${SERVER_PORT}/latest-mac.yml`)
    console.log('')

    await this.waitForUser('请在浏览器中查看，然后按回车键继续...')
  }

  // 步骤5: 在应用中测试 / Step 5: Test in app
  private async step5_TestInApp(): Promise<void> {
    console.log('📱 步骤 5: 在EchoLab应用中测试更新')
    console.log('─'.repeat(30))

    console.log('现在您需要启动EchoLab应用来测试更新功能:')
    console.log('')
    console.log('1. 打开新的终端窗口')
    console.log('2. 运行命令: npm run dev')
    console.log('3. 等待应用启动')
    console.log('4. 在应用中打开设置页面')
    console.log('5. 找到"更新设置"部分')
    console.log('6. 点击"检查更新"按钮')
    console.log('')
    console.log('预期结果:')
    console.log('✅ 应该显示发现新版本 (0.2.0-alpha.4)')
    console.log('✅ 显示更新大小和发布说明')
    console.log('✅ 提供下载选项')
    console.log('')
    console.log('⚠️  注意: 保持此服务器运行，不要关闭这个终端')
    console.log('')

    await this.waitForUser('完成应用测试后，按回车键继续...')
  }

  // 步骤6: 清理 / Step 6: Cleanup
  private async step6_Cleanup(): Promise<void> {
    console.log('🧹 步骤 6: 清理和总结')
    console.log('─'.repeat(30))

    const shouldCleanup = await this.askYesNo('是否删除测试数据? (y/n): ')

    if (shouldCleanup) {
      if (fs.existsSync(UPDATE_DATA_DIR)) {
        fs.rmSync(UPDATE_DATA_DIR, { recursive: true, force: true })
        console.log('✅ 测试数据已删除')
      }
    } else {
      console.log('📁 测试数据保留在: ' + UPDATE_DATA_DIR)
    }

    console.log('')
    console.log('📚 有用的命令:')
    console.log('• npm run generate-test-update  - 生成测试数据')
    console.log('• npm run dev:update-server     - 启动更新服务器')
    console.log('• npm run test:local-update     - 运行自动化测试')
    console.log('• npm run dev                   - 启动开发模式应用')
    console.log('')
    console.log('📖 更多信息请查看: docs/developer/local-update-testing.md')
  }

  // 等待服务器启动 / Wait for server to start
  private async waitForServer(): Promise<void> {
    const http = await import('http')
    const maxAttempts = 50
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        await new Promise<void>((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const req = http.get(`http://localhost:${SERVER_PORT}`, (_res) => {
            resolve()
          })
          req.on('error', reject)
          req.setTimeout(1000, () => {
            req.destroy()
            reject(new Error('Timeout'))
          })
        })
        return // 服务器已启动 / Server is ready
      } catch {
        attempts++
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    throw new Error('服务器启动超时')
  }

  // 运行命令 / Run command
  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'inherit' })

      process.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`命令执行失败，退出码: ${code}`))
        }
      })

      process.on('error', reject)
    })
  }

  // 等待用户输入 / Wait for user input
  private async waitForUser(prompt: string): Promise<void> {
    return new Promise((resolve) => {
      this.rl.question(prompt, () => resolve())
    })
  }

  // 询问是否 / Ask yes/no question
  private async askYesNo(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.toLowerCase().startsWith('y'))
      })
    })
  }

  // 清理资源 / Cleanup resources
  private async cleanup(): Promise<void> {
    if (this.serverProcess) {
      console.log('\n🛑 正在关闭服务器...')
      this.serverProcess.kill('SIGTERM')

      await new Promise((resolve) => {
        if (this.serverProcess) {
          this.serverProcess.on('close', resolve)
        } else {
          resolve(undefined)
        }
      })

      console.log('✅ 服务器已关闭')
    }
  }
}

// 主函数 / Main function
async function main(): Promise<void> {
  const demo = new LocalUpdateDemo()
  await demo.runDemo()
}

// 运行演示 / Run demo
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 演示脚本执行失败:', error)
    process.exit(1)
  })
}
