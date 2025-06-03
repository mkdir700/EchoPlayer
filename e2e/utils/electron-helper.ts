import { Page } from '@playwright/test'
import { chromium } from '@playwright/test'

export class ElectronHelper {
  constructor(private page: Page) {}

  /**
   * Connect to Electron app via CDP with retry mechanism
   */
  static async connect(maxRetries = 5, retryDelay = 2000): Promise<ElectronHelper> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔗 Attempting to connect to Electron (attempt ${attempt}/${maxRetries})...`)

        // Check if CDP endpoint is available first
        const response = await fetch('http://localhost:9222/json/list', {
          signal: AbortSignal.timeout(5000)
        })

        if (!response.ok) {
          throw new Error(`CDP endpoint returned ${response.status}`)
        }

        const pages = await response.json()
        console.log(`📄 Found ${pages.length} pages in CDP`)

        const browser = await chromium.connectOverCDP('http://localhost:9222')
        const contexts = browser.contexts()

        console.log(`📱 Found ${contexts.length} browser contexts`)

        if (contexts.length === 0) {
          throw new Error('No browser contexts found')
        }

        const pages_in_context = contexts[0].pages()
        console.log(`📄 Found ${pages_in_context.length} pages in first context`)

        const page = pages_in_context[0]

        if (!page) {
          throw new Error('No pages found in browser context')
        }

        console.log('✅ Successfully connected to Electron app')
        return new ElectronHelper(page)
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ Connection attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          console.log(`⏳ Waiting ${retryDelay}ms before retry...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }
    }

    console.error('❌ All connection attempts failed')
    throw new Error(
      `Failed to connect to Electron after ${maxRetries} attempts. Last error: ${lastError?.message}`
    )
  }

  /**
   * Wait for the app to be ready
   */
  async waitForAppReady(timeout = 10000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout })
    // Wait for React to hydrate
    await this.page.waitForFunction(
      () => {
        return window.document.readyState === 'complete'
      },
      { timeout }
    )
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `e2e-results/screenshots/${name}.png`,
      fullPage: true
    })
  }

  /**
   * Check if the video player is loaded
   */
  async waitForVideoPlayer(): Promise<void> {
    await this.page.waitForSelector('[data-testid="video-player"]', { timeout: 15000 })
  }

  /**
   * Load a video file (mock or real)
   */
  async loadVideo(videoPath?: string): Promise<void> {
    if (videoPath) {
      // If real video path provided, use file dialog
      await this.page.click('[data-testid="load-video-button"]')
      // Handle file dialog - this might need adjustment based on actual implementation
    } else {
      // Use mock video for testing
      await this.page.evaluate(() => {
        // Mock video loading for testing
        const videoElement = document.querySelector('video')
        if (videoElement) {
          videoElement.dispatchEvent(new Event('loadedmetadata'))
        }
      })
    }
  }

  /**
   * Load subtitle file
   */
  async loadSubtitle(): Promise<void> {
    await this.page.click('[data-testid="load-subtitle-button"]')
    // Wait for subtitle processing
    await this.page.waitForSelector('[data-testid="subtitle-list"]', { timeout: 10000 })
  }

  /**
   * Navigate to specific subtitle sentence
   */
  async navigateToSentence(index: number): Promise<void> {
    await this.page.click(`[data-testid="subtitle-sentence-${index}"]`)
    // Wait for video to seek
    await this.page.waitForTimeout(500)
  }

  /**
   * Play/Pause video
   */
  async togglePlayPause(): Promise<void> {
    await this.page.click('[data-testid="play-pause-button"]')
    await this.page.waitForTimeout(300)
  }

  /**
   * Check if video is playing
   */
  async isVideoPlaying(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video')
      return video ? !video.paused : false
    })
  }

  /**
   * Get current video time
   */
  async getCurrentTime(): Promise<number> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video')
      return video ? video.currentTime : 0
    })
  }

  /**
   * Wait for specific time in video
   */
  async waitForVideoTime(targetTime: number, tolerance = 0.5): Promise<void> {
    await this.page.waitForFunction(
      ({ target, tol }) => {
        const video = document.querySelector('video')
        if (!video) return false
        return Math.abs(video.currentTime - target) <= tol
      },
      { target: targetTime, tol: tolerance },
      { timeout: 10000 }
    )
  }

  /**
   * Check subtitle display
   */
  async getCurrentSubtitle(): Promise<string> {
    const subtitle = await this.page.textContent('[data-testid="current-subtitle"]')
    return subtitle || ''
  }

  /**
   * Test keyboard shortcuts
   */
  async testKeyboardShortcut(key: string): Promise<void> {
    await this.page.keyboard.press(key)
    await this.page.waitForTimeout(300)
  }

  /**
   * Get page reference for advanced operations
   */
  getPage(): Page {
    return this.page
  }

  /**
   * Close the app
   */
  async close(): Promise<void> {
    await this.page.close()
  }
}
