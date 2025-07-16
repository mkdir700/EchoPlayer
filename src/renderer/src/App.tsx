import { loggerService } from '@logger'
import { AntdProvider, ThemeProvider } from '@renderer/contexts'
import React from 'react'

import { SearchOverlay } from './components/SearchOverlay'
import TopViewContainer from './components/TopView'
import Router from './Router'

const logger = loggerService.withContext('App.tsx')

function App(): React.JSX.Element {
  logger.info('App initialized')

  return (
    <ThemeProvider>
      <AntdProvider>
        <TopViewContainer>
          <Router />
          <SearchOverlay />
        </TopViewContainer>
      </AntdProvider>
    </ThemeProvider>
  )
}

export default App
