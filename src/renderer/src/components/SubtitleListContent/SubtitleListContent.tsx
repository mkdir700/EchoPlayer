import React, { useRef, useEffect, useCallback } from 'react'
import { Button, Space, Typography } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { List as VirtualizedList, AutoSizer, ListRowProps } from 'react-virtualized'
import 'react-virtualized/styles.css'
import { SubtitleListItem } from './SubtitleListItem'
import { formatTime } from '@renderer/utils/helpers'
import styles from './SubtitleListContent.module.css'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { usePlaybackSettingsContext } from '@renderer/hooks/usePlaybackSettingsContext'
import { useVideoStateRefs, useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'

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
    getSubtitleIndexForTime,
    setCurrentSubtitleIndex
  } = subtitleListContext
  const playbackSettingsContext = usePlaybackSettingsContext()
  const virtualListRef = useRef<VirtualizedList>(null)

  // 滚动状态引用
  const lastSubtitleIndexRef = useRef(-1)
  const isInitializedRef = useRef(false)
  const isAutoScrollingRef = useRef(false)
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasScrolledOnceRef = useRef(false)

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
        isAutoScrollingRef.current = true
        // 使用 center 对齐方式，让字幕显示在列表中间
        virtualListRef.current.scrollToRow(index)
        return true
      } catch (error) {
        console.warn('立即滚动失败:', error)
        return false
      } finally {
        // 短暂延迟后重置标志
        setTimeout(() => {
          isAutoScrollingRef.current = false
        }, 100)
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
        isAutoScrollingRef.current = true

        // 使用 requestAnimationFrame 确保平滑效果
        requestAnimationFrame(() => {
          if (virtualListRef.current) {
            // 使用 center 对齐方式，让字幕显示在列表中间
            virtualListRef.current.scrollToRow(index)
          }
        })

        return true
      } catch (error) {
        console.warn('平滑滚动失败:', error)
        return false
      } finally {
        // 延迟重置标志，给平滑动画留时间
        setTimeout(() => {
          isAutoScrollingRef.current = false
        }, 300)
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

      console.log('🎯 时间变化:', {
        time,
        newSubtitleIndex,
        lastSubtitleIndex: lastIndex
      })

      // 更新字幕索引
      setCurrentSubtitleIndex(newSubtitleIndex)

      // 如果启用了自动滚动且有有效的字幕索引，执行滚动逻辑
      if (
        newSubtitleIndex >= 0 &&
        isAutoScrollEnabledRef.current &&
        subtitleItemsRef.current.length > 0
      ) {
        const indexDifference = lastIndex >= 0 ? Math.abs(newSubtitleIndex - lastIndex) : 0

        // 判断滚动类型
        const isFirstTime = !hasScrolledOnceRef.current && newSubtitleIndex >= 0
        const isLargeJump = lastIndex >= 0 && indexDifference > 15
        const isSequentialChange = lastIndex >= 0 && indexDifference <= 2

        if (isFirstTime) {
          // 首次渲染：立即定位，无动画
          console.log('🎯 首次定位到字幕:', newSubtitleIndex)

          const scrollWithDelay = (): void => {
            if (scrollToIndexInstantly(newSubtitleIndex)) {
              hasScrolledOnceRef.current = true
              lastSubtitleIndexRef.current = newSubtitleIndex
              isInitializedRef.current = true
            } else {
              // 如果失败，稍后重试
              setTimeout(scrollWithDelay, 50)
            }
          }

          // 稍微延迟，确保虚拟列表已渲染
          setTimeout(scrollWithDelay, 50)
        } else if (isLargeJump) {
          // 大幅度跳转：立即定位，无动画
          console.log('🚀 大幅度跳转:', {
            from: lastIndex,
            to: newSubtitleIndex,
            difference: indexDifference
          })

          if (scrollToIndexInstantly(newSubtitleIndex)) {
            lastSubtitleIndexRef.current = newSubtitleIndex
          }
        } else if (isSequentialChange) {
          // 连续播放：平滑滚动，有动画
          console.log('📱 平滑滚动:', { from: lastIndex, to: newSubtitleIndex })

          setTimeout(() => {
            if (scrollToIndexSmoothly(newSubtitleIndex)) {
              lastSubtitleIndexRef.current = newSubtitleIndex
            }
          }, 100)
        } else {
          console.log('🎯 中等幅度跳转:', newSubtitleIndex)
          // 更新索引但不滚动（中等幅度跳转）
          scrollToIndexSmoothly(newSubtitleIndex)
          lastSubtitleIndexRef.current = newSubtitleIndex
        }
      } else {
        // 更新索引
        console.log('🎯 中等幅度跳转:', newSubtitleIndex)
        scrollToIndexSmoothly(newSubtitleIndex)
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
    isAutoScrollEnabledRef,
    subtitleItemsRef
  ])

  // 处理用户手动滚动
  const handleUserScroll = useCallback(() => {
    if (isAutoScrollingRef.current) {
      return
    }

    // 禁用自动滚动
    if (isAutoScrollEnabledRef.current) {
      playbackSettingsContext.setAutoScrollEnabled(false)
    }

    // 清除现有定时器
    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current)
    }

    // 设置新的定时器，在一段时间后重新启用自动滚动
    userScrollTimerRef.current = setTimeout(() => {
      playbackSettingsContext.setAutoScrollEnabled(true)
    }, AUTO_SCROLL_TIMEOUT)
  }, [isAutoScrollEnabledRef, playbackSettingsContext])

  // 手动定位到当前字幕并启用自动滚动
  const handleCenterCurrentSubtitle = useCallback(() => {
    if (currentSubtitleIndexRef.current >= 0 && virtualListRef.current) {
      // 启用自动滚动
      playbackSettingsContext.setAutoScrollEnabled(true)

      // 清除用户滚动定时器
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
        userScrollTimerRef.current = null
      }

      // 立即定位到当前字幕
      scrollToIndexInstantly(currentSubtitleIndexRef.current)
      lastSubtitleIndexRef.current = currentSubtitleIndexRef.current
    }
  }, [currentSubtitleIndexRef, playbackSettingsContext, scrollToIndexInstantly])

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
          <Space>
            {/* 滚动模式状态指示器 */}
            <Text
              style={{
                fontSize: 11,
                color: isAutoScrollEnabledRef.current ? '#52c41a' : '#ff7a00',
                background: isAutoScrollEnabledRef.current ? '#f6ffed' : '#fff7e6',
                padding: '1px 6px',
                borderRadius: '4px',
                border: isAutoScrollEnabledRef.current ? '1px solid #b7eb8f' : '1px solid #ffd591'
              }}
            >
              {isAutoScrollEnabledRef.current ? '🤖 自动跟随' : '👆 手动浏览'}
            </Text>

            {currentSubtitleIndexRef.current >= 0 && (
              <Button
                size="small"
                type="text"
                onClick={handleCenterCurrentSubtitle}
                title={
                  isAutoScrollEnabledRef.current ? '定位当前字幕' : '定位当前字幕并启用自动跟随'
                }
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  color: isAutoScrollEnabledRef.current ? '#52c41a' : '#ff7a00'
                }}
              >
                {isAutoScrollEnabledRef.current ? '🎯 定位' : '🔓 定位'}
              </Button>
            )}
          </Space>
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
                onScroll={handleUserScroll}
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
