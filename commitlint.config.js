module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复bug
        'docs', // 文档更新
        'style', // 代码格式修改
        'refactor', // 代码重构
        'perf', // 性能优化
        'test', // 测试相关
        'chore', // 构建过程或辅助工具的变动
        'ci', // CI配置文件和脚本的变动
        'build', // 构建系统或外部依赖的变动
        'revert' // 撤销之前的commit
      ]
    ],
    'subject-max-length': [2, 'always', 72],
    'subject-case': [0, 'never']
  }
}
