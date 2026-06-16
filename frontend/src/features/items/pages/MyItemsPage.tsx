import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AppHeader } from '../../../components/ui/AppHeader.tsx'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx'
import { ApiError, getAuthToken } from '../../../lib/api.ts'
import { queryClient } from '../../../lib/queryClient.ts'
import { BottomNavigation } from '../components/BottomNavigation.tsx'
import { DesktopNavigation } from '../components/DesktopNavigation.tsx'
import { ItemCard } from '../components/ItemCard.tsx'
import { useDeleteItemMutation, useMyItemsQuery } from '../hooks.ts'
import type { Item } from '../services/itemsApi.ts'

export function MyItemsPage() {
  const hasToken = getAuthToken() !== null
  const myItemsQuery = useMyItemsQuery()
  const deleteItemMutation = useDeleteItemMutation()
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const isUnauthorizedError = myItemsQuery.error instanceof ApiError && myItemsQuery.error.status === 401

  function handleConfirmDelete() {
    if (itemToDelete === null) {
      return
    }

    deleteItemMutation.mutate(itemToDelete.id, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['items'] }),
          queryClient.invalidateQueries({ queryKey: ['me', 'items'] }),
        ])
        setItemToDelete(null)
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-32 text-slate-950 sm:bg-[#f8f8f3] sm:pb-12">
      <AppHeader navigation={<DesktopNavigation />} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5 sm:pt-0 lg:px-6">
        <section className="mb-6 sm:mb-7 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a4231] sm:text-4xl">Mes objets</h1>
            <p className="mt-3 hidden max-w-lg text-sm leading-6 text-slate-600 sm:block">
              Retrouvez les objets que vous proposez au prêt et gardez votre catalogue à jour.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link
              className="rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1a4231]/15 transition hover:bg-[#143629]"
              to="/items/new"
            >
              Publier un objet
            </Link>
          </div>
        </section>

        {!hasToken && <AuthRequiredState />}

        {hasToken && myItemsQuery.isLoading && <ItemGridSkeleton />}

        {hasToken && myItemsQuery.isError && (
          isUnauthorizedError ? (
            <AuthRequiredState />
          ) : (
            <StateMessage
              action={<RetryButton onClick={() => void myItemsQuery.refetch()} />}
              message="Impossible de charger vos objets pour le moment."
              title="Une erreur est survenue"
            />
          )
        )}

        {hasToken && myItemsQuery.isSuccess && myItemsQuery.data.length === 0 && (
          <StateMessage
            action={
              <Link
                className="inline-flex rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143629]"
                to="/items/new"
              >
                Publier un objet
              </Link>
            }
            message="Vous n'avez pas encore publié d'objet."
            title="Aucun objet publié"
          />
        )}

        {hasToken && myItemsQuery.isSuccess && myItemsQuery.data.length > 0 && (
          <>
            {deleteItemMutation.isError && (
              <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {getDeleteErrorMessage(deleteItemMutation.error)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
              {myItemsQuery.data.map((item) => (
                <div className="flex min-w-0 flex-col gap-3" key={item.id}>
                  <ItemCard item={item} />
                  <div className="grid grid-cols-2 gap-2 px-1">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[#edf1ea] px-3 text-xs font-bold text-[#1a4231] transition hover:bg-[#e2ebe4] sm:text-sm"
                      to={'/items/' + item.id + '/edit'}
                    >
                      Modifier
                    </Link>
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-full bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
                      disabled={deleteItemMutation.isPending}
                      onClick={() => setItemToDelete(item)}
                      type="button"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Supprimer"
        isLoading={deleteItemMutation.isPending}
        isOpen={itemToDelete !== null}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cet objet ?"
      >
        Cette action supprimera définitivement {itemToDelete?.title}. Elle ne pourra pas être annulée.
      </ConfirmDialog>

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
      message="Connectez-vous pour consulter les objets que vous avez publiés."
      title="Connexion requise"
    />
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

function StateMessage({
  action,
  message,
  title,
}: {
  action?: ReactNode
  message: string
  title: string
}) {
  return (
    <div className="rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  )
}

function ItemGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="animate-pulse" key={index}>
          <div className="aspect-[4/5] rounded-2xl bg-slate-200" />
          <div className="mt-3 h-4 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

function getDeleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error ? error.message : "La suppression de l'objet a échoué."
}
