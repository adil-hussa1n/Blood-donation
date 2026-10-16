// Service Worker for Darun Donors Emergency Notification & Offline PWA caching
const CACHE_NAME = 'darun-donors-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event listener (for background web push)
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 জরুরি রক্তের প্রয়োজন! (Urgent Blood Request)',
    body: 'আপনার রক্তের গ্রুপ ও এলাকায় জরুরি রক্তের প্রয়োজন। ক্লিক করে বিস্তারিত দেখুন।',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: '/emergency' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || 'emergency-blood-request',
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: '/emergency' },
    actions: [
      { action: 'view', title: '👀 View Details' },
      { action: 'close', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/emergency';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
