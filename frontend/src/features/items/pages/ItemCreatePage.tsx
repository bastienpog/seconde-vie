import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { getAuthToken } from '../../../lib/api.ts'
import { queryClient } from '../../../lib/queryClient.ts'
import { DesktopNavigation } from '../components/DesktopNavigation.tsx'
import { ItemForm } from '../components/ItemForm.tsx'
import { useCreateItemMutation } from '../hooks.ts'
import type { ItemPayload } from '../services/itemsApi.ts'

export function ItemCreatePage() {
  const navigate = useNavigate()
  const hasToken = getAuthToken() !== null
  const createItemMutation = useCreateItemMutation()

  function handleSubmit(payload: ItemPayload) {
    if (!hasToken) {
      return
    }

    createItemMutation.mutate(payload, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['items'] }),
          queryClient.invalidateQueries({ queryKey: ['me', 'items'] }),
        ])
        navigate('/me/items')
      },
    })
  }

  if (!hasToken) {
    return (
      <ItemFormPageShell title="Prêter un objet" description="Publiez un objet disponible pour le prêt local.">
        <AuthRequiredState />
      </ItemFormPageShell>
    )
  }

  return (
    <ItemFormPageShell title="Prêter un objet" description="Publiez un objet disponible pour le prêt local.">
      <ItemForm
        error={createItemMutation.error}
        isPending={createItemMutation.isPending}
        mode="create"
        onSubmit={handleSubmit}
      />
    </ItemFormPageShell>
  )
}

export function ItemFormPageShell({
  children,
  backTo = '/',
  description,
  title,
}: {
  backTo?: string
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <div className="min-h-screen bg-[#fdfcf8] text-slate-950 sm:bg-[#f8f8f3]">
      <header className="sticky top-0 z-10 border-b border-[#1a4231]/10 bg-[#fdfcf8]/95 backdrop-blur sm:static sm:bg-transparent">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[2.5rem_1fr_2.5rem] items-center px-6 sm:flex sm:h-auto sm:justify-between sm:gap-6 sm:px-5 sm:py-7 lg:px-6 lg:py-8">
          <Link
            aria-label="Retour"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1a4231] transition hover:bg-[#edf1ea]"
            to={backTo}
          >
            <ArrowLeftIcon />
          </Link>

          <div className="text-center sm:text-left">
            <h1 className="text-lg font-bold text-[#1a4231] sm:text-4xl">{title}</h1>
            <p className="mt-3 hidden max-w-lg text-sm leading-6 text-slate-600 sm:block">
              {description}
            </p>
          </div>

          <div className="hidden sm:flex">
            <DesktopNavigation />
          </div>
          <span className="h-10 w-10 sm:hidden" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-5 sm:pt-0 lg:px-6">
        {children}
      </main>
    </div>
  )
}

function AuthRequiredState() {
  return (
    <StateMessage
      action={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex justify-center rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143629]"
            to="/login"
          >
            Se connecter
          </Link>
          <Link
            className="inline-flex justify-center rounded-full bg-[#edf1ea] px-5 py-3 text-sm font-bold text-[#1a4231] transition hover:bg-[#e2ebe4]"
            to="/register"
          >
            Créer un compte
          </Link>
        </div>
      }
      message="Connectez-vous pour publier un objet."
      title="Connexion requise"
    />
  )
}

function StateMessage({ action, message, title }: { action?: ReactNode; message: string; title: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  )
}

function ArrowLeftIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}
