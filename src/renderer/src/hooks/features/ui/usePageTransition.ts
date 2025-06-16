import { useState, useCallback, useRef, useEffect } from 'react'
import type { PageType } from '@renderer/types'

interface UsePageTransitionReturn {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
  isTransitioning: boolean
  previousPage: PageType | null
}

/**
 * 页面切换优化Hook
 * 提供页面切换状态管理和过渡优化
 */
export function usePageTransition(initialPage: PageType = 'home'): UsePageTransitionReturn {
  const [currentPage, setCurrentPageState] = useState<PageType>(initialPage)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [previousPage, setPreviousPage] = useState<PageType | null>(null)

  // 防抖切换页面
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setCurrentPage = useCallback(
    (page: PageType) => {
      if (page === currentPage) return

      // 清除之前的过渡定时器
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }

      setIsTransitioning(true)
      setPreviousPage(currentPage)

      // 使用requestAnimationFrame确保DOM更新
      requestAnimationFrame(() => {
        setCurrentPageState(page)

        // 短暂延迟后结束过渡状态
        transitionTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      })
    },
    [currentPage]
  )

  // 清理定时器
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  return {
    currentPage,
    setCurrentPage,
    isTransitioning,
    previousPage
  }
}
