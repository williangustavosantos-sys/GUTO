const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3001")

export const API_URL = RAW_API_URL.replace(/\/+$/, "")

export class ApiError extends Error {
  status?: number
  details?: unknown
  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

function isApiErrorBody(value: unknown): value is { message?: string; error?: string; code?: string } {
  return typeof value === "object" && value !== null
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Falha de conexão com o servidor."
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
      if (!isLoginEndpoint && typeof window !== "undefined") {
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
      throw new ApiError("Tempo de resposta excedido. Tente novamente.")
    }
    if (err instanceof ApiError) throw err
    throw new ApiError(`Falha de conexão com o servidor em ${API_URL}. Verifique NEXT_PUBLIC_API_URL ou se o backend está rodando.`)
  } finally {
    clearTimeout(timeout)
  }
}
