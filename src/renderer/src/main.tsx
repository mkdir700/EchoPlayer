import './assets/main.css'

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

// // 只在开发模式下初始化 stagewise toolbar
// if (process.env.NODE_ENV === 'development') {
//   import('@stagewise/toolbar-react').then(({ StagewiseToolbar }) => {
//     const toolbarConfig = {
//       plugins: []
//     }

//     const initToolbar = (): void => {
//       const toolbarRoot = document.createElement('div')
//       toolbarRoot.id = 'stagewise-toolbar-root'
//       document.body.appendChild(toolbarRoot)

//       createRoot(toolbarRoot).render(
//         <StrictMode>
//           <StagewiseToolbar config={toolbarConfig} />
//         </StrictMode>
//       )
//     }

//     // 确保 DOM 已加载
//     if (document.readyState === 'loading') {
//       document.addEventListener('DOMContentLoaded', initToolbar)
//     } else {
//       initToolbar()
//     }
//   })
// }
