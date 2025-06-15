import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Button, Tooltip, Dropdown } from 'antd'
import { useTheme } from '@renderer/hooks/useTheme'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useLoopSettings, useSetLoopSettings } from '@renderer/stores/slices/videoConfigStore'
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

  // 使用 useMemo 优化默认值逻辑 / Use useMemo to optimize default value logic
  const loopSettings = useMemo(() => {
    return rawLoopSettings || { mode: 'off', count: 3 }
  }, [rawLoopSettings])

  // 运行时状态：剩余循环次数（不持久化）/ Runtime state: remaining count (not persisted)
  const [remainingCount, setRemainingCount] = useState<number>(0)

  // 右键菜单状态 / Right-click menu state
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  // 自定义次数模态框状态 / Custom count modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false)

  // 同步循环模式变化时的剩余次数 / Sync remaining count when loop mode changes
  useEffect(() => {
    if (loopSettings.mode === 'count') {
      setRemainingCount(loopSettings.count)
    } else {
      setRemainingCount(0)
    }
  }, [loopSettings.mode, loopSettings.count])

  // 单句循环相关状态
  const { currentTimeRef, isPlayingRef, isVideoLoadedRef, subscribeToTime } =
    useVideoPlayerContext()
  const { subtitleItemsRef } = useSubtitleListContext()
  const { seekTo } = useVideoControls()

  // 循环模式切换逻辑 / Loop mode toggle logic
  const handleLoopToggle = useCallback(() => {
    if (!fileId) return

    const currentMode = loopSettings.mode
    let newSettings: LoopSettings

    switch (currentMode) {
      case 'off':
        // 从关闭切换到单句循环 / Switch from off to single loop
        newSettings = {
          mode: 'single',
          count: loopSettings.count
        }
        setRemainingCount(0) // 单句循环不需要计数
        break
      case 'single':
        // 从单句循环切换到指定次数循环 / Switch from single to count loop
        newSettings = {
          mode: 'count',
          count: loopSettings.count
        }
        setRemainingCount(loopSettings.count) // 初始化剩余次数
        break
      case 'count':
        // 从指定次数循环切换到关闭 / Switch from count loop to off
        newSettings = {
          mode: 'off',
          count: loopSettings.count
        }
        setRemainingCount(0) // 重置计数
        break
      default:
        newSettings = { mode: 'off', count: 3 }
        setRemainingCount(0)
    }

    setLoopSettings(fileId, newSettings)
    console.log(
      '🔄 循环模式切换:',
      currentMode,
      '=>',
      newSettings.mode,
      '剩余次数:',
      remainingCount
    )
  }, [fileId, loopSettings, setLoopSettings, remainingCount])

  // 处理循环次数设置 / Handle loop count setting
  const handleCountChange = useCallback(
    (count: number) => {
      if (!fileId) return

      const newSettings: LoopSettings = {
        ...loopSettings,
        count
      }

      setLoopSettings(fileId, newSettings)

      // 如果当前是指定次数循环模式，更新剩余次数 / If currently in count mode, update remaining count
      if (loopSettings.mode === 'count') {
        setRemainingCount(count)
      }

      console.log('🔄 循环次数设置:', count)
    },
    [fileId, loopSettings, setLoopSettings]
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
    const isLooping = loopSettings.mode !== 'off'
    console.log(
      '🔄 LoopToggleButton useEffect 触发: mode =',
      loopSettings.mode,
      'isLooping =',
      isLooping
    )

    if (!isLooping) {
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
      if (!isLooping || !isVideoLoadedRef.current || !isPlayingRef.current || !fileId) {
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
          if (loopSettings.mode === 'count' && remainingCount > 1) {
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
          if (loopSettings.mode === 'count' && remainingCount <= 1) {
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
              setLoopSettings(fileId, {
                ...loopSettings,
                mode: 'off'
              })
              setRemainingCount(0)
              singleLoopSubtitleRef.current = null
              currentSubtitleIndexRef.current = -1
              console.log('🔄 已到达最后一句字幕，自动关闭循环')
              return
            }
          }

          // 单句无限循环模式 / Single sentence infinite loop mode
          if (loopSettings.mode === 'single') {
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
          if (loopSettings.mode === 'count') {
            setRemainingCount(loopSettings.count)
          }

          console.log('🔄 循环：自动锁定当前字幕', {
            index: currentIndex,
            text: currentSubtitle.text,
            startTime: currentSubtitle.startTime,
            endTime: currentSubtitle.endTime,
            mode: loopSettings.mode,
            initialCount: loopSettings.mode === 'count' ? loopSettings.count : 0
          })
        }
      }
    }

    const unsubscribe = subscribeToTime(handleTimeUpdate)
    return unsubscribe
  }, [
    loopSettings,
    fileId,
    setLoopSettings,
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
    const isActive = loopSettings.mode !== 'off'

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
    switch (loopSettings.mode) {
      case 'off':
        return '开启单句循环'
      case 'single':
        return '切换到指定次数循环'
      case 'count':
        return '关闭循环播放'
      default:
        return '循环播放'
    }
  }

  RendererLogger.info('LoopToggleButton', {
    loopMode: loopSettings.mode,
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
      key: 'title',
      label: '设置循环次数',
      disabled: true
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
                mode={loopSettings.mode}
                remainingCount={remainingCount}
                isActive={loopSettings.mode !== 'off'}
                variant={variant}
              />
            }
            onClick={(e) => {
              console.log('🔄 点击循环按钮，当前模式:', loopSettings.mode)
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
