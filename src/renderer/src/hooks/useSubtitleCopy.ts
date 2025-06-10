import { useCallback, useEffect, useRef } from 'react'
import { useCurrentSubtitleDisplayContext } from './useCurrentSubtitleDisplayContext'
import { useSubtitleDisplayModeControls } from './useSubtitleDisplayMode'
import { RendererLogger } from '@renderer/utils/logger'

interface UseSubtitleCopyOptions {
  /** 当前选中的文本 */
  selectedText?: string
  /** 是否启用复制功能 */
  enabled?: boolean
  /** 复制成功回调 */
  onCopySuccess?: (text: string) => void
}

interface UseSubtitleCopyReturn {
  /** 复制选中文本或当前字幕 */
  copySubtitle: () => Promise<void>
  /** 手动复制指定文本 */
  copyText: (text: string) => Promise<void>
}

/**
 * 字幕复制功能 Hook / Subtitle copy functionality hook
 *
 * 提供键盘快捷键复制功能：
 * - 如果有选中文本，复制选中内容
 * - 如果没有选中文本，复制当前原文字幕
 *
 * Provides keyboard shortcut copy functionality:
 * - If text is selected, copy selected content
 * - If no text is selected, copy current original subtitle
 */
export const useSubtitleCopy = (options: UseSubtitleCopyOptions = {}): UseSubtitleCopyReturn => {
  const { selectedText, enabled = true, onCopySuccess } = options
  const { currentDisplaySubtitle } = useCurrentSubtitleDisplayContext()
  const { displayMode } = useSubtitleDisplayModeControls()

  // 防抖处理，避免重复触发 / Debounce to prevent duplicate triggers
  const lastCopyTimeRef = useRef<number>(0)
  const COPY_DEBOUNCE_MS = 200

  /**
   * 复制文本到剪贴板 / Copy text to clipboard
   */
  const copyText = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) {
      RendererLogger.warn('📋 复制失败：文本为空')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      RendererLogger.info('📋 复制成功:', { text: text.substring(0, 50) + '...' })

      // 触发复制成功回调 / Trigger copy success callback
      onCopySuccess?.(text)
    } catch (error) {
      RendererLogger.error('📋 复制失败:', error)

      // 降级方案：使用传统的复制方法
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        RendererLogger.info('📋 降级复制成功:', { text: text.substring(0, 50) + '...' })

        // 降级方案也触发成功回调 / Trigger success callback for fallback method too
        onCopySuccess?.(text)
      } catch (fallbackError) {
        RendererLogger.error('📋 降级复制也失败:', fallbackError)
      }
    }
  }, [])

  /**
   * 获取要复制的原文文本 / Get original text to copy
   */
  const getOriginalText = useCallback((): string => {
    if (!currentDisplaySubtitle) {
      return ''
    }

    // 根据显示模式确定原文内容 / Determine original content based on display mode
    switch (displayMode) {
      case 'original':
        return currentDisplaySubtitle.text
      case 'english':
        return currentDisplaySubtitle.englishText || currentDisplaySubtitle.text
      case 'chinese':
        // 中文模式下，原文应该是英文或原始文本 / In Chinese mode, original should be English or original text
        return currentDisplaySubtitle.englishText || currentDisplaySubtitle.text
      case 'bilingual':
        // 双语模式下，优先复制英文，其次是原始文本 / In bilingual mode, prefer English, then original text
        return currentDisplaySubtitle.englishText || currentDisplaySubtitle.text
      case 'none':
        return ''
      default:
        return currentDisplaySubtitle.text
    }
  }, [currentDisplaySubtitle, displayMode])

  /**
   * 复制选中文本或当前字幕 / Copy selected text or current subtitle
   */
  const copySubtitle = useCallback(async (): Promise<void> => {
    const now = Date.now()
    if (now - lastCopyTimeRef.current < COPY_DEBOUNCE_MS) {
      return
    }
    lastCopyTimeRef.current = now

    let textToCopy = ''

    // 优先复制选中文本 / Prioritize selected text
    if (selectedText && selectedText.trim()) {
      textToCopy = selectedText.trim()
      RendererLogger.debug('📋 复制选中文本:', {
        selectedText: textToCopy.substring(0, 30) + '...'
      })
    } else {
      // 没有选中文本时，复制当前原文字幕 / Copy current original subtitle when no text is selected
      textToCopy = getOriginalText()
      RendererLogger.debug('📋 复制当前原文字幕:', {
        originalText: textToCopy.substring(0, 30) + '...',
        displayMode
      })
    }

    if (textToCopy) {
      await copyText(textToCopy)
    } else {
      RendererLogger.warn('📋 没有可复制的内容')
    }
  }, [selectedText, getOriginalText, copyText, displayMode])

  /**
   * 监听键盘事件 / Listen to keyboard events
   */
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      // 检查是否按下了 'c' 键（不区分大小写）/ Check if 'c' key is pressed (case insensitive)
      if (
        event.key.toLowerCase() === 'c' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        // 检查焦点是否在输入框中 / Check if focus is in input field
        const activeElement = document.activeElement
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            (activeElement as HTMLElement).contentEditable === 'true')
        ) {
          return // 在输入框中时不处理 / Don't handle when in input field
        }

        event.preventDefault()
        copySubtitle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, copySubtitle])

  return {
    copySubtitle,
    copyText
  }
}
