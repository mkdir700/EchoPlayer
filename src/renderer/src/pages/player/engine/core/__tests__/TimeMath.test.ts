import { describe, expect, it } from 'vitest'

import { TimeConstants, TimeMath, TM } from '../TimeMath'

describe('TimeMath - 时间数学计算模块', () => {
  describe('基础常量和别名', () => {
    it('应该有正确的 EPS 常量值', () => {
      expect(TimeMath.EPS).toBe(0.002)
    })

    it('TM 别名应该指向 TimeMath', () => {
      expect(TM).toBe(TimeMath)
    })

    it('TimeConstants 应该包含所有必需的常量', () => {
      expect(TimeConstants.EPS).toBe(TimeMath.EPS)
      expect(TimeConstants.MS_TO_SECOND).toBe(0.001)
      expect(TimeConstants.SECOND_TO_MS).toBe(1000)
      expect(TimeConstants.SHORT_DELAY_MS).toBe(50)
      expect(TimeConstants.LONG_DELAY_MS).toBe(200)
      expect(TimeConstants.SUBTITLE_HYSTERESIS_MS).toBe(30)
      expect(TimeConstants.SUBTITLE_HYSTERESIS_S).toBe(0.03)
    })
  })

  describe('equals - 浮点数相等比较', () => {
    it('应该正确判断在容差范围内相等的数值', () => {
      expect(TimeMath.equals(1.001, 1.002, 0.002)).toBe(true)
      expect(TimeMath.equals(1.0, 1.001, 0.002)).toBe(true)
      expect(TimeMath.equals(5.0, 5.0015, 0.002)).toBe(true)
    })

    it('应该正确判断超出容差范围的数值', () => {
      expect(TimeMath.equals(1.0, 1.003, 0.002)).toBe(false)
      expect(TimeMath.equals(1.0, 1.005, 0.002)).toBe(false)
      expect(TimeMath.equals(0.0, 0.003, 0.002)).toBe(false)
    })

    it('应该使用默认的 EPS 容差', () => {
      expect(TimeMath.equals(1.0, 1.001)).toBe(true)
      expect(TimeMath.equals(1.0, 1.003)).toBe(false)
    })

    it('应该正确处理边界值', () => {
      // 恰好在容差边界上
      expect(TimeMath.equals(1.0, 1.002)).toBe(false) // 差值 = EPS，不小于 EPS
      expect(TimeMath.equals(1.0, 1.0019)).toBe(true) // 差值 < EPS
    })

    it('应该正确处理负数', () => {
      expect(TimeMath.equals(-1.001, -1.002, 0.002)).toBe(true)
      expect(TimeMath.equals(-1.0, -1.003, 0.002)).toBe(false)
    })

    it('应该正确处理零值', () => {
      expect(TimeMath.equals(0, 0.001, 0.002)).toBe(true)
      expect(TimeMath.equals(0, 0.003, 0.002)).toBe(false)
    })
  })

  describe('inside - 区间包含判断', () => {
    it('应该正确判断在区间内的时间点', () => {
      // 左闭右开区间 [1.0, 3.0)
      expect(TimeMath.inside(1.0, 3.0, 1.0)).toBe(true) // 左边界
      expect(TimeMath.inside(1.0, 3.0, 2.0)).toBe(true) // 中间
      expect(TimeMath.inside(1.0, 3.0, 2.999)).toBe(true) // 接近右边界
    })

    it('应该正确判断在区间外的时间点', () => {
      // 左闭右开区间 [1.0, 3.0)，考虑默认容差 0.002
      expect(TimeMath.inside(1.0, 3.0, 0.997)).toBe(false) // 左边界之外(超出容差)
      expect(TimeMath.inside(1.0, 3.0, 3.003)).toBe(false) // 右边界之外(超出容差)
      expect(TimeMath.inside(1.0, 3.0, 0.5)).toBe(false) // 明显在左边界之外
      expect(TimeMath.inside(1.0, 3.0, 4.0)).toBe(false) // 明显在右边界之外
    })

    it('应该正确处理容差边界', () => {
      const eps = 0.001
      expect(TimeMath.inside(1.0, 3.0, 0.9995, eps)).toBe(true) // 左边界容差内
      expect(TimeMath.inside(1.0, 3.0, 3.0005, eps)).toBe(true) // 右边界容差内
      expect(TimeMath.inside(1.0, 3.0, 0.998, eps)).toBe(false) // 超出左边界容差
      expect(TimeMath.inside(1.0, 3.0, 3.002, eps)).toBe(false) // 超出右边界容差
    })

    it('应该使用默认的 EPS 容差', () => {
      expect(TimeMath.inside(1.0, 3.0, 0.999)).toBe(true) // 在默认容差内
      expect(TimeMath.inside(1.0, 3.0, 3.001)).toBe(true) // 在默认容差内
    })

    it('应该正确处理零长度区间', () => {
      // 对于零长度区间 [1.0, 1.0)，由于容差的存在
      // inside 函数: t >= start - eps && t < end + eps
      // 即: 1.0 >= 1.0 - 0.001 && 1.0 < 1.0 + 0.001
      // 即: 1.0 >= 0.999 && 1.0 < 1.001，结果为 true
      expect(TimeMath.inside(1.0, 1.0, 1.0, 0.001)).toBe(true) // 在容差范围内是有效的
      expect(TimeMath.inside(1.0, 1.0, 0.999, 0.002)).toBe(true) // 在容差内
      expect(TimeMath.inside(1.0, 1.0, 1.0, 0.0)).toBe(false) // 无容差时，右边界不包含
    })

    it('应该正确处理反向区间', () => {
      // start > end 的情况
      expect(TimeMath.inside(3.0, 1.0, 2.0)).toBe(false)
    })
  })

  describe('crossedRightBoundary - 右边界跨越检测', () => {
    it('应该正确检测边界跨越', () => {
      const boundary = 3.0

      // 从内部到外部（考虑默认容差0.002）
      // wasInside: prevT < end + eps (3.002), isOutside: t >= end + eps (3.002)
      expect(TimeMath.crossedRightBoundary(2.99, 3.01, boundary)).toBe(true) // 2.99 < 3.002 && 3.01 >= 3.002
      expect(TimeMath.crossedRightBoundary(2.8, 3.1, boundary)).toBe(true) // 2.8 < 3.002 && 3.1 >= 3.002
      expect(TimeMath.crossedRightBoundary(2.999, 3.003, boundary)).toBe(true) // 2.999 < 3.002 && 3.003 >= 3.002
    })

    it('应该正确识别非跨越情况', () => {
      const boundary = 3.0

      // 都在内部
      expect(TimeMath.crossedRightBoundary(2.8, 2.9, boundary)).toBe(false)
      expect(TimeMath.crossedRightBoundary(2.99, 2.999, boundary)).toBe(false)

      // 都在外部
      expect(TimeMath.crossedRightBoundary(3.1, 3.2, boundary)).toBe(false)
      expect(TimeMath.crossedRightBoundary(3.01, 3.05, boundary)).toBe(false)

      // 从外部到内部（反向跨越）
      expect(TimeMath.crossedRightBoundary(3.1, 2.9, boundary)).toBe(false)
    })

    it('应该正确处理容差边界情况', () => {
      const boundary = 3.0
      const eps = 0.001

      // 在容差边界上的跨越
      // end + eps = 3.001
      expect(TimeMath.crossedRightBoundary(2.9995, 3.0015, boundary, eps)).toBe(true) // 2.9995 < 3.001 && 3.0015 >= 3.001
      expect(TimeMath.crossedRightBoundary(3.0015, 3.0025, boundary, eps)).toBe(false) // 都在外部: 3.0015 >= 3.001 (wasInside = false)
    })

    it('应该使用默认的 EPS 容差', () => {
      const boundary = 3.0

      // 使用默认容差 (0.002)
      expect(TimeMath.crossedRightBoundary(2.999, 3.003, boundary)).toBe(true)
      expect(TimeMath.crossedRightBoundary(3.003, 3.005, boundary)).toBe(false)
    })

    it('应该正确处理边界抖动场景', () => {
      const boundary = 3.0

      // 模拟字幕结束时间附近的抖动
      expect(TimeMath.crossedRightBoundary(2.998, 3.002, boundary)).toBe(true)
      expect(TimeMath.crossedRightBoundary(3.002, 2.998, boundary)).toBe(false) // 反向
      expect(TimeMath.crossedRightBoundary(2.999, 2.9995, boundary)).toBe(false) // 都在内部
    })

    it('应该正确处理负数边界', () => {
      const boundary = -1.0

      expect(TimeMath.crossedRightBoundary(-1.5, -0.5, boundary)).toBe(true)
      expect(TimeMath.crossedRightBoundary(-1.5, -1.2, boundary)).toBe(false)
    })
  })

  describe('clamp - 数值裁剪', () => {
    it('应该正确裁剪超出上界的值', () => {
      expect(TimeMath.clamp(1.5, 0, 1)).toBe(1)
      expect(TimeMath.clamp(10, 0, 5)).toBe(5)
      expect(TimeMath.clamp(3.14, 0, 3)).toBe(3)
    })

    it('应该正确裁剪低于下界的值', () => {
      expect(TimeMath.clamp(-0.5, 0, 1)).toBe(0)
      expect(TimeMath.clamp(-10, 0, 5)).toBe(0)
      expect(TimeMath.clamp(-1, 0, 3)).toBe(0)
    })

    it('应该保持在范围内的值不变', () => {
      expect(TimeMath.clamp(0.5, 0, 1)).toBe(0.5)
      expect(TimeMath.clamp(2.5, 0, 5)).toBe(2.5)
      expect(TimeMath.clamp(1.5, 0, 3)).toBe(1.5)
    })

    it('应该正确处理边界值', () => {
      expect(TimeMath.clamp(0, 0, 1)).toBe(0)
      expect(TimeMath.clamp(1, 0, 1)).toBe(1)
      expect(TimeMath.clamp(5, 5, 10)).toBe(5)
      expect(TimeMath.clamp(10, 5, 10)).toBe(10)
    })

    it('应该处理 min > max 的异常情况', () => {
      // 当 min > max 时，应该返回原值并记录警告
      expect(TimeMath.clamp(5, 10, 0)).toBe(5) // min=10, max=0, 返回原值
      expect(TimeMath.clamp(2, 5, 3)).toBe(2) // min=5, max=3, 返回原值
    })

    it('应该正确处理负数范围', () => {
      expect(TimeMath.clamp(-2, -5, -1)).toBe(-2)
      expect(TimeMath.clamp(-6, -5, -1)).toBe(-5)
      expect(TimeMath.clamp(0, -5, -1)).toBe(-1)
    })

    it('应该正确处理零值', () => {
      expect(TimeMath.clamp(0, -1, 1)).toBe(0)
      expect(TimeMath.clamp(0, 0, 0)).toBe(0)
    })
  })

  describe('detectBoundaryFlutter - 边界抖动检测', () => {
    it('应该检测到边界抖动', () => {
      const boundary = 3.0
      // 检查 boundary - eps = 3.0 - 0.002 = 2.998 作为分界线
      // 需要跨越 2.998 这个分界线来产生抖动
      const history = [3.0, 2.997, 3.0, 2.997] // 在2.998边界附近抖动

      expect(TimeMath.detectBoundaryFlutter(history, boundary)).toBe(true)
    })

    it('应该识别稳定的时间序列（无抖动）', () => {
      const boundary = 3.0

      // 单调递增
      const increasing = [2.5, 2.6, 2.7, 2.8]
      expect(TimeMath.detectBoundaryFlutter(increasing, boundary)).toBe(false)

      // 单调递减
      const decreasing = [3.5, 3.4, 3.3, 3.2]
      expect(TimeMath.detectBoundaryFlutter(decreasing, boundary)).toBe(false)

      // 在一侧稳定
      const stable = [2.8, 2.81, 2.79, 2.82]
      expect(TimeMath.detectBoundaryFlutter(stable, boundary)).toBe(false)
    })

    it('应该要求至少3个数据点', () => {
      const boundary = 3.0

      expect(TimeMath.detectBoundaryFlutter([], boundary)).toBe(false)
      expect(TimeMath.detectBoundaryFlutter([3.0], boundary)).toBe(false)
      expect(TimeMath.detectBoundaryFlutter([2.9, 3.1], boundary)).toBe(false)
    })

    it('应该正确识别不同抖动模式', () => {
      const boundary = 3.0

      // 频繁跨越（2次以上）
      const highFreq = [3.1, 2.9, 3.1, 2.9, 3.1]
      expect(TimeMath.detectBoundaryFlutter(highFreq, boundary)).toBe(true)

      // 单次跨越
      const singleCross = [2.9, 3.1, 3.2, 3.3]
      expect(TimeMath.detectBoundaryFlutter(singleCross, boundary)).toBe(false)
    })

    it('应该使用自定义容差', () => {
      const boundary = 3.0
      const eps = 0.1 // 较大的容差
      const history = [3.05, 2.95, 3.05, 2.95] // 在较大容差下可能不算跨越

      // 使用较大容差时可能检测不到抖动
      expect(TimeMath.detectBoundaryFlutter(history, boundary, eps)).toBe(false)
    })

    it('应该正确处理边界情况', () => {
      const boundary = 0

      // 跨越零点的抖动
      const zeroFlutter = [0.1, -0.1, 0.1, -0.1]
      expect(TimeMath.detectBoundaryFlutter(zeroFlutter, boundary)).toBe(true)
    })
  })

  describe('性能和稳定性测试', () => {
    it('函数调用应该有可接受的性能', () => {
      const start = performance.now()

      // 执行大量操作
      for (let i = 0; i < 10000; i++) {
        TimeMath.inside(0, 10, i / 1000)
        TimeMath.crossedRightBoundary(i / 1000, (i + 1) / 1000, 5)
        TimeMath.clamp(i / 1000, 0, 10)
        TimeMath.equals(i / 1000, (i + 0.5) / 1000)
      }

      const elapsed = performance.now() - start

      // 10k 次操作应该在合理时间内完成（< 100ms）
      expect(elapsed).toBeLessThan(100)
    })

    it('应该正确处理极值输入', () => {
      expect(() => {
        TimeMath.inside(Number.MIN_VALUE, Number.MAX_VALUE, 0)
        TimeMath.crossedRightBoundary(-Infinity, Infinity, 0)
        TimeMath.clamp(NaN, 0, 1)
        TimeMath.equals(Infinity, -Infinity)
      }).not.toThrow()
    })

    it('应该处理 NaN 输入', () => {
      expect(TimeMath.clamp(NaN, 0, 1)).toBeNaN()
      expect(TimeMath.equals(NaN, NaN)).toBe(false) // NaN !== NaN
      expect(TimeMath.inside(NaN, 1, 0.5)).toBe(false)
    })

    it('应该处理 Infinity 输入', () => {
      expect(TimeMath.clamp(Infinity, 0, 1)).toBe(1)
      expect(TimeMath.clamp(-Infinity, 0, 1)).toBe(0)
      expect(TimeMath.inside(0, Infinity, 100)).toBe(true)
      expect(TimeMath.inside(-Infinity, 0, -100)).toBe(true)
    })
  })

  describe('实际用例场景测试', () => {
    it('字幕边界检测场景', () => {
      const subtitleStart = 10.0
      const subtitleEnd = 15.0
      const hysteresis = TimeConstants.SUBTITLE_HYSTERESIS_S

      // 在字幕时间范围内
      expect(TimeMath.inside(subtitleStart, subtitleEnd, 12.5, hysteresis)).toBe(true)

      // 在迟滞窗口内
      expect(TimeMath.inside(subtitleStart, subtitleEnd, 9.98, hysteresis)).toBe(true)
      expect(TimeMath.inside(subtitleStart, subtitleEnd, 15.02, hysteresis)).toBe(true)

      // 超出迟滞窗口
      expect(TimeMath.inside(subtitleStart, subtitleEnd, 9.95, hysteresis)).toBe(false)
      expect(TimeMath.inside(subtitleStart, subtitleEnd, 15.05, hysteresis)).toBe(false)
    })

    it('循环策略边界跨越场景', () => {
      const subtitleEnd = 15.0

      // 正常跨越字幕结束边界
      expect(TimeMath.crossedRightBoundary(14.98, 15.02, subtitleEnd)).toBe(true)

      // 在字幕内部移动
      expect(TimeMath.crossedRightBoundary(14.5, 14.8, subtitleEnd)).toBe(false)

      // 在字幕外部移动
      expect(TimeMath.crossedRightBoundary(15.5, 15.8, subtitleEnd)).toBe(false)
    })

    it('媒体时钟时间比较场景', () => {
      const currentTime = 12.345
      const newTime = 12.347

      // 使用 TimeMath.equals 代替 Math.abs 比较
      expect(TimeMath.equals(currentTime, newTime, 0.01)).toBe(true)
      expect(TimeMath.equals(currentTime, newTime, 0.001)).toBe(false)
    })

    it('时间裁剪场景', () => {
      const duration = 120.5

      // 确保时间在有效范围内
      expect(TimeMath.clamp(-1, 0, duration)).toBe(0)
      expect(TimeMath.clamp(60, 0, duration)).toBe(60)
      expect(TimeMath.clamp(150, 0, duration)).toBe(duration)
    })
  })
})
