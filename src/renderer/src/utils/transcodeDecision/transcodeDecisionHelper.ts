/**
 * Transcode Decision Helper / 转码决策辅助工具
 * 提供转码决策的便捷方法和使用示例
 * Provides convenient methods and usage examples for transcoding decisions
 */

import {
  transcodeDecisionMaker,
  TranscodeStrategy,
  type TranscodeDecision
} from './transcodeDecisionMaker'
import { ffmpegNativeClient, type TranscodeProgress } from '../ffmpegNativeClient'

/**
 * 执行转码结果 / Transcoding execution result
 */
export interface TranscodeExecutionResult {
  success: boolean
  outputPath?: string
  error?: string
  executionTime?: number
  cancelled?: boolean // 是否被用户取消 / Whether cancelled by user
}

/**
 * 转码任务状态 / Transcoding task status
 */
export interface TranscodeTask {
  filePath: string
  decision: TranscodeDecision
  status: 'pending' | 'running' | 'completed' | 'failed'
  outputPath?: string
  progress?: TranscodeProgress
  error?: string
  startTime?: number
  endTime?: number
}

/**
 * 转码决策辅助器类 / Transcoding Decision Helper Class
 */
export class TranscodeDecisionHelper {
  /**
   * 分析单个视频文件并提供决策 / Analyze single video file and provide decision
   * @param filePath 视频文件路径 / Video file path
   */
  async analyzeVideo(filePath: string): Promise<{
    decision: TranscodeDecision
    recommendation: string
    canExecute: boolean
  }> {
    try {
      const decision = await transcodeDecisionMaker.makeDecision(filePath)

      let recommendation = ''
      let canExecute = true

      switch (decision.strategy) {
        case TranscodeStrategy.NOT_NEEDED:
          recommendation = '✅ 该视频完全兼容，可以直接播放，无需任何转码操作。'
          canExecute = false
          break

        case TranscodeStrategy.AUDIO_ONLY:
          recommendation = `🔊 该视频画面兼容，但音频需要转码。预计用时 ${this.formatTime(decision.estimatedTime || 0)}。`
          break

        case TranscodeStrategy.VIDEO_ONLY:
          recommendation = `🎬 该视频音频兼容，但视频需要转码。预计用时 ${this.formatTime(decision.estimatedTime || 0)}。`
          break

        case TranscodeStrategy.FULL_TRANSCODE:
          recommendation = `⚡ 该视频需要完整转码（视频+音频）。预计用时 ${this.formatTime(decision.estimatedTime || 0)}。`
          break

        case TranscodeStrategy.CONTAINER_ONLY:
          recommendation = `📦 该视频只需要更改容器格式，转换速度很快。预计用时 ${this.formatTime(decision.estimatedTime || 0)}。`
          break

        default:
          recommendation = '❓ 无法确定转码策略，建议手动检查。'
      }

      if (decision.reason.length > 0) {
        recommendation += '\n\n详细原因：\n' + decision.reason.map((r) => `• ${r}`).join('\n')
      }

      return {
        decision,
        recommendation,
        canExecute
      }
    } catch (error) {
      console.error('分析视频文件失败:', error)
      throw new Error(`分析视频文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 执行转码决策 / Execute transcoding decision
   * @param filePath 输入文件路径 / Input file path
   * @param decision 转码决策 / Transcoding decision
   * @param outputPath 可选的输出路径 / Optional output path
   * @param onProgress 进度回调 / Progress callback
   */
  async executeDecision(
    filePath: string,
    decision: TranscodeDecision,
    outputPath?: string,
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<TranscodeExecutionResult> {
    const startTime = Date.now()

    try {
      // 检查 FFmpeg 是否可用 / Check if FFmpeg is available
      const ffmpegExists = await ffmpegNativeClient.checkExists()
      if (!ffmpegExists) {
        return {
          success: false,
          error: 'FFmpeg 不可用，请先下载安装 FFmpeg'
        }
      }

      let result
      const finalOutputPath =
        outputPath || (await ffmpegNativeClient.generateTranscodedPath(filePath))

      // 根据策略执行不同的转码方法 / Execute different transcoding methods based on strategy
      switch (decision.strategy) {
        case TranscodeStrategy.AUDIO_ONLY:
          result = await ffmpegNativeClient.quickTranscodeAudioToAAC(
            filePath,
            finalOutputPath,
            onProgress
          )
          break

        case TranscodeStrategy.VIDEO_ONLY:
        case TranscodeStrategy.FULL_TRANSCODE:
          result = await ffmpegNativeClient.transcode(
            filePath,
            finalOutputPath,
            decision.options,
            onProgress
          )
          break

        case TranscodeStrategy.CONTAINER_ONLY:
          result = await ffmpegNativeClient.transcode(
            filePath,
            finalOutputPath,
            decision.options,
            onProgress
          )
          break

        default:
          return {
            success: false,
            error: '不支持的转码策略'
          }
      }

      const executionTime = Date.now() - startTime

      if (result.success) {
        return {
          success: true,
          outputPath: finalOutputPath,
          executionTime
        }
      } else {
        // 检查是否是用户取消转码 / Check if it's user cancellation
        const errorMessage = result.error || '转码失败'
        const isCancelled = errorMessage.startsWith('[CANCELLED]')

        return {
          success: false,
          error: isCancelled ? errorMessage.replace('[CANCELLED]', '') : errorMessage,
          executionTime,
          cancelled: isCancelled
        }
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('执行转码失败:', error)

      // 检查是否是用户取消转码 / Check if it's user cancellation
      const errorMessage = error instanceof Error ? error.message : '执行转码失败'
      const isCancelled =
        errorMessage.includes('转码已被用户取消') || errorMessage.startsWith('[CANCELLED]')

      return {
        success: false,
        error: isCancelled ? errorMessage.replace('[CANCELLED]', '') : errorMessage,
        executionTime,
        cancelled: isCancelled
      }
    }
  }

  /**
   * 批量分析视频文件 / Batch analyze video files
   * @param filePaths 文件路径数组 / Array of file paths
   */
  async batchAnalyze(filePaths: string[]): Promise<{
    tasks: TranscodeTask[]
    summary: {
      totalFiles: number
      needsTranscode: number
      estimatedTotalTime: number
      priorityBreakdown: Record<string, number>
      strategyBreakdown: Record<string, number>
    }
  }> {
    const decisions = await transcodeDecisionMaker.makeBatchDecisions(filePaths)
    const tasks: TranscodeTask[] = []

    let needsTranscode = 0
    let estimatedTotalTime = 0
    const priorityBreakdown = { low: 0, medium: 0, high: 0 }
    const strategyBreakdown: Record<string, number> = {}

    for (const [filePath, decision] of Array.from(decisions.entries())) {
      const task: TranscodeTask = {
        filePath,
        decision,
        status: decision.strategy === TranscodeStrategy.NOT_NEEDED ? 'completed' : 'pending'
      }

      tasks.push(task)

      if (decision.strategy !== TranscodeStrategy.NOT_NEEDED) {
        needsTranscode++
        estimatedTotalTime += decision.estimatedTime || 0
      }

      priorityBreakdown[decision.priority]++
      strategyBreakdown[decision.strategy] = (strategyBreakdown[decision.strategy] || 0) + 1
    }

    return {
      tasks,
      summary: {
        totalFiles: filePaths.length,
        needsTranscode,
        estimatedTotalTime,
        priorityBreakdown,
        strategyBreakdown
      }
    }
  }

  /**
   * 按优先级排序任务 / Sort tasks by priority
   * @param tasks 任务列表 / Task list
   */
  sortTasksByPriority(tasks: TranscodeTask[]): TranscodeTask[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 }

    return tasks.sort((a, b) => {
      const aPriority = priorityOrder[a.decision.priority] || 0
      const bPriority = priorityOrder[b.decision.priority] || 0
      return bPriority - aPriority
    })
  }

  /**
   * 过滤需要转码的任务 / Filter tasks that need transcoding
   * @param tasks 任务列表 / Task list
   */
  filterTranscodeTasks(tasks: TranscodeTask[]): TranscodeTask[] {
    return tasks.filter((task) => task.decision.strategy !== TranscodeStrategy.NOT_NEEDED)
  }

  /**
   * 获取转码策略的友好名称 / Get friendly name for transcoding strategy
   * @param strategy 转码策略 / Transcoding strategy
   */
  getStrategyFriendlyName(strategy: TranscodeStrategy): string {
    const names = {
      [TranscodeStrategy.NOT_NEEDED]: '无需转码',
      [TranscodeStrategy.AUDIO_ONLY]: '仅转码音频',
      [TranscodeStrategy.VIDEO_ONLY]: '仅转码视频',
      [TranscodeStrategy.FULL_TRANSCODE]: '完整转码',
      [TranscodeStrategy.CONTAINER_ONLY]: '容器转换'
    }

    return names[strategy] || '未知策略'
  }

  /**
   * 获取优先级的友好名称 / Get friendly name for priority
   * @param priority 优先级 / Priority
   */
  getPriorityFriendlyName(priority: 'low' | 'medium' | 'high'): string {
    const names = {
      low: '低优先级',
      medium: '中等优先级',
      high: '高优先级'
    }

    return names[priority] || '未知优先级'
  }

  /**
   * 格式化时间 / Format time
   * @param seconds 秒数 / Seconds
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} 秒`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes} 分 ${remainingSeconds} 秒`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours} 小时 ${minutes} 分钟`
    }
  }

  /**
   * 生成转码报告 / Generate transcoding report
   * @param tasks 任务列表 / Task list
   */
  generateReport(tasks: TranscodeTask[]): string {
    const completed = tasks.filter((t) => t.status === 'completed')
    const failed = tasks.filter((t) => t.status === 'failed')
    const pending = tasks.filter((t) => t.status === 'pending')

    let report = '📊 转码任务报告 / Transcoding Task Report\n'
    report += '='.repeat(50) + '\n\n'

    report += `📁 总文件数: ${tasks.length}\n`
    report += `✅ 已完成: ${completed.length}\n`
    report += `❌ 失败: ${failed.length}\n`
    report += `⏳ 待处理: ${pending.length}\n\n`

    // 策略统计 / Strategy statistics
    const strategyStats = new Map<TranscodeStrategy, number>()
    tasks.forEach((task) => {
      const count = strategyStats.get(task.decision.strategy) || 0
      strategyStats.set(task.decision.strategy, count + 1)
    })

    report += '🎯 转码策略统计:\n'
    for (const [strategy, count] of Array.from(strategyStats.entries())) {
      report += `  ${this.getStrategyFriendlyName(strategy)}: ${count} 个文件\n`
    }

    report += '\n'

    // 优先级统计 / Priority statistics
    const priorityStats = new Map<string, number>()
    tasks.forEach((task) => {
      const count = priorityStats.get(task.decision.priority) || 0
      priorityStats.set(task.decision.priority, count + 1)
    })

    report += '⚡ 优先级统计:\n'
    for (const [priority, count] of Array.from(priorityStats.entries())) {
      report += `  ${this.getPriorityFriendlyName(priority as 'low' | 'medium' | 'high')}: ${count} 个文件\n`
    }

    // 总转码时间 / Total transcoding time
    const totalEstimatedTime = tasks.reduce(
      (sum, task) => sum + (task.decision.estimatedTime || 0),
      0
    )
    if (totalEstimatedTime > 0) {
      report += `\n⏱️ 预计总转码时间: ${this.formatTime(totalEstimatedTime)}\n`
    }

    return report
  }
}

// 导出全局单例 / Export global singleton
export const transcodeDecisionHelper = new TranscodeDecisionHelper()

/**
 * 使用示例 / Usage Examples
 */
export const usageExamples = {
  /**
   * 分析单个视频文件 / Analyze single video file
   */
  async analyzeSingleVideo(filePath: string) {
    const result = await transcodeDecisionHelper.analyzeVideo(filePath)
    console.log('分析结果:', result.recommendation)

    if (result.canExecute) {
      console.log('可以执行转码，策略:', result.decision.strategy)
      // 执行转码 / Execute transcoding
      const executionResult = await transcodeDecisionHelper.executeDecision(
        filePath,
        result.decision,
        undefined,
        (progress) => {
          console.log(`转码进度: ${progress.progress}%`)
        }
      )

      if (executionResult.success) {
        console.log('转码成功，输出文件:', executionResult.outputPath)
      } else {
        console.error('转码失败:', executionResult.error)
      }
    }
  },

  /**
   * 批量分析视频文件 / Batch analyze video files
   */
  async batchAnalyzeVideos(filePaths: string[]) {
    const result = await transcodeDecisionHelper.batchAnalyze(filePaths)

    console.log('批量分析结果:')
    console.log(transcodeDecisionHelper.generateReport(result.tasks))

    // 按优先级排序 / Sort by priority
    const prioritizedTasks = transcodeDecisionHelper.sortTasksByPriority(result.tasks)

    // 过滤需要转码的任务 / Filter tasks that need transcoding
    const transcodeTasks = transcodeDecisionHelper.filterTranscodeTasks(prioritizedTasks)

    console.log(`需要转码的文件数量: ${transcodeTasks.length}`)

    // 依次执行转码 / Execute transcoding sequentially
    for (const task of transcodeTasks) {
      console.log(`开始转码: ${task.filePath}`)
      const result = await transcodeDecisionHelper.executeDecision(
        task.filePath,
        task.decision,
        undefined,
        (progress) => {
          console.log(`${task.filePath} 转码进度: ${progress.progress}%`)
        }
      )

      if (result.success) {
        console.log(`✅ ${task.filePath} 转码完成`)
      } else {
        console.error(`❌ ${task.filePath} 转码失败:`, result.error)
      }
    }
  }
}
