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
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Get current permission status ('granted' | 'denied' | 'default')
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    // Safari / iOS fallback using promise or callback
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
    }
    return permission;
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return 'denied';
  }
}

/**
 * Check if the user has silenced or muted notifications in their app settings
 */
export function isNotificationsEnabledInApp(): boolean {
  if (typeof window === 'undefined') return false;
  const setting = localStorage.getItem('bb_notifications_enabled');
  // Default to true if permission is granted, otherwise check stored preference
  if (setting === null) {
    return getNotificationPermission() === 'granted';
  }
  return setting === 'true' && getNotificationPermission() === 'granted';
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
