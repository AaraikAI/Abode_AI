const CACHE_NAME = 'abodeai-pwa-v1'
const API_CACHE = 'abodeai-api-v1'
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => (key.startsWith('abodeai-') && key !== CACHE_NAME && key !== API_CACHE ? caches.delete(key) : undefined))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached
        }
        return fetch(event.request).then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
          return response
        })
      })
    )
    return
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request)
          cache.put(event.request, networkResponse.clone())
          return networkResponse
        } catch (error) {
          const cachedResponse = await cache.match(event.request)
          if (cachedResponse) {
            return cachedResponse
          }
          throw error
        }
      })
    )
  }
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'AbodeAI update', body: 'New activity detected.' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      data,
    })
  )
})
