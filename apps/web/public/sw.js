self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'حلقات', {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      tag: data.tag || 'halaqat-notification',
      data: data.data,
      dir: 'rtl',
      lang: 'ar',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/student-portal';
  event.waitUntil(
    clients.openWindow(url),
  );
});
