/** Minimum time the splash stays visible (avoids flash on fast loads). */
const MIN_DISPLAY_MS = 1400;

/** Fade-out transition length — keep in sync with CSS. */
export const PRELOADER_FADE_MS = 450;

/** Hard cap so the splash never sticks if something hangs. */
const MAX_WAIT_MS = 10000;

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

  window.setTimeout(() => {
    try {
      el.remove();
    } catch (e) {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
    try {
      document.body.classList.remove('preloader-active');
    } catch (e) {}
    try {
      document.documentElement.classList.remove('preloader-html');
    } catch (e) {}
  }, PRELOADER_FADE_MS);
}

export function dismissPreloader() {
  const el = document.getElementById('static-preloader');
  if (!el) {
    try {
      document.body.classList.remove('preloader-active');
      document.documentElement.classList.remove('preloader-html');
    } catch (e) {}
    return;
  }

  const start = window.__PRELOADER_START__ ?? getNow();
  const elapsed = getNow() - start;
  const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);

  window.setTimeout(() => hidePreloader(el), delay);
}

/** Ensures the splash is removed even if the app never finishes mounting. */
export function initPreloaderSafety() {
  window.setTimeout(() => dismissPreloader(), MAX_WAIT_MS);
}

