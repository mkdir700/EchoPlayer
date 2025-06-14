import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import UpdateNotification from '@renderer/components/UpdateNotification'

// Mock useTheme hook
const mockTheme = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorWarning: '#faad14',
    colorText: '#000000',
    colorTextSecondary: '#666666',
    colorTextTertiary: '#999999',
    colorBorderSecondary: '#d9d9d9',
    colorFillQuaternary: '#f5f5f5',
    fontSizeLG: 16,
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeXL: 20,
    borderRadius: 6,
    borderRadiusLG: 8,
    marginSM: 8,
    marginXS: 4,
    marginXXS: 2,
    marginMD: 16,
    marginLG: 24,
    paddingSM: 8,
    paddingMD: 16,
    paddingLG: 24,
    paddingXXS: 2,
    paddingXS: 4,
    colorPrimaryHover: '#4096ff',
    colorSuccessHover: '#73d13d',
    zIndexPopupBase: 1000
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
}

vi.mock('@renderer/hooks/useTheme', () => ({
  useTheme: () => mockTheme
}))

// Mock IPC and API
const mockIpcRenderer = {
  on: vi.fn(),
  removeAllListeners: vi.fn()
}

const mockUpdateApi = {
  checkForUpdates: vi.fn(),
  downloadUpdate: vi.fn(),
  installUpdate: vi.fn()
}

// Mock global objects
Object.defineProperty(global, 'window', {
  value: {
    electron: {
      ipcRenderer: mockIpcRenderer
    },
    api: {
      update: mockUpdateApi
    }
  },
  writable: true
})

// Test data / 测试数据
const mockUpdateStatusData = {
  checking: {
    status: 'checking',
    info: { version: '1.2.0' }
  },
  available: {
    status: 'available',
    info: {
      version: '1.2.0',
      releaseDate: '2024-01-15',
      releaseNotes: '修复了一些关键错误，提升了用户体验。'
    }
  },
  downloading: {
    status: 'downloading',
    info: { version: '1.2.0' },
    progress: {
      percent: 50,
      bytesPerSecond: 1024 * 1024,
      total: 1024 * 1024 * 20,
      transferred: 1024 * 1024 * 10
    }
  },
  downloaded: {
    status: 'downloaded',
    info: { version: '1.2.0' }
  },
  error: {
    status: 'error',
    error: '下载失败，请检查网络连接。'
  },
  mandatory: {
    status: 'available',
    info: {
      version: '1.3.0',
      releaseDate: '2024-01-20',
      releaseNotes: '[MANDATORY] 重要安全更新，必须立即安装。'
    }
  }
}

describe('UpdateNotification Integration Tests / UpdateNotification 集成测试', () => {
  let ipcListeners: Record<string, (event: unknown, status: unknown) => void> = {}

  beforeEach(() => {
    // 重置所有模拟函数 / Reset all mock functions
    vi.clearAllMocks()
    ipcListeners = {}

    // 模拟 IPC 监听器注册 / Mock IPC listener registration
    mockIpcRenderer.on.mockImplementation(
      (event: string, callback: (event: unknown, status: unknown) => void) => {
        ipcListeners[event] = callback
      }
    )

    // 模拟 API 调用成功 / Mock successful API calls
    mockUpdateApi.checkForUpdates.mockResolvedValue({ success: true })
    mockUpdateApi.downloadUpdate.mockResolvedValue({ success: true })
    mockUpdateApi.installUpdate.mockReturnValue(undefined)
  })

  afterEach(() => {
    // 清理定时器 / Clean up timers
    vi.clearAllTimers()
  })

  describe('Component Initialization / 组件初始化', () => {
    it('sets up IPC listeners on mount / 挂载时设置 IPC 监听器', async () => {
      render(<UpdateNotification />)

      // 应该注册 IPC 监听器 / Should register IPC listener
      expect(mockIpcRenderer.on).toHaveBeenCalledWith('update-status', expect.any(Function))

      // 不再自动检查更新（已移除启动时的自动检查）/ No longer auto-checks for updates (startup auto-check removed)
      expect(mockUpdateApi.checkForUpdates).not.toHaveBeenCalled()
    })

    it('cleans up listeners on unmount / 卸载时清理监听器', () => {
      const { unmount } = render(<UpdateNotification />)

      unmount()

      expect(mockIpcRenderer.removeAllListeners).toHaveBeenCalledWith('update-status')
    })
  })

  describe('Update Status Handling / 更新状态处理', () => {
    it('shows dialog when update is available / 有可用更新时显示对话框', async () => {
      render(<UpdateNotification />)

      // 模拟收到更新状态消息 / Simulate receiving update status message
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 应该显示更新对话框 / Should show update dialog
      await waitFor(() => {
        expect(screen.getByText('发现新版本')).toBeInTheDocument()
        expect(screen.getByText('版本 1.2.0')).toBeInTheDocument()
      })
    })

    it('shows download progress during update / 更新过程中显示下载进度', async () => {
      render(<UpdateNotification />)

      // 先显示可用更新 / First show available update
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 点击下载按钮 / Click download button
      const downloadButton = await screen.findByRole('button', { name: /立即更新/ })
      fireEvent.click(downloadButton)

      // 模拟下载状态 / Simulate downloading status
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.downloading)
      })

      // 应该显示下载进度 / Should show download progress
      await waitFor(() => {
        expect(screen.getByText('正在下载更新')).toBeInTheDocument()
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
        expect(screen.getByText(/10 MB.*20 MB/)).toBeInTheDocument()
      })
    })

    it('shows install option when download is complete / 下载完成时显示安装选项', async () => {
      render(<UpdateNotification />)

      // 模拟下载完成状态 / Simulate download completed status
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.downloaded)
      })

      // 应该显示安装选项 / Should show install options
      await waitFor(() => {
        expect(screen.getByText('更新已准备就绪')).toBeInTheDocument()
        expect(screen.getByText('更新已下载完成')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /立即安装/ })).toBeInTheDocument()
      })
    })

    it('handles update errors gracefully / 优雅处理更新错误', async () => {
      render(<UpdateNotification />)

      // 模拟错误状态 / Simulate error status
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.error)
      })

      // 应该显示错误信息 / Should show error information
      await waitFor(() => {
        expect(screen.getByText('更新遇到问题')).toBeInTheDocument()
        expect(screen.getByText(/下载失败/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument()
      })
    })
  })

  describe('User Actions / 用户操作', () => {
    it('handles download action correctly / 正确处理下载操作', async () => {
      render(<UpdateNotification />)

      // 显示可用更新 / Show available update
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 点击下载按钮 / Click download button
      const downloadButton = await screen.findByRole('button', { name: /立即更新/ })
      fireEvent.click(downloadButton)

      // 应该调用下载 API / Should call download API
      expect(mockUpdateApi.downloadUpdate).toHaveBeenCalledTimes(1)
    })

    it('handles install action correctly / 正确处理安装操作', async () => {
      render(<UpdateNotification />)

      // 显示下载完成状态 / Show download completed status
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.downloaded)
      })

      // 点击安装按钮 / Click install button
      const installButton = await screen.findByRole('button', { name: /立即安装/ })
      fireEvent.click(installButton)

      // 应该调用安装 API / Should call install API
      expect(mockUpdateApi.installUpdate).toHaveBeenCalledTimes(1)
    })

    it('handles retry action on error / 错误时处理重试操作', async () => {
      render(<UpdateNotification />)

      // 显示错误状态 / Show error status
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.error)
      })

      // 点击重试按钮 / Click retry button
      const retryButton = await screen.findByRole('button', { name: /重试/ })
      fireEvent.click(retryButton)

      // 应该重新检查更新（非静默模式）/ Should re-check for updates (non-silent mode)
      expect(mockUpdateApi.checkForUpdates).toHaveBeenCalledWith({ silent: false })
    })

    it('handles skip version functionality / 处理跳过版本功能', async () => {
      render(<UpdateNotification />)

      // 显示可用更新 / Show available update
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 点击跳过此版本按钮 / Click skip version button
      const skipButton = await screen.findByRole('button', { name: /跳过此版本/ })
      fireEvent.click(skipButton)

      // 对话框应该关闭 / Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('发现新版本')).not.toBeInTheDocument()
      })

      // 再次发送相同版本更新 / Send same version update again
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 对话框不应该显示，因为版本已被跳过 / Dialog should not show as version is skipped
      expect(screen.queryByText('发现新版本')).not.toBeInTheDocument()
    })
  })

  describe('Session-level Suppression / 会话级抑制', () => {
    it('suppresses update dialog when user dismisses it / 用户关闭对话框时抑制更新对话框', async () => {
      render(<UpdateNotification />)

      // 显示可用更新 / Show available update
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 用户关闭对话框 / User closes dialog
      const closeButton = document.querySelector('.ant-modal-close')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      // 再次发送相同版本的更新状态 / Send same version update status again
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 对话框不应该再次显示 / Dialog should not show again
      await waitFor(() => {
        expect(screen.queryByText('发现新版本')).not.toBeInTheDocument()
      })
    })

    it('shows mandatory updates even when suppressed / 即使被抑制也显示强制更新', async () => {
      render(<UpdateNotification />)

      // 显示可用更新并关闭 / Show available update and close
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      const closeButton = document.querySelector('.ant-modal-close')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      // 发送强制更新 / Send mandatory update
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.mandatory)
      })

      // 强制更新应该显示 / Mandatory update should show
      await waitFor(() => {
        expect(screen.getByText('发现新版本')).toBeInTheDocument()
        expect(screen.getByText(/\[MANDATORY\]/)).toBeInTheDocument()
      })
    })
  })

  describe('Mandatory Updates / 强制更新', () => {
    it('does not show skip version button for mandatory updates / 强制更新不显示跳过此版本按钮', async () => {
      render(<UpdateNotification />)

      // 显示强制更新 / Show mandatory update
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.mandatory)
      })

      // 不应该有跳过此版本按钮 / Should not have skip version button
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /跳过此版本/ })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /立即更新（必需）/ })).toBeInTheDocument()
      })
    })

    it('prevents dialog dismissal for mandatory updates / 强制更新阻止对话框关闭', async () => {
      render(<UpdateNotification />)

      // 显示强制更新 / Show mandatory update
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.mandatory)
      })

      // 尝试关闭对话框 / Try to close dialog
      const closeButton = document.querySelector('.ant-modal-close')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      // 对话框应该仍然显示 / Dialog should still be visible
      await waitFor(() => {
        expect(screen.getByText('发现新版本')).toBeInTheDocument()
        expect(screen.getByText(/\[MANDATORY\]/)).toBeInTheDocument()
      })
    })
  })

  describe('Version Management / 版本管理', () => {
    it('does not show dialog for skipped version / 跳过的版本不显示对话框', async () => {
      render(<UpdateNotification />)

      // 显示更新并跳过版本 / Show update and skip version
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      const skipButton = await screen.findByRole('button', { name: /跳过此版本/ })
      fireEvent.click(skipButton)

      // 再次发送相同版本 / Send same version again
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      // 对话框不应该显示 / Dialog should not show
      expect(screen.queryByText('发现新版本')).not.toBeInTheDocument()
    })

    it('shows dialog for new version after skipping previous version / 跳过旧版本后为新版本显示对话框', async () => {
      render(<UpdateNotification />)

      // 显示1.2.0版本并跳过 / Show v1.2.0 and skip
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.available)
      })

      const skipButton = await screen.findByRole('button', { name: /跳过此版本/ })
      fireEvent.click(skipButton)

      // 发送新版本1.3.0 / Send new version 1.3.0
      const newVersionUpdate = {
        ...mockUpdateStatusData.available,
        info: { ...mockUpdateStatusData.available.info, version: '1.3.0' }
      }

      act(() => {
        ipcListeners['update-status'](null, newVersionUpdate)
      })

      // 新版本的对话框应该显示 / New version dialog should show
      await waitFor(() => {
        expect(screen.getByText('发现新版本')).toBeInTheDocument()
        expect(screen.getByText('版本 1.3.0')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling / 错误处理', () => {
    it('handles API call failures gracefully / 优雅处理 API 调用失败', async () => {
      // 模拟 API 调用失败 / Mock API call failure
      mockUpdateApi.checkForUpdates.mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<UpdateNotification />)

      // 手动触发检查更新以测试错误处理 / Manually trigger update check to test error handling
      act(() => {
        ipcListeners['update-status'](null, mockUpdateStatusData.error)
      })

      // 点击重试按钮触发 API 调用 / Click retry button to trigger API call
      const retryButton = await screen.findByRole('button', { name: /重试/ })
      fireEvent.click(retryButton)

      // 应该捕获并记录错误 / Should catch and log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('检查更新失败:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('handles missing update info gracefully / 优雅处理缺失的更新信息', async () => {
      render(<UpdateNotification />)

      // 发送不完整的更新状态 / Send incomplete update status
      const incompleteStatus = {
        status: 'available'
        // 缺少 info 字段 / Missing info field
      }

      act(() => {
        ipcListeners['update-status'](null, incompleteStatus)
      })

      // 应该不会崩溃 / Should not crash
      expect(screen.queryByText('发现新版本')).not.toBeInTheDocument()
    })
  })
})
