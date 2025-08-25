import React from 'react'
import styled from 'styled-components'

import ProgressSection from '../ProgressSection'
import CaptionsButton from './controls/CaptionsButton'
import FullscreenButton from './controls/FullscreenButton'
import LoopControl from './controls/LoopControl'
import AutoPauseButton from './controls/PauseControl'
import PlaybackRateControl from './controls/PlaybackRateControl'
import SettingsButton from './controls/SettingsButton'
import TransportControls from './controls/TransportControls'
import VolumeControl from './controls/VolumeControl'
import { usePlayerShortcuts } from './hooks/usePlayerShortcuts'

function ControllerPanel() {
  // 注册快捷键（仅在播放器页面挂载时生效）
  usePlayerShortcuts()

  return (
    <BarContainer aria-label="transport-bar">
      {/* 进度条区域：独立组件隔离时间状态更新 */}
      <ProgressSection />

      {/* 控制按钮区域：左/中/右 三段布局，复刻 v1 紧凑结构 */}
      <MainControls>
        <LeftControls>
          {/* 仅 UI：循环、重新开始、字幕设置 */}
          <LoopControl />
          <AutoPauseButton />
          <CaptionsButton />
        </LeftControls>

        <TransportControls />

        <RightControls>
          {/* 倍速 */}
          <PlaybackRateControl />

          {/* 音量 */}
          <VolumeControl />

          {/* 全屏 & 设置 */}
          <FullscreenButton />
          <SettingsButton />
        </RightControls>
      </MainControls>
    </BarContainer>
  )
}

export default ControllerPanel

const BarContainer = styled.div`
  width: 100%;
  min-height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px 16px;
  box-sizing: border-box;
  background: var(--color-group-background, var(--color-background-soft));
  border-top: 1px solid var(--color-border);
`

const MainControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 40px; /* 减少最小高度 */
  padding: 0 2px; /* 减少左右内边距 */
  flex-shrink: 0; /* 防止控制区域被压缩 */
`

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 140px;
`

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 140px;
  justify-content: flex-end;
`
