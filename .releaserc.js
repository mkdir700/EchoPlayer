module.exports = {
  branches: ['main', { name: 'beta', prerelease: true }, { name: 'alpha', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
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

    // 创建 Draft Release
    [
      '@semantic-release/github',
      {
        draft: true,
        assets: [] // 不上传产物，electron-builder 会自动创建 Release 并上传产物
      }
    ]
  ]
}
