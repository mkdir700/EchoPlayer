// 重新导出优化后的字幕控制 hook
// 新的实现使用 Context 模式，避免多次调用时的冲突问题
import {
  SubtitleControlContext,
  SubtitleControlContextType
} from '@renderer/contexts/SubtitleControlContext'
import { useContext } from 'react'

export function useSubtitleControl(): SubtitleControlContextType {
  const context = useContext(SubtitleControlContext)
  if (!context) {
    throw new Error('useSubtitleControl 必须在 SubtitleControlProvider 内部使用')
  }
  return context
}
