import { apiRequest } from '../../../lib/api.ts'

export type ItemOwner = {
  id: number
  email: string
}

export type ItemCategory = {
  id: number
  name: string
}

export type Item = {
  id: number
  title: string
  description: string
  city: string
  condition: string
  imageUrl: string | null
  status: string
  category: ItemCategory | null
  owner: ItemOwner | null
  createdAt: string
  updatedAt: string
}

export type ItemFilters = {
  search?: string
  category?: number
  city?: string
}

export type ItemPayload = {
  title: string
  description: string
  city: string
  condition: string
  categoryId: number
  imageUrl?: string | null
}

export function getItems(filters: ItemFilters = {}): Promise<Item[]> {
  const searchParams = new URLSearchParams()

  if (filters.search !== undefined && filters.search !== '') {
    searchParams.set('search', filters.search)
  }

  if (filters.category !== undefined) {
    searchParams.set('category', String(filters.category))
  }

  if (filters.city !== undefined && filters.city !== '') {
    searchParams.set('city', filters.city)
  }

  const queryString = searchParams.toString()

  return apiRequest<Item[]>(`/items${queryString === '' ? '' : `?${queryString}`}`, {
    auth: false,
  })
}

export function getItem(id: number): Promise<Item> {
  return apiRequest<Item>(`/items/${id}`, { auth: false })
}

export function getMyItems(): Promise<Item[]> {
  return apiRequest<Item[]>('/me/items')
}

export function createItem(payload: ItemPayload): Promise<Item> {
  return apiRequest<Item>('/items', {
    method: 'POST',
    body: payload,
  })
}

export function updateItem(id: number, payload: ItemPayload): Promise<Item> {
  return apiRequest<Item>(`/items/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteItem(id: number): Promise<void> {
  return apiRequest<void>(`/items/${id}`, {
    method: 'DELETE',
  })
}
