import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getAuthToken } from '../../../lib/api.ts'
import { queryClient } from '../../../lib/queryClient.ts'
import { LoanRequestSheet } from '../../loans/components/LoanRequestSheet.tsx'
import { useCreateLoanRequestMutation } from '../../loans/hooks.ts'
import type { CreateLoanRequestPayload } from '../../loans/services/loansApi.ts'
import { BottomNavigation } from '../components/BottomNavigation.tsx'
import { DesktopNavigation } from '../components/DesktopNavigation.tsx'
import { ItemImage } from '../components/ItemImage.tsx'
import { useItemQuery } from '../hooks.ts'

export function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const itemQuery = useItemQuery(itemId)
  const createLoanRequestMutation = useCreateLoanRequestMutation(itemId)
  const [isLoanSheetOpen, setIsLoanSheetOpen] = useState(false)
  const [loanRequestSuccessMessage, setLoanRequestSuccessMessage] = useState<string | null>(null)
  const hasToken = getAuthToken() !== null

  function handleOpenLoanRequest() {
    if (!hasToken) {
      navigate('/login')
      return
    }

    setLoanRequestSuccessMessage(null)
    createLoanRequestMutation.reset()
    setIsLoanSheetOpen(true)
  }

  function handleSubmitLoanRequest(payload: CreateLoanRequestPayload) {
    createLoanRequestMutation.mutate(payload, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['loan-requests', 'sent'] })
        setIsLoanSheetOpen(false)
        setLoanRequestSuccessMessage("Votre demande d'emprunt a été envoyée.")
      },
    })
  }

  if (!Number.isFinite(itemId)) {
    return <DetailState message="L'identifiant de l'objet est invalide." title="Objet introuvable" />
  }

  if (itemQuery.isLoading) {
    return <DetailSkeleton />
  }

  if (itemQuery.isError || itemQuery.data === undefined) {
    return <DetailState message="Cet objet n'existe pas ou n'est plus disponible." title="Objet introuvable" />
  }

  const item = itemQuery.data

  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-32 text-slate-950 sm:bg-[#f8f8f3] sm:pb-12">
      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5 sm:pt-7 lg:px-6 lg:pt-8">
        <header className="mb-6 sm:mb-7 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:block">
            <Link
              aria-label="Retour aux objets"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1a4231] shadow-sm transition hover:bg-[#edf1ea] sm:hidden"
              to="/"
            >
              <ArrowLeftIcon />
            </Link>

            <div>
              <p className="text-center text-2xl font-bold tracking-tight text-[#1a4231] sm:text-left sm:text-4xl">
                Seconde Vie
              </p>
              <p className="mt-3 hidden max-w-lg text-sm leading-6 text-slate-600 sm:block">
                Consultez les détails de l'objet avant de demander un emprunt.
              </p>
            </div>

            <span className="h-11 w-11 sm:hidden" />
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <DesktopNavigation />
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#1a4231] shadow-sm transition hover:bg-[#edf1ea]"
              to="/"
            >
              <ArrowLeftIcon />
              Retour
            </Link>
          </div>
        </header>

        <article className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start lg:gap-6">
          <section className="overflow-hidden rounded-2xl bg-slate-100 sm:rounded-[1.5rem] lg:sticky lg:top-6">
            <div className="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5]">
              <ItemImage item={item} />
            </div>
          </section>

          <section className="pt-5 lg:rounded-[1.5rem] lg:bg-white lg:p-6 lg:shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a4231] shadow-sm lg:bg-[#e8f0ea] lg:shadow-none">
                {item.condition}
              </span>
              {item.category !== null && (
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-600 shadow-sm lg:bg-slate-100 lg:shadow-none">
                  {item.category.name}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
              {item.title}
            </h1>

            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <MapPinIcon />
              Disponible à {item.city}
            </div>

            <div className="mt-7 rounded-[1.5rem] bg-white p-5 shadow-sm lg:mt-8 lg:bg-transparent lg:p-0 lg:shadow-none">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Description</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-700">{item.description}</p>
            </div>

            {item.owner !== null && (
              <div className="mt-4 rounded-[1.5rem] bg-white p-5 shadow-sm lg:mt-6 lg:bg-[#f5f6f1] lg:p-4 lg:shadow-none">
                <h2 className="text-sm font-bold text-slate-950">Propriétaire</h2>
                <p className="mt-1 break-all text-sm text-slate-600">{item.owner.email}</p>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-6 lg:grid-cols-1">
              <button
                className="rounded-full bg-[#1a4231] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#1a4231]/15 transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleOpenLoanRequest}
                type="button"
              >
                {hasToken ? 'Demander un emprunt' : 'Se connecter pour emprunter'}
              </button>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-[#edf1ea] px-5 py-4 text-sm font-bold text-[#1a4231] transition hover:bg-[#e2ebe4]"
                to="/"
              >
                Voir les autres objets
              </Link>
            </div>

            {loanRequestSuccessMessage !== null && (
              <p className="mt-3 rounded-2xl bg-[#e8f0ea] px-4 py-3 text-center text-sm font-semibold text-[#1a4231] lg:text-left">
                {loanRequestSuccessMessage}
              </p>
            )}
          </section>
        </article>
      </div>

      <LoanRequestSheet
        error={createLoanRequestMutation.error}
        isOpen={isLoanSheetOpen}
        isPending={createLoanRequestMutation.isPending}
        item={item}
        onClose={() => setIsLoanSheetOpen(false)}
        onSubmit={handleSubmitLoanRequest}
      />

      <BottomNavigation showCreateButton={false} />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-32 sm:bg-[#f8f8f3] sm:pb-12">
      <div className="mx-auto w-full max-w-6xl animate-pulse px-4 pt-5 sm:px-5 sm:pt-7 lg:px-6 lg:pt-8">
        <div className="mb-6 h-9 w-40 rounded bg-slate-200 sm:h-12" />
        <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-6">
          <div className="aspect-[4/5] rounded-2xl bg-slate-200 sm:aspect-[16/10] lg:aspect-[4/5]" />
          <div className="pt-5 lg:rounded-[1.5rem] lg:bg-white lg:p-6 lg:shadow-sm">
            <div className="h-6 w-36 rounded-full bg-slate-200" />
            <div className="mt-5 h-8 w-3/4 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-1/2 rounded bg-slate-200" />
            <div className="mt-8 space-y-3 rounded-[1.5rem] bg-white p-5 shadow-sm lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="h-4 rounded bg-slate-200" />
              <div className="h-4 rounded bg-slate-200" />
              <div className="h-4 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailState({ message, title }: { message: string; title: string }) {
  return (
    <div className="min-h-screen bg-[#fdfcf8] px-4 py-10 text-slate-950 sm:bg-[#f8f8f3]">
      <div className="mx-auto max-w-xl rounded-[1.5rem] bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-xl font-bold text-slate-950">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <Link
          className="mt-6 inline-flex rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white"
          to="/"
        >
          Retour aux objets
        </Link>
      </div>
    </div>
  )
}

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg className="h-4 w-4 text-[#1a4231]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
