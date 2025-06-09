import { GlobalToken } from 'antd/es/theme/interface'
import type { CSSProperties } from 'react'
import { themeStyles } from './theme'

export function buildSettingsStyles(token: GlobalToken): {
  // Settings page specific styles
  settingsContainer: CSSProperties
  settingsLayout: CSSProperties
  settingsSidebar: CSSProperties
  settingsContent: CSSProperties
  settingsMain: CSSProperties
  settingsMainContent: CSSProperties
  settingsActionBar: CSSProperties
  // Settings section specific styles - 设置区块通用样式
  settingsSectionCard: CSSProperties
  settingsRow: CSSProperties
  settingsRowContent: CSSProperties
  settingsRowTitle: CSSProperties
  settingsRowDescription: CSSProperties
  settingsRowControl: CSSProperties
  settingsInfoHeader: CSSProperties
  settingsInfoIcon: CSSProperties
  settingsFeatureList: CSSProperties
  settingsFeatureListItem: CSSProperties
  settingsDivider: CSSProperties
  // Settings form styles - 设置表单样式
  settingsPageTitle: CSSProperties
  settingsPageSubtitle: CSSProperties
  settingsFormContainer: CSSProperties
  settingsInputGroup: CSSProperties
  settingsLabel: CSSProperties
  settingsInput: CSSProperties
  settingsButtonGroup: CSSProperties
  settingsDangerZone: CSSProperties
  settingsDangerZoneTitle: CSSProperties
  settingsDangerZoneDescription: CSSProperties
  // Shortcuts specific styles
  shortcutItem: CSSProperties
  shortcutKeyTag: CSSProperties
  shortcutEditInput: CSSProperties
} {
  return {
    // Settings page specific styles
    settingsContainer: {
      minHeight: '100vh',
      background: token.colorBgLayout,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'auto',
      boxSizing: 'border-box' as const
    },

    settingsLayout: {
      display: 'flex',
      flex: 1,
      minHeight: 'calc(100vh - 0px)' // 确保有足够高度
    },

    settingsSidebar: {
      width: 240,
      background: token.colorBgContainer,
      borderRight: `1px solid ${token.colorBorderSecondary}`,
      display: 'flex',
      flexDirection: 'column' as const,
      flexShrink: 0
    },

    settingsContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0
    },

    settingsMain: {
      background: token.colorBgContainer,
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: 0
    },

    settingsMainContent: {
      flex: 1,
      padding: `${token.paddingXL}px`,
      background: token.colorBgContainer,
      minHeight: 'calc(100vh - 200px)', // 减去头部和导航的高度
      overflowY: 'auto' as const,
      boxSizing: 'border-box' as const
    },

    settingsActionBar: {
      padding: token.paddingLG,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgElevated,
      display: 'flex',
      justifyContent: 'center',
      gap: token.marginSM
    },

    // Settings section specific styles - 设置区块通用样式
    settingsSectionCard: {
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorderSecondary}`,
      boxShadow: themeStyles.appleCardShadow.light,
      overflow: 'hidden',
      marginBottom: token.marginLG
    },

    settingsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: token.marginLG
    },

    settingsRowContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      minWidth: 0
    },

    settingsRowTitle: {
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      color: token.colorText,
      marginBottom: token.marginXXS
    },

    settingsRowDescription: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginXXS
    },

    settingsRowControl: {
      flexShrink: 0,
      marginLeft: token.marginMD
    },

    settingsInfoHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: token.marginSM
    },

    settingsInfoIcon: {
      marginRight: token.marginSM,
      color: token.colorPrimary
    },

    settingsFeatureList: {
      paddingLeft: token.paddingMD,
      margin: 0,
      lineHeight: token.lineHeight
    },

    settingsFeatureListItem: {
      marginBottom: token.marginXS
    },

    settingsDivider: {
      margin: `${token.marginLG}px 0`
    },

    // Settings form styles - 设置表单样式
    settingsPageTitle: {
      fontSize: token.fontSizeHeading1,
      fontWeight: 700,
      color: token.colorText,
      marginBottom: token.marginMD
    },

    settingsPageSubtitle: {
      fontSize: token.fontSizeLG,
      color: token.colorTextDescription,
      fontWeight: 400,
      marginBottom: token.marginLG
    },

    settingsFormContainer: {
      background: token.colorBgContainer,
      padding: token.paddingLG,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorderSecondary}`
    },

    settingsInputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginXS,
      marginBottom: token.marginMD
    },

    settingsLabel: {
      fontSize: token.fontSize,
      fontWeight: 600,
      color: token.colorText,
      marginBottom: token.marginXXS
    },

    settingsInput: {
      borderRadius: token.borderRadius,
      borderColor: token.colorBorder
    },

    settingsButtonGroup: {
      display: 'flex',
      gap: token.marginSM,
      justifyContent: 'flex-end',
      marginTop: token.marginLG
    },

    settingsDangerZone: {
      background: token.colorErrorBg,
      border: `1px solid ${token.colorErrorBorder}`,
      borderRadius: token.borderRadiusLG,
      padding: token.paddingLG,
      marginTop: token.marginXL
    },

    settingsDangerZoneTitle: {
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      color: token.colorError,
      marginBottom: token.marginXS
    },

    settingsDangerZoneDescription: {
      fontSize: token.fontSize,
      color: token.colorTextSecondary,
      marginBottom: token.marginMD
    },

    shortcutItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      transition: `background-color ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      position: 'relative' as const
    },

    shortcutKeyTag: {
      background: token.colorFillQuaternary,
      color: token.colorText,
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
      padding: `${token.paddingXXS}px ${token.paddingSM}px`,
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      fontFamily: 'Monaco, "SF Mono", Consolas, monospace',
      minWidth: 80,
      textAlign: 'center' as const,
      transition: `all ${token.motionDurationMid} ease`
    },

    shortcutEditInput: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      background: token.colorBgElevated,
      borderRadius: token.borderRadius,
      border: `2px solid ${token.colorPrimary}`,
      padding: token.paddingXS
    }
  }
}
