import { createContext } from 'react'
import { UseSubtitleListReturn } from '@renderer/hooks/useSubtitleList'

// * 字幕列表上下文类型
export interface ISubtitleListContextType extends UseSubtitleListReturn {}

export const SubtitleListContext = createContext<ISubtitleListContextType | null>(null)
