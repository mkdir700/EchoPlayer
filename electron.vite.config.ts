import fs from 'node:fs'
import path from 'node:path'

import react from '@vitejs/plugin-react-swc'
import { CodeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
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
        }
      },
      {
        name: 'copy-media-server',
        generateBundle() {
          // 复制 backend 到 resources/media-server
          const srcDir = path.resolve('backend')
          const destDir = path.resolve('resources/media-server')

          // 检查源目录是否存在
          if (!fs.existsSync(srcDir)) {
            console.warn('⚠️  backend 目录不存在，跳过复制')
            return
          }

          // 需要排除的文件和目录
          const excludeDirPatterns = [
            /^__pycache__$/,
            /^\.venv$/,
            /^venv$/,
            /^env$/,
            /^\.git$/,
            /^\.gitignore$/,
            /^\.vscode$/,
            /^\.idea$/,
            /^\.pytest_cache$/,
            /^\.mypy_cache$/,
            /^\.ruff_cache$/,
            /^cache$/,
            /^dist$/,
            /^build$/,
            /^assets$/,
            /\.egg-info$/
          ]
          const excludeFileNames = new Set(['uv.lock', '.gitignore', '.DS_Store'])
          const excludeFileSuffixes = ['.pyc', '.pyo', '.pyd']

          // 检查是否应排除
          const shouldExclude = (entry: fs.Dirent): boolean => {
            const { name } = entry

            if (entry.isDirectory()) {
              return excludeDirPatterns.some((pattern) => pattern.test(name))
            }

            if (entry.isFile()) {
              if (excludeFileNames.has(name)) {
                return true
              }
              return excludeFileSuffixes.some((suffix) => name.endsWith(suffix))
            }

            return false
          }

          // 递归复制目录
          const copyDir = (src: string, dest: string) => {
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest, { recursive: true })
            }

            const entries = fs.readdirSync(src, { withFileTypes: true })

            for (const entry of entries) {
              const srcPath = path.join(src, entry.name)
              const destPath = path.join(dest, entry.name)

              if (shouldExclude(entry)) {
                continue
              }

              if (entry.isDirectory()) {
                copyDir(srcPath, destPath)
              } else if (entry.isFile()) {
                fs.copyFileSync(srcPath, destPath)
              }
            }
          }

          // 执行复制
          console.log('📦 复制 Media Server 到 resources/media-server/')
          copyDir(srcDir, destDir)
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
