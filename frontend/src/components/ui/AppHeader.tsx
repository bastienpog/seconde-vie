import type { ReactNode } from 'react'
import { Link } from 'react-router'

type AppHeaderProps = {
  mobileBackTo?: string
  navigation?: ReactNode
}

export function AppHeader({ mobileBackTo, navigation }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[#fdfcf8]/90 backdrop-blur sm:static sm:bg-transparent">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[2.5rem_1fr_2.5rem] items-center px-6 sm:flex sm:h-auto sm:justify-between sm:gap-6 sm:px-5 sm:py-7 lg:px-6 lg:py-8">
        {mobileBackTo !== undefined ? (
          <Link
            aria-label="Retour"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1a4231] transition hover:bg-[#edf1ea] sm:hidden"
            to={mobileBackTo}
          >
            <ArrowLeftIcon />
          </Link>
        ) : (
          <span className="h-10 w-10 sm:hidden" />
        )}

        <Link
          aria-label="Accueil"
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#f5f2e8] text-[#1a4231] ring-2 ring-[#1a4231]/10 transition hover:bg-[#edf1ea] sm:flex"
          to="/"
        >
          <HomeIcon />
        </Link>

        <p className="text-center text-lg font-bold text-[#1a4231] sm:text-3xl">Seconde Vie</p>

        <span className="h-10 w-10 sm:hidden" />
        <div className="hidden sm:block">{navigation}</div>
      </div>
    </header>
  )
}

function HomeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}
