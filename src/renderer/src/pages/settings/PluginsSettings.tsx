import { useTheme } from '@renderer/contexts'
import { FC, useCallback, useState } from 'react'

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
  const [dependencyRefreshKeys, setDependencyRefreshKeys] = useState({
    ffmpeg: 0,
    ffprobe: 0
  })

  const handleDependencyReady = useCallback((dependency: 'ffmpeg' | 'ffprobe') => {
    setDependencyRefreshKeys((prev) => ({
      ...prev,
      [dependency]: prev[dependency] + 1
    }))
  }, [])

  return (
    <SettingContainer theme={theme}>
      {/* FFmpeg 部分 */}
      <FFmpegSection refreshKey={dependencyRefreshKeys.ffmpeg} />

      {/* FFprobe 部分 */}
      <FFprobeSection refreshKey={dependencyRefreshKeys.ffprobe} />

      {/* Media Server 部分 */}
      <MediaServerSection onDependencyReady={handleDependencyReady} />
    </SettingContainer>
  )
}

export default PluginsSettings
