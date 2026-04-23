export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Falha de conexão com o servidor."
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

export async function apiRequest<T>(
  path: string,
  { timeoutMs = 15000, ...init }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      let message = `Erro de API (${res.status})`
      try {
        const body = await res.json()
        message = body?.message || message
      } catch {}
      throw new ApiError(message, res.status)
    }

    return (await res.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Tempo de resposta excedido. Tente novamente.")
    }
    if (err instanceof ApiError) throw err
    throw new ApiError("Falha de conexão com o servidor.")
  } finally {
    clearTimeout(timeout)
  }
}
