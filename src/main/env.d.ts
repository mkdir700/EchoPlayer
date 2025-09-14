/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_MAIN_BUNDLE_ID: string
  VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
