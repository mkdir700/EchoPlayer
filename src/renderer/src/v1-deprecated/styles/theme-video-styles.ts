import type { CSSProperties } from 'react'

/**
 * 视频播放器样式模块
 * Video Player Styles Module
 *
 * 包含所有视频播放器相关的样式定义，包括播放器容器、控制器、全屏模式、音量控制等
 * Contains all video player related style definitions including player container, controls, fullscreen mode, volume control, etc.
 */

/**
 * 视频海报样式
 * Video poster styles
 */
export const videoPoster: CSSProperties = {
  width: '100%',
  height: '200px',
  borderRadius: '8px',
  objectFit: 'cover',
  cursor: 'pointer',
  position: 'relative',
  backgroundColor: 'var(--color-fill-secondary)'
}

/**
 * 播放页面视频信息
 * Play page video info
 */
export const playPageVideoInfo: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
  minWidth: 0
}

/**
 * 播放页面视频图标
 * Play page video icon
 */
export const playPageVideoIcon: CSSProperties = {
  fontSize: '20px',
  color: 'var(--color-primary)',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center'
}

/**
 * 播放页面视频详情
 * Play page video details
 */
export const playPageVideoDetails: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
}

/**
 * 播放页面视频标题
 * Play page video title
 */
export const playPageVideoTitle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--color-text)',
  lineHeight: '22px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  margin: 0
}

/**
 * 播放页面视频状态
 * Play page video status
 */
export const playPageVideoStatus: CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-text-secondary)',
  lineHeight: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

/**
 * 视频播放器区域
 * Video player section
 */
export const videoPlayerSection: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: 'var(--color-bg-container)',
  borderRadius: 'var(--border-radius-lg)',
  border: '1px solid var(--color-border-secondary)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
}

/**
 * 视频区域容器
 * Video section container
 */
export const videoSectionContainer: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000000',
  borderRadius: 'var(--border-radius-lg)',
  overflow: 'hidden'
}

/**
 * 紧凑控制器容器
 * Compact controls container
 */
export const compactControlsContainer: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
  padding: '20px 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  borderBottomLeftRadius: 'var(--border-radius-lg)',
  borderBottomRightRadius: 'var(--border-radius-lg)',
  transition: 'opacity 0.3s ease'
}

/**
 * 进度区域
 * Progress section
 */
export const progressSection: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

/**
 * 进度滑块
 * Progress slider
 */
export const progressSlider: CSSProperties = {
  flex: 1,
  height: '4px',
  cursor: 'pointer'
}

/**
 * 时间显示
 * Time display
 */
export const timeDisplay: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.9)',
  fontFamily: 'var(--font-family-code)',
  minWidth: '80px'
}

/**
 * 时间文本
 * Time text
 */
export const timeText: CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.9)',
  fontFamily: 'var(--font-family-code)',
  lineHeight: '16px'
}

/**
 * 主控制器
 * Main controls
 */
export const mainControls: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  gap: '8px'
}

/**
 * 左侧控制器
 * Left controls
 */
export const leftControls: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1
}

/**
 * 中央控制器
 * Center controls
 */
export const centerControls: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  flex: '0 0 auto'
}

/**
 * 右侧控制器
 * Right controls
 */
export const rightControls: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
  justifyContent: 'flex-end'
}

/**
 * 控制按钮
 * Control button
 */
export const controlBtn: CSSProperties = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'rgba(255, 255, 255, 0.9)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '14px',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)'
}

/**
 * 控制按钮激活状态
 * Control button active state
 */
export const controlBtnActive: CSSProperties = {
  ...controlBtn,
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'rgba(255, 255, 255, 1)'
}

/**
 * 播放暂停按钮
 * Play pause button
 */
export const playPauseBtn: CSSProperties = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.15)',
  color: 'rgba(255, 255, 255, 0.95)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '18px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)'
}

/**
 * 控制弹出窗口
 * Control popup
 */
export const controlPopup: CSSProperties = {
  position: 'absolute',
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--border-radius-lg)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  zIndex: 'var(--z-index-popup-base)',
  padding: '8px',
  minWidth: '120px'
}

/**
 * 播放速度控制
 * Playback rate control
 */
export const playbackRateControl: CSSProperties = {
  position: 'relative'
}

/**
 * 播放速度选择器
 * Playback rate select
 */
export const playbackRateSelect: CSSProperties = {
  width: '50px',
  height: '30px',
  fontSize: '12px',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '4px'
}

/**
 * 全屏容器
 * Fullscreen container
 */
export const fullscreenContainer: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: '#000000',
  zIndex: 'var(--z-index-modal)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

/**
 * 全屏控制栏
 * Fullscreen controls bar
 */
export const fullscreenControlsBar: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  opacity: 0,
  visibility: 'hidden',
  transition: 'all 0.3s ease',
  pointerEvents: 'none'
}

/**
 * 全屏控制栏可见状态
 * Fullscreen controls bar visible state
 */
export const fullscreenControlsBarVisible: CSSProperties = {
  opacity: 1,
  visibility: 'visible',
  pointerEvents: 'auto'
}

/**
 * 全屏左侧控制器
 * Fullscreen controls left
 */
export const fullscreenControlsLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1
}

/**
 * 全屏中央控制器
 * Fullscreen controls center
 */
export const fullscreenControlsCenter: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  flex: '0 0 auto'
}

/**
 * 全屏右侧控制器
 * Fullscreen controls right
 */
export const fullscreenControlsRight: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
  justifyContent: 'flex-end'
}

/**
 * 全屏控制组
 * Fullscreen control group
 */
export const fullscreenControlGroup: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

/**
 * 全屏控制按钮
 * Fullscreen control button
 */
export const fullscreenControlBtn: CSSProperties = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'rgba(255, 255, 255, 0.9)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '16px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)'
}

/**
 * 全屏控制按钮激活状态
 * Fullscreen control button active state
 */
export const fullscreenControlBtnActive: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'rgba(255, 255, 255, 1)'
}

/**
 * 全屏控制按钮悬停状态
 * Fullscreen control button hover state
 */
export const fullscreenControlBtnHover: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.15)',
  transform: 'scale(1.05)'
}

/**
 * 全屏播放暂停按钮
 * Fullscreen play pause button
 */
export const fullscreenPlayPauseBtn: CSSProperties = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.15)',
  color: 'rgba(255, 255, 255, 0.95)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '20px',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)'
}

/**
 * 全屏中央播放按钮
 * Fullscreen center play button
 */
export const fullscreenCenterPlayButton: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '32px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  zIndex: 10
}

/**
 * 全屏中央播放按钮样式
 * Fullscreen center play button style
 */
export const fullscreenCenterPlayBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%'
}

/**
 * 全屏时间显示
 * Fullscreen time display
 */
export const fullscreenTimeDisplay: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.9)',
  fontFamily: 'var(--font-family-code)',
  minWidth: '100px'
}

/**
 * 全屏时间文本
 * Fullscreen time text
 */
export const fullscreenTimeText: CSSProperties = {
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.9)',
  fontFamily: 'var(--font-family-code)',
  lineHeight: '18px'
}

/**
 * 全屏音量滑块弹出窗口
 * Fullscreen volume slider popup
 */
export const fullscreenVolumeSliderPopup: CSSProperties = {
  position: 'absolute',
  bottom: '45px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: '8px',
  padding: '12px 8px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}

/**
 * 全屏垂直音量滑块
 * Fullscreen vertical volume slider
 */
export const fullscreenVolumeSliderVertical: CSSProperties = {
  height: '100px',
  width: '4px'
}

/**
 * 全屏音量文本
 * Fullscreen volume text
 */
export const fullscreenVolumeText: CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.9)',
  textAlign: 'center',
  marginTop: '8px',
  fontFamily: 'var(--font-family-code)'
}

/**
 * 全屏播放速度选择器
 * Fullscreen playback rate select
 */
export const fullscreenPlaybackRateSelect: CSSProperties = {
  width: 50,
  height: 30,
  fontSize: 'var(--font-size-sm)'
}

/**
 * 播放速度按钮
 * Playback rate button
 */
export const playbackRateButton: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4px',
  width: '60px',
  height: '30px',
  fontSize: 'var(--font-size-sm)',
  padding: '0 8px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--border-radius)',
  background: 'var(--color-bg-container)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  color: 'var(--color-text)'
}

/**
 * 紧凑播放速度按钮
 * Playback rate button compact
 */
export const playbackRateButtonCompact: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4px',
  width: '60px',
  height: '30px',
  fontSize: 'var(--font-size-sm)',
  padding: '0 8px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--border-radius)',
  background: 'var(--color-bg-container)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  color: 'var(--color-text)'
}

/**
 * 全屏播放速度按钮
 * Playback rate button fullscreen
 */
export const playbackRateButtonFullscreen: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4px',
  width: '70px',
  height: '32px',
  fontSize: '12px',
  padding: '0 8px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '6px',
  background: 'rgba(0, 0, 0, 0.7)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  color: 'rgba(255, 255, 255, 0.9)'
}

/**
 * 播放速度弹出窗口
 * Playback rate popup
 */
export const playbackRatePopup: CSSProperties = {
  position: 'fixed',
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--border-radius-lg)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  zIndex: 'var(--z-index-popup-base)',
  minWidth: '400px',
  maxWidth: '480px',
  padding: '12px 16px',
  color: 'var(--color-text)'
}

/**
 * 全屏播放速度弹出窗口
 * Playback rate popup fullscreen
 */
export const playbackRatePopupFullscreen: CSSProperties = {
  position: 'fixed',
  background: 'rgba(20, 20, 20, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 'var(--border-radius-lg)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  zIndex: 'var(--z-index-popup-base)',
  minWidth: '400px',
  maxWidth: '480px',
  padding: '12px 16px',
  color: 'rgba(255, 255, 255, 0.9)'
}

/**
 * 播放速度配置区域
 * Playback rate config section
 */
export const playbackRateConfigSection: CSSProperties = {
  marginBottom: 'var(--margin-sm)'
}

/**
 * 播放速度配置区域标题
 * Playback rate config section title
 */
export const playbackRateConfigSectionTitle: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  marginBottom: 'var(--margin-xs)',
  color: 'var(--color-text-secondary)'
}

/**
 * 全屏播放速度配置区域标题
 * Playback rate config section title fullscreen
 */
export const playbackRateConfigSectionTitleFullscreen: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  marginBottom: 'var(--margin-xs)',
  color: 'rgba(255, 255, 255, 0.7)'
}

/**
 * 播放速度配置网格
 * Playback rate config grid
 */
export const playbackRateConfigGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '6px'
}

/**
 * 播放速度配置项
 * Playback rate config item
 */
export const playbackRateConfigItem: CSSProperties = {
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-container)',
  transition: 'all 0.15s ease',
  minHeight: '32px',
  color: 'var(--color-text)'
}

/**
 * 全屏播放速度配置项
 * Playback rate config item fullscreen
 */
export const playbackRateConfigItemFullscreen: CSSProperties = {
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.15s ease',
  minHeight: '32px',
  color: 'rgba(255, 255, 255, 0.9)'
}

/**
 * 播放速度配置项选中状态
 * Playback rate config item selected
 */
export const playbackRateConfigItemSelected: CSSProperties = {
  border: '1px solid var(--color-primary)',
  background: 'var(--color-primary-bg)',
  color: 'var(--color-text)'
}

/**
 * 全屏播放速度配置项选中状态
 * Playback rate config item selected fullscreen
 */
export const playbackRateConfigItemSelectedFullscreen: CSSProperties = {
  border: '1px solid rgba(255, 255, 255, 0.3)',
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'rgba(255, 255, 255, 0.9)'
}

/**
 * 播放速度配置项当前状态
 * Playback rate config item current
 */
export const playbackRateConfigItemCurrent: CSSProperties = {
  fontWeight: 600,
  color: 'var(--color-primary)'
}

/**
 * 全屏播放速度配置项当前状态
 * Playback rate config item current fullscreen
 */
export const playbackRateConfigItemCurrentFullscreen: CSSProperties = {
  fontWeight: 600,
  color: '#007AFF'
}

/**
 * 播放速度配置项文本
 * Playback rate config item text
 */
export const playbackRateConfigItemText: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  flex: 1,
  userSelect: 'none',
  color: 'inherit'
}

/**
 * 播放速度快速区域
 * Playback rate quick section
 */
export const playbackRateQuickSection: CSSProperties = {
  marginTop: 'var(--margin-sm)'
}

/**
 * 播放速度快速区域标题
 * Playback rate quick section title
 */
export const playbackRateQuickSectionTitle: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  marginBottom: 'var(--margin-xs)',
  color: 'var(--color-text-secondary)'
}

/**
 * 全屏播放速度快速区域标题
 * Playback rate quick section title fullscreen
 */
export const playbackRateQuickSectionTitleFullscreen: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  marginBottom: 'var(--margin-xs)',
  color: 'rgba(255, 255, 255, 0.7)'
}

/**
 * 播放速度快速按钮
 * Playback rate quick button
 */
export const playbackRateQuickButton: CSSProperties = {
  height: '28px',
  fontSize: '12px',
  padding: '0 12px',
  borderRadius: '6px',
  fontWeight: 'normal'
}

/**
 * 播放速度快速按钮激活状态
 * Playback rate quick button active
 */
export const playbackRateQuickButtonActive: CSSProperties = {
  background: 'var(--color-primary)',
  color: 'var(--color-white)',
  border: '1px solid var(--color-primary)'
}

/**
 * 播放速度分割线
 * Playback rate divider
 */
export const playbackRateDivider: CSSProperties = {
  margin: '8px 0',
  borderTop: '1px solid var(--color-border)'
}

/**
 * 播放速度文本
 * Playback rate span text
 */
export const playbackRateSpanText: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-secondary)'
}

/**
 * 全屏播放速度文本
 * Playback rate span text fullscreen
 */
export const playbackRateSpanTextFullscreen: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'rgba(255, 255, 255, 0.7)'
}

/**
 * 音量控制
 * Volume control
 */
export const volumeControl: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
}

/**
 * 音量滑块弹出窗口
 * Volume slider popup
 */
export const volumeSliderPopup: CSSProperties = {
  position: 'absolute',
  bottom: '35px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--color-bg-elevated)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '12px 8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--color-border-secondary)',
  zIndex: 'var(--z-index-popup-base)'
}

/**
 * 垂直音量滑块
 * Volume slider vertical
 */
export const volumeSliderVertical: CSSProperties = {
  height: '100px',
  width: '4px'
}

/**
 * 水平音量滑块
 * Volume slider horizontal
 */
export const volumeSliderHorizontal: CSSProperties = {
  width: '100px',
  height: '4px'
}

/**
 * 水平音量滑块容器
 * Volume slider horizontal container
 */
export const volumeSliderHorizontalContainer: CSSProperties = {
  position: 'relative',
  height: '20px',
  display: 'flex',
  alignItems: 'center'
}

/**
 * 水平音量滑块轨道
 * Volume slider horizontal track
 */
export const volumeSliderHorizontalTrack: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '4px',
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '2px',
  cursor: 'pointer'
}

/**
 * 音量滑块关键点
 * Volume slider key point
 */
export const volumeSliderKeyPoint: CSSProperties = {
  position: 'absolute',
  width: '8px',
  height: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  top: '50%',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

/**
 * 音量滑块关键点激活状态
 * Volume slider key point active
 */
export const volumeSliderKeyPointActive: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  transform: 'translate(-50%, -50%) scale(1.2)'
}

/**
 * 音量滑块关键点标签
 * Volume slider key point label
 */
export const volumeSliderKeyPointLabel: CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '10px',
  color: 'rgba(255, 255, 255, 0.7)',
  whiteSpace: 'nowrap',
  fontFamily: 'var(--font-family-code)'
}

/**
 * 自定义音量滑块
 * Custom volume slider
 */
export const customVolumeSlider: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '20px',
  cursor: 'pointer'
}

/**
 * 自定义音量滑块轨道
 * Custom volume slider track
 */
export const customVolumeSliderTrack: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '4px',
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '2px',
  transform: 'translateY(-50%)'
}

/**
 * 自定义音量滑块填充轨道
 * Custom volume slider track filled
 */
export const customVolumeSliderTrackFilled: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 0,
  height: '4px',
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '2px',
  transform: 'translateY(-50%)',
  transition: 'width 0.1s ease'
}

/**
 * 自定义音量滑块手柄
 * Custom volume slider handle
 */
export const customVolumeSliderHandle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  width: '12px',
  height: '12px',
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  cursor: 'grab',
  transition: 'transform 0.2s ease'
}

/**
 * 自定义音量滑块关键点
 * Custom volume slider key point
 */
export const customVolumeSliderKeyPoint: CSSProperties = {
  position: 'absolute',
  top: '50%',
  width: '6px',
  height: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  transition: 'all 0.2s ease'
}

/**
 * 自定义音量滑块关键点激活状态
 * Custom volume slider key point active
 */
export const customVolumeSliderKeyPointActive: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  transform: 'translate(-50%, -50%) scale(1.3)'
}
