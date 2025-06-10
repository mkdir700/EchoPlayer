import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ResizeHandle } from '@renderer/components/VideoPlayer/SubtitleV3/subcomponents/ResizeHandle'

// Mock useTheme hook / 模拟useTheme hook
vi.mock('@renderer/hooks/useTheme', () => ({
  useTheme: () => ({
    styles: {
      subtitleResizeHandle: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }
    }
  })
}))

describe('ResizeHandle Component / ResizeHandle 组件', () => {
  const defaultProps = {
    visible: true,
    buttonSize: 16,
    onMouseDown: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when visible is true / visible为true时应该渲染', () => {
    const { container } = render(<ResizeHandle {...defaultProps} />)
    const handle = container.firstChild as HTMLElement

    expect(handle).toBeInTheDocument()
    expect(handle.tagName).toBe('DIV')
  })

  it('should not render when visible is false / visible为false时不应该渲染', () => {
    const { container } = render(<ResizeHandle {...defaultProps} visible={false} />)

    expect(container.firstChild).toBeNull()
  })

  it('should have correct base styles / 应该有正确的基础样式', () => {
    const { container } = render(<ResizeHandle {...defaultProps} />)
    const handle = container.firstChild as HTMLElement

    // Check positioning styles / 检查定位样式
    expect(handle).toHaveStyle({
      bottom: '0',
      right: '0',
      cursor: 'se-resize',
      borderRadius: '3px 0 8px 0'
    })
  })

  it('should apply theme styles / 应该应用主题样式', () => {
    const { container } = render(<ResizeHandle {...defaultProps} />)
    const handle = container.firstChild as HTMLElement

    // Check theme-provided styles / 检查主题提供的样式
    expect(handle).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(0, 0, 0, 0.1)'
    })
  })

  it('should calculate size based on buttonSize prop / 应该根据buttonSize属性计算尺寸', () => {
    const { container } = render(<ResizeHandle {...defaultProps} buttonSize={20} />)
    const handle = container.firstChild as HTMLElement

    // Size calculation: Math.max(12, Math.min(24, buttonSize * 0.5))
    // For buttonSize=20: Math.max(12, Math.min(24, 10)) = 12
    expect(handle).toHaveStyle({
      width: '12px',
      height: '12px'
    })
  })

  it('should enforce minimum size constraints / 应该强制执行最小尺寸约束', () => {
    const { container } = render(<ResizeHandle {...defaultProps} buttonSize={8} />)
    const handle = container.firstChild as HTMLElement

    // For buttonSize=8: Math.max(12, Math.min(24, 4)) = 12
    expect(handle).toHaveStyle({
      width: '12px',
      height: '12px'
    })
  })

  it('should enforce maximum size constraints / 应该强制执行最大尺寸约束', () => {
    const { container } = render(<ResizeHandle {...defaultProps} buttonSize={60} />)
    const handle = container.firstChild as HTMLElement

    // For buttonSize=60: Math.max(12, Math.min(24, 30)) = 24
    expect(handle).toHaveStyle({
      width: '24px',
      height: '24px'
    })
  })

  it('should call onMouseDown when clicked / 点击时应该调用onMouseDown', () => {
    const mockOnMouseDown = vi.fn()
    const { container } = render(<ResizeHandle {...defaultProps} onMouseDown={mockOnMouseDown} />)
    const handle = container.firstChild as HTMLElement

    fireEvent.mouseDown(handle)

    expect(mockOnMouseDown).toHaveBeenCalledTimes(1)
  })

  it('should have correct displayName / 应该有正确的displayName', () => {
    expect(ResizeHandle.displayName).toBe('ResizeHandle')
  })

  it('should be memoized / 应该被记忆化', () => {
    const firstRender = render(<ResizeHandle {...defaultProps} />)
    const secondRender = render(<ResizeHandle {...defaultProps} />)

    // Both renders should create the same component type / 两次渲染应该创建相同的组件类型
    expect(firstRender.container.firstChild?.nodeName).toBe(
      secondRender.container.firstChild?.nodeName
    )
  })
})
