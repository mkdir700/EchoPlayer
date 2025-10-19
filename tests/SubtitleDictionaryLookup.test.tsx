import '@testing-library/jest-dom'

import { SubtitleOverlay } from '@renderer/pages/player/components/SubtitleOverlay'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@renderer/pages/player/hooks', () => ({
  useSubtitleOverlay: () => ({
    currentSubtitle: { originalText: 'hello', translatedText: '你好' },
    shouldShow: true,
    setPosition: vi.fn(),
    setSize: vi.fn()
  }),
  useSubtitleOverlayUI: () => ({
    isDragging: false,
    isResizing: false,
    showBoundaries: false,
    isHovered: false,
    containerBounds: { width: 300, height: 100 },
    startDragging: vi.fn(),
    stopDragging: vi.fn(),
    startResizing: vi.fn(),
    stopResizing: vi.fn(),
    setHovered: vi.fn(),
    setSelectedText: vi.fn(),
    updateContainerBounds: vi.fn(),
    adaptToContainerResize: vi.fn(),
    avoidCollision: vi.fn()
  })
}))

vi.mock('@renderer/state', () => ({
  usePlayerStore: (selector: any) =>
    selector({
      subtitleOverlay: {
        displayMode: SubtitleDisplayMode.ORIGINAL,
        position: { x: 0, y: 0 },
        size: { width: 300, height: 100 },
        backgroundStyle: { type: SubtitleBackgroundType.TRANSPARENT, opacity: 0.5 }
      }
    })
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations = {
        'player.dictionary.loading': '查询中...',
        'player.dictionary.error': '查询失败',
        'player.dictionary.translations': '常用翻译'
      }
      return translations[key] || key
    }
  })
}))

// Mock antd Popover to avoid DOM issues in testing
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Popover: ({ children, content, title, open }: any) => {
      return (
        <div>
          {children}
          {open && (
            <div role="tooltip" data-testid="dictionary-popover">
              {title && <div data-testid="dictionary-popover-title">{title}</div>}
              {content && <div data-testid="dictionary-popover-content-wrapper">{content}</div>}
            </div>
          )}
        </div>
      )
    },
    Button: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Spin: ({ children }: any) => <div data-testid="loading-spinner">{children}</div>,
    Tooltip: ({ children, title }: any) => <div title={title}>{children}</div>
  }
})

describe('SubtitleOverlay dictionary lookup', () => {
  // 辅助函数：等待弹窗显示并获取内容
  const waitForPopover = async (timeout = 3000) => {
    await waitFor(
      () => {
        const popover = screen.getByTestId('dictionary-popover')
        expect(popover).toBeInTheDocument()
      },
      { timeout }
    )

    await waitFor(
      () => {
        const contentWrapper = screen.getByTestId('dictionary-popover-content-wrapper')
        expect(contentWrapper).toBeInTheDocument()
      },
      { timeout }
    )

    return screen.getByTestId('dictionary-popover')
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // 创建包含 video 元素的 DOM 结构
    const container = document.createElement('div')
    container.setAttribute('data-testid', 'video-surface')
    const video = document.createElement('video')
    container.appendChild(video)
    document.body.appendChild(container)
  })

  afterEach(() => {
    // 清理 DOM
    const container = document.querySelector('[data-testid="video-surface"]')
    if (container) {
      document.body.removeChild(container)
    }
  })

  it('queries dictionary when a word is clicked and shows enhanced popover', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: true,
      data: {
        word: 'hello',
        pronunciations: [
          { type: 'uk', phonetic: '/həˈləʊ/' },
          { type: 'us', phonetic: '/həˈloʊ/' }
        ],
        definitions: [
          { partOfSpeech: 'int.', meaning: '你好' },
          { partOfSpeech: 'n.', meaning: '问候；打招呼' }
        ],
        translations: ['你好', '哈喽', '喂']
      }
    })
    // @ts-ignore - injected by test setup
    window.api.dictionary.queryEudic = mockQuery

    render(<SubtitleOverlay />)

    const word = screen.getByText('hello')
    fireEvent.click(word)

    await waitFor(() => expect(mockQuery).toHaveBeenCalledWith('hello'))

    // 使用辅助函数等待弹窗显示
    const popover = await waitForPopover()

    // 检查单词标题
    expect(popover.textContent).toContain('hello')
    // 检查音标
    expect(popover.textContent).toContain('/həˈləʊ/')
    // 检查词性和释义
    expect(popover.textContent).toContain('int.')
    expect(popover.textContent).toContain('你好')
    expect(popover.textContent).toContain('n.')
    expect(popover.textContent).toContain('问候；打招呼')
    // 检查翻译
    expect(popover.textContent).toContain('常用翻译')
    expect(popover.textContent).toContain('哈喽')
  })

  it('shows result after loading completes', async () => {
    const mockQuery = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { word: 'hello', definitions: [{ meaning: '你好' }] }
              }),
            100
          )
        )
    )
    // @ts-ignore - injected by test setup
    window.api.dictionary.queryEudic = mockQuery

    render(<SubtitleOverlay />)

    const word = screen.getByText('hello')
    fireEvent.click(word)

    // 等待弹窗显示
    await waitForPopover()

    // 等待数据加载完成后显示结果
    await waitFor(
      () => {
        const popoverContent = screen.getByTestId('dictionary-popover-content')
        expect(popoverContent).toBeInTheDocument()
        expect(popoverContent.textContent).toContain('你好')
      },
      { timeout: 3000 }
    )
  })

  it('shows error state when query fails', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: false,
      error: '网络错误'
    })
    // @ts-ignore - injected by test setup
    window.api.dictionary.queryEudic = mockQuery

    render(<SubtitleOverlay />)

    const word = screen.getByText('hello')
    fireEvent.click(word)

    await waitFor(() => expect(mockQuery).toHaveBeenCalledWith('hello'))

    // 等待弹窗显示
    await waitForPopover()

    // 等待错误内容渲染完成
    await waitFor(
      () => {
        expect(screen.getByText('查询失败')).toBeInTheDocument()
        expect(screen.getByText('网络错误')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('displays all definitions without limitation', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: true,
      data: {
        word: 'test',
        definitions: Array.from({ length: 10 }, (_, i) => ({
          partOfSpeech: 'n.',
          meaning: `释义 ${i + 1}`
        }))
      }
    })
    // @ts-ignore - injected by test setup
    window.api.dictionary.queryEudic = mockQuery

    render(<SubtitleOverlay />)

    const word = screen.getByText('hello')
    fireEvent.click(word)

    await waitFor(() => expect(mockQuery).toHaveBeenCalledWith('hello'))

    // 使用辅助函数等待弹窗显示
    const popover = await waitForPopover()

    // 检查显示所有释义
    expect(popover.textContent).toContain('释义 1')
    expect(popover.textContent).toContain('释义 6')
    expect(popover.textContent).toContain('释义 7')
    expect(popover.textContent).toContain('释义 10')
  })
})
