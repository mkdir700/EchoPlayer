import { UserTheme, useSettingsStore } from '@renderer/state/stores/settings.store'
import Color from 'color'

export default function useUserTheme() {
  const userTheme = useSettingsStore((state) => state.userTheme)

  const initUserTheme = (theme: UserTheme = userTheme) => {
    const colorPrimary = Color(theme.colorPrimary)

    document.body.style.setProperty('--color-primary', colorPrimary.toString())
    document.body.style.setProperty('--color-primary-soft', colorPrimary.alpha(0.6).toString())
    document.body.style.setProperty('--color-primary-mute', colorPrimary.alpha(0.3).toString())

    document.body.style.setProperty('--color-success', theme.colorSuccess)
    document.body.style.setProperty('--color-warning', theme.colorWarning)
    document.body.style.setProperty('--color-error', theme.colorError)

    document.body.style.setProperty('--border-radius', theme.borderRadius || 'medium')
  }

  const setUserTheme = (newTheme: Partial<UserTheme>) => {
    useSettingsStore.getState().setUserTheme({
      ...userTheme,
      ...newTheme
    })
    initUserTheme({
      ...userTheme,
      ...newTheme
    })
  }

  return {
    colorPrimary: userTheme.colorPrimary,
    colorSuccess: userTheme.colorSuccess,
    colorWarning: userTheme.colorWarning,
    colorError: userTheme.colorError,
    borderRadius: userTheme.borderRadius,

    initUserTheme,
    setUserTheme
  }
}
