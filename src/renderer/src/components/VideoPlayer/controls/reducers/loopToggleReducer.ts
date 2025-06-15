/**
 * Loop Toggle Button Reducer
 * 循环切换按钮的状态管理 Reducer
 *
 * 职责分离：
 * - 纯函数状态更新逻辑 / Pure function state update logic
 * - 类型定义和接口 / Type definitions and interfaces
 * - 状态转换规则 / State transition rules
 */

// 组件内部状态类型定义 / Internal state type definitions
export interface LoopComponentState {
  remainingCount: number
  isMenuOpen: boolean
  isCustomModalOpen: boolean
}

// Action类型定义 / Action type definitions
export type LoopComponentAction =
  | { type: 'TOGGLE_LOOP'; newIsSingleLoop: boolean; loopCount: number }
  | { type: 'SET_LOOP_COUNT'; count: number; isSingleLoop: boolean }
  | { type: 'DECREASE_REMAINING_COUNT' }
  | { type: 'RESET_REMAINING_COUNT'; count: number }
  | { type: 'OPEN_MENU' }
  | { type: 'CLOSE_MENU' }
  | { type: 'OPEN_CUSTOM_MODAL' }
  | { type: 'CLOSE_CUSTOM_MODAL' }
  | { type: 'INITIALIZE_LOOP_STATE'; isSingleLoop: boolean; loopCount: number }
  | { type: 'CLEAR_LOOP_STATE' }

// 初始状态 / Initial state
export const initialLoopComponentState: LoopComponentState = {
  remainingCount: 0,
  isMenuOpen: false,
  isCustomModalOpen: false
}

/**
 * 循环次数计算辅助函数 / Helper function for calculating remaining count
 * @param isSingleLoop - 是否开启单句循环 / Whether single loop is enabled
 * @param loopCount - 循环次数设置 / Loop count setting
 * @returns 剩余循环次数 / Remaining loop count
 */
function calculateRemainingCount(isSingleLoop: boolean, loopCount: number): number {
  return isSingleLoop && loopCount >= 2 ? loopCount : 0
}

/**
 * Loop Toggle Button Reducer Function
 * 循环切换按钮状态管理 Reducer 函数
 *
 * 特性 / Features:
 * - 纯函数实现，易于测试 / Pure function implementation, easy to test
 * - 类型安全的状态更新 / Type-safe state updates
 * - 清晰的状态转换逻辑 / Clear state transition logic
 * - 详细的中英文注释 / Detailed bilingual comments
 *
 * @param state - 当前状态 / Current state
 * @param action - 要执行的动作 / Action to execute
 * @returns 新的状态 / New state
 */
export function loopComponentReducer(
  state: LoopComponentState,
  action: LoopComponentAction
): LoopComponentState {
  switch (action.type) {
    case 'TOGGLE_LOOP': {
      // 循环开关切换时的状态更新 / State update when toggling loop
      const newRemainingCount = calculateRemainingCount(action.newIsSingleLoop, action.loopCount)
      return {
        ...state,
        remainingCount: newRemainingCount
      }
    }

    case 'SET_LOOP_COUNT': {
      // 设置循环次数时的状态更新 / State update when setting loop count
      const newRemainingCount = calculateRemainingCount(action.isSingleLoop, action.count)
      return {
        ...state,
        remainingCount: newRemainingCount
      }
    }

    case 'DECREASE_REMAINING_COUNT': {
      // 减少剩余循环次数 / Decrease remaining count
      return {
        ...state,
        remainingCount: Math.max(0, state.remainingCount - 1)
      }
    }

    case 'RESET_REMAINING_COUNT': {
      // 重置剩余循环次数 / Reset remaining count
      return {
        ...state,
        remainingCount: action.count >= 2 ? action.count : 0
      }
    }

    case 'OPEN_MENU': {
      // 打开右键菜单 / Open context menu
      return {
        ...state,
        isMenuOpen: true
      }
    }

    case 'CLOSE_MENU': {
      // 关闭右键菜单 / Close context menu
      return {
        ...state,
        isMenuOpen: false
      }
    }

    case 'OPEN_CUSTOM_MODAL': {
      // 打开自定义次数模态框，同时关闭菜单 / Open custom count modal and close menu
      return {
        ...state,
        isCustomModalOpen: true,
        isMenuOpen: false
      }
    }

    case 'CLOSE_CUSTOM_MODAL': {
      // 关闭自定义次数模态框 / Close custom count modal
      return {
        ...state,
        isCustomModalOpen: false
      }
    }

    case 'INITIALIZE_LOOP_STATE': {
      // 初始化循环状态 / Initialize loop state
      const newRemainingCount = calculateRemainingCount(action.isSingleLoop, action.loopCount)
      return {
        ...state,
        remainingCount: newRemainingCount
      }
    }

    case 'CLEAR_LOOP_STATE': {
      // 清理循环状态 / Clear loop state
      return {
        ...state,
        remainingCount: 0
      }
    }

    default: {
      // 类型安全的 exhaustive check / Type-safe exhaustive check
      const exhaustiveCheck: never = action
      throw new Error(
        `未知的action类型 / Unknown action type: ${(exhaustiveCheck as LoopComponentAction).type}`
      )
    }
  }
}

/**
 * Action Creators - 创建标准化的 action 对象 / Create standardized action objects
 */
export const loopToggleActions = {
  toggleLoop: (newIsSingleLoop: boolean, loopCount: number): LoopComponentAction => ({
    type: 'TOGGLE_LOOP',
    newIsSingleLoop,
    loopCount
  }),

  setLoopCount: (count: number, isSingleLoop: boolean): LoopComponentAction => ({
    type: 'SET_LOOP_COUNT',
    count,
    isSingleLoop
  }),

  decreaseRemainingCount: (): LoopComponentAction => ({
    type: 'DECREASE_REMAINING_COUNT'
  }),

  resetRemainingCount: (count: number): LoopComponentAction => ({
    type: 'RESET_REMAINING_COUNT',
    count
  }),

  openMenu: (): LoopComponentAction => ({
    type: 'OPEN_MENU'
  }),

  closeMenu: (): LoopComponentAction => ({
    type: 'CLOSE_MENU'
  }),

  openCustomModal: (): LoopComponentAction => ({
    type: 'OPEN_CUSTOM_MODAL'
  }),

  closeCustomModal: (): LoopComponentAction => ({
    type: 'CLOSE_CUSTOM_MODAL'
  }),

  initializeLoopState: (isSingleLoop: boolean, loopCount: number): LoopComponentAction => ({
    type: 'INITIALIZE_LOOP_STATE',
    isSingleLoop,
    loopCount
  }),

  clearLoopState: (): LoopComponentAction => ({
    type: 'CLEAR_LOOP_STATE'
  })
}
