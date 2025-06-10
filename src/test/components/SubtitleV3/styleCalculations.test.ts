import { describe, it, expect } from 'vitest'
import {
  calculateContainerPositioning,
  calculateCursorStyle,
  calculateContainerStyle,
  calculateSubtitleContentStyle,
  calculateActualBackgroundType
} from '@renderer/components/VideoPlayer/SubtitleV3/utils/styleCalculations'
import type { SubtitleDisplaySettings } from '@types_/shared'
import type { LayoutInfo } from '@renderer/components/VideoPlayer/SubtitleV3/types'

describe('Style Calculations Utils / 样式计算工具函数', () => {
  // Test data setup / 测试数据设置
  const mockSubtitleState: SubtitleDisplaySettings = {
    isMaskMode: false,
    maskFrame: {
      left: 10,
      top: 20,
      width: 80,
      height: 60
    },
    backgroundType: 'transparent',
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  }

  const mockLayout: LayoutInfo = {
    left: 25,
    top: 30,
    width: 50,
    height: 40
  }

  const mockStyles = {
    subtitleContainer: {
      position: 'absolute' as const,
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    subtitleContainerHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    subtitleContainerDragging: {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    },
    subtitleContent: {
      padding: '8px',
      borderRadius: '4px'
    },
    subtitleContentTransparent: {
      backgroundColor: 'transparent'
    },
    subtitleContentBlur: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)'
    },
    subtitleContentSolidBlack: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)'
    },
    subtitleContentSolidGray: {
      backgroundColor: 'rgba(128, 128, 128, 0.8)'
    }
  }

  describe('calculateContainerPositioning / 计算容器定位', () => {
    it('should calculate normal positioning when not in mask mode / 非遮罩模式时应该计算正常定位', () => {
      const result = calculateContainerPositioning(mockSubtitleState, mockLayout)

      expect(result).toEqual({
        left: '25%',
        top: '30%',
        width: '50%',
        height: '40%'
      })
    })

    it('should calculate mask positioning when in mask mode / 遮罩模式时应该计算遮罩定位', () => {
      const maskModeState = {
        ...mockSubtitleState,
        isMaskMode: true
      }

      const result = calculateContainerPositioning(maskModeState, mockLayout)

      // Expected calculations:
      // left: 10 + (25 * 80) / 100 = 10 + 20 = 30%
      // top: 20 + (30 * 60) / 100 = 20 + 18 = 38%
      // width: (50 * 80) / 100 = 40%
      // height: (40 * 60) / 100 = 24%
      expect(result).toEqual({
        left: '30%',
        top: '38%',
        width: '40%',
        height: '24%'
      })
    })
  })

  describe('calculateCursorStyle / 计算光标样式', () => {
    it('should return default cursor when layout is locked / 布局锁定时应该返回默认光标', () => {
      const result = calculateCursorStyle(true, false, false)
      expect(result).toBe('default')
    })

    it('should return grabbing cursor when dragging / 拖拽时应该返回grabbing光标', () => {
      const result = calculateCursorStyle(false, true, false)
      expect(result).toBe('grabbing')
    })

    it('should return se-resize cursor when resizing / 调整大小时应该返回se-resize光标', () => {
      const result = calculateCursorStyle(false, false, true)
      expect(result).toBe('se-resize')
    })

    it('should return grab cursor in normal state / 正常状态时应该返回grab光标', () => {
      const result = calculateCursorStyle(false, false, false)
      expect(result).toBe('grab')
    })

    it('should prioritize dragging over resizing / 拖拽应该优先于调整大小', () => {
      const result = calculateCursorStyle(false, true, true)
      expect(result).toBe('grabbing')
    })
  })

  describe('calculateContainerStyle / 计算容器样式', () => {
    const baseParams = {
      subtitleState: mockSubtitleState,
      currentLayout: mockLayout,
      isDragging: false,
      isResizing: false,
      isHovering: false,
      isSubtitleLayoutLocked: false,
      styles: mockStyles
    }

    it('should combine base styles with positioning / 应该合并基础样式和定位', () => {
      const result = calculateContainerStyle(baseParams)

      expect(result).toMatchObject({
        position: 'absolute',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        left: '25%',
        top: '30%',
        width: '50%',
        height: '40%',
        cursor: 'grab',
        zIndex: 10,
        userSelect: 'auto'
      })
    })

    it('should apply hover styles when hovering / 悬停时应该应用悬停样式', () => {
      const result = calculateContainerStyle({
        ...baseParams,
        isHovering: true
      })

      expect(result).toMatchObject({
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      })
    })

    it('should not apply hover styles when locked / 锁定时不应该应用悬停样式', () => {
      const result = calculateContainerStyle({
        ...baseParams,
        isHovering: true,
        isSubtitleLayoutLocked: true
      })

      expect(result.backgroundColor).toBeUndefined()
      expect(result.cursor).toBe('default')
    })

    it('should apply dragging styles when dragging / 拖拽时应该应用拖拽样式', () => {
      const result = calculateContainerStyle({
        ...baseParams,
        isDragging: true
      })

      expect(result).toMatchObject({
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        cursor: 'grabbing',
        zIndex: 100,
        userSelect: 'none'
      })
    })

    it('should apply resizing styles when resizing / 调整大小时应该应用调整大小样式', () => {
      const result = calculateContainerStyle({
        ...baseParams,
        isResizing: true
      })

      expect(result).toMatchObject({
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        cursor: 'se-resize',
        zIndex: 100,
        userSelect: 'none'
      })
    })
  })

  describe('calculateSubtitleContentStyle / 计算字幕内容样式', () => {
    it('should apply transparent background / 应该应用透明背景', () => {
      const result = calculateSubtitleContentStyle(mockStyles, 'transparent')

      expect(result).toMatchObject({
        padding: '8px',
        borderRadius: '4px',
        backgroundColor: 'transparent'
      })
    })

    it('should apply blur background / 应该应用模糊背景', () => {
      const result = calculateSubtitleContentStyle(mockStyles, 'blur')

      expect(result).toMatchObject({
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)'
      })
    })

    it('should apply solid black background / 应该应用纯黑背景', () => {
      const result = calculateSubtitleContentStyle(mockStyles, 'solid-black')

      expect(result).toMatchObject({
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      })
    })

    it('should apply solid gray background / 应该应用纯灰背景', () => {
      const result = calculateSubtitleContentStyle(mockStyles, 'solid-gray')

      expect(result).toMatchObject({
        backgroundColor: 'rgba(128, 128, 128, 0.8)'
      })
    })

    it('should default to transparent for unknown background type / 未知背景类型应该默认为透明', () => {
      const result = calculateSubtitleContentStyle(mockStyles, 'unknown-type')

      expect(result).toMatchObject({
        backgroundColor: 'transparent'
      })
    })
  })

  describe('calculateActualBackgroundType / 计算实际背景类型', () => {
    it('should return transparent when dragging / 拖拽时应该返回透明', () => {
      const result = calculateActualBackgroundType(true, false, 'blur')
      expect(result).toBe('transparent')
    })

    it('should return transparent when resizing / 调整大小时应该返回透明', () => {
      const result = calculateActualBackgroundType(false, true, 'solid-black')
      expect(result).toBe('transparent')
    })

    it('should return transparent when both dragging and resizing / 既拖拽又调整大小时应该返回透明', () => {
      const result = calculateActualBackgroundType(true, true, 'solid-gray')
      expect(result).toBe('transparent')
    })

    it('should return original type when not dragging or resizing / 不拖拽不调整大小时应该返回原始类型', () => {
      const result = calculateActualBackgroundType(false, false, 'blur')
      expect(result).toBe('blur')
    })
  })
})
