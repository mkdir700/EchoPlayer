// import '@renderer/databases'

import Sidebar from '@renderer/components/app/Sidebar'
import { HomePage, PlayerPage, SettingsPage } from '@renderer/pages'
import { FC, useMemo } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'

import NavigationHandler from './infrastructure/handler/NavigationHandler'

const AppContent: FC = () => {
  const location = useLocation()
  const isPlayerPage = location.pathname.startsWith('/player/')

  const routes = useMemo(() => {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
      </Routes>
    )
  }, [])

  return (
    <>
      {!isPlayerPage && <Sidebar />}
      {routes}
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
