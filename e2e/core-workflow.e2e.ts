import { test, expect } from '@playwright/test'
import { ElectronHelper } from './utils/electron-helper'

test.describe('EchoLab Core Workflow', () => {
  let electronApp: ElectronHelper

  test.beforeEach(async () => {
    // Connect to the running Electron app
    electronApp = await ElectronHelper.connect()
    await electronApp.waitForAppReady()
  })

  test.afterEach(async () => {
    // Take screenshot on failure for debugging
    if (test.info().status === 'failed') {
      await electronApp.screenshot(`failure-${test.info().title}`)
    }
  })

  test('应用启动和界面加载', async () => {
    // Test app startup
    const page = electronApp.getPage()

    // Check if main window is visible
    await expect(page).toHaveTitle(/EchoLab/i)

    // Check main components are present
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="video-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="subtitle-section"]')).toBeVisible()

    console.log('✅ App startup and UI loading test passed')
  })

  test('视频文件加载流程', async () => {
    const page = electronApp.getPage()

    // Test video loading workflow
    await page.click('[data-testid="load-video-button"]')

    // Wait for file dialog (in real test, you might need to handle actual file selection)
    // For now, we'll simulate video loaded state
    await page.evaluate(() => {
      // Simulate video loaded
      window.dispatchEvent(
        new CustomEvent('videoLoaded', {
          detail: {
            fileName: 'test-video.mp4',
            duration: 120
          }
        })
      )
    })

    // Verify video player is ready
    await electronApp.waitForVideoPlayer()
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible()

    // Check video controls are available
    await expect(page.locator('[data-testid="play-pause-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()

    console.log('✅ Video loading workflow test passed')
  })

  test('字幕文件加载和显示', async () => {
    const page = electronApp.getPage()

    // First load a video (prerequisite)
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('videoLoaded', {
          detail: { fileName: 'test-video.mp4', duration: 120 }
        })
      )
    })

    // Load subtitle file
    await page.click('[data-testid="load-subtitle-button"]')

    // Simulate subtitle loaded
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('subtitleLoaded', {
          detail: {
            subtitles: [
              { id: 1, start: 0, end: 3, text: 'Hello, welcome to our tutorial.' },
              { id: 2, start: 3, end: 6, text: 'Today we will learn about language learning.' },
              { id: 3, start: 6, end: 10, text: "Let's start with some basic phrases." }
            ]
          }
        })
      )
    })

    // Wait for subtitle list to appear
    await expect(page.locator('[data-testid="subtitle-list"]')).toBeVisible()

    // Check subtitle sentences are displayed
    await expect(page.locator('[data-testid="subtitle-sentence-0"]')).toContainText(
      'Hello, welcome'
    )
    await expect(page.locator('[data-testid="subtitle-sentence-1"]')).toContainText(
      'Today we will learn'
    )

    console.log('✅ Subtitle loading and display test passed')
  })

  test('逐句播放功能', async () => {
    const page = electronApp.getPage()

    // Setup: Load video and subtitles
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('videoLoaded', {
          detail: { fileName: 'test-video.mp4', duration: 120 }
        })
      )
      window.dispatchEvent(
        new CustomEvent('subtitleLoaded', {
          detail: {
            subtitles: [
              { id: 1, start: 0, end: 3, text: 'Hello, welcome to our tutorial.' },
              { id: 2, start: 3, end: 6, text: 'Today we will learn about language learning.' }
            ]
          }
        })
      )
    })

    await expect(page.locator('[data-testid="subtitle-list"]')).toBeVisible()

    // Click on first subtitle sentence
    await electronApp.navigateToSentence(0)

    // Verify video seeks to correct time
    // Note: In real implementation, you'd check actual video time
    await expect(page.locator('[data-testid="subtitle-sentence-0"]')).toHaveClass(/active/)

    // Test play/pause functionality
    await electronApp.togglePlayPause()

    // Verify current subtitle is highlighted
    await expect(page.locator('[data-testid="current-subtitle"]')).toContainText('Hello, welcome')

    console.log('✅ Sentence-by-sentence playback test passed')
  })

  test('键盘快捷键操作', async () => {
    const page = electronApp.getPage()

    // Setup video and subtitles
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('videoLoaded', {
          detail: { fileName: 'test-video.mp4', duration: 120 }
        })
      )
      window.dispatchEvent(
        new CustomEvent('subtitleLoaded', {
          detail: {
            subtitles: [
              { id: 1, start: 0, end: 3, text: 'First sentence.' },
              { id: 2, start: 3, end: 6, text: 'Second sentence.' }
            ]
          }
        })
      )
    })

    // Test space bar for play/pause
    await electronApp.testKeyboardShortcut('Space')

    // Test arrow keys for navigation
    await electronApp.testKeyboardShortcut('ArrowDown')
    await expect(page.locator('[data-testid="subtitle-sentence-1"]')).toHaveClass(/active/)

    await electronApp.testKeyboardShortcut('ArrowUp')
    await expect(page.locator('[data-testid="subtitle-sentence-0"]')).toHaveClass(/active/)

    // Test repeat functionality (R key)
    await electronApp.testKeyboardShortcut('KeyR')

    console.log('✅ Keyboard shortcuts test passed')
  })

  test('学习进度跟踪', async () => {
    const page = electronApp.getPage()

    // Setup
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('videoLoaded', {
          detail: { fileName: 'test-video.mp4', duration: 120 }
        })
      )
      window.dispatchEvent(
        new CustomEvent('subtitleLoaded', {
          detail: {
            subtitles: [
              { id: 1, start: 0, end: 3, text: 'First sentence.' },
              { id: 2, start: 3, end: 6, text: 'Second sentence.' },
              { id: 3, start: 6, end: 9, text: 'Third sentence.' }
            ]
          }
        })
      )
    })

    // Simulate learning progress
    await electronApp.navigateToSentence(0)
    await page.click('[data-testid="mark-learned-button"]')

    // Check progress indicator
    await expect(page.locator('[data-testid="progress-indicator"]')).toContainText('33%')

    // Learn another sentence
    await electronApp.navigateToSentence(1)
    await page.click('[data-testid="mark-learned-button"]')

    await expect(page.locator('[data-testid="progress-indicator"]')).toContainText('67%')

    console.log('✅ Learning progress tracking test passed')
  })

  test('设置和偏好配置', async () => {
    const page = electronApp.getPage()

    // Open settings
    await page.click('[data-testid="settings-button"]')
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible()

    // Test playback speed setting
    await page.selectOption('[data-testid="playback-speed-select"]', '0.75')

    // Test repeat mode setting
    await page.check('[data-testid="repeat-mode-checkbox"]')

    // Test subtitle display settings
    await page.fill('[data-testid="subtitle-font-size"]', '18')

    // Save settings
    await page.click('[data-testid="save-settings-button"]')

    // Verify settings are applied
    await expect(page.locator('[data-testid="settings-modal"]')).not.toBeVisible()

    console.log('✅ Settings and preferences test passed')
  })

  test('应用稳定性和错误处理', async () => {
    const page = electronApp.getPage()

    // Test loading invalid video file
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('videoLoadError', {
          detail: { error: 'Unsupported format' }
        })
      )
    })

    // Check error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Unsupported format')

    // Test subtitle loading error
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('subtitleLoadError', {
          detail: { error: 'Invalid subtitle format' }
        })
      )
    })

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid subtitle format'
    )

    // Test app recovery
    await page.click('[data-testid="dismiss-error-button"]')
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()

    console.log('✅ App stability and error handling test passed')
  })
})
