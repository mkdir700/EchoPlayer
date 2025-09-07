import { useVideoFileSelect } from '@renderer/hooks/useVideoFileSelect'
import { useVideoListStore } from '@renderer/state/stores/video-list.store'
import { Tooltip } from 'antd'
import { FilePlus } from 'lucide-react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { NavbarIcon } from '.'

const VideoAddButton: FC = () => {
  const { t } = useTranslation()
  const { refreshVideoList } = useVideoListStore()
  const { selectVideoFile } = useVideoFileSelect({
    onSuccess: refreshVideoList
  })

  return (
    <Tooltip title={t('home.add_video')} mouseEnterDelay={0.8}>
      <NavbarIcon style={{ marginLeft: 10 }} onClick={selectVideoFile}>
        <FilePlus size={18} />
      </NavbarIcon>
    </Tooltip>
  )
}

export default VideoAddButton
