import { useState, type FormEvent, type ReactNode } from 'react'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx'
import { ApiError } from '../../../lib/api.ts'
import { queryClient } from '../../../lib/queryClient.ts'
import { BottomNavigation } from '../../items/components/BottomNavigation.tsx'
import { DesktopNavigation } from '../../items/components/DesktopNavigation.tsx'
import type { Category } from '../../categories/services/categoriesApi.ts'
import type { Item } from '../../items/services/itemsApi.ts'
import {
  useAdminCategoriesQuery,
  useAdminItemsQuery,
  useCreateCategoryMutation,
  useDeleteAdminItemMutation,
  useDeleteCategoryMutation,
  usePromoteUserToAdminMutation,
  useUpdateCategoryMutation,
} from '../hooks.ts'

type DeleteTarget =
  | { type: 'category'; id: number; label: string }
  | { type: 'item'; id: number; label: string }

export function AdminPage() {
  const categoriesQuery = useAdminCategoriesQuery()
  const itemsQuery = useAdminItemsQuery()
  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const deleteCategoryMutation = useDeleteCategoryMutation()
  const deleteAdminItemMutation = useDeleteAdminItemMutation()
  const promoteUserToAdminMutation = usePromoteUserToAdminMutation()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [adminUserEmail, setAdminUserEmail] = useState('')
  const [editedCategory, setEditedCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newCategoryName.trim()

    if (name === '') {
      return
    }

    createCategoryMutation.mutate({ name }, {
      onSuccess: async () => {
        setNewCategoryName('')
        await queryClient.invalidateQueries({ queryKey: ['categories'] })
      },
    })
  }

  function handleUpdateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (editedCategory === null) {
      return
    }

    const name = editedCategory.name.trim()

    if (name === '') {
      return
    }

    updateCategoryMutation.mutate({ id: editedCategory.id, payload: { name } }, {
      onSuccess: async () => {
        setEditedCategory(null)
        await queryClient.invalidateQueries({ queryKey: ['categories'] })
      },
    })
  }

  function handlePromoteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = adminUserEmail.trim()

    if (email === '') {
      return
    }

    promoteUserToAdminMutation.mutate(email, {
      onSuccess: async () => {
        setAdminUserEmail('')
        await queryClient.invalidateQueries({ queryKey: ['me'] })
      },
    })
  }

  function handleConfirmDelete() {
    if (deleteTarget === null) {
      return
    }

    if (deleteTarget.type === 'category') {
      deleteCategoryMutation.mutate(deleteTarget.id, {
        onSuccess: async () => {
          setDeleteTarget(null)
          await queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
      })

      return
    }

    deleteAdminItemMutation.mutate(deleteTarget.id, {
      onSuccess: async () => {
        setDeleteTarget(null)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin', 'items'] }),
          queryClient.invalidateQueries({ queryKey: ['items'] }),
          queryClient.invalidateQueries({ queryKey: ['me', 'items'] }),
        ])
      },
    })
  }

  const deleteError = deleteCategoryMutation.error ?? deleteAdminItemMutation.error
  const isDeleting = deleteCategoryMutation.isPending || deleteAdminItemMutation.isPending

  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-32 text-slate-950 sm:bg-[#f8f8f3] sm:pb-12">
      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5 sm:pt-7 lg:px-6 lg:pt-8">
        <header className="mb-6 sm:mb-7 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-center text-2xl font-bold tracking-tight text-[#1a4231] sm:text-left sm:text-4xl">
              Administration
            </h1>
            <p className="mt-3 hidden max-w-lg text-sm leading-6 text-slate-600 sm:block">
              Gestion minimale des categories et des objets publies.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <DesktopNavigation />
          </div>
        </header>

        <section className="mb-6 rounded-[1.5rem] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Utilisateurs</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Ajoutez le role administrateur a un utilisateur existant.</p>
            </div>
          </div>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handlePromoteUser}>
            <input
              className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#1a4231]"
              onChange={(event) => setAdminUserEmail(event.target.value)}
              placeholder="email@exemple.com"
              type="email"
              value={adminUserEmail}
            />
            <button
              className="h-12 rounded-full bg-[#1a4231] px-5 text-sm font-bold text-white transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={promoteUserToAdminMutation.isPending || adminUserEmail.trim() === ''}
              type="submit"
            >
              Ajouter admin
            </button>
          </form>

          {promoteUserToAdminMutation.isError && <ErrorMessage error={promoteUserToAdminMutation.error} />}
          {promoteUserToAdminMutation.isSuccess && (
            <p className="mt-4 rounded-2xl bg-[#edf1ea] px-4 py-3 text-sm font-semibold text-[#1a4231]">
              {promoteUserToAdminMutation.data.email} est maintenant administrateur.
            </p>
          )}
        </section>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Categories</h2>
                <p className="mt-1 text-sm text-slate-500">{getCategoryCountLabel(categoriesQuery.data?.length ?? 0)}</p>
              </div>
              {categoriesQuery.isFetching && <p className="text-xs font-bold uppercase text-slate-400">Chargement</p>}
            </div>

            <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateCategory}>
              <input
                className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#1a4231]"
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Nom de la categorie"
                type="text"
                value={newCategoryName}
              />
              <button
                className="h-12 rounded-full bg-[#1a4231] px-5 text-sm font-bold text-white transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={createCategoryMutation.isPending || newCategoryName.trim() === ''}
                type="submit"
              >
                Ajouter
              </button>
            </form>

            {createCategoryMutation.isError && <ErrorMessage error={createCategoryMutation.error} />}
            {updateCategoryMutation.isError && <ErrorMessage error={updateCategoryMutation.error} />}
            {deleteCategoryMutation.isError && <ErrorMessage error={deleteCategoryMutation.error} />}

            {categoriesQuery.isLoading && <ListSkeleton />}

            {categoriesQuery.isError && (
              <StateMessage
                action={<RetryButton onClick={() => void categoriesQuery.refetch()} />}
                message="Impossible de charger les categories."
                title="Erreur de chargement"
              />
            )}

            {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
              <StateMessage message="Aucune categorie n'est disponible." title="Aucune categorie" />
            )}

            {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
              <div className="mt-5 divide-y divide-slate-100">
                {categoriesQuery.data.map((category) => (
                  <CategoryRow
                    category={category}
                    editedCategory={editedCategory}
                    isSaving={updateCategoryMutation.isPending}
                    key={category.id}
                    onCancelEdit={() => setEditedCategory(null)}
                    onDelete={() => setDeleteTarget({ type: 'category', id: category.id, label: category.name })}
                    onEdit={setEditedCategory}
                    onSubmitEdit={handleUpdateCategory}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Objets</h2>
                <p className="mt-1 text-sm text-slate-500">{getItemCountLabel(itemsQuery.data?.length ?? 0)}</p>
              </div>
              {itemsQuery.isFetching && <p className="text-xs font-bold uppercase text-slate-400">Chargement</p>}
            </div>

            {deleteAdminItemMutation.isError && <ErrorMessage error={deleteAdminItemMutation.error} />}

            {itemsQuery.isLoading && <ListSkeleton />}

            {itemsQuery.isError && (
              <StateMessage
                action={<RetryButton onClick={() => void itemsQuery.refetch()} />}
                message={getErrorMessage(itemsQuery.error)}
                title="Acces admin indisponible"
              />
            )}

            {itemsQuery.isSuccess && itemsQuery.data.length === 0 && (
              <StateMessage message="Aucun objet n'a ete publie." title="Aucun objet" />
            )}

            {itemsQuery.isSuccess && itemsQuery.data.length > 0 && (
              <div className="mt-5 space-y-3">
                {itemsQuery.data.map((item) => (
                  <ItemAdminRow
                    item={item}
                    key={item.id}
                    onDelete={() => setDeleteTarget({ type: 'item', id: item.id, label: item.title })}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <ConfirmDialog
        confirmLabel="Supprimer"
        isLoading={isDeleting}
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer definitivement ?"
      >
        Cette action supprimera {deleteTarget?.label}. Elle ne pourra pas etre annulee.
        {deleteError !== null && deleteError !== undefined && <ErrorMessage error={deleteError} />}
      </ConfirmDialog>

      <BottomNavigation />
    </div>
  )
}

function CategoryRow({
  category,
  editedCategory,
  isSaving,
  onCancelEdit,
  onDelete,
  onEdit,
  onSubmitEdit,
}: {
  category: Category
  editedCategory: Category | null
  isSaving: boolean
  onCancelEdit: () => void
  onDelete: () => void
  onEdit: (category: Category) => void
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const isEditing = editedCategory?.id === category.id

  if (isEditing) {
    return (
      <form className="flex flex-col gap-3 py-4 sm:flex-row" onSubmit={onSubmitEdit}>
        <input
          className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-[#1a4231]"
          onChange={(event) => onEdit({ ...category, name: event.target.value })}
          type="text"
          value={editedCategory.name}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            className="h-11 rounded-full bg-[#1a4231] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving || editedCategory.name.trim() === ''}
            type="submit"
          >
            Valider
          </button>
          <button
            className="h-11 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700"
            disabled={isSaving}
            onClick={onCancelEdit}
            type="button"
          >
            Annuler
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words text-sm font-bold text-slate-950">{category.name}</p>
        <p className="mt-1 break-all text-xs font-semibold text-slate-400">{category.slug ?? 'sans-slug'}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button
          className="h-10 rounded-full bg-[#edf1ea] px-4 text-xs font-bold text-[#1a4231] transition hover:bg-[#e2ebe4]"
          onClick={() => onEdit(category)}
          type="button"
        >
          Modifier
        </button>
        <button
          className="h-10 rounded-full bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:bg-red-100"
          onClick={onDelete}
          type="button"
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

function ItemAdminRow({ item, onDelete }: { item: Item; onDelete: () => void }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-[#fbfbf7] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-bold text-slate-950">{item.title}</h3>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase text-[#1a4231]">
              {item.status}
            </span>
          </div>
          <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <ItemMeta label="Ville" value={item.city} />
            <ItemMeta label="Categorie" value={item.category?.name ?? 'Sans categorie'} />
            <ItemMeta label="Proprietaire" value={item.owner?.email ?? 'Inconnu'} />
            <ItemMeta label="Publie" value={formatDate(item.createdAt)} />
          </dl>
        </div>
        <button
          className="h-10 shrink-0 rounded-full bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:bg-red-100"
          onClick={onDelete}
          type="button"
        >
          Supprimer
        </button>
      </div>
    </article>
  )
}

function ItemMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-bold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-600">{value}</dd>
    </div>
  )
}

function ErrorMessage({ error }: { error: unknown }) {
  return <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{getErrorMessage(error)}</p>
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143629]"
      onClick={onClick}
      type="button"
    >
      Reessayer
    </button>
  )
}

function StateMessage({ action, message, title }: { action?: ReactNode; message: string; title: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-[#f5f6f1] px-5 py-8 text-center">
      <p className="text-base font-bold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action !== undefined && <div className="mt-5">{action}</div>}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" key={index} />
      ))}
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error ? error.message : 'Une erreur est survenue.'
}

function getCategoryCountLabel(count: number): string {
  return count > 1 ? `${count} categories` : `${count} categorie`
}

function getItemCountLabel(count: number): string {
  return count > 1 ? `${count} objets` : `${count} objet`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
