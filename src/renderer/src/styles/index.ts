import type { GlobalToken } from 'antd'
import type { ThemeStyles } from '@renderer/types/theme'

// Import all separated style modules
// 导入所有分离的样式模块
import { buildPageStyles } from './theme-page-styles'

import { buildHorizontalNavigationStyles } from './theme-settings-horizontal-navigation-styles'
import { buildPlayPageHeaderStyles } from './theme-play-page-header-styles'
import { buildPlayPageStyles } from './theme-play-page-styles'
import { buildSettingsStyles } from './theme-settings-styles'
import { buildSidebarNavigationStyles } from './theme-sidebar-navigation-styles'
import { buildSubtileListStyles } from './theme-subtile-list-styles'
import { buildSubtitleStyles } from './theme-subtitle-styles'
import { buildVideoCompatibilityModalStyles } from './theme-video-compatibility-modal-styles'
import { buildVideoControlsStyles } from './theme-video-controls-styles'
import { buildVideoControlsFullscreenStyles } from './theme-video-controls-fullscreen-styles'
import { buildVideoSubtitleStyles } from './theme-video-subtitle-styles'

/**
 * Main theme styles aggregator (modular implementation)
 * 主题样式聚合器（模块化实现）
 *
 * This aggregator combines all separated style modules into a unified buildStyles function.
 * It maintains 100% compatibility with the original useTheme hook interface.
 * 这个聚合器将所有分离的样式模块组合成统一的buildStyles函数。
 * 保持与原始useTheme hook接口的100%兼容性。
 */
export function buildStyles(token: GlobalToken): ThemeStyles {
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
