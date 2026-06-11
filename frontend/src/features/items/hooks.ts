import { useMutation, useQuery } from '@tanstack/react-query'
import { getAuthToken } from '../../lib/api.ts'
import {
  createItem,
  deleteItem,
  getItem,
  getItems,
  getMyItems,
  updateItem,
  type ItemFilters,
  type ItemPayload,
} from './services/itemsApi.ts'

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

export function useCreateItemMutation() {
  return useMutation({
    mutationFn: createItem,
  })
}

export function useUpdateItemMutation(id: number) {
  return useMutation({
    mutationFn: (payload: ItemPayload) => updateItem(id, payload),
  })
}

export function useDeleteItemMutation() {
  return useMutation({
    mutationFn: deleteItem,
  })
}
