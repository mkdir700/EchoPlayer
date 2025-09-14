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

  it('queries dictionary when a word is clicked', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: true,
      data: {
        word: 'hello',
        phonetic: '/həˈləʊ/',
        definitions: [{ partOfSpeech: 'int.', meaning: '你好' }]
      }
    })
    // @ts-ignore - injected by test setup
    window.api.dictionary.queryEudic = mockQuery

    render(<SubtitleOverlay />)

    const word = screen.getByText('hello')
    fireEvent.click(word)

    await waitFor(() => expect(mockQuery).toHaveBeenCalledWith('hello'))
    const popover = await screen.findByTestId('dictionary-popover')
    expect(popover.textContent).toContain('/həˈləʊ/')
    expect(popover.textContent).toContain('你好')
  })
})
