import { useState, useEffect, useMemo } from 'react'

/**
 * Responsive dialog hook for handling modal sizing and styling based on screen size
 * 响应式对话框 hook，根据屏幕尺寸处理模态框的大小和样式
 */
export interface ResponsiveDialogConfig {
  /** Modal width - 模态框宽度 */
  width: number | string
  /** Button height - 按钮高度 */
  buttonHeight: number
  /** Title font size - 标题字体大小 */
  titleFontSize: number
  /** Content font size - 内容字体大小 */
  contentFontSize: number
  /** Small content font size - 小号内容字体大小 */
  smallFontSize: number
  /** Padding size - 内边距大小 */
  padding: {
    sm: number
    md: number
    lg: number
  }
  /** Whether buttons should stack vertically - 按钮是否应该垂直堆叠 */
  stackButtons: boolean
  /** Button gap - 按钮间距 */
  buttonGap: number
}

interface WindowDimensions {
  width: number
  height: number
}

/**
 * Custom hook for responsive dialog configuration
 * 响应式对话框配置的自定义 Hook
 */
export function useResponsiveDialog(): ResponsiveDialogConfig {
  const [windowDimensions, setWindowDimensions] = useState<WindowDimensions>({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = (): void => {
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      setWindowDimensions((prev) => {
        if (prev.width !== newDimensions.width || prev.height !== newDimensions.height) {
          return newDimensions
        }
        return prev
      })
    }

    // Throttled resize handler for performance
    let timeoutId: NodeJS.Timeout | null = null
    const throttledResize = (): void => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', throttledResize)

    return () => {
      window.removeEventListener('resize', throttledResize)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Calculate responsive configuration based on screen width
  const responsiveConfig = useMemo((): ResponsiveDialogConfig => {
    const { width } = windowDimensions

    // EchoLab supports minimum resolution of 768px
    // EchoLab 支持最小分辨率 768px
    if (width >= 1440) {
      // Large screens (2K and above) - 大屏幕 (2K 及以上)
      return {
        width: 560,
        buttonHeight: 44,
        titleFontSize: 18,
        contentFontSize: 16,
        smallFontSize: 14,
        padding: {
          sm: 12,
          md: 20,
          lg: 24
        },
        stackButtons: false,
        buttonGap: 12
      }
    } else if (width >= 1024) {
      // Medium-large screens (1024px-1439px) - 中大屏幕
      return {
        width: 520,
        buttonHeight: 40,
        titleFontSize: 16,
        contentFontSize: 15,
        smallFontSize: 13,
        padding: {
          sm: 10,
          md: 16,
          lg: 20
        },
        stackButtons: false,
        buttonGap: 10
      }
    } else if (width >= 900) {
      // Medium screens (900px-1023px) - 中等屏幕
      return {
        width: 480,
        buttonHeight: 38,
        titleFontSize: 15,
        contentFontSize: 14,
        smallFontSize: 12,
        padding: {
          sm: 8,
          md: 14,
          lg: 18
        },
        stackButtons: false,
        buttonGap: 8
      }
    } else {
      // Small screens (768px-899px) - 小屏幕（最小支持分辨率）
      return {
        width: '92%', // Use percentage for very constrained width
        buttonHeight: 36,
        titleFontSize: 14,
        contentFontSize: 13,
        smallFontSize: 11,
        padding: {
          sm: 6,
          md: 12,
          lg: 16
        },
        stackButtons: true, // Stack buttons vertically for better UX
        buttonGap: 8
      }
    }
  }, [windowDimensions])

  return responsiveConfig
}

export default useResponsiveDialog
