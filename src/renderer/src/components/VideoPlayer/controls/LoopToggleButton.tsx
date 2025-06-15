import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Button, Tooltip, Dropdown } from 'antd'
import { useTheme } from '@renderer/hooks/useTheme'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import {
  useLoopSettings,
  useSetLoopSettings,
  useIsSingleLoop,
  useSetIsSingleLoop
} from '@renderer/stores/slices/videoConfigStore'
import type { SubtitleItem, LoopSettings } from '@types_/shared'
import RendererLogger from '@renderer/utils/logger'
import { LoopIcon } from './LoopIcon'
import { CustomLoopCountModal } from './CustomLoopCountModal'

interface LoopToggleButtonProps {
  isVideoLoaded: boolean
  variant?: 'compact' | 'fullscreen'
}

/**
 * 循环播放切换按钮组件，支持多种循环模式和循环次数设置
 * Loop toggle button component with support for multiple loop modes and count settings
 *
 * 功能特性 / Features:
 * - 支持关闭、单句循环、指定次数循环三种模式 / Supports off, single loop, and count loop modes
 * - 在图标中央显示循环次数或无限符号 / Displays loop count or infinity symbol in icon center
 * - 实时更新剩余循环次数 / Real-time updates of remaining loop count
 * - 支持紧凑和全屏两种显示变体 / Supports compact and fullscreen display variants
 *
 * @param isVideoLoaded - 视频是否已加载 / Whether the video is loaded
 * @param variant - 显示变体：'compact' 紧凑模式，'fullscreen' 全屏模式 / Display variant
 * @returns 循环切换按钮组件 / Loop toggle button component
 */
export function LoopToggleButton({
  isVideoLoaded,
  variant = 'compact'
}: LoopToggleButtonProps): React.JSX.Element {
  const { styles } = useTheme()
  const { fileId } = usePlayingVideoContext()
  const rawLoopSettings = useLoopSettings(fileId || '')
  const setLoopSettings = useSetLoopSettings()
  const isSingleLoop = useIsSingleLoop(fileId || '')
  const setIsSingleLoop = useSetIsSingleLoop()

  // 使用 useMemo 优化默认值逻辑 / Use useMemo to optimize default value logic
  const loopSettings = useMemo(() => {
    return rawLoopSettings || { count: -1 } // 默认无限循环 / Default infinite loop
  }, [rawLoopSettings])

  // 运行时状态：剩余循环次数（不持久化）/ Runtime state: remaining count (not persisted)
  const [remainingCount, setRemainingCount] = useState<number>(0)

  // 右键菜单状态 / Right-click menu state
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  // 自定义次数模态框状态 / Custom count modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false)

  // 同步循环设置变化时的剩余次数 / Sync remaining count when loop settings change
  useEffect(() => {
    if (isSingleLoop && loopSettings.count >= 2) {
      // 指定次数循环模式，设置剩余次数 / Specific count loop mode, set remaining count
      setRemainingCount(loopSettings.count)
    } else {
      // 循环关闭或无限循环模式，剩余次数为0 / Loop off or infinite loop mode, remaining count is 0
      setRemainingCount(0)
    }
  }, [isSingleLoop, loopSettings.count])

  // 单句循环相关状态
  const { currentTimeRef, isPlayingRef, isVideoLoadedRef, subscribeToTime } =
    useVideoPlayerContext()
  const { subtitleItemsRef } = useSubtitleListContext()
  const { seekTo } = useVideoControls()

  // 循环开关切换逻辑 / Loop toggle logic
  const handleLoopToggle = useCallback(() => {
    if (!fileId) return

    // 简单的开启/关闭切换 / Simple on/off toggle
    const newIsSingleLoop = !isSingleLoop
    setIsSingleLoop(fileId, newIsSingleLoop)

    // 重置剩余次数 / Reset remaining count
    if (newIsSingleLoop && loopSettings.count >= 2) {
      setRemainingCount(loopSettings.count)
    } else {
      setRemainingCount(0)
    }

    console.log(
      '🔄 循环开关切换:',
      isSingleLoop ? '关闭' : '开启',
      '循环次数:',
      loopSettings.count === -1 ? '无限' : loopSettings.count
    )
  }, [fileId, isSingleLoop, loopSettings.count, setIsSingleLoop])

  // 处理循环次数设置 / Handle loop count setting
  const handleCountChange = useCallback(
    (count: number) => {
      if (!fileId) return

      const newSettings: LoopSettings = {
        count
      }

      setLoopSettings(fileId, newSettings)

      // 如果当前循环开启且是指定次数循环，更新剩余次数 / If loop is on and specific count, update remaining count
      if (isSingleLoop && count >= 2) {
        setRemainingCount(count)
      }

      console.log('🔄 循环次数设置:', count === -1 ? '无限循环' : `${count}次`)
    },
    [fileId, isSingleLoop, setLoopSettings]
  )

  // 处理右键菜单 / Handle right-click menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsMenuOpen(true)
  }, [])

  // 内部状态管理 / Internal state management
  const singleLoopSubtitleRef = useRef<SubtitleItem | null>(null)
  const lastLoopTimeRef = useRef<number>(0)
  const currentSubtitleIndexRef = useRef<number>(-1) // 当前循环的字幕索引 / Current looping subtitle index

  // 当前字幕索引的计算函数 / Function to calculate current subtitle index
  const getCurrentSubtitleIndex = useCallback((): number => {
    const currentTime = currentTimeRef.current || 0
    const allSubtitles = subtitleItemsRef.current || []

    for (let i = 0; i < allSubtitles.length; i++) {
      const subtitle = allSubtitles[i]
      if (currentTime >= subtitle.startTime && currentTime <= subtitle.endTime) {
        return i
      }
    }
    return -1
  }, [currentTimeRef, subtitleItemsRef])

  // 处理循环播放逻辑 / Handle loop playback logic
  useEffect(() => {
    console.log(
      '🔄 LoopToggleButton useEffect 触发: isSingleLoop =',
      isSingleLoop,
      'count =',
      loopSettings.count
    )

    if (!isSingleLoop) {
      // 清理状态 / Clear state
      singleLoopSubtitleRef.current = null
      lastLoopTimeRef.current = 0
      currentSubtitleIndexRef.current = -1
      setRemainingCount(0)
      console.log('🔄 清理循环状态')
      return
    }

    console.log('🔄 开始设置循环监听器')

    const handleTimeUpdate = (currentTime: number): void => {
      if (!isSingleLoop || !isVideoLoadedRef.current || !isPlayingRef.current || !fileId) {
        return
      }

      const allSubtitles = subtitleItemsRef.current || []
      if (allSubtitles.length === 0) return

      if (singleLoopSubtitleRef.current) {
        const loopSubtitle = singleLoopSubtitleRef.current

        if (currentTime > loopSubtitle.endTime) {
          const now = Date.now()
          if (now - lastLoopTimeRef.current < 500) {
            return
          }

          // 检查是否需要继续循环当前句子 / Check if should continue looping current sentence
          if (loopSettings.count >= 2 && remainingCount > 1) {
            // 继续循环当前句子 / Continue looping current sentence
            console.log('🔄 循环触发：跳回当前字幕开始', {
              currentTime,
              endTime: loopSubtitle.endTime,
              startTime: loopSubtitle.startTime,
              text: loopSubtitle.text,
              remainingCount: remainingCount
            })

            lastLoopTimeRef.current = now
            setRemainingCount(remainingCount - 1)
            seekTo(loopSubtitle.startTime)
            return
          }

          // 当前句子循环完成，处理下一步 / Current sentence loop completed, handle next step
          if (loopSettings.count >= 2 && remainingCount <= 1) {
            // 查找下一句字幕 / Find next subtitle
            const currentIndex = currentSubtitleIndexRef.current
            const nextIndex = currentIndex + 1

            if (nextIndex < allSubtitles.length) {
              // 跳转到下一句并重新开始循环 / Jump to next sentence and restart loop
              const nextSubtitle = allSubtitles[nextIndex]
              singleLoopSubtitleRef.current = nextSubtitle
              currentSubtitleIndexRef.current = nextIndex
              setRemainingCount(loopSettings.count) // 重置循环次数 / Reset loop count

              console.log('🔄 跳转到下一句字幕并开始循环', {
                nextIndex,
                text: nextSubtitle.text,
                startTime: nextSubtitle.startTime,
                endTime: nextSubtitle.endTime,
                resetCount: loopSettings.count
              })

              lastLoopTimeRef.current = now
              seekTo(nextSubtitle.startTime)
              return
            } else {
              // 已经是最后一句，关闭循环 / Already the last sentence, turn off loop
              setIsSingleLoop(fileId, false)
              setRemainingCount(0)
              singleLoopSubtitleRef.current = null
              currentSubtitleIndexRef.current = -1
              console.log('🔄 已到达最后一句字幕，自动关闭循环')
              return
            }
          }

          // 无限循环模式 / Infinite loop mode
          if (loopSettings.count === -1) {
            console.log('🔄 单句无限循环：跳回字幕开始', {
              currentTime,
              endTime: loopSubtitle.endTime,
              startTime: loopSubtitle.startTime,
              text: loopSubtitle.text
            })

            lastLoopTimeRef.current = now
            seekTo(loopSubtitle.startTime)
          }
        }
      } else {
        // 初始化循环状态 / Initialize loop state
        const currentIndex = getCurrentSubtitleIndex()
        const currentSubtitle = subtitleItemsRef.current?.[currentIndex]

        if (currentIndex >= 0 && currentSubtitle) {
          singleLoopSubtitleRef.current = currentSubtitle
          currentSubtitleIndexRef.current = currentIndex

          // 为指定次数循环模式初始化剩余次数 / Initialize remaining count for count loop mode
          if (loopSettings.count >= 2) {
            setRemainingCount(loopSettings.count)
          }

          console.log('🔄 循环：自动锁定当前字幕', {
            index: currentIndex,
            text: currentSubtitle.text,
            startTime: currentSubtitle.startTime,
            endTime: currentSubtitle.endTime,
            count: loopSettings.count,
            initialCount: loopSettings.count >= 2 ? loopSettings.count : 0
          })
        }
      }
    }

    const unsubscribe = subscribeToTime(handleTimeUpdate)
    return unsubscribe
  }, [
    isSingleLoop,
    loopSettings,
    fileId,
    setIsSingleLoop,
    remainingCount,
    seekTo,
    subscribeToTime,
    getCurrentSubtitleIndex,
    subtitleItemsRef,
    isVideoLoadedRef,
    isPlayingRef
  ])

  // 根据变体类型选择样式 / Choose styles based on variant type
  const getButtonStyles = (): React.CSSProperties => {
    const isActive = isSingleLoop

    if (variant === 'fullscreen') {
      // 全屏模式使用主题系统样式 / Fullscreen mode uses theme system styles
      return {
        ...styles.fullscreenControlBtn,
        ...(isActive ? styles.fullscreenControlBtnActive : {})
      }
    }

    // 默认紧凑模式样式 / Default compact mode styles
    return {
      ...styles.controlBtn,
      ...(isActive ? styles.controlBtnActive : {})
    }
  }

  // 获取按钮的CSS类名 / Get button CSS class name
  const getButtonClassName = (): string => {
    // 不再需要处理 className 和 active 类名，完全依赖主题系统
    return ''
  }

  // 获取提示文本 / Get tooltip text
  const getTooltipTitle = (): string => {
    if (!isSingleLoop) {
      return '开启循环播放'
    } else {
      const loopType = loopSettings.count === -1 ? '无限循环' : `${loopSettings.count}次循环`
      return `关闭循环播放 (当前: ${loopType})`
    }
  }

  RendererLogger.info('LoopToggleButton', {
    isSingleLoop: isSingleLoop,
    loopCount: loopSettings.count,
    remainingCount: remainingCount,
    isVideoLoaded,
    variant,
    isPlaying: isPlayingRef.current,
    currentTime: currentTimeRef.current,
    subtitleItems: subtitleItemsRef.current
  })

  // 创建菜单项 / Create menu items
  const menuItems = [
    {
      key: 'count-title',
      label: '设置循环次数',
      disabled: true
    },
    {
      key: 'infinite',
      label: `无限循环${loopSettings.count === -1 ? ' ✓' : ''}`,
      onClick: () => {
        handleCountChange(-1)
        setIsMenuOpen(false)
      }
    },
    { type: 'divider' as const },
    ...[2, 3, 5, 10].map((count) => ({
      key: `preset-${count}`,
      label: `${count} 次${loopSettings.count === count ? ' ✓' : ''}`,
      onClick: () => {
        handleCountChange(count)
        setIsMenuOpen(false)
      }
    })),
    { type: 'divider' as const },
    {
      key: 'custom',
      label: '自定义次数...',
      onClick: () => {
        setIsMenuOpen(false)
        setIsCustomModalOpen(true)
      }
    }
  ]

  return (
    <>
      <Dropdown
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        trigger={['contextMenu']}
        menu={{ items: menuItems }}
        placement="topLeft"
      >
        <Tooltip title={getTooltipTitle()}>
          <Button
            icon={
              <LoopIcon
                remainingCount={remainingCount}
                isActive={isSingleLoop}
                variant={variant}
                isSingleLoop={isSingleLoop}
                count={loopSettings.count}
              />
            }
            onClick={(e) => {
              handleLoopToggle()
              e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
            }}
            onContextMenu={handleContextMenu}
            type="text"
            style={getButtonStyles()}
            className={getButtonClassName()}
            disabled={!isVideoLoaded}
            size="small"
          />
        </Tooltip>
      </Dropdown>

      <CustomLoopCountModal
        open={isCustomModalOpen}
        currentCount={loopSettings.count}
        onConfirm={(count) => {
          handleCountChange(count)
          setIsCustomModalOpen(false)
        }}
        onCancel={() => setIsCustomModalOpen(false)}
      />
    </>
  )
}
