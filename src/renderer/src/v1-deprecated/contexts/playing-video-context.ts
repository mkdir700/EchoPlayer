import type { VideoFileState } from '@renderer/types'
import { createContext } from 'react'

// * 播放视频上下文类型
// * 包含视频文件的本地路径、文件名、文件对象、是否是本地文件、视频文件上传、视频文件选择、视频文件清除、视频文件设置、视频文件恢复
export interface IPlayingVideoContextType extends VideoFileState {
  fileId: string
  isLocalFile: boolean
  originalFilePath?: string
  displayAspectRatio: number
  clearVideoFile: () => void
  setVideoFile: (fileId: string, url: string, fileName: string, filePath?: string) => void
  handleVideoFileSelect: (
    resetVideoState?: () => void
  ) => Promise<{ success: boolean; filePath?: string; fileName?: string }>
  handleVideoUpload: (file: File, resetVideoState?: () => void) => boolean
}

export const PlayingVideoContext = createContext<IPlayingVideoContextType | null>(null)
