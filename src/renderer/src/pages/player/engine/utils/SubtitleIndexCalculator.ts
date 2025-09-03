import { SubtitleItem } from '@types'

import { TimeConstants, TimeMath } from '../core/TimeMath'

/**
 * 字幕索引计算工具类
 * 提供统一的字幕索引计算逻辑，可在多个组件中复用
 */
export class SubtitleIndexCalculator {
  /**
   * 根据当前时间计算活跃的字幕索引
   * @param currentTime - 当前播放时间（秒）
   * @param subtitles - 字幕列表
   * @returns 活跃字幕的索引，如果没有活跃字幕则返回 -1
   */
  static computeActiveCueIndex(currentTime: number, subtitles: SubtitleItem[]): number {
    if (subtitles.length === 0) return -1

    // 使用 TimeMath 统一的字幕迟滞常量
    const hysteresis = TimeConstants.SUBTITLE_HYSTERESIS_S

    // 使用 TimeMath.inside 统一判断时间边界
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]
      if (TimeMath.inside(subtitle.startTime, subtitle.endTime, currentTime, hysteresis)) {
        return i
      }
    }

    // 没有找到精确匹配的字幕，返回最近的一个
    return SubtitleIndexCalculator.findNearestSubtitleIndex(currentTime, subtitles)
  }

  /**
   * 查找最接近当前时间的字幕索引
   * @param currentTime - 当前播放时间（秒）
   * @param subtitles - 字幕列表
   * @returns 最近字幕的索引，如果距离太远则返回 -1
   */
  static findNearestSubtitleIndex(currentTime: number, subtitles: SubtitleItem[]): number {
    if (subtitles.length === 0) return -1

    let nearestIndex = -1
    let minDistance = Infinity

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]

      // 计算到字幕区间的最短距离
      let distance: number
      if (currentTime < subtitle.startTime) {
        // 当前时间在字幕开始前
        distance = subtitle.startTime - currentTime
      } else if (currentTime >= subtitle.endTime) {
        // 当前时间在字幕结束后
        distance = currentTime - subtitle.endTime
      } else {
        // 当前时间在字幕区间内（这种情况理论上不会到达这里，因为TimeMath.inside已经处理了）
        distance = 0
      }

      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    // 如果距离太远，返回-1表示没有活跃字幕
    return minDistance <= TimeConstants.MAX_SUBTITLE_DISTANCE_S ? nearestIndex : -1
  }

  /**
   * 便捷函数：计算初始字幕索引
   * 通常在播放器初始化时使用
   * @param initialTime - 初始播放时间（秒）
   * @param subtitles - 字幕列表
   * @returns 初始字幕索引，如果没有合适的字幕则返回 -1
   */
  static computeInitialCueIndex(initialTime: number, subtitles: SubtitleItem[]): number {
    return SubtitleIndexCalculator.computeActiveCueIndex(initialTime, subtitles)
  }

  /**
   * 检查给定索引的字幕是否在指定时间处于活跃状态
   * @param index - 字幕索引
   * @param currentTime - 当前播放时间（秒）
   * @param subtitles - 字幕列表
   * @returns true 如果该字幕在当前时间活跃
   */
  static isSubtitleActiveAtTime(
    index: number,
    currentTime: number,
    subtitles: SubtitleItem[]
  ): boolean {
    if (index < 0 || index >= subtitles.length) return false

    const subtitle = subtitles[index]
    const hysteresis = TimeConstants.SUBTITLE_HYSTERESIS_S

    return TimeMath.inside(subtitle.startTime, subtitle.endTime, currentTime, hysteresis)
  }

  /**
   * 获取指定时间范围内的所有活跃字幕索引
   * @param startTime - 开始时间（秒）
   * @param endTime - 结束时间（秒）
   * @param subtitles - 字幕列表
   * @returns 活跃字幕索引数组
   */
  static getActiveSubtitlesInRange(
    startTime: number,
    endTime: number,
    subtitles: SubtitleItem[]
  ): number[] {
    const activeIndices: number[] = []
    const hysteresis = TimeConstants.SUBTITLE_HYSTERESIS_S

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]

      // 检查字幕区间是否与指定时间范围重叠
      const subtitleStart = subtitle.startTime - hysteresis
      const subtitleEnd = subtitle.endTime + hysteresis

      if (subtitleStart < endTime && subtitleEnd > startTime) {
        activeIndices.push(i)
      }
    }

    return activeIndices
  }
}
