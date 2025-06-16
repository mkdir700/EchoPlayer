import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Space, Typography } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { List as VirtualizedList, AutoSizer, ListRowProps } from 'react-virtualized'
import 'react-virtualized/styles.css'

import { SubtitleListItem } from './SubtitleListItem'
import { formatTime } from '@renderer/utils/helpers'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { useSubtitleListContext } from '@renderer/hooks/core/useSubtitleListContext'

import { useVideoPlayerContext } from '@renderer/hooks/core/useVideoPlayerContext'
import { usePlayingVideoContext } from '@renderer/hooks/core/usePlayingVideoContext'
import { AimButton } from './AimButton'
import { RendererLogger } from '@renderer/utils/logger'
import { useVideoControls } from '@renderer/hooks/features/video/useVideoPlayerHooks'
import { SPACING, FONT_SIZES } from '@renderer/styles/theme'
import { SubtitleEmptyState } from './SubtitleEmptyState'
import { useIsSingleLoop, useLoopSettings } from '@renderer/stores/slices/videoConfigStore'

const { Text } = Typography

// 虚拟列表项高度（与主题系统保持一致）/ Virtual list item heights consistent with theme system
const ITEM_HEIGHT = 64 // 桌面端高度 / Desktop height
const MOBILE_ITEM_HEIGHT = 60 // 移动端高度 / Mobile height
const AUTO_SCROLL_TIMEOUT = 3000 // 用户滚动后自动恢复的时间 / Auto scroll recovery timeout

// 获取当前设备的行高 / Get current device row height
const getItemHeight = (): number => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768 ? MOBILE_ITEM_HEIGHT : ITEM_HEIGHT
  }
  return ITEM_HEIGHT
}

/**
 * Renders a virtualized, auto-scrolling list of subtitle items synchronized with video playback.
 *
 * Displays subtitle items in a scrollable list, automatically keeping the active subtitle visible as the video plays.
 * The list scrolls naturally when the current subtitle approaches the edges of the visible area, maintaining
 * a more natural scrolling experience instead of always centering the active subtitle.
 *
 * @returns The rendered subtitle list content as a React element.
 */
export function SubtitleListContent(): React.JSX.Element {
  const { token, styles } = useTheme()
  const subtitleListContext = useSubtitleListContext()
  const { seekTo } = useVideoControls()
  const { currentTimeRef, subscribeToTime } = useVideoPlayerContext()
  const { fileId } = usePlayingVideoContext()

  // 循环播放相关状态 / Loop playback related state
  const isSingleLoop = useIsSingleLoop(fileId)
  const { count: loopCount } = useLoopSettings(fileId)
  const {
    subtitleItemsRef,
    isAutoScrollEnabledRef,
    currentSubtitleIndexRef,
    enableAutoScroll,
    disableAutoScroll,
    getSubtitleIndexForTime,
    setCurrentSubtitleIndex,
    showSubtitlePrompt,
    handleManualSubtitleImport,
    handleDroppedFile
  } = subtitleListContext
  const virtualListRef = useRef<VirtualizedList>(null)

  // 滚动状态引用 / Scroll state references
  const lastSubtitleIndexRef = useRef(-1)
  const isInitializedRef = useRef(false)
  const isScrollingByUser = useRef(false)
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasScrolledOnceRef = useRef(false)
  // 新增：标记程序是否正在执行自动滚动 / Flag for programmatic scrolling
  const isProgrammaticScrollingRef = useRef(false)
  // 动画相关的引用 / Animation related references
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  // 添加状态来跟踪当前激活的字幕索引，确保重新渲染 / Track active subtitle index for re-rendering
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(-1)

  // 打开外部浏览器搜索字幕 / Open external browser to search subtitles
  const handleOpenSubtitleWebsite = useCallback(async (websiteUrl: string, websiteName: string) => {
    try {
      // 使用 Electron 的 shell.openExternal 打开外部浏览器
      await window.electron.ipcRenderer.invoke('shell:openExternal', websiteUrl)
      console.log(`🌐 打开字幕网站: ${websiteName} - ${websiteUrl}`)
    } catch (error) {
      console.error('打开字幕网站失败:', error)
    }
  }, [])

  // 点击字幕项时，跳转到对应时间点并重置循环播放状态 / Click subtitle item to jump to time and reset loop state
  const handleClickSubtitleItem = useCallback(
    (time: number, index: number): void => {
      RendererLogger.info('🎯 字幕项点击跳转:', {
        targetTime: time,
        subtitleIndex: index,
        isSingleLoop,
        loopCount
      })

      // 立即显示点击的字幕 / Immediately display the clicked subtitle
      setCurrentSubtitleIndex(index)

      // 跳转到指定时间点 / Jump to the specified time
      seekTo(time)

      // 循环播放逻辑会自动检测到时间变化并重新初始化到新的字幕位置
      // Loop logic will automatically detect time change and reinitialize to new subtitle position
      if (isSingleLoop && fileId) {
        RendererLogger.info('🔄 循环播放将重新初始化到新字幕位置:', {
          action: '用户点击字幕项跳转',
          newSubtitleIndex: index,
          targetTime: time
        })
      }
    },
    [setCurrentSubtitleIndex, seekTo, isSingleLoop, fileId, loopCount]
  )

  // 计算可视区域内的行数
  const getVisibleRowCount = useCallback((): number => {
    if (!virtualListRef.current) return 0
    const { height } = virtualListRef.current.props
    return Math.floor(height / getItemHeight())
  }, [])

  // 获取当前滚动位置的第一个可见行索引
  const getFirstVisibleIndex = useCallback((): number => {
    if (!virtualListRef.current) return 0
    // 通过 Grid 实例获取滚动信息
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grid = (virtualListRef.current as any).Grid
    if (!grid) return 0

    const scrollTop = grid.state?.scrollTop || 0
    return Math.floor(scrollTop / getItemHeight())
  }, [])

  // 获取当前滚动位置
  const getCurrentScrollTop = useCallback((): number => {
    if (!virtualListRef.current) return 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grid = (virtualListRef.current as any).Grid
    if (!grid) return 0
    return grid.state?.scrollTop || 0
  }, [])

  // 设置滚动位置
  const setScrollTop = useCallback((scrollTop: number): void => {
    if (!virtualListRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grid = (virtualListRef.current as any).Grid
    if (grid && grid.scrollToPosition) {
      grid.scrollToPosition({ scrollTop })
    }
  }, [])

  // 缓动函数（ease-out）
  const easeOutQuart = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 4)
  }, [])

  // 平滑滚动到指定位置
  const smoothScrollTo = useCallback(
    (targetScrollTop: number, duration: number = 300): Promise<void> => {
      return new Promise((resolve) => {
        // 取消之前的动画
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        const startScrollTop = getCurrentScrollTop()
        const distance = targetScrollTop - startScrollTop
        const startTime = Date.now()

        // 如果距离很小，直接跳转
        if (Math.abs(distance) < 5) {
          setScrollTop(targetScrollTop)
          resolve()
          return
        }

        isAnimatingRef.current = true
        isProgrammaticScrollingRef.current = true

        const animate = (): void => {
          const currentTime = Date.now()
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)

          const easedProgress = easeOutQuart(progress)
          const currentScrollTop = startScrollTop + distance * easedProgress

          setScrollTop(currentScrollTop)

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate)
          } else {
            isAnimatingRef.current = false
            // 延迟清除程序滚动标记，确保滚动事件处理完成
            setTimeout(() => {
              isProgrammaticScrollingRef.current = false
            }, 50)
            resolve()
          }
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      })
    },
    [getCurrentScrollTop, setScrollTop, easeOutQuart]
  )

  // 智能滚动：只有当字幕接近边缘时才滚动
  const scrollToIndexSmart = useCallback(
    async (index: number, isFirstTime: boolean = false): Promise<boolean> => {
      if (!virtualListRef.current || index < 0 || index >= subtitleItemsRef.current.length) {
        return false
      }

      try {
        const itemHeight = getItemHeight()

        if (isFirstTime) {
          // 首次滚动：将字幕显示在列表上部1/3位置，使用平滑滚动
          const visibleCount = getVisibleRowCount()
          const targetPosition = Math.max(0, index - Math.floor(visibleCount / 3))
          const targetScrollTop = targetPosition * itemHeight

          console.log(`🎯 首次定位: 字幕索引 ${index}, 滚动到位置 ${targetPosition}`)
          await smoothScrollTo(targetScrollTop, 400) // 首次滚动稍慢一些
        } else {
          // 常规滚动：检查是否需要滚动
          const firstVisibleIndex = getFirstVisibleIndex()
          const visibleCount = getVisibleRowCount()
          const lastVisibleIndex = firstVisibleIndex + visibleCount - 1

          // 定义滚动的触发区域（可视区域的上下边缘各留出一些空间）
          const scrollMargin = Math.max(2, Math.floor(visibleCount * 0.2)) // 20%的边距
          const scrollTriggerTop = firstVisibleIndex + scrollMargin
          const scrollTriggerBottom = lastVisibleIndex - scrollMargin

          console.log(
            `📊 滚动检查: 当前字幕=${index}, 可视范围=[${firstVisibleIndex}, ${lastVisibleIndex}], 触发区域=[${scrollTriggerTop}, ${scrollTriggerBottom}]`
          )

          if (index < scrollTriggerTop) {
            // 字幕在上方触发区域，向上滚动
            const targetPosition = Math.max(0, index - Math.floor(visibleCount / 3))
            const targetScrollTop = targetPosition * itemHeight
            console.log(`⬆️ 向上滚动: 目标位置 ${targetPosition}`)
            await smoothScrollTo(targetScrollTop, 250) // 常规滚动稍快
          } else if (index > scrollTriggerBottom) {
            // 字幕在下方触发区域，向下滚动
            const targetPosition = Math.max(0, index - Math.floor((visibleCount * 2) / 3))
            const targetScrollTop = targetPosition * itemHeight
            console.log(`⬇️ 向下滚动: 目标位置 ${targetPosition}`)
            await smoothScrollTo(targetScrollTop, 250) // 常规滚动稍快
          } else {
            // 字幕在安全区域内，不需要滚动
            console.log(`✅ 字幕在可视区域内，无需滚动`)
            return true
          }
        }

        return true
      } catch (error) {
        console.warn('智能滚动失败:', error)
        isProgrammaticScrollingRef.current = false
        return false
      }
    },
    [subtitleItemsRef, getVisibleRowCount, getFirstVisibleIndex, smoothScrollTo]
  )

  // 立即滚动到指定位置（用于大幅度跳转）
  const scrollToIndexInstantly = useCallback(
    (index: number) => {
      if (!virtualListRef.current || index < 0 || index >= subtitleItemsRef.current.length) {
        return false
      }

      try {
        // 标记为程序滚动
        isProgrammaticScrollingRef.current = true

        // 大幅度跳转时，将字幕显示在列表中上部
        const visibleCount = getVisibleRowCount()
        const targetPosition = Math.max(0, index - Math.floor(visibleCount / 3))

        virtualListRef.current.scrollToRow(targetPosition)
        console.log(`🚀 立即滚动: 字幕索引 ${index}, 滚动到位置 ${targetPosition}`)

        // 延迟清除标记，确保滚动事件处理完成
        setTimeout(() => {
          isProgrammaticScrollingRef.current = false
        }, 50)

        return true
      } catch (error) {
        console.warn('立即滚动失败:', error)
        isProgrammaticScrollingRef.current = false
        return false
      }
    },
    [subtitleItemsRef, getVisibleRowCount]
  )

  // 渲染单个字幕项
  const rowRenderer = useCallback(
    ({ index, key, style }: ListRowProps): React.ReactNode => {
      const item = subtitleItemsRef.current[index]
      if (!item) return null

      // 使用激活索引状态来计算 isActive，确保组件会重新渲染
      const isActive = index === activeSubtitleIndex

      return (
        <div
          key={key}
          style={{
            ...style,
            // 确保行容器没有边框
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            background: 'transparent'
          }}
        >
          <SubtitleListItem
            item={item}
            index={index}
            isActive={isActive}
            onClick={handleClickSubtitleItem}
            formatTime={formatTime}
          />
        </div>
      )
    },
    [activeSubtitleIndex, subtitleItemsRef, handleClickSubtitleItem]
  )

  // 订阅时间变化，如果时间变化则更新当前字幕索引
  useEffect(() => {
    const unsubscribe = subscribeToTime((time) => {
      const newSubtitleIndex = getSubtitleIndexForTime(time)
      const lastIndex = lastSubtitleIndexRef.current

      // 更新字幕索引和激活状态
      setCurrentSubtitleIndex(newSubtitleIndex)
      setActiveSubtitleIndex(newSubtitleIndex)

      // 如果用户正在手动滚动，跳过自动滚动
      if (isScrollingByUser.current) {
        RendererLogger.debug('🚫 用户开始滚动，取消自动滚动')
        return
      }

      // 如果自动滚动被禁用，也跳过
      if (!isAutoScrollEnabledRef.current) {
        RendererLogger.debug('🚫 自动滚动被禁用，跳过自动滚动', {
          currentTime: time,
          newSubtitleIndex,
          isAutoScrollEnabled: isAutoScrollEnabledRef.current
        })
        return
      }

      // 如果启用了自动滚动且有有效的字幕索引，执行滚动逻辑
      if (newSubtitleIndex >= 0 && subtitleItemsRef.current.length > 0) {
        const indexDifference = lastIndex >= 0 ? Math.abs(newSubtitleIndex - lastIndex) : 0

        // 判断滚动类型
        const isFirstTime = !hasScrolledOnceRef.current && newSubtitleIndex >= 0

        if (isFirstTime) {
          // 首次渲染：使用智能滚动
          console.log('🎯 首次定位到字幕:', newSubtitleIndex)

          const scrollWithDelay = async (): Promise<void> => {
            // 再次检查用户是否开始滚动
            if (isScrollingByUser.current) {
              console.log('🚫 用户开始滚动，取消首次定位')
              return
            }

            try {
              const success = await scrollToIndexSmart(newSubtitleIndex, true)
              if (success) {
                hasScrolledOnceRef.current = true
                lastSubtitleIndexRef.current = newSubtitleIndex
                isInitializedRef.current = true
              } else {
                // 如果失败，稍后重试
                setTimeout(scrollWithDelay, 50)
              }
            } catch (error) {
              console.warn('首次滚动失败:', error)
              setTimeout(scrollWithDelay, 50)
            }
          }

          setTimeout(scrollWithDelay, 10)
        } else if (indexDifference > 10) {
          // 大幅度跳转：立即定位
          RendererLogger.debug(`🚀 大幅度跳转: ${lastIndex} -> ${newSubtitleIndex}`)

          if (scrollToIndexInstantly(newSubtitleIndex)) {
            lastSubtitleIndexRef.current = newSubtitleIndex
          }
        } else if (newSubtitleIndex !== lastIndex) {
          // 小幅度变化：使用智能滚动
          console.log(`📱 字幕切换: ${lastIndex} -> ${newSubtitleIndex}`)
          // 异步调用但不等待，让滚动在后台进行
          scrollToIndexSmart(newSubtitleIndex, false).catch((error) => {
            console.warn('智能滚动失败:', error)
          })
          lastSubtitleIndexRef.current = newSubtitleIndex
        }
      } else if (newSubtitleIndex >= 0) {
        // 只更新索引，不滚动
        lastSubtitleIndexRef.current = newSubtitleIndex
      }
    })

    return unsubscribe
  }, [
    subscribeToTime,
    getSubtitleIndexForTime,
    setCurrentSubtitleIndex,
    scrollToIndexSmart,
    scrollToIndexInstantly,
    subtitleItemsRef,
    isAutoScrollEnabledRef
  ])

  // 处理滚动事件（区分用户手动滚动和程序自动滚动）
  const handleScroll = useCallback(() => {
    // 如果是程序触发的滚动，忽略
    if (isProgrammaticScrollingRef.current) {
      // 程序滚动时，确保自动滚动是启用的
      if (!isAutoScrollEnabledRef.current) {
        enableAutoScroll()
      }
      return
    }

    // 用户手动滚动时的处理
    console.log('👤 检测到用户手动滚动')
    isScrollingByUser.current = true

    // 禁用自动滚动
    if (isAutoScrollEnabledRef.current) {
      console.log('🚫 禁用自动滚动，用户正在手动滚动')
      disableAutoScroll()
    }

    // 清除现有定时器
    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current)
    }

    // 设置新的定时器，在一段时间后重新启用自动滚动
    userScrollTimerRef.current = setTimeout(() => {
      console.log('⏰ 自动恢复自动滚动')
      enableAutoScroll()
      isScrollingByUser.current = false
    }, AUTO_SCROLL_TIMEOUT)
  }, [isAutoScrollEnabledRef, enableAutoScroll, disableAutoScroll])

  // 重置状态当字幕数据变化时
  useEffect(() => {
    if (subtitleItemsRef.current.length === 0) {
      hasScrolledOnceRef.current = false
      isInitializedRef.current = false
      lastSubtitleIndexRef.current = -1
      setActiveSubtitleIndex(-1)
    } else {
      // 初始化时设置正确的激活索引
      const currentIndex = getSubtitleIndexForTime(currentTimeRef.current)
      setActiveSubtitleIndex(currentIndex)
    }
  }, [subtitleItemsRef, getSubtitleIndexForTime, currentTimeRef])

  // 清理定时器和动画
  useEffect(() => {
    return () => {
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="subtitle-list-container" style={styles.subtitleListContainerNoHeader}>
      {subtitleItemsRef.current.length > 0 && (
        <div style={styles.subtitleListHeader}>
          <Text style={{ fontSize: FONT_SIZES.XS, color: token.colorTextTertiary }}>
            字幕列表 ({subtitleItemsRef.current.length})
          </Text>
          <Space>{currentSubtitleIndexRef.current >= 0 && <AimButton />}</Space>
        </div>
      )}
      <div style={styles.subtitleListContent}>
        {showSubtitlePrompt ? (
          <SubtitleEmptyState
            onImport={handleManualSubtitleImport}
            onFilesDrop={handleDroppedFile}
            onWebsiteClick={handleOpenSubtitleWebsite}
          />
        ) : subtitleItemsRef.current.length > 0 ? (
          <AutoSizer defaultHeight={100}>
            {({ height, width }) => (
              <VirtualizedList
                ref={virtualListRef}
                height={height}
                width={width}
                rowCount={subtitleItemsRef.current.length}
                rowHeight={getItemHeight()}
                rowRenderer={rowRenderer}
                onScroll={handleScroll}
                overscanRowCount={10} // 预渲染额外的行以提高滚动体验
                scrollToAlignment="start" // 改为从顶部开始对齐，让滚动更自然
                style={styles.subtitleListVirtualizedList}
              />
            )}
          </AutoSizer>
        ) : (
          <div style={styles.subtitleListEmptyState}>
            <MessageOutlined
              style={{
                fontSize: token.fontSizeHeading2,
                marginBottom: SPACING.MD,
                opacity: 0.5
              }}
            />
            <div>暂无字幕文件</div>
            <div
              style={{
                fontSize: FONT_SIZES.XS,
                marginTop: SPACING.XS
              }}
            >
              请点击&ldquo;导入字幕&rdquo;按钮加载字幕文件
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
