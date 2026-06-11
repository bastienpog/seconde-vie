import type { Item } from '../services/itemsApi.ts'

type ItemImageProps = {
  item: Pick<Item, 'imageUrl' | 'title'>
  className?: string
}

export function ItemImage({ item, className = '' }: ItemImageProps) {
  if (item.imageUrl !== null) {
    return (
      <img
        alt={item.title}
        className={`h-full w-full object-cover ${className}`}
        src={item.imageUrl}
      />
    )
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-[#edf1ea] text-[#6b7770] ${className}`}
    >
      <svg
        aria-hidden="true"
        className="h-9 w-9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="m3 3 18 18" />
        <path d="M10.5 6h3l1.5 2H19a2 2 0 0 1 2 2v7.5" />
        <path d="M17.5 19H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h3" />
        <path d="M9.8 13.2a3 3 0 0 0 4 4" />
        <path d="M14.2 10.8a3 3 0 0 0-4-4" />
      </svg>
      <span className="text-xs font-semibold">Aucune photo</span>
    </div>
  )
}
