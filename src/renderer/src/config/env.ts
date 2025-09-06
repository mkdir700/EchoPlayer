/**
 * Application Configuration Constants
 * 应用程序配置常量
 */
export { default as AppLogo } from '@renderer/assets/images/logo.svg'

// Application name from package.json
export const APP_NAME = 'EchoPlayer'

// Application description
export const APP_DESCRIPTION = 'EchoPlayer is a video player designed for language learners'

// Website and repository URLs
export const APP_WEBSITE = 'https://echoplayer.cc'
export const APP_REPOSITORY = 'https://github.com/mkdir700/echoplayer'
export const APP_ISSUES = `${APP_REPOSITORY}/issues`
export const APP_RELEASES = `${APP_REPOSITORY}/releases`
export const APP_LICENSE = `${APP_REPOSITORY}/blob/main/LICENSE`

// Support contact
export const SUPPORT_EMAIL = 'support@echoplayer.cc'

// Developer options
export const ENABLE_DEVTOOLS = process.env.NODE_ENV === 'development'
