import { useTheme } from '@renderer/contexts'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { SettingContainer } from '.'
import FFmpegSection from './FFmpegSection'
import FFprobeSection from './FFprobeSection'
import MediaServerSection from './MediaServerSection'

/**
 * 插件设置页面
 * 集成 FFmpeg、FFprobe 和 Media Server 的管理
 */
const PluginsSettings: FC = () => {
  const { theme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dependencyRefreshKeys, setDependencyRefreshKeys] = useState({
    ffmpeg: 0,
    ffprobe: 0
  })

  const mediaServerRef = useRef<HTMLDivElement>(null)
  const [triggerInstall, setTriggerInstall] = useState(false)

  const handleDependencyReady = useCallback((dependency: 'ffmpeg' | 'ffprobe') => {
    setDependencyRefreshKeys((prev) => ({
      ...prev,
      [dependency]: prev[dependency] + 1
    }))
  }, [])

  // 处理 URL 参数，滚动到指定 section 并触发安装
  useEffect(() => {
    const section = searchParams.get('section')
    const autoInstall = searchParams.get('autoInstall')

    if (section === 'media-server' && mediaServerRef.current) {
      // 延迟执行以确保组件已完全渲染
      setTimeout(() => {
        mediaServerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })

        // 如果需要自动安装，设置触发标志
        if (autoInstall === 'true') {
          setTriggerInstall(true)
        }
      }, 100)

      // 清除 URL 参数
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  return (
    <SettingContainer theme={theme}>
      {/* FFprobe 部分 */}
      <FFprobeSection refreshKey={dependencyRefreshKeys.ffprobe} />

      {/* FFmpeg 部分 */}
      <FFmpegSection refreshKey={dependencyRefreshKeys.ffmpeg} />

      {/* Media Server 部分 */}
      <MediaServerSection
        ref={mediaServerRef}
        onDependencyReady={handleDependencyReady}
        triggerInstall={triggerInstall}
        onInstallTriggered={() => setTriggerInstall(false)}
      />
    </SettingContainer>
  )
}

export default PluginsSettings
