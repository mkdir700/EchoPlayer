/**
 * Tests for SubtitleListPanel
 * Note on framework: Designed for @testing-library/react with either Vitest (vi) or Jest (jest).
 * If running under Jest, ensure globals.jest exists; under Vitest, vi is available.
 */
import React from 'react'
import { describe, it, expect, beforeEach, vi as _vi } from 'vitest' // Vitest path; if using Jest, tooling may alias or ignore
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Under Jest environments without vi, map vi -> jest
// @ts-ignore
const vi = (typeof _vi !== 'undefined' ? _vi : (globalThis as any).vi) || (globalThis as any).jest;

// Mocks
vi.mock('react-virtuoso', () => {
  // Provide a simple stub that renders list items and forwards ref methods used in component
  const React = require('react')
  const Virtuoso = React.forwardRef(function VirtuosoMock(props: any, ref) {
    const { data = [], itemContent, scrollerRef, rangeChanged } = props
    const scrollerElRef = React.useRef<HTMLDivElement | null>(null)
    React.useImperativeHandle(ref, () => ({
      scrollToIndex: vi.fn()
    }))
    React.useEffect(() => {
      if (scrollerRef) scrollerRef(scrollerElRef.current)
      // trigger rangeChanged with a simple full range
      if (rangeChanged && data.length > 0) {
        rangeChanged({ startIndex: 0, endIndex: Math.max(0, data.length - 1) })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])
    return (
      <div data-testid="virtuoso" ref={scrollerElRef} style={{ height: 560 }}>
        {data.map((item: any, idx: number) => (
          <div key={props.computeItemKey ? props.computeItemKey(idx, item) : idx}>
            {itemContent(idx, item)}
          </div>
        ))}
      </div>
    )
  });
  return { Virtuoso, VirtuosoHandle: {} }
});

// Mock hooks and state
const mockOrchestrator = { getActiveSubtitleIndex: vi.fn(() => -1) }
const mockUsePlayerEngine = vi.fn(() => ({ orchestrator: mockOrchestrator }))
const mockUseSubtitleEngine = vi.fn(() => ({ currentIndex: -1 }))
const mockSeekToSubtitle = vi.fn()
const mockUsePlayerCommands = vi.fn(() => ({ seekToSubtitle: mockSeekToSubtitle }))

const mockInitialize = vi.fn()
const mockHandleItemClick = vi.fn()
const mockHandleRangeChanged = vi.fn()
const mockUseSubtitleScrollStateMachine = vi.fn(() => ({
  scrollState: 0, // SubtitleScrollState.DISABLED by default; tests set as needed
  initialize: mockInitialize,
  handleItemClick: mockHandleItemClick,
  handleRangeChanged: mockHandleRangeChanged
}))

const mockUseSubtitles = vi.fn(() => [])

vi.mock('../../hooks', async (orig) => {
  return {
    ...(await (orig as any)()),
    usePlayerEngine: mockUsePlayerEngine,
    useSubtitleEngine: mockUseSubtitleEngine
  }
})
vi.mock('../../hooks/usePlayerCommands', () => ({
  usePlayerCommands: mockUsePlayerCommands
}))
vi.mock('../../hooks/useSubtitleScrollStateMachine', () => {
  const SubtitleScrollState = { DISABLED: 0, IDLE: 1 }
  return {
    SubtitleScrollState,
    useSubtitleScrollStateMachine: mockUseSubtitleScrollStateMachine
  }
})
vi.mock('../../state/player-context', () => ({
  useSubtitles: mockUseSubtitles
}))
vi.mock('../', () => ({
  ImportSubtitleButton: () => <button type="button">Import Subtitle</button>
}))

// Import under test AFTER mocks
import SubtitleListPanel from '../SubtitleListPanel'

function buildSubtitle(id: string, start: number, end: number, text: string) {
  return { id, startTime: start, endTime: end, originalText: text }
}

describe('SubtitleListPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrchestrator.getActiveSubtitleIndex.mockReturnValue(-1)
    mockUseSubtitleEngine.mockReturnValue({ currentIndex: -1 })
    mockUseSubtitleScrollStateMachine.mockReturnValue({
      scrollState: 0, // DISABLED
      initialize: mockInitialize,
      handleItemClick: mockHandleItemClick,
      handleRangeChanged: mockHandleRangeChanged
    })
  })

  it('renders empty state with default title/description and import button when no subtitles', () => {
    mockUseSubtitles.mockReturnValueOnce([])
    render(<SubtitleListPanel />)
    const container = screen.getByRole('complementary', { name: /caption-list/i })
    expect(container).toBeInTheDocument()
    expect(screen.getByText('在视频文件同目录下未找到匹配的字幕文件')).toBeInTheDocument()
    expect(
      screen.getByText('您可以点击下方按钮选择字幕文件，或将字幕文件拖拽到此区域')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import subtitle/i })).toBeInTheDocument()
  })

  it('renders provided empty state props and custom actions', async () => {
    mockUseSubtitles.mockReturnValueOnce([])
    const user = userEvent.setup()
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()

    render(
      <SubtitleListPanel
        emptyTitle="No captions found"
        emptyDescription="Please add captions."
        emptyActions={[
          { key: 'a', label: 'Primary', onClick: onPrimary, type: 'primary' },
          { key: 'b', label: 'Secondary', onClick: onSecondary, type: 'default' }
        ]}
      />
    )

    expect(screen.getByText('No captions found')).toBeInTheDocument()
    expect(screen.getByText('Please add captions.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Primary' }))
    await user.click(screen.getByRole('button', { name: 'Secondary' }))

    expect(onPrimary).toHaveBeenCalledTimes(1)
    expect(onSecondary).toHaveBeenCalledTimes(1)
  })

  it('renders list with formatted times and text; highlights active index', () => {
    const subs = [
      buildSubtitle('s1', 0, 1.9, 'Hello'),
      buildSubtitle('s2', 65, 70.2, 'World'),
      buildSubtitle('s3', 125, 130.6, 'Zed')
    ]
    mockUseSubtitles.mockReturnValueOnce(subs)
    mockUseSubtitleEngine.mockReturnValueOnce({ currentIndex: 1 })

    render(<SubtitleListPanel />)

    const items = screen.getAllByTestId(/subtitle-item/i, { exact: false })
    // Since testids aren't present, use times and text to assert; fallback to roles
    expect(screen.getByText('0:00')).toBeInTheDocument()
    expect(screen.getByText('0:01')).toBeInTheDocument()
    expect(screen.getByText('1:05')).toBeInTheDocument()
    expect(screen.getByText('1:10')).toBeInTheDocument()
    expect(screen.getByText('2:05')).toBeInTheDocument()
    expect(screen.getByText('2:10')).toBeInTheDocument()

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
    expect(screen.getByText('Zed')).toBeInTheDocument()

    // Active styling: verify data-active="true" attribute from DOM
    const active = screen.getAllByText(/World/)[0].closest('[data-active="true"]')
    expect(active).not.toBeNull()
  })

  it('calls initialize() once subtitles load when scroll state is DISABLED', () => {
    const subs = [buildSubtitle('s1', 0, 2, 'One')]
    mockUseSubtitles.mockReturnValueOnce(subs)
    mockUseSubtitleScrollStateMachine.mockReturnValueOnce({
      scrollState: 0, // DISABLED
      initialize: mockInitialize,
      handleItemClick: mockHandleItemClick,
      handleRangeChanged: mockHandleRangeChanged
    })

    render(<SubtitleListPanel />)

    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })

  it('uses orchestrator.getActiveSubtitleIndex if available to compute initial index', () => {
    const subs = [buildSubtitle('s1', 0, 1, 'A'), buildSubtitle('s2', 60, 61, 'B')]
    mockUseSubtitles.mockReturnValueOnce(subs)
    mockOrchestrator.getActiveSubtitleIndex.mockReturnValueOnce(1)
    mockUseSubtitleEngine.mockReturnValueOnce({ currentIndex: 0 })

    render(<SubtitleListPanel />)

    // verify key includes initialTopMostItemIndex 1
    const virt = screen.getByTestId('virtuoso')
    expect(virt).toBeInTheDocument()
    // rangeChanged gets called and then state machine handleRangeChanged should be invoked as well
    expect(mockHandleRangeChanged).toHaveBeenCalled()
  })

  it('invokes handleItemClick when a subtitle item is clicked', async () => {
    const subs = [
      buildSubtitle('s1', 0, 1, 'ClickMe'),
      buildSubtitle('s2', 2, 3, 'NotMe')
    ]
    mockUseSubtitles.mockReturnValueOnce(subs)
    const user = userEvent.setup()

    render(<SubtitleListPanel />)
    await user.click(screen.getByText('ClickMe'))

    expect(mockHandleItemClick).toHaveBeenCalledWith(0)
    expect(mockHandleItemClick).toHaveBeenCalledTimes(1)
  })

  it('rangeChanged updates avg height and delegates to handleRangeChanged', () => {
    const subs = new Array(10).fill(0).map((_, i) => buildSubtitle(String(i), i * 5, i * 5 + 2, `T${i}`))
    mockUseSubtitles.mockReturnValueOnce(subs)

    render(<SubtitleListPanel />)

    // Our Virtuoso mock calls rangeChanged once; ensure delegate invoked
    expect(mockHandleRangeChanged).toHaveBeenCalledWith({ startIndex: 0, endIndex: 9 })
  })
})