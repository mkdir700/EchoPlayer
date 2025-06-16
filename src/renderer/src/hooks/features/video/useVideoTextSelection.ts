import { useState, useCallback } from 'react'
import { useSubtitleCopy } from '@renderer/hooks/features/subtitle/useSubtitleCopy'
import { useCopySuccessToast } from '@renderer/hooks/utils/useCopySuccessToast'

interface UseVideoTextSelectionReturn {
  selectedText: string
  handleSelectionChange: (selectedText: string) => void
  toastState: {
    visible: boolean
    position: { x: number; y: number }
    copiedText: string
  }
  hideCopySuccess: () => void
}

/**
 * 视频文本选择功能的内聚 Hook
 * Video text selection functionality cohesion hook
 *
 * 管理文本选择和复制功能，包括：
 * - 选中文本状态管理
 * - 复制功能集成
 * - 复制成功提示
 */
export const useVideoTextSelection = (): UseVideoTextSelectionReturn => {
  // 选中文本状态
  const [selectedText, setSelectedText] = useState<string>('')

  // 复制成功提示管理
  const { toastState, showCopySuccess, hideCopySuccess } = useCopySuccessToast()

  // 字幕复制功能集成
  useSubtitleCopy({
    selectedText,
    enabled: true,
    onCopySuccess: showCopySuccess
  })

  // 处理文本选择变化
  const handleSelectionChange = useCallback((selectedText: string) => {
    setSelectedText(selectedText)
    if (selectedText) {
      console.log('选中的文本 / Selected text:', selectedText)
      // 这里可以添加更多的处理逻辑，比如显示翻译等
      // Additional logic can be added here, such as showing translation, etc.
    }
  }, [])

  return {
    selectedText,
    handleSelectionChange,
    toastState,
    hideCopySuccess
  }
}
