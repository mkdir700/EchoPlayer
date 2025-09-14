import '@testing-library/jest-dom'

import { SubtitleOverlay } from '@renderer/pages/player/components/SubtitleOverlay'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('SubtitleOverlay dictionary lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries dictionary when a word is clicked and shows enhanced popover', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: true,
      data: {
        word: 'hello',
        phonetic: '/həˈləʊ/',
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
    const popover = await screen.findByTestId('dictionary-popover')

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

  it('shows loading state while querying', async () => {
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

    // 检查加载状态
    expect(screen.getByText('查询中...')).toBeInTheDocument()
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

    // 检查错误状态
    expect(screen.getByText('查询失败')).toBeInTheDocument()
    expect(screen.getByText('网络错误')).toBeInTheDocument()
  })

  it('limits displayed definitions to 6 and shows more indicator', async () => {
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
    const popover = await screen.findByTestId('dictionary-popover')

    // 检查只显示前6个释义
    expect(popover.textContent).toContain('释义 6')
    expect(popover.textContent).not.toContain('释义 7')
    // 检查"还有更多"提示
    expect(popover.textContent).toContain('还有 4 个释义')
  })
})
