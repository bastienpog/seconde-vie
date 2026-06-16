import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppHeader } from '../../../components/ui/AppHeader.tsx'
import { ApiError, clearAuthToken, getAuthToken } from '../../../lib/api.ts'
import { queryClient } from '../../../lib/queryClient.ts'
import { useDeleteMeMutation, useMeQuery } from '../../auth/hooks.ts'
import { BottomNavigation } from '../../items/components/BottomNavigation.tsx'
import { DesktopNavigation } from '../../items/components/DesktopNavigation.tsx'

export function ProfilePage() {
  const navigate = useNavigate()
  const hasToken = getAuthToken() !== null
  const meQuery = useMeQuery()
  const deleteMeMutation = useDeleteMeMutation()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  function handleLogout() {
    clearAuthToken()
    queryClient.clear()
    navigate('/')
  }

  function handleDeleteAccount() {
    deleteMeMutation.mutate(undefined, {
      onSuccess: () => {
        clearAuthToken()
        queryClient.clear()
        navigate('/')
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-32 text-slate-950 sm:bg-[#f8f8f3] sm:pb-12">
      <AppHeader navigation={<DesktopNavigation />} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5 sm:pt-0 lg:px-6">
        <section className="mb-6 sm:mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a4231] sm:text-4xl">Profil</h1>
          <p className="mt-3 hidden max-w-lg text-sm leading-6 text-slate-600 sm:block">
            Consultez vos informations et gérez votre compte Seconde Vie.
          </p>
        </section>

        {!hasToken && <AuthRequiredState />}

        {hasToken && meQuery.isLoading && <ProfileSkeleton />}

        {hasToken && meQuery.isError && (
          <StateMessage
            action={<RetryButton onClick={() => void meQuery.refetch()} />}
            message="Impossible de charger votre profil pour le moment."
            title="Une erreur est survenue"
          />
        )}

        {hasToken && meQuery.isSuccess && (
          <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.55fr)]">
            <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#d5e8cf] text-2xl font-extrabold text-[#1a4231]">
                  {getInitials(meQuery.data.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-950">{meQuery.data.name}</p>
                  <p className="mt-1 break-all text-sm text-slate-500">{meQuery.data.email}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <ProfileInfo label="Identifiant" value={String(meQuery.data.id)} />
                <ProfileInfo label="Rôle" value={formatRoles(meQuery.data.roles)} />
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-950">Session</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Vous pouvez vous déconnecter de cet appareil à tout moment.
                </p>
                <button
                  className="mt-5 h-12 w-full rounded-full bg-[#edf1ea] px-4 text-sm font-bold text-[#1a4231] transition hover:bg-[#e2ebe4]"
                  onClick={handleLogout}
                  type="button"
                >
                  Se déconnecter
                </button>
              </section>

              <section className="rounded-[1.5rem] border border-red-100 bg-red-50/60 p-6">
                <h2 className="text-base font-bold text-red-800">Supprimer mon compte</h2>
                <p className="mt-2 text-sm leading-6 text-red-700/80">
                  Cette action supprimera votre compte, vos objets publiés et les demandes associées.
                </p>
                <button
                  className="mt-5 h-12 w-full rounded-full bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={deleteMeMutation.isPending}
                  onClick={() => setIsDeleteDialogOpen(true)}
                  type="button"
                >
                  Supprimer mon compte
                </button>
              </section>
            </aside>
          </main>
        )}
      </div>

      <DeleteAccountDialog
        error={deleteMeMutation.error}
        isLoading={deleteMeMutation.isPending}
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
      />

      <BottomNavigation />
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
      message="Connectez-vous pour consulter votre profil."
      title="Connexion requise"
    />
  )
}

function ProfileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f6f1] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-[#1a4231]">{value}</p>
    </div>
  )
}

function DeleteAccountDialog({
  error,
  isLoading,
  isOpen,
  onCancel,
  onConfirm,
}: {
  error: unknown
  isLoading: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 py-6 sm:items-center">
      <section aria-modal="true" className="w-full max-w-md rounded-[1.5rem] bg-white p-6 shadow-2xl" role="dialog">
        <h2 className="text-lg font-bold text-slate-950">Supprimer le compte ?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Cette suppression est définitive. Vos objets publiés et vos demandes d'emprunt associées seront supprimés.
        </p>

        {error !== null && error !== undefined && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {getErrorMessage(error)}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            Annuler
          </button>
          <button
            className="h-12 rounded-full bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </section>
    </div>
  )
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143629]"
      onClick={onClick}
      type="button"
    >
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

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.55fr)]">
      <div className="animate-pulse rounded-[1.5rem] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-4 w-64 max-w-full rounded bg-slate-200" />
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="h-20 rounded-2xl bg-slate-200" />
          <div className="h-20 rounded-2xl bg-slate-200" />
        </div>
      </div>
      <div className="h-48 animate-pulse rounded-[1.5rem] bg-white shadow-sm" />
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function formatRoles(roles: string[]): string {
  if (roles.includes('ROLE_ADMIN')) {
    return 'Administrateur'
  }

  return 'Utilisateur'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error ? error.message : "L'opération a échoué."
}
