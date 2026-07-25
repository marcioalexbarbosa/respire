/*
 * Service worker do "Respiração 4-7-8".
 *
 * Estratégia:
 *  - navegação (o HTML): network-first, com fallback pro cache -> sempre que
 *    houver internet o usuário pega a versão nova; offline continua abrindo.
 *  - demais arquivos do mesmo domínio: stale-while-revalidate -> resposta
 *    instantânea do cache e atualização silenciosa em segundo plano.
 *
 * Ao mudar arquivos precacheados, suba o CACHE_VERSION.
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `respire-${CACHE_VERSION}`;

const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll é tudo-ou-nada; um 404 quebraria a instalação inteira
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

// a página pede a troca imediata quando detecta uma versão nova
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(event.request));
    if (response && response.ok) cache.put("/index.html", response.clone());
    return response;
  } catch (err) {
    return (
      (await cache.match(event.request)) ||
      (await cache.match("/index.html")) ||
      (await cache.match("/")) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
