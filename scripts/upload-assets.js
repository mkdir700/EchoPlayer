#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

/**
 * GitCode 资产上传脚本
 * 功能：
 * 1. 并发上传文件到 GitCode
 * 2. 检查文件是否已存在，避免重复上传
 * 3. 支持断点续传和错误重试
 */

class GitCodeUploader {
  constructor(options) {
    this.accessToken = options.accessToken
    this.owner = options.owner
    this.repo = options.repo
    this.tag = options.tag
    this.concurrency = options.concurrency || 3
    this.retryAttempts = options.retryAttempts || 3
    this.baseUrl = 'https://api.gitcode.com/api/v5'
  }

  /**
   * HTTP 请求工具方法
   */
  async httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        ...options.httpsOptions
      }

      // 设置超时时间,大文件上传需要更长的超时时间
      const timeout = options.timeout || 600000 // 默认 10 分钟

      const req = https.request(requestOptions, (res) => {
        let data = ''
        let receivedBytes = 0

        res.on('data', (chunk) => {
          data += chunk
          receivedBytes += chunk.length
          // 对于大响应,显示接收进度
          if (options.showProgress && receivedBytes % (1024 * 1024) === 0) {
            console.log(`  接收响应数据: ${(receivedBytes / 1024 / 1024).toFixed(2)} MB`)
          }
        })

        res.on('end', () => {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          }

          try {
            if (data && res.headers['content-type']?.includes('application/json')) {
              result.json = JSON.parse(data)
            }
          } catch (e) {
            // JSON 解析失败，保持原始数据
          }

          resolve(result)
        })
      })

      // 设置请求超时
      req.setTimeout(timeout, () => {
        req.destroy()
        reject(new Error(`请求超时 (${timeout}ms)`))
      })

      req.on('error', reject)

      // 监听连接事件
      req.on('socket', (socket) => {
        if (options.showProgress) {
          socket.on('connect', () => {
            console.log('  Socket 已连接')
          })
        }
      })

      if (options.body) {
        if (options.body instanceof Buffer || typeof options.body === 'string') {
          req.write(options.body)
        } else {
          req.write(JSON.stringify(options.body))
        }
      }

      req.end()
    })
  }

  /**
   * 获取现有的 release 信息和资产列表
   */
  async getExistingAssets() {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases?access_token=${this.accessToken}`

    try {
      const response = await this.httpRequest(url)

      if (response.statusCode === 200 && response.json && Array.isArray(response.json)) {
        // 从 releases 数组中找到匹配的 tag
        const targetRelease = response.json.find((release) => release.tag_name === this.tag)

        if (targetRelease) {
          const assets = targetRelease.assets || []
          const assetNames = new Set(assets.map((asset) => asset.name))
          console.log(`✓ 找到现有 release ${this.tag}，包含 ${assets.length} 个资产`)

          // GitCode releases API 使用 tag_name 作为标识符
          const releaseId = targetRelease.tag_name
          console.log(`  使用标识符: ${releaseId}`)

          if (assets.length > 0) {
            console.log(`  现有资产:`)
            assets.slice(0, 3).forEach((asset) => {
              console.log(`    - ${asset.name} (${asset.type})`)
            })
            if (assets.length > 3) {
              console.log(`    ... 以及其他 ${assets.length - 3} 个文件`)
            }
          }

          return { releaseId: releaseId, existingAssets: assetNames }
        } else {
          console.log(`✗ Release ${this.tag} 不存在`)
          return { releaseId: null, existingAssets: new Set() }
        }
      } else {
        throw new Error(`获取 releases 列表失败: ${response.statusCode} ${response.data}`)
      }
    } catch (error) {
      console.error('获取现有资产失败:', error.message)
      throw error
    }
  }

  /**
   * 获取上传 URL
   */
  async getUploadUrl(releaseId, fileName) {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/${releaseId}/upload_url?access_token=${this.accessToken}&file_name=${encodeURIComponent(fileName)}`

    try {
      const response = await this.httpRequest(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.statusCode === 200 && response.json) {
        return response.json
      } else {
        throw new Error(`获取上传 URL 失败: ${response.statusCode} ${response.data}`)
      }
    } catch (error) {
      console.error(`获取 ${fileName} 上传 URL 失败:`, error.message)
      throw error
    }
  }

  /**
   * 上传文件到 GitCode 对象存储
   */
  async uploadFileToStorage(uploadInfo, filePath) {
    const fileName = path.basename(filePath)
    const fileBuffer = fs.readFileSync(filePath)
    const fileSize = fileBuffer.length

    const uploadUrl = uploadInfo.url

    console.log(`📤 开始上传到对象存储: ${fileName}`)
    console.log(`  URL: ${uploadUrl.substring(0, 80)}...`)
    console.log(`  大小: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)

    try {
      const startTime = Date.now()

      const response = await this.httpRequest(uploadUrl, {
        method: 'PUT',
        headers: { ...uploadInfo.headers, 'Content-Length': fileSize },
        body: fileBuffer,
        timeout: 1800000, // 30 分钟超时,用于大文件上传
        showProgress: true // 显示上传进度
      })

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      const speed = (fileSize / 1024 / 1024 / duration).toFixed(2)

      // 检查响应状态码 (200, 201, 204 都表示成功)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`✓ ${fileName} 上传成功 (HTTP ${response.statusCode})`)
        console.log(`  耗时: ${duration}秒, 速度: ${speed} MB/s`)
        return true
      } else {
        console.error(`✗ 上传失败: HTTP ${response.statusCode}`)
        console.error(`  响应: ${response.data.substring(0, 200)}`)
        throw new Error(`上传失败: ${response.statusCode} ${response.data}`)
      }
    } catch (error) {
      console.error(`✗ 上传 ${fileName} 到存储失败:`, error.message)
      throw error
    }
  }

  /**
   * 上传单个文件（带重试）
   */
  async uploadSingleFile(releaseId, filePath, existingAssets) {
    const fileName = path.basename(filePath)

    // 检查文件是否已存在
    if (existingAssets.has(fileName)) {
      console.log(`⚠ ${fileName} 已存在，跳过上传`)
      return { success: true, skipped: true }
    }

    if (!fs.existsSync(filePath)) {
      console.log(`⚠ ${fileName} 文件不存在，跳过`)
      return { success: false, error: 'File not found' }
    }

    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(
          `⏳ 上传 ${fileName} (${fileSize} bytes) - 尝试 ${attempt}/${this.retryAttempts}`
        )

        // 获取上传 URL
        const uploadInfo = await this.getUploadUrl(releaseId, fileName)

        // 上传到对象存储
        await this.uploadFileToStorage(uploadInfo, filePath)

        return { success: true, skipped: false }
      } catch (error) {
        console.error(
          `上传 ${fileName} 失败 (尝试 ${attempt}/${this.retryAttempts}):`,
          error.message
        )

        if (attempt === this.retryAttempts) {
          return { success: false, error: error.message }
        }

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  /**
   * 并发上传多个文件
   */
  async uploadFiles(filePaths) {
    console.log(`开始上传 ${filePaths.length} 个文件 (并发数: ${this.concurrency})`)

    // 获取现有资产列表
    const { releaseId, existingAssets } = await this.getExistingAssets()

    if (!releaseId) {
      throw new Error(`Release ${this.tag} 不存在，无法上传资产`)
    }

    // 过滤出需要上传的文件
    const filesToUpload = filePaths.filter((filePath) => {
      const fileName = path.basename(filePath)
      return !existingAssets.has(fileName) && fs.existsSync(filePath)
    })

    console.log(`需要上传 ${filesToUpload.length} 个新文件`)

    if (filesToUpload.length === 0) {
      console.log('所有文件都已存在，无需上传')
      return {
        total: filePaths.length,
        success: filePaths.length,
        failed: 0,
        skipped: filePaths.length
      }
    }

    // 并发上传
    const results = []
    const semaphore = new Array(this.concurrency).fill(null)

    const uploadPromises = filesToUpload.map(async (filePath) => {
      // 等待信号量
      await new Promise((resolve) => {
        const checkSemaphore = () => {
          const index = semaphore.indexOf(null)
          if (index !== -1) {
            semaphore[index] = filePath
            resolve()
          } else {
            setTimeout(checkSemaphore, 100)
          }
        }
        checkSemaphore()
      })

      try {
        const result = await this.uploadSingleFile(releaseId, filePath, existingAssets)
        result.filePath = filePath
        results.push(result)
      } finally {
        // 释放信号量
        const index = semaphore.indexOf(filePath)
        if (index !== -1) {
          semaphore[index] = null
        }
      }
    })

    await Promise.all(uploadPromises)

    // 统计结果
    const stats = {
      total: filePaths.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      skipped:
        results.filter((r) => r.skipped || existingAssets.has(path.basename(r.filePath))).length +
        (filePaths.length - filesToUpload.length)
    }

    console.log(`\n上传完成:`)
    console.log(`  总计: ${stats.total}`)
    console.log(`  成功: ${stats.success}`)
    console.log(`  失败: ${stats.failed}`)
    console.log(`  跳过: ${stats.skipped}`)

    // 输出失败的文件
    const failedFiles = results.filter((r) => !r.success)
    if (failedFiles.length > 0) {
      console.log('\n失败的文件:')
      failedFiles.forEach((result) => {
        console.log(`  - ${path.basename(result.filePath)}: ${result.error}`)
      })
    }

    return stats
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
GitCode 资产上传工具

用法: node upload-assets.js [选项] <文件路径...>

选项:
  --token <token>        GitCode access token (必需)
  --owner <owner>        仓库所有者 (必需)
  --repo <repo>          仓库名称 (必需)
  --tag <tag>            发布标签 (必需)
  --concurrency <num>    并发数量 (默认: 3)
  --retry <num>          重试次数 (默认: 3)
  --help, -h             显示帮助信息

示例:
  node upload-assets.js --token xxx --owner mkdir700 --repo EchoPlayer --tag v1.0.0 file1.zip file2.deb

环境变量:
  GITCODE_ACCESS_TOKEN   GitCode access token
  GITCODE_OWNER          仓库所有者
  GITCODE_REPO           仓库名称
  GITCODE_TAG            发布标签
`)
    process.exit(0)
  }

  // 解析命令行参数
  const options = {
    accessToken: process.env.GITCODE_ACCESS_TOKEN,
    owner: process.env.GITCODE_OWNER,
    repo: process.env.GITCODE_REPO,
    tag: process.env.GITCODE_TAG,
    concurrency: 3,
    retryAttempts: 3
  }

  const filePaths = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--token' && i + 1 < args.length) {
      options.accessToken = args[++i]
    } else if (arg === '--owner' && i + 1 < args.length) {
      options.owner = args[++i]
    } else if (arg === '--repo' && i + 1 < args.length) {
      options.repo = args[++i]
    } else if (arg === '--tag' && i + 1 < args.length) {
      options.tag = args[++i]
    } else if (arg === '--concurrency' && i + 1 < args.length) {
      options.concurrency = parseInt(args[++i])
    } else if (arg === '--retry' && i + 1 < args.length) {
      options.retryAttempts = parseInt(args[++i])
    } else if (!arg.startsWith('--')) {
      filePaths.push(arg)
    }
  }

  // 验证必需参数
  const required = ['accessToken', 'owner', 'repo', 'tag']
  const missing = required.filter((key) => !options[key])

  if (missing.length > 0) {
    console.error(`错误: 缺少必需参数: ${missing.join(', ')}`)
    process.exit(1)
  }

  if (filePaths.length === 0) {
    console.error('错误: 未指定要上传的文件')
    process.exit(1)
  }

  try {
    const uploader = new GitCodeUploader(options)
    const stats = await uploader.uploadFiles(filePaths)

    if (stats.failed > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('上传失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('未处理的错误:', error)
    process.exit(1)
  })
}

module.exports = GitCodeUploader
