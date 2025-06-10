import { useState, useCallback } from 'react'
import { useVideoControls, useVideoPlayState } from '@renderer/hooks/useVideoPlayerHooks'
import { useUIStore } from '@renderer/stores'
import type {
  WordInteractionState,
  WordInteractionHandlers,
  UseWordInteractionEventsProps
} from '../types'

/**
 * Custom hook for handling word interaction events
 * 处理单词交互事件的自定义 hook
 */
export const useWordInteractionEvents = ({
  onWordHover
}: UseWordInteractionEventsProps): WordInteractionState & WordInteractionHandlers => {
  // Get UI store state for auto resume setting / 获取UI store状态用于自动恢复设置
  const { autoResumeAfterWordCard } = useUIStore()

  // Internal video control functionality / 内聚视频控制功能
  const { toggle } = useVideoControls()
  const isPlaying = useVideoPlayState()

  // Local state / 本地状态
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)

  // Track if paused due to word card / 跟踪是否因为单词卡片而暂停
  const [isPausedByWordCard, setIsPausedByWordCard] = useState(false)

  /**
   * Handle word hover events
   * 处理单词悬停事件
   */
  const handleWordHover = useCallback(
    (isHovering: boolean): void => {
      // Call external callback (if provided) for controls display / 调用外部回调（如果提供）用于控制栏显示
      onWordHover?.(isHovering)

      // Don't pause on hover, only update hover state / 悬停时不暂停，只更新悬停状态
      console.log(`Word hover: ${isHovering}`)
    },
    [onWordHover]
  )

  /**
   * Handle word click events - pause video and show word card
   * 处理单词点击事件 - 暂停视频并显示单词卡片
   */
  const handleWordClick = useCallback(
    (word: string, event: React.MouseEvent): void => {
      event.stopPropagation()
      event.preventDefault()

      const trimmedWord = word.trim()
      if (trimmedWord === '') {
        return
      }

      const wordElement = event.target as HTMLElement
      setSelectedWord({
        word: trimmedWord,
        element: wordElement
      })

      // Internal video pause logic - pause video when showing word card / 内聚视频暂停逻辑 - 显示单词卡片时暂停视频
      if (isPlaying) {
        console.log(
          '内部处理：显示单词卡片时暂停视频 / Internal handling: Pause video when showing word card'
        )
        toggle()
        setIsPausedByWordCard(true)
      }
    },
    [isPlaying, toggle]
  )

  /**
   * Check if an element is a clickable word element
   * 检查元素是否为可点击的单词元素
   */
  const isWordElement = useCallback((element: HTMLElement): boolean => {
    if (element.classList.contains('subtitleWord') || element.classList.contains('clickableWord')) {
      return true
    }

    let parent = element.parentElement
    let depth = 0
    while (parent && depth < 3) {
      if (parent.classList.contains('subtitleWord') || parent.classList.contains('clickableWord')) {
        return true
      }
      parent = parent.parentElement
      depth++
    }
    return false
  }, [])

  /**
   * Handle word card close - optionally resume video based on settings
   * 处理单词卡片关闭 - 根据设置决定是否恢复视频播放
   */
  const handleCloseWordCard = useCallback((): void => {
    setSelectedWord(null)

    // Internal video resume logic - resume based on settings when word card is closed / 内聚视频恢复逻辑 - 根据设置决定是否在关闭单词卡片时恢复播放
    if (isPausedByWordCard && autoResumeAfterWordCard) {
      console.log(
        '内部处理：关闭单词卡片时恢复播放 / Internal handling: Resume playback when word card is closed'
      )
      toggle()
      setIsPausedByWordCard(false)
    } else {
      // Reset pause state even if not resuming playback / 即使不恢复播放，也要重置暂停状态
      setIsPausedByWordCard(false)
      console.log(
        '不自动恢复播放（根据用户设置）/ Do not auto-resume playback (based on user setting)'
      )
    }
  }, [isPausedByWordCard, autoResumeAfterWordCard, toggle])

  return {
    // State / 状态
    selectedWord,
    isPausedByWordCard,

    // Handlers / 处理器
    handleWordHover,
    handleWordClick,
    handleCloseWordCard,
    isWordElement
  }
}
