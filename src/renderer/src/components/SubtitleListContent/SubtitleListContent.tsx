import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Space, Typography } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { List as VirtualizedList, AutoSizer, ListRowProps } from 'react-virtualized'
import 'react-virtualized/styles.css'
import './SubtitleListContent.css'
import { SubtitleListItem } from './SubtitleListItem'
import { formatTime } from '@renderer/utils/helpers'
import { useTheme } from '@renderer/hooks/useTheme'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useCurrentSubtitleDisplayContext } from '@renderer/hooks/useCurrentSubtitleDisplayContext'
import { AimButton } from './AimButton'
import { RendererLogger } from '@renderer/utils/logger'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
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
  const { token, styles } = useTheme()
  const subtitleListContext = useSubtitleListContext()
  const { volumeRef, playbackRateRef } = useVideoPlaybackSettingsContext()
  const { restoreVideoState } = useVideoControls()
  const { currentTimeRef, subscribeToTime } = useVideoPlayerContext()
  const { setSubtitleByIndex } = useCurrentSubtitleDisplayContext()

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

  // 添加状态来跟踪当前激活的字幕索引，确保重新渲染
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(-1)

  // 点击字幕项时，恢复视频状态并立即显示对应字幕
  const handleClickSubtitleItem = useCallback(
    (time: number, index: number): void => {
      // 立即显示点击的字幕
      setSubtitleByIndex(index)
      // 恢复视频状态
      restoreVideoState(time, playbackRateRef.current, volumeRef.current)
    },
    [setSubtitleByIndex, restoreVideoState, playbackRateRef, volumeRef]
  )

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
          RendererLogger.debug(`🚀 大幅度跳转: ${lastIndex} -> ${newSubtitleIndex}`)

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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="subtitle-list-container" style={styles.subtitleListContainerNoHeader}>
      {subtitleItemsRef.current.length > 0 && (
        <div style={styles.subtitleListHeader}>
          <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
            字幕列表 ({subtitleItemsRef.current.length})
          </Text>
          <Space>{currentSubtitleIndexRef.current >= 0 && <AimButton />}</Space>
        </div>
      )}
      <div style={styles.subtitleListContent}>
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
                style={{
                  ...styles.subtitleListVirtualizedList,
                  // 额外确保没有意外的边框
                  outline: 'none',
                  border: 'none'
                }}
              />
            )}
          </AutoSizer>
        ) : (
          <div style={styles.subtitleListEmptyState}>
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
