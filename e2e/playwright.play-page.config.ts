import { defineConfig } from '@playwright/test'

/**
 * 专门用于播放页面测试的 Playwright 配置
 * Playwright configuration specifically for play page tests
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/play-page.e2e.ts',

  // 全局设置 / Global settings
  timeout: 60000, // 60秒超时 / 60 second timeout
  expect: {
    timeout: 10000 // 断言超时 / Assertion timeout
  },

  // 测试项目配置 / Test project configuration
  projects: [
    {
      name: 'play-page-tests',
      testMatch: '**/play-page.e2e.ts',

      // 播放页面测试特定设置 / Play page test specific settings
      use: {
        // 确保测试在稳定的环境中运行 / Ensure tests run in stable environment
        actionTimeout: 5000,
        navigationTimeout: 10000,

        // 截图设置 / Screenshot settings
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        // 跟踪设置 / Trace settings
        trace: 'retain-on-failure'
      }
    }
  ],

  // 输出目录 / Output directories
  outputDir: './e2e-results/play-page-tests',

  // 报告设置 / Reporter settings
  reporter: [
    ['html', { outputFolder: './e2e-report/play-page' }],
    ['json', { outputFile: './e2e-results/play-page-results.json' }],
    ['line']
  ],

  // 全局设置 / Global setup
  globalSetup: undefined, // 不需要全局设置，因为连接到现有应用 / No global setup needed as we connect to existing app
  globalTeardown: undefined,

  // Workers 设置 / Workers settings
  workers: 1, // 单线程运行播放页面测试 / Single-threaded for play page tests
  fullyParallel: false, // 禁用完全并行 / Disable full parallelism

  // 重试设置 / Retry settings
  retries: 2, // 失败时重试2次 / Retry 2 times on failure

  // 其他设置 / Other settings
  forbidOnly: !!process.env.CI, // CI 环境禁用 only / Forbid only in CI

  // 自定义元数据 / Custom metadata
  metadata: {
    testType: 'play-page-e2e',
    description: 'End-to-end tests specifically for the play page functionality',
    requirements: [
      'Application must be running with CDP enabled on port 9222',
      'Test video files must be available',
      'Application must be able to navigate to play page'
    ]
  }
})
