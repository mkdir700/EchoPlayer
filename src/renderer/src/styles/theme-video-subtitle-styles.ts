import { GlobalToken } from 'antd/es/theme/interface'
import { CSSProperties } from 'react'
import { COMPONENT_TOKENS } from './theme'

interface VideoSubtitleStylesReturn {
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
}

export function buildVideoSubtitleStyles(token: GlobalToken): VideoSubtitleStylesReturn {
  return {
    // Subtitle component styles
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
    }
  }
}
