const GUTO_USER_ID_KEY = "guto-anonymous-user-id"

function createAnonymousUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `anon-${crypto.randomUUID()}`
  }

  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateGutoUserId() {
  if (typeof window === "undefined") return "local-user"

  try {
    const existing = window.localStorage.getItem(GUTO_USER_ID_KEY)
    if (existing) return existing

    const next = createAnonymousUserId()
    window.localStorage.setItem(GUTO_USER_ID_KEY, next)
    return next
  } catch {
    return "local-user"
  }
}
