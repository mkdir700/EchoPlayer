import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

import { loggerService } from './LoggerService'
import { uvBootstrapperService } from './UvBootstrapperService'

const logger = loggerService.withContext('PythonVenvService')

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

/**
 * Python 虚拟环境管理服务
 * 负责创建和管理 Media Server 的 Python 运行环境
 */
export class PythonVenvService {
  private mediaServerPath: string = ''
  private mediaServerCandidates: string[] = []
  private installProgress: InstallProgress | null = null

  constructor() {
    // 根据环境判断 media-server 路径
    // 开发环境: backend/
    // 生产环境: resources/media-server/
    const isDev = !app.isPackaged

    if (isDev) {
      this.mediaServerCandidates = [path.join(process.cwd(), 'backend')]
    } else {
      const resourcesRoot = process.resourcesPath || app.getAppPath()

      const packagedCandidates = [
        path.join(resourcesRoot, 'app.asar.unpacked', 'resources', 'media-server'),
        path.join(resourcesRoot, 'app.asar.unpacked', 'media-server'),
        path.join(resourcesRoot, 'media-server')
      ]

      // 去重并保留顺序
      this.mediaServerCandidates = Array.from(new Set(packagedCandidates))
    }

    this.mediaServerPath = this.resolveMediaServerPath()

    logger.info('PythonVenvService 初始化完成', {
      mediaServerPath: this.mediaServerPath,
      mediaServerCandidates: this.mediaServerCandidates,
      isDev,
      isPackaged: app.isPackaged
    })
  }

  /**
   * 根据候选路径解析实际可用的 media-server 目录
   */
  private resolveMediaServerPath(): string {
    const candidates =
      this.mediaServerCandidates.length > 0
        ? this.mediaServerCandidates
        : [path.join(process.cwd(), 'backend')]

    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          return candidate
        }
      } catch (error) {
        logger.debug('检测 media-server 路径失败', {
          candidate,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return candidates[0]
  }

  /**
   * 确保当前 media-server 路径有效
   */
  private ensureMediaServerPath(): string {
    const currentPath = this.mediaServerPath

    if (currentPath && fs.existsSync(currentPath)) {
      return currentPath
    }

    const resolvedPath = this.resolveMediaServerPath()

    if (resolvedPath !== currentPath) {
      logger.info('更新 Media Server 路径', {
        from: currentPath,
        to: resolvedPath
      })
    }

    this.mediaServerPath = resolvedPath
    return this.mediaServerPath
  }

  /**
   * 获取 media-server 路径
   */
  public getMediaServerPath(): string {
    return this.ensureMediaServerPath()
  }

  /**
   * 获取虚拟环境路径
   */
  public getVenvPath(): string {
    const mediaServerPath = this.ensureMediaServerPath()
    return path.join(mediaServerPath, '.venv')
  }

  /**
   * 获取 Python 解释器路径
   */
  public getPythonPath(): string {
    const venvPath = this.getVenvPath()
    const pythonExecutable = process.platform === 'win32' ? 'python.exe' : 'python'
    return path.join(venvPath, process.platform === 'win32' ? 'Scripts' : 'bin', pythonExecutable)
  }

  /**
   * 获取 pyproject.toml 路径
   */
  public getPyprojectPath(): string {
    const mediaServerPath = this.ensureMediaServerPath()
    return path.join(mediaServerPath, 'pyproject.toml')
  }

  /**
   * 获取 uv.lock 路径
   */
  public getUvLockPath(): string {
    const mediaServerPath = this.ensureMediaServerPath()
    return path.join(mediaServerPath, 'uv.lock')
  }

  /**
   * 检查虚拟环境状态
   */
  public async checkVenvInfo(): Promise<PythonVenvInfo> {
    try {
      const mediaServerPath = this.ensureMediaServerPath()
      const venvPath = this.getVenvPath()
      const pythonPath = this.getPythonPath()
      const pyprojectPath = this.getPyprojectPath()
      const uvLockPath = this.getUvLockPath()

      const venvExists = fs.existsSync(pythonPath)
      const hasProjectConfig = fs.existsSync(pyprojectPath)
      const hasLockfile = fs.existsSync(uvLockPath)

      let pythonVersion: string | undefined

      if (venvExists) {
        try {
          // 使用 uv 获取 Python 版本
          const uvPath = await uvBootstrapperService.getAvailableUvPath()
          if (uvPath) {
            const result = await this.executeCommand(
              uvPath,
              ['run', 'python', '--version'],
              mediaServerPath
            )
            const versionMatch = result.match(/Python (\S+)/)
            pythonVersion = versionMatch ? versionMatch[1] : undefined
          }
        } catch (error) {
          logger.warn('获取 Python 版本失败', { error })
        }
      }

      const info: PythonVenvInfo = {
        exists: venvExists,
        venvPath: venvExists ? venvPath : undefined,
        pythonPath: venvExists ? pythonPath : undefined,
        pythonVersion,
        hasProjectConfig,
        hasLockfile
      }

      logger.debug('虚拟环境状态检查完成', info)
      return info
    } catch (error) {
      logger.error('检查虚拟环境状态失败', {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        exists: false,
        hasProjectConfig: false,
        hasLockfile: false
      }
    }
  }

  /**
   * 初始化 Python 环境
   * 包括创建虚拟环境和安装依赖
   */
  public async initializeEnvironment(
    onProgress?: (progress: InstallProgress) => void,
    pythonVersion?: string
  ): Promise<boolean> {
    // 在新安装开始时清空旧的进度状态
    this.installProgress = null

    try {
      logger.info('开始初始化 Python 环境', { pythonVersion })

      const mediaServerPath = this.ensureMediaServerPath()

      // 检查 uv 是否可用
      const uvInfo = await uvBootstrapperService.checkUvInstallation()
      if (!uvInfo.exists) {
        throw new Error('UV 不可用，请先安装 UV')
      }

      // 检查 media-server 目录是否存在
      if (!fs.existsSync(mediaServerPath)) {
        throw new Error(
          `Media Server 目录不存在: ${mediaServerPath}; 候选路径: ${this.mediaServerCandidates.join(
            ', '
          )}`
        )
      }

      // 检查 pyproject.toml 是否存在
      const pyprojectPath = this.getPyprojectPath()
      if (!fs.existsSync(pyprojectPath)) {
        throw new Error(`pyproject.toml 不存在: ${pyprojectPath}`)
      }

      // 阶段 1: 创建虚拟环境
      this.updateProgress(
        {
          stage: 'venv',
          message: '正在创建 Python 虚拟环境...',
          percent: 30
        },
        onProgress
      )

      const venvCreated = await this.createVenv(pythonVersion)
      if (!venvCreated) {
        throw new Error('创建虚拟环境失败')
      }

      // 阶段 2: 安装依赖
      this.updateProgress(
        {
          stage: 'deps',
          message: '正在安装项目依赖...',
          percent: 60
        },
        onProgress
      )

      const depsInstalled = await this.installDependencies()
      if (!depsInstalled) {
        throw new Error('安装依赖失败')
      }

      // 完成
      this.updateProgress(
        {
          stage: 'completed',
          message: 'Python 环境初始化完成',
          percent: 100
        },
        onProgress
      )

      logger.info('Python 环境初始化成功')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.updateProgress(
        {
          stage: 'error',
          message: `初始化失败: ${errorMessage}`,
          percent: 0
        },
        onProgress
      )

      logger.error('Python 环境初始化失败', {
        error: errorMessage
      })

      return false
    }
  }

  /**
   * 创建虚拟环境
   */
  private async createVenv(pythonVersion?: string): Promise<boolean> {
    try {
      const mediaServerPath = this.ensureMediaServerPath()

      logger.info('创建虚拟环境', { pythonVersion, path: mediaServerPath })

      const uvPath = await uvBootstrapperService.getAvailableUvPath()
      if (!uvPath) {
        throw new Error('UV 不可用')
      }

      const args = ['venv']
      if (pythonVersion) {
        args.push('--python', pythonVersion)
      }

      await this.executeCommand(uvPath, args, mediaServerPath)

      logger.info('虚拟环境创建成功')
      return true
    } catch (error) {
      logger.error('创建虚拟环境失败', {
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 安装项目依赖
   */
  private async installDependencies(): Promise<boolean> {
    try {
      const mediaServerPath = this.ensureMediaServerPath()

      logger.info('安装项目依赖', { path: mediaServerPath })

      // 使用最佳镜像源安装依赖
      const success = await uvBootstrapperService.installDependenciesWithBestMirror(mediaServerPath)

      if (success) {
        logger.info('项目依赖安装成功')
      } else {
        logger.error('项目依赖安装失败')
      }

      return success
    } catch (error) {
      logger.error('安装依赖异常', {
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 重新安装依赖
   */
  public async reinstallDependencies(
    onProgress?: (progress: InstallProgress) => void
  ): Promise<boolean> {
    try {
      logger.info('重新安装依赖')

      this.updateProgress(
        {
          stage: 'deps',
          message: '正在重新安装依赖...',
          percent: 50
        },
        onProgress
      )

      const success = await this.installDependencies()

      if (success) {
        this.updateProgress(
          {
            stage: 'completed',
            message: '依赖安装完成',
            percent: 100
          },
          onProgress
        )
      } else {
        this.updateProgress(
          {
            stage: 'error',
            message: '依赖安装失败',
            percent: 0
          },
          onProgress
        )
      }

      return success
    } catch (error) {
      this.updateProgress(
        {
          stage: 'error',
          message: `安装失败: ${error instanceof Error ? error.message : String(error)}`,
          percent: 0
        },
        onProgress
      )

      return false
    }
  }

  /**
   * 删除虚拟环境
   */
  public async removeVenv(): Promise<boolean> {
    try {
      const venvPath = this.getVenvPath()

      if (!fs.existsSync(venvPath)) {
        logger.info('虚拟环境不存在，无需删除')
        return true
      }

      logger.info('删除虚拟环境', { venvPath })

      // 递归删除目录
      fs.rmSync(venvPath, { recursive: true, force: true })

      logger.info('虚拟环境删除成功')
      return true
    } catch (error) {
      logger.error('删除虚拟环境失败', {
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 执行命令
   */
  private async executeCommand(command: string, args: string[], cwd?: string): Promise<string> {
    const { spawn } = await import('child_process')

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        stdio: 'pipe',
        shell: process.platform === 'win32'
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(
            new Error(
              `命令执行失败: ${command} ${args.join(' ')}\n退出代码: ${code}\n错误输出: ${stderr}`
            )
          )
        }
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * 更新进度
   */
  private updateProgress(
    progress: InstallProgress,
    callback?: (progress: InstallProgress) => void
  ): void {
    this.installProgress = progress
    callback?.(progress)
  }

  /**
   * 获取当前安装进度
   */
  public getInstallProgress(): InstallProgress | null {
    return this.installProgress
  }
}

// 导出单例实例
export const pythonVenvService = new PythonVenvService()
