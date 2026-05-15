// GUTO service worker — Web Push only (no offline caching).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "GUTO", body: "GUTO" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    if (event.data) data.body = event.data.text();
  }
  const opts = {
    body: data.body || "",
    tag: data.tag || "guto",
    icon: "/icon-light-32x32.png",
    badge: "/icon-light-32x32.png",
    data: { url: data.url || "/" },
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(data.title || "GUTO", opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && "focus" in w) return w.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
