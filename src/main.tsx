import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { migrateToWorkspaces } from './lib/storage.ts'

migrateToWorkspaces()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service workers only exist on http(s); the Electron build runs on a custom protocol.
if (import.meta.env.PROD && location.protocol.startsWith('http')) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}
