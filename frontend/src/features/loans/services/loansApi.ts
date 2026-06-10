import { apiRequest } from '../../../lib/api.ts'

export type LoanRequest = {
  id: number
  status: string
  item: {
    id: number
    title: string
    city: string
    owner: {
      id: number
      email: string
    } | null
  } | null
  borrower: {
    id: number
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

export function createLoanRequest(itemId: number): Promise<LoanRequest> {
  return apiRequest<LoanRequest>(`/items/${itemId}/loan-requests`, {
    method: 'POST',
  })
}

export function getSentLoanRequests(): Promise<LoanRequest[]> {
  return apiRequest<LoanRequest[]>('/me/loan-requests/sent')
}

export function getReceivedLoanRequests(): Promise<LoanRequest[]> {
  return apiRequest<LoanRequest[]>('/me/loan-requests/received')
}

export function acceptLoanRequest(id: number): Promise<LoanRequest> {
  return apiRequest<LoanRequest>(`/loan-requests/${id}/accept`, {
    method: 'PUT',
  })
}

export function refuseLoanRequest(id: number): Promise<LoanRequest> {
  return apiRequest<LoanRequest>(`/loan-requests/${id}/refuse`, {
    method: 'PUT',
  })
}
