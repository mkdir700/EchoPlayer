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
 * 提供划词选中功能，避免与拖拽功能冲突
 * Provides text selection functionality while avoiding conflicts with drag functionality
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

  // 鼠标按下计时器，用于区分点击和拖拽 / Mouse down timer to distinguish click from drag
  const mouseDownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mouseDownPositionRef = useRef<{ x: number; y: number } | null>(null)

  // 选择阈值配置 / Selection threshold configuration
  const SELECTION_THRESHOLD = {
    TIME_MS: 150, // 按住时间阈值（毫秒）/ Hold time threshold (ms)
    DISTANCE_PX: 5 // 移动距离阈值（像素）/ Movement distance threshold (px)
  }

  // 清除选择 / Clear selection
  const clearSelection = useCallback(() => {
    setSelectionState({
      isSelecting: false,
      selectionRange: null,
      selectedText: ''
    })
    selectionStartRef.current = null
    mouseDownPositionRef.current = null

    if (mouseDownTimerRef.current) {
      clearTimeout(mouseDownTimerRef.current)
      mouseDownTimerRef.current = null
    }

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

      if (mouseDownTimerRef.current) {
        clearTimeout(mouseDownTimerRef.current)
        mouseDownTimerRef.current = null
      }

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

      // 记录鼠标按下位置和时间 / Record mouse down position and time
      mouseDownPositionRef.current = { x: e.clientX, y: e.clientY }
      selectionStartRef.current = { wordIndex, charIndex }

      // 设置计时器，延迟启动选择模式 / Set timer to delay selection mode activation
      mouseDownTimerRef.current = setTimeout(() => {
        // 检查鼠标是否还在按下状态 / Check if mouse is still down
        if (selectionStartRef.current) {
          setSelectionState((prev) => ({
            ...prev,
            isSelecting: true
          }))
        }
      }, SELECTION_THRESHOLD.TIME_MS)

      // 阻止默认的文本选择行为 / Prevent default text selection behavior
      e.preventDefault()
    }
  }, [])

  // 处理单词鼠标进入 / Handle word mouse enter
  const handleWordMouseEnter = useCallback(
    (wordIndex: number, charIndex?: number) => {
      if (!selectionStartRef.current || !selectionState.isSelecting) return

      const range: SelectionRange = {
        startWordIndex: selectionStartRef.current.wordIndex,
        endWordIndex: wordIndex,
        startCharIndex: selectionStartRef.current.charIndex,
        endCharIndex: charIndex
      }

      updateSelectionRange(range)
    },
    [selectionState.isSelecting, updateSelectionRange]
  )

  // 处理鼠标抬起 / Handle mouse up
  const handleWordMouseUp = useCallback(() => {
    // 清除计时器 / Clear timer
    if (mouseDownTimerRef.current) {
      clearTimeout(mouseDownTimerRef.current)
      mouseDownTimerRef.current = null
    }

    // 如果没有进入选择模式，清除选择 / If not in selection mode, clear selection
    if (!selectionState.isSelecting) {
      clearSelection()
    }

    selectionStartRef.current = null
    mouseDownPositionRef.current = null
  }, [selectionState.isSelecting, clearSelection])

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
    const handleGlobalMouseMove = (e: MouseEvent): void => {
      // 检查鼠标移动距离，如果超过阈值则可能是拖拽 / Check mouse movement distance for potential drag
      if (mouseDownPositionRef.current && selectionStartRef.current) {
        const distance = Math.sqrt(
          Math.pow(e.clientX - mouseDownPositionRef.current.x, 2) +
            Math.pow(e.clientY - mouseDownPositionRef.current.y, 2)
        )

        // 如果移动距离超过阈值，取消选择模式 / Cancel selection mode if movement exceeds threshold
        if (distance > SELECTION_THRESHOLD.DISTANCE_PX && !selectionState.isSelecting) {
          if (mouseDownTimerRef.current) {
            clearTimeout(mouseDownTimerRef.current)
            mouseDownTimerRef.current = null
          }
          selectionStartRef.current = null
          mouseDownPositionRef.current = null
        }
      }
    }

    const handleGlobalMouseUp = (): void => {
      handleWordMouseUp()
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [selectionState.isSelecting, handleWordMouseUp])

  // 清理计时器 / Cleanup timer
  useEffect(() => {
    return () => {
      if (mouseDownTimerRef.current) {
        clearTimeout(mouseDownTimerRef.current)
      }
    }
  }, [])

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
