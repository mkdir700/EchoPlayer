// Export all stores from this index file
export { useUIStore } from './slices/uiStore'
export {
  useVideoConfigStore,
  useSubtitleLayoutLocked,
  useSetSubtitleLayoutLocked
} from './slices/videoConfigStore'

// Export store types
export type { UIStore, UIState, UIActions } from './types'
export type {
  VideoConfigStore,
  VideoConfigState,
  VideoConfigActions,
  VideoConfig
} from './slices/videoConfigStore'

// Export hooks
export { useFullscreenMode } from '../hooks/useFullscreenMode'
