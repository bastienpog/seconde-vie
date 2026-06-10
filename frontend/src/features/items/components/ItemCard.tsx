import { Link } from 'react-router'
import { ItemImage } from './ItemImage.tsx'
import type { Item } from '../services/itemsApi.ts'

type ItemCardProps = {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link className="group block" to={`/items/${item.id}`}>
      <article className="overflow-hidden">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200">
          <ItemImage
            className="transition duration-300 group-hover:scale-[1.03]"
            item={item}
          />
          <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a4231]">
            {item.condition}
          </span>
        </div>

        <div className="px-1 pt-3">
          <h2 className="text-sm font-bold leading-5 text-slate-950 sm:text-base">
            {item.title}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{item.city}</p>
        </div>
      </article>
    </Link>
  )
}
