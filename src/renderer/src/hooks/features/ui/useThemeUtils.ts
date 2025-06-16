import type { CSSProperties } from 'react'
import type { ThemeUtils } from '@renderer/types/theme'
import { themeStyles } from '@renderer/styles/theme'

/**
 * Theme utility functions module
 * 主题工具函数模块
 *
 * Contains utility functions for color manipulation, time formatting,
 * poster background generation, and hover style creation.
 * 包含颜色处理、时间格式化、海报背景生成和悬停样式创建的工具函数。
 */

/**
 * Builds the theme utils object with all utility functions
 * 构建包含所有工具函数的主题工具对象
 */
export function buildUtils(): ThemeUtils {
  return {
    // Generate poster placeholder background / 生成海报占位符背景
    generatePosterBackground: (fileName: string): string => {
      const colors = [
        themeStyles.gradients.primary,
        themeStyles.gradients.success,
        themeStyles.gradients.warning,
        themeStyles.gradients.error,
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
      ]
      const index = fileName.length % colors.length
      return colors[index]
    },

    // Format time difference / 格式化时间差
    formatTimeAgo: (timestamp: number): string => {
      const now = Date.now()
      const diff = now - timestamp
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`
      return new Date(timestamp).toLocaleDateString()
    },

    // Color utility function / 颜色工具函数
    hexToRgba: (hex: string, alpha: number = 1): string => {
      const result = hex.slice(1).match(/.{2}/g)
      if (!result) return hex
      const [r, g, b] = result.map((x) => parseInt(x, 16))
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },

    // Create hover style / 创建悬停样式
    createHoverStyle: (
      baseStyle: CSSProperties,
      hoverStyle: CSSProperties
    ): { base: CSSProperties; hover: CSSProperties } => {
      return {
        base: baseStyle,
        hover: hoverStyle
      }
    }
  }
}
