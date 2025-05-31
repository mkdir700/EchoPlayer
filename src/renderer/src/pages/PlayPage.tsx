import React, { useState, useCallback } from 'react'
import { VideoSection } from '@renderer/components/VideoSection/VideoSection'
import { SidebarSectionContainer } from '@renderer/components/SidebarSection/SidebarSectionContainer'
import { PlayPageHeader } from '@renderer/components/PlayPageHeader'
import { SubtitleLoadModal } from '@renderer/components/SubtitleLoadModal'

// 导入所需的 hooks
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useSubtitleDisplayMode } from '@renderer/hooks/useSubtitleDisplayMode'
import { useShortcutCommand, useCommandShortcuts } from '@renderer/hooks/useCommandShortcuts'
import { usePlayStateSaver } from '@renderer/hooks/usePlayStateSaver'
import { usePlayStateInitializer } from '@renderer/hooks/usePlayStateInitializer'
import {
  useVideoDuration,
  useVideoTimeRef,
  useVideoStateRefs,
  useVideoControls
} from '@renderer/hooks/useVideoPlayerHooks'
import { VOLUME_SETTINGS } from '@renderer/constants'

import type { SubtitleItem } from '@types_/shared'
import styles from './PlayPage.module.css'
import { Splitter } from 'antd'

interface PlayPageProps {
  onBack: () => void
}

export const PlayPage = React.memo<PlayPageProps>(function PlayPage({ onBack }) {
  // 使用新的优化 hooks
  const duration = useVideoDuration()
  const currentTimeRef = useVideoTimeRef()
  const { volumeRef } = useVideoStateRefs()
  const { toggle, stepBackward, stepForward, setVolume } = useVideoControls()

  // 其他 hooks
  const subtitleListContext = useSubtitleListContext()
  const subtitleDisplayMode = useSubtitleDisplayMode()

  // 视频进度保存
  const { savePlayStateRef } = usePlayStateSaver({
    currentTimeRef: currentTimeRef,
    duration: duration
  })

  // 使用播放状态初始化 hook
  const { pendingVideoInfo, setPendingVideoInfo, showSubtitleModal, setShowSubtitleModal } =
    usePlayStateInitializer({
      showSubtitleModal: false, // 初始值
      savePlayStateRef
    })

  // 初始化命令式快捷键系统
  useCommandShortcuts()

  // 注册核心快捷键命令
  useShortcutCommand('playPause', toggle)
  useShortcutCommand('stepBackward', stepBackward)
  useShortcutCommand('stepForward', stepForward)
  useShortcutCommand('toggleSubtitleMode', subtitleDisplayMode.toggleDisplayMode)

  // 音量控制命令
  useShortcutCommand('volumeUp', () => {
    const newVolume = Math.min(
      VOLUME_SETTINGS.MAX,
      volumeRef.current + VOLUME_SETTINGS.KEYBOARD_STEP
    )
    setVolume(newVolume)
  })

  useShortcutCommand('volumeDown', () => {
    const newVolume = Math.max(
      VOLUME_SETTINGS.MIN,
      volumeRef.current - VOLUME_SETTINGS.KEYBOARD_STEP
    )
    setVolume(newVolume)
  })

  // 全屏状态管理
  const [isFullscreen, setIsFullscreen] = useState(false)

  // region 字幕Modal

  // 处理字幕Modal的回调
  const handleSubtitleModalCancel = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [setPendingVideoInfo, setShowSubtitleModal])

  // 跳过字幕Modal
  const handleSubtitleModalSkip = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [setPendingVideoInfo, setShowSubtitleModal])

  // 字幕加载完成处理函数
  const handleSubtitlesLoaded = useCallback(
    async (loadedSubtitles: SubtitleItem[]) => {
      // 加载字幕到应用状态
      subtitleListContext.restoreSubtitles(loadedSubtitles, 0)
      setShowSubtitleModal(false)
      setPendingVideoInfo(null)

      // 立即保存字幕数据
      if (savePlayStateRef.current) {
        console.log('📝 字幕加载完成，立即保存字幕数据')
        await savePlayStateRef.current(true)
      }
    },
    [savePlayStateRef, setPendingVideoInfo, setShowSubtitleModal, subtitleListContext]
  )

  // endregion

  const handleBack = useCallback(async () => {
    console.log('🔙 处理返回操作')
    // 退出前保存一次进度
    if (savePlayStateRef.current) {
      await savePlayStateRef.current(true)
    }
    onBack()
  }, [onBack, savePlayStateRef])

  return (
    <div className={styles.playPageContainer}>
      {/* 播放页面独立Header */}
      <PlayPageHeader onBack={handleBack} />

      <div className={styles.playPageContent}>
        {/* 分割线 - 更细更现代 */}
        <Splitter style={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
          <Splitter.Panel defaultSize="70%" min="50%" max="70%">
            <div className={styles.mainContentArea}>
              {/* 视频播放区域 - 占据主要空间 */}
              <div className={styles.videoPlayerSection}>
                <VideoSection
                  displayModeRef={subtitleDisplayMode.displayModeRef}
                  isFullscreen={isFullscreen}
                  onFullscreenChange={setIsFullscreen}
                  onFullscreenToggleReady={() => {}}
                  onDisplayModeChange={subtitleDisplayMode.setDisplayMode}
                />
              </div>
            </div>
          </Splitter.Panel>
          <Splitter.Panel>
            {/* 字幕列表区域 - 无缝集成 */}
            <div className={styles.sidebarSection}>
              <SidebarSectionContainer />
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>

      {/* 字幕检查Modal - 移入PlayPage */}
      <SubtitleLoadModal
        visible={showSubtitleModal}
        videoFilePath={pendingVideoInfo?.filePath || ''}
        onCancel={handleSubtitleModalCancel}
        onSkip={handleSubtitleModalSkip}
        onSubtitlesLoaded={handleSubtitlesLoaded}
      />
    </div>
  )
})
