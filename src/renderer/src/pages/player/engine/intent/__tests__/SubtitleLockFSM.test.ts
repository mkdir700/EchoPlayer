import { beforeEach, describe, expect, it } from 'vitest'

import { createSubtitleLockFSM, DefaultSubtitleLockFSM, SubtitleLockFSM } from '../SubtitleLockFSM'

describe('SubtitleLockFSM - 字幕锁定状态机', () => {
  let fsm: SubtitleLockFSM

  beforeEach(() => {
    fsm = createSubtitleLockFSM()
  })

  describe('初始状态', () => {
    it('应该以未锁定状态开始', () => {
      const state = fsm.getState()

      expect(state.state).toBe('unlocked')
      expect(state.owner).toBeUndefined()
      expect(state.lockedIndex).toBeUndefined()
      expect(state.pendingIndex).toBeUndefined()
    })
  })

  describe('锁定操作', () => {
    it('应该能锁定字幕索引', () => {
      fsm.lock('loop', 5)

      const state = fsm.getState()
      expect(state.state).toBe('locked')
      expect(state.owner).toBe('loop')
      expect(state.lockedIndex).toBe(5)
      expect(state.pendingIndex).toBeUndefined()
    })

    it('锁定时不指定索引应该保持现有锁定索引', () => {
      fsm.lock('loop', 3)
      fsm.lock('loop') // 不指定新索引

      const state = fsm.getState()
      expect(state.state).toBe('locked')
      expect(state.lockedIndex).toBe(3) // 保持原有索引
    })

    it('锁定时应该清除待处理的索引建议', () => {
      // 先在未锁定状态下建议一个索引
      fsm.suggestIndex(2)
      // 然后锁定
      fsm.lock('loop', 5)

      const state = fsm.getState()
      expect(state.pendingIndex).toBeUndefined()
    })
  })

  describe('解锁操作', () => {
    it('锁定拥有者应该能解锁', () => {
      fsm.lock('loop', 3)
      fsm.unlock('loop')

      const state = fsm.getState()
      expect(state.state).toBe('unlocked')
      expect(state.owner).toBeUndefined()
      expect(state.lockedIndex).toBeUndefined()
    })

    it('非锁定拥有者不应该能解锁', () => {
      fsm.lock('loop', 3)
      fsm.unlock('drag') // 不同的拥有者尝试解锁

      const state = fsm.getState()
      expect(state.state).toBe('locked') // 仍然锁定
      expect(state.owner).toBe('loop')
      expect(state.lockedIndex).toBe(3)
    })

    it('未锁定状态下解锁操作应该被忽略', () => {
      fsm.unlock('anyone')

      const state = fsm.getState()
      expect(state.state).toBe('unlocked')
    })
  })

  describe('索引建议', () => {
    it('未锁定状态下应该接受索引建议', () => {
      const result = fsm.suggestIndex(7)

      expect(result).toBe(7)
      const state = fsm.getState()
      expect(state.state).toBe('unlocked')
    })

    it('锁定状态下应该拒绝索引建议并返回锁定索引', () => {
      fsm.lock('loop', 3)
      const result = fsm.suggestIndex(7)

      expect(result).toBe(3) // 返回锁定的索引
      const state = fsm.getState()
      expect(state.pendingIndex).toBe(7) // 保存待处理建议
    })

    it('锁定状态下多次建议应该更新待处理索引', () => {
      fsm.lock('loop', 3)
      fsm.suggestIndex(5)
      fsm.suggestIndex(8)

      const state = fsm.getState()
      expect(state.pendingIndex).toBe(8) // 最新的建议
    })
  })

  describe('强制更新索引', () => {
    it('锁定状态下应该能强制更新锁定索引', () => {
      fsm.lock('loop', 3)
      fsm.forceUpdateIndex(9)

      const state = fsm.getState()
      expect(state.lockedIndex).toBe(9)
      expect(state.state).toBe('locked')
    })

    it('未锁定状态下强制更新应该被忽略', () => {
      fsm.forceUpdateIndex(9)

      const state = fsm.getState()
      expect(state.state).toBe('unlocked')
      expect(state.lockedIndex).toBeUndefined()
    })
  })

  describe('重置操作', () => {
    it('应该能重置到初始状态', () => {
      fsm.lock('loop', 5)
      fsm.suggestIndex(8)
      fsm.reset()

      const state = fsm.getState()
      expect(state.state).toBe('unlocked')
      expect(state.owner).toBeUndefined()
      expect(state.lockedIndex).toBeUndefined()
      expect(state.pendingIndex).toBeUndefined()
    })
  })

  describe('完整的锁定周期场景', () => {
    it('应该正确处理循环播放的锁定解锁周期', () => {
      // 1. 开始时未锁定，可以接受建议
      let result = fsm.suggestIndex(2)
      expect(result).toBe(2)

      // 2. 循环开始，锁定字幕
      fsm.lock('loop', 2)
      let state = fsm.getState()
      expect(state.state).toBe('locked')
      expect(state.lockedIndex).toBe(2)

      // 3. 循环过程中，忽略同步建议但保存为待处理
      result = fsm.suggestIndex(3)
      expect(result).toBe(2) // 返回锁定索引
      state = fsm.getState()
      expect(state.pendingIndex).toBe(3)

      // 4. 更多同步建议
      result = fsm.suggestIndex(4)
      expect(result).toBe(2) // 仍返回锁定索引
      state = fsm.getState()
      expect(state.pendingIndex).toBe(4) // 更新待处理

      // 5. 循环结束，解锁
      fsm.unlock('loop')
      state = fsm.getState()
      expect(state.state).toBe('unlocked')
      expect(state.pendingIndex).toBeUndefined() // 解锁时清除待处理

      // 6. 解锁后可以正常接受建议
      result = fsm.suggestIndex(5)
      expect(result).toBe(5)
    })

    it('应该正确处理拥有者权限检查', () => {
      // 循环锁定
      fsm.lock('loop', 2)

      // 其他组件尝试解锁应该失败
      fsm.unlock('drag')
      let state = fsm.getState()
      expect(state.state).toBe('locked')

      // 其他组件尝试锁定应该成功（覆盖之前的锁定）
      fsm.lock('drag', 5)
      state = fsm.getState()
      expect(state.owner).toBe('drag')
      expect(state.lockedIndex).toBe(5)

      // 现在只有 drag 能解锁
      fsm.unlock('loop') // 失败
      state = fsm.getState()
      expect(state.state).toBe('locked')

      fsm.unlock('drag') // 成功
      state = fsm.getState()
      expect(state.state).toBe('unlocked')
    })
  })

  describe('工厂函数', () => {
    it('createSubtitleLockFSM 应该返回 DefaultSubtitleLockFSM 实例', () => {
      const newFsm = createSubtitleLockFSM()
      expect(newFsm).toBeInstanceOf(DefaultSubtitleLockFSM)

      const state = newFsm.getState()
      expect(state.state).toBe('unlocked')
    })
  })
})
