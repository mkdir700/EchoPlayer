/**
 * Integration tests for the complete update flow with release notes processing
 * 完整更新流程的集成测试，包括发布说明处理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { UpdatePromptDialog } from '../../renderer/src/components/UpdatePromptDialog'
import type { UpdateStatus } from '../../types/update'

// Mock the theme hook
vi.mock('../../renderer/src/hooks/useTheme', () => ({
  useTheme: () => ({
    token: {
      colorPrimary: '#1890ff',
      colorText: '#000000',
      colorTextSecondary: '#666666',
      colorTextTertiary: '#999999',
      colorSuccess: '#52c41a',
      colorError: '#ff4d4f',
      colorWarning: '#faad14',
      colorBorderSecondary: '#d9d9d9',
      borderRadius: 6,
      borderRadiusLG: 8,
      marginSM: 8,
      marginXS: 4,
      marginXXS: 2
    },
    styles: {
      glassEffect: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)'
      }
    },
    utils: {
      hexToRgba: (_hex: string, alpha: number) => `rgba(24, 144, 255, ${alpha})`
    }
  })
}))

// Mock the responsive hook
vi.mock('../../renderer/src/hooks/useResponsiveDialog', () => ({
  useResponsiveDialog: () => ({
    width: 520,
    buttonHeight: 40,
    titleFontSize: 16,
    contentFontSize: 14,
    smallFontSize: 12,
    stackButtons: false,
    padding: {
      sm: 12,
      md: 16,
      lg: 24
    }
  })
}))

// Mock markdown renderer
vi.mock('../../renderer/src/utils/markdownRenderer', () => ({
  renderMarkdown: (markdown: string) => {
    // Simple mock that converts basic markdown to HTML
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  },
  isMarkdownContent: (content: string) => {
    return content.includes('#') || content.includes('*') || content.includes('-')
  },
  createHtmlProps: (html: string) => ({
    dangerouslySetInnerHTML: { __html: html }
  })
}))

describe('Update Flow Integration Tests', () => {
  const mockCallbacks = {
    onRemindLater: vi.fn(),
    onDownload: vi.fn(),
    onInstall: vi.fn(),
    onRetry: vi.fn(),
    onDismiss: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Release Notes Processing and Display', () => {
    it('should display markdown release notes correctly / 应该正确显示Markdown发布说明', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: {
          version: '1.2.0',
          releaseDate: '2024-01-15T00:00:00.000Z',
          releaseNotes:
            '# New Features\n\n* Added dark mode support\n* **Improved** performance\n\n## Bug Fixes\n\n* Fixed memory leaks',
          updateSize: 25600000 // 25.6MB
        }
      }

      render(
        React.createElement(UpdatePromptDialog, {
          isVisible: true,
          updateStatus: updateStatus,
          ...mockCallbacks
        })
      )

      // Check if version is displayed
      expect(screen.getByText('版本 1.2.0')).toBeInTheDocument()

      // Check if release date is displayed
      expect(screen.getByText(/发布于.*1\/15\/2024/)).toBeInTheDocument()

      // Check if file size is displayed
      expect(screen.getByText('大小 24.4 MB')).toBeInTheDocument()

      // Check if action buttons are present
      expect(screen.getByText('稍后提醒')).toBeInTheDocument()
      expect(screen.getByText('立即更新')).toBeInTheDocument()
    })

    it('should handle plain text release notes / 应该处理纯文本发布说明', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: {
          version: '1.1.0',
          releaseDate: '2024-01-10T00:00:00.000Z',
          releaseNotes: 'This is a simple text release note without any markdown formatting.',
          updateSize: 15728640 // 15MB
        }
      }

      render(
        React.createElement(UpdatePromptDialog, {
          isVisible: true,
          updateStatus: updateStatus,
          ...mockCallbacks
        })
      )

      // Check if version is displayed
      expect(screen.getByText('版本 1.1.0')).toBeInTheDocument()

      // Check if file size is displayed
      expect(screen.getByText('大小 15.0 MB')).toBeInTheDocument()

      // Check if plain text content is displayed
      expect(
        screen.getByText('This is a simple text release note without any markdown formatting.')
      ).toBeInTheDocument()
    })

    it('should handle missing release notes gracefully / 应该优雅地处理缺失的发布说明', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: {
          version: '1.0.1',
          releaseDate: '2024-01-05T00:00:00.000Z',
          releaseNotes: undefined,
          updateSize: 10485760 // 10MB
        }
      }

      render(
        React.createElement(UpdatePromptDialog, {
          isVisible: true,
          updateStatus: updateStatus,
          ...mockCallbacks
        })
      )

      // Check if version is displayed
      expect(screen.getByText('版本 1.0.1')).toBeInTheDocument()

      // Check if file size is displayed
      expect(screen.getByText('大小 10.0 MB')).toBeInTheDocument()

      // The component should still render without crashing
      expect(screen.getByText('立即更新')).toBeInTheDocument()
    })

    it('should handle mandatory updates correctly / 应该正确处理强制更新', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: {
          version: '2.0.0',
          releaseDate: '2024-01-20T00:00:00.000Z',
          releaseNotes:
            '[MANDATORY] Critical security update. This update must be installed immediately.',
          updateSize: 52428800 // 50MB
        }
      }

      render(
        React.createElement(UpdatePromptDialog, {
          isVisible: true,
          updateStatus: updateStatus,
          ...mockCallbacks
        })
      )

      // Check if version is displayed
      expect(screen.getByText('版本 2.0.0')).toBeInTheDocument()

      // Check if file size is displayed
      expect(screen.getByText('大小 50.0 MB')).toBeInTheDocument()

      // For mandatory updates, "Remind Later" button should not be present
      expect(screen.queryByText('稍后提醒')).not.toBeInTheDocument()

      // But "Update Now" button should be present (mandatory updates show different text)
      expect(screen.getByText('立即更新（必需）')).toBeInTheDocument()
    })

    it('should display download progress correctly / 应该正确显示下载进度', () => {
      const updateStatus: UpdateStatus = {
        status: 'downloading',
        info: {
          version: '1.3.0',
          releaseDate: '2024-01-25T00:00:00.000Z',
          releaseNotes: 'Performance improvements and bug fixes',
          updateSize: 31457280 // 30MB
        },
        progress: {
          percent: 65,
          bytesPerSecond: 1048576, // 1MB/s
          total: 31457280,
          transferred: 20447232 // ~65% of 30MB
        }
      }

      render(
        React.createElement(UpdatePromptDialog, {
          isVisible: true,
          updateStatus: updateStatus,
          ...mockCallbacks
        })
      )

      // Check if downloading status is displayed
      expect(screen.getByText('正在下载更新')).toBeInTheDocument()

      // Check if progress percentage is displayed
      expect(screen.getByText('65%')).toBeInTheDocument()

      // Check if download speed is displayed
      expect(screen.getByText(/1\.0 MB\/s/)).toBeInTheDocument()

      // Check if file sizes are displayed
      expect(screen.getByText(/19\.5 MB \/ 30\.0 MB/)).toBeInTheDocument()
    })

    it('should handle download completion / 应该处理下载完成状态', () => {
      const updateStatus: UpdateStatus = {
        status: 'downloaded',
        info: {
          version: '1.4.0',
          releaseDate: '2024-01-30T00:00:00.000Z',
          releaseNotes: 'New features and improvements',
          updateSize: 41943040 // 40MB
        }
      }

      render(
        React.createElement(UpdatePromptDialog, {
          isVisible: true,
          updateStatus: updateStatus,
          ...mockCallbacks
        })
      )

      // Check if download completion is displayed
      expect(screen.getByText('更新已下载完成')).toBeInTheDocument()

      // Check if version is displayed
      expect(screen.getByText(/版本 1\.4\.0 已准备安装/)).toBeInTheDocument()

      // Check if install button is present
      expect(screen.getByText('立即安装')).toBeInTheDocument()

      // Check if warning message is displayed
      expect(screen.getByText('安装过程中应用将重新启动')).toBeInTheDocument()
    })

    it('should handle error states gracefully / 应该优雅地处理错误状态', () => {
      const updateStatus: UpdateStatus = {
        status: 'error',
        error: 'Network connection failed. Please check your internet connection and try again.'
      }

      render(
        React.createElement(UpdatePromptDialog, {
          isVisible: true,
          updateStatus: updateStatus,
          ...mockCallbacks
        })
      )

      // Check if error status is displayed (actual text from component)
      expect(screen.getByText('更新遇到问题')).toBeInTheDocument()

      // Check if error alert message is displayed
      expect(screen.getByText('更新检查失败')).toBeInTheDocument()

      // Check if error message is displayed
      expect(
        screen.getByText(
          'Network connection failed. Please check your internet connection and try again.'
        )
      ).toBeInTheDocument()

      // Check if retry button is present
      expect(screen.getByText('重试')).toBeInTheDocument()
    })
  })
})
