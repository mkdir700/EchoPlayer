import { Page } from '@playwright/test'
import path from 'path'

/**
 * 文件选择器助手类 / File chooser helper class
 * 用于在 e2e 测试中自动处理文件选择对话框
 */
export class FileChooserHelper {
  constructor(private page: Page) {}

  /**
   * 等待并处理文件选择器 / Wait for and handle file chooser
   * @param testVideoFile 测试视频文件路径（可选）/ Test video file path (optional)
   * @returns Promise that resolves when file is selected
   */
  async waitForFileChooserAndSelect(testVideoFile?: string): Promise<void> {
    // 默认使用项目根目录下的测试视频文件 / Default to test video file in project root
    const defaultTestVideo = testVideoFile || this.getDefaultTestVideoPath()

    console.log('🎯 Waiting for file chooser to appear...')

    try {
      // 等待文件选择器出现并自动选择文件 / Wait for file chooser and auto-select file
      const fileChooser = await this.page.waitForEvent('filechooser', { timeout: 10000 })
      console.log('🎯 File chooser detected, auto-selecting test video:', defaultTestVideo)

      // 检查测试文件是否存在 / Check if test file exists
      const fs = await import('fs')
      if (!fs.existsSync(defaultTestVideo)) {
        console.warn('⚠️ Test video file does not exist, creating it...')
        await FileChooserHelper.createTestVideoIfNeeded()
      }

      await fileChooser.setFiles(defaultTestVideo)
      console.log('✅ Test video file selected successfully')
    } catch (error) {
      console.error('❌ Failed to handle file chooser:', error)
      throw error
    }
  }

  /**
   * 设置自动文件选择监听器 / Setup automatic file chooser listener
   * @param testVideoFile 测试视频文件路径（可选）/ Test video file path (optional)
   * @deprecated Use waitForFileChooserAndSelect instead
   */
  async setupAutoFileChooser(testVideoFile?: string): Promise<void> {
    // 默认使用项目根目录下的测试视频文件 / Default to test video file in project root
    const defaultTestVideo = testVideoFile || this.getDefaultTestVideoPath()

    // 监听文件选择器事件 / Listen for file chooser events
    this.page.on('filechooser', async (fileChooser) => {
      console.log('🎯 File chooser detected, auto-selecting test video:', defaultTestVideo)

      try {
        // 自动选择测试视频文件 / Auto-select test video file
        await fileChooser.setFiles(defaultTestVideo)
        console.log('✅ Test video file selected successfully')
      } catch (error) {
        console.error('❌ Failed to set test video file:', error)
        // 如果默认文件不存在，创建一个空的选择 / If default file doesn't exist, make empty selection
        await fileChooser.setFiles([])
      }
    })
  }

  /**
   * 模拟 Electron 文件对话框返回真实文件路径 / Mock Electron file dialog to return real file path
   * @param testVideoFile 测试视频文件路径（可选）/ Test video file path (optional)
   */
  async mockElectronFileDialog(testVideoFile?: string): Promise<void> {
    const defaultTestVideo = testVideoFile || this.getDefaultTestVideoPath()

    console.log('🎯 Mocking Electron file dialog with real test video:', defaultTestVideo)

    try {
      // 确保测试文件存在 / Ensure test file exists
      const fs = await import('fs')
      if (!fs.existsSync(defaultTestVideo)) {
        throw new Error(`Test video file does not exist: ${defaultTestVideo}`)
      }

      console.log('✅ Real test video file found:', defaultTestVideo)

      // 只模拟文件对话框，返回真实文件路径，其他 API 保持原样
      // Only mock file dialog to return real file path, keep other APIs unchanged
      await this.page.evaluate((testVideoPath) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any
        if (win.api && win.api.fileSystem) {
          // 只保存文件对话框的原始函数 / Only save original file dialog function
          const originalOpenFileDialog = win.api.fileSystem.openFileDialog

          // 模拟文件选择对话框返回真实文件路径 / Mock file dialog to return real file path
          win.api.fileSystem.openFileDialog = async () => {
            console.log(
              '🎯 Mocked file dialog called, returning real test video path:',
              testVideoPath
            )
            return {
              canceled: false,
              filePaths: [testVideoPath]
            }
          }

          // 保存原始函数用于恢复 / Save original function for restoration
          win.__originalFileSystemAPI = {
            openFileDialog: originalOpenFileDialog
          }

          console.log('✅ Electron file dialog mocked to return real file')
        }
      }, defaultTestVideo)

      console.log('✅ Electron file dialog mocked successfully')
    } catch (error) {
      console.error('❌ Failed to mock Electron file dialog:', error)
      throw error
    }
  }

  /**
   * 恢复原始的 Electron 文件对话框 API / Restore original Electron file dialog API
   */
  async restoreElectronFileDialog(): Promise<void> {
    try {
      await this.page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any
        if (win.__originalFileSystemAPI && win.api && win.api.fileSystem) {
          // 恢复文件对话框原始函数 / Restore original file dialog function
          win.api.fileSystem.openFileDialog = win.__originalFileSystemAPI.openFileDialog

          delete win.__originalFileSystemAPI
          console.log('✅ Electron file dialog API restored')
        }
      })
    } catch (error) {
      console.warn('⚠️ Failed to restore Electron file dialog API:', error)
    }
  }

  /**
   * 点击按钮并自动处理文件选择器 / Click button and auto-handle file chooser
   * @param buttonSelector 按钮选择器 / Button selector
   * @param testVideoFile 测试视频文件路径（可选）/ Test video file path (optional)
   */
  async clickButtonAndSelectFile(buttonSelector: string, testVideoFile?: string): Promise<void> {
    console.log('🎯 Setting up file dialog mock and clicking button:', buttonSelector)

    try {
      // 先设置模拟的文件对话框 / First setup mocked file dialog
      await this.mockElectronFileDialog(testVideoFile)

      // 然后点击按钮 / Then click the button
      await this.page.click(buttonSelector)

      // 等待一段时间让应用处理文件选择 / Wait for app to process file selection
      await this.page.waitForTimeout(2000)

      console.log('✅ Button clicked and file dialog mocked')
    } catch (error) {
      console.error('❌ Failed to click button and handle file selection:', error)
      throw error
    }
  }

  /**
   * 移除文件选择器监听器 / Remove file chooser listener
   */
  removeFileChooserListener(): void {
    this.page.removeAllListeners('filechooser')
  }

  /**
   * 获取默认测试视频文件路径 / Get default test video file path
   */
  private getDefaultTestVideoPath(): string {
    // 使用 e2e 目录下的真实测试视频文件 / Use real test video file in e2e directory
    return path.join(process.cwd(), 'e2e', 'assets', 'test-video.mp4')
  }

  /**
   * 验证真实测试视频文件是否存在 / Verify real test video file exists
   */
  static async verifyTestVideoExists(): Promise<string> {
    const fs = await import('fs')
    const testVideoPath = path.join(process.cwd(), 'e2e', 'assets', 'test-video.mp4')

    // 检查文件是否存在 / Check if file exists
    if (!fs.existsSync(testVideoPath)) {
      throw new Error(
        `Real test video file not found: ${testVideoPath}. Please create it first using:\nffmpeg -f lavfi -i testsrc2=duration=10:size=320x240:rate=30 -f lavfi -i sine=frequency=1000:duration=10 -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest e2e/assets/test-video.mp4`
      )
    }

    const stats = fs.statSync(testVideoPath)
    console.log(
      `✅ Real test video file found: ${testVideoPath} (${(stats.size / 1024).toFixed(1)} KB)`
    )

    return testVideoPath
  }

  /**
   * 清理测试视频文件 / Cleanup test video file
   */
  static async cleanupTestVideo(): Promise<void> {
    const fs = await import('fs')
    const testVideoPath = path.join(process.cwd(), 'assets', 'test-video.mp4')

    try {
      if (fs.existsSync(testVideoPath)) {
        fs.unlinkSync(testVideoPath)
        console.log('✅ Cleaned up test video file')
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup test video file:', error)
    }
  }

  /**
   * 使用 input[type="file"] 元素直接设置文件 / Use input[type="file"] element to set files directly
   * 这是另一种处理文件上传的方法，如果文件选择器事件不起作用 / Alternative method if file chooser events don't work
   */
  async setFilesOnInput(selector: string, filePaths: string[]): Promise<void> {
    const fileInput = this.page.locator(selector)
    await fileInput.setInputFiles(filePaths)
  }

  /**
   * 模拟拖拽文件到指定元素 / Simulate drag and drop file to specified element
   */
  async dragAndDropFile(targetSelector: string, filePath: string): Promise<void> {
    // 创建 DataTransfer 对象模拟文件拖拽 / Create DataTransfer object to simulate file drag
    const dataTransfer = await this.page.evaluateHandle(() => {
      const dt = new DataTransfer()
      // 注意：在实际的浏览器环境中，我们无法直接创建 File 对象包含真实文件
      // 这里只是为了演示，实际测试中可能需要使用其他方法
      // Note: In actual browser environment, we can't directly create File object with real file
      // This is just for demonstration, actual testing might need other methods
      return dt
    })

    const targetElement = this.page.locator(targetSelector)

    // 模拟拖拽事件序列 / Simulate drag event sequence
    await targetElement.dispatchEvent('dragenter', { dataTransfer })
    await targetElement.dispatchEvent('dragover', { dataTransfer })
    await targetElement.dispatchEvent('drop', { dataTransfer })

    console.log(`✅ Simulated drag and drop for file: ${filePath}`)
  }
}

/**
 * 创建文件选择器助手的便捷函数 / Convenience function to create file chooser helper
 */
export function createFileChooserHelper(page: Page): FileChooserHelper {
  return new FileChooserHelper(page)
}

/**
 * 测试文件路径常量 / Test file path constants
 */
export const TEST_VIDEO_PATHS = {
  MP4: path.join(process.cwd(), 'assets', 'test-video.mp4'),
  // 可以添加更多测试文件格式 / Can add more test file formats
  AVI: path.join(process.cwd(), 'assets', 'test-video.avi'),
  MOV: path.join(process.cwd(), 'assets', 'test-video.mov')
} as const
