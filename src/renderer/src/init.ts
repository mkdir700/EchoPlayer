import { loggerService } from './services/Logger'
import { sentryRendererService } from './services/SentryService'

// 初始化 Sentry（尽早初始化以捕获所有错误）
sentryRendererService.init().catch(() => {
  // 静默处理初始化失败，避免影响应用启动
})

loggerService.initWindowSource('mainWindow')
