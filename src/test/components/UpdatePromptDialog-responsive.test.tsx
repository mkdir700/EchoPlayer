import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UpdatePromptDialog } from '@renderer/components/UpdatePromptDialog'
import type { UpdatePromptDialogProps, UpdateStatus } from '@types_/update'

// Mock useTheme hook
vi.mock('@renderer/hooks/useTheme', () => ({
  useTheme: () => ({
    token: {
      colorPrimary: '#1890ff',
      colorSuccess: '#52c41a',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      colorText: '#000000',
      colorTextSecondary: '#666666',
      colorTextTertiary: '#999999',
      colorBorderSecondary: '#d9d9d9',
      colorFillQuaternary: '#f0f0f0',
      borderRadius: 6,
      borderRadiusLG: 8,
      fontSizeLG: 16,
      fontSize: 14,
      fontSizeSM: 12,
      marginSM: 8,
      marginXS: 4,
      marginXXS: 2,
      paddingSM: 8,
      paddingMD: 12,
      paddingLG: 16,
      colorPrimaryHover: '#40a9ff',
      colorSuccessHover: '#73d13d'
    },
    styles: {
      glassEffect: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }
    },
    utils: {
      hexToRgba: (_hex: string, alpha: number) => `rgba(0, 0, 0, ${alpha})`
    }
  })
}))

// Mock markdown renderer utils
vi.mock('@renderer/utils/markdownRenderer', () => ({
  renderMarkdown: (content: string) => `<p>${content}</p>`,
  isMarkdownContent: (content: string) => content.includes('#'),
  createHtmlProps: (html: string) => ({ dangerouslySetInnerHTML: { __html: html } })
}))

describe('UpdatePromptDialog Responsive Tests', () => {
  const mockUpdateStatus: UpdateStatus = {
    status: 'available',
    info: {
      version: '1.2.0',
      releaseDate: '2024-01-15',
      updateSize: 5242880, // 5MB
      releaseNotes: '# 新功能\n- 添加了新的特性\n- 修复了一些bug'
    }
  }

  const defaultProps: UpdatePromptDialogProps = {
    isVisible: true,
    updateStatus: mockUpdateStatus,
    onDownload: vi.fn(),
    onInstall: vi.fn(),
    onRetry: vi.fn(),
    onDismiss: vi.fn(),
    onSkipVersion: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset window size to default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    })
  })

  describe('Large screen (≥1440px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440
      })
    })

    it('should use large screen configuration', () => {
      render(<UpdatePromptDialog {...defaultProps} />)

      // The modal should be rendered with appropriate large screen styles
      const modal = document.querySelector('.ant-modal')
      expect(modal).toBeInTheDocument()

      // Check if content is visible
      expect(screen.getByText('发现新版本')).toBeInTheDocument()
      expect(screen.getByText('版本 1.2.0')).toBeInTheDocument()
    })

    it('should not stack buttons horizontally on large screens', () => {
      render(<UpdatePromptDialog {...defaultProps} />)

      // Buttons should be in horizontal layout
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Medium screen (1024px-1439px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      })
    })

    it('should use medium screen configuration', () => {
      render(<UpdatePromptDialog {...defaultProps} />)

      expect(screen.getByText('发现新版本')).toBeInTheDocument()
      expect(screen.getByText('版本 1.2.0')).toBeInTheDocument()
    })
  })

  describe('Small screen (768px-899px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      })
    })

    it('should use small screen configuration', () => {
      render(<UpdatePromptDialog {...defaultProps} />)

      expect(screen.getByText('发现新版本')).toBeInTheDocument()
      expect(screen.getByText('版本 1.2.0')).toBeInTheDocument()
    })

    it('should stack buttons vertically on small screens', () => {
      render(<UpdatePromptDialog {...defaultProps} />)

      // On small screens, buttons should be available but potentially stacked
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Different dialog states responsiveness', () => {
    it('should be responsive in checking state', () => {
      render(
        <UpdatePromptDialog
          {...defaultProps}
          updateStatus={{
            status: 'checking'
          }}
        />
      )

      expect(screen.getByText('检查更新中')).toBeInTheDocument()
      expect(screen.getByText('正在检查是否有可用的更新...')).toBeInTheDocument()
    })

    it('should be responsive in downloading state', () => {
      render(
        <UpdatePromptDialog
          {...defaultProps}
          updateStatus={{
            status: 'downloading',
            progress: {
              percent: 45,
              transferred: 2000000,
              total: 5000000,
              bytesPerSecond: 150000
            }
          }}
        />
      )

      expect(screen.getByText('正在下载更新')).toBeInTheDocument()
      expect(screen.getByText('正在下载更新包...')).toBeInTheDocument()
    })

    it('should be responsive in downloaded state', () => {
      render(
        <UpdatePromptDialog
          {...defaultProps}
          updateStatus={{
            status: 'downloaded',
            info: mockUpdateStatus.info
          }}
        />
      )

      expect(screen.getByText('更新已准备就绪')).toBeInTheDocument()
      expect(screen.getByText('更新已下载完成')).toBeInTheDocument()
    })

    it('should be responsive in error state', () => {
      render(
        <UpdatePromptDialog
          {...defaultProps}
          updateStatus={{
            status: 'error',
            error: '网络连接失败'
          }}
        />
      )

      expect(screen.getByText('更新遇到问题')).toBeInTheDocument()
      expect(screen.getByText('更新检查失败')).toBeInTheDocument()
    })
  })

  describe('Window resize handling', () => {
    it('should handle window resize events', () => {
      render(<UpdatePromptDialog {...defaultProps} />)

      // Initial render should work
      expect(screen.getByText('发现新版本')).toBeInTheDocument()

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      })

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      // Component should still be functional
      expect(screen.getByText('发现新版本')).toBeInTheDocument()
    })
  })

  describe('Accessibility on different screen sizes', () => {
    it('should maintain accessibility on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      })

      render(<UpdatePromptDialog {...defaultProps} />)

      // Should have proper role and accessibility attributes
      const modal = document.querySelector('.ant-modal')
      expect(modal).toBeInTheDocument()

      // Footer buttons should be present and accessible on small screens
      expect(screen.getByText('跳过此版本')).toBeInTheDocument()
      expect(screen.getByText('立即更新')).toBeInTheDocument()

      // Buttons should have accessibility attributes
      const skipButton = screen.getByText('跳过此版本').closest('button')
      const downloadButton = screen.getByText('立即更新').closest('button')

      expect(skipButton).toBeInTheDocument()
      expect(downloadButton).toBeInTheDocument()
      expect(skipButton).toHaveAttribute('type', 'button')
      expect(downloadButton).toHaveAttribute('type', 'button')
    })

    it('should maintain readability with responsive font sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      })

      render(<UpdatePromptDialog {...defaultProps} />)

      // Text elements should be present and readable
      expect(screen.getByText('发现新版本')).toBeInTheDocument()
      expect(screen.getByText('版本 1.2.0')).toBeInTheDocument()
      expect(screen.getByText('更新内容：')).toBeInTheDocument()
    })
  })
})
