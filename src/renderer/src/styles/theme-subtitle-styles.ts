/**
 * Subtitle related styles module
 * 字幕相关样式模块
 */

import type { CSSProperties } from 'react'
import type { GlobalToken } from 'antd'
import { SPACING, FONT_SIZES, ANIMATION_DURATION, EASING, COMPONENT_TOKENS } from './theme'
import { themeStyles } from './theme'

interface SubtitleStylesReturn {
  subtitleModeControl: CSSProperties
  subtitleModeSelector: CSSProperties
  subtitleContainer: CSSProperties
  subtitleContainerHover: CSSProperties
  subtitleContainerDragging: CSSProperties
  subtitleContent: CSSProperties
  subtitleContentTransparent: CSSProperties
  subtitleContentBlur: CSSProperties
  subtitleContentSolidBlack: CSSProperties
  subtitleContentSolidGray: CSSProperties
  subtitleText: CSSProperties
  subtitleTextEnglish: CSSProperties
  subtitleTextChinese: CSSProperties
  subtitleTextHidden: CSSProperties
  subtitleWord: CSSProperties
  subtitleWordHover: CSSProperties
  subtitleWordClickable: CSSProperties
  subtitleWordClickableHover: CSSProperties
  subtitleControls: CSSProperties
  subtitleControlButton: CSSProperties
  subtitleControlButtonHover: CSSProperties
  subtitleControlButtonActive: CSSProperties
  subtitleControlButtonMaskActive: CSSProperties
  subtitleControlButtonMaskInactive: CSSProperties
  subtitleControlIcon: CSSProperties
  subtitleControlIconMask: CSSProperties
  subtitleResizeHandle: CSSProperties
  subtitleResizeHandleHover: CSSProperties
  subtitleMaskOverlay: CSSProperties
  subtitleListItem: CSSProperties
  subtitleListItemActive: CSSProperties
  subtitleListItemHover: CSSProperties
  subtitleListItemTime: CSSProperties
  subtitleListItemText: CSSProperties
  subtitleListItemIndicator: CSSProperties
  subtitleListContainer: CSSProperties
  subtitleListContainerNoHeader: CSSProperties
  subtitleListContent: CSSProperties
  subtitleListHeader: CSSProperties
  subtitleListEmptyState: CSSProperties
  subtitleListVirtualizedList: CSSProperties
  subtitlePromptContainer: CSSProperties
  subtitlePromptAlert: CSSProperties
  subtitlePromptButtonContainer: CSSProperties
  subtitlePromptPrimaryButton: CSSProperties
  subtitlePromptSecondaryButton: CSSProperties
  subtitlePromptSupportText: CSSProperties
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

/**
 * Subtitle related styles builder function
 * 字幕相关样式构建函数
 */
export function buildSubtitleStyles(token: GlobalToken): SubtitleStylesReturn {
  return {
    // Subtitle mode control styles - 字幕模式控制样式
    subtitleModeControl: {
      position: 'relative' as const
    },

    subtitleModeSelector: {
      position: 'absolute' as const,
      bottom: 45,
      left: '50%',
      transform: 'translateX(-50%)',
      background: token.colorBgElevated,
      padding: `${token.paddingLG}px ${token.paddingMD}px`,
      borderRadius: token.borderRadiusLG,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: token.marginSM,
      minWidth: 200,
      boxShadow: themeStyles.appleCardShadow.heavy,
      border: `1px solid ${token.colorBorderSecondary}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase
    },

    // Subtitle container and content styles - 字幕容器和内容样式
    subtitleContainer: {
      minWidth: `${COMPONENT_TOKENS.SUBTITLE.MIN_WIDTH_PERCENT}%`,
      minHeight: `${COMPONENT_TOKENS.SUBTITLE.MIN_HEIGHT_PERCENT}%`,
      maxWidth: `${COMPONENT_TOKENS.SUBTITLE.MAX_WIDTH_PERCENT}%`,
      maxHeight: `${COMPONENT_TOKENS.SUBTITLE.MAX_HEIGHT_PERCENT}%`,
      pointerEvents: 'auto' as const,
      position: 'absolute' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.marginSM,
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION} ease-out`,
      borderRadius: token.borderRadiusLG,
      flexShrink: 0,
      flexGrow: 0,
      overflow: 'hidden',
      boxSizing: 'border-box' as const,
      border: '2px dashed transparent'
    },

    subtitleContainerHover: {
      border: `2px dashed ${COMPONENT_TOKENS.SUBTITLE.CONTAINER_BORDER_HOVER}`,
      boxShadow: COMPONENT_TOKENS.SUBTITLE.CONTAINER_SHADOW_HOVER
    },

    subtitleContainerDragging: {
      zIndex: 100,
      transform: 'rotate(1deg)',
      boxShadow: COMPONENT_TOKENS.SUBTITLE.CONTAINER_SHADOW_DRAGGING,
      border: `2px dashed ${COMPONENT_TOKENS.SUBTITLE.CONTAINER_BORDER_DRAGGING}`
    },

    subtitleContent: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      position: 'relative' as const,
      borderRadius: token.borderRadiusLG,
      background: 'transparent',
      backdropFilter: 'none',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      pointerEvents: 'auto' as const,
      boxSizing: 'border-box' as const,
      overflow: 'hidden'
    },

    subtitleContentTransparent: {
      background: 'transparent',
      backdropFilter: 'none',
      border: 'none',
      boxShadow: 'none'
    },

    subtitleContentBlur: {
      background: COMPONENT_TOKENS.SUBTITLE.BLUR_BACKGROUND,
      backdropFilter: 'blur(12px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    },

    subtitleContentSolidBlack: {
      background: COMPONENT_TOKENS.SUBTITLE.SOLID_BLACK_BACKGROUND,
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
    },

    subtitleContentSolidGray: {
      background: COMPONENT_TOKENS.SUBTITLE.SOLID_GRAY_BACKGROUND,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    },

    // Subtitle text and word styles - 字幕文本和单词样式
    subtitleText: {
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
      lineHeight: COMPONENT_TOKENS.SUBTITLE.DEFAULT_LINE_HEIGHT,
      fontWeight: COMPONENT_TOKENS.SUBTITLE.DEFAULT_FONT_WEIGHT,
      color: COMPONENT_TOKENS.SUBTITLE.DEFAULT_COLOR,
      textShadow: COMPONENT_TOKENS.SUBTITLE.DEFAULT_TEXT_SHADOW,
      letterSpacing: '0.02em',
      display: 'inline-block',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      width: 'auto',
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },

    subtitleTextEnglish: {
      fontWeight: COMPONENT_TOKENS.SUBTITLE.ENGLISH_FONT_WEIGHT,
      color: COMPONENT_TOKENS.SUBTITLE.DEFAULT_COLOR,
      textShadow: COMPONENT_TOKENS.SUBTITLE.ENGLISH_TEXT_SHADOW,
      lineHeight: COMPONENT_TOKENS.SUBTITLE.ENGLISH_LINE_HEIGHT
    },

    subtitleTextChinese: {
      fontWeight: COMPONENT_TOKENS.SUBTITLE.CHINESE_FONT_WEIGHT,
      color: COMPONENT_TOKENS.SUBTITLE.CHINESE_COLOR,
      textShadow: COMPONENT_TOKENS.SUBTITLE.CHINESE_TEXT_SHADOW,
      opacity: 0.95,
      lineHeight: COMPONENT_TOKENS.SUBTITLE.CHINESE_LINE_HEIGHT
    },

    subtitleTextHidden: {
      color: `${COMPONENT_TOKENS.SUBTITLE.HIDDEN_COLOR} !important`,
      fontStyle: 'italic',
      fontSize: '14px !important',
      fontWeight: '500 !important',
      textShadow: COMPONENT_TOKENS.SUBTITLE.CHINESE_TEXT_SHADOW,
      background: 'rgba(0, 0, 0, 0.4)',
      padding: `${token.paddingXS}px ${token.paddingMD}px`,
      borderRadius: token.borderRadiusSM,
      border: '1px dashed rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(4px)'
    },

    subtitleWord: {
      cursor: 'default',
      padding: '1px 2px',
      borderRadius: '4px',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      position: 'relative' as const,
      display: 'inline-block',
      pointerEvents: 'auto' as const,
      zIndex: 2
    },

    subtitleWordHover: {
      backgroundColor: COMPONENT_TOKENS.SUBTITLE.WORD_HOVER_BACKGROUND,
      color: `${COMPONENT_TOKENS.SUBTITLE.HOVER_COLOR} !important`,
      transform: 'scale(1.05)',
      fontWeight: '700 !important',
      textShadow:
        '0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(102, 126, 234, 0.6), 0 0 12px rgba(102, 126, 234, 0.4)',
      backdropFilter: 'blur(8px)'
    },

    subtitleWordClickable: {
      cursor: 'pointer',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      pointerEvents: 'auto' as const
    },

    subtitleWordClickableHover: {
      backgroundColor: `${COMPONENT_TOKENS.SUBTITLE.CLICKABLE_WORD_HOVER_BACKGROUND} !important`,
      color: `${COMPONENT_TOKENS.SUBTITLE.HOVER_COLOR} !important`,
      transform: 'scale(1.08) !important',
      fontWeight: '700 !important',
      textShadow:
        '0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(102, 126, 234, 0.8), 0 0 16px rgba(102, 126, 234, 0.6) !important',
      backdropFilter: 'blur(12px)'
    },

    // Subtitle control styles - 字幕控制样式
    subtitleControls: {
      position: 'relative' as const,
      top: 'auto',
      right: 'auto',
      display: 'flex',
      gap: '2px',
      background: COMPONENT_TOKENS.SUBTITLE.CONTROL_BACKGROUND,
      backdropFilter: 'blur(12px)',
      borderRadius: token.borderRadiusSM,
      padding: '4px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.6)',
      animation: `${COMPONENT_TOKENS.SUBTITLE.FADE_IN_DURATION} ease-out fadeInDown`,
      pointerEvents: 'auto' as const,
      zIndex: 60,
      minWidth: 'auto'
    },

    subtitleControlButton: {
      color: 'rgba(255, 255, 255, 0.9) !important',
      border: 'none !important',
      background: `${COMPONENT_TOKENS.SUBTITLE.CONTROL_BUTTON_BACKGROUND} !important`,
      borderRadius: `${token.borderRadiusSM}px !important`,
      display: 'flex !important',
      alignItems: 'center !important',
      justifyContent: 'center !important',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION} !important`,
      fontWeight: 'bold !important'
    },

    subtitleControlButtonHover: {
      color: '#ffffff !important',
      background: `${COMPONENT_TOKENS.SUBTITLE.CONTROL_BUTTON_HOVER_BACKGROUND} !important`,
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
    },

    subtitleControlButtonActive: {
      color: `${token.colorPrimary} !important`,
      background: `${COMPONENT_TOKENS.SUBTITLE.CONTROL_BUTTON_ACTIVE_BACKGROUND} !important`
    },

    subtitleControlButtonMaskActive: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${token.colorError}, ${token.colorErrorHover}) !important`,
      color: `${token.colorWhite} !important`,
      boxShadow: `0 0 15px ${token.colorError}CC, inset 0 1px 0 rgba(255, 255, 255, 0.4)`,
      border: `2px solid ${token.colorWhite} !important`,
      transform: 'scale(1.08)'
    },

    subtitleControlButtonMaskInactive: {
      background: 'rgba(255, 255, 255, 0.9) !important',
      color: `${token.colorPrimary} !important`,
      border: `2px solid ${token.colorPrimary}CC !important`,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    },

    subtitleControlIcon: {
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: `${token.colorWhite}`,
      filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.9))',
      textShadow: '0 1px 2px rgba(0, 0, 0, 1), 0 0 4px rgba(0, 0, 0, 0.8)'
    },

    subtitleControlIconMask: {
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: `${token.colorWhite}`,
      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))',
      verticalAlign: 'middle',
      height: '100%',
      width: '100%'
    },

    subtitleResizeHandle: {
      position: 'absolute' as const,
      background: COMPONENT_TOKENS.SUBTITLE.RESIZE_HANDLE_COLOR,
      border: `2px solid ${COMPONENT_TOKENS.SUBTITLE.RESIZE_HANDLE_BORDER}`,
      zIndex: 50,
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      pointerEvents: 'auto' as const
    },

    subtitleResizeHandleHover: {
      background: token.colorPrimary,
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
    },

    subtitleMaskOverlay: {
      boxSizing: 'border-box' as const,
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.FADE_IN_DURATION} ease-in-out`,
      animation: `${COMPONENT_TOKENS.SUBTITLE.FADE_IN_DURATION} ease-out fadeInMask`,
      boxShadow: 'none'
    },

    // Subtitle list item styles - 字幕列表项样式
    subtitleListItem: {
      padding: `${SPACING.SM}px ${SPACING.MD}px`,
      margin: `0 0 ${SPACING.XXS}px 0`,
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
      backgroundColor: 'transparent',
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

    // Subtitle list container styles - 字幕列表容器样式
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

    // Subtitle prompt styles - 字幕提示样式
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

    // Subtitle search styles - 字幕搜索样式
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
