import { useMutation, useQuery } from '@tanstack/react-query'
import { getAuthToken } from '../../lib/api.ts'
import { getMe, login, register } from './services/authApi.ts'

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
  })
}

export function useMeQuery() {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: getAuthToken() !== null,
    retry: false,
  })
}
