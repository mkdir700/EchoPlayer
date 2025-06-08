import { test, expect } from '@playwright/test'
import { ElectronHelper } from './utils/electron-helper'

// 简化的测试，直接测试新的测试环境自动文件加载功能
// Simplified test for the new test environment auto file loading feature

test.describe('简化的播放页面工作流程测试 / Simplified Play Page Workflow', () => {
  let electronApp: ElectronHelper

  test.beforeEach(async () => {
    electronApp = await ElectronHelper.connect()
  })

  test.afterEach(async () => {
    // Keep electron app open for debugging
  })

  test('验证测试环境标识符 / Verify test environment identifier', async () => {
    const page = electronApp.getPage()

    // 检查是否在测试环境中，使用新的环境 API
    const environmentInfo = await page.evaluate(() => {
      return {
        nodeEnv: window.api.env.getNodeEnv(),
        isTestEnv: window.api.env.isTestEnv(),
        isDevelopment: window.api.env.isDevelopment()
      }
    })

    console.log('🔍 环境信息:', environmentInfo)
    expect(environmentInfo.nodeEnv).toBe('test')
    expect(environmentInfo.isTestEnv).toBe(true)
    expect(environmentInfo.isDevelopment).toBe(false)
  })
})
