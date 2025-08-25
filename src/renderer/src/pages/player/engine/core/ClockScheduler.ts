import { loggerService } from '@logger'

import { MediaClock, MediaClockEvent } from '../MediaClock'
import { TimeMath } from './TimeMath'

const logger = loggerService.withContext('ClockScheduler')

/**
 * 调度任务类型
 */
export enum TaskType {
  /** 基于媒体时间的绝对调度 */
  MEDIA_TIME = 'media_time',
  /** 基于相对时间的延迟调度 */
  RELATIVE_TIME = 'relative_time'
}

/**
 * 调度器状态
 */
export enum SchedulerState {
  /** 空闲状态 */
  IDLE = 'idle',
  /** 运行状态 */
  RUNNING = 'running',
  /** 暂停状态 */
  PAUSED = 'paused'
}

/**
 * 调度任务接口
 */
export interface ScheduledTask {
  /** 任务ID */
  id: string
  /** 目标时间（秒） - 对于媒体时间任务是媒体时间，对于相对时间任务是绝对时间戳 */
  targetTime: number
  /** 任务回调函数 */
  callback: () => void
  /** 任务类型 */
  type: TaskType
  /** 创建时间戳（用于调试和排序） */
  createdAt: number
  /** 任务描述（用于调试） */
  description?: string
}

/**
 * 最小堆实现，用于管理调度队列
 * O(logN) 的插入和删除性能
 */
class MinHeap<T> {
  private items: T[] = []
  private compare: (a: T, b: T) => number

  constructor(compareFn: (a: T, b: T) => number) {
    this.compare = compareFn
  }

  /**
   * 获取堆大小
   */
  get size(): number {
    return this.items.length
  }

  /**
   * 检查堆是否为空
   */
  get isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * 查看堆顶元素（不删除）
   */
  peek(): T | undefined {
    return this.items[0]
  }

  /**
   * 插入元素 O(logN)
   */
  push(item: T): void {
    this.items.push(item)
    this.heapifyUp(this.items.length - 1)
  }

  /**
   * 删除并返回堆顶元素 O(logN)
   */
  pop(): T | undefined {
    if (this.isEmpty) return undefined

    const root = this.items[0]
    const lastItem = this.items.pop()!

    if (!this.isEmpty) {
      this.items[0] = lastItem
      this.heapifyDown(0)
    }

    return root
  }

  /**
   * 移除指定元素 O(N)
   */
  remove(predicate: (item: T) => boolean): boolean {
    const index = this.items.findIndex(predicate)
    if (index === -1) return false

    // 将最后一个元素移到要删除的位置
    const lastItem = this.items.pop()!
    if (index < this.items.length) {
      this.items[index] = lastItem
      // 可能需要向上或向下调整
      this.heapifyUp(index)
      this.heapifyDown(index)
    }

    return true
  }

  /**
   * 清空堆
   */
  clear(): void {
    this.items.length = 0
  }

  /**
   * 获取所有元素（用于调试）
   */
  toArray(): T[] {
    return [...this.items]
  }

  /**
   * 向上调整堆
   */
  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.compare(this.items[index], this.items[parentIndex]) >= 0) break

      this.swap(index, parentIndex)
      index = parentIndex
    }
  }

  /**
   * 向下调整堆
   */
  private heapifyDown(index: number): void {
    while (true) {
      let minIndex = index
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2

      if (
        leftChild < this.items.length &&
        this.compare(this.items[leftChild], this.items[minIndex]) < 0
      ) {
        minIndex = leftChild
      }

      if (
        rightChild < this.items.length &&
        this.compare(this.items[rightChild], this.items[minIndex]) < 0
      ) {
        minIndex = rightChild
      }

      if (minIndex === index) break

      this.swap(index, minIndex)
      index = minIndex
    }
  }

  /**
   * 交换两个元素
   */
  private swap(i: number, j: number): void {
    const temp = this.items[i]
    this.items[i] = this.items[j]
    this.items[j] = temp
  }
}

/**
 * ClockScheduler 时钟对齐调度器
 *
 * 基于 MediaClock 的统一调度器，替换所有 setTimeout 实现，
 * 确保延迟动作与媒体时钟同步。
 *
 * 特性：
 * - 支持基于媒体时间的绝对调度 scheduleAt()
 * - 支持基于相对时间的延迟调度 scheduleAfter()
 * - 使用最小堆管理调度队列，O(logN) 性能
 * - 监听 MediaClock 事件，自动处理播放状态变化
 * - 在 seek 时重新计算基于媒体时间的任务
 * - 提供完整的生命周期管理和资源清理
 */
export class ClockScheduler {
  private mediaClock: MediaClock
  private state: SchedulerState = SchedulerState.IDLE
  private taskQueue: MinHeap<ScheduledTask>
  private nextTaskId = 1
  private clockUnsubscribe?: () => void
  private rafId?: number

  // 性能统计
  private stats = {
    tasksExecuted: 0,
    tasksErrored: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0
  }

  // 批处理配置
  private readonly maxBatchSize = 10 // 单次最多执行10个任务
  private readonly maxExecutionTimePerFrame = 16 // 单帧最多执行16ms

  constructor(mediaClock: MediaClock) {
    this.mediaClock = mediaClock

    // 创建任务队列，按目标时间排序
    this.taskQueue = new MinHeap<ScheduledTask>((a, b) => {
      // 首先按目标时间排序
      const timeDiff = a.targetTime - b.targetTime
      if (!TimeMath.equals(timeDiff, 0, 0.001)) {
        return timeDiff
      }
      // 时间相同时按创建时间排序，确保稳定排序
      return a.createdAt - b.createdAt
    })

    logger.debug('ClockScheduler initialized')
  }

  /**
   * 获取当前调度器状态
   */
  getState(): SchedulerState {
    return this.state
  }

  /**
   * 获取当前队列中的任务数量
   */
  getQueueSize(): number {
    return this.taskQueue.size
  }

  /**
   * 获取队列中的所有任务（用于调试）
   */
  getQueueSnapshot(): ScheduledTask[] {
    return this.taskQueue.toArray()
  }

  /**
   * 获取性能统计信息
   */
  getStats() {
    return { ...this.stats }
  }

  /**
   * 重置性能统计
   */
  resetStats(): void {
    this.stats = {
      tasksExecuted: 0,
      tasksErrored: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0
    }
  }

  /**
   * 基于媒体时间调度任务
   * @param mediaTime 目标媒体时间（秒）
   * @param callback 回调函数
   * @param description 任务描述（可选，用于调试）
   * @returns 任务ID，可用于取消任务
   */
  scheduleAt(mediaTime: number, callback: () => void, description?: string): string {
    const taskId = `media_${this.nextTaskId++}`
    const task: ScheduledTask = {
      id: taskId,
      targetTime: mediaTime,
      callback,
      type: TaskType.MEDIA_TIME,
      createdAt: Date.now(),
      description
    }

    this.taskQueue.push(task)

    logger.debug(`Scheduled media time task: ${taskId}`, {
      mediaTime,
      description,
      queueSize: this.taskQueue.size
    })

    // 如果调度器正在运行，可能需要立即检查
    if (this.state === SchedulerState.RUNNING) {
      this.scheduleNextTick()
    }

    return taskId
  }

  /**
   * 基于相对时间调度任务
   * @param delayMs 延迟时间（毫秒）
   * @param callback 回调函数
   * @param description 任务描述（可选，用于调试）
   * @returns 任务ID，可用于取消任务
   */
  scheduleAfter(delayMs: number, callback: () => void, description?: string): string {
    const taskId = `relative_${this.nextTaskId++}`
    const targetTime = Date.now() + delayMs
    const task: ScheduledTask = {
      id: taskId,
      targetTime,
      callback,
      type: TaskType.RELATIVE_TIME,
      createdAt: Date.now(),
      description
    }

    this.taskQueue.push(task)

    logger.debug(`Scheduled relative time task: ${taskId}`, {
      delayMs,
      targetTime,
      description,
      queueSize: this.taskQueue.size
    })

    // 如果调度器正在运行，可能需要立即检查
    if (this.state === SchedulerState.RUNNING) {
      this.scheduleNextTick()
    }

    return taskId
  }

  /**
   * 取消指定任务
   * @param taskId 任务ID
   * @returns 是否成功取消
   */
  cancel(taskId: string): boolean {
    const removed = this.taskQueue.remove((task) => task.id === taskId)

    if (removed) {
      logger.debug(`Cancelled task: ${taskId}`, {
        queueSize: this.taskQueue.size
      })
    }

    return removed
  }

  /**
   * 取消所有任务
   */
  cancelAll(): void {
    const cancelledCount = this.taskQueue.size
    this.taskQueue.clear()

    logger.debug(`Cancelled all tasks`, {
      cancelledCount
    })
  }

  /**
   * 取消指定类型的所有任务
   * @param taskType 任务类型
   * @returns 取消的任务数量
   */
  cancelByType(taskType: TaskType): number {
    const tasks = this.taskQueue.toArray()
    const tasksToCancel = tasks.filter((task) => task.type === taskType)

    let cancelledCount = 0
    tasksToCancel.forEach((task) => {
      if (this.taskQueue.remove((t) => t.id === task.id)) {
        cancelledCount++
      }
    })

    logger.debug(`Cancelled ${cancelledCount} tasks of type ${taskType}`)
    return cancelledCount
  }

  /**
   * 批量调度多个媒体时间任务
   * @param tasks 任务数组，每个包含 { mediaTime, callback, description? }
   * @returns 任务ID数组
   */
  scheduleMultipleAt(
    tasks: Array<{
      mediaTime: number
      callback: () => void
      description?: string
    }>
  ): string[] {
    const taskIds: string[] = []

    tasks.forEach(({ mediaTime, callback, description }) => {
      const taskId = this.scheduleAt(mediaTime, callback, description)
      taskIds.push(taskId)
    })

    logger.debug(`Scheduled ${tasks.length} media time tasks in batch`, {
      taskIds,
      queueSize: this.taskQueue.size
    })

    return taskIds
  }

  /**
   * 批量调度多个相对时间任务
   * @param tasks 任务数组，每个包含 { delayMs, callback, description? }
   * @returns 任务ID数组
   */
  scheduleMultipleAfter(
    tasks: Array<{
      delayMs: number
      callback: () => void
      description?: string
    }>
  ): string[] {
    const taskIds: string[] = []

    tasks.forEach(({ delayMs, callback, description }) => {
      const taskId = this.scheduleAfter(delayMs, callback, description)
      taskIds.push(taskId)
    })

    logger.debug(`Scheduled ${tasks.length} relative time tasks in batch`, {
      taskIds,
      queueSize: this.taskQueue.size
    })

    return taskIds
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.state !== SchedulerState.IDLE) {
      logger.warn('Scheduler already started')
      return
    }

    this.state = SchedulerState.RUNNING
    this.subscribeToMediaClock()
    this.scheduleNextTick()

    logger.debug('Scheduler started')
  }

  /**
   * 暂停调度器
   */
  pause(): void {
    if (this.state === SchedulerState.PAUSED) return

    this.state = SchedulerState.PAUSED
    this.cancelTick()

    logger.debug('Scheduler paused')
  }

  /**
   * 恢复调度器
   */
  resume(): void {
    if (this.state !== SchedulerState.PAUSED) return

    this.state = SchedulerState.RUNNING
    this.scheduleNextTick()

    logger.debug('Scheduler resumed')
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.state === SchedulerState.IDLE) return

    this.state = SchedulerState.IDLE
    this.cancelTick()
    this.unsubscribeFromMediaClock()

    logger.debug('Scheduler stopped')
  }

  /**
   * 销毁调度器，清理所有资源
   */
  dispose(): void {
    this.stop()
    this.cancelAll()

    logger.debug('Scheduler disposed')
  }

  /**
   * 订阅 MediaClock 事件
   */
  private subscribeToMediaClock(): void {
    this.clockUnsubscribe = this.mediaClock.subscribe((event: MediaClockEvent) => {
      try {
        this.handleMediaClockEvent(event)
      } catch (error) {
        logger.error('Error handling MediaClock event:', { error, event })
      }
    })
  }

  /**
   * 取消订阅 MediaClock 事件
   */
  private unsubscribeFromMediaClock(): void {
    if (this.clockUnsubscribe) {
      this.clockUnsubscribe()
      this.clockUnsubscribe = undefined
    }
  }

  /**
   * 处理 MediaClock 事件
   */
  private handleMediaClockEvent(event: MediaClockEvent): void {
    switch (event.type) {
      case 'time_update':
        // 时间更新时检查并执行到期任务
        if (this.state === SchedulerState.RUNNING) {
          this.checkAndExecuteTasks(event.currentTime, event.timestamp)
        }
        break

      case 'seeking':
        // 开始跳转时暂停所有调度
        logger.debug('Seeking started, pausing scheduler')
        this.pause()
        break

      case 'seeked':
        // 跳转完成后重新计算基于媒体时间的任务并恢复调度
        logger.debug('Seeked completed, recalculating media time tasks')
        this.recalculateMediaTimeTasks(event.currentTime)
        if (this.mediaClock.getState().paused === false) {
          this.resume()
        }
        break

      case 'pause':
        // 播放暂停时暂停调度器
        logger.debug('Playback paused, pausing scheduler')
        this.pause()
        break

      case 'play':
        // 播放开始时恢复调度器
        logger.debug('Playback started, resuming scheduler')
        this.resume()
        break

      case 'ended':
        // 播放结束时暂停调度器
        logger.debug('Playback ended, pausing scheduler')
        this.pause()
        break

      case 'duration_change':
        // 时长变化时清理超出新时长的媒体时间任务
        logger.debug('Duration changed, cleaning up out-of-bounds tasks', {
          newDuration: event.duration
        })
        this.cleanupOutOfBoundsMediaTimeTasks(event.duration)
        break
    }
  }

  /**
   * 清理超出新时长的媒体时间任务
   * 在 duration_change 后调用，移除超出新时长的任务
   */
  private cleanupOutOfBoundsMediaTimeTasks(newDuration: number): void {
    const tasks = this.taskQueue.toArray()
    const tasksToRemove = tasks.filter(
      (task) => task.type === TaskType.MEDIA_TIME && task.targetTime > newDuration
    )

    let removedCount = 0
    tasksToRemove.forEach((task) => {
      if (this.taskQueue.remove((t) => t.id === task.id)) {
        removedCount++
        logger.debug(`Removed out-of-bounds media time task: ${task.id}`, {
          targetTime: task.targetTime,
          newDuration
        })
      }
    })

    if (removedCount > 0) {
      logger.debug(`Removed ${removedCount} out-of-bounds media time tasks after duration change`)
    }
  }

  /**
   * 重新计算基于媒体时间的任务
   * 在 seek 后调用，确保基于媒体时间的任务仍然有效
   */
  private recalculateMediaTimeTasks(newMediaTime: number): void {
    const tasks = this.taskQueue.toArray()
    const mediaTimeTasks = tasks.filter((task) => task.type === TaskType.MEDIA_TIME)

    // 移除已经过期的媒体时间任务
    let removedCount = 0
    mediaTimeTasks.forEach((task) => {
      if (task.targetTime < newMediaTime - TimeMath.EPS) {
        this.taskQueue.remove((t) => t.id === task.id)
        removedCount++
        logger.debug(`Removed expired media time task after seek: ${task.id}`, {
          targetTime: task.targetTime,
          newMediaTime
        })
      }
    })

    if (removedCount > 0) {
      logger.debug(`Removed ${removedCount} expired media time tasks after seek`)
    }
  }

  /**
   * 检查并执行到期任务
   */
  private checkAndExecuteTasks(currentMediaTime: number, currentTimestamp: number): void {
    const startTime = performance.now()
    const executedTasks: ScheduledTask[] = []

    // 检查队列顶部的任务，限制批处理大小
    while (!this.taskQueue.isEmpty && executedTasks.length < this.maxBatchSize) {
      const task = this.taskQueue.peek()!

      let shouldExecute = false

      if (task.type === TaskType.MEDIA_TIME) {
        // 媒体时间任务：检查媒体时间是否到达
        shouldExecute = currentMediaTime >= task.targetTime - TimeMath.EPS
      } else {
        // 相对时间任务：检查绝对时间是否到达
        shouldExecute = currentTimestamp >= task.targetTime
      }

      if (shouldExecute) {
        this.taskQueue.pop()
        executedTasks.push(task)
      } else {
        // 由于是最小堆，如果顶部任务还没到期，后面的都不会到期
        break
      }
    }

    // 执行所有到期任务，监控执行时间
    let totalTaskExecutionTime = 0
    for (let i = 0; i < executedTasks.length; i++) {
      const task = executedTasks[i]
      const taskStartTime = performance.now()

      try {
        logger.debug(`Executing task: ${task.id}`, {
          type: task.type,
          targetTime: task.targetTime,
          currentMediaTime: task.type === TaskType.MEDIA_TIME ? currentMediaTime : undefined,
          currentTimestamp: task.type === TaskType.RELATIVE_TIME ? currentTimestamp : undefined,
          description: task.description
        })

        task.callback()
        this.stats.tasksExecuted++

        const taskExecutionTime = performance.now() - taskStartTime
        totalTaskExecutionTime += taskExecutionTime

        // 如果单个任务执行时间过长，记录警告
        if (taskExecutionTime > 10) {
          logger.warn(`Task ${task.id} took ${taskExecutionTime.toFixed(2)}ms to execute`, {
            task,
            executionTime: taskExecutionTime
          })
        }
      } catch (error) {
        this.stats.tasksErrored++
        logger.error(`Error executing task ${task.id}:`, { error, task })
      }

      // 检查是否超过单帧执行时间限制
      if (performance.now() - startTime > this.maxExecutionTimePerFrame) {
        logger.warn(`Task execution exceeded frame budget`, {
          executedCount: i + 1,
          totalCount: executedTasks.length,
          frameTime: performance.now() - startTime
        })
        break
      }
    }

    // 更新统计信息
    if (totalTaskExecutionTime > 0) {
      this.stats.totalExecutionTime += totalTaskExecutionTime
      this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.tasksExecuted
    }

    // 如果还有未执行的任务，立即调度下一次检查
    if (executedTasks.length >= this.maxBatchSize && !this.taskQueue.isEmpty) {
      this.scheduleNextTick()
    }
  }

  /**
   * 调度下一次检查
   */
  private scheduleNextTick(): void {
    if (this.rafId !== undefined) return
    // 只有在有任务时才调度
    if (this.taskQueue.isEmpty) return

    this.rafId = requestAnimationFrame(() => {
      this.rafId = undefined

      // 如果还有任务且处于运行状态，继续调度
      if (this.state === SchedulerState.RUNNING && !this.taskQueue.isEmpty) {
        this.scheduleNextTick()
      }
    })
  }

  /**
   * 取消当前的检查调度
   */
  private cancelTick(): void {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId)
      this.rafId = undefined
    }
  }
}
