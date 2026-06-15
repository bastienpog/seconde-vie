import { apiRequest } from '../../../lib/api.ts'
import type { Category } from '../../categories/services/categoriesApi.ts'
import type { AuthenticatedUser } from '../../auth/services/authApi.ts'
import type { Item } from '../../items/services/itemsApi.ts'

export type CategoryPayload = {
  name: string
}

export function getAdminCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', { auth: false })
}

export function createCategory(payload: CategoryPayload): Promise<Category> {
  return apiRequest<Category>('/admin/categories', {
    method: 'POST',
    body: payload,
  })
}

export function updateCategory(id: number, payload: CategoryPayload): Promise<Category> {
  return apiRequest<Category>(`/admin/categories/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteCategory(id: number): Promise<void> {
  return apiRequest<void>(`/admin/categories/${id}`, {
    method: 'DELETE',
  })
}

export function getAdminItems(): Promise<Item[]> {
  return apiRequest<Item[]>('/admin/items')
}

export function deleteAdminItem(id: number): Promise<void> {
  return apiRequest<void>(`/admin/items/${id}`, {
    method: 'DELETE',
  })
}

export function promoteUserToAdmin(email: string): Promise<AuthenticatedUser> {
  return apiRequest<AuthenticatedUser>('/admin/users/promote', {
    method: 'POST',
    body: { email },
  })
}
