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

// Wait for React's first paint, then fade out.
// Fallback to setTimeout in case requestAnimationFrame is throttled or delayed (e.g. Safari background pre-rendering).
let rafFired = false;
const triggerDismiss = () => {
  if (rafFired) return;
  rafFired = true;
  dismissPreloader();
};

if (typeof requestAnimationFrame === 'function') {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      triggerDismiss();
    });
  });
}

// Fallback to ensure dismissPreloader runs even if RAF is blocked or throttled
setTimeout(triggerDismiss, 50);

