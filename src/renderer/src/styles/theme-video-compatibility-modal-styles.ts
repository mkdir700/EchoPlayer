import type { CSSProperties } from 'react'
import type { GlobalToken } from 'antd'

interface VideoCompatibilityModalStylesReturn {
  videoCompatibilityModalContainer: CSSProperties
  videoCompatibilityModalDescription: CSSProperties
  videoCompatibilityModalProblemList: CSSProperties
  videoCompatibilityModalProblemItem: CSSProperties
  videoCompatibilityModalHelpText: CSSProperties
  videoCompatibilityModalAlertContainer: CSSProperties
  videoCompatibilityModalProgressContainer: CSSProperties
  videoCompatibilityModalProgressHeader: CSSProperties
  videoCompatibilityModalProgressFooter: CSSProperties
  videoCompatibilityModalProgressText: CSSProperties
}

export function buildVideoCompatibilityModalStyles(
  token: GlobalToken
): VideoCompatibilityModalStylesReturn {
  return {
    // Video compatibility modal specific styles - 视频兼容性模态框样式
    videoCompatibilityModalContainer: {
      paddingTop: token.paddingSM
    },

    videoCompatibilityModalDescription: {
      marginBottom: token.marginMD,
      color: token.colorTextSecondary,
      fontSize: token.fontSize,
      lineHeight: 1.6
    },

    videoCompatibilityModalProblemList: {
      margin: `0 0 ${token.marginMD}px 0`,
      paddingLeft: token.paddingMD,
      color: token.colorText,
      listStyle: 'disc'
    },

    videoCompatibilityModalProblemItem: {
      marginBottom: token.marginXXS,
      lineHeight: 1.5
    },

    videoCompatibilityModalHelpText: {
      margin: 0,
      fontSize: token.fontSizeSM,
      color: token.colorTextTertiary,
      lineHeight: 1.5
    },

    videoCompatibilityModalAlertContainer: {
      marginBottom: token.marginMD
    },

    videoCompatibilityModalProgressContainer: {
      marginBottom: token.marginLG
    },

    videoCompatibilityModalProgressHeader: {
      marginBottom: token.marginXS
    },

    videoCompatibilityModalProgressFooter: {
      marginTop: token.marginXS,
      textAlign: 'center' as const
    },

    videoCompatibilityModalProgressText: {
      fontSize: token.fontSize,
      color: token.colorTextSecondary
    }
  }
}
