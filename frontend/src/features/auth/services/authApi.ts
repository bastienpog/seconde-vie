import { apiRequest } from '../../../lib/api.ts'

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name: string
}

export type AuthenticatedUser = {
  id: number
  email: string
  name: string
  roles: string[]
}

export type LoginResponse = {
  token: string
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export function register(payload: RegisterPayload): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/register', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export function getMe(): Promise<AuthenticatedUser> {
  return apiRequest<AuthenticatedUser>('/me')
}
