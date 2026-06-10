import { Link, useParams } from 'react-router'
import { ItemImage } from '../components/ItemImage.tsx'
import { useItemQuery } from '../hooks.ts'

export function ItemDetailPage() {
  const { id } = useParams()
  const itemId = Number(id)
  const itemQuery = useItemQuery(itemId)

  if (!Number.isFinite(itemId)) {
    return <DetailState message="L'identifiant de l'objet est invalide." title="Objet introuvable" />
  }

  if (itemQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="aspect-[4/3] rounded-3xl bg-slate-200" />
        <div className="mt-8 h-8 w-2/3 rounded bg-slate-200" />
        <div className="mt-4 h-4 w-1/3 rounded bg-slate-200" />
        <div className="mt-8 space-y-3">
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
        </div>
      </div>
    )
  }

  if (itemQuery.isError || itemQuery.data === undefined) {
    return <DetailState message="Cet objet n'existe pas ou n'est plus disponible." title="Objet introuvable" />
  }

  const item = itemQuery.data

  return (
    <article className="mx-auto max-w-4xl pb-24 sm:pb-0">
      <Link className="mb-6 inline-flex text-sm font-semibold text-[#1a4231] hover:text-[#143629]" to="/">
        Retour aux objets
      </Link>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="aspect-[4/3] bg-slate-100 sm:aspect-[16/9]">
          <ItemImage item={item} />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e8f0ea] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#1a4231]">
              {item.condition}
            </span>
            {item.category !== null && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {item.category.name}
              </span>
            )}
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{item.title}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Disponible à {item.city}</p>

          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Description</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-700">{item.description}</p>
          </div>

          {item.owner !== null && (
            <div className="mt-8 rounded-2xl bg-[#f5f6f1] p-4">
              <h2 className="text-sm font-bold text-slate-950">Propriétaire</h2>
              <p className="mt-1 text-sm text-slate-600">{item.owner.email}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function DetailState({ message, title }: { message: string; title: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white px-6 py-12 text-center shadow-sm">
      <p className="text-xl font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      <Link
        className="mt-6 inline-flex rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white"
        to="/"
      >
        Retour aux objets
      </Link>
    </div>
  )
}
