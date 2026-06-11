import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ApiError, getAuthToken } from '../../../lib/api.ts'
import { queryClient } from '../../../lib/queryClient.ts'
import { BottomNavigation } from '../../items/components/BottomNavigation.tsx'
import { DesktopNavigation } from '../../items/components/DesktopNavigation.tsx'
import {
  useAcceptLoanRequestMutation,
  useReceivedLoanRequestsQuery,
  useRefuseLoanRequestMutation,
  useSentLoanRequestsQuery,
} from '../hooks.ts'
import type { LoanRequest } from '../services/loansApi.ts'

type ActiveTab = 'received' | 'sent'
type LoanAction = 'accept' | 'refuse'

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'Demande en attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
}

export function LoanRequestsPage() {
  const hasToken = getAuthToken() !== null
  const [activeTab, setActiveTab] = useState<ActiveTab>('received')
  const [pendingAction, setPendingAction] = useState<{ id: number; action: LoanAction } | null>(null)
  const receivedQuery = useReceivedLoanRequestsQuery()
  const sentQuery = useSentLoanRequestsQuery()
  const acceptMutation = useAcceptLoanRequestMutation()
  const refuseMutation = useRefuseLoanRequestMutation()
  const activeQuery = activeTab === 'received' ? receivedQuery : sentQuery
  const activeRequests = activeQuery.data ?? []
  const mutationError = acceptMutation.error ?? refuseMutation.error

  function handleAnswer(id: number, action: LoanAction) {
    const mutation = action === 'accept' ? acceptMutation : refuseMutation

    setPendingAction({ id, action })
    mutation.mutate(id, {
      onSettled: () => setPendingAction(null),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['loan-requests', 'received'] }),
          queryClient.invalidateQueries({ queryKey: ['loan-requests', 'sent'] }),
        ])
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f5f6f1] pb-32 text-slate-950 sm:pb-12">
      <header className="sticky top-0 z-10 bg-[#fdfcf8]/90 backdrop-blur sm:static sm:bg-transparent">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:h-auto sm:px-5 sm:py-7 lg:px-6 lg:py-8">
          <Link aria-label="Accueil" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f2e8] text-[#1a4231] ring-2 ring-[#1a4231]/10" to="/">
            <HomeIcon />
          </Link>
          <p className="text-lg font-bold text-[#1a4231] sm:text-3xl">Seconde Vie</p>
          <div className="hidden sm:block">
            <DesktopNavigation />
          </div>
          <span className="flex h-10 w-10 items-center justify-center text-[#1a4231] sm:hidden">
            <BellIcon />
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-5 sm:px-5 sm:pt-0 lg:px-6">
        <section className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a4231] sm:text-4xl">Mes transactions</h1>
          <div className="flex border-b border-[#c0c9c2]/30">
            <TabButton active={activeTab === 'received'} count={receivedQuery.data?.length} label="Mes prêts" onClick={() => setActiveTab('received')} />
            <TabButton active={activeTab === 'sent'} count={sentQuery.data?.length} label="Mes emprunts" onClick={() => setActiveTab('sent')} />
          </div>
        </section>

        {!hasToken && <AuthRequiredState />}

        {hasToken && activeQuery.isLoading && <LoanRequestSkeletonList />}

        {hasToken && activeQuery.isError && (
          <StateMessage
            action={<RetryButton onClick={() => void activeQuery.refetch()} />}
            message="Impossible de charger vos demandes pour le moment."
            title="Une erreur est survenue"
          />
        )}

        {hasToken && activeQuery.isSuccess && mutationError !== null && mutationError !== undefined && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {getErrorMessage(mutationError)}
          </div>
        )}

        {hasToken && activeQuery.isSuccess && activeRequests.length === 0 && (
          <StateMessage
            message={activeTab === 'received' ? "Vous n'avez reçu aucune demande d'emprunt." : "Vous n'avez envoyé aucune demande d'emprunt."}
            title={activeTab === 'received' ? 'Aucune demande reçue' : 'Aucune demande envoyée'}
          />
        )}

        {hasToken && activeQuery.isSuccess && activeRequests.length > 0 && (
          <section className="grid gap-6 lg:grid-cols-2">
            {activeRequests.map((loanRequest) => (
              <LoanRequestCard
                key={loanRequest.id}
                loanRequest={loanRequest}
                mode={activeTab}
                onAnswer={handleAnswer}
                pendingAction={pendingAction}
              />
            ))}
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

function TabButton({ active, count, label, onClick }: { active: boolean; count?: number; label: string; onClick: () => void }) {
  return (
    <button
      className={[
        'border-b-2 pb-3 pr-8 text-sm font-bold uppercase tracking-[1.4px] transition',
        active ? 'border-[#1a4231] text-[#1a4231]' : 'border-transparent text-[#3f4944]/60 hover:text-[#1a4231]',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {label}{count !== undefined ? ' (' + count + ')' : ''}
    </button>
  )
}

function LoanRequestCard({
  loanRequest,
  mode,
  onAnswer,
  pendingAction,
}: {
  loanRequest: LoanRequest
  mode: ActiveTab
  onAnswer: (id: number, action: LoanAction) => void
  pendingAction: { id: number; action: LoanAction } | null
}) {
  const isPending = loanRequest.status === 'en_attente'
  const isAccepting = pendingAction?.id === loanRequest.id && pendingAction.action === 'accept'
  const isRefusing = pendingAction?.id === loanRequest.id && pendingAction.action === 'refuse'
  const person = mode === 'received' ? loanRequest.borrower?.email : loanRequest.item?.owner?.email
  const title = mode === 'received'
    ? formatPerson(person) + ' a demandé votre ' + (loanRequest.item?.title ?? 'objet')
    : 'Demande pour ' + (loanRequest.item?.title ?? 'un objet')

  return (
    <article className={getCardClassName(loanRequest.status)}>
      <div className="flex gap-4">
        <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f0f1eb] text-[#1a4231]/50">
          <BoxIcon />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={getStatusDotClassName(loanRequest.status)} />
            <p className={getStatusTextClassName(loanRequest.status)}>{STATUS_LABELS[loanRequest.status] ?? loanRequest.status}</p>
          </div>
          <h2 className="mt-2 text-base font-bold leading-5 text-[#0f1714]">{title}</h2>
          <p className="mt-2 text-sm leading-5 text-[#3f4944]/80">{formatDateRange(loanRequest.startDate, loanRequest.endDate)}</p>
          {mode === 'sent' && loanRequest.item?.owner !== null && loanRequest.item?.owner !== undefined && (
            <p className="mt-1 break-all text-xs text-slate-500">Propriétaire : {loanRequest.item.owner.email}</p>
          )}
        </div>
      </div>

      {mode === 'received' && isPending && (
        <div className="grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-full border border-[#707973] px-4 text-sm font-bold text-[#1a4231] transition hover:bg-[#edf1ea] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={pendingAction !== null}
            onClick={() => onAnswer(loanRequest.id, 'refuse')}
            type="button"
          >
            {isRefusing ? 'Refus...' : 'Refuser'}
          </button>
          <button
            className="h-12 rounded-full bg-[#1a4231] px-4 text-sm font-bold text-white shadow-lg shadow-[#1a4231]/20 transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={pendingAction !== null}
            onClick={() => onAnswer(loanRequest.id, 'accept')}
            type="button"
          >
            {isAccepting ? 'Acceptation...' : 'Accepter'}
          </button>
        </div>
      )}
    </article>
  )
}

function AuthRequiredState() {
  return (
    <StateMessage
      action={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="inline-flex justify-center rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143629]" to="/login">
            Se connecter
          </Link>
          <Link className="inline-flex justify-center rounded-full bg-[#edf1ea] px-5 py-3 text-sm font-bold text-[#1a4231] transition hover:bg-[#e2ebe4]" to="/register">
            Créer un compte
          </Link>
        </div>
      }
      message="Connectez-vous pour consulter vos demandes d'emprunt."
      title="Connexion requise"
    />
  )
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143629]" onClick={onClick} type="button">
      Réessayer
    </button>
  )
}

function StateMessage({ action, message, title }: { action?: ReactNode; message: string; title: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  )
}

function LoanRequestSkeletonList() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="animate-pulse rounded-[2rem] bg-white p-5 shadow-sm" key={index}>
          <div className="flex gap-4">
            <div className="h-24 w-20 rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-5 w-4/5 rounded bg-slate-200" />
              <div className="h-4 w-36 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

function getCardClassName(status: string): string {
  const baseClassName = 'flex flex-col gap-4 rounded-[2rem] p-5 shadow-sm'

  if (status === 'acceptee') {
    return baseClassName + ' border border-[#1a4231]/5 bg-[#f5f2e8]'
  }

  if (status === 'refusee') {
    return baseClassName + ' border border-red-100 bg-red-50/50'
  }

  return baseClassName + ' bg-white'
}

function getStatusDotClassName(status: string): string {
  const color = status === 'acceptee' ? 'bg-[#1a4231]' : status === 'refusee' ? 'bg-red-600' : 'bg-[#f59e0b]'

  return 'h-2 w-2 shrink-0 rounded-full ' + color
}

function getStatusTextClassName(status: string): string {
  const color = status === 'acceptee' ? 'text-[#1a4231]' : status === 'refusee' ? 'text-red-700' : 'text-[#3f4944]'

  return 'text-[10px] font-bold uppercase tracking-[1px] ' + color
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDateValue(startDate)
  const end = parseDateValue(endDate)

  if (start === null || end === null) {
    return 'Dates non renseignées'
  }

  return 'Du ' + formatShortDate(start) + ' au ' + formatShortDate(end)
}

function parseDateValue(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

function formatPerson(email: string | null | undefined): string {
  if (email === null || email === undefined || email === '') {
    return 'Un utilisateur'
  }

  return email.split('@')[0]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error ? error.message : "Le traitement de la demande a échoué."
}

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8a6 6 0 0 0-12 0c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}
