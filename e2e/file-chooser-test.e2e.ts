import { test, expect } from '@playwright/test'
import { ElectronHelper } from './utils/electron-helper'
import { FileChooserHelper } from './utils/file-chooser-helper'
import { COMMON_TEST_IDS } from '../src/renderer/src/utils/test-utils'

/**
 * 文件选择器测试 / File chooser test
 * 演示新的 Electron dialog mocking 方法 / Demonstrate new Electron dialog mocking method
 */
test.describe('File Chooser E2E Test / 文件选择器端到端测试', () => {
  let electronApp: ElectronHelper

  test.beforeEach(async () => {
    electronApp = await ElectronHelper.connect()
    await electronApp.waitForAppReady()
  })

  test.afterEach(async () => {
    const page = electronApp.getPage()
    const fileChooserHelper = new FileChooserHelper(page)

    try {
      // 恢复 Electron dialog API / Restore Electron dialog API
      await fileChooserHelper.restoreElectronFileDialog()
      // 清理测试视频文件 / Cleanup test video file
      await FileChooserHelper.cleanupTestVideo()
    } catch (error) {
      console.warn('⚠️ Failed to cleanup test resources:', error)
    }

    // 测试失败时截图 / Take screenshot on failure
    if (test.info().status === 'failed') {
      await electronApp.screenshot(`file-chooser-failure-${test.info().title}`)
    }
  })

  test('直接 API 模拟测试 / Direct API mocking test', async () => {
    const page = electronApp.getPage()

    console.log('🎯 Testing direct API mocking...')

    // 等待首页加载 / Wait for home page to load
    await page.waitForSelector(`[data-testid="${COMMON_TEST_IDS.HOME_PAGE_ADD_VIDEO_BUTTON}"]`)

    // 直接覆盖 API / Direct API override
    await page.evaluate(() => {
      console.log('🎯 Setting up direct API mock...')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      if (win.api && win.api.fileSystem) {
        const originalFn = win.api.fileSystem.openFileDialog

        win.api.fileSystem.openFileDialog = async () => {
          console.log('🎯 Direct mock called!')
          return {
            canceled: false,
            filePaths: ['/tmp/test-video.mp4']
          }
        }

        win.__originalOpenFileDialog = originalFn
        console.log('✅ Direct API mock set up')
      } else {
        console.warn('⚠️ API not available for mocking')
      }
    })

    // 点击按钮 / Click button
    await page.click(`[data-testid="${COMMON_TEST_IDS.HOME_PAGE_ADD_VIDEO_BUTTON}"]`)
    await page.waitForTimeout(2000)

    console.log('✅ Direct API mocking test completed')
  })

  test('检查 Electron API 可用性 / Check Electron API availability', async () => {
    const page = electronApp.getPage()

    console.log('🎯 Checking Electron API availability...')

    const apiInfo = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any

      return {
        hasWindow: typeof window !== 'undefined',
        hasApi: typeof win.api !== 'undefined',
        hasFileSystem: win.api && typeof win.api.fileSystem !== 'undefined',
        hasOpenFileDialog:
          win.api?.fileSystem && typeof win.api.fileSystem.openFileDialog === 'function',
        apiStructure: win.api ? Object.keys(win.api) : null,
        fileSystemStructure: win.api?.fileSystem ? Object.keys(win.api.fileSystem) : null
      }
    })

    console.log('API availability info:', apiInfo)

    expect(apiInfo.hasWindow).toBe(true)
    expect(apiInfo.hasApi).toBe(true)
    expect(apiInfo.hasFileSystem).toBe(true)
    expect(apiInfo.hasOpenFileDialog).toBe(true)

    console.log('✅ Electron API availability check passed')
  })
})
