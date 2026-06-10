import { apiRequest } from '../../../lib/api.ts'

export type Category = {
  id: number
  name: string
  slug: string | null
}

export function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', { auth: false })
}
