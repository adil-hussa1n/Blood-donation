/** Minimum time the splash stays visible (avoids flash on fast loads). */
const MIN_DISPLAY_MS = 1400;

/** Fade-out transition length — keep in sync with CSS. */
export const PRELOADER_FADE_MS = 450;

/** Hard cap so the splash never sticks if something hangs. */
const MAX_WAIT_MS = 10000;

function hidePreloader(el) {
  if (el.dataset.dismissed === 'true') return;
  el.dataset.dismissed = 'true';
  el.setAttribute('aria-hidden', 'true');
  el.classList.add('static-preloader--hide');

  window.setTimeout(() => {
    el.remove();
    document.body.classList.remove('preloader-active');
    document.documentElement.classList.remove('preloader-html');
  }, PRELOADER_FADE_MS);
}

export function dismissPreloader() {
  const el = document.getElementById('static-preloader');
  if (!el) {
    document.body.classList.remove('preloader-active');
    return;
  }

  const start = window.__PRELOADER_START__ ?? performance.now();
  const elapsed = performance.now() - start;
  const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);

  window.setTimeout(() => hidePreloader(el), delay);
}

/** Ensures the splash is removed even if the app never finishes mounting. */
export function initPreloaderSafety() {
  window.setTimeout(() => dismissPreloader(), MAX_WAIT_MS);
}
