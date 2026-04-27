const GUTO_USER_ID_KEY = "guto-anonymous-user-id"
const GUTO_LAST_SEEN_DATE_KEY = "guto-last-seen-date"
const GUTO_RETURN_RECORDED_DATE_KEY = "guto-return-recorded-date"

function createAnonymousUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `anon-${crypto.randomUUID()}`
  }

  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateGutoUserId() {
  return getOrCreateGutoVisitTelemetry().userId
}

export function getOrCreateGutoVisitTelemetry() {
  if (typeof window === "undefined") {
    return {
      userId: "local-user",
      isNewUser: false,
      returnedNextDay: false,
    }
  }

  try {
    const existing = window.localStorage.getItem(GUTO_USER_ID_KEY)
    const userId = existing || createAnonymousUserId()
    const today = new Date().toISOString().slice(0, 10)
    const lastSeenDate = window.localStorage.getItem(GUTO_LAST_SEEN_DATE_KEY)
    const returnRecordedDate = window.localStorage.getItem(GUTO_RETURN_RECORDED_DATE_KEY)
    const returnedNextDay = Boolean(
      existing &&
        lastSeenDate &&
        lastSeenDate < today &&
        returnRecordedDate !== today
    )

    if (!existing) {
      window.localStorage.setItem(GUTO_USER_ID_KEY, userId)
    }
    if (returnedNextDay) {
      window.localStorage.setItem(GUTO_RETURN_RECORDED_DATE_KEY, today)
    }
    window.localStorage.setItem(GUTO_LAST_SEEN_DATE_KEY, today)

    return {
      userId,
      isNewUser: !existing,
      returnedNextDay,
    }
  } catch {
    return {
      userId: "local-user",
      isNewUser: false,
      returnedNextDay: false,
    }
  }
}
