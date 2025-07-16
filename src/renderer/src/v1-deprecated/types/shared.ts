// SubtitleItem 已移动到 src/types/shared.ts 中统一定义

import { useCallback } from 'react'

export interface VideoState {
  videoFilePath: string
  videoFileName: string
  currentTime: number
}

/**
 * 通用的 React useCallback 回调函数类型
 * @template T 函数签名类型
 */
export type ReactCallback<T extends (...args: never[]) => unknown = () => void> = ReturnType<
  typeof useCallback<T>
>
