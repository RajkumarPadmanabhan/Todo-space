import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import { applySavedTheme } from './theme'

applySavedTheme()

const root = document.getElementById('root')
if (!root) throw new Error('Root missing')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
