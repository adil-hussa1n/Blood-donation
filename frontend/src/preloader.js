/** Minimum time the splash stays visible for a smooth, premium loading experience. */
const MIN_DISPLAY_MS = 1200;

/** Fade-out transition length — keep in sync with CSS (0.45s). */
export const PRELOADER_FADE_MS = 450;

/** Safety cap so the splash never sticks if bundle loading is slow on mobile */
const MAX_WAIT_MS = 3500;

const getNow = () => (window.performance && window.performance.now) ? window.performance.now() : Date.now();

function hidePreloader(el) {
  const isDismissed = el.dataset ? el.dataset.dismissed === 'true' : el.getAttribute('data-dismissed') === 'true';
  if (isDismissed) return;

  if (el.dataset) {
    el.dataset.dismissed = 'true';
  } else {
    el.setAttribute('data-dismissed', 'true');
  }
  el.setAttribute('aria-hidden', 'true');
  el.classList.add('static-preloader--hide');

  // Immediately unlock root DOM so touch and scroll gestures are never locked
  try {
    document.body.classList.remove('preloader-active');
  } catch (e) {}
  try {
    document.documentElement.classList.remove('preloader-html');
  } catch (e) {}

  window.setTimeout(() => {
    try {
      el.remove();
    } catch (e) {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }, PRELOADER_FADE_MS);
}

export function dismissPreloader() {
  const el = document.getElementById('static-preloader');
  if (!el) {
    // If element is not in DOM, make sure preloader classes are cleaned up
    try {
      document.body.classList.remove('preloader-active');
      document.documentElement.classList.remove('preloader-html');
    } catch (e) {}
    return;
  }

  const start = window.__PRELOADER_START__ ?? getNow();
  const elapsed = getNow() - start;
  const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);

  if (delay <= 0) {
    hidePreloader(el);
  } else {
    window.setTimeout(() => hidePreloader(el), delay);
  }
}

/** Ensures the splash is removed even if the app takes time to finish mounting on slow mobile connections. */
export function initPreloaderSafety() {
  window.setTimeout(() => dismissPreloader(), MAX_WAIT_MS);
}

