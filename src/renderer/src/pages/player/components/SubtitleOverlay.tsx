// import { usePlayerStore } from '@renderer/state/stores/player.store'
// import useRuntimeStore from '@renderer/state/stores/runtime'
// import useVideoProjectStore from '@renderer/state/stores/video-project.store'
// import { SubtitleDisplayMode } from '@types'
// import { useMemo } from 'react'
// import styled from 'styled-components'

// import { useSubtitleEngine } from '../hooks'
// import { useSubtitles } from '../state/player-context'

// function SubtitleOverlay() {
//   const currentTime = usePlayerStore((s) => s.currentTime)
//   const currentVideoId = useRuntimeStore((s) => s.currentVideoId)
//   const subtitles = useSubtitles()

//   // 获取当前视频的字幕设置（遵守 Hooks 规则：不要在 useMemo 内调用 Hook）
//   const getConfig = useVideoProjectStore((s) => s.getConfig)
//   const currentSettings = useMemo(() => {
//     if (!currentVideoId) return null
//     return getConfig(currentVideoId)
//   }, [currentVideoId, getConfig])

//   // 使用字幕引擎查找当前字幕
//   const { currentSubtitle } = useSubtitleEngine(subtitles, currentTime)

//   // 根据显示模式决定要显示的文本
//   const displayText = useMemo(() => {
//     if (!currentSubtitle || !currentSettings) return null

//     const displayMode = currentSettings.subtitle.displayMode
//     const { originalText, translatedText } = currentSubtitle

//     switch (displayMode) {
//       case SubtitleDisplayMode.NONE:
//         return null
//       case SubtitleDisplayMode.ORIGINAL:
//         return originalText
//       case SubtitleDisplayMode.TRANSLATED:
//         return translatedText || originalText
//       case SubtitleDisplayMode.BILINGUAL:
//         return translatedText ? `${originalText}\n${translatedText}` : originalText
//       default:
//         return originalText
//     }
//   }, [currentSubtitle, currentSettings])

//   // 如果没有要显示的文本，不渲染
//   if (!displayText) {
//     return <OverlayContainer aria-label="subtitle-overlay" />
//   }

//   return (
//     <OverlayContainer aria-label="subtitle-overlay">
//       <SubtitleBubble settings={currentSettings}>
//         {displayText.split('\n').map((line, index) => (
//           <div key={index}>{line}</div>
//         ))}
//       </SubtitleBubble>
//     </OverlayContainer>
//   )
// }

// export default SubtitleOverlay

// const OverlayContainer = styled.div`
//   position: absolute;
//   inset: 0;
//   pointer-events: none;
//   display: flex;
//   align-items: flex-end;
//   justify-content: center;
//   padding: var(--subtitle-safe-area-bottom, 6%) var(--subtitle-safe-area-horizontal, 24px);
// `

// const SubtitleBubble = styled.div<{ settings: any }>`
//   max-width: 80%;
//   padding: var(--subtitle-padding, 10px 14px);
//   border-radius: var(--subtitle-radius, 14px);
//   background: ${(props) => {
//     const bgType = props.settings?.displaySettings?.backgroundType
//     switch (bgType) {
//       case 'transparent':
//         return 'transparent'
//       case 'blur':
//         return 'rgba(0, 0, 0, 0.5)'
//       case 'solid-black':
//         return 'rgba(0, 0, 0, 0.8)'
//       case 'solid-gray':
//         return 'rgba(128, 128, 128, 0.8)'
//       default:
//         return 'var(--subtitle-bg, rgba(0, 0, 0, 0.5))'
//     }
//   }};
//   color: ${(props) => props.settings?.displaySettings?.fontColor || 'var(--subtitle-text, #fff)'};
//   font-size: ${(props) => {
//     const fontSize = props.settings?.displaySettings?.fontSize
//     return fontSize ? `${fontSize}px` : 'calc(16px * var(--subtitle-font-scale, 1))'
//   }};
//   font-family: ${(props) => props.settings?.displaySettings?.fontFamily || 'inherit'};
//   line-height: 1.4;
//   text-align: center;
//   opacity: ${(props) => props.settings?.displaySettings?.opacity || 1};
//   backdrop-filter: ${(props) => {
//     const bgType = props.settings?.displaySettings?.backgroundType
//     return bgType === 'blur' ? 'blur(4px)' : 'none'
//   }};
// `
