import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useMeQuery } from '../../auth/hooks.ts'

type BottomNavigationProps = {
  showCreateButton?: boolean
}

export function BottomNavigation({ showCreateButton = true }: BottomNavigationProps) {
  const meQuery = useMeQuery()
  const isAdmin = meQuery.data?.roles.includes('ROLE_ADMIN') === true

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

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white px-6 pb-5 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:hidden">
        <div className={['mx-auto grid max-w-md items-end', isAdmin ? 'grid-cols-5' : 'grid-cols-4'].join(' ')}>
          <BottomNavigationLink icon={<HomeIcon />} label="Accueil" to="/" />
          <BottomNavigationLink icon={<BoxIcon />} label="Objets" to="/me/items" />
          <BottomNavigationLink icon={<LoanIcon />} label="Demandes" to="/loans" />
          {isAdmin && <BottomNavigationLink icon={<AdminIcon />} label="Admin" to="/admin" />}
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

function LoanIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3 4 7v6c0 5 3.4 7.6 8 8 4.6-.4 8-3 8-8V7l-8-4Z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
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
