/**
 * Media Server 和 Python Venv 相关的共享类型定义
 */

/**
 * Media Server 状态
 */
export type MediaServerStatus =
  | 'stopped' // 已停止
  | 'starting' // 正在启动
  | 'running' // 运行中
  | 'stopping' // 正在停止
  | 'error' // 错误

/**
 * Media Server 信息
 */
export interface MediaServerInfo {
  status: MediaServerStatus
  pid?: number
  port?: number
  startTime?: number
  uptime?: number
  error?: string
}

/**
 * Python 虚拟环境状态
 */
export interface PythonVenvInfo {
  exists: boolean
  venvPath?: string
  pythonPath?: string
  pythonVersion?: string
  hasProjectConfig: boolean
  hasLockfile: boolean
}

/**
 * 环境安装进度
 */
export interface InstallProgress {
  stage: 'init' | 'venv' | 'deps' | 'completed' | 'error'
  message: string
  percent: number
}
