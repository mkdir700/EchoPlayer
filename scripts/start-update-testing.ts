#!/usr/bin/env tsx

/**
 * 一键启动更新测试环境 / One-click Update Testing Environment Launcher
 *
 * 这个脚本会自动设置完整的更新测试环境：
 * 1. 生成测试更新数据
 * 2. 启动本地更新服务器
 * 3. 提供测试指导
 *
 * This script automatically sets up a complete update testing environment:
 * 1. Generate test update data
 * 2. Start local update server
 * 3. Provide testing guidance
 */

import { spawn, ChildProcess } from 'child_process'

// 配置 / Configuration
const UPDATE_SERVER_PORT = 8384

// 颜色输出 / Colored output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorLog(color: keyof typeof colors, message: string): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 检查端口是否被占用 / Check if port is in use
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const net = require('net')
    const server = net.createServer()

    server.listen(port, () => {
      server.once('close', () => resolve(true))
      server.close()
    })

    server.on('error', () => resolve(false))
  })
}

// 等待服务器启动 / Wait for server to start
function waitForServer(port: number, timeout = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now()

    const checkServer = (): void => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const net = require('net')
      const socket = new net.Socket()

      socket.setTimeout(1000)
      socket.on('connect', () => {
        socket.destroy()
        resolve(true)
      })

      socket.on('timeout', () => {
        socket.destroy()
        if (Date.now() - startTime < timeout) {
          setTimeout(checkServer, 500)
        } else {
          resolve(false)
        }
      })

      socket.on('error', () => {
        if (Date.now() - startTime < timeout) {
          setTimeout(checkServer, 500)
        } else {
          resolve(false)
        }
      })

      socket.connect(port, 'localhost')
    }

    checkServer()
  })
}

// 生成测试数据 / Generate test data
async function generateTestData(): Promise<boolean> {
  return new Promise((resolve) => {
    colorLog('cyan', '📦 正在生成测试更新数据...')

    const child = spawn('npm', ['run', 'generate-test-update'], {
      stdio: 'pipe',
      shell: true
    })

    child.stdout?.on('data', (data) => {
      process.stdout.write(data)
    })

    child.stderr?.on('data', (data) => {
      process.stderr.write(data)
    })

    child.on('close', (code) => {
      if (code === 0) {
        colorLog('green', '✅ 测试数据生成完成')
        resolve(true)
      } else {
        colorLog('red', '❌ 测试数据生成失败')
        resolve(false)
      }
    })
  })
}

// 启动更新服务器 / Start update server
function startUpdateServer(): Promise<ChildProcess | null> {
  return new Promise((resolve) => {
    colorLog('cyan', '🚀 正在启动更新服务器...')

    const child = spawn('npm', ['run', 'dev:update-server'], {
      stdio: 'pipe',
      shell: true
    })

    child.stdout?.on('data', (data) => {
      const output = data.toString()
      process.stdout.write(output)

      // 检查服务器是否启动成功
      if (output.includes('开发更新服务器已启动') || output.includes('Update Server Started')) {
        colorLog('green', '✅ 更新服务器启动成功')
        resolve(child)
      }
    })

    child.stderr?.on('data', (data) => {
      process.stderr.write(data)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        colorLog('red', '❌ 更新服务器启动失败')
        resolve(null)
      }
    })

    // 超时处理
    setTimeout(() => {
      colorLog('yellow', '⚠️  服务器启动超时，但可能仍在运行')
      resolve(child)
    }, 5000)
  })
}

// 显示测试指导 / Show testing guidance
function showTestingGuidance(): void {
  console.log('\n' + '='.repeat(60))
  colorLog('bright', '🎯 更新功能测试指导')
  console.log('='.repeat(60))

  colorLog('yellow', '\n📋 测试步骤:')
  console.log('1. 在新终端中运行: npm run dev')
  console.log('2. 打开应用后，进入设置页面')
  console.log('3. 点击"检查更新"按钮')
  console.log('4. 观察更新UI的表现')

  colorLog('yellow', '\n🧪 测试场景:')
  console.log('• 正常更新: npm run test-scenarios normal-update')
  console.log('• 强制更新: npm run test-scenarios mandatory-update')
  console.log('• 大型更新: npm run test-scenarios large-update')
  console.log('• 无更新:   npm run test-scenarios no-update')

  colorLog('yellow', '\n🔗 有用链接:')
  console.log(`• 更新服务器: http://localhost:${UPDATE_SERVER_PORT}`)
  console.log('• 测试指南: docs/UPDATE_TESTING_GUIDE.md')

  colorLog('yellow', '\n🎛️  控制命令:')
  console.log('• 查看场景: npm run test-scenarios list')
  console.log('• 清理数据: npm run test-scenarios clean')
  console.log('• 停止服务: Ctrl+C')

  console.log('\n' + '='.repeat(60))
  colorLog('green', '🚀 测试环境已就绪！现在可以开始测试更新功能。')
  console.log('='.repeat(60) + '\n')
}

// 清理函数 / Cleanup function
function cleanup(serverProcess: ChildProcess | null): void {
  if (serverProcess) {
    colorLog('yellow', '\n⏹️  正在关闭更新服务器...')
    serverProcess.kill('SIGTERM')

    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL')
      }
    }, 3000)
  }

  colorLog('green', '✅ 清理完成')
  process.exit(0)
}

// 主函数 / Main function
async function main(): Promise<void> {
  colorLog('bright', '🚀 EchoLab 更新测试环境启动器')
  console.log('='.repeat(50))

  // 检查端口是否可用
  const isPortAvailable = await checkPort(UPDATE_SERVER_PORT)
  if (!isPortAvailable) {
    colorLog('red', `❌ 端口 ${UPDATE_SERVER_PORT} 已被占用`)
    colorLog('yellow', '💡 请先关闭占用端口的程序，或修改配置中的端口号')
    process.exit(1)
  }

  // 生成测试数据
  const dataGenerated = await generateTestData()
  if (!dataGenerated) {
    colorLog('red', '❌ 无法生成测试数据，退出')
    process.exit(1)
  }

  // 启动更新服务器
  const serverProcess = await startUpdateServer()
  if (!serverProcess) {
    colorLog('red', '❌ 无法启动更新服务器，退出')
    process.exit(1)
  }

  // 等待服务器完全启动
  colorLog('cyan', '⏳ 等待服务器完全启动...')
  const serverReady = await waitForServer(UPDATE_SERVER_PORT)

  if (serverReady) {
    colorLog('green', '✅ 服务器已就绪')
  } else {
    colorLog('yellow', '⚠️  服务器可能仍在启动中')
  }

  // 显示测试指导
  showTestingGuidance()

  // 设置信号处理
  process.on('SIGINT', () => cleanup(serverProcess))
  process.on('SIGTERM', () => cleanup(serverProcess))

  // 保持进程运行
  colorLog('cyan', '💡 按 Ctrl+C 停止测试环境')

  // 监听服务器进程
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      colorLog('red', `❌ 更新服务器异常退出 (代码: ${code})`)
    } else {
      colorLog('green', '✅ 更新服务器正常退出')
    }
    process.exit(code || 0)
  })
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    colorLog('red', `❌ 启动失败: ${error.message}`)
    process.exit(1)
  })
}
