import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useEffect, useState } from 'react'

import VideoStatusIndicator from './VideoStatusIndicator'

/**
 * 音量调节指示器组件
 * 当用户调节音量时显示音量图标
 * 基于通用的 VideoStatusIndicator 组件实现
 */
function VolumeIndicator() {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)

  const [showIndicator, setShowIndicator] = useState(false)

  // 监听音量变化，显示指示器并在 1 秒后自动隐藏
  useEffect(() => {
    setShowIndicator(true)

    const timer = setTimeout(() => {
      setShowIndicator(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [volume, muted])

  return (
    <VideoStatusIndicator
      show={showIndicator}
      config={{
        type: 'volume',
        volume: Math.round(volume * 100),
        muted
      }}
    />
  )
}

export default VolumeIndicator
