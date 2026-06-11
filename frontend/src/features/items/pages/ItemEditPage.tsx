import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getAuthToken } from '../../../lib/api.ts'
import { queryClient } from '../../../lib/queryClient.ts'
import { ItemForm } from '../components/ItemForm.tsx'
import { useItemQuery, useUpdateItemMutation } from '../hooks.ts'
import type { ItemPayload } from '../services/itemsApi.ts'
import { ItemFormPageShell } from './ItemCreatePage.tsx'

export function ItemEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const hasToken = getAuthToken() !== null
  const itemQuery = useItemQuery(itemId)
  const updateItemMutation = useUpdateItemMutation(itemId)

  function handleSubmit(payload: ItemPayload) {
    if (!hasToken || !Number.isFinite(itemId)) {
      return
    }

    updateItemMutation.mutate(payload, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['items'] }),
          queryClient.invalidateQueries({ queryKey: ['items', itemId] }),
          queryClient.invalidateQueries({ queryKey: ['me', 'items'] }),
        ])
        navigate('/me/items')
      },
    })
  }

  if (!hasToken) {
    return (
      <ItemFormPageShell backTo="/me/items" title="Modifier un objet" description="Mettez à jour les informations de votre annonce.">
        <AuthRequiredState />
      </ItemFormPageShell>
    )
  }

  if (!Number.isFinite(itemId)) {
    return (
      <ItemFormPageShell backTo="/me/items" title="Modifier un objet" description="Mettez à jour les informations de votre annonce.">
        <StateMessage message="L'identifiant de l'objet est invalide." title="Objet introuvable" />
      </ItemFormPageShell>
    )
  }

  if (itemQuery.isLoading) {
    return (
      <ItemFormPageShell backTo="/me/items" title="Modifier un objet" description="Mettez à jour les informations de votre annonce.">
        <EditSkeleton />
      </ItemFormPageShell>
    )
  }

  if (itemQuery.isError || itemQuery.data === undefined) {
    return (
      <ItemFormPageShell backTo="/me/items" title="Modifier un objet" description="Mettez à jour les informations de votre annonce.">
        <StateMessage message="Cet objet n'existe pas ou n'est plus disponible." title="Objet introuvable" />
      </ItemFormPageShell>
    )
  }

  return (
    <ItemFormPageShell backTo="/me/items" title="Modifier un objet" description="Mettez à jour les informations de votre annonce.">
      <ItemForm
        error={updateItemMutation.error}
        initialItem={itemQuery.data}
        isPending={updateItemMutation.isPending}
        mode="edit"
        onSubmit={handleSubmit}
      />
    </ItemFormPageShell>
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
      message="Connectez-vous pour modifier vos objets."
      title="Connexion requise"
    />
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
    <div className="mx-auto max-w-xl rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  )
}

function EditSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl animate-pulse flex-col gap-8">
      <div className="h-48 rounded-[2rem] bg-slate-200" />
      <div className="space-y-7">
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
      </div>
    </div>
  )
}
