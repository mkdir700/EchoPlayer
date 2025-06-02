import React, { useCallback, useMemo } from 'react'
import { VideoSection } from '@renderer/components/VideoSection/VideoSection'
import { SidebarSectionContainer } from '@renderer/components/SidebarSection/SidebarSectionContainer'
import { PlayPageHeader } from '@renderer/components/PlayPageHeader'
import { SubtitleLoadModal } from '@renderer/components/SubtitleLoadModal'

// 导入所需的 hooks
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useShortcutCommand, useCommandShortcuts } from '@renderer/hooks/useCommandShortcuts'
import { usePlayStateSaver } from '@renderer/hooks/usePlayStateSaver'
import { usePlayStateInitializer } from '@renderer/hooks/usePlayStateInitializer'
import { useVideoStateRefs, useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { CurrentSubtitleDisplayProvider } from '@renderer/contexts/CurrentSubtitleDisplayContext'
import { VOLUME_SETTINGS } from '@renderer/constants'
import type { SubtitleItem } from '@types_/shared'

import styles from './PlayPage.module.css'
import { Splitter } from 'antd'
import { VideoPlaybackSettingsProvider } from '@renderer/contexts/VideoPlaybackSettingsContext'

interface PlayPageProps {
  onBack: () => void
}

// 🚀 性能优化：自定义比较函数，只在 onBack 真正改变时才重新渲染
const PlayPageMemo = React.memo<PlayPageProps>(
  function PlayPage({ onBack }) {
    // 📊 移除频繁的渲染日志，避免性能影响
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 PlayPage 渲染 - ', new Date().toLocaleTimeString())
    }

    // 📹 视频播放相关 hooks - 稳定的引用
    const { volumeRef } = useVideoStateRefs()
    const { toggle, stepBackward, stepForward, setVolume } = useVideoControls()

    // 📋 字幕相关 hooks - 稳定的引用
    const subtitleListContext = useSubtitleListContext()

    // 💾 播放状态保存 - 🚀 已优化，不会导致重新渲染
    const { savePlayStateRef } = usePlayStateSaver()

    // 🔄 播放状态初始化
    const { pendingVideoInfo, setPendingVideoInfo, showSubtitleModal, setShowSubtitleModal } =
      usePlayStateInitializer({
        showSubtitleModal: false,
        savePlayStateRef
      })

    // 🚀 初始化命令式快捷键系统 - 只执行一次
    useCommandShortcuts()

    // ⌨️ 快捷键命令注册 - 使用稳定的引用
    const shortcutCommands = useMemo(
      () => ({
        playPause: toggle,
        stepBackward: stepBackward,
        stepForward: stepForward,
        volumeUp: () => {
          const newVolume = Math.min(
            VOLUME_SETTINGS.MAX,
            volumeRef.current + VOLUME_SETTINGS.KEYBOARD_STEP
          )
          setVolume(newVolume)
        },
        volumeDown: () => {
          const newVolume = Math.max(
            VOLUME_SETTINGS.MIN,
            volumeRef.current - VOLUME_SETTINGS.KEYBOARD_STEP
          )
          setVolume(newVolume)
        }
      }),
      [toggle, stepBackward, stepForward, volumeRef, setVolume]
    )

    // 注册快捷键 - 使用稳定的引用避免重新绑定
    useShortcutCommand('playPause', shortcutCommands.playPause)
    useShortcutCommand('stepBackward', shortcutCommands.stepBackward)
    useShortcutCommand('stepForward', shortcutCommands.stepForward)
    useShortcutCommand('volumeUp', shortcutCommands.volumeUp)
    useShortcutCommand('volumeDown', shortcutCommands.volumeDown)

    // 📝 字幕模态框处理函数
    const handleSubtitleModalCancel = useCallback(() => {
      setShowSubtitleModal(false)
      setPendingVideoInfo(null)
    }, [setPendingVideoInfo, setShowSubtitleModal])

    const handleSubtitleModalSkip = useCallback(() => {
      setShowSubtitleModal(false)
      setPendingVideoInfo(null)
    }, [setPendingVideoInfo, setShowSubtitleModal])

    const handleSubtitlesLoaded = useCallback(
      async (loadedSubtitles: SubtitleItem[]) => {
        // 加载字幕到应用状态
        subtitleListContext.restoreSubtitles(loadedSubtitles, 0)
        setShowSubtitleModal(false)
        setPendingVideoInfo(null)

        // 立即保存字幕数据
        if (savePlayStateRef.current) {
          console.log('📝 字幕加载完成，立即保存字幕数据')
          try {
            await savePlayStateRef.current(true)
          } catch (error) {
            console.error('保存字幕数据失败:', error)
          }
        }
      },
      [savePlayStateRef, setPendingVideoInfo, setShowSubtitleModal, subtitleListContext]
    )

    // 🔙 返回处理 - 优化性能，确保保存状态
    const handleBack = useCallback(async () => {
      console.log('🔙 处理返回操作')
      // 退出前保存一次进度
      if (savePlayStateRef.current) {
        try {
          await savePlayStateRef.current(true)
          console.log('✅ 退出前保存进度成功')
        } catch (error) {
          console.error('❌ 退出前保存进度失败:', error)
        }
      }
      onBack()
    }, [onBack, savePlayStateRef])

    return (
      <CurrentSubtitleDisplayProvider>
        <VideoPlaybackSettingsProvider>
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
                      <VideoSection />
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
        </VideoPlaybackSettingsProvider>
      </CurrentSubtitleDisplayProvider>
    )
  },
  (prevProps, nextProps) => {
    // 🎯 精确比较：只有当 onBack 函数真正改变时才重新渲染
    return prevProps.onBack === nextProps.onBack
  }
)

// 设置组件显示名称，便于调试
PlayPageMemo.displayName = 'PlayPage'

export const PlayPage = PlayPageMemo
