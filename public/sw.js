// Keeps a copy of the app so it opens without a network. When online, each
// launch fetches the newest version (falling back to the copy if that is slow)
// and refreshes the copy, dropping files the new version no longer uses.

const CACHE = 'stackle';
const SHELL = ['./', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const NETWORK_WAIT_MS = 3000;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(refresh());
});

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(launch(event));
    return;
  }
  event.respondWith(
    caches.match(request, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit ?? fetch(request)),
  );
});

/** The page itself: the network if it answers soon, else the copy. */
async function launch(event) {
  const network = fetch(event.request, { cache: 'no-store' });
  event.waitUntil(network.then((page) => (page.ok ? refresh(page.clone()) : null)).catch(() => {}));
  const copy = await caches.match('./', { ignoreVary: true });
  if (!copy) return network;
  const slow = new Promise((resolve) => setTimeout(() => resolve(copy), NETWORK_WAIT_MS));
  return Promise.race([network.then((page) => (page.ok ? page : copy)).catch(() => copy), slow]);
}

/** Copy the page and every file it uses; forget files no longer used. */
async function refresh(page) {
  page ??= await fetch('./', { cache: 'no-store' });
  const html = await page.clone().text();
  const scope = self.registration.scope;
  const used = new Set(SHELL.map((path) => new URL(path, scope).href));
  for (const [, path] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = new URL(path, scope);
    if (url.origin === location.origin) used.add(url.href);
  }
  const cache = await caches.open(CACHE);
  const have = new Set((await cache.keys()).map((r) => r.url));
  await Promise.all(
    [...used].filter((url) => !have.has(url) && url !== scope).map((url) => cache.add(new Request(url, { cache: 'no-store' }))),
  );
  await cache.put(scope, page);
  await Promise.all([...have].filter((url) => !used.has(url)).map((url) => cache.delete(url)));
}
