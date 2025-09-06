// import '@renderer/databases'

import Sidebar from '@renderer/components/app/Sidebar'
import { useIsPlayerPage } from '@renderer/infrastructure'
import { HomePage, PlayerPage, SettingsPage } from '@renderer/pages'
import { FC, useMemo } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

import NavigationHandler from './infrastructure/handler/NavigationHandler'

const AppContent: FC = () => {
  const isPlayerPage = useIsPlayerPage()

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
