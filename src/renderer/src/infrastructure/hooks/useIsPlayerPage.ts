import { useMatch } from 'react-router-dom'

/**
 * Hook to determine if the current route is a player page.
 * Uses React Router's useMatch for proper route matching instead of string comparison.
 *
 * @returns boolean indicating if current route matches /player/:id pattern
 */
export const useIsPlayerPage = (): boolean => {
  return Boolean(useMatch('/player/:id'))
}
