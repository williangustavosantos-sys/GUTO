function shouldUsePreviewProxy() {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  return host.endsWith(".vercel.app") && host !== "corpoguto.vercel.app"
}

const RAW_API_URL =
  shouldUsePreviewProxy()
    ? "/api/guto"
    : process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production" ? "" : "http://localhost:3001")

export const API_URL = RAW_API_URL.replace(/\/+$/, "")

function isQaDemoMode() {
  const demoEnv = process.env.NEXT_PUBLIC_VERCEL_ENV

  return Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true" &&
      (demoEnv === "preview" || demoEnv === "development") &&
      window.location.pathname.startsWith("/coach") &&
      new URLSearchParams(window.location.search).has("demo")
  )
}

export class ApiError extends Error {
  status?: number
  details?: unknown
  code?: string
  constructor(message: string, status?: number, details?: unknown, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
    this.code = code
  }
}

function isApiErrorBody(value: unknown): value is { message?: string; error?: string; code?: string } {
  return typeof value === "object" && value !== null
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "TIMEOUT") return "Request timed out. Please try again."
    if (error.code === "CONNECTION_ERROR") return "Connection failed. Check your internet connection."
    return error.message
  }
  if (error instanceof Error) return error.message
  return "Connection failed."
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
  token?: string
}

export async function apiRequest<T>(
  path: string,
  { timeoutMs = 15000, token, ...init }: RequestOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL ausente. Configure a URL pública do Cérebro do GUTO.")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  // Tenta pegar token do localStorage se não foi passado explicitamente
  const activeToken = token || (typeof window !== "undefined" ? window.localStorage.getItem("guto-auth-token") : undefined)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(activeToken ? { "Authorization": `Bearer ${activeToken}` } : {}),
        ...(init.headers || {}),
      },
      signal: controller.signal,
    })

    if (res.status === 401) {
      const body = await res.json().catch(() => ({}))
      const isLoginEndpoint = path.includes("/login")
      const suppressAuthRedirect = isQaDemoMode()

      if (!isLoginEndpoint && typeof window !== "undefined" && !suppressAuthRedirect) {
        window.localStorage.removeItem("guto-auth-token")
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/convite")) {
          window.location.href = "/login"
        }
      }

      throw new ApiError(isApiErrorBody(body) ? body.message || "Credenciais inválidas." : "Credenciais inválidas.", 401)
    }

    if (res.status === 403) {
      const body = await res.json().catch(() => ({}))
      if (isApiErrorBody(body) && body.code === "ACCESS_PAUSED") {
        if (typeof window !== "undefined" && !window.location.pathname.includes("/acesso-pausado")) {
          window.location.href = "/acesso-pausado"
        }
      }
      throw new ApiError(isApiErrorBody(body) ? body.message || "Acesso negado." : "Acesso negado.", 403, body)
    }

    if (!res.ok) {
      let message = `Erro de API (${res.status})`
      let details: unknown = undefined
      try {
        const body = await res.json()
        message = isApiErrorBody(body) ? body.message || body.error || message : message
        details = body
      } catch {}
      throw new ApiError(message, res.status, details)
    }

    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("timeout", undefined, undefined, "TIMEOUT")
    }
    if (err instanceof ApiError) throw err
    throw new ApiError(`connection_error: ${API_URL}`, undefined, undefined, "CONNECTION_ERROR")
  } finally {
    clearTimeout(timeout)
  }
}
