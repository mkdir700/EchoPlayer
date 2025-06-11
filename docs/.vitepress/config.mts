import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'EchoLab Documentation',
  description: '一款专为语言学习者设计的视频播放器',
  base: '/',
  ignoreDeadLinks: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '用户指南', link: '/user-guide/' }
    ],

    outline: {
      level: [2, 6],
      label: '页面导航'
    },

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
            { text: '概述', link: '/user-guide/overview' },
            { text: '用户手册', link: '/user-guide/user-manual' },
            { text: '视频导入', link: '/user-guide/video-import' },
            { text: '字幕编辑', link: '/user-guide/subtitle-editing' },
            { text: '键盘快捷键', link: '/user-guide/keyboard-shortcuts' },
            { text: '导出 & 分享', link: '/user-guide/export' }
          ]
        },
        {
          text: '帮助与支持',
          items: [
            { text: '故障排除', link: '/user-guide/troubleshooting' },
            { text: '常见问题', link: '/user-guide/faq' }
          ]
        }
      ],
      '/developer/': [
        {
          text: '开发指南',
          items: [
            { text: '介绍', link: '/developer/' },
            { text: '构建 & 发布', link: '/developer/build-release' },
            { text: '测试指南', link: '/developer/testing' },
            { text: 'Git 工作流', link: '/developer/git-workflow' },
            { text: '发布流程', link: '/developer/release-process' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [{ text: '介绍', link: '/api/' }]
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
