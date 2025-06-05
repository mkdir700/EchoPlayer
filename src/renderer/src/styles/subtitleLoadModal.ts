import type { GlobalToken } from 'antd'
import type { CSSProperties } from 'react'

/**
 * SubtitleLoadModal component styles
 * Create component-specific styles based on theme tokens
 */
export const createSubtitleLoadModalStyles = (
  token: GlobalToken
): Record<string, CSSProperties> => ({
  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    color: token.colorText,
    fontSize: token.fontSizeXL,
    fontWeight: token.fontWeightStrong
  },
  titleIcon: {
    color: token.colorPrimary,
    fontSize: token.fontSizeHeading2,
    filter: `drop-shadow(0 0 8px ${token.colorPrimary}30)`
  },
  modalContent: {
    padding: token.paddingXL,
    position: 'relative' as const
  },
  checkingSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: token.marginXL,
    padding: `${token.paddingXL}px ${token.paddingXL}px`,
    textAlign: 'center' as const
  },
  checkingText: {
    color: token.colorText,
    fontSize: token.fontSizeLG,
    fontWeight: token.fontWeightStrong
  },
  foundSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: token.marginXL
  },
  notFoundSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: token.marginXL
  },
  subtitleList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: token.marginSM,
    maxHeight: '200px',
    overflowY: 'auto' as const,
    padding: token.paddingSM,
    background: token.colorBgContainer,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`
  },
  subtitleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    padding: token.paddingMD,
    borderRadius: token.borderRadius,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: `1px solid transparent`,
    background: token.colorBgContainer
  },
  subtitleItemSelected: {
    background: token.colorPrimaryBg,
    borderColor: token.colorPrimary,
    boxShadow: `0 0 0 2px ${token.colorPrimary}20`
  },
  subtitleItemHover: {
    background: token.colorBgTextHover,
    borderColor: token.colorBorder
  },
  fileIcon: {
    color: token.colorPrimary,
    fontSize: token.fontSizeLG
  },
  subtitleName: {
    flex: 1,
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: token.fontWeightStrong
  },
  selectedIcon: {
    color: token.colorSuccess,
    fontSize: token.fontSizeLG
  },
  actionButtons: {
    display: 'flex',
    gap: token.marginMD,
    justifyContent: 'center',
    marginTop: token.marginXL
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `${token.colorBgMask}80`,
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    borderRadius: token.borderRadiusLG
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: token.marginLG,
    padding: token.paddingXL,
    background: token.colorBgContainer,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: token.boxShadowSecondary
  },
  loadingText: {
    color: token.colorText,
    fontSize: token.fontSizeLG,
    fontWeight: token.fontWeightStrong,
    textAlign: 'center' as const,
    marginTop: token.marginMD
  },
  cancelButton: {
    marginTop: token.marginLG
  }
})
