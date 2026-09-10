const CACHE_NAME = "planly-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./tarefa.html",
  "./mapa.html",
  "./material.html",
  "./login.html",
  "./register.html",
  "./manifest.json",
  "./assets/css/reset.css",
  "./assets/css/style.css",
  "./assets/css/tarefas.css",
  "./assets/css/header.css",
  "./assets/css/footer.css",
  "./assets/css/section.css",
  "./assets/css/form.css",
  "./assets/css/exemple.css",
  "./assets/css/result.css",
  "./assets/css/mapa.css",
  "./assets/css/material.css",
  "./assets/js/pwa.js",
  "./assets/js/auth.js",
  "./assets/js/menu.js",
  "./assets/js/theme.js",
  "./assets/js/button.js",
  "./assets/js/actions.js",
  "./assets/js/tarefas.js",
  "./assets/js/ranking.js",
  "./assets/js/mapa.js",
  "./assets/js/material.js",
  "./assets/js/plan-suggestions.js",
  "./assets/icons/icon.svg",
  "./assets/icons/logo.svg",
  "./assets/img/background-notebook.jpg",
  "./assets/img/background-tasks.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const { request } = event;

  // Sempre buscar firebase-config direto da rede para evitar cache da chave
  if (request.url.includes("firebase-config.js")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  const isHTML =
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.headers.get("accept")?.includes("text/html");

  if (isHTML) {
    // Network-first para HTML (evita precisar de Ctrl+Shift+R)
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/index.html")),
        ),
    );
    return;
  }

  // Stale-while-revalidate para CSS/JS/imagens
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    }),
  );
});
