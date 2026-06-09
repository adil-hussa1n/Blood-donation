import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { dismissPreloader, initPreloaderSafety } from './preloader.js'

initPreloaderSafety()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Wait for React's first paint, then fade out after the minimum display time.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    dismissPreloader()
  })
})
