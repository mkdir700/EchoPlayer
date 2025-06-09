import { GlobalToken } from 'antd/es/theme/interface'
import { CSSProperties } from 'react'
import { ANIMATION_DURATION, EASING, FONT_SIZES, themeStyles } from './theme'

interface SubtileListStylesReturn {
  // Subtitle list item specific styles
  subtitleListItem: CSSProperties
  subtitleListItemActive: CSSProperties
  subtitleListItemHover: CSSProperties
  subtitleListItemTime: CSSProperties
  subtitleListItemText: CSSProperties
  subtitleListItemIndicator: CSSProperties
  // Subtitle list container specific styles
  subtitleListContainer: CSSProperties
  subtitleListContainerNoHeader: CSSProperties
  subtitleListContent: CSSProperties
  subtitleListHeader: CSSProperties
  subtitleListEmptyState: CSSProperties
  subtitleListVirtualizedList: CSSProperties
  // Subtitle prompt specific styles
  subtitlePromptContainer: CSSProperties
  subtitlePromptAlert: CSSProperties
  subtitlePromptButtonContainer: CSSProperties
  subtitlePromptPrimaryButton: CSSProperties
  subtitlePromptSecondaryButton: CSSProperties
  subtitlePromptSupportText: CSSProperties
  // Subtitle search specific styles - 字幕搜索相关样式
  subtitleSearchContainer: CSSProperties
  subtitleSearchIcon: CSSProperties
  subtitleSearchTitle: CSSProperties
  subtitleSearchSubtitle: CSSProperties
  subtitleSearchActionContainer: CSSProperties
  subtitleSearchImportButton: CSSProperties
  subtitleSearchDivider: CSSProperties
  subtitleSearchDividerText: CSSProperties
  subtitleSearchOnlineContainer: CSSProperties
  subtitleSearchWebsiteGrid: CSSProperties
  subtitleSearchWebsiteButton: CSSProperties
  subtitleSearchWebsiteButtonIcon: CSSProperties
}

export function buildSubtileListStyles(token: GlobalToken): SubtileListStylesReturn {
  return {
    // Subtitle list item specific styles
    subtitleListItem: {
      padding: `${token.paddingSM}px ${token.paddingMD}px`,
      margin: `0 0 ${token.marginXXS}px 0`,
      width: '100%',
      height: '60px',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      position: 'relative' as const,
      overflow: 'hidden',
      cursor: 'pointer',
      userSelect: 'none' as const,
      border: 'none', // 移除边框，避免悬停时出现黑色边框 / Remove border to avoid black border on hover
      background: 'transparent',
      borderRadius: token.borderRadius,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      hyphens: 'auto' as const,
      willChange: 'transform, background-color, box-shadow',
      contain: 'layout style paint' as const,
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      WebkitFontSmoothing: 'antialiased' as const,
      MozOsxFontSmoothing: 'grayscale' as const,
      // 禁用 focus 样式 / Disable focus styles
      outline: 'none !important',
      transition: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? `background-color ${ANIMATION_DURATION.FAST} ease, box-shadow ${ANIMATION_DURATION.FAST} ease, transform ${ANIMATION_DURATION.FAST} ease`
        : `background-color ${ANIMATION_DURATION.MEDIUM} ${EASING.STANDARD}, box-shadow ${ANIMATION_DURATION.MEDIUM} ${EASING.STANDARD}, transform ${ANIMATION_DURATION.MEDIUM} ${EASING.STANDARD}`
    },

    subtitleListItemActive: {
      backgroundColor: `${token.colorPrimary}18`,
      border: 'none', // 确保激活状态也没有边框
      boxShadow: `0 6px 20px ${token.colorPrimary}40, 0 3px 6px rgba(0, 0, 0, 0.12)`,
      transform: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'translateZ(0)'
        : 'scale(1.02) translateZ(0)',
      zIndex: 3
    },

    subtitleListItemHover: {
      backgroundColor: `${token.colorPrimary}08`, // 减淡悬停背景色，使其更微妙
      border: 'none', // 确保悬停状态没有边框
      transform: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'translateZ(0)'
        : 'translateY(-1px) scale(1.005) translateZ(0)', // 减少悬停动画幅度，使其更优雅
      boxShadow: `0 2px 8px ${token.colorPrimary}20, 0 1px 3px rgba(0, 0, 0, 0.06)`, // 减淡阴影
      zIndex: 2
    },

    subtitleListItemTime: {
      fontSize: FONT_SIZES.XS,
      fontWeight: 'normal'
    },

    subtitleListItemText: {
      fontSize: window.innerWidth <= 768 ? FONT_SIZES.XS : 13,
      lineHeight: 1.3,
      fontWeight: 'normal',
      overflow: 'hidden',
      display: '-webkit-box' as const,
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      textOverflow: 'ellipsis',
      whiteSpace: 'normal' as const,
      maxHeight: '2.6em'
    },

    subtitleListItemIndicator: {
      position: 'absolute' as const,
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: '70%',
      background: `linear-gradient(to bottom, ${token.colorPrimary}, ${token.colorPrimary}99)`,
      boxShadow: `0 0 8px ${token.colorPrimary}66`
    },

    // Subtitle list container specific styles
    subtitleListContainer: {
      background: token.colorBgContainer,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
      boxShadow: themeStyles.appleCardShadow.light,
      backdropFilter: 'blur(20px)',
      marginBottom: token.marginLG,
      height: 320,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden'
    },

    subtitleListContainerNoHeader: {
      background: 'var(--darker-bg)',
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none',
      backdropFilter: 'none',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      borderTop: '1px solid rgba(255, 255, 255, 0.04)'
    },

    subtitleListContent: {
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: 0,
      height: '100%',
      position: 'relative' as const
    },

    subtitleListHeader: {
      padding: `${token.paddingXS}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 0%, transparent 100%)'
    },

    subtitleListEmptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: token.paddingXL,
      color: token.colorTextTertiary,
      fontSize: token.fontSize
    },

    subtitleListVirtualizedList: {
      outline: 'none',
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      // Custom scrollbar styles through CSS variables
      scrollbarWidth: 'thin' as const,
      scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
      // 确保虚拟列表内部元素不受其他样式影响
      border: 'none',
      background: 'transparent'
    },

    // Subtitle prompt specific styles
    subtitlePromptContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: `${token.paddingXL}px ${token.paddingLG}px`,
      gap: token.marginXL,
      background: `linear-gradient(135deg, 
      ${token.colorBgContainer}f8 0%, 
      ${token.colorBgLayout}f0 50%, 
      ${token.colorBgContainer}f8 100%)`,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: token.borderRadiusLG,
      position: 'relative' as const,
      overflow: 'hidden'
    },

    subtitlePromptAlert: {
      width: '100%',
      maxWidth: '400px',
      marginBottom: token.marginLG,
      background: `linear-gradient(135deg, 
      ${token.colorWarningBg}f0 0%, 
      ${token.colorWarningBgHover}e0 100%)`,
      border: `1px solid ${token.colorWarningBorder}60`,
      borderRadius: token.borderRadiusLG,
      boxShadow: `0 8px 32px ${token.colorWarning}20, 
                0 4px 16px rgba(0, 0, 0, 0.08)`,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`
    },

    subtitlePromptButtonContainer: {
      display: 'flex',
      gap: token.marginMD,
      flexDirection: 'column' as const,
      width: '100%',
      maxWidth: '320px',
      alignItems: 'stretch'
    },

    subtitlePromptPrimaryButton: {
      width: '100%',
      height: '56px',
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      borderRadius: token.borderRadiusLG,
      border: 'none',
      background: `linear-gradient(135deg, 
      ${token.colorPrimary} 0%, 
      ${token.colorPrimaryHover} 50%, 
      ${token.colorPrimary} 100%)`,
      color: token.colorWhite,
      boxShadow: `0 8px 24px ${token.colorPrimary}40, 
                0 4px 12px rgba(0, 0, 0, 0.15)`,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden'
    },

    subtitlePromptSecondaryButton: {
      width: '100%',
      height: '48px',
      fontSize: token.fontSize,
      fontWeight: 500,
      borderRadius: token.borderRadius,
      background: 'transparent',
      border: `1px solid ${token.colorBorderSecondary}80`,
      color: token.colorTextSecondary,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
      cursor: 'pointer',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    },

    subtitlePromptSupportText: {
      fontSize: token.fontSizeSM,
      color: token.colorTextTertiary,
      textAlign: 'center' as const,
      lineHeight: 1.6,
      maxWidth: '280px',
      padding: `${token.paddingSM}px ${token.paddingMD}px`,
      background: `${token.colorFillQuaternary}40`,
      borderRadius: token.borderRadius,
      border: `1px solid ${token.colorBorderSecondary}40`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      fontFamily: token.fontFamilyCode || 'monospace'
    },

    // Subtitle search specific styles - 字幕搜索相关样式
    subtitleSearchContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: `${token.paddingXL}px ${token.paddingLG}px`,
      gap: token.marginXL,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: token.borderRadiusLG,
      position: 'relative' as const,
      overflow: 'hidden'
    },

    subtitleSearchIcon: {
      marginBottom: token.marginLG,
      color: token.colorPrimary,
      fontSize: 24
    },

    subtitleSearchTitle: {
      fontSize: token.fontSizeLG, // 从 fontSizeHeading2 调整为 fontSizeLG (16px)
      fontWeight: 600,
      marginBottom: token.marginSM,
      color: token.colorText
    },

    subtitleSearchSubtitle: {
      fontSize: token.fontSize, // 从 fontSizeLG 调整为 fontSize (14px)
      color: token.colorTextSecondary, // 调整颜色为更低对比度
      fontWeight: 400, // 降低字体粗细
      marginBottom: token.marginXS,
      lineHeight: 1.5 // 增加行高提升可读性
    },

    subtitleSearchActionContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: token.marginLG
    },

    subtitleSearchImportButton: {
      width: '100%',
      height: '56px',
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      borderRadius: token.borderRadiusLG,
      border: 'none',
      background: `linear-gradient(135deg, 
      ${token.colorPrimary} 0%, 
      ${token.colorPrimaryHover} 50%, 
      ${token.colorPrimary} 100%)`,
      color: token.colorWhite,
      boxShadow: `0 8px 24px ${token.colorPrimary}40, 
                0 4px 12px rgba(0, 0, 0, 0.15)`,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden'
    },

    subtitleSearchDivider: {
      width: '100%',
      height: '1px',
      background: token.colorBorderSecondary,
      marginBottom: token.marginXS
    },

    subtitleSearchDividerText: {
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
      textAlign: 'center' as const,
      lineHeight: 1.6,
      maxWidth: '280px',
      padding: `${token.paddingSM}px ${token.paddingMD}px`,
      background: `${token.colorFillQuaternary}40`,
      borderRadius: token.borderRadius,
      border: `1px solid ${token.colorBorderSecondary}40`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      fontFamily: token.fontFamilyCode || 'monospace'
    },

    subtitleSearchOnlineContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: token.marginLG
    },

    subtitleSearchWebsiteGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '6px'
    },

    subtitleSearchWebsiteButton: {
      width: '100%',
      height: '56px',
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      borderRadius: token.borderRadiusLG,
      border: 'none',
      background: `linear-gradient(135deg, 
      ${token.colorPrimary} 0%, 
      ${token.colorPrimaryHover} 50%, 
      ${token.colorPrimary} 100%)`,
      color: token.colorWhite,
      boxShadow: `0 8px 24px ${token.colorPrimary}40, 
                0 4px 12px rgba(0, 0, 0, 0.15)`,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden'
    },

    subtitleSearchWebsiteButtonIcon: {
      marginRight: token.marginXS,
      color: token.colorPrimary,
      fontSize: 24
    }
  }
}
