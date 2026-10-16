/**
 * Notification Service for Darun Donors
 * Supports cross-platform browser notifications on Android, iOS (PWA/Safari 16.4+), and Windows/macOS/Linux.
 */

import { getDistrictForArea } from '../context/AppContext';

// Blood group compatibility map: who can donate to whom (Whole Blood)
// Key: Recipient (Patient), Value: Compatible Donors
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // Universal donor
};

/**
 * Checks if a donor's blood group can donate to the emergency recipient
 */
export function isBloodCompatible(donorBloodGroup?: string, requestedBloodGroup?: string): boolean {
  if (!donorBloodGroup || !requestedBloodGroup) return false;
  const cleanDonor = donorBloodGroup.trim().toUpperCase();
  const cleanReq = requestedBloodGroup.trim().toUpperCase();

  // Direct exact match is always compatible
  if (cleanDonor === cleanReq) return true;

  // Universal donor O- can donate to all
  if (cleanDonor === 'O-') return true;

  // Check compatibility table
  const compatibleDonors = BLOOD_COMPATIBILITY[cleanReq] || [cleanReq];
  return compatibleDonors.includes(cleanDonor);
}

/**
 * Checks if the donor is in the same district or area as the emergency request
 */
export function isLocationMatched(donorArea?: string, requestArea?: string): boolean {
  if (!donorArea || !requestArea) return true; // Default to notify if location unknown

  const cleanDonor = donorArea.trim().toLowerCase();
  const cleanReq = requestArea.trim().toLowerCase();

  // Exact upazila match
  if (cleanDonor === cleanReq || cleanDonor.includes(cleanReq) || cleanReq.includes(cleanDonor)) {
    return true;
  }

  // District-level match (e.g. Sylhet, Moulvibazar, Habiganj, Sunamganj)
  try {
    const donorDistrict = getDistrictForArea(donorArea);
    const reqDistrict = getDistrictForArea(requestArea);
    if (donorDistrict && reqDistrict && donorDistrict.id === reqDistrict.id) {
      return true;
    }
  } catch (e) {
    // Fallback: match Sylhet division
  }

  return false;
}

/**
 * Register Service Worker if supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (error) {
    console.warn('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Detect if running on an iOS device (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

/**
 * Detect if running as an installed PWA (Home Screen Web App)
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the browser supports notifications or is an iOS device that can support it
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // Standard support (Chrome, Edge, Firefox, Android, Desktop Safari, iOS PWA 16.4+)
  if ('Notification' in window) return true;
  // If on iOS Safari in browser mode, Notification is exposed once added to Home Screen or on Safari 16.4+
  if (isIOS()) return true;
  return false;
}

/**
 * Get current permission status ('granted' | 'denied' | 'default')
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'default';
}

import { getApiUrl, isDemoMode } from './apiConfig';

/**
 * Convert URL-safe base64 string to Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe device service worker to background Web Push
 */
export async function subscribeToWebPush(donorInfo?: { id?: string; blood_group?: string; area?: string }): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || isDemoMode) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) {
      console.warn('PushManager not supported on this device/browser.');
      return false;
    }

    // 1. Fetch VAPID public key from backend
    const vapidRes = await fetch(getApiUrl('/push/vapid-public-key'));
    if (!vapidRes.ok) {
      console.warn('Could not fetch VAPID key from backend.');
      return false;
    }
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return false;

    // 2. Check existing subscription or create new
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
      });
    }

    // 3. Send subscription to backend database
    const subJson = subscription.toJSON();
    await fetch(getApiUrl('/push/subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        donorId: donorInfo?.id,
        bloodGroup: donorInfo?.blood_group,
        area: donorInfo?.area,
      }),
    });

    console.log('✅ Successfully subscribed device to background Web Push!');
    return true;
  } catch (err) {
    console.warn('Failed to subscribe to Web Push:', err);
    return false;
  }
}

/**
 * Request notification permission from user with iOS PWA guidance
 */
export async function requestNotificationPermission(donorInfo?: { id?: string; blood_group?: string; area?: string }): Promise<NotificationPermission> {
  // Check if standard Notification API is available
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      let permission: NotificationPermission;
      if (window.Notification?.requestPermission) {
        permission = await Notification.requestPermission();
      } else {
        permission = await new Promise((resolve) => {
          Notification.requestPermission((res) => resolve(res));
        });
      }

      if (permission === 'granted') {
        await registerServiceWorker();
        // Subscribe to background Web Push
        await subscribeToWebPush(donorInfo);
      }
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  // If on iOS Safari standard browser tab (Apple requires PWA Add to Home Screen for Web Push)
  if (isIOS() && !isStandalonePWA()) {
    return 'default';
  }

  return 'denied';
}

/**
 * Check if the user has silenced or muted notifications in their app settings
 */
export function isNotificationsEnabledInApp(): boolean {
  if (typeof window === 'undefined') return false;
  const setting = localStorage.getItem('bb_notifications_enabled');
  if (setting !== null) {
    return setting === 'true';
  }
  // Default to true if permission is granted
  return getNotificationPermission() === 'granted';
}

/**
 * Set user's in-app notification preference
 */
export function setNotificationsEnabledInApp(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bb_notifications_enabled', enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('bb_notification_pref_changed'));
}

/**
 * Trigger an instant browser notification for an emergency request
 */
export async function sendEmergencyNotification(
  request: {
    id: string;
    blood_group: string;
    area: string;
    contact?: string;
    note?: string;
  },
  options: {
    language?: string;
  } = {}
): Promise<boolean> {
  if (!isNotificationSupported() || getNotificationPermission() !== 'granted') {
    return false;
  }

  const lang = options.language || (localStorage.getItem('language') === 'bn' ? 'bn' : 'en');
  const isBn = lang === 'bn';

  const title = isBn
    ? `🚨 জরুরি ${request.blood_group} রক্তের প্রয়োজন!`
    : `🚨 Urgent ${request.blood_group} Blood Needed!`;

  const body = isBn
    ? `স্থান: ${request.area} | যোগাযোগ: ${request.contact || 'জরুরি ফিড'}\n${request.note ? request.note.slice(0, 70) : 'রক্ত দিয়ে একটি জীবন বাঁচান।'}`
    : `Location: ${request.area} | Contact: ${request.contact || 'Emergency Feed'}\n${request.note ? request.note.slice(0, 70) : 'Respond immediately to save a life.'}`;

  const notificationData = {
    url: '/emergency',
    requestId: request.id,
    bloodGroup: request.blood_group,
    area: request.area,
  };

  try {
    // 1. Try to dispatch through Service Worker registration (Works on Android, iOS PWA & Desktop)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [300, 150, 300, 150, 300],
          tag: `emergency-${request.id}`,
          renotify: true,
          requireInteraction: true,
          data: notificationData,
        } as any);
        return true;
      }
    }

    // 2. Fallback to standard Notification API
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      tag: `emergency-${request.id}`,
      requireInteraction: true,
      data: notificationData,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (window.location.pathname !== '/emergency') {
        window.location.href = '/emergency';
      }
      notification.close();
    };

    return true;
  } catch (e) {
    console.warn('Failed to display native browser notification:', e);
    return false;
  }
}
