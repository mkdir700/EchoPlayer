import { app } from 'electron'

import { getDataPath } from './utils'
export const isDev = process.env.NODE_ENV === 'development'

if (isDev) {
  app.setPath('userData', app.getPath('userData') + 'Dev')
}

export const DATA_PATH = getDataPath()

export const titleBarOverlayDark = {
  color: '#1f1f1f',
  symbolColor: '#ffffff',
  height: 40
}

export const titleBarOverlayLight = {
  color: '#ffffff',
  symbolColor: '#000000',
  height: 40
}
