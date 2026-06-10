const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const TOKEN_STORAGE_KEY = 'seconde_vie_token'

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers)

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false) {
    const token = getAuthToken()

    if (token !== null) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.status === 204) {
    return undefined as TResponse
  }

  const data = await parseJson(response)

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data, response.status), response.status, data)
  }

  return data as TResponse
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text === '') {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError('La reponse de l API est invalide.', response.status)
  }
}

function getErrorMessage(data: unknown, status: number): string {
  if (isRecord(data)) {
    if (typeof data.message === 'string') {
      return data.message
    }

    if (typeof data.error === 'string') {
      return data.error
    }
  }

  return `Erreur API ${status}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
