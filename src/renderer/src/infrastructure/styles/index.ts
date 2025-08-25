import type { ThemeMode, ThemeStyles } from '@types'
import type { GlobalToken } from 'antd'

import { buildPageStyles } from './theme-page.styles'
import { buildPlayPageStyles } from './theme-play-page.styles'
import { buildPlayPageHeaderStyles } from './theme-play-page-header.styles'
import { buildSettingsStyles } from './theme-settings.styles'
import { buildHorizontalNavigationStyles } from './theme-settings-horizontal-navigation.styles'
import { buildSidebarNavigationStyles } from './theme-sidebar-navigation.styles'
import { buildSubtileListStyles } from './theme-subtile-list.styles'
import { buildSubtitleStyles } from './theme-subtitle.styles'
import { buildVideoCompatibilityModalStyles } from './theme-video-compatibility-modal.styles'
import { buildVideoControlsStyles } from './theme-video-controls.styles'
import { buildVideoControlsFullscreenStyles } from './theme-video-controls-fullscreen.styles'
import { buildVideoSubtitleStyles } from './theme-video-subtitle.styles'

export function buildStyles(
  token: GlobalToken,
  actualTheme?: ThemeMode,
  compactMode?: boolean
): ThemeStyles {
  // Build styles from function-based modules using the token
  // 使用token从基于函数的模块构建样式
  const pageStyles = buildPageStyles(token)
  const subtitleStyles = buildSubtitleStyles(token)
  const settingsStyles = buildSettingsStyles(token)
  const videoControlsStyles = buildVideoControlsStyles(token)
  const videoControlsFullscreenStyles = buildVideoControlsFullscreenStyles(token)
  const playPageHeaderStyles = buildPlayPageHeaderStyles(token)
  const playPageStyles = buildPlayPageStyles(token)
  const horizontalNavigationStyles = buildHorizontalNavigationStyles(token)
  const sidebarNavigationStyles = buildSidebarNavigationStyles(token)
  const videoCompatibilityModalStyles = buildVideoCompatibilityModalStyles(token)
  const videoSubtitleStyles = buildVideoSubtitleStyles(token)
  const subtileListStyles = buildSubtileListStyles(token)

  return {
    ...pageStyles,
    ...settingsStyles,
    ...videoControlsStyles,
    ...videoControlsFullscreenStyles,
    ...playPageHeaderStyles,
    ...playPageStyles,
    ...horizontalNavigationStyles,
    ...sidebarNavigationStyles,
    ...subtitleStyles,
    ...videoCompatibilityModalStyles,
    ...videoSubtitleStyles,
    ...subtileListStyles,

    compactLayoutContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginSM
    },

    // Medium width responsive styles (768px-840px)
    mediumWidthMainControls: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginXS,
      width: '100%'
    },

    mediumWidthLeftControls: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      flex: '0 0 auto'
    },

    mediumWidthCenterControls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.marginXS,
      flex: '1 1 auto'
    },

    mediumWidthRightControls: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      flex: '0 0 auto'
    },

    mediumWidthSecondaryRow: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: token.marginXS,
      paddingTop: token.marginXS,
      borderTop: `1px solid ${token.colorBorderSecondary}`
    },

    mediumWidthPrimaryControls: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      minHeight: 40
    },

    mediumWidthSecondaryControls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingTop: token.marginXS,
      borderTop: `1px solid ${token.colorBorderSecondary}`
    }
  }
}
