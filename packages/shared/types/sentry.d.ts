export interface SentryMainOptions {
  dsn: string
  release?: string
  environment?: string
  sampleRate?: number
  enableNative?: boolean
  beforeSend?: (event: any, hint?: any) => any | null | Promise<any | null>
  beforeBreadcrumb?: (breadcrumb: any, hint?: any) => any | null
  initialScope?: {
    user?: any
    tags?: { [key: string]: string }
    contexts?: { [key: string]: any }
  }
  integrations?: any[]
  debug?: boolean
  maxBreadcrumbs?: number
  attachStacktrace?: boolean
  sendDefaultPii?: boolean
  serverName?: string
  captureUnhandledRejections?: boolean
  captureUncaughtException?: boolean
}

export interface SentryRendererOptions {
  dsn: string
  release?: string
  environment?: string
  sampleRate?: number
  beforeSend?: (event: any, hint?: any) => any | null | Promise<any | null>
  beforeBreadcrumb?: (breadcrumb: any, hint?: any) => any | null
  initialScope?: {
    user?: any
    tags?: { [key: string]: string }
    contexts?: { [key: string]: any }
  }
  integrations?: any[]
  debug?: boolean
  maxBreadcrumbs?: number
  attachStacktrace?: boolean
  sendDefaultPii?: boolean
  captureUnhandledRejections?: boolean
  captureConsoleIntegration?: boolean
  captureGlobalErrorHandlers?: boolean
}

declare module '@sentry/electron/main' {
  export function init(options: SentryMainOptions): void
  export function captureException(exception: any, hint?: any): string
  export function captureMessage(message: string, level?: string): string
  export function addBreadcrumb(breadcrumb: any): void
  export function configureScope(callback: (scope: any) => void): void
}

declare module '@sentry/electron/renderer' {
  export function init(options: SentryRendererOptions): void
  export function captureException(exception: any, hint?: any): string
  export function captureMessage(message: string, level?: string): string
  export function addBreadcrumb(breadcrumb: any): void
  export function configureScope(callback: (scope: any) => void): void
}
