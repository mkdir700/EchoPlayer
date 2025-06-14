import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdatePromptDialog } from '@renderer/components/UpdatePromptDialog'
import type { UpdateStatus } from '../../types/update'

// Mock hooks and dependencies / 模拟hooks和依赖
vi.mock('@renderer/hooks/useTheme', () => ({
  useTheme: () => ({
    token: {
      colorInfo: '#1890ff',
      colorSuccess: '#52c41a',
      colorPrimary: '#1890ff',
      colorError: '#ff4d4f',
      colorText: '#000000',
      colorTextSecondary: '#666666',
      colorTextTertiary: '#999999',
      colorBorderSecondary: '#d9d9d9',
      colorFillQuaternary: '#f0f0f0',
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeSM: 12,
      borderRadius: 4,
      borderRadiusLG: 8,
      marginSM: 8,
      marginXXS: 2,
      marginXS: 4,
      paddingMD: 16,
      paddingLG: 24,
      paddingSM: 12,
      paddingXS: 8,
      marginMD: 16,
      colorPrimaryHover: '#40a9ff',
      colorSuccessHover: '#73d13d'
    },
    styles: {
      glassEffect: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }
    },
    utils: {
      hexToRgba: (_hex: string, alpha: number) => `rgba(0, 0, 0, ${alpha})`
    }
  })
}))

describe('UpdatePromptDialog Component', () => {
  const mockCallbacks = {
    onDownload: vi.fn(),
    onInstall: vi.fn(),
    onRetry: vi.fn(),
    onDismiss: vi.fn(),
    onSkipVersion: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Structure and Props / 组件结构和属性', () => {
    it('should not render when isVisible is false / 当isVisible为false时不应该渲染', () => {
      const { container } = render(
        <UpdatePromptDialog isVisible={false} updateStatus={null} {...mockCallbacks} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render with available status / 应该渲染可用状态', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: {
          version: '1.2.3',
          releaseDate: '2024-01-15',
          releaseNotes: '新增功能：支持深色模式',
          updateSize: 25600000 // 25.6MB
        }
      }

      render(<UpdatePromptDialog isVisible={true} updateStatus={updateStatus} {...mockCallbacks} />)

      expect(screen.getByText('发现新版本')).toBeInTheDocument()
      expect(screen.getByText('版本 1.2.3')).toBeInTheDocument()
      expect(screen.getByText(/发布于.*1\/15\/2024/)).toBeInTheDocument()
      expect(screen.getByText('大小 24.4 MB')).toBeInTheDocument()
      expect(screen.getByText('跳过此版本')).toBeInTheDocument()
      expect(screen.getByText('立即更新')).toBeInTheDocument()
    })
  })

  describe('Callback Functions / 回调函数', () => {
    it('should call onDownload when download button is clicked / 点击下载按钮应该调用onDownload', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: { version: '1.2.3' }
      }

      render(<UpdatePromptDialog isVisible={true} updateStatus={updateStatus} {...mockCallbacks} />)

      fireEvent.click(screen.getByText('立即更新'))
      expect(mockCallbacks.onDownload).toHaveBeenCalledTimes(1)
    })

    it('should call onSkipVersion when skip version button is clicked / 点击跳过此版本按钮应该调用onSkipVersion', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: { version: '1.2.3' }
      }

      render(<UpdatePromptDialog isVisible={true} updateStatus={updateStatus} {...mockCallbacks} />)

      fireEvent.click(screen.getByText('跳过此版本'))
      expect(mockCallbacks.onSkipVersion).toHaveBeenCalledTimes(1)
    })
  })

  describe('Mandatory Updates / 强制更新', () => {
    it('should hide skip version button for mandatory updates / 强制更新应该隐藏跳过此版本按钮', () => {
      const updateStatus: UpdateStatus = {
        status: 'available',
        info: {
          version: '1.2.3',
          releaseNotes: 'Critical security update [MANDATORY]'
        }
      }

      render(<UpdatePromptDialog isVisible={true} updateStatus={updateStatus} {...mockCallbacks} />)

      expect(screen.queryByText('跳过此版本')).not.toBeInTheDocument()
      expect(screen.getByText('立即更新（必需）')).toBeInTheDocument()
    })
  })
})
