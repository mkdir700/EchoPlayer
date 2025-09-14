import { loggerService } from './services/Logger'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  import('@sentry/electron/renderer')
    .then(({ init }) => init({ dsn: sentryDsn, environment: import.meta.env.MODE }))
    .catch(() => {})
}

loggerService.initWindowSource('mainWindow')
