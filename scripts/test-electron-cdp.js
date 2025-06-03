const { spawn } = require('child_process')
const { resolve } = require('path')
const os = require('os')

async function testElectronCDP() {
  console.log('🧪 Testing Electron CDP connection...')

  const isWindows = os.platform() === 'win32'
  const electronBinary = isWindows ? 'electron.cmd' : 'electron'
  const electronPath = resolve(__dirname, '../node_modules/.bin', electronBinary)
  const appPath = resolve(__dirname, '../out/main/index.js')

  console.log(`Electron path: ${electronPath}`)
  console.log(`App path: ${appPath}`)

  const electronArgs = [
    appPath,
    '--remote-debugging-port=9222',
    '--enable-logging',
    '--disable-web-security',
    '--no-sandbox'
  ]

  console.log(`Starting Electron with args: ${electronArgs.join(' ')}`)

  const electronProcess = spawn(electronPath, electronArgs, {
    stdio: 'pipe',
    shell: isWindows,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_IS_DEV: '0',
      ELECTRON_ENABLE_LOGGING: '1'
    }
  })

  electronProcess.stdout.on('data', (data) => {
    console.log(`[ELECTRON STDOUT] ${data}`)
  })

  electronProcess.stderr.on('data', (data) => {
    console.log(`[ELECTRON STDERR] ${data}`)
  })

  // Wait for startup
  await new Promise((resolve) => setTimeout(resolve, 5000))

  // Test CDP connection
  try {
    console.log('🔍 Testing CDP endpoints...')

    // Test version endpoint
    const versionResponse = await fetch('http://localhost:9222/json/version')
    if (versionResponse.ok) {
      const version = await versionResponse.json()
      console.log('✅ Version endpoint working:', version)
    } else {
      console.log('❌ Version endpoint failed:', versionResponse.status)
    }

    // Test list endpoint
    const listResponse = await fetch('http://localhost:9222/json/list')
    if (listResponse.ok) {
      const pages = await listResponse.json()
      console.log('✅ List endpoint working, pages:', pages.length)
      if (pages.length > 0) {
        console.log('First page:', pages[0])
      }
    } else {
      console.log('❌ List endpoint failed:', listResponse.status)
    }
  } catch (error) {
    console.log('❌ CDP connection failed:', error.message)
  }

  // Clean up
  console.log('🧹 Cleaning up...')
  electronProcess.kill('SIGTERM')

  setTimeout(() => {
    if (!electronProcess.killed) {
      electronProcess.kill('SIGKILL')
    }
    process.exit(0)
  }, 3000)
}

testElectronCDP().catch(console.error)
