import React, { useRef, useEffect, useCallback } from 'react'
import { Space, Typography } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { List as VirtualizedList, AutoSizer, ListRowProps } from 'react-virtualized'
import 'react-virtualized/styles.css'
import { SubtitleListItem } from './SubtitleListItem'
import { formatTime } from '@renderer/utils/helpers'
import styles from './SubtitleListContent.module.css'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useVideoStateRefs, useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { AimButton } from './AimButton'

const { Text } = Typography

// 虚拟列表项高度（与CSS中的height保持一致）
const ITEM_HEIGHT = 64 // 桌面端高度
const MOBILE_ITEM_HEIGHT = 60 // 移动端高度
const AUTO_SCROLL_TIMEOUT = 3000 // 用户滚动后自动恢复的时间

// 获取当前设备的行高
const getItemHeight = (): number => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768 ? MOBILE_ITEM_HEIGHT : ITEM_HEIGHT
  }
  return ITEM_HEIGHT
}

export function SubtitleListContent(): React.JSX.Element {
  const subtitleListContext = useSubtitleListContext()
  const { volumeRef, playbackRateRef } = useVideoStateRefs()
  const { restoreVideoState } = useVideoControls()
  const { currentTimeRef, subscribeToTime } = useVideoPlayerContext()

  const {
    subtitleItemsRef,
    isAutoScrollEnabledRef,
    currentSubtitleIndexRef,
    enableAutoScroll,
    disableAutoScroll,
    getSubtitleIndexForTime,
    setCurrentSubtitleIndex
  } = subtitleListContext
  const virtualListRef = useRef<VirtualizedList>(null)

  // 滚动状态引用
  const lastSubtitleIndexRef = useRef(-1)
  const isInitializedRef = useRef(false)
  const isScrollingByUser = useRef(false)
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasScrolledOnceRef = useRef(false)
  // 新增：标记程序是否正在执行自动滚动
  const isProgrammaticScrollingRef = useRef(false)

  // 点击字幕项时，恢复视频状态
  const handleClickSubtitleItem = (time: number): void => {
    restoreVideoState(time, playbackRateRef.current, volumeRef.current)
  }

  // 立即滚动到指定位置（无动画）
  const scrollToIndexInstantly = useCallback(
    (index: number) => {
      if (!virtualListRef.current || index < 0 || index >= subtitleItemsRef.current.length) {
        return false
      }

      try {
        // 标记为程序滚动
        isProgrammaticScrollingRef.current = true

        // 使用 center 对齐方式，让字幕显示在列表中间
        virtualListRef.current.scrollToRow(index)

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
    [subtitleItemsRef]
  )

  // 平滑滚动到指定位置（带动画）
  const scrollToIndexSmoothly = useCallback(
    (index: number) => {
      if (!virtualListRef.current || index < 0 || index >= subtitleItemsRef.current.length) {
        return false
      }

      try {
        // 标记为程序滚动
        isProgrammaticScrollingRef.current = true

        // 使用 requestAnimationFrame 确保平滑效果
        requestAnimationFrame(() => {
          if (virtualListRef.current) {
            // 使用 center 对齐方式，让字幕显示在列表中间
            virtualListRef.current.scrollToRow(index)

            // 延迟清除标记，确保滚动事件处理完成
            setTimeout(() => {
              isProgrammaticScrollingRef.current = false
            }, 100)
          }
        })

        return true
      } catch (error) {
        console.warn('平滑滚动失败:', error)
        isProgrammaticScrollingRef.current = false
        return false
      }
    },
    [subtitleItemsRef]
  )

  // 渲染单个字幕项
  const rowRenderer = ({ index, key, style }: ListRowProps): React.ReactNode => {
    const item = subtitleItemsRef.current[index]
    if (!item) return null

    const isActive =
      currentTimeRef.current >= item.startTime && currentTimeRef.current <= item.endTime

    return (
      <div key={key} style={style}>
        <SubtitleListItem
          item={item}
          index={index}
          isActive={isActive}
          onClick={handleClickSubtitleItem}
          formatTime={formatTime}
        />
      </div>
    )
  }

  // 订阅时间变化，如果时间变化则更新当前字幕索引
  useEffect(() => {
    const unsubscribe = subscribeToTime((time) => {
      const newSubtitleIndex = getSubtitleIndexForTime(time)
      const lastIndex = lastSubtitleIndexRef.current

      // 更新字幕索引
      setCurrentSubtitleIndex(newSubtitleIndex)

      // 如果用户正在手动滚动，跳过自动滚动
      if (isScrollingByUser.current) {
        return
      }

      // 如果自动滚动被禁用，也跳过
      if (!isAutoScrollEnabledRef.current) {
        return
      }

      // 如果启用了自动滚动且有有效的字幕索引，执行滚动逻辑
      if (newSubtitleIndex >= 0 && subtitleItemsRef.current.length > 0) {
        const indexDifference = lastIndex >= 0 ? Math.abs(newSubtitleIndex - lastIndex) : 0

        // 判断滚动类型
        const isFirstTime = !hasScrolledOnceRef.current && newSubtitleIndex >= 0

        if (isFirstTime) {
          // 首次渲染：立即定位，无动画
          console.log('🎯 首次定位到字幕:', newSubtitleIndex)

          const scrollWithDelay = (): void => {
            // 再次检查用户是否开始滚动
            if (isScrollingByUser.current) {
              console.log('🚫 用户开始滚动，取消首次定位')
              return
            }

            if (scrollToIndexInstantly(newSubtitleIndex)) {
              hasScrolledOnceRef.current = true
              lastSubtitleIndexRef.current = newSubtitleIndex
              isInitializedRef.current = true
            } else {
              // 如果失败，稍后重试
              setTimeout(scrollWithDelay, 50)
            }
          }

          setTimeout(scrollWithDelay, 10)
        } else if (indexDifference > 10) {
          // 大幅度跳转：立即定位
          console.log('🚀 大幅度跳转:', {
            from: lastIndex,
            to: newSubtitleIndex,
            difference: indexDifference
          })

          if (scrollToIndexInstantly(newSubtitleIndex)) {
            lastSubtitleIndexRef.current = newSubtitleIndex
          }
        } else {
          // 小幅度变化：平滑滚动
          scrollToIndexSmoothly(newSubtitleIndex)
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
    scrollToIndexInstantly,
    scrollToIndexSmoothly,
    subtitleItemsRef,
    isAutoScrollEnabledRef
  ])

  // 处理滚动事件（区分用户手动滚动和程序自动滚动）
  const handleScroll = useCallback(() => {
    // 如果是程序触发的滚动，忽略
    if (isProgrammaticScrollingRef.current) {
      if (!isAutoScrollEnabledRef.current) {
        enableAutoScroll()
      }
      return
    }

    if (isAutoScrollEnabledRef.current) {
      disableAutoScroll()
      return
    }

    isScrollingByUser.current = true

    // 禁用自动滚动
    if (isAutoScrollEnabledRef.current) {
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
    }
  }, [subtitleItemsRef])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={styles.subtitleListContainerNoHeader}>
      {subtitleItemsRef.current.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 0%, transparent 100%)'
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            字幕列表 ({subtitleItemsRef.current.length})
          </Text>
          <Space>{currentSubtitleIndexRef.current >= 0 && <AimButton />}</Space>
        </div>
      )}
      <div className={styles.subtitleListContent}>
        {subtitleItemsRef.current.length > 0 ? (
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
                scrollToAlignment="center" // 改为居中对齐，让当前字幕显示在列表中间
              />
            )}
          </AutoSizer>
        ) : (
          <div className={styles.emptyState}>
            <MessageOutlined style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }} />
            <div>暂无字幕文件</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              请点击&ldquo;导入字幕&rdquo;按钮加载字幕文件
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
