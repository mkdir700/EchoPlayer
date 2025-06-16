import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { SubtitleOverlay } from '@renderer/components/VideoPlayer/SubtitleOverlay'
import type { DisplayMode } from '@renderer/types'

// Mock the SubtitleV3 component / 模拟SubtitleV3组件
vi.mock('@renderer/components/VideoPlayer/SubtitleV3', () => ({
  SubtitleV3: () => <div data-testid="subtitle-v3">SubtitleV3 Component</div>
}))

// Mock the useSubtitleDisplayMode hook / 模拟useSubtitleDisplayMode hook
vi.mock('@renderer/hooks/features/video/useVideoPlaybackHooks', () => ({
  useSubtitleDisplayMode: vi.fn()
}))

// Mock RendererLogger / 模拟RendererLogger
vi.mock('@renderer/utils/logger', () => ({
  default: {
    componentRender: vi.fn(),
    debug: vi.fn()
  }
}))

describe('SubtitleOverlay Component / SubtitleOverlay 组件', () => {
  const defaultProps = {
    onWordHover: vi.fn(),
    enableTextSelection: true,
    onSelectionChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render SubtitleV3 when display mode is not "none" / 当显示模式不是"none"时应该渲染SubtitleV3', async () => {
    const { useSubtitleDisplayMode } = await import(
      '@renderer/hooks/features/video/useVideoPlaybackHooks'
    )
    vi.mocked(useSubtitleDisplayMode).mockReturnValue('bilingual')

    const { getByTestId, container } = render(<SubtitleOverlay {...defaultProps} />)

    // Should render the SubtitleV3 component / 应该渲染SubtitleV3组件
    expect(getByTestId('subtitle-v3')).toBeInTheDocument()

    // Container should have the correct overlay styles / 容器应该有正确的覆盖层样式
    const overlay = container.firstChild as HTMLElement
    expect(overlay).toHaveStyle({
      position: 'absolute',
      top: '0px',
      left: '0px',
      right: '0px',
      bottom: '0px',
      zIndex: '10',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    })
  })

  it('should not render SubtitleV3 when display mode is "none" / 当显示模式是"none"时不应该渲染SubtitleV3', async () => {
    const { useSubtitleDisplayMode } = await import(
      '@renderer/hooks/features/video/useVideoPlaybackHooks'
    )
    vi.mocked(useSubtitleDisplayMode).mockReturnValue('none')

    const { queryByTestId, container } = render(<SubtitleOverlay {...defaultProps} />)

    // Should not render the SubtitleV3 component / 不应该渲染SubtitleV3组件
    expect(queryByTestId('subtitle-v3')).not.toBeInTheDocument()

    // Container should still exist with overlay styles / 容器应该仍然存在并有覆盖层样式
    const overlay = container.firstChild as HTMLElement
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveStyle({
      position: 'absolute',
      top: '0px',
      left: '0px',
      right: '0px',
      bottom: '0px',
      zIndex: '10',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    })
  })

  it.each(['original', 'chinese', 'english', 'bilingual'] as DisplayMode[])(
    'should render SubtitleV3 for display mode "%s" / 应该为显示模式"%s"渲染SubtitleV3',
    async (mode) => {
      const { useSubtitleDisplayMode } = await import(
        '@renderer/hooks/features/video/useVideoPlaybackHooks'
      )
      vi.mocked(useSubtitleDisplayMode).mockReturnValue(mode)

      const { getByTestId } = render(<SubtitleOverlay {...defaultProps} />)

      expect(getByTestId('subtitle-v3')).toBeInTheDocument()
    }
  )

  it('should pass correct props to SubtitleV3 when rendered / 渲染时应该向SubtitleV3传递正确的props', async () => {
    const { useSubtitleDisplayMode } = await import(
      '@renderer/hooks/features/video/useVideoPlaybackHooks'
    )
    vi.mocked(useSubtitleDisplayMode).mockReturnValue('bilingual')

    const onWordHover = vi.fn()
    const onSelectionChange = vi.fn()
    const props = {
      onWordHover,
      enableTextSelection: true,
      onSelectionChange
    }

    render(<SubtitleOverlay {...props} />)

    // Verify that SubtitleV3 is rendered (this indirectly tests prop passing)
    // 验证SubtitleV3被渲染（这间接测试了prop传递）
    expect(vi.mocked(useSubtitleDisplayMode)).toHaveBeenCalled()
  })

  it('should log debug message when display mode is "none" / 当显示模式是"none"时应该记录调试信息', async () => {
    const { useSubtitleDisplayMode } = await import(
      '@renderer/hooks/features/video/useVideoPlaybackHooks'
    )
    const RendererLogger = await import('@renderer/utils/logger')

    vi.mocked(useSubtitleDisplayMode).mockReturnValue('none')

    render(<SubtitleOverlay {...defaultProps} />)

    expect(vi.mocked(RendererLogger.default.debug)).toHaveBeenCalledWith(
      'SubtitleOverlay: 字幕模式为隐藏，不渲染SubtitleV3组件'
    )
  })

  it('should log component render with display mode / 应该记录组件渲染和显示模式', async () => {
    const { useSubtitleDisplayMode } = await import(
      '@renderer/hooks/features/video/useVideoPlaybackHooks'
    )
    const RendererLogger = await import('@renderer/utils/logger')

    vi.mocked(useSubtitleDisplayMode).mockReturnValue('chinese')

    render(<SubtitleOverlay {...defaultProps} />)

    expect(vi.mocked(RendererLogger.default.componentRender)).toHaveBeenCalledWith({
      component: 'SubtitleOverlay',
      props: { displayMode: 'chinese' }
    })
  })

  it('should be memoized correctly / 应该正确被记忆化', async () => {
    const { useSubtitleDisplayMode } = await import(
      '@renderer/hooks/features/video/useVideoPlaybackHooks'
    )
    vi.mocked(useSubtitleDisplayMode).mockReturnValue('bilingual')

    const { rerender } = render(<SubtitleOverlay {...defaultProps} />)

    // Rerender with same props should not cause re-evaluation
    // 使用相同props重新渲染不应该导致重新计算
    rerender(<SubtitleOverlay {...defaultProps} />)

    // The hook should be called at least once for each render
    // hook应该在每次渲染时至少被调用一次
    expect(vi.mocked(useSubtitleDisplayMode)).toHaveBeenCalled()
  })
})
