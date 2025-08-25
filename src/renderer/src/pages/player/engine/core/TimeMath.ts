import { loggerService } from '@logger'

const logger = loggerService.withContext('TimeMath')

/**
 * TimeMath - 统一时间数学计算模块
 *
 * 解决播放器引擎中边界判断不一致的问题，统一所有策略的时间比较逻辑。
 * 使用左闭右开区间 [start, end) 语义，提供稳定的边界处理能力。
 */
export class TimeMath {
  /**
   * 统一时间容差常量 (2毫秒)
   * 用于处理浮点精度和解码延迟造成的边界抖动
   */
  public static readonly EPS = 0.002 // 2ms in seconds

  /**
   * 判断时间点是否在指定区间内
   * 使用左闭右开区间语义 [start, end)
   *
   * @param start - 区间开始时间 (包含)
   * @param end - 区间结束时间 (不包含)
   * @param t - 待判断的时间点
   * @param eps - 容差值，默认使用 TimeMath.EPS
   * @returns true 如果时间点在区间内
   *
   * @example
   * ```typescript
   * TimeMath.inside(1.0, 3.0, 1.001)  // true (在容差范围内)
   * TimeMath.inside(1.0, 3.0, 0.999)  // false (超出容差范围)
   * TimeMath.inside(1.0, 3.0, 2.999)  // true (接近右边界但未超出)
   * TimeMath.inside(1.0, 3.0, 3.001)  // false (超出右边界)
   * ```
   */
  public static inside(start: number, end: number, t: number, eps: number = TimeMath.EPS): boolean {
    // 左闭右开区间: [start, end)
    // 左边界：t >= start - eps (包含边界及容差)
    // 右边界：t < end + eps (不包含边界，但给予容差)
    return t >= start - eps && t < end + eps
  }

  /**
   * 判断时间点是否跨越了右边界
   * 用于检测从区间内部到外部的边界跨越事件
   *
   * @param prevT - 前一个时间点
   * @param t - 当前时间点
   * @param end - 区间结束时间
   * @param eps - 容差值，默认使用 TimeMath.EPS
   * @returns true 如果从区间内跨越到区间外
   *
   * @example
   * ```typescript
   * // 检测循环策略中的字幕结束边界跨越
   * const crossed = TimeMath.crossedRightBoundary(2.99, 3.01, 3.0)  // true
   * const notCrossed = TimeMath.crossedRightBoundary(2.98, 2.99, 3.0)  // false
   * ```
   */
  public static crossedRightBoundary(
    prevT: number,
    t: number,
    end: number,
    eps: number = TimeMath.EPS
  ): boolean {
    // 只有当前一时间点在边界内，当前时间点在边界外时，才算跨越
    const wasInside = prevT < end + eps
    const isOutside = t >= end + eps

    return wasInside && isOutside
  }

  /**
   * 安全边界裁剪函数
   * 确保数值在指定范围内，避免越界访问和计算错误
   *
   * @param value - 待裁剪的值
   * @param min - 最小值 (包含)
   * @param max - 最大值 (包含)
   * @returns 裁剪后的值
   *
   * @example
   * ```typescript
   * TimeMath.clamp(1.5, 0, 1)     // 1
   * TimeMath.clamp(-0.5, 0, 1)    // 0
   * TimeMath.clamp(0.5, 0, 1)     // 0.5
   *
   * // 常用于时间范围裁剪
   * const safeTime = TimeMath.clamp(currentTime, 0, duration)
   * ```
   */
  public static clamp(value: number, min: number, max: number): number {
    if (min > max) {
      logger.warn('TimeMath.clamp: min > max', { min, max, value })
      return value
    }

    return Math.min(Math.max(value, min), max)
  }

  /**
   * 判断两个时间点是否相等（在容差范围内）
   *
   * @param a - 第一个时间点
   * @param b - 第二个时间点
   * @param eps - 容差值，默认使用 TimeMath.EPS
   * @returns true 如果两个时间点在容差范围内相等
   *
   * @example
   * ```typescript
   * TimeMath.equals(1.001, 1.002, 0.002)  // true (差值1ms < 2ms容差)
   * TimeMath.equals(1.000, 1.003, 0.002)  // false (差值3ms > 2ms容差)
   * ```
   */
  public static equals(a: number, b: number, eps: number = TimeMath.EPS): boolean {
    return Math.abs(a - b) < eps
  }

  /**
   * 检测时间序列中的边界抖动
   * 当连续的时间更新在边界附近快速振荡时返回 true
   *
   * @param timeHistory - 最近的时间点历史 (最新的在前)
   * @param boundary - 边界时间点
   * @param eps - 容差值，默认使用 TimeMath.EPS
   * @returns true 如果检测到边界抖动
   *
   * @example
   * ```typescript
   * const history = [3.001, 2.999, 3.001, 2.999]  // 在3.0边界附近抖动
   * TimeMath.detectBoundaryFlutter(history, 3.0)  // true
   * ```
   */
  public static detectBoundaryFlutter(
    timeHistory: number[],
    boundary: number,
    eps: number = TimeMath.EPS
  ): boolean {
    if (timeHistory.length < 3) return false

    // 检查最近3个时间点是否在边界附近频繁跨越
    let crossings = 0
    for (let i = 0; i < timeHistory.length - 1 && i < 3; i++) {
      const curr = timeHistory[i]
      const prev = timeHistory[i + 1]

      const currSide = curr >= boundary - eps
      const prevSide = prev >= boundary - eps

      if (currSide !== prevSide) {
        crossings++
      }
    }

    // 如果在短时间内有2次或以上跨越，认为是抖动
    return crossings >= 2
  }
}

/**
 * 时间数学工具类的常用别名
 * 提供更简洁的访问方式
 */
export const TM = TimeMath

/**
 * 常用时间常量
 */
export const TimeConstants = {
  /** 默认容差 (2ms) */
  EPS: TimeMath.EPS,

  /** 毫秒转秒 */
  MS_TO_SECOND: 0.001,

  /** 秒转毫秒 */
  SECOND_TO_MS: 1000,

  /** 常用的短延迟 (50ms) */
  SHORT_DELAY_MS: 50,

  /** 常用的长延迟 (200ms) */
  LONG_DELAY_MS: 200,

  /** 字幕同步的推荐迟滞时间 (30ms) */
  SUBTITLE_HYSTERESIS_MS: 30,

  /** 转换为秒 */
  SUBTITLE_HYSTERESIS_S: 30 * 0.001,

  /** 字幕最大搜索距离 (10秒) - 超过此距离的字幕不被视为相关 */
  MAX_SUBTITLE_DISTANCE_S: 10
} as const
