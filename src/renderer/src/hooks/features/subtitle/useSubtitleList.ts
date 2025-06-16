import { useRef, useCallback, useState } from 'react'
import { message } from 'antd'
import { parseSubtitles } from '@renderer/utils/subtitleParser'
import type { SubtitleItem } from '@types_/shared'
import { RendererLogger } from '@renderer/utils/logger'

export interface UseSubtitleListReturn {
  isAutoScrollEnabledRef: React.RefObject<boolean>
  subtitleItemsRef: React.RefObject<SubtitleItem[]>
  currentSubtitleIndexRef: React.RefObject<number>
  handleSubtitleUpload: (file: File) => boolean
  handleDroppedFile: (file: File) => Promise<void>
  getCurrentSubtitleIndex: (currentTime: number) => number
  getSubtitleIndexForTime: (currentTime: number) => number
  getCurrentSubtitle: (currentTime: number) => SubtitleItem | null
  enableAutoScroll: () => void
  disableAutoScroll: () => void
  setCurrentSubtitleIndex: (index: number) => void
  restoreSubtitles: (subtitles: SubtitleItem[], currentSubtitleIndex: number) => void
  showSubtitlePrompt: boolean
  setShowSubtitlePrompt: (show: boolean) => void
  handleManualSubtitleImport: () => Promise<void>
  handleSkipSubtitleImport: () => void
}

export function useSubtitleList(): UseSubtitleListReturn {
  // 直接创建单独的 ref，而不是嵌套的 ref 结构
  const isAutoScrollEnabledRef = useRef(true)
  const subtitleItemsRef = useRef<SubtitleItem[]>([])
  const currentSubtitleIndexRef = useRef(-1)

  // 新增：字幕文件匹配失败时的提示状态
  const [showSubtitlePrompt, setShowSubtitlePrompt] = useState(false)

  // 字幕文件上传处理
  const handleSubtitleUpload = useCallback((file: File): boolean => {
    const reader = new FileReader()
    reader.onload = (e): void => {
      try {
        const content = e.target?.result as string
        const parsedSubtitles = parseSubtitles(content, file.name)
        subtitleItemsRef.current = parsedSubtitles
        message.success({
          content: `字幕文件 ${file.name} 已导入，共 ${parsedSubtitles.length} 条字幕`
        })
        // 导入成功后隐藏提示
        setShowSubtitlePrompt(false)
      } catch (error) {
        message.error({
          content: `字幕文件解析失败: ${(error as Error).message}`
        })
      }
    }
    reader.readAsText(file)
    return false
  }, [])

  // 新增：手动导入字幕文件
  const handleManualSubtitleImport = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.srt,.vtt,.json,.ass,.ssa'

      // 文件选择完成或取消时的处理 / Handle file selection completion or cancellation
      const handleComplete = (): void => {
        resolve()
        // 清理事件监听器 / Clean up event listeners
        input.removeEventListener('change', handleFileChange)
        input.removeEventListener('cancel', handleComplete)
        // 移除临时创建的元素 / Remove temporarily created element
        if (document.body.contains(input)) {
          document.body.removeChild(input)
        }
      }

      const handleFileChange = async (event: Event): Promise<void> => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) {
          handleComplete()
          return
        }

        try {
          const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = () => reject(new Error('读取文件失败'))
            reader.readAsText(file)
          })

          const subtitles = parseSubtitles(content, file.name)
          if (subtitles.length === 0) {
            throw new Error('字幕文件解析失败或为空')
          }

          subtitleItemsRef.current = subtitles
          currentSubtitleIndexRef.current = 0
          setShowSubtitlePrompt(false)

          message.success(`成功加载字幕文件：${file.name}，共 ${subtitles.length} 条字幕`)
        } catch (error) {
          console.error('加载字幕文件失败:', error)
          message.error(`加载字幕文件失败：${(error as Error).message}`)
        }

        handleComplete()
      }

      input.addEventListener('change', handleFileChange)
      input.addEventListener('cancel', handleComplete)

      // 为了确保在某些浏览器中能够监听到 cancel 事件，我们添加到 DOM 中 / Add to DOM to ensure cancel event can be listened to in some browsers
      input.style.display = 'none'
      document.body.appendChild(input)

      // 监听窗口焦点变化作为备用方案 / Listen for window focus change as fallback
      const handleWindowFocus = (): void => {
        // 延迟一下确保文件对话框已经完全关闭 / Delay to ensure file dialog is completely closed
        setTimeout(() => {
          if (document.body.contains(input)) {
            handleComplete()
          }
          window.removeEventListener('focus', handleWindowFocus)
        }, 100)
      }

      window.addEventListener('focus', handleWindowFocus)

      input.click()
    })
  }, [])

  // 新增：处理拖拽文件 / Handle dropped file
  const handleDroppedFile = useCallback(async (file: File): Promise<void> => {
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error('读取文件失败'))
        reader.readAsText(file)
      })

      const subtitles = parseSubtitles(content, file.name)
      if (subtitles.length === 0) {
        throw new Error('字幕文件解析失败或为空')
      }

      subtitleItemsRef.current = subtitles
      currentSubtitleIndexRef.current = 0
      setShowSubtitlePrompt(false)

      message.success(`成功加载字幕文件：${file.name}，共 ${subtitles.length} 条字幕`)
    } catch (error) {
      console.error('加载字幕文件失败:', error)
      message.error(`加载字幕文件失败：${(error as Error).message}`)
    }
  }, [])

  // 新增：跳过字幕导入
  const handleSkipSubtitleImport = useCallback(() => {
    setShowSubtitlePrompt(false)
    message.info('已跳过字幕导入，您可以稍后手动添加字幕文件')
  }, [])

  // 获取当前字幕索引
  const getCurrentSubtitleIndex = useCallback((currentTime: number): number => {
    return subtitleItemsRef.current.findIndex(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    )
  }, [])

  // 获取指定时间点的字幕索引（用于进度条拖动）
  // 如果该时间点没有字幕，返回该时间点后最近的一条字幕索引
  const getSubtitleIndexForTime = useCallback((currentTime: number): number => {
    // 首先尝试找到当前时间点正在播放的字幕
    const activeIndex = subtitleItemsRef.current.findIndex(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    )

    if (activeIndex !== -1) {
      return activeIndex
    }

    // 如果没有正在播放的字幕，找到该时间点后最近的一条字幕
    const nextIndex = subtitleItemsRef.current.findIndex((sub) => sub.startTime > currentTime)

    if (nextIndex !== -1) {
      return nextIndex
    }

    // 如果没有找到后续字幕，返回最后一条字幕的索引
    return subtitleItemsRef.current.length > 0 ? subtitleItemsRef.current.length - 1 : -1
  }, [])

  // 获取当前字幕对象
  const getCurrentSubtitle = useCallback(
    (currentTime: number): SubtitleItem | null => {
      const index = getCurrentSubtitleIndex(currentTime)
      return index >= 0 ? subtitleItemsRef.current[index] : null
    },
    [getCurrentSubtitleIndex]
  )

  // 设置自动滚动状态
  const enableAutoScroll = useCallback(() => {
    RendererLogger.debug('✅ 启用自动滚动')
    isAutoScrollEnabledRef.current = true
  }, [])

  const disableAutoScroll = useCallback(() => {
    RendererLogger.debug('🚫 禁用自动滚动')
    isAutoScrollEnabledRef.current = false
  }, [])

  // 设置当前字幕索引
  const setCurrentSubtitleIndex = useCallback((index: number): void => {
    currentSubtitleIndexRef.current = index
  }, [])

  // 恢复字幕状态
  const restoreSubtitles = useCallback(
    (subtitles: SubtitleItem[], currentSubtitleIndex: number): void => {
      RendererLogger.debug('🔄 开始恢复字幕状态:', {
        subtitlesCount: subtitles.length,
        currentSubtitleIndex,
        firstSubtitle: subtitles[0],
        isAutoScrollEnabled: isAutoScrollEnabledRef.current
      })

      subtitleItemsRef.current = subtitles
      currentSubtitleIndexRef.current = currentSubtitleIndex

      // 确保恢复字幕时启用自动滚动
      if (!isAutoScrollEnabledRef.current) {
        RendererLogger.debug('🔄 恢复字幕时重新启用自动滚动')
        isAutoScrollEnabledRef.current = true
      }

      // 恢复字幕后隐藏提示
      setShowSubtitlePrompt(false)

      RendererLogger.debug('✅ 字幕状态恢复完成', {
        isAutoScrollEnabled: isAutoScrollEnabledRef.current
      })
    },
    []
  )

  return {
    isAutoScrollEnabledRef,
    subtitleItemsRef,
    currentSubtitleIndexRef,
    handleSubtitleUpload,
    handleDroppedFile,
    getCurrentSubtitleIndex,
    getSubtitleIndexForTime,
    getCurrentSubtitle,
    enableAutoScroll,
    disableAutoScroll,
    setCurrentSubtitleIndex,
    restoreSubtitles,
    showSubtitlePrompt,
    setShowSubtitlePrompt,
    handleManualSubtitleImport,
    handleSkipSubtitleImport
  }
}
