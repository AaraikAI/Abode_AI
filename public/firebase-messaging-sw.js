self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'AbodeAI', body: 'You have a new notification.' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
    })
  )
})
