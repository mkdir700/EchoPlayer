import { FullConfig } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import { resolve } from 'path'
import { existsSync } from 'fs'
import os from 'os'

let electronProcess: ChildProcess | null = null

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('🚀 Starting Electron app for E2E testing...')

  // Build the application first
  console.log('📦 Building application...')

  // Check if build output exists
  const buildOutputPath = resolve(__dirname, '../out/main/index.js')
  if (!existsSync(buildOutputPath)) {
    throw new Error(
      `Build output not found at ${buildOutputPath}. Please run 'npm run build' first.`
    )
  }

  // Start Electron app
  const isWindows = os.platform() === 'win32'
  const isLinux = os.platform() === 'linux'
  const electronBinary = isWindows ? 'electron.cmd' : 'electron'
  const electronPath = resolve(__dirname, '../node_modules/.bin', electronBinary)
  const appPath = buildOutputPath

  console.log(`Using Electron binary: ${electronPath}`)
  console.log(`App path: ${appPath}`)

  // More comprehensive debugging flags for Electron
  const electronArgs = [
    appPath,
    '--remote-debugging-port=9222',
    '--enable-logging',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--force-device-scale-factor=1'
  ]

  // Add Linux-specific arguments for headless environment
  if (isLinux) {
    electronArgs.push(
      '--headless',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--use-gl=swiftshader'
    )
  }

  console.log(`Electron args: ${electronArgs.join(' ')}`)

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'test',
    ELECTRON_IS_DEV: '0',
    ELECTRON_ENABLE_LOGGING: '1'
  }

  // Set DISPLAY for Linux environments if not already set
  if (isLinux && !process.env.DISPLAY) {
    env.DISPLAY = ':99'
  }

  electronProcess = spawn(electronPath, electronArgs, {
    stdio: 'pipe',
    shell: isWindows,
    env
  })

  // Better error handling and logging
  if (!electronProcess) {
    throw new Error('Failed to start Electron process')
  }

  // Wait for app to start with better detection
  await new Promise<void>((resolve, reject) => {
    let appStarted = false
    let stdoutData = ''
    let stderrData = ''

    const timeout = setTimeout(() => {
      if (!appStarted) {
        console.error('=== STDOUT OUTPUT ===')
        console.error(stdoutData)
        console.error('=== STDERR OUTPUT ===')
        console.error(stderrData)
        reject(new Error('Electron app startup timeout'))
      }
    }, 30000)

    electronProcess!.stdout?.on('data', (data) => {
      const output = data.toString()
      stdoutData += output
      console.log(`Electron stdout: ${output}`)

      // Look for various startup indicators
      if (
        output.includes('ready') ||
        output.includes('loaded') ||
        output.includes('DevTools') ||
        output.includes('listening on port 9222')
      ) {
        if (!appStarted) {
          appStarted = true
          clearTimeout(timeout)
          resolve()
        }
      }
    })

    electronProcess!.stderr?.on('data', (data) => {
      const output = data.toString()
      stderrData += output
      console.error(`Electron stderr: ${output}`)

      // Don't reject on stderr - Electron outputs a lot of warnings
      // but still check for critical errors
      if (output.includes('Fatal error') || output.includes('EADDRINUSE')) {
        clearTimeout(timeout)
        reject(new Error(`Electron startup error: ${output}`))
      }
    })

    electronProcess!.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })

    electronProcess!.on('exit', (code, signal) => {
      if (!appStarted) {
        clearTimeout(timeout)
        reject(new Error(`Electron process exited early with code ${code}, signal ${signal}`))
      }
    })

    // Give it some time to start even without specific ready signal
    setTimeout(() => {
      if (!appStarted) {
        console.log('⏱️ No explicit ready signal, but assuming app started after 7 seconds')
        appStarted = true
        clearTimeout(timeout)
        resolve()
      }
    }, 7000)
  })

  console.log('✅ Electron app started successfully')

  // Verify CDP connection is available
  try {
    console.log('🔍 Verifying CDP connection...')
    const response = await fetch('http://localhost:9222/json/version', {
      signal: AbortSignal.timeout(5000)
    })
    const data = await response.json()
    console.log('✅ CDP connection verified:', data)
  } catch (error) {
    console.warn('⚠️ CDP connection check failed, but continuing:', error)
  }

  // Store process reference globally
  ;(globalThis as { __ELECTRON_PROCESS__?: ChildProcess }).__ELECTRON_PROCESS__ = electronProcess
}

export default globalSetup
