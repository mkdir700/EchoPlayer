export const isMac = process.platform === 'darwin'
export const isWin = process.platform === 'win32'
export const isLinux = process.platform === 'linux'
export const isDev = process.env.NODE_ENV === 'development'
export const isPortable = isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env

// WSL detection
export const isWSL = (() => {
  if (!isLinux) return false

  try {
    // Check for WSL specific files and environment variables
    const fs = require('fs')

    // WSL version detection
    if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
      return true
    }

    // Check /proc/version for WSL signatures
    if (fs.existsSync('/proc/version')) {
      const version = fs.readFileSync('/proc/version', 'utf8')
      return version.toLowerCase().includes('microsoft') || version.toLowerCase().includes('wsl')
    }

    return false
  } catch {
    return false
  }
})()
