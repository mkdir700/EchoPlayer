import {
  CurrentSubtitleDisplayContext,
  type ICurrentSubtitleDisplayContextType
} from '../../contexts/current-subtitle-display-context'

export function useCurrentSubtitleDisplayContext(): ICurrentSubtitleDisplayContextType {
  const context = use(CurrentSubtitleDisplayContext)
  if (!context) {
    throw new Error(
      'useCurrentSubtitleDisplayContext 必须在 CurrentSubtitleDisplayProvider 内部使用'
    )
  }

  return context
}
