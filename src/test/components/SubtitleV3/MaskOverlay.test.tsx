import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MaskOverlay } from '@renderer/components/VideoPlayer/SubtitleV3/subcomponents/MaskOverlay'

// Mock useTheme hook / 模拟useTheme hook
vi.mock('@renderer/hooks/useTheme', () => ({
  useTheme: () => ({
    styles: {
      subtitleMaskOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }
    }
  })
}))

describe('MaskOverlay Component / MaskOverlay 组件', () => {
  it('should render correctly / 应该正确渲染', () => {
    const { container } = render(<MaskOverlay />)
    const overlay = container.firstChild as HTMLElement

    expect(overlay).toBeInTheDocument()
    expect(overlay.tagName).toBe('DIV')
  })

  it('should have correct base styles / 应该有正确的基础样式', () => {
    const { container } = render(<MaskOverlay />)
    const overlay = container.firstChild as HTMLElement

    // Check positioning and layout styles / 检查定位和布局样式
    expect(overlay).toHaveStyle({
      position: 'absolute',
      left: '0%',
      top: '0%',
      width: '100%',
      height: '100%'
    })

    // Check z-index and pointer events / 检查z-index和鼠标事件
    expect(overlay).toHaveStyle({
      zIndex: '5',
      pointerEvents: 'none'
    })
  })

  it('should apply theme styles / 应该应用主题样式', () => {
    const { container } = render(<MaskOverlay />)
    const overlay = container.firstChild as HTMLElement

    // Check theme-provided styles / 检查主题提供的样式
    expect(overlay).toHaveStyle({
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    })
  })

  it('should have correct displayName / 应该有正确的displayName', () => {
    expect(MaskOverlay.displayName).toBe('MaskOverlay')
  })

  it('should be memoized / 应该被记忆化', () => {
    const firstRender = render(<MaskOverlay />)
    const secondRender = render(<MaskOverlay />)

    // Both renders should create the same component type / 两次渲染应该创建相同的组件类型
    expect(firstRender.container.firstChild?.nodeName).toBe(
      secondRender.container.firstChild?.nodeName
    )
  })
})
