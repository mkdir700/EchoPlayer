import { Navbar, NavbarCenter, NavbarLeft, NavbarRight } from '@renderer/components/app/Navbar'
import { useSearchStore } from '@renderer/state'
import { Tooltip } from 'antd'
import { Grid, List, Search } from 'lucide-react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { NavbarIcon } from '.'
import VideoAddButton from './VideoAddButton'

interface Props {
  videoListViewMode: 'grid' | 'list'
  setVideoListViewMode: (mode: 'grid' | 'list') => void
  onShowFFmpegPrompt?: (show: boolean) => void
}

const HeaderNavbar: FC<Props> = ({
  videoListViewMode,
  setVideoListViewMode,
  onShowFFmpegPrompt
}) => {
  const { t } = useTranslation()
  const { showSearch } = useSearchStore()

  const toggleViewMode = () => {
    setVideoListViewMode(videoListViewMode === 'grid' ? 'list' : 'grid')
  }

  const getViewModeTooltip = () => {
    return videoListViewMode === 'grid' ? t('common.list_view') : t('common.grid_view')
  }

  return (
    <Navbar className="home-navbar">
      <NavbarLeft>
        <VideoAddButton onShowFFmpegPrompt={onShowFFmpegPrompt} />
      </NavbarLeft>
      <NavbarCenter />
      <NavbarRight style={{ gap: 10 }}>
        <Tooltip title={getViewModeTooltip()} mouseEnterDelay={0.8}>
          <NavbarIcon onClick={toggleViewMode}>
            {videoListViewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
          </NavbarIcon>
        </Tooltip>
        <Tooltip title={t('common.search')} mouseEnterDelay={0.8}>
          <NavbarIcon onClick={showSearch}>
            <Search size={18} />
          </NavbarIcon>
        </Tooltip>
      </NavbarRight>
    </Navbar>
  )
}

export default HeaderNavbar
