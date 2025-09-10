// import '@renderer/databases'

import Sidebar from '@renderer/components/app/Sidebar'
import { useIsPlayerPage } from '@renderer/infrastructure'
import { HomePage, PlayerPage, SettingsPage } from '@renderer/pages'
import { FC } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

import { SearchOverlay } from './components/SearchOverlay'
import NavigationHandler from './infrastructure/handler/NavigationHandler'

const AppContent: FC = () => {
  const isPlayerPage = useIsPlayerPage()

  const routes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/player/:id" element={<PlayerPage />} />
      <Route path="/settings/*" element={<SettingsPage />} />
    </Routes>
  )

  return (
    <>
      {!isPlayerPage && <Sidebar />}
      {routes}
      <SearchOverlay />
      <NavigationHandler />
    </>
  )
}

const Router: FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}

export default Router
