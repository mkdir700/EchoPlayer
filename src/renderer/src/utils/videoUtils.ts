/**
 * 获取视频文件的显示宽高比 (Display Aspect Ratio)
 */
export function getVideoDisplayAspectRatio(videoElement: HTMLVideoElement): Promise<number> {
  return new Promise((resolve, reject) => {
    const handleLoadedMetadata = (): void => {
      try {
        const { videoWidth, videoHeight } = videoElement

        if (videoWidth && videoHeight) {
          const aspectRatio = videoWidth / videoHeight
          console.log('✅ 获取视频DAR:', {
            videoWidth,
            videoHeight,
            aspectRatio: aspectRatio.toFixed(3)
          })
          resolve(aspectRatio)
        } else {
          console.warn('⚠️ 无法获取视频尺寸信息')
          resolve(16 / 9) // 默认宽高比
        }
      } catch (error) {
        console.error('❌ 获取视频DAR失败:', error)
        reject(error)
      } finally {
        // 清理事件监听器
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        videoElement.removeEventListener('error', handleError)
      }
    }

    const handleError = (error: Event): void => {
      console.error('❌ 视频加载失败:', error)
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('error', handleError)
      reject(new Error('视频加载失败'))
    }

    // 如果视频已经加载了元数据，直接获取
    if (videoElement.readyState >= 1) {
      handleLoadedMetadata()
      return
    }

    // 添加事件监听器
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('error', handleError)
  })
}

/**
 * 从视频文件URL获取显示宽高比
 */
export function getVideoAspectRatioFromUrl(videoUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'

    const cleanup = (): void => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      if (video.src) {
        video.src = ''
      }
    }

    const handleLoadedMetadata = (): void => {
      try {
        const { videoWidth, videoHeight } = video

        if (videoWidth && videoHeight) {
          const aspectRatio = videoWidth / videoHeight
          console.log('✅ 从URL获取视频DAR:', {
            url: videoUrl,
            videoWidth,
            videoHeight,
            aspectRatio: aspectRatio.toFixed(3)
          })
          cleanup()
          resolve(aspectRatio)
        } else {
          console.warn('⚠️ 无法从URL获取视频尺寸信息')
          cleanup()
          resolve(16 / 9) // 默认宽高比
        }
      } catch (error) {
        console.error('❌ 从URL获取视频DAR失败:', error)
        cleanup()
        reject(error)
      }
    }

    const handleError = (error: Event): void => {
      console.error('❌ 视频URL加载失败:', error)
      cleanup()
      reject(new Error('视频URL加载失败'))
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)

    // 设置视频源
    video.src = videoUrl
  })
}

/**
 * 常见的视频宽高比预设
 */
export const CommonAspectRatios = {
  '16:9': 16 / 9, // 1.777...
  '4:3': 4 / 3, // 1.333...
  '21:9': 21 / 9, // 2.333...
  '1:1': 1, // 1.0
  '3:2': 3 / 2, // 1.5
  '2:1': 2 / 1 // 2.0
} as const

/**
 * 根据宽高比数值猜测比例名称
 */
export function guessAspectRatioName(ratio: number): string {
  const tolerance = 0.01

  for (const [name, value] of Object.entries(CommonAspectRatios)) {
    if (Math.abs(ratio - value) < tolerance) {
      return name
    }
  }

  return `${ratio.toFixed(3)}:1`
}
