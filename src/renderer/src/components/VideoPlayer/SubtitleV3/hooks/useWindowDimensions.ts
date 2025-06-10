import { useState, useEffect } from 'react'
import type { WindowDimensions } from '../types'

/**
 * Custom hook for managing window dimensions with optimized resize handling
 * 用于管理窗口尺寸的自定义 Hook，具有优化的调整大小处理
 *
 * Features:
 * - Tracks window dimensions state / 跟踪窗口尺寸状态
 * - Throttled resize listener for performance / 节流的调整大小监听器以提高性能
 * - Only updates state when dimensions actually change / 仅在尺寸实际变化时更新状态
 * - Development logging support / 开发模式日志支持
 *
 * @returns Current window dimensions object / 返回当前窗口尺寸对象
 */
export function useWindowDimensions(): WindowDimensions {
  // Initialize with current window dimensions / 使用当前窗口尺寸初始化
  const [windowDimensions, setWindowDimensions] = useState<WindowDimensions>({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    /**
     * Handle window resize events with dimension change detection
     * 处理窗口调整大小事件，具有尺寸变化检测
     */
    const handleResize = (): void => {
      const newDimensions: WindowDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      // Only update if dimensions actually changed to avoid unnecessary re-renders
      // 仅在尺寸实际变化时更新，以避免不必要的重新渲染
      setWindowDimensions((prev) => {
        if (prev.width !== newDimensions.width || prev.height !== newDimensions.height) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Window resized, updating dimensions:', {
              from: prev,
              to: newDimensions
            })
          }
          return newDimensions
        }
        return prev
      })
    }

    // Create throttled resize handler to improve performance
    // 创建节流调整大小处理程序以提高性能
    const throttledResize = (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(handleResize, 100) // 100ms throttle / 100毫秒节流
      }
    })()

    // Add event listener / 添加事件监听器
    window.addEventListener('resize', throttledResize)

    // Cleanup function / 清理函数
    return () => {
      window.removeEventListener('resize', throttledResize)
    }
  }, [])

  return windowDimensions
}
