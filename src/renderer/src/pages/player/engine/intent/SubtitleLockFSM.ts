import { loggerService } from '@logger'

const logger = loggerService.withContext('SubtitleLockFSM')

/**
 * 字幕锁定状态机
 * 管理字幕索引的锁定/解锁状态，独立于 PlayerOrchestrator
 */

export type LockState = 'unlocked' | 'locked'
export type LockEvent = 'lock' | 'unlock' | 'suggest_index'

export interface LockContext {
  state: LockState
  owner?: string // 锁定拥有者
  lockedIndex?: number // 锁定的索引
  pendingIndex?: number // 待处理的索引建议
}

export interface SubtitleLockFSM {
  /**
   * 获取当前状态
   */
  getState(): LockContext

  /**
   * 处理锁定事件
   */
  lock(owner: string, index?: number): void

  /**
   * 处理解锁事件
   */
  unlock(owner: string): void

  /**
   * 处理索引建议
   * @returns 返回应该应用的索引，如果返回 undefined 表示被锁定拒绝
   */
  suggestIndex(index: number): number | undefined

  /**
   * 强制更新当前索引（用于初始化或特殊情况）
   */
  forceUpdateIndex(index: number): void

  /**
   * 重置状态机
   */
  reset(): void
}

export class DefaultSubtitleLockFSM implements SubtitleLockFSM {
  private context: LockContext = {
    state: 'unlocked'
  }

  getState(): LockContext {
    return { ...this.context }
  }

  lock(owner: string, index?: number): void {
    const prevState = this.context.state

    this.context = {
      state: 'locked',
      owner,
      lockedIndex: index ?? this.context.lockedIndex,
      pendingIndex: undefined // 清除待处理的建议
    }

    if (this.context.lockedIndex === undefined) {
      logger.warn('锁定时未指定索引，且无现有锁定索引', { owner })
    } else {
      logger.debug('字幕锁定', {
        prevState,
        newState: this.context.state,
        owner,
        lockedIndex: this.context.lockedIndex
      })
    }
  }

  unlock(owner: string): void {
    // 只有锁定拥有者才能解锁
    if (this.context.state === 'locked' && this.context.owner === owner) {
      const prevState = this.context.state
      const pendingIndex = this.context.pendingIndex

      this.context = {
        state: 'unlocked',
        owner: undefined,
        lockedIndex: undefined,
        pendingIndex: undefined
      }

      logger.debug('字幕解锁', {
        prevState,
        newState: this.context.state,
        owner,
        hadPendingIndex: pendingIndex !== undefined
      })
    } else {
      logger.warn('无权解锁字幕', {
        currentState: this.context.state,
        currentOwner: this.context.owner,
        requestOwner: owner
      })
    }
  }

  suggestIndex(index: number): number | undefined {
    switch (this.context.state) {
      case 'unlocked':
        // 未锁定状态，直接应用建议
        logger.debug('接受索引建议', { index })
        return index

      case 'locked':
        // 锁定状态，保存建议但不应用
        this.context.pendingIndex = index

        logger.debug('索引建议被拒绝, 因为当前处于锁定状态', {
          suggestedIndex: index,
          lockedIndex: this.context.lockedIndex,
          owner: this.context.owner
        })

        // 返回当前锁定的索引
        return this.context.lockedIndex

      default:
        logger.error('未知的锁定状态', { state: this.context.state })
        return undefined
    }
  }

  forceUpdateIndex(index: number): void {
    if (this.context.state === 'locked') {
      this.context.lockedIndex = index
      logger.debug('强制更新锁定索引', { newIndex: index })
    }
    // 未锁定状态下不需要强制更新，因为会通过 suggestIndex 正常处理
  }

  reset(): void {
    const prevContext = { ...this.context }

    this.context = {
      state: 'unlocked',
      owner: undefined,
      lockedIndex: undefined,
      pendingIndex: undefined
    }

    logger.debug('重置字幕锁定状态机', { prevContext, newContext: this.context })
  }
}

/**
 * 工厂函数：创建默认的字幕锁定状态机
 */
export function createSubtitleLockFSM(): SubtitleLockFSM {
  return new DefaultSubtitleLockFSM()
}
