import { UseSubtitleListReturn } from '@renderer/hooks/features/subtitle/useSubtitleList'
import { createContext } from 'react'

// * 字幕列表上下文类型
export interface ISubtitleListContextType extends UseSubtitleListReturn {}

export const SubtitleListContext = createContext<ISubtitleListContextType | null>(null)
