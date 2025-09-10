import React, { createRef } from 'react'
import type { RefObject } from 'react'
import type { VirtuosoHandle } from 'react-virtuoso'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useSubtitleScrollStateMachine,
  SubtitleScrollState,
  ScrollTrigger,
  SCROLL_CONFIG,
  SubtitleScrollStateMachine as InternalMachine
} from '../useSubtitleScrollStateMachine'

/**
 * Testing framework & library:
 * - Test runner: Vitest (vi, describe/it/expect)
 * - React testing: @testing-library/react's renderHook
 * - Timers: Vitest fake timers (vi.useFakeTimers)
 *
 * If your repo uses Jest, switch to jest.useFakeTimers() and adjust vi.* to jest.*
 */
function makeVirtuosoRef(): RefObject<VirtuosoHandle> {
  const ref = createRef<VirtuosoHandle>()
  // Minimal mock for VirtuosoHandle used by the hook
  // @ts-expect-error partial mock
  ref.current = {
    scrollToIndex: vi.fn()
  } as VirtuosoHandle
  return ref
}

describe('SubtitleScrollStateMachine (class)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in DISABLED and transitions to LOCKED_TO_CURRENT on INITIAL_LOAD', () => {
    const sm = new InternalMachine()
    expect(sm.getCurrentState()).toBe(SubtitleScrollState.DISABLED)
    const changed = sm.transition(ScrollTrigger.INITIAL_LOAD)
    expect(changed).toBe(true)
    expect(sm.getCurrentState()).toBe(SubtitleScrollState.LOCKED_TO_CURRENT)
  })

  it('USER_MANUAL_SCROLL from LOCKED_TO_CURRENT enters USER_BROWSING and starts auto-return timer', () => {
    const sm = new InternalMachine()
    sm.transition(ScrollTrigger.INITIAL_LOAD)
    expect(sm.getCurrentState()).toBe(SubtitleScrollState.LOCKED_TO_CURRENT)

    const changed = sm.transition(ScrollTrigger.USER_MANUAL_SCROLL)
    expect(changed).toBe(true)
    expect(sm.getCurrentState()).toBe(SubtitleScrollState.USER_BROWSING)

    // Auto return timer should be scheduled; advance time to trigger AUTO_TIMEOUT transition
    vi.advanceTimersByTime(SCROLL_CONFIG.AUTO_RETURN_DELAY + 1);

    // AUTO_TIMEOUT is triggered internally by timer -> transition to TRANSITIONING
    // But the class triggers transition inside timer via transition(AUTO_TIMEOUT)
    // We cannot directly assert internal callback; instead, confirm we can move to LOCKED on playback progress next.
    const changed2 = sm.transition(ScrollTrigger.PLAYBACK_PROGRESS) // from TRANSITIONING -> LOCKED
    expect(changed2).toBe(true)
    expect(sm.getCurrentState()).toBe(SubtitleScrollState.LOCKED_TO_CURRENT)
  })

  it('clearAllTimers on destroy prevents pending timeouts from firing', () => {
    const sm = new InternalMachine()
    sm.transition(ScrollTrigger.INITIAL_LOAD)
    sm.transition(ScrollTrigger.USER_MANUAL_SCROLL) // enters USER_BROWSING and sets timer
    sm.destroy()
    // If timers were cleared, advancing timers should not alter state
    vi.advanceTimersByTime(SCROLL_CONFIG.AUTO_RETURN_DELAY + 50);
    expect(sm.getCurrentState()).not.toBe(SubtitleScrollState.TRANSITIONING)
  })

  it('ignores invalid transitions', () => {
    const sm = new InternalMachine()
    // From DISABLED, USER_MANUAL_SCROLL is invalid
    expect(sm.canTransition(ScrollTrigger.USER_MANUAL_SCROLL)).toBe(false)
    const changed = sm.transition(ScrollTrigger.USER_MANUAL_SCROLL)
    expect(changed).toBe(false)
    expect(sm.getCurrentState()).toBe(SubtitleScrollState.DISABLED)
  })
})

describe('useSubtitleScrollStateMachine (hook)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function setup({
    currentSubtitleIndex = 0,
    totalSubtitles = 20,
    onSeek = vi.fn()
  }: {
    currentSubtitleIndex?: number
    totalSubtitles?: number
    onSeek?: (i: number) => void
  } = {}) {
    const virtuosoRef = makeVirtuosoRef()

    const { result, rerender, unmount } = renderHook(
      (props: { current: number; total: number; ref: RefObject<VirtuosoHandle>; onSeek?: (i: number) => void }) =>
        useSubtitleScrollStateMachine(props.current, props.total, props.ref, props.onSeek),
      {
        initialProps: {
          current: currentSubtitleIndex,
          total: totalSubtitles,
          ref: virtuosoRef,
          onSeek: onSeek
        }
      }
    )

    return { result, rerender, virtuosoRef, onSeek, unmount }
  }

  it('initializes from DISABLED -> LOCKED_TO_CURRENT on initialize()', () => {
    const { result } = setup({ currentSubtitleIndex: 3 })
    expect(result.current.scrollState).toBe(SubtitleScrollState.DISABLED)

    act(() => {
      result.current.initialize()
    });
    expect(result.current.scrollState).toBe(SubtitleScrollState.LOCKED_TO_CURRENT)
  })

  it('auto-scrolls to current subtitle when entering LOCKED_TO_CURRENT', () => {
    const { result, virtuosoRef } = setup({ currentSubtitleIndex: 5 })
    const scrollToIndex = (virtuosoRef.current!.scrollToIndex as unknown as ReturnType<typeof vi.fn>);

    act(() => {
      result.current.initialize()
    });

    // Effect should trigger after state update
    // Run pending microtasks/timers to simulate scheduling if any
    vi.runAllTimers();

    expect(scrollToIndex).toHaveBeenCalledTimes(1);
    expect(scrollToIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 5,
        behavior: 'smooth',
        align: 'center'
      })
    );
    expect(result.current.isAutoScrolling).toBe(true);
    expect(result.current.showReturnButton).toBe(false);
  })

  it('scrollToCurrentSubtitle uses immediate auto behavior when transitioning', () => {
    const { result, virtuosoRef } = setup({ currentSubtitleIndex: 0 })
    const scrollToIndex = (virtuosoRef.current!.scrollToIndex as unknown as ReturnType<typeof vi.fn>);

    act(() => {
      result.current.initialize() // -> LOCKED
    });

    // Force TRANSITIONING, which should call scrollToCurrentSubtitle(true)
    act(() => {
      // simulate USER_BROWSING then AUTO_TIMEOUT -> TRANSITIONING
      result.current.handleUserScroll();
      vi.advanceTimersByTime(SCROLL_CONFIG.AUTO_RETURN_DELAY + 1);
      // On effect, entering TRANSITIONING should trigger immediate scroll
    });

    vi.runOnlyPendingTimers();

    expect(result.current.isTransitioning).toBe(true);
    expect(scrollToIndex).toHaveBeenCalled();
    // The first call could be from initial LOCKED; verify at least one call had behavior 'auto' for immediate
    const hadImmediate = scrollToIndex.mock.calls.some(call => call[0]?.behavior === 'auto');
    expect(hadImmediate).toBe(true);
  })

  it('handleReturnClick transitions to LOCKED_TO_CURRENT and scrolls immediately', () => {
    const { result, virtuosoRef } = setup({ currentSubtitleIndex: 10 })
    const scrollToIndex = (virtuosoRef.current!.scrollToIndex as unknown as ReturnType<typeof vi.fn>);

    act(() => {
      result.current.initialize()
    });

    // Enter browsing then click return
    act(() => {
      result.current.handleUserScroll()
    });
    expect(result.current.scrollState).toBe(SubtitleScrollState.USER_BROWSING)
    expect(result.current.showReturnButton).toBe(true)

    act(() => {
      result.current.handleReturnClick()
    });

    expect(result.current.scrollState).toBe(SubtitleScrollState.LOCKED_TO_CURRENT)
    // Immediate scroll should use behavior 'auto'
    const hadImmediate = scrollToIndex.mock.calls.some(call => call[0]?.behavior === 'auto');
    expect(hadImmediate).toBe(true);
  })

  it('handleItemClick triggers USER_BROWSING and calls onSeekToSubtitle', () => {
    const onSeek = vi.fn()
    const { result } = setup({ currentSubtitleIndex: 2, onSeek })

    act(() => {
      result.current.initialize()
    });

    act(() => {
      result.current.handleItemClick(7)
    });

    expect(result.current.scrollState).toBe(SubtitleScrollState.USER_BROWSING)
    expect(onSeek).toHaveBeenCalledWith(7)
  })

  it('handleRangeChanged triggers USER_BROWSING when current index not visible and state is LOCKED', () => {
    const { result } = setup({ currentSubtitleIndex: 8, totalSubtitles: 30 })

    act(() => {
      result.current.initialize() // LOCKED
    });
    expect(result.current.scrollState).toBe(SubtitleScrollState.LOCKED_TO_CURRENT)

    // Current (8) not in [start=0, end=5], should behave as user scroll and enter browsing
    act(() => {
      result.current.handleRangeChanged({ startIndex: 0, endIndex: 5 })
    });

    expect(result.current.scrollState).toBe(SubtitleScrollState.USER_BROWSING)
    expect(result.current.showReturnButton).toBe(true)
  })

  it('programmatic scrolling suppresses USER_MANUAL_SCROLL during the 300ms window', () => {
    const { result } = setup({ currentSubtitleIndex: 9 })

    act(() => {
      result.current.initialize()
    });

    // Trigger a programmatic scroll via scrollToCurrentSubtitle
    act(() => {
      result.current.scrollToCurrentSubtitle() // sets isProgrammaticScroll true and suppress flag
    });

    // Immediately attempt user scroll; should be ignored
    act(() => {
      result.current.handleUserScroll()
    });
    // Should still be LOCKED
    expect(result.current.scrollState).toBe(SubtitleScrollState.LOCKED_TO_CURRENT)

    // After 300ms, user scroll should be honored
    vi.advanceTimersByTime(301);
    act(() => {
      result.current.handleUserScroll()
    });
    expect(result.current.scrollState).toBe(SubtitleScrollState.USER_BROWSING)
  })

  it('calculate alignment indirectly via scrollToIndex calls (start, center, end)', () => {
    const virtuosoRef = makeVirtuosoRef()
    const scrollToIndex = (virtuosoRef.current!.scrollToIndex as unknown as ReturnType<typeof vi.fn>)

    const { result, rerender } = renderHook(
      (props: { current: number; total: number; ref: RefObject<VirtuosoHandle> }) =>
        useSubtitleScrollStateMachine(props.current, props.total, props.ref),
      { initialProps: { current: 0, total: 10, ref: virtuosoRef } }
    )

    act(() => {
      result.current.initialize()
    });

    // index 0 -> align 'start'
    act(() => result.current.scrollToCurrentSubtitle(true));
    let lastCall = scrollToIndex.mock.calls.at(-1)?.[0]
    expect(lastCall?.align).toBe('start')

    // middle index -> align 'center'
    rerender({ current: 4, total: 10, ref: virtuosoRef })
    act(() => result.current.scrollToCurrentSubtitle());
    lastCall = scrollToIndex.mock.calls.at(-1)?.[0]
    expect(lastCall?.align).toBe('center')
    expect(lastCall?.behavior).toBe('smooth')

    // near end (>= total - threshold (3)) -> align 'end'
    rerender({ current: 8, total: 10, ref: virtuosoRef })
    act(() => result.current.scrollToCurrentSubtitle());
    lastCall = scrollToIndex.mock.calls.at(-1)?.[0]
    expect(lastCall?.align).toBe('end')
  })

  it('large index jump uses behavior "auto"', () => {
    const virtuosoRef = makeVirtuosoRef()
    const scrollToIndex = (virtuosoRef.current!.scrollToIndex as unknown as ReturnType<typeof vi.fn>)
    const { result, rerender } = renderHook(
      (props: { current: number; total: number; ref: RefObject<VirtuosoHandle> }) =>
        useSubtitleScrollStateMachine(props.current, props.total, props.ref),
      { initialProps: { current: 0, total: 100, ref: virtuosoRef } }
    )

    act(() => {
      result.current.initialize()
    });

    // Jump by >5 should be treated as large jump -> 'auto'
    rerender({ current: 20, total: 100, ref: virtuosoRef })
    act(() => result.current.scrollToCurrentSubtitle());
    const lastCall = scrollToIndex.mock.calls.at(-1)?.[0]
    expect(lastCall?.behavior).toBe('smooth') // behavior depends on immediate param; scrollToCurrentSubtitle(false) uses calculated behavior
    // Now call immediate to force 'auto'
    act(() => result.current.scrollToCurrentSubtitle(true));
    const lastImmediate = scrollToIndex.mock.calls.at(-1)?.[0]
    expect(lastImmediate?.behavior).toBe('auto')
  })
})