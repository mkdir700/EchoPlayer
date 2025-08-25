// import '@renderer/databases'

import Sidebar from '@renderer/components/app/Sidebar'
import { HomePage, PlayerPage, SettingsPage } from '@renderer/pages'
import { FC, useMemo } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

import NavigationHandler from './infrastructure/handler/NavigationHandler'

const Router: FC = () => {
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
    <HashRouter>
      <Sidebar />
      {routes}
      <NavigationHandler />
    </HashRouter>
  )
}

export default Router
