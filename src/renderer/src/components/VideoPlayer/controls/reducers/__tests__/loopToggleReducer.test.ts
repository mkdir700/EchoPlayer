/**
 * Loop Toggle Reducer Tests
 * 循环切换 Reducer 测试
 *
 * 测试覆盖：
 * - 状态转换逻辑 / State transition logic
 * - Action creators / Action 创建器
 * - 边界条件处理 / Edge case handling
 * - 类型安全性 / Type safety
 */

import {
  loopComponentReducer,
  initialLoopComponentState,
  loopToggleActions,
  type LoopComponentState
} from '../loopToggleReducer'

describe('loopComponentReducer', () => {
  describe('TOGGLE_LOOP action', () => {
    it('should set remaining count when enabling loop with count >= 2', () => {
      const action = loopToggleActions.toggleLoop(true, 5)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(5)
    })

    it('should set remaining count to 0 when enabling loop with count < 2', () => {
      const action = loopToggleActions.toggleLoop(true, 1)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(0)
    })

    it('should set remaining count to 0 when disabling loop', () => {
      const action = loopToggleActions.toggleLoop(false, 5)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(0)
    })
  })

  describe('SET_LOOP_COUNT action', () => {
    it('should update remaining count when single loop is enabled', () => {
      const action = loopToggleActions.setLoopCount(3, true)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(3)
    })

    it('should set remaining count to 0 when single loop is disabled', () => {
      const action = loopToggleActions.setLoopCount(3, false)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(0)
    })
  })

  describe('DECREASE_REMAINING_COUNT action', () => {
    it('should decrease remaining count by 1', () => {
      const initialState: LoopComponentState = {
        ...initialLoopComponentState,
        remainingCount: 5
      }
      const action = loopToggleActions.decreaseRemainingCount()
      const result = loopComponentReducer(initialState, action)

      expect(result.remainingCount).toBe(4)
    })

    it('should not go below 0', () => {
      const initialState: LoopComponentState = {
        ...initialLoopComponentState,
        remainingCount: 0
      }
      const action = loopToggleActions.decreaseRemainingCount()
      const result = loopComponentReducer(initialState, action)

      expect(result.remainingCount).toBe(0)
    })
  })

  describe('RESET_REMAINING_COUNT action', () => {
    it('should reset remaining count for valid count', () => {
      const action = loopToggleActions.resetRemainingCount(7)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(7)
    })

    it('should set to 0 for count < 2', () => {
      const action = loopToggleActions.resetRemainingCount(1)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(0)
    })
  })

  describe('Menu actions', () => {
    it('should open menu', () => {
      const action = loopToggleActions.openMenu()
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.isMenuOpen).toBe(true)
    })

    it('should close menu', () => {
      const initialState: LoopComponentState = {
        ...initialLoopComponentState,
        isMenuOpen: true
      }
      const action = loopToggleActions.closeMenu()
      const result = loopComponentReducer(initialState, action)

      expect(result.isMenuOpen).toBe(false)
    })
  })

  describe('Modal actions', () => {
    it('should open custom modal and close menu', () => {
      const initialState: LoopComponentState = {
        ...initialLoopComponentState,
        isMenuOpen: true
      }
      const action = loopToggleActions.openCustomModal()
      const result = loopComponentReducer(initialState, action)

      expect(result.isCustomModalOpen).toBe(true)
      expect(result.isMenuOpen).toBe(false)
    })

    it('should close custom modal', () => {
      const initialState: LoopComponentState = {
        ...initialLoopComponentState,
        isCustomModalOpen: true
      }
      const action = loopToggleActions.closeCustomModal()
      const result = loopComponentReducer(initialState, action)

      expect(result.isCustomModalOpen).toBe(false)
    })
  })

  describe('State management actions', () => {
    it('should initialize loop state correctly', () => {
      const action = loopToggleActions.initializeLoopState(true, 4)
      const result = loopComponentReducer(initialLoopComponentState, action)

      expect(result.remainingCount).toBe(4)
    })

    it('should clear loop state', () => {
      const initialState: LoopComponentState = {
        ...initialLoopComponentState,
        remainingCount: 5
      }
      const action = loopToggleActions.clearLoopState()
      const result = loopComponentReducer(initialState, action)

      expect(result.remainingCount).toBe(0)
    })
  })

  describe('State immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialLoopComponentState }
      const action = loopToggleActions.toggleLoop(true, 3)

      loopComponentReducer(originalState, action)

      expect(originalState).toEqual(initialLoopComponentState)
    })
  })

  describe('Action creators', () => {
    it('should create correct action objects', () => {
      expect(loopToggleActions.toggleLoop(true, 5)).toEqual({
        type: 'TOGGLE_LOOP',
        newIsSingleLoop: true,
        loopCount: 5
      })

      expect(loopToggleActions.openMenu()).toEqual({
        type: 'OPEN_MENU'
      })

      expect(loopToggleActions.decreaseRemainingCount()).toEqual({
        type: 'DECREASE_REMAINING_COUNT'
      })
    })
  })
})
