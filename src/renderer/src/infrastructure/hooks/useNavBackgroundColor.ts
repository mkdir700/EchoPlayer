import { isMac } from '../constants'
import { useSettings } from './useSettings'

function useNavBackgroundColor() {
  const { windowStyle } = useSettings()

  const macTransparentWindow = isMac && windowStyle === 'transparent'

  if (macTransparentWindow) {
    return 'transparent'
  }

  return 'var(--navbar-background)'
}

export default useNavBackgroundColor
