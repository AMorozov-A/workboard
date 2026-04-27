import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import '@shared/styles/tokens.css'
import '@shared/lib/i18n'
import App from './app/App'

declare const __APP_VERSION__: string

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element (#root) not found')
}

console.info(`WorkBoard: v${__APP_VERSION__}`)

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
