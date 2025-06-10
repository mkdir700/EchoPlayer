export function isWindows(): boolean {
  // 使用 userAgent 替代已弃用的 platform / Use userAgent instead of deprecated platform
  return navigator.userAgent.toLowerCase().includes('win')
}

export function isUnix(): boolean {
  // 使用 userAgent 替代已弃用的 platform / Use userAgent instead of deprecated platform
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('linux') || userAgent.includes('mac')
}
