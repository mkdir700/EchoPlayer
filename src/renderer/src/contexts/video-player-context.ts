import React, { createContext } from 'react'
import ReactPlayer from 'react-player'

export interface VideoPlayerContextType {
  // Refs - 避免频繁重渲染
  currentTimeRef: React.RefObject<number>
  durationRef: React.RefObject<number>
  playbackRateRef: React.RefObject<number>
  volumeRef: React.RefObject<number>
  isPlayingRef: React.RefObject<boolean>
  isDraggingRef: React.RefObject<boolean>
  isVideoLoadedRef: React.RefObject<boolean>
  videoErrorRef: React.RefObject<string | null>

  // 播放器引用
  playerRef: React.RefObject<ReactPlayer | null>

  // 订阅机制 - 用于需要响应变化的组件
  timeSubscribers: Set<(time: number) => void>
  playStateSubscribers: Set<(isPlaying: boolean) => void>
  durationSubscribers: Set<(duration: number) => void>
  loadStateSubscribers: Set<(isLoaded: boolean) => void>
  errorSubscribers: Set<(error: string | null) => void>

  // 订阅方法
  subscribeToTime: (callback: (time: number) => void) => () => void
  subscribeToPlayState: (callback: (isPlaying: boolean) => void) => () => void
  subscribeToDuration: (callback: (duration: number) => void) => () => void
  subscribeToLoadState: (callback: (isLoaded: boolean) => void) => () => void
  subscribeToError: (callback: (error: string | null) => void) => () => void

  // 控制方法
  updateTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  setDuration: (duration: number) => void
  setDragging: (dragging: boolean) => void
  setVideoLoaded: (loaded: boolean) => void
  setVideoError: (error: string | null) => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void

  // 播放控制
  play: () => void
  pause: () => void
  toggle: () => void
  seekTo: (time: number) => void
  stepForward: () => void
  stepBackward: () => void
  restart: () => void

  // 状态重置和恢复
  resetVideoState: () => void
  restoreVideoState: (currentTime: number, playbackRate: number, volume: number) => void
}

export const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null)
