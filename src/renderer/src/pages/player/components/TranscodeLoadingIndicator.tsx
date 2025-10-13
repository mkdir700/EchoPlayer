import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useMemo } from 'react'

import VideoStatusIndicator from './VideoStatusIndicator'

/**
 * 转码加载指示器组件
 * 在用户 seek 到未转码时间点时显示加载动画
 * 基于通用的 VideoStatusIndicator 组件实现
 */
function TranscodeLoadingIndicator() {
  // 使用单字段选择器遵循 Zustand 规范
  const isVideoSeeking = usePlayerStore((s) => s.isVideoSeeking)
  const isVideoWaiting = usePlayerStore((s) => s.isVideoWaiting)
  const transcodeStatus = usePlayerStore((s) => s.transcodeInfo.status)
  const hlsMode = usePlayerStore((s) => s.hlsMode)

  // 计算是否显示加载指示器
  const showLoading = useMemo(() => {
    // 只在 HLS 模式下显示
    if (!hlsMode) return false

    // 正在转码时显示
    if (transcodeStatus === 'transcoding') return true

    // seeking 或 waiting 时显示
    if (isVideoSeeking || isVideoWaiting) return true

    return false
  }, [hlsMode, transcodeStatus, isVideoSeeking, isVideoWaiting])

  return <VideoStatusIndicator show={showLoading} config={{ type: 'loading' }} />
}

export default TranscodeLoadingIndicator
