import { apiRequest } from "@/lib/api/client"

export type PushPermission = "default" | "granted" | "denied" | "unsupported"

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

export function getPushPermission(): PushPermission {
  if (!isPushSupported()) return "unsupported"
  return Notification.permission as PushPermission
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js")
  if (existing) return existing
  return navigator.serviceWorker.register("/sw.js")
}

async function fetchVapidKey(): Promise<string> {
  const res = await apiRequest<{ publicKey: string }>("/guto/push/vapid-public-key")
  if (!res?.publicKey) throw new Error("VAPID key indisponível")
  return res.publicKey
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration("/sw.js")
  if (!reg) return null
  return reg.pushManager.getSubscription()
}

export async function subscribePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" }

  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission()
    if (perm !== "granted") return { ok: false, reason: "denied" }
  } else if (Notification.permission === "denied") {
    return { ok: false, reason: "denied" }
  }

  const reg = await registerServiceWorker()
  await navigator.serviceWorker.ready

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    const publicKey = await fetchVapidKey()
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "invalid_subscription" }
  }

  await apiRequest("/guto/push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      subscription: {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      },
    }),
  })
  return { ok: true }
}

export async function unsubscribePush(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await navigator.serviceWorker.getRegistration("/sw.js")
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return true
  const endpoint = sub.endpoint
  try {
    await sub.unsubscribe()
  } catch {
    // continue: still tell the server to drop it
  }
  try {
    await apiRequest("/guto/push/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    })
  } catch {
    // ignore: local unsubscribe already succeeded
  }
  return true
}
