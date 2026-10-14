// Robust unified cross-platform storage adapter
// Handles mobile Safari/iOS ITP, private browsing restrictions, and cookie/fallback mirroring

const memoryStore: Record<string, string> = {};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// Critical keys that must survive across mobile reloads, iOS Safari tab sleep, and PWA restarts
const MIRRORED_COOKIE_KEYS = new Set([
  'bb_donor_session',
  'adminToken',
  'adminUser',
  'isAdmin',
  'theme',
  'language',
]);

export const appStorage = {
  getItem(key: string): string | null {
    // 1. Try window.localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== undefined) {
          return val;
        }
      }
    } catch (e) {
      // localStorage may throw QuotaExceededError or SecurityError on mobile/private mode
    }

    // 2. Try cookie fallback for mirrored critical session keys
    if (MIRRORED_COOKIE_KEYS.has(key)) {
      try {
        const cookieVal = getCookie(key);
        if (cookieVal) {
          // If recovered from cookie, restore back into localStorage if possible
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem(key, cookieVal);
            }
          } catch (e) {}
          return cookieVal;
        }
      } catch (e) {}
    }

    // 3. Fallback to in-memory store
    return memoryStore[key] ?? null;
  },

  setItem(key: string, value: string): void {
    const stringVal = String(value);

    // 1. Always write to window.localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, stringVal);
      }
    } catch (e) {
      // Ignore or log error
    }

    // 2. Mirror critical session tokens in cookies for mobile browser reload persistence
    if (MIRRORED_COOKIE_KEYS.has(key)) {
      try {
        setCookie(key, stringVal, 365);
      } catch (e) {}
    }

    // 3. Update memory store
    memoryStore[key] = stringVal;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}

    if (MIRRORED_COOKIE_KEYS.has(key)) {
      try {
        removeCookie(key);
      } catch (e) {}
    }

    delete memoryStore[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {}

    for (const key of MIRRORED_COOKIE_KEYS) {
      removeCookie(key);
    }

    for (const k of Object.keys(memoryStore)) {
      delete memoryStore[k];
    }
  }
};
