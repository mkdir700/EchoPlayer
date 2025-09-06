import { type UpdateState, useRuntimeStore } from '@renderer/state/stores/runtime'

/**
 * Runtime hook that provides convenient access to runtime state and actions
 * Wraps useRuntimeStore with simplified interface for update state management
 */
export function useRuntime() {
  const store = useRuntimeStore()

  return {
    /**
     * Current update state including info, progress, and flags
     */
    update: store.update,

    /**
     * Current file path
     */
    filePath: store.filePath,

    /**
     * Update multiple update state properties at once
     */
    setUpdateState: (updates: Partial<UpdateState>) => {
      store.setUpdateState(updates)
    },

    /**
     * Set checking state for update process
     */
    setChecking: (checking: boolean) => {
      store.setChecking(checking)
    },

    /**
     * Set downloading state
     */
    setDownloading: (downloading: boolean) => {
      store.setDownloading(downloading)
    },

    /**
     * Set downloaded state
     */
    setDownloaded: (downloaded: boolean) => {
      store.setDownloaded(downloaded)
    },

    /**
     * Set download progress (0-100)
     */
    setDownloadProgress: (progress: number) => {
      store.setDownloadProgress(progress)
    },

    /**
     * Set update available state
     */
    setAvailable: (available: boolean) => {
      store.setAvailable(available)
    },

    /**
     * Clear all update state and reset to initial values
     */
    clearUpdateState: () => {
      store.clearUpdateState()
    },

    /**
     * Set update info from electron updater
     */
    setUpdateInfo: (info: any) => {
      store.setUpdateInfo(info)
    },

    /**
     * Set current file path
     */
    setFilePath: (path: string) => {
      store.setFilePath(path)
    }
  }
}

export default useRuntime
