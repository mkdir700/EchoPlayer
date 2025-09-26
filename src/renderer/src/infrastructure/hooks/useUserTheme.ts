import { UserTheme, useSettingsStore } from '@renderer/state/stores/settings.store'
import Color from 'color'

export default function useUserTheme() {
  const userTheme = useSettingsStore((state) => state.userTheme)

  const initUserTheme = (theme: UserTheme = userTheme) => {
    const colorPrimary = Color(theme.colorPrimary)

    // 设置自定义 CSS 变量
    document.body.style.setProperty('--color-primary', colorPrimary.toString())
    document.body.style.setProperty('--color-primary-soft', colorPrimary.alpha(0.6).toString())
    document.body.style.setProperty('--color-primary-mute', colorPrimary.alpha(0.3).toString())

    document.body.style.setProperty('--color-success', theme.colorSuccess)
    document.body.style.setProperty('--color-warning', theme.colorWarning)
    document.body.style.setProperty('--color-error', theme.colorError)

    document.body.style.setProperty('--border-radius', theme.borderRadius || 'medium')

    // 同时更新 Ant Design 的 CSS 变量（如果启用了 cssVar: true）
    // Ant Design 使用 :root 选择器设置 CSS 变量
    const root = document.documentElement
    root.style.setProperty('--ant-color-primary', theme.colorPrimary)
    root.style.setProperty('--ant-color-success', theme.colorSuccess)
    root.style.setProperty('--ant-color-warning', theme.colorWarning)
    root.style.setProperty('--ant-color-error', theme.colorError)
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
