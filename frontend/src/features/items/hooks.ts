import { useQuery } from '@tanstack/react-query'
import { getItem, getItems, type ItemFilters } from './services/itemsApi.ts'

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
