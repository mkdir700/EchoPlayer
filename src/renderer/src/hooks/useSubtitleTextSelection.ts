import { useState, useCallback, useRef, useEffect } from 'react'

// 选中范围接口 / Selection range interface
interface SelectionRange {
  startWordIndex: number
  endWordIndex: number
  startCharIndex?: number
  endCharIndex?: number
}

// 选中状态接口 / Selection state interface
interface SelectionState {
  isSelecting: boolean
  selectionRange: SelectionRange | null
  selectedText: string
}

// Hook 返回值接口 / Hook return interface
interface UseSubtitleTextSelectionReturn {
  selectionState: SelectionState
  handleWordMouseDown: (wordIndex: number, charIndex?: number) => (e: React.MouseEvent) => void
  handleWordMouseEnter: (wordIndex: number, charIndex?: number) => void
  handleWordMouseUp: () => void
  clearSelection: () => void
  isWordSelected: (wordIndex: number) => boolean
  isWordPartiallySelected: (wordIndex: number, charIndex?: number) => boolean
}

/**
 * 字幕文本选择 Hook / Subtitle text selection hook
 *
 * 提供划词选中功能，当用户按下鼠标并移动到另一个span时自动激活选择模式
 * Provides text selection functionality that activates when user drags from one span to another
 *
 * @param words - 单词数组 / Array of words
 * @param onSelectionChange - 选择变化回调 / Selection change callback
 */
export const useSubtitleTextSelection = (
  words: string[],
  onSelectionChange?: (selectedText: string, range: SelectionRange | null) => void
): UseSubtitleTextSelectionReturn => {
  // 选中状态 / Selection state
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelecting: false,
    selectionRange: null,
    selectedText: ''
  })

  // 选择开始位置 / Selection start position
  const selectionStartRef = useRef<{ wordIndex: number; charIndex?: number } | null>(null)

  // 鼠标按下状态跟踪 / Mouse down state tracking
  const mouseDownPositionRef = useRef<{ x: number; y: number } | null>(null)
  const isMouseDownRef = useRef<boolean>(false)

  // 清除选择 / Clear selection
  const clearSelection = useCallback(() => {
    setSelectionState({
      isSelecting: false,
      selectionRange: null,
      selectedText: ''
    })
    selectionStartRef.current = null
    mouseDownPositionRef.current = null
    isMouseDownRef.current = false

    onSelectionChange?.('', null)
  }, [onSelectionChange])

  // 监听单词数组变化，自动重置选择状态 / Monitor words array changes and auto-reset selection
  const wordsStringRef = useRef<string>('')
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    const currentWordsString = words.join('|')

    // 跳过首次渲染，只在后续变化时重置 / Skip first render, only reset on subsequent changes
    if (!isFirstRenderRef.current && wordsStringRef.current !== currentWordsString) {
      // 单词数组发生变化（字幕切换），立即清除选择状态 / Words array changed (subtitle switched), immediately clear selection
      setSelectionState({
        isSelecting: false,
        selectionRange: null,
        selectedText: ''
      })
      selectionStartRef.current = null
      mouseDownPositionRef.current = null
      isMouseDownRef.current = false

      // 通知选择变化 / Notify selection change
      onSelectionChange?.('', null)
    }

    wordsStringRef.current = currentWordsString
    isFirstRenderRef.current = false
  }, [words, onSelectionChange])

  // 计算选中的文本 / Calculate selected text
  const calculateSelectedText = useCallback(
    (range: SelectionRange): string => {
      if (!range) return ''

      const { startWordIndex, endWordIndex, startCharIndex, endCharIndex } = range
      const start = Math.min(startWordIndex, endWordIndex)
      const end = Math.max(startWordIndex, endWordIndex)

      if (start === end) {
        // 同一个单词内的选择 / Selection within the same word
        const word = words[start]
        if (typeof startCharIndex === 'number' && typeof endCharIndex === 'number') {
          const charStart = Math.min(startCharIndex, endCharIndex)
          const charEnd = Math.max(startCharIndex, endCharIndex)
          return word.slice(charStart, charEnd + 1)
        }
        return word
      }

      // 跨单词选择 / Cross-word selection
      let selectedText = ''
      for (let i = start; i <= end; i++) {
        if (i === start && typeof startCharIndex === 'number') {
          selectedText += words[i].slice(startCharIndex)
        } else if (i === end && typeof endCharIndex === 'number') {
          selectedText += words[i].slice(0, endCharIndex + 1)
        } else {
          selectedText += words[i]
        }

        // 在单词之间添加空格（除了最后一个单词）/ Add space between words (except last word)
        if (i < end) {
          selectedText += ' '
        }
      }

      return selectedText
    },
    [words]
  )

  // 更新选择范围 / Update selection range
  const updateSelectionRange = useCallback(
    (range: SelectionRange) => {
      const selectedText = calculateSelectedText(range)

      setSelectionState({
        isSelecting: true,
        selectionRange: range,
        selectedText
      })

      onSelectionChange?.(selectedText, range)
    },
    [calculateSelectedText, onSelectionChange]
  )

  // 处理单词鼠标按下 / Handle word mouse down
  const handleWordMouseDown = useCallback((wordIndex: number, charIndex?: number) => {
    return (e: React.MouseEvent) => {
      // 只处理左键 / Only handle left mouse button
      if (e.button !== 0) return

      // 记录鼠标按下位置和起始单词索引 / Record mouse down position and starting word index
      mouseDownPositionRef.current = { x: e.clientX, y: e.clientY }
      selectionStartRef.current = { wordIndex, charIndex }
      isMouseDownRef.current = true

      // 阻止默认的文本选择行为 / Prevent default text selection behavior
      e.preventDefault()
    }
  }, [])

  // 处理单词鼠标进入 / Handle word mouse enter
  const handleWordMouseEnter = useCallback(
    (wordIndex: number, charIndex?: number) => {
      // 只有在鼠标按下状态且有起始位置时才处理 / Only handle when mouse is down and has start position
      if (!isMouseDownRef.current || !selectionStartRef.current) return

      const startWordIndex = selectionStartRef.current.wordIndex

      // 检查是否移动到了不同的单词/字符 / Check if moved to different word/character
      const hasMoved =
        wordIndex !== startWordIndex ||
        (typeof charIndex === 'number' &&
          typeof selectionStartRef.current.charIndex === 'number' &&
          charIndex !== selectionStartRef.current.charIndex)

      if (hasMoved) {
        // 移动到了不同的span，激活选择模式 / Moved to different span, activate selection mode
        const range: SelectionRange = {
          startWordIndex: selectionStartRef.current.wordIndex,
          endWordIndex: wordIndex,
          startCharIndex: selectionStartRef.current.charIndex,
          endCharIndex: charIndex
        }

        updateSelectionRange(range)
      }
    },
    [updateSelectionRange]
  )

  // 处理鼠标抬起 / Handle mouse up
  const handleWordMouseUp = useCallback(() => {
    // 如果没有进入选择模式，说明是单纯的点击 / If not in selection mode, it's a simple click
    if (!selectionState.isSelecting && selectionStartRef.current) {
      // 这里可以触发单词点击事件，但由于我们在WordWrapper中已经处理了，这里不需要额外操作
      // Word click event can be triggered here, but it's already handled in WordWrapper
    }

    // 重置状态 / Reset state
    selectionStartRef.current = null
    mouseDownPositionRef.current = null
    isMouseDownRef.current = false
  }, [selectionState.isSelecting])

  // 检查单词是否被选中 / Check if word is selected
  const isWordSelected = useCallback(
    (wordIndex: number): boolean => {
      if (!selectionState.selectionRange) return false

      const { startWordIndex, endWordIndex } = selectionState.selectionRange
      const start = Math.min(startWordIndex, endWordIndex)
      const end = Math.max(startWordIndex, endWordIndex)

      return wordIndex >= start && wordIndex <= end
    },
    [selectionState.selectionRange]
  )

  // 检查单词是否部分被选中 / Check if word is partially selected
  const isWordPartiallySelected = useCallback(
    (wordIndex: number, charIndex?: number): boolean => {
      if (!selectionState.selectionRange) return false

      const { startWordIndex, endWordIndex, startCharIndex, endCharIndex } =
        selectionState.selectionRange

      // 如果是边界单词且有字符索引，检查部分选择 / If boundary word with char index, check partial selection
      if (
        wordIndex === startWordIndex &&
        typeof startCharIndex === 'number' &&
        typeof charIndex === 'number'
      ) {
        return charIndex >= startCharIndex
      }

      if (
        wordIndex === endWordIndex &&
        typeof endCharIndex === 'number' &&
        typeof charIndex === 'number'
      ) {
        return charIndex <= endCharIndex
      }

      return isWordSelected(wordIndex)
    },
    [selectionState.selectionRange, isWordSelected]
  )

  // 监听全局鼠标事件 / Listen to global mouse events
  useEffect(() => {
    const handleGlobalMouseUp = (): void => {
      handleWordMouseUp()
    }

    // 监听全局点击事件，点击其他区域时清除选择状态 / Listen to global click events, clear selection when clicking outside
    const handleGlobalClick = (e: MouseEvent): void => {
      // 如果当前处于划词状态，检查点击是否在字幕区域外 / If in selection mode, check if click is outside subtitle area
      if (selectionState.isSelecting) {
        const target = e.target as Element

        // 检查点击目标是否在字幕相关元素内 / Check if click target is within subtitle-related elements
        const isClickInSubtitle =
          target?.closest('[data-subtitle-container]') ||
          target?.closest('[data-word-wrapper]') ||
          target?.closest('.subtitle-word') ||
          target?.closest('.word-wrapper') ||
          target?.closest('.clickableWord') ||
          target?.classList?.contains('subtitle-word') ||
          target?.classList?.contains('clickableWord') ||
          target?.classList?.contains('word-wrapper')

        // 如果点击在字幕区域外，清除选择状态 / If click is outside subtitle area, clear selection
        if (!isClickInSubtitle) {
          clearSelection()
        }
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('click', handleGlobalClick, true) // 使用捕获模式确保优先处理 / Use capture mode for priority handling

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('click', handleGlobalClick, true)
    }
  }, [handleWordMouseUp, selectionState.isSelecting, clearSelection])

  return {
    selectionState,
    handleWordMouseDown,
    handleWordMouseEnter,
    handleWordMouseUp,
    clearSelection,
    isWordSelected,
    isWordPartiallySelected
  }
}
