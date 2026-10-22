/**
 * Browser detection and utility functions for handling In-App Browsers (IABs)
 * such as Facebook Messenger, Facebook App, Instagram, Line, etc.
 * 
 * Google explicitly blocks authentication (OAuth / Google Identity Services) inside 
 * embedded WebViews for security reasons (error 403 disallowed_useragent or hanging blank page).
 */

export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string;
  isMessenger: boolean;
  isFacebook: boolean;
  isInstagram: boolean;
  isLine: boolean;
  isTwitter: boolean;
  isTikTok: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

/**
 * Detect whether the user is viewing the page inside an embedded In-App Browser (IAB)
 */
export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof window === 'undefined' || !window.navigator) {
    return {
      isInApp: false,
      appName: '',
      isMessenger: false,
      isFacebook: false,
      isInstagram: false,
      isLine: false,
      isTwitter: false,
      isTikTok: false,
      isAndroid: false,
      isIOS: false,
    };
  }

  const ua = window.navigator.userAgent || window.navigator.vendor || (window as any).opera || '';
  const uaLower = ua.toLowerCase();

  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(uaLower) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

  // Messenger detection (both iOS and Android variants)
  const isMessenger = /messenger|fb_iab.*messenger|orca-android|fbss/i.test(ua);

  // Facebook Main App WebView
  const isFacebook = (/fban|fbav|fb_iab/i.test(ua)) && !isMessenger;

  // Instagram In-App Browser
  const isInstagram = /instagram/i.test(ua);

  // Line
  const isLine = /line\//i.test(ua);

  // Twitter / X
  const isTwitter = /twitter|tweetie/i.test(ua);

  // TikTok / ByteDance
  const isTikTok = /musical_ly|bytedance|tiktok/i.test(ua);

  // WeChat
  const isWeChat = /micromessenger/i.test(ua);

  // Snapchat
  const isSnapchat = /snapchat/i.test(ua);

  // Generic Android WebView: contains '; wv)' or 'Version/X.X' alongside Chrome
  const isAndroidWebView = isAndroid && (/(\bwv\b|;\s*wv\))/i.test(ua) || (/Version\/[0-9.]+/i.test(ua) && !/SamsungBrowser/i.test(ua) && /Chrome/i.test(ua)));

  const isInApp = Boolean(
    isMessenger ||
    isFacebook ||
    isInstagram ||
    isLine ||
    isTwitter ||
    isTikTok ||
    isWeChat ||
    isSnapchat ||
    isAndroidWebView
  );

  let appName = 'In-App Browser';
  if (isMessenger) appName = 'Messenger';
  else if (isFacebook) appName = 'Facebook';
  else if (isInstagram) appName = 'Instagram';
  else if (isLine) appName = 'Line';
  else if (isTwitter) appName = 'Twitter / X';
  else if (isTikTok) appName = 'TikTok';
  else if (isWeChat) appName = 'WeChat';
  else if (isSnapchat) appName = 'Snapchat';

  return {
    isInApp,
    appName,
    isMessenger,
    isFacebook,
    isInstagram,
    isLine,
    isTwitter,
    isTikTok,
    isAndroid,
    isIOS,
  };
}

/**
 * Creates an Android Intent URL to force open the current URL inside Google Chrome
 */
export function getAndroidChromeIntentUrl(targetUrl?: string): string {
  if (typeof window === 'undefined') return '';
  const url = targetUrl || window.location.href;
  if (!url) return '';

  // Strip protocol (http:// or https://)
  const cleanUrl = url.replace(/^https?:\/\//i, '');

  // Chrome Intent syntax for Android
  return `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
}

/**
 * Safely copies text to the user's clipboard across various mobile WebView environments
 */
export async function copyUrlToClipboard(url?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const target = url || window.location.href;
  if (!target) return false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(target);
      return true;
    }
  } catch {
    // Clipboard API might be restricted inside WebViews, fallback to execCommand
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = target;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
