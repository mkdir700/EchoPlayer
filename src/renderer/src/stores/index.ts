// Export all stores from this index file
export { useUIStore } from './slices/uiStore'

// Export store types
export type { UIStore, UIState, UIActions } from './types'

// Export hooks
export { useFullscreenMode } from '../hooks/useFullscreenMode'
