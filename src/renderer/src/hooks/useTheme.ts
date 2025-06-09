import { theme } from 'antd'
import { useMemo } from 'react'
import { buildStyles } from '@renderer/styles'
import { buildUtils } from '@renderer/hooks/useThemeUtils'
import type { UseThemeReturn } from '@renderer/types/theme'

/**
 * Provides a unified React hook for accessing theme tokens, predefined style objects, and utility functions for consistent UI theming.
 *
 * The returned object includes:
 * - `token`: The current Ant Design theme token.
 * - `styles`: A comprehensive set of reusable CSS-in-JS style objects for various UI components and states.
 * - `utils`: Utility functions for color conversion, time formatting, hover style creation, and poster background generation.
 *
 * @returns An object containing theme tokens, style definitions, and theme-related utility functions for use throughout the application.
 */
export function useTheme(): UseThemeReturn {
  const { token } = theme.useToken()

  const styles = useMemo(() => buildStyles(token), [token])
  const utils = useMemo(() => buildUtils(), [])

  return { token, styles, utils }
}

export default useTheme
