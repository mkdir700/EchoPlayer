import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'path'

/**
 * Playwright configuration for Electron E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['junit', { outputFile: 'e2e-results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'electron',
      use: {
        // Electron specific configuration
        ...devices['Desktop Chrome']
      },
      testMatch: '**/*.e2e.{js,ts}'
    }
  ],

  /* Global setup and teardown */
  globalSetup: resolve(__dirname, 'e2e/global-setup.ts'),
  globalTeardown: resolve(__dirname, 'e2e/global-teardown.ts'),

  /* Output directories */
  outputDir: 'e2e-results'
})
