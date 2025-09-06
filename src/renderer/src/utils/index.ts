export * from './file'

/**
 * 异步执行一个函数。
 * @param {() => void} fn 要执行的函数
 * @returns {Promise<void>} 执行结果
 */
export const runAsyncFunction = async (fn: () => void): Promise<void> => {
  await fn()
}
