module.exports = {
  branches: [
    // main 分支：稳定版本 (v1.0.0)
    'main',
    // beta 分支：测试版本 (v1.0.0-beta.1)
    { name: 'beta', prerelease: true },
    // alpha 分支：开发版本 (v1.0.0-alpha.1)
    { name: 'alpha', prerelease: true }
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          {
            type: 'chore',
            scope: 'release',
            release: 'patch'
          }
        ]
      }
    ],
    '@semantic-release/release-notes-generator',

    // 更新 changelog 文件
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],

    // bump package.json 版本号，但不发布到 npm
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],

    // 提交回仓库
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}'
      }
    ],

    // 创建 Release 并上传构建产物
    [
      '@semantic-release/github',
      {
        assets: [
          // Windows 产物
          'dist/*.exe',
          'dist/*.zip',

          // macOS 产物
          'dist/*.dmg',

          // Linux 产物
          'dist/*.AppImage',
          'dist/*.deb',

          // 自动更新文件
          'dist/*.yml',
          'dist/*.yaml',
          'dist/*.blockmap'
        ]
      }
    ]
  ]
}
