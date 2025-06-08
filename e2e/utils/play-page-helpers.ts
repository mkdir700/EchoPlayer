import { Page } from '@playwright/test'
import { ElectronHelper } from './electron-helper'
import { COMMON_TEST_IDS } from '../../src/renderer/src/utils/test-utils'
// 导入文件选择器助手 / Import file chooser helper
import { FileChooserHelper } from './file-chooser-helper'

/**
 * PlayPage 测试辅助工具类 / PlayPage test helper utilities
 */
export class PlayPageHelper {
  constructor(private electronApp: ElectronHelper) {}

  /**
   * 设置播放页面的测试环境 / Setup play page test environment
   */
  async setupPlayPage(): Promise<void> {
    const page = this.electronApp.getPage()

    // 检查是否已经在播放页面 / Check if already on play page
    const isAlreadyOnPlayPage = await page
      .locator(`[data-testid="${COMMON_TEST_IDS.PLAY_PAGE_CONTAINER}"]`)
      .isVisible({ timeout: 1000 })
      .catch(() => false)

    if (isAlreadyOnPlayPage) {
      console.log('✅ Already on play page, skipping navigation')
      return
    }

    // 首先确保在首页 / First ensure we're on the home page
    try {
      await page.waitForSelector(`[data-testid="${COMMON_TEST_IDS.HOME_PAGE_ADD_VIDEO_BUTTON}"]`, {
        timeout: 5000
      })
    } catch {
      // 如果不在首页，尝试导航到首页 / If not on home page, try to navigate to home
      console.log('Not on home page, trying to navigate to home...')
      await page.evaluate(() => {
        if (window.location.hash !== '#/' && window.location.hash !== '') {
          window.location.hash = '#/'
        }
      })

      await page.waitForSelector(`[data-testid="${COMMON_TEST_IDS.HOME_PAGE_ADD_VIDEO_BUTTON}"]`, {
        timeout: 5000
      })
    }

    // 创建文件选择器助手 / Create file chooser helper
    const fileChooserHelper = new FileChooserHelper(page)

    // 验证测试视频文件存在 / Verify test video file exists
    try {
      await FileChooserHelper.verifyTestVideoExists()
    } catch (error) {
      console.warn('⚠️ Failed to verify test video file:', error)
      throw new Error(`Test video file verification failed: ${error}`)
    }

    // 使用增强的文件系统 API 模拟方法 / Use enhanced file system API mocking method
    try {
      await fileChooserHelper.clickButtonAndSelectFile(
        `[data-testid="${COMMON_TEST_IDS.HOME_PAGE_ADD_VIDEO_BUTTON}"]`
      )
    } catch (error) {
      console.error('❌ Failed to select video file:', error)
      throw new Error(`Video file selection failed: ${error}`)
    }

    // 等待页面导航到播放页面 / Wait for navigation to play page
    let navigationAttempts = 0
    const maxAttempts = 3

    while (navigationAttempts < maxAttempts) {
      try {
        await page.waitForSelector(`[data-testid="${COMMON_TEST_IDS.PLAY_PAGE_CONTAINER}"]`, {
          timeout: 10000
        })

        // 确认播放页面已完全加载 / Confirm play page is fully loaded
        await page.waitForSelector(`[data-testid="${COMMON_TEST_IDS.PLAY_PAGE_VIDEO_CONTAINER}"]`, {
          timeout: 5000
        })

        console.log('✅ Successfully navigated to play page')
        return
      } catch (error) {
        navigationAttempts++
        console.log(`❌ Navigation attempt ${navigationAttempts} failed:`, error)

        if (navigationAttempts < maxAttempts) {
          // 尝试手动导航 / Try manual navigation
          console.log('Trying manual navigation...')

          await page.evaluate(() => {
            // 尝试多种导航方式 / Try multiple navigation methods
            if (window.location.hash !== '#/play') {
              window.location.hash = '#/play'
            }

            // 如果有路由器实例，尝试使用编程导航 / If router instance exists, try programmatic navigation
            const windowWithRouter = window as Window & {
              router?: { push: (path: string) => void }
            }
            if (windowWithRouter.router) {
              windowWithRouter.router.push('/play')
            }
          })

          await page.waitForTimeout(2000) // 给页面时间重新加载 / Give page time to reload
        } else {
          throw new Error(
            `Failed to navigate to play page after ${maxAttempts} attempts. Please ensure the application is running correctly and video files can be loaded.`
          )
        }
      }
    }
  }

  /**
   * 清理播放页面测试环境 / Cleanup play page test environment
   */
  async cleanupPlayPage(): Promise<void> {
    const page = this.electronApp.getPage()
    const fileChooserHelper = new FileChooserHelper(page)

    try {
      // 恢复 Electron dialog API / Restore Electron dialog API
      await fileChooserHelper.restoreElectronFileDialog()
      console.log('✅ Play page cleanup completed')
    } catch (error) {
      console.warn('⚠️ Play page cleanup failed:', error)
    }
  }

  /**
   * 切换全屏模式 / Toggle fullscreen mode
   */
  async toggleFullscreen(): Promise<boolean> {
    const page = this.electronApp.getPage()

    const initialFullscreen = await page.evaluate(() => {
      return document.fullscreenElement !== null
    })

    await page.keyboard.press('F11')
    await page.waitForTimeout(1000)

    const newFullscreen = await page.evaluate(() => {
      return document.fullscreenElement !== null
    })

    return newFullscreen !== initialFullscreen
  }

  /**
   * 获取侧边栏容器的可见性 / Get sidebar container visibility
   */
  async getSidebarVisibility(): Promise<{ opacity: string; width: string }> {
    const page = this.electronApp.getPage()
    const sidebarContainer = page.locator(
      `[data-testid="${COMMON_TEST_IDS.PLAY_PAGE_SIDEBAR_CONTAINER}"]`
    )

    return await sidebarContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        opacity: styles.opacity,
        width: styles.width
      }
    })
  }

  /**
   * 执行视频控制操作 / Perform video control operations
   */
  async performVideoControls(): Promise<void> {
    const page = this.electronApp.getPage()

    // 播放/暂停 / Play/pause
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)

    // 前进 / Step forward
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)

    // 后退 / Step backward
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(300)
  }

  /**
   * 获取页面性能指标 / Get page performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    memoryUsage: number
    timing: number
  }> {
    const page = this.electronApp.getPage()

    const startTime = Date.now()
    await this.performVideoControls()
    const endTime = Date.now()

    const memoryUsage = await page.evaluate(() => {
      const perf = performance as PerformanceWithMemory
      return perf.memory?.usedJSHeapSize || 0
    })

    return {
      memoryUsage,
      timing: endTime - startTime
    }
  }

  /**
   * 检查所有 PlayPage 元素是否存在 / Check if all PlayPage elements exist
   */
  async checkAllElementsExist(): Promise<Record<string, boolean>> {
    const page = this.electronApp.getPage()

    const elements = {
      container: COMMON_TEST_IDS.PLAY_PAGE_CONTAINER,
      contentArea: COMMON_TEST_IDS.PLAY_PAGE_CONTENT_AREA,
      videoContainer: COMMON_TEST_IDS.PLAY_PAGE_VIDEO_CONTAINER,
      divider: COMMON_TEST_IDS.PLAY_PAGE_DIVIDER,
      sidebarContainer: COMMON_TEST_IDS.PLAY_PAGE_SIDEBAR_CONTAINER
    }

    const results: Record<string, boolean> = {}

    for (const [key, testId] of Object.entries(elements)) {
      try {
        await page.locator(`[data-testid="${testId}"]`).waitFor({ timeout: 5000 })
        results[key] = true
      } catch {
        results[key] = false
      }
    }

    return results
  }

  /**
   * 模拟用户交互序列 / Simulate user interaction sequence
   */
  async simulateUserInteractions(): Promise<void> {
    const page = this.electronApp.getPage()

    // 键盘导航序列 / Keyboard navigation sequence
    await page.keyboard.press('Tab')
    await page.waitForTimeout(100)

    await page.keyboard.press('Space')
    await page.waitForTimeout(200)

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)

    // 尝试全屏切换 / Try fullscreen toggle
    await page.keyboard.press('F11')
    await page.waitForTimeout(500)

    await page.keyboard.press('F11')
    await page.waitForTimeout(500)
  }
}

// 类型定义 / Type definitions
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

/**
 * 创建 PlayPage 测试选择器 / Create PlayPage test selector
 */
export function createPlayPageSelector(testId: string): string {
  return `[data-testid="${testId}"]`
}

/**
 * PlayPage 测试断言辅助函数 / PlayPage test assertion helpers
 */
export const PlayPageAssertions = {
  async containerIsVisible(page: Page): Promise<void> {
    const container = page.locator(createPlayPageSelector(COMMON_TEST_IDS.PLAY_PAGE_CONTAINER))
    await container.waitFor({ state: 'visible', timeout: 10000 })
  },

  async layoutIsResponsive(page: Page): Promise<boolean> {
    const videoContainer = page.locator(
      createPlayPageSelector(COMMON_TEST_IDS.PLAY_PAGE_VIDEO_CONTAINER)
    )
    const bounds = await videoContainer.boundingBox()
    return bounds !== null && bounds.width > 0 && bounds.height > 0
  },

  async sidebarIsAnimated(page: Page): Promise<boolean> {
    const sidebar = page.locator(
      createPlayPageSelector(COMMON_TEST_IDS.PLAY_PAGE_SIDEBAR_CONTAINER)
    )
    const style = await sidebar.evaluate((el) => window.getComputedStyle(el).transition)
    return style.includes('all') || style.includes('flex') || style.includes('width')
  }
}
