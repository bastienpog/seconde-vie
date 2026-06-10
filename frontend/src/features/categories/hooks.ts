import { useQuery } from '@tanstack/react-query'
import { getCategories } from './services/categoriesApi.ts'

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}
