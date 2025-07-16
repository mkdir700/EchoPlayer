import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import {
  Play as IconPlay,
  Pause as IconPause,
  RotateCcw,
  Captions,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Volume1,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Zap,
  Check,
  Repeat
} from 'lucide-react'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import ProgressSection from './ProgressSection'

function TransportBar() {
  const paused = usePlayerStore((s) => s.paused)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const playbackRate = usePlayerStore((s) => s.playbackRate)
  const isFullscreen = usePlayerStore((s) => s.isFullscreen)

  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const setMuted = usePlayerStore((s) => s.setMuted)
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate)
  const setFullscreen = usePlayerStore((s) => s.setFullscreen)

  const setVolumeLevel = useCallback(
    (level: number) => {
      const clampedLevel = Math.max(0, Math.min(1, level))
      setVolume(clampedLevel)
      if (clampedLevel > 0 && muted) {
        setMuted(false)
      }
    },
    [setVolume, muted, setMuted]
  )

  const toggleMute = useCallback(() => {
    setMuted(!muted)
  }, [muted, setMuted])

  const setSpeed = useCallback(
    (rate: number) => {
      const clampedRate = Math.max(0.25, Math.min(3, rate))
      setPlaybackRate(clampedRate)
    },
    [setPlaybackRate]
  )

  const toggleFullscreen = useCallback(() => {
    setFullscreen(!isFullscreen)
  }, [isFullscreen, setFullscreen])
  // Phase 2: 下拉/弹出层状态与引用
  const [isRateOpen, setRateOpen] = useState(false)
  const [isVolumeOpen, setVolumeOpen] = useState(false)
  const rateControlRef = React.useRef<HTMLDivElement | null>(null)
  const volumeControlRef = React.useRef<HTMLDivElement | null>(null)
  const customVolumeSliderRef = React.useRef<HTMLDivElement | null>(null)
  const [loopOn, setLoopOn] = useState(false)

  const RATE_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  const VOLUME_KEY_POINTS = [
    { value: 0, label: '静音' },
    { value: 0.25, label: '25%' },
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1, label: '100%' }
  ]

  // 点击外部关闭下拉/弹层
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const rateEl = rateControlRef.current
      const volEl = volumeControlRef.current
      if (rateEl && !rateEl.contains(e.target as Node)) setRateOpen(false)
      if (volEl && !volEl.contains(e.target as Node)) setVolumeOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // 自定义音量滑条拖拽
  const onVolumeSliderMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const slider = customVolumeSliderRef.current
      if (!slider) return
      const rect = slider.getBoundingClientRect()
      const update = (clientX: number) => {
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        setVolumeLevel(ratio)
        if (ratio > 0 && muted) toggleMute()
      }
      update(e.clientX)

      const onMove = (evt: MouseEvent) => update(evt.clientX)
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [muted]
  )

  return (
    <BarContainer aria-label="transport-bar">
      {/* 进度条区域：独立组件隔离时间状态更新 */}
      <ProgressSection />

      {/* 控制按钮区域：左/中/右 三段布局，复刻 v1 紧凑结构 */}
      <MainControls>
        <LeftControls>
          {/* 仅 UI：循环、重新开始、字幕设置 */}
          <ToggleButton
            $active={loopOn}
            onClick={() => setLoopOn((v) => !v)}
            title="循环"
            aria-label="Loop"
          >
            <Repeat size={18} />
          </ToggleButton>
          <ClusterButton title="重新开始" aria-label="Restart">
            <RotateCcw size={18} />
          </ClusterButton>
          <ClusterButton title="字幕" aria-label="Captions">
            <Captions size={18} />
          </ClusterButton>
        </LeftControls>

        <CenterControls>
          {/* 仅 UI：上一/后退10s/播放-暂停/快进10s/下一 */}
          <ClusterButton title="上一条" aria-label="Previous">
            <SkipBack size={18} />
          </ClusterButton>
          <SeekButton title="后退10秒" aria-label="Seek back 10s">
            <Rewind size={18} />
          </SeekButton>

          <PlayPauseButton onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
            {paused ? <IconPlay size={18} /> : <IconPause size={18} />}
          </PlayPauseButton>

          <SeekButton title="快进10秒" aria-label="Seek forward 10s">
            <FastForward size={18} />
          </SeekButton>
          <ClusterButton title="下一条" aria-label="Next">
            <SkipForward size={18} />
          </ClusterButton>
        </CenterControls>

        <RightControls>
          {/* 倍速：紧凑按钮 + 下拉面板 */}
          <PlaybackRateControl ref={rateControlRef}>
            <RateButton onClick={() => setRateOpen((v) => !v)} aria-label="Playback rate">
              <Zap size={16} />
              <span>{playbackRate.toFixed(2).replace(/\.00$/, '')}x</span>
            </RateButton>
            {isRateOpen && (
              <RateDropdown role="menu">
                <RateGrid>
                  {RATE_OPTIONS.map((opt) => {
                    const active = Math.abs(opt - playbackRate) < 1e-6
                    return (
                      <RateOption
                        key={opt}
                        $active={active}
                        onClick={() => {
                          setSpeed(opt)
                          setRateOpen(false)
                        }}
                      >
                        <span>{opt}</span>
                        {active && <Check size={14} />}
                      </RateOption>
                    )
                  })}
                </RateGrid>
              </RateDropdown>
            )}
          </PlaybackRateControl>

          {/* 音量：按钮 + 弹出水平滑条（含关键刻度点） */}
          <VolumeControlWrap ref={volumeControlRef}>
            <ClusterButton
              onClick={() => setVolumeOpen((v) => !v)}
              aria-label="Toggle volume panel"
              title="音量"
            >
              {muted ? (
                <VolumeX size={18} />
              ) : volume > 0.5 ? (
                <Volume2 size={18} />
              ) : (
                <Volume1 size={18} />
              )}
            </ClusterButton>
            {isVolumeOpen && (
              <VolumePopup role="dialog">
                <CustomVolumeSlider
                  ref={customVolumeSliderRef}
                  onMouseDown={onVolumeSliderMouseDown}
                >
                  <CustomVolumeTrack />
                  <CustomVolumeFill style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
                  {VOLUME_KEY_POINTS.map((p) => (
                    <CustomVolumeKeyPoint
                      key={p.value}
                      style={{ left: `${p.value * 100}%` }}
                      $active={Math.abs((muted ? 0 : volume) - p.value) < 0.05}
                      onClick={(e) => {
                        e.stopPropagation()
                        setVolumeLevel(p.value)
                        if (p.value > 0 && muted) toggleMute()
                      }}
                      title={p.label}
                    />
                  ))}
                  <CustomVolumeHandle style={{ left: `${(muted ? 0 : volume) * 100}%` }} />
                </CustomVolumeSlider>
              </VolumePopup>
            )}
          </VolumeControlWrap>

          {/* 全屏 & 设置：仅 UI */}
          <ClusterButton onClick={toggleFullscreen} aria-label="Toggle fullscreen" title="全屏">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </ClusterButton>
          <ClusterButton title="设置" aria-label="Settings">
            <Settings size={18} />
          </ClusterButton>
        </RightControls>
      </MainControls>
    </BarContainer>
  )
}

export default TransportBar

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

const CenterControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1 1 auto;
`
const SeekButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-background-soft);
  color: var(--color-text-2);
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border: 1px solid var(--color-border);

  &:hover {
    background: var(--color-hover);
    color: var(--color-text-1);
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
  }
`

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 140px;
  justify-content: flex-end;
`

const PlayPauseButton = styled.button`
  background: var(--color-primary);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: var(--color-white);
  font-size: 18px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--color-primary-mute);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    filter: brightness(1.1);
    transform: scale(1.05);
    box-shadow: 0 6px 16px var(--color-primary-soft);
  }
  &:active {
    transform: scale(0.95);
  }
`

const ClusterButton = styled.button`
  position: relative;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-2);
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;

  &:hover {
    background: var(--color-hover);
    color: var(--color-text-1);
    transform: scale(1.05);
  }
  &:active {
    background: var(--color-active);
    transform: scale(0.95);
  }
`

const ToggleButton = styled(ClusterButton)<{ $active?: boolean }>`
  color: ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-text-2)')};
  &:hover {
    background: var(--color-hover);
    color: ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-text-1)')};
  }
`

// Phase 2: 倍速下拉
const PlaybackRateControl = styled.div`
  position: relative;
`
const RateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 64px;
  height: 32px;
  font-size: 12px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  &:hover {
    background: var(--color-hover);
    transform: scale(1.02);
  }
`

const RateDropdown = styled.div`
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--modal-background-glass);
  border: 1px solid var(--modal-border-color);
  border-radius: 10px;
  box-shadow: var(--modal-shadow);
  backdrop-filter: blur(20px);
  padding: 12px 14px;
  z-index: 1000;
  min-width: 240px;
  color: var(--color-text);
`
const RateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-xs, 8px);
`
const RateOption = styled.button<{ $active?: boolean }>`
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid ${(props) => (props.$active ? 'var(--color-primary)' : 'var(--color-border)')};
  background: ${(props) =>
    props.$active ? 'var(--color-primary-mute)' : 'var(--color-background-soft)'};
  color: var(--color-text-1);
  min-height: 28px;
  transition: all 0.15s ease;
  &:hover {
    background: ${(props) => (props.$active ? 'var(--color-primary-soft)' : 'var(--color-hover)')};
  }
`

// Phase 2: 音量弹出
const VolumeControlWrap = styled.div`
  position: relative;
`
const VolumePopup = styled.div`
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--modal-background-glass);
  padding: 12px 14px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  box-shadow: var(--modal-shadow);
  border: 1px solid var(--modal-border-color);
  z-index: 1000;
`
const CustomVolumeSlider = styled.div`
  position: relative;
  width: 180px;
  height: 16px;
  cursor: pointer;
`
const CustomVolumeTrack = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-border);
  border-radius: 1.5px;
  transform: translateY(-50%);
`
const CustomVolumeFill = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px;
  transform: translateY(-50%);
  transition: width 0.15s ease;
`
const CustomVolumeHandle = styled.div`
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px var(--color-border);
`
const CustomVolumeKeyPoint = styled.div<{ $active?: boolean }>`
  position: absolute;
  top: 50%;
  width: ${(p) => (p.$active ? 8 : 6)}px;
  height: ${(p) => (p.$active ? 8 : 6)}px;
  background: ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-text-3)')};
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.15s ease;
`
