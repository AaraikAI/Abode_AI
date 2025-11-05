import { initializeApp, type FirebaseApp } from "firebase/app"
import { getMessaging, isSupported, type Messaging, getToken } from "firebase/messaging"

let firebaseApp: FirebaseApp | undefined
let messaging: Messaging | undefined

export async function initFirebase(): Promise<Messaging | undefined> {
  if (typeof window === "undefined") return undefined

  if (!firebaseApp) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    if (!config.apiKey || !config.messagingSenderId) {
      console.warn("Firebase config missing; push notifications disabled")
      return undefined
    }

    firebaseApp = initializeApp(config)
  }

  if (!messaging && (await isSupported())) {
    messaging = getMessaging(firebaseApp)
  }

  return messaging
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) {
    console.warn("Notifications API not supported in this browser")
    return
  }

  const granted = await Notification.requestPermission()
  if (granted === "granted") {
    const messagingInstance = await initFirebase()
    if (messagingInstance && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
      try {
        await getToken(messagingInstance, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.ready,
        })
      } catch (error) {
        console.warn("Failed to get FCM token", error)
      }
    }
  }
}
