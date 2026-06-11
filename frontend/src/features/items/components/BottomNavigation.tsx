import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

type BottomNavigationProps = {
  showCreateButton?: boolean
}

export function BottomNavigation({ showCreateButton = true }: BottomNavigationProps) {
  return (
    <>
      {showCreateButton && (
        <NavLink
        className="fixed bottom-[5.75rem] right-4 z-30 flex items-center gap-2 rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-[#1a4231]/30 sm:hidden"
        to="/items/new"
        >
          <PlusIcon />
          Créer une annonce
        </NavLink>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white px-8 pb-5 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 items-end">
          <BottomNavigationLink icon={<HomeIcon />} label="Accueil" to="/" />
          <BottomNavigationLink icon={<BoxIcon />} label="Mes objets" to="/me/items" />
          <BottomNavigationLink icon={<UserIcon />} label="Profil" to="/profile" />
        </div>
      </nav>
    </>
  )
}

type BottomNavigationLinkProps = {
  icon: ReactNode
  label: string
  to: string
}

function BottomNavigationLink({ icon, label, to }: BottomNavigationLinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          'flex flex-col items-center gap-1 text-[10px] font-medium',
          isActive ? 'text-[#1a4231]' : 'text-slate-400',
        ].join(' ')
      }
      to={to}
    >
      <span className="h-5 w-5">{icon}</span>
      {label}
    </NavLink>
  )
}

function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
