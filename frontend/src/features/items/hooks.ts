import { useQuery } from '@tanstack/react-query'
import { getAuthToken } from '../../lib/api.ts'
import { getItem, getItems, getMyItems, type ItemFilters } from './services/itemsApi.ts'

export function useItemsQuery(filters: ItemFilters = {}) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => getItems(filters),
  })
}

export function useItemQuery(id: number) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => getItem(id),
    enabled: Number.isFinite(id),
  })
}

export function useMyItemsQuery() {
  return useQuery({
    queryKey: ['me', 'items'],
    queryFn: getMyItems,
    enabled: getAuthToken() !== null,
    retry: false,
  })
}
