import { useRef, useCallback, useEffect, useMemo } from 'react'
import { throttle } from '../utils/helpers'
import { AUTO_SCROLL_SETTINGS, THROTTLE_DELAYS } from '../constants'

interface UseAutoScrollProps {
  currentSubtitleIndex: number
  subtitlesLength: number
  isAutoScrollEnabled: boolean
  onAutoScrollChange: (enabled: boolean) => void
}

interface UseAutoScrollReturn {
  subtitleListRef: React.RefObject<HTMLDivElement | null>
  handleUserScroll: () => void
  scrollToCurrentSubtitle: (index: number, forceInstant?: boolean) => void
  handleCenterCurrentSubtitle: () => void
}

export function useAutoScroll({
  currentSubtitleIndex,
  subtitlesLength,
  isAutoScrollEnabled,
  onAutoScrollChange
}: UseAutoScrollProps): UseAutoScrollReturn {
  const subtitleListRef = useRef<HTMLDivElement>(null)
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoScrollingRef = useRef(false)
  const scrollEventListenerRef = useRef<boolean>(false)
  const isInitializedRef = useRef(false)
  const lastSubtitleIndexRef = useRef(-1)
  const initialScrollDoneRef = useRef(false)

  // 检查 DOM 元素是否准备就绪
  const checkDOMReady = useCallback((): boolean => {
    if (!subtitleListRef.current || subtitlesLength === 0) {
      return false
    }

    const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
    if (!listElement) {
      return false
    }

    const antListContainer = listElement.querySelector('.ant-list-items')
    const actualContainer = antListContainer || listElement

    return actualContainer.children.length > 0
  }, [subtitlesLength])

  // 将字幕索引映射到实际DOM索引的辅助函数
  const getActualDOMIndex = useCallback((subtitleIndex: number): number => {
    if (!subtitleListRef.current || subtitleIndex < 0) return -1

    const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
    if (!listElement) return -1

    const antListContainer = listElement.querySelector('.ant-list-items')
    const actualContainer = antListContainer || listElement
    const actualItemsCount = actualContainer.children.length

    if (subtitleIndex >= actualItemsCount) {
      return actualItemsCount - 1
    }

    return subtitleIndex
  }, [])

  // 立即定位函数（无动画）
  const scrollToPositionInstantly = useCallback(
    (index: number): boolean => {
      if (index === -1 || !subtitleListRef.current || subtitlesLength === 0) {
        return false
      }

      if (!checkDOMReady()) {
        return false
      }

      const actualDOMIndex = getActualDOMIndex(index)
      if (actualDOMIndex === -1) {
        return false
      }

      const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
      if (!listElement) {
        return false
      }

      const antListContainer = listElement.querySelector('.ant-list-items')
      const actualContainer = antListContainer || listElement
      const actualItemsCount = actualContainer.children.length

      if (actualDOMIndex >= actualItemsCount) {
        return false
      }

      const currentItem = actualContainer.children[actualDOMIndex] as HTMLElement
      if (!currentItem) {
        return false
      }

      const listRect = listElement.getBoundingClientRect()
      const itemRect = currentItem.getBoundingClientRect()

      if (listElement.scrollHeight <= listRect.height) {
        return true // 不需要滚动
      }

      const itemTopRelativeToList = itemRect.top - listRect.top + listElement.scrollTop
      const itemHeight = itemRect.height
      const listHeight = listRect.height

      let targetScrollTop = itemTopRelativeToList - listHeight / 2 + itemHeight / 2

      const maxScrollTop = listElement.scrollHeight - listHeight
      targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))

      const totalItems = actualItemsCount
      const isNearStart = actualDOMIndex < AUTO_SCROLL_SETTINGS.NEAR_START_ITEMS
      const isNearEnd = actualDOMIndex >= totalItems - AUTO_SCROLL_SETTINGS.NEAR_END_ITEMS

      if (isNearStart) {
        targetScrollTop = Math.max(
          0,
          targetScrollTop - listHeight * AUTO_SCROLL_SETTINGS.VERTICAL_OFFSET_RATIO
        )
      } else if (isNearEnd) {
        targetScrollTop = Math.min(
          maxScrollTop,
          targetScrollTop + listHeight * AUTO_SCROLL_SETTINGS.VERTICAL_OFFSET_RATIO
        )
      }

      // 立即定位，不使用动画
      listElement.scrollTo({
        top: targetScrollTop,
        behavior: 'auto'
      })

      return true
    },
    [subtitlesLength, getActualDOMIndex, checkDOMReady]
  )

  // 优化的自动滚动函数
  const scrollToCurrentSubtitle = useMemo(() => {
    return throttle((index: number, forceInstant = false): void => {
      if (index === -1 || !subtitleListRef.current || subtitlesLength === 0) {
        return
      }

      if (!isAutoScrollEnabled) {
        return
      }

      // 判断是否需要立即定位
      const shouldScrollInstantly =
        forceInstant ||
        (!initialScrollDoneRef.current && index > 0) ||
        (lastSubtitleIndexRef.current === -1 && index > 0 && !isInitializedRef.current)

      if (shouldScrollInstantly) {
        // 使用立即定位函数
        const success = scrollToPositionInstantly(index)
        if (success) {
          initialScrollDoneRef.current = true
          return
        }
        // 如果立即定位失败，延迟重试
        setTimeout(() => {
          if (scrollToPositionInstantly(index)) {
            initialScrollDoneRef.current = true
          }
        }, 100)
        return
      }

      // 检查 DOM 是否准备就绪
      if (!checkDOMReady()) {
        // 延迟重试，但不输出日志
        setTimeout(() => {
          if (checkDOMReady()) {
            scrollToCurrentSubtitle(index, forceInstant)
          }
        }, 100)
        return
      }

      isAutoScrollingRef.current = true

      const actualDOMIndex = getActualDOMIndex(index)
      if (actualDOMIndex === -1) {
        isAutoScrollingRef.current = false
        return
      }

      const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
      if (!listElement) {
        isAutoScrollingRef.current = false
        return
      }

      const antListContainer = listElement.querySelector('.ant-list-items')
      const actualContainer = antListContainer || listElement
      const actualItemsCount = actualContainer.children.length

      if (actualDOMIndex >= actualItemsCount) {
        isAutoScrollingRef.current = false
        return
      }

      const currentItem = actualContainer.children[actualDOMIndex] as HTMLElement
      if (!currentItem) {
        isAutoScrollingRef.current = false
        return
      }

      const listRect = listElement.getBoundingClientRect()
      const itemRect = currentItem.getBoundingClientRect()

      if (listElement.scrollHeight <= listRect.height) {
        isAutoScrollingRef.current = false
        return
      }

      const itemTopRelativeToList = itemRect.top - listRect.top + listElement.scrollTop
      const itemHeight = itemRect.height
      const listHeight = listRect.height

      let targetScrollTop = itemTopRelativeToList - listHeight / 2 + itemHeight / 2

      const maxScrollTop = listElement.scrollHeight - listHeight
      targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))

      const totalItems = actualItemsCount
      const isNearStart = actualDOMIndex < AUTO_SCROLL_SETTINGS.NEAR_START_ITEMS
      const isNearEnd = actualDOMIndex >= totalItems - AUTO_SCROLL_SETTINGS.NEAR_END_ITEMS

      if (isNearStart) {
        targetScrollTop = Math.max(
          0,
          targetScrollTop - listHeight * AUTO_SCROLL_SETTINGS.VERTICAL_OFFSET_RATIO
        )
      } else if (isNearEnd) {
        targetScrollTop = Math.min(
          maxScrollTop,
          targetScrollTop + listHeight * AUTO_SCROLL_SETTINGS.VERTICAL_OFFSET_RATIO
        )
      }

      const currentScrollTop = listElement.scrollTop
      const scrollDifference = Math.abs(targetScrollTop - currentScrollTop)

      if (scrollDifference > AUTO_SCROLL_SETTINGS.MIN_SCROLL_THRESHOLD) {
        // 使用平滑滚动
        listElement.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      }

      setTimeout(() => {
        isAutoScrollingRef.current = false
      }, AUTO_SCROLL_SETTINGS.COMPLETION_DELAY)
    }, THROTTLE_DELAYS.SCROLL)
  }, [
    subtitlesLength,
    getActualDOMIndex,
    isAutoScrollEnabled,
    checkDOMReady,
    scrollToPositionInstantly
  ])

  // 重置用户滚动定时器
  const resetUserScrollTimer = useCallback((): void => {
    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current)
    }

    userScrollTimerRef.current = setTimeout(() => {
      onAutoScrollChange(true)
    }, AUTO_SCROLL_SETTINGS.TIMEOUT)
  }, [onAutoScrollChange])

  // 处理用户滚动事件
  const handleUserScroll = useCallback((): void => {
    if (isAutoScrollingRef.current) {
      return
    }

    if (isAutoScrollEnabled) {
      onAutoScrollChange(false)
    }

    resetUserScrollTimer()
  }, [isAutoScrollEnabled, onAutoScrollChange, resetUserScrollTimer])

  // 手动定位到当前字幕的函数
  const handleCenterCurrentSubtitle = useCallback((): void => {
    if (currentSubtitleIndex >= 0) {
      onAutoScrollChange(true)

      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
        userScrollTimerRef.current = null
      }

      scrollToCurrentSubtitle(currentSubtitleIndex, true) // 强制立即定位
    }
  }, [currentSubtitleIndex, onAutoScrollChange, scrollToCurrentSubtitle])

  // 专门处理初始化定位的效果
  useEffect(() => {
    // 当字幕数据加载完成且有有效的当前索引时，立即定位
    if (
      subtitlesLength > 0 &&
      currentSubtitleIndex > 0 &&
      !initialScrollDoneRef.current &&
      isAutoScrollEnabled
    ) {
      // 立即尝试定位，不等待任何延迟
      const attemptInitialScroll = (): boolean => {
        const success = scrollToPositionInstantly(currentSubtitleIndex)
        if (success) {
          initialScrollDoneRef.current = true
          lastSubtitleIndexRef.current = currentSubtitleIndex
          isInitializedRef.current = true
          console.log('🎯 初始定位成功，索引:', currentSubtitleIndex)
          return true
        }
        return false
      }

      // 立即尝试
      if (attemptInitialScroll()) {
        return () => {
          // 无需清理
        }
      }

      // 如果立即尝试失败，使用更短的间隔重试
      let retryCount = 0
      const maxRetries = 10
      const retryInterval = setInterval(() => {
        retryCount++
        if (attemptInitialScroll() || retryCount >= maxRetries) {
          clearInterval(retryInterval)
          if (retryCount >= maxRetries) {
            console.warn('⚠️ 初始定位重试次数已达上限')
          }
        }
      }, 20) // 每20ms重试一次，更频繁

      return () => {
        clearInterval(retryInterval)
      }
    }

    // 当条件不满足时，也返回一个空的清理函数
    return () => {
      // 无需清理
    }
  }, [subtitlesLength, currentSubtitleIndex, isAutoScrollEnabled, scrollToPositionInstantly])

  // 监听字幕索引变化并自动滚动
  useEffect(() => {
    if (currentSubtitleIndex >= 0 && isAutoScrollEnabled && subtitlesLength > 0) {
      // 如果初始定位还没完成，跳过这次更新
      if (!initialScrollDoneRef.current && currentSubtitleIndex > 0) {
        return
      }

      // 检测是否是大幅度的索引跳跃（可能是进度条拖动导致的）
      const lastIndex = lastSubtitleIndexRef.current
      const indexDifference = Math.abs(currentSubtitleIndex - lastIndex)
      const isLargeJump = indexDifference > 5 // 如果索引跳跃超过5，认为是进度条拖动

      if (isLargeJump && lastIndex !== -1) {
        // 大幅度跳跃，使用立即定位
        console.log('🎯 检测到大幅度索引跳跃，使用立即定位:', {
          from: lastIndex,
          to: currentSubtitleIndex,
          difference: indexDifference
        })

        const success = scrollToPositionInstantly(currentSubtitleIndex)
        if (success) {
          lastSubtitleIndexRef.current = currentSubtitleIndex
          return
        }
      }

      // 使用双重 requestAnimationFrame 确保 DOM 完全渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToCurrentSubtitle(currentSubtitleIndex)
          // 更新上次的索引
          lastSubtitleIndexRef.current = currentSubtitleIndex
          // 标记为已初始化
          if (!isInitializedRef.current) {
            isInitializedRef.current = true
          }
        })
      })
    }
  }, [
    currentSubtitleIndex,
    isAutoScrollEnabled,
    scrollToCurrentSubtitle,
    subtitlesLength,
    scrollToPositionInstantly
  ])

  // 监听字幕数据变化，在数据恢复时立即定位
  useEffect(() => {
    if (subtitlesLength > 0 && currentSubtitleIndex > 0 && !initialScrollDoneRef.current) {
      // 字幕数据刚刚加载，立即尝试定位
      setTimeout(() => {
        const success = scrollToPositionInstantly(currentSubtitleIndex)
        if (success) {
          initialScrollDoneRef.current = true
          lastSubtitleIndexRef.current = currentSubtitleIndex
          if (!isInitializedRef.current) {
            isInitializedRef.current = true
          }
        }
      }, 0) // 立即执行
    }
  }, [subtitlesLength, currentSubtitleIndex, scrollToPositionInstantly])

  // 重置初始化状态当字幕数据变化时
  useEffect(() => {
    if (subtitlesLength === 0) {
      isInitializedRef.current = false
      lastSubtitleIndexRef.current = -1
      initialScrollDoneRef.current = false
    }
  }, [subtitlesLength])

  // 设置滚动事件监听器
  const setupScrollListener = useCallback((): (() => void) | undefined => {
    if (scrollEventListenerRef.current) {
      return undefined // 已经设置过了
    }

    const subtitleListContainer = subtitleListRef.current
    if (!subtitleListContainer) {
      return undefined
    }

    const listElement = subtitleListContainer.querySelector('[class*="subtitleList"]')
    if (!listElement) {
      return undefined
    }

    listElement.addEventListener('scroll', handleUserScroll, { passive: true })
    scrollEventListenerRef.current = true

    // 返回清理函数
    return (): void => {
      listElement.removeEventListener('scroll', handleUserScroll)
      scrollEventListenerRef.current = false
    }
  }, [handleUserScroll])

  // 监听用户滚动事件 - 延迟设置以确保 DOM 准备就绪
  useEffect(() => {
    if (subtitlesLength === 0) {
      return // 没有字幕时不需要设置监听器
    }

    let cleanupFunction: (() => void) | undefined

    // 延迟设置监听器，确保 DOM 已经渲染
    const timeoutId = setTimeout(() => {
      cleanupFunction = setupScrollListener()
    }, 200) // 200ms 延迟

    return (): void => {
      clearTimeout(timeoutId)

      // 调用清理函数（如果存在）
      if (cleanupFunction) {
        cleanupFunction()
      }

      // 清理滚动事件监听器
      if (scrollEventListenerRef.current && subtitleListRef.current) {
        const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
        if (listElement) {
          listElement.removeEventListener('scroll', handleUserScroll)
          scrollEventListenerRef.current = false
        }
      }
    }
  }, [subtitlesLength, setupScrollListener, handleUserScroll])

  // 清理定时器
  useEffect(() => {
    return (): void => {
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
        userScrollTimerRef.current = null
      }
    }
  }, [])

  return {
    subtitleListRef,
    handleUserScroll,
    scrollToCurrentSubtitle,
    handleCenterCurrentSubtitle
  }
}
