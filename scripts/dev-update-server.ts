#!/usr/bin/env tsx

/**
 * 本地更新服务器 - 用于开发环境测试自动更新功能
 * Local Update Server - For testing auto-update functionality in development
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import url from 'url'

// 配置 / Configuration
const PORT = 8384
const UPDATE_DATA_DIR = path.join(__dirname, '..', 'dev-update-data')

// 支持的更新渠道 / Supported update channels
const SUPPORTED_CHANNELS = ['stable', 'beta', 'alpha', 'dev'] as const
type UpdateChannel = (typeof SUPPORTED_CHANNELS)[number]

// 文件信息接口 / File info interface
interface FileInfo {
  name: string
  size: number
  modified: string
}

// 确保更新数据目录存在 / Ensure update data directory exists
if (!fs.existsSync(UPDATE_DATA_DIR)) {
  fs.mkdirSync(UPDATE_DATA_DIR, { recursive: true })
  console.log(`📁 创建更新数据目录: ${UPDATE_DATA_DIR}`)
}

// 确保各渠道目录存在 / Ensure channel directories exist
SUPPORTED_CHANNELS.forEach((channel) => {
  const channelDir = path.join(UPDATE_DATA_DIR, channel)
  if (!fs.existsSync(channelDir)) {
    fs.mkdirSync(channelDir, { recursive: true })
    console.log(`📁 创建渠道目录: ${channel}`)
  }
})

// MIME类型映射 / MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.json': 'application/json',
  '.exe': 'application/octet-stream',
  '.dmg': 'application/octet-stream',
  '.zip': 'application/zip',
  '.AppImage': 'application/octet-stream',
  '.deb': 'application/octet-stream'
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

// 创建HTTP服务器 / Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '', true)
  const pathname = parsedUrl.pathname || '/'

  console.log(`📥 ${req.method} ${pathname}`)

  // 启用CORS / Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // 只处理GET请求 / Only handle GET requests
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' })
    res.end('Method Not Allowed')
    return
  }

  // 处理根路径 - 显示可用渠道和文件列表 / Handle root path - show available channels and files
  if (pathname === '/') {
    try {
      const channelData = getChannelData()
      const html = generateIndexHtml(channelData)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
    } catch (error) {
      console.error('❌ 读取目录失败:', error)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
    }
    return
  }

  // 解析路径：支持渠道路径 (如 /alpha/latest-mac.yml) 或直接文件路径
  // Parse path: support channel paths (like /alpha/latest-mac.yml) or direct file paths
  const pathParts = pathname.substring(1).split('/').filter(Boolean) // 移除开头的 '/' 并分割
  let filePath: string
  let channel: string | null = null

  if (pathParts.length === 2 && SUPPORTED_CHANNELS.includes(pathParts[0] as UpdateChannel)) {
    // 渠道路径格式: /channel/filename
    // Channel path format: /channel/filename
    channel = pathParts[0]
    const fileName = pathParts[1]
    filePath = path.join(UPDATE_DATA_DIR, channel, fileName)
    console.log(`📂 渠道请求: ${channel}/${fileName}`)
  } else if (pathParts.length === 1) {
    // 直接文件路径格式: /filename (向后兼容)
    // Direct file path format: /filename (backward compatibility)
    const fileName = pathParts[0]
    filePath = path.join(UPDATE_DATA_DIR, fileName)
    console.log(`📄 直接文件请求: ${fileName}`)
  } else {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end('Bad Request: Invalid path format')
    return
  }

  // 安全检查 - 防止路径遍历攻击 / Security check - prevent path traversal
  if (!filePath.startsWith(UPDATE_DATA_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('Forbidden')
    return
  }

  // 检查文件是否存在 / Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`)
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('File Not Found')
    return
  }

  try {
    const stats = fs.statSync(filePath)
    const mimeType = getMimeType(filePath)

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache' // 禁用缓存，便于测试
    })

    const readStream = fs.createReadStream(filePath)
    readStream.pipe(res)

    console.log(`✅ 提供文件: ${filePath} (${(stats.size / 1024).toFixed(2)} KB)`)
  } catch (error) {
    console.error(`❌ 读取文件失败 ${filePath}:`, error)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
  }
})

// 渠道数据接口 / Channel data interface
interface ChannelData {
  [channel: string]: FileInfo[]
}

// 获取所有渠道的文件数据 / Get file data for all channels
function getChannelData(): ChannelData {
  const channelData: ChannelData = {}

  SUPPORTED_CHANNELS.forEach((channel) => {
    const channelDir = path.join(UPDATE_DATA_DIR, channel)
    if (fs.existsSync(channelDir)) {
      try {
        const files = fs.readdirSync(channelDir)
        channelData[channel] = files.map((file) => {
          const filePath = path.join(channelDir, file)
          const stats = fs.statSync(filePath)
          return {
            name: file,
            size: stats.size,
            modified: stats.mtime.toISOString()
          }
        })
      } catch (error) {
        console.error(`❌ 读取渠道目录失败 ${channel}:`, error)
        channelData[channel] = []
      }
    } else {
      channelData[channel] = []
    }
  })

  return channelData
}

function generateIndexHtml(channelData: ChannelData): string {
  const totalFiles = Object.values(channelData).reduce((sum, files) => sum + files.length, 0)

  return `
<!DOCTYPE html>
<html>
<head>
    <title>EchoLab 开发更新服务器</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #1890ff; }
        .file-list { margin-top: 20px; }
        .file-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
        }
        .file-name { font-weight: bold; }
        .file-info { color: #666; font-size: 0.9em; }
        .status {
            background: #f6ffed;
            border: 1px solid #b7eb8f;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .empty-state {
            text-align: center;
            padding: 20px;
            color: #666;
            background: #fafafa;
            border-radius: 4px;
            margin: 10px 0;
        }
        .channel-section {
            margin-bottom: 30px;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            padding: 20px;
        }
        .channel-section h3 {
            margin-top: 0;
            color: #1890ff;
        }
    </style>
</head>
<body>
    <h1 class="header">🚀 EchoLab 开发更新服务器</h1>
    <div class="status">
        <strong>服务器状态:</strong> 运行中 | <strong>端口:</strong> ${PORT} | <strong>数据目录:</strong> ${UPDATE_DATA_DIR}
    </div>

    <h2>更新渠道 / Update Channels (总计 ${totalFiles} 文件)</h2>
    ${SUPPORTED_CHANNELS.map((channel) => {
      const files = channelData[channel] || []
      const channelFileCount = files.length
      return `
        <div class="channel-section">
            <h3>📦 ${channel.toUpperCase()} 渠道 (${channelFileCount} 文件)</h3>
            ${
              channelFileCount === 0
                ? `
                <div class="empty-state">
                    <p>暂无文件 - 请运行 <code>npm run generate-test-update</code> 生成测试更新文件</p>
                </div>
            `
                : `
                <div class="file-list">
                    ${files
                      .map(
                        (file) => `
                        <div class="file-item">
                            <div>
                                <div class="file-name">
                                    <a href="/${channel}/${file.name}" target="_blank">${file.name}</a>
                                </div>
                                <div class="file-info">大小: ${(file.size / 1024).toFixed(2)} KB</div>
                            </div>
                            <div class="file-info">
                                修改时间: ${new Date(file.modified).toLocaleString('zh-CN')}
                            </div>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            `
            }
        </div>
      `
    }).join('')}

    <h3>使用说明</h3>
    <ul>
        <li>文件现在按渠道组织：<code>${UPDATE_DATA_DIR}/{channel}/latest-{platform}.yml</code></li>
        <li>支持的渠道：${SUPPORTED_CHANNELS.join(', ')}</li>
        <li>访问格式：<code>http://localhost:${PORT}/{channel}/{filename}</code></li>
        <li>使用 <code>npm run generate-test-update</code> 生成测试数据</li>
    </ul>

    <h3>常用命令</h3>
    <ul>
        <li><code>npm run dev:update-server</code> - 启动此更新服务器</li>
        <li><code>npm run generate-test-update</code> - 生成测试更新数据</li>
        <li><code>npm run dev</code> - 启动开发模式应用</li>
    </ul>
</body>
</html>`
}

// 启动服务器 / Start server
server.listen(PORT, () => {
  console.log(`🚀 EchoLab 开发更新服务器已启动`)
  console.log(`📍 地址: http://localhost:${PORT}`)
  console.log(`📁 数据目录: ${UPDATE_DATA_DIR}`)
  console.log(`💡 在浏览器中打开 http://localhost:${PORT} 查看可用文件`)
  console.log(`⏹️  按 Ctrl+C 停止服务器`)
})

// 优雅关闭 / Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  正在关闭服务器...')
  server.close(() => {
    console.log('✅ 服务器已关闭')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('\n⏹️  收到终止信号，正在关闭服务器...')
  server.close(() => {
    console.log('✅ 服务器已关闭')
    process.exit(0)
  })
})
