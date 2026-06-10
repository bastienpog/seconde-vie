import { useMemo, useState } from 'react'
import { BottomNavigation } from '../components/BottomNavigation.tsx'
import { ItemCard } from '../components/ItemCard.tsx'
import { useItemsQuery } from '../hooks.ts'
import { useCategoriesQuery } from '../../categories/hooks.ts'

const ALL_CATEGORIES = 'all'

export function ItemListPage() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<string>(ALL_CATEGORIES)

  const filters = useMemo(
    () => ({
      search: search.trim() === '' ? undefined : search.trim(),
      city: city.trim() === '' ? undefined : city.trim(),
      category: category === ALL_CATEGORIES ? undefined : Number(category),
    }),
    [category, city, search],
  )

  const itemsQuery = useItemsQuery(filters)
  const categoriesQuery = useCategoriesQuery()

  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-28 text-slate-950 sm:bg-slate-50 sm:pb-10">
      <div className="sticky top-0 z-10 bg-[#fdfcf8]/90 px-4 pb-4 pt-5 backdrop-blur sm:static sm:bg-transparent sm:px-0 sm:pt-0">
        <h1 className="text-center text-2xl font-bold tracking-tight text-[#1a4231] sm:text-left sm:text-3xl">
          Seconde Vie
        </h1>

        <div className="mx-auto mt-7 max-w-3xl space-y-3 sm:mt-8">
          <label className="relative block">
            <span className="sr-only">Rechercher un objet</span>
            <SearchIcon />
            <input
              className="h-14 w-full rounded-full border border-transparent bg-white py-2 pl-12 pr-5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Un outil, un appareil..."
              type="search"
              value={search}
            />
          </label>

          <label className="block">
            <span className="sr-only">Filtrer par ville</span>
            <input
              className="h-12 w-full rounded-full border border-transparent bg-white px-5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10 sm:max-w-xs"
              onChange={(event) => setCity(event.target.value)}
              placeholder="Ville"
              type="search"
              value={city}
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <CategoryChip
              active={category === ALL_CATEGORIES}
              label="Toutes les catégories"
              onClick={() => setCategory(ALL_CATEGORIES)}
            />
            {categoriesQuery.data?.map((itemCategory) => (
              <CategoryChip
                active={category === String(itemCategory.id)}
                key={itemCategory.id}
                label={itemCategory.name}
                onClick={() => setCategory(String(itemCategory.id))}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-0">
        {itemsQuery.isLoading && <ItemGridSkeleton />}

        {itemsQuery.isError && (
          <StateMessage
            message="Impossible de charger les objets pour le moment."
            title="Une erreur est survenue"
          />
        )}

        {itemsQuery.isSuccess && itemsQuery.data.length === 0 && (
          <StateMessage
            message="Essayez avec un autre mot-clé, une autre ville ou une autre catégorie."
            title="Aucun objet trouvé"
          />
        )}

        {itemsQuery.isSuccess && itemsQuery.data.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {itemsQuery.data.map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        )}
      </section>

      <BottomNavigation />
    </div>
  )
}

type CategoryChipProps = {
  active: boolean
  label: string
  onClick: () => void
}

function CategoryChip({ active, label, onClick }: CategoryChipProps) {
  return (
    <button
      className={[
        'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
        active ? 'bg-[#1a4231] text-white' : 'bg-white text-slate-500 shadow-sm hover:text-[#1a4231]',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function StateMessage({ message, title }: { message: string; title: string }) {
  return (
    <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  )
}

function ItemGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="animate-pulse" key={index}>
          <div className="aspect-[4/5] rounded-2xl bg-slate-200" />
          <div className="mt-3 h-4 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
