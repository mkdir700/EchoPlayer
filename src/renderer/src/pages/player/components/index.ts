import styled from 'styled-components'

export { default as ControllerPanel } from './ControllerPanel'
export { default as ImportSubtitleButton } from './ImportSubtitleButton'
export { default as PlayerHeader } from './PlayerHeader'
export { default as PlayerSelector } from './PlayerSelector'
export { default as ProgressBar } from './ProgressBar'
export { default as SettingsPopover } from './SettingsPopover'
export { default as SubtitleContent } from './SubtitleContent'
export { default as SubtitleListPanel } from './SubtitleListPanel'
export { default as SubtitleOverlay } from './SubtitleOverlay'
export { default as TranscodeIndicator } from './TranscodeIndicator'
export { default as VideoErrorRecovery } from './VideoErrorRecovery'
export { default as VideoSurface } from './VideoSurface'

export const NavbarIcon = styled.div`
  -webkit-app-region: none;
  border-radius: 8px;
  height: 30px;
  padding: 0 7px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  .iconfont {
    font-size: 18px;
    color: var(--color-icon);
    &.icon-a-addchat {
      font-size: 20px;
    }
    &.icon-a-darkmode {
      font-size: 20px;
    }
    &.icon-appstore {
      font-size: 20px;
    }
  }
  .anticon {
    color: var(--color-icon);
    font-size: 16px;
  }
  &:hover {
    background-color: var(--color-background);
    color: var(--color-icon-white);
  }
`
