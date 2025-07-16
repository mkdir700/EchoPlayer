/**
 * Easing functions for smooth animations and transitions
 * 用于平滑动画和过渡的缓动函数
 *
 * All functions take a parameter t (time) between 0 and 1
 * and return a value between 0 and 1
 * 所有函数接受一个 0-1 之间的时间参数 t，返回 0-1 之间的值
 */

export type EasingFunction = (t: number) => number

/**
 * Linear easing - constant speed
 * 线性缓动 - 恒定速度
 */
export const linear: EasingFunction = (t: number): number => t

/**
 * Ease-in functions - slow start, accelerating
 * 缓入函数 - 缓慢开始，逐渐加速
 */
export const easeInQuad: EasingFunction = (t: number): number => t * t

export const easeInCubic: EasingFunction = (t: number): number => t * t * t

export const easeInQuart: EasingFunction = (t: number): number => t * t * t * t

export const easeInQuint: EasingFunction = (t: number): number => t * t * t * t * t

export const easeInSine: EasingFunction = (t: number): number => 1 - Math.cos((t * Math.PI) / 2)

export const easeInExpo: EasingFunction = (t: number): number =>
  t === 0 ? 0 : Math.pow(2, 10 * (t - 1))

export const easeInCirc: EasingFunction = (t: number): number => 1 - Math.sqrt(1 - t * t)

/**
 * Ease-out functions - fast start, decelerating
 * 缓出函数 - 快速开始，逐渐减速
 */
export const easeOutQuad: EasingFunction = (t: number): number => t * (2 - t)

export const easeOutCubic: EasingFunction = (t: number): number => {
  const t1 = t - 1
  return t1 * t1 * t1 + 1
}

export const easeOutQuart: EasingFunction = (t: number): number => {
  const t1 = t - 1
  return 1 - t1 * t1 * t1 * t1
}

export const easeOutQuint: EasingFunction = (t: number): number => {
  const t1 = t - 1
  return 1 + t1 * t1 * t1 * t1 * t1
}

export const easeOutSine: EasingFunction = (t: number): number => Math.sin((t * Math.PI) / 2)

export const easeOutExpo: EasingFunction = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

export const easeOutCirc: EasingFunction = (t: number): number => Math.sqrt(1 - (t - 1) * (t - 1))

/**
 * Ease-in-out functions - slow start and end, fast middle
 * 缓入缓出函数 - 缓慢开始和结束，中间快速
 */
export const easeInOutQuad: EasingFunction = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

export const easeInOutCubic: EasingFunction = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1

export const easeInOutQuart: EasingFunction = (t: number): number =>
  t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t

export const easeInOutQuint: EasingFunction = (t: number): number =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t

export const easeInOutSine: EasingFunction = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2

export const easeInOutExpo: EasingFunction = (t: number): number => {
  if (t === 0) return 0
  if (t === 1) return 1
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2
  return (2 - Math.pow(2, -20 * t + 10)) / 2
}

export const easeInOutCirc: EasingFunction = (t: number): number =>
  t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2

/**
 * Custom cubic-bezier easing functions
 * 自定义三次贝塞尔缓动函数
 */

/**
 * Material Design standard easing
 * Material Design 标准缓动
 */
export const materialStandard: EasingFunction = cubicBezier(0.4, 0, 0.2, 1)

/**
 * Material Design decelerate easing
 * Material Design 减速缓动
 */
export const materialDecelerate: EasingFunction = cubicBezier(0, 0, 0.2, 1)

/**
 * Material Design accelerate easing
 * Material Design 加速缓动
 */
export const materialAccelerate: EasingFunction = cubicBezier(0.4, 0, 1, 1)

/**
 * Apple's ease-out timing function
 * 苹果的缓出时间函数
 */
export const appleEaseOut: EasingFunction = cubicBezier(0.165, 0.84, 0.44, 1)

/**
 * Create a cubic-bezier easing function
 * 创建三次贝塞尔缓动函数
 *
 * @param x1 - First control point x coordinate
 * @param y1 - First control point y coordinate
 * @param x2 - Second control point x coordinate
 * @param y2 - Second control point y coordinate
 * @returns Easing function
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  return (t: number): number => {
    // Simplified cubic-bezier calculation for performance
    // 为性能优化的简化三次贝塞尔计算
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx

    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by

    // Newton-Raphson method to solve for t given x
    // 使用牛顿-拉夫逊方法根据 x 求解 t
    let currentT = t
    for (let i = 0; i < 4; i++) {
      const currentX = ((ax * currentT + bx) * currentT + cx) * currentT
      const currentSlope = (3 * ax * currentT + 2 * bx) * currentT + cx

      if (Math.abs(currentSlope) < 1e-6) break
      currentT = currentT - (currentX - t) / currentSlope
    }

    return ((ay * currentT + by) * currentT + cy) * currentT
  }
}

/**
 * Predefined easing functions for common use cases
 * 常用场景的预定义缓动函数
 */
export const easingPresets = {
  // For speed transitions - 用于速度过渡
  speedTransition: materialStandard,
  speedIncrease: easeOutQuart,
  speedDecrease: easeInOutCubic,

  // For UI animations - 用于 UI 动画
  uiStandard: materialStandard,
  uiEnter: materialDecelerate,
  uiExit: materialAccelerate,

  // For smooth movements - 用于平滑运动
  smooth: easeInOutSine,
  gentle: easeInOutQuad,
  snappy: appleEaseOut
} as const

/**
 * Get easing function by name
 * 根据名称获取缓动函数
 */
export function getEasingFunction(name: keyof typeof easingPresets): EasingFunction {
  return easingPresets[name]
}

/**
 * Interpolate between two values using an easing function
 * 使用缓动函数在两个值之间插值
 *
 * @param start - Start value
 * @param end - End value
 * @param progress - Progress from 0 to 1
 * @param easingFn - Easing function to use
 * @returns Interpolated value
 */
export function interpolate(
  start: number,
  end: number,
  progress: number,
  easingFn: EasingFunction = linear
): number {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const easedProgress = easingFn(clampedProgress)
  return start + (end - start) * easedProgress
}
