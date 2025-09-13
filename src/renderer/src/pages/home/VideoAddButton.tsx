import { useVideoFileSelect } from '@renderer/hooks/useVideoFileSelect'
import { useVideoListStore } from '@renderer/state/stores/video-list.store'
import { Tooltip } from 'antd'
import { FilePlus } from 'lucide-react'
import { FC, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { NavbarIcon } from '.'

interface VideoAddButtonProps {
  onShowFFmpegPrompt?: (show: boolean) => void
}

const VideoAddButton: FC<VideoAddButtonProps> = ({ onShowFFmpegPrompt }) => {
  const { t } = useTranslation()
  const { refreshVideoList } = useVideoListStore()
  const { selectVideoFile, showFFmpegPrompt, setShowFFmpegPrompt } = useVideoFileSelect({
    onSuccess: refreshVideoList
  })

  // 将showFFmpegPrompt状态传递给父组件
  useEffect(() => {
    onShowFFmpegPrompt?.(showFFmpegPrompt)
  }, [showFFmpegPrompt, onShowFFmpegPrompt])

  // 当关闭FFmpeg提示时，重置状态
  useEffect(() => {
    if (!showFFmpegPrompt) {
      setShowFFmpegPrompt(false)
    }
  }, [showFFmpegPrompt, setShowFFmpegPrompt])

  return (
    <Tooltip title={t('home.add_video')} mouseEnterDelay={0.8}>
      <NavbarIcon style={{ marginLeft: 10 }} onClick={selectVideoFile}>
        <FilePlus size={18} />
      </NavbarIcon>
    </Tooltip>
  )
}

export default VideoAddButton
