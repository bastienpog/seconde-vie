import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createCategory,
  deleteAdminItem,
  deleteCategory,
  getAdminCategories,
  getAdminItems,
  updateCategory,
  type CategoryPayload,
} from './services/adminApi.ts'

export function useAdminCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getAdminCategories,
  })
}

export function useCreateCategoryMutation() {
  return useMutation({
    mutationFn: createCategory,
  })
}

export function useUpdateCategoryMutation() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryPayload }) => updateCategory(id, payload),
  })
}

export function useDeleteCategoryMutation() {
  return useMutation({
    mutationFn: deleteCategory,
  })
}

export function useAdminItemsQuery() {
  return useQuery({
    queryKey: ['admin', 'items'],
    queryFn: getAdminItems,
    retry: false,
  })
}

export function useDeleteAdminItemMutation() {
  return useMutation({
    mutationFn: deleteAdminItem,
  })
}
