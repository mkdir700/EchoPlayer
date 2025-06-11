import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'EchoLab Documentation',
  description: 'Professional video subtitle editing and language learning tool',
  base: '/docs/',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '用户指南', link: '/user-guide/' }
    ],

    sidebar: {
      '/user-guide/': [
        {
          text: '快速入门',
          items: [
            { text: '介绍', link: '/user-guide/' },
            { text: '安装', link: '/user-guide/installation' },
            { text: '快速入门', link: '/user-guide/quick-start' }
          ]
        },
        {
          text: '用户手册',
          items: [
            { text: '介绍', link: '/user-guide/overview' },
            { text: '视频导入', link: '/user-guide/video-import' },
            { text: '字幕编辑', link: '/user-guide/subtitle-editing' },
            { text: '键盘快捷键', link: '/user-guide/keyboard-shortcuts' },
            { text: '导出 & 分享', link: '/user-guide/export' }
          ]
        },
        {
          text: '功能',
          items: [
            { text: '视频播放', link: '/user-guide/features/playback' },
            { text: '字幕管理', link: '/user-guide/features/subtitles' },
            { text: '语言学习', link: '/user-guide/features/learning' },
            { text: '视频转换', link: '/user-guide/features/conversion' }
          ]
        },
        {
          text: '故障排除',
          items: [
            { text: '常见问题', link: '/user-guide/troubleshooting' },
            { text: '常见问题解答', link: '/user-guide/faq' }
          ]
        }
      ],
      '/developer/': [
        {
          text: '开发',
          items: [
            { text: '介绍', link: '/developer/' },
            { text: '安装', link: '/developer/setup' },
            { text: '架构', link: '/developer/architecture' },
            { text: '构建 & 发布', link: '/developer/build-release' }
          ]
        },
        {
          text: '指南',
          items: [
            { text: '测试指南', link: '/developer/testing' },
            { text: 'Git 工作流', link: '/developer/git-workflow' },
            { text: '发布流程', link: '/developer/release-process' }
          ]
        },
        {
          text: '贡献',
          items: [
            { text: '代码风格', link: '/developer/code-style' },
            { text: 'Pull Requests 拉取请求', link: '/developer/pull-requests' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '介绍', link: '/api/' },
            { text: '主进程', link: '/api/main-process' },
            { text: '渲染进程', link: '/api/renderer-process' },
            { text: 'IPC 通信', link: '/api/ipc' }
          ]
        }
      ]
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/mkdir700/echolab' }],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/mkdir700/echolab/edit/main/docs/:path'
    },

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright © 2025 EchoLab'
    }
  }
})
