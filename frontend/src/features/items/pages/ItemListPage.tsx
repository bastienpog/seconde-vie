import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AppHeader } from '../../../components/ui/AppHeader.tsx'
import { BottomNavigation } from '../components/BottomNavigation.tsx'
import { DesktopNavigation } from '../components/DesktopNavigation.tsx'
import { ItemCard } from '../components/ItemCard.tsx'
import { useItemsQuery } from '../hooks.ts'
import { useCategoriesQuery } from '../../categories/hooks.ts'

const ALL_CATEGORIES = 'all'

export function ItemListPage() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<string>(ALL_CATEGORIES)
  const [isLocationFilterOpen, setIsLocationFilterOpen] = useState(false)

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
  const hasCityFilter = city.trim() !== ''

  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-32 text-slate-950 sm:bg-[#f8f8f3] sm:pb-12">
      <AppHeader navigation={<DesktopNavigation />} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5 sm:pt-0 lg:px-6">
        <section className="mb-6 sm:mb-7 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a4231] sm:text-4xl">Objets à emprunter</h1>
            <p className="mt-3 hidden max-w-lg text-sm leading-6 text-slate-600 sm:block">
              Retrouvez les objets disponibles autour de vous et donnez une nouvelle vie aux objets du quotidien.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link
              className="rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1a4231]/15 transition hover:bg-[#143629]"
              to="/items/new"
            >
              Créer une annonce
            </Link>
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-[#fdfcf8] sm:bg-white sm:p-4 sm:shadow-sm lg:p-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] sm:items-center">
            <label className="relative block">
              <span className="sr-only">Rechercher un objet</span>
              <SearchIcon />
              <input
                className="h-14 w-full rounded-full border border-transparent bg-white py-2 pl-12 pr-16 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10 sm:bg-[#f8faf7] sm:pr-5 sm:shadow-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Un outil, un appareil..."
                type="search"
                value={search}
              />
              <button
                aria-expanded={isLocationFilterOpen}
                aria-label="Filtrer par ville"
                className={[
                  'absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition sm:hidden',
                  hasCityFilter || isLocationFilterOpen
                    ? 'bg-[#1a4231] text-white'
                    : 'bg-[#edf1ea] text-[#1a4231]',
                ].join(' ')}
                onClick={() => setIsLocationFilterOpen((isOpen) => !isOpen)}
                type="button"
              >
                <MapPinIcon />
              </button>
            </label>

            <label className="relative hidden sm:block">
              <span className="sr-only">Filtrer par ville</span>
              <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="h-14 w-full rounded-full border border-transparent bg-[#f8faf7] py-2 pl-11 pr-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10"
                onChange={(event) => setCity(event.target.value)}
                placeholder="Filtrer par ville"
                type="search"
                value={city}
              />
            </label>
          </div>

          {isLocationFilterOpen && (
            <div className="ml-auto mt-3 w-[min(100%,20rem)] rounded-3xl bg-white p-3 shadow-sm sm:hidden">
              <label className="relative block">
                <span className="sr-only">Filtrer par ville</span>
                <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-12 w-full rounded-full border border-slate-100 bg-[#f8faf7] py-2 pl-11 pr-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1a4231] focus:ring-4 focus:ring-[#1a4231]/10"
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ville"
                  type="search"
                  value={city}
                />
              </label>

            </div>
          )}

          <div className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
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
            {categoriesQuery.isError && (
              <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                Catégories indisponibles
              </span>
            )}
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-5 sm:pt-7 lg:px-6">
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
            {itemsQuery.data.map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        )}
      </section>

      <BottomNavigation />
      <style>{`
        .scrollbar-hide {
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
        active ? 'bg-[#1a4231] text-white' : 'bg-white text-slate-500 shadow-sm hover:text-[#1a4231] sm:bg-[#f8faf7]',
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

function MapPinIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
