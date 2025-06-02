import { useState, useCallback } from 'react'
import { message } from 'antd'
import { parseSubtitles } from '../utils/subtitleParser'
import { SubtitleItem } from '@types_/shared'

interface SubtitleFileState {
  subtitleFilePath?: string
  subtitleFileName?: string
  subtitleContent?: string
}

interface UseSubtitleFileReturn extends SubtitleFileState {
  handleSubtitleUpload: (file: File) => Promise<SubtitleItem[]>
  restoreSubtitleFile: (filePath: string, fileName: string) => Promise<SubtitleItem[] | null>
  clearSubtitleFile: () => void
  saveSubtitleFile: (subtitles: SubtitleItem[], fileName?: string) => Promise<boolean>
}

export function useSubtitleFile(): UseSubtitleFileReturn {
  const [state, setState] = useState<SubtitleFileState>({})

  // 字幕文件上传处理
  const handleSubtitleUpload = useCallback(async (file: File): Promise<SubtitleItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e): void => {
        try {
          const content = e.target?.result as string
          const parsedSubtitles = parseSubtitles(content, file.name)

          setState({
            subtitleFileName: file.name,
            subtitleContent: content
          })

          message.success({
            content: `字幕文件 ${file.name} 已导入，共 ${parsedSubtitles.length} 条字幕`
          })

          resolve(parsedSubtitles)
        } catch (error) {
          const errorMessage = `字幕文件解析失败: ${(error as Error).message}`
          message.error({ content: errorMessage })
          reject(new Error(errorMessage))
        }
      }

      reader.onerror = (): void => {
        const errorMessage = '读取字幕文件失败'
        message.error({ content: errorMessage })
        reject(new Error(errorMessage))
      }

      reader.readAsText(file)
    })
  }, [])

  // 恢复字幕文件
  const restoreSubtitleFile = useCallback(
    async (filePath: string, fileName: string): Promise<SubtitleItem[] | null> => {
      try {
        console.log('🔄 尝试恢复字幕文件:', { filePath, fileName })

        // 在Electron环境中，我们需要通过IPC来读取文件
        // 这里假设有一个文件系统助手来处理文件读取
        // 由于当前没有实现文件系统读取，我们先返回null
        console.warn('⚠️ 字幕文件恢复功能需要文件系统支持')
        return null
      } catch (error) {
        console.error('恢复字幕文件失败:', error)
        return null
      }
    },
    []
  )

  // 清除字幕文件
  const clearSubtitleFile = useCallback((): void => {
    setState({})
  }, [])

  // 保存字幕文件
  const saveSubtitleFile = useCallback(
    async (subtitles: SubtitleItem[], fileName?: string): Promise<boolean> => {
      try {
        // 将字幕转换为JSON格式保存
        const content = JSON.stringify(subtitles, null, 2)
        const finalFileName = fileName || `subtitles_${Date.now()}.json`

        // 在Electron环境中，我们需要通过IPC来保存文件
        // 这里假设有一个文件系统助手来处理文件保存
        console.log('💾 保存字幕文件:', {
          fileName: finalFileName,
          subtitlesCount: subtitles.length
        })

        setState((prev) => ({
          ...prev,
          subtitleFileName: finalFileName,
          subtitleContent: content
        }))

        message.success(`字幕文件已保存: ${finalFileName}`)
        return true
      } catch (error) {
        console.error('保存字幕文件失败:', error)
        message.error('保存字幕文件失败')
        return false
      }
    },
    []
  )

  return {
    ...state,
    handleSubtitleUpload,
    restoreSubtitleFile,
    clearSubtitleFile,
    saveSubtitleFile
  }
}
