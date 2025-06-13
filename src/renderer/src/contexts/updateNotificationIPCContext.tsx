import { useUpdateNotificationIPC } from '../hooks/useUpdateNotificationIPC'
import React from 'react'

/**
 * Provider component to ensure IPC integration is active
 * 提供者组件，确保IPC集成处于活动状态
 */
export function UpdateNotificationIPCProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  // Initialize IPC integration
  useUpdateNotificationIPC()

  return <>{children}</>
}
