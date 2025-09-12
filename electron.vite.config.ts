import fs from 'node:fs'
import path from 'node:path'

import react from '@vitejs/plugin-react-swc'
import { spawn } from 'child_process'
import { CodeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

// FFmpeg 下载插件
function ffmpegDownloadPlugin() {
  return {
    name: 'ffmpeg-download',
    async buildStart() {
      // 只在生产构建时下载 FFmpeg
      if (!isProd) return

      // 根据构建目标决定下载哪个平台
      const targetPlatform = process.env.BUILD_TARGET_PLATFORM || process.platform
      const targetArch = process.env.BUILD_TARGET_ARCH || process.arch

      // 检查是否已存在，避免重复下载
      const ffmpegPath = path.resolve(
        'resources/ffmpeg',
        `${targetPlatform}-${targetArch}`,
        targetPlatform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
      )

      if (fs.existsSync(ffmpegPath)) {
        console.log(`FFmpeg already exists for ${targetPlatform}-${targetArch}`)
        return
      }

      console.log(`Downloading FFmpeg for ${targetPlatform}-${targetArch}...`)

      try {
        await new Promise<void>((resolve, reject) => {
          // 在不同环境中使用不同的命令来确保兼容性
          let command: string
          let args: string[]

          if (process.platform === 'win32') {
            // Windows 环境：使用 npm run 调用脚本，更可靠
            command = 'npm'
            args = ['run', 'ffmpeg:download']
          } else {
            // Unix 环境：直接使用 tsx
            command = 'tsx'
            args = ['scripts/download-ffmpeg.ts', 'platform', targetPlatform, targetArch]
          }

          const downloadScript = spawn(command, args, {
            stdio: 'inherit',
            shell: process.platform === 'win32',
            env: {
              ...process.env,
              BUILD_TARGET_PLATFORM: targetPlatform,
              BUILD_TARGET_ARCH: targetArch
            }
          })

          downloadScript.on('close', (code) => {
            if (code === 0) {
              console.log('FFmpeg Downloaded successfully')
              resolve()
            } else {
              reject(new Error(`FFmpeg Download failed with exit code: ${code}`))
            }
          })

          downloadScript.on('error', (error) => {
            reject(error)
          })
        })
      } catch (error) {
        console.error('FFmpeg Download failed:', error)
        throw new Error(`Failed to download FFmpeg for ${targetPlatform}-${targetArch}: ${error}`)
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      ffmpegDownloadPlugin(),
      {
        name: 'copy-files',
        generateBundle() {
          // 优先使用新的 db/migrations 路径
          const newMigrationsDir = path.resolve('db/migrations')
          const oldMigrationsDir = path.resolve('src/main/db/migrations')

          // 确定源迁移目录
          let srcMigrationsDir = ''
          if (fs.existsSync(newMigrationsDir)) {
            srcMigrationsDir = newMigrationsDir
          } else if (fs.existsSync(oldMigrationsDir)) {
            srcMigrationsDir = oldMigrationsDir
          }

          if (srcMigrationsDir) {
            // 复制到两个目标位置以确保兼容性
            const destDirs = [
              path.resolve('out/main/db/migrations'), // 旧位置
              path.resolve('out/db/migrations') // 新位置
            ]

            for (const destMigrationsDir of destDirs) {
              // 确保目标目录存在
              fs.mkdirSync(destMigrationsDir, { recursive: true })

              // 复制所有 .js 文件
              const files = fs.readdirSync(srcMigrationsDir)
              for (const file of files) {
                if (file.endsWith('.js')) {
                  const srcFile = path.join(srcMigrationsDir, file)
                  const destFile = path.join(destMigrationsDir, file)
                  fs.copyFileSync(srcFile, destFile)
                }
              }
            }
          }

          // 复制 FFmpeg 文件到构建目录
          const ffmpegResourcesDir = path.resolve('resources/ffmpeg')
          if (fs.existsSync(ffmpegResourcesDir)) {
            const outResourcesDir = path.resolve('out/resources/ffmpeg')

            try {
              // 确保输出目录存在
              fs.mkdirSync(outResourcesDir, { recursive: true })

              // 复制整个 ffmpeg 目录
              const copyDirectoryRecursive = (src: string, dest: string) => {
                if (!fs.existsSync(src)) return

                fs.mkdirSync(dest, { recursive: true })
                const items = fs.readdirSync(src)

                for (const item of items) {
                  const srcPath = path.join(src, item)
                  const destPath = path.join(dest, item)

                  if (fs.statSync(srcPath).isDirectory()) {
                    copyDirectoryRecursive(srcPath, destPath)
                  } else {
                    fs.copyFileSync(srcPath, destPath)
                  }
                }
              }

              copyDirectoryRecursive(ffmpegResourcesDir, outResourcesDir)
              console.log('FFmpeg files copied successfully')
            } catch (error) {
              console.warn('Failed to copy FFmpeg files:', error)
            }
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@types': resolve('src/renderer/src/infrastructure/types'),
        '@shared': resolve('packages/shared'),
        '@logger': resolve('src/main/services/LoggerService')
      }
    },
    build: {
      rollupOptions: {
        external: [],
        output: isProd
          ? {
              manualChunks: undefined, // 彻底禁用代码分割 - 返回 null 强制单文件打包
              inlineDynamicImports: true // 内联所有动态导入，这是关键配置
            }
          : undefined
      },
      sourcemap: isDev
    },
    esbuild: isProd ? { legalComments: 'none' } : {},
    optimizeDeps: {
      noDiscovery: isDev
    }
  },
  preload: {
    plugins: [
      react({
        tsDecorators: true
      }),
      externalizeDepsPlugin()
    ],
    resolve: {
      alias: {
        '@shared': resolve('packages/shared')
      }
    },
    build: {
      sourcemap: isDev
    }
  },
  renderer: {
    plugins: [
      react({
        tsDecorators: true,
        plugins: [
          [
            '@swc/plugin-styled-components',
            {
              displayName: true, // 开发环境下启用组件名称
              fileName: false, // 不在类名中包含文件名
              pure: true, // 优化性能
              ssr: false // 不需要服务端渲染
            }
          ]
        ]
      }),
      ...(isDev ? [CodeInspectorPlugin({ bundler: 'vite' })] : []) // 只在开发环境下启用 CodeInspectorPlugin
    ],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@renderer': resolve('src/renderer/src'),
        '@types': resolve('src/renderer/src/infrastructure/types'),
        '@shared': resolve('packages/shared'),
        '@logger': resolve('src/renderer/src/services/Logger')
      }
    },
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[name]__[local]___[hash:base64:5]'
      }
    },
    build: {
      rollupOptions: {
        external: ['electron', 'path'],
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        },
        output: {
          manualChunks: undefined,
          inlineDynamicImports: true
        }
      }
    }
  }
})
