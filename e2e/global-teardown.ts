import { FullConfig } from '@playwright/test'
import { ChildProcess } from 'child_process'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')

  // Get the electron process from global storage
  const electronProcess: ChildProcess | undefined = (
    globalThis as { __ELECTRON_PROCESS__?: ChildProcess }
  ).__ELECTRON_PROCESS__

  if (electronProcess && !electronProcess.killed) {
    console.log('🛑 Stopping Electron app...')

    try {
      // Try graceful shutdown first
      console.log('📤 Sending SIGTERM signal...')
      electronProcess.kill('SIGTERM')

      // Wait for graceful shutdown
      const gracefulShutdown = await Promise.race([
        new Promise<boolean>((resolve) => {
          electronProcess.on('exit', () => {
            console.log('✅ Electron app stopped gracefully')
            resolve(true)
          })
        }),
        new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log('⏰ Graceful shutdown timeout')
            resolve(false)
          }, 5000)
        })
      ])

      // Force kill if graceful shutdown failed
      if (!gracefulShutdown && !electronProcess.killed) {
        console.log('⚡ Force killing Electron app...')
        electronProcess.kill('SIGKILL')

        // Final wait for force kill
        await new Promise<void>((resolve) => {
          const forceTimeout = setTimeout(() => {
            console.log('⚠️ Force kill timeout, process may still be running')
            resolve()
          }, 3000)

          electronProcess.on('exit', () => {
            clearTimeout(forceTimeout)
            console.log('✅ Electron app force-killed successfully')
            resolve()
          })
        })
      }
    } catch (error) {
      console.error('❌ Error during Electron app cleanup:', error)
    }
  } else if (electronProcess?.killed) {
    console.log('ℹ️ Electron process was already killed')
  } else {
    console.log('ℹ️ No Electron process found to clean up')
  }

  console.log('🏁 E2E test environment cleanup completed')
}

export default globalTeardown
