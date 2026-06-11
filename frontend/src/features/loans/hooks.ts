import { useMutation, useQuery } from '@tanstack/react-query'
import { getAuthToken } from '../../lib/api.ts'
import {
  acceptLoanRequest,
  createLoanRequest,
  getReceivedLoanRequests,
  getSentLoanRequests,
  refuseLoanRequest,
  type CreateLoanRequestPayload,
} from './services/loansApi.ts'

export function useCreateLoanRequestMutation(itemId: number) {
  return useMutation({
    mutationFn: (payload: CreateLoanRequestPayload) => createLoanRequest(itemId, payload),
  })
}

export function useSentLoanRequestsQuery() {
  return useQuery({
    queryKey: ['loan-requests', 'sent'],
    queryFn: getSentLoanRequests,
    enabled: getAuthToken() !== null,
    retry: false,
  })
}

export function useReceivedLoanRequestsQuery() {
  return useQuery({
    queryKey: ['loan-requests', 'received'],
    queryFn: getReceivedLoanRequests,
    enabled: getAuthToken() !== null,
    retry: false,
  })
}

export function useAcceptLoanRequestMutation() {
  return useMutation({
    mutationFn: acceptLoanRequest,
  })
}

export function useRefuseLoanRequestMutation() {
  return useMutation({
    mutationFn: refuseLoanRequest,
  })
}
