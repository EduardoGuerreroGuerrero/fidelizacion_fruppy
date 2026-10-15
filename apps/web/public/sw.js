// Service worker único del origen — recibe push de CUALQUIER comercio del
// SaaS: el aislamiento por comercio vive en la base de datos (suscripción +
// consentimiento por organización), no en el permiso del navegador.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === "string" && data.title ? data.title : "Notificación";
  const options = {
    body: typeof data.body === "string" ? data.body : "",
    data: { url: typeof data.url === "string" ? data.url : "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
