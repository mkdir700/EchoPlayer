import './assets/styles/index.scss'
import '@ant-design/v5-patch-for-react-19'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

// 渲染主应用
const AppComponent =
  process.env.NODE_ENV === 'development' ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  )

createRoot(document.getElementById('root')!).render(AppComponent)
