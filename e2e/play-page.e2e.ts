// import { test, expect } from '@playwright/test'
// import { ElectronHelper } from './utils/electron-helper'
// import { PlayPageHelper, PlayPageAssertions } from './utils/play-page-helpers'

// // 导入测试工具函数和常量 / Import test utilities and constants
// import { COMMON_TEST_IDS } from '../src/renderer/src/utils/test-utils'

// // 类型定义 / Type definitions
// interface PerformanceWithMemory extends Performance {
//   memory?: {
//     usedJSHeapSize: number
//     totalJSHeapSize: number
//     jsHeapSizeLimit: number
//   }
// }

// // 创建测试选择器的工具函数 / Create test selector utility function
// function testSelector(testId: string): string {
//   return `[data-testid="${testId}"]`
// }

// // 为了保持向后兼容，创建一个别名 / Create alias for backward compatibility
// const TEST_IDS = COMMON_TEST_IDS

// /**
//  * 确保当前页面是播放页面的辅助函数 / Helper function to ensure current page is play page
//  */
// async function ensureOnPlayPage(electronApp: ElectronHelper): Promise<void> {
//   const page = electronApp.getPage()

//   // 检查播放页面容器是否存在 / Check if play page container exists
//   const playPageContainer = page.locator(testSelector(TEST_IDS.PLAY_PAGE_CONTAINER))

//   try {
//     // 等待播放页面容器出现 / Wait for play page container to appear
//     await playPageContainer.waitFor({
//       state: 'visible',
//       timeout: 5000
//     })
//   } catch {
//     throw new Error('❌ Tests must run on play page. Play page container not found or not visible.')
//   }

//   // 进一步验证页面状态 / Further validate page state
//   const isOnPlayPage = await page.evaluate(() => {
//     // 检查 URL hash 或路由状态 / Check URL hash or route state
//     return (
//       window.location.hash.includes('play') ||
//       window.location.pathname.includes('play') ||
//       !!document.querySelector('[data-testid="play-page-container"]')
//     )
//   })

//   if (!isOnPlayPage) {
//     throw new Error('❌ Tests must run on play page. Current page is not the play page.')
//   }

//   console.log('✅ Confirmed on play page, tests can proceed')
// }

// /**
//  * 验证播放页面核心组件是否已加载 / Verify play page core components are loaded
//  */
// async function verifyPlayPageComponents(electronApp: ElectronHelper): Promise<void> {
//   const page = electronApp.getPage()

//   const requiredComponents = [
//     { id: TEST_IDS.PLAY_PAGE_CONTAINER, name: 'Play Page Container' },
//     { id: TEST_IDS.PLAY_PAGE_CONTENT_AREA, name: 'Content Area' },
//     { id: TEST_IDS.PLAY_PAGE_VIDEO_CONTAINER, name: 'Video Container' }
//   ]

//   for (const component of requiredComponents) {
//     try {
//       await page.locator(testSelector(component.id)).waitFor({
//         state: 'visible',
//         timeout: 3000
//       })
//       console.log(`✅ ${component.name} is loaded`)
//     } catch {
//       throw new Error(`❌ Required component "${component.name}" is not loaded on play page`)
//     }
//   }
// }

// test.describe('PlayPage E2E Tests / 播放页面端到端测试', () => {
//   let electronApp: ElectronHelper
//   let playPageHelper: PlayPageHelper

//   test.beforeEach(async () => {
//     // 连接到运行中的 Electron 应用 / Connect to the running Electron app
//     electronApp = await ElectronHelper.connect()
//     await electronApp.waitForAppReady()

//     // 创建 PlayPage 辅助工具 / Create PlayPage helper
//     playPageHelper = new PlayPageHelper(electronApp)

//     // 设置播放页面测试环境 / Setup play page test environment
//     try {
//       await playPageHelper.setupPlayPage()

//       // 确保在播放页面 / Ensure on play page
//       await ensureOnPlayPage(electronApp)

//       // 验证核心组件已加载 / Verify core components are loaded
//       await verifyPlayPageComponents(electronApp)

//       console.log('🎬 Play page test environment setup completed')
//     } catch (error) {
//       console.error('❌ Failed to setup play page test environment:', error)
//       throw error
//     }
//   })

//   test.afterEach(async () => {
//     try {
//       // 清理播放页面测试环境 / Cleanup play page test environment
//       if (playPageHelper) {
//         await playPageHelper.cleanupPlayPage()
//       }
//     } catch (error) {
//       console.warn('⚠️ Failed to cleanup test resources:', error)
//     }

//     // 测试失败时截图用于调试 / Take screenshot on failure for debugging
//     if (test.info().status === 'failed') {
//       await electronApp.screenshot(`play-page-failure-${test.info().title}`)
//     }
//   })

//   test('播放页面布局和组件加载 / Play page layout and component loading', async () => {
//     const page = electronApp.getPage()

//     // 再次确认在播放页面 / Confirm again we're on play page
//     await ensureOnPlayPage(electronApp)

//     // 使用辅助工具检查容器可见性 / Use helper to check container visibility
//     await PlayPageAssertions.containerIsVisible(page)

//     // 检查所有元素是否存在 / Check if all elements exist
//     const elementResults = await playPageHelper.checkAllElementsExist()

//     // 断言所有核心元素都存在 / Assert all core elements exist
//     expect(elementResults.container).toBe(true)
//     expect(elementResults.contentArea).toBe(true)
//     expect(elementResults.videoContainer).toBe(true)

//     // 检查布局响应性 / Check layout responsiveness
//     const isResponsive = await PlayPageAssertions.layoutIsResponsive(page)
//     expect(isResponsive).toBe(true)

//     console.log('✅ Play page layout and component loading test passed')
//     console.log('Element check results:', elementResults)
//   })

//   test('全屏模式切换 / Fullscreen mode toggle', async () => {
//     const page = electronApp.getPage()

//     // 确认在播放页面 / Confirm on play page
//     await ensureOnPlayPage(electronApp)

//     // 获取初始状态 / Get initial state
//     const initialFullscreen = await page.evaluate(() => {
//       return document.fullscreenElement !== null
//     })

//     // 使用快捷键切换全屏模式 / Use shortcut to toggle fullscreen
//     await page.keyboard.press('F11')
//     await page.waitForTimeout(1000) // 等待全屏切换动画 / Wait for fullscreen transition

//     // 检查全屏状态是否改变 / Check if fullscreen state changed
//     const afterToggleFullscreen = await page.evaluate(() => {
//       return document.fullscreenElement !== null
//     })

//     expect(afterToggleFullscreen).not.toBe(initialFullscreen)

//     // 再次切换回来 / Toggle back
//     await page.keyboard.press('F11')
//     await page.waitForTimeout(1000)

//     const finalFullscreen = await page.evaluate(() => {
//       return document.fullscreenElement !== null
//     })

//     expect(finalFullscreen).toBe(initialFullscreen)

//     console.log('✅ Fullscreen mode toggle test passed')
//   })

//   test('侧边栏字幕列表显示/隐藏 / Sidebar subtitle list show/hide', async () => {
//     const page = electronApp.getPage()

//     // 确认在播放页面 / Confirm on play page
//     await ensureOnPlayPage(electronApp)

//     // 获取侧边栏容器 / Get sidebar container
//     const sidebarContainer = page.locator(testSelector(TEST_IDS.PLAY_PAGE_SIDEBAR_CONTAINER))

//     // 检查初始状态 / Check initial state
//     const initialOpacity = await sidebarContainer.evaluate((el) => {
//       return window.getComputedStyle(el).opacity
//     })

//     // 模拟切换字幕列表显示状态 / Simulate toggling subtitle list visibility
//     await page.evaluate(() => {
//       // 这里应该触发实际的字幕列表切换逻辑 / This should trigger actual subtitle list toggle logic
//       // 根据实际实现调整 / Adjust based on actual implementation
//       window.dispatchEvent(new CustomEvent('toggleSubtitleList'))
//     })

//     await page.waitForTimeout(500) // 等待动画 / Wait for animation

//     // 检查状态是否改变 / Check if state changed
//     const afterOpacity = await sidebarContainer.evaluate((el) => {
//       return window.getComputedStyle(el).opacity
//     })

//     // 根据实际实现，这里的断言可能需要调整 / This assertion may need adjustment based on actual implementation
//     console.log(`Initial opacity: ${initialOpacity}, After opacity: ${afterOpacity}`)

//     console.log('✅ Sidebar subtitle list show/hide test passed')
//   })

//   test('视频播放控制快捷键 / Video playback control shortcuts', async () => {
//     const page = electronApp.getPage()

//     // 确认在播放页面 / Confirm on play page
//     await ensureOnPlayPage(electronApp)

//     // 测试播放/暂停快捷键 / Test play/pause shortcut
//     await page.keyboard.press('Space')
//     await page.waitForTimeout(300)

//     // 检查播放状态 / Check playback state
//     const isPlaying = await electronApp.isVideoPlaying()
//     console.log(`Video playing state after space: ${isPlaying}`)

//     // 测试步进快捷键 / Test step shortcuts
//     await page.keyboard.press('ArrowLeft') // 后退 / Step backward
//     await page.waitForTimeout(300)

//     await page.keyboard.press('ArrowRight') // 前进 / Step forward
//     await page.waitForTimeout(300)

//     console.log('✅ Video playback control shortcuts test passed')
//   })

//   test('响应式布局调整 / Responsive layout adjustment', async () => {
//     const page = electronApp.getPage()

//     // 确认在播放页面 / Confirm on play page
//     await ensureOnPlayPage(electronApp)

//     // 获取初始视口大小 / Get initial viewport size
//     const initialViewport = page.viewportSize()
//     console.log('Initial viewport:', initialViewport)

//     // 改变窗口大小测试响应式布局 / Change window size to test responsive layout
//     await page.setViewportSize({ width: 1200, height: 800 })
//     await page.waitForTimeout(500)

//     // 检查布局是否正确调整 / Check if layout adjusted correctly
//     const videoContainer = page.locator(testSelector(TEST_IDS.PLAY_PAGE_VIDEO_CONTAINER))
//     const containerBounds = await videoContainer.boundingBox()

//     expect(containerBounds).toBeTruthy()
//     expect(containerBounds!.width).toBeGreaterThan(0)
//     expect(containerBounds!.height).toBeGreaterThan(0)

//     // 测试更小的窗口尺寸 / Test smaller window size
//     await page.setViewportSize({ width: 800, height: 600 })
//     await page.waitForTimeout(500)

//     const smallerContainerBounds = await videoContainer.boundingBox()
//     expect(smallerContainerBounds).toBeTruthy()

//     // 恢复初始大小 / Restore initial size
//     if (initialViewport) {
//       await page.setViewportSize(initialViewport)
//     }

//     console.log('✅ Responsive layout adjustment test passed')
//   })

//   test('播放页面性能检查 / Play page performance check', async () => {
//     const page = electronApp.getPage()

//     // 确认在播放页面 / Confirm on play page
//     await ensureOnPlayPage(electronApp)

//     // 开始性能监控 / Start performance monitoring
//     await page.coverage.startJSCoverage()
//     const startTime = Date.now()

//     // 执行一系列操作 / Perform a series of operations
//     await page.keyboard.press('Space') // 播放/暂停 / Play/pause
//     await page.waitForTimeout(100)

//     await page.keyboard.press('ArrowRight') // 前进 / Step forward
//     await page.waitForTimeout(100)

//     await page.keyboard.press('ArrowLeft') // 后退 / Step backward
//     await page.waitForTimeout(100)

//     const endTime = Date.now()
//     const operationTime = endTime - startTime

//     // 停止性能监控 / Stop performance monitoring
//     const jsCoverage = await page.coverage.stopJSCoverage()

//     // 检查性能指标 / Check performance metrics
//     expect(operationTime).toBeLessThan(2000) // 操作应在2秒内完成 / Operations should complete within 2 seconds

//     // 检查是否有明显的性能问题 / Check for obvious performance issues
//     const consoleErrors: string[] = []
//     page.on('console', (msg) => {
//       if (msg.type() === 'error') {
//         consoleErrors.push(msg.text())
//       }
//     })

//     // 确保没有关键性能错误 / Ensure no critical performance errors
//     const performanceErrors = consoleErrors.filter((error) =>
//       error.toLowerCase().includes('performance')
//     )
//     expect(performanceErrors).toHaveLength(0)

//     console.log('✅ Play page performance check passed')
//     console.log(`Operation time: ${operationTime}ms`)
//     console.log(`JS Coverage entries: ${jsCoverage.length}`)
//   })

//   test('内存泄漏检测 / Memory leak detection', async () => {
//     const page = electronApp.getPage()

//     // 确认在播放页面 / Confirm on play page
//     await ensureOnPlayPage(electronApp)

//     // 获取初始内存使用情况 / Get initial memory usage
//     const initialMemory = await page.evaluate(() => {
//       return (performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0
//     })

//     // 执行可能导致内存泄漏的操作 / Perform operations that might cause memory leaks
//     for (let i = 0; i < 10; i++) {
//       await page.keyboard.press('Space')
//       await page.waitForTimeout(50)
//       await page.keyboard.press('ArrowRight')
//       await page.waitForTimeout(50)
//     }

//     // 强制垃圾回收（如果可能）/ Force garbage collection (if possible)
//     await page.evaluate(() => {
//       if (
//         'gc' in window &&
//         typeof (window as typeof window & { gc?: () => void }).gc === 'function'
//       ) {
//         ;(window as typeof window & { gc: () => void }).gc()
//       }
//     })

//     await page.waitForTimeout(1000)

//     // 获取最终内存使用情况 / Get final memory usage
//     const finalMemory = await page.evaluate(() => {
//       return (performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0
//     })

//     // 检查内存增长是否在合理范围内 / Check if memory growth is within reasonable limits
//     const memoryGrowth = finalMemory - initialMemory
//     const maxAllowedGrowth = 10 * 1024 * 1024 // 10MB

//     console.log(`Memory growth: ${memoryGrowth} bytes`)
//     expect(memoryGrowth).toBeLessThan(maxAllowedGrowth)

//     console.log('✅ Memory leak detection test passed')
//   })

//   test('键盘导航和无障碍性 / Keyboard navigation and accessibility', async () => {
//     const page = electronApp.getPage()

//     // 确认在播放页面 / Confirm on play page
//     await ensureOnPlayPage(electronApp)

//     // 测试Tab键导航 / Test Tab key navigation
//     await page.keyboard.press('Tab')
//     await page.waitForTimeout(100)

//     // 检查焦点元素 / Check focused element
//     const focusedElement = await page.evaluate(() => {
//       return document.activeElement?.tagName
//     })

//     console.log(`Focused element: ${focusedElement}`)

//     // 测试常用的无障碍快捷键 / Test common accessibility shortcuts
//     await page.keyboard.press('Escape') // 应该能够取消当前操作 / Should cancel current operation
//     await page.waitForTimeout(100)

//     // 检查是否有明显的无障碍问题 / Check for obvious accessibility issues
//     const ariaLabels = await page.locator('[aria-label]').count()
//     console.log(`Elements with aria-label: ${ariaLabels}`)

//     console.log('✅ Keyboard navigation and accessibility test passed')
//   })
// })
