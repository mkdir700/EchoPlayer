import react from '@vitejs/plugin-react-swc'
import { CodeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
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
    }
    // build: {
    //   target: 'esnext', // for build
    //   rollupOptions: {
    //     input: {
    //       index: resolve(__dirname, 'src/renderer/index.html')
    //       // miniWindow: resolve(__dirname, 'src/renderer/miniWindow.html'),
    //       // selectionToolbar: resolve(__dirname, 'src/renderer/selectionToolbar.html'),
    //       // selectionAction: resolve(__dirname, 'src/renderer/selectionAction.html'),
    //       // traceWindow: resolve(__dirname, 'src/renderer/traceWindow.html')
    //     },
    //     external: ['electron', 'path'] // 明确外部化 electron 和 path 模块
    //   }
    // },
    // esbuild: isProd ? { legalComments: 'none' } : {}
  }
})
