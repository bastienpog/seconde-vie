import { NavLink } from 'react-router'
import { useMeQuery } from '../../auth/hooks.ts'

const navigationLinks = [
  { label: 'Mes objets', to: '/me/items' },
  { label: 'Demandes', to: '/loans' },
  { label: 'Profil', to: '/profile' },
]

export function DesktopNavigation() {
  const meQuery = useMeQuery()
  const links = meQuery.data?.roles.includes('ROLE_ADMIN') === true
    ? [...navigationLinks, { label: 'Administration', to: '/admin' }]
    : navigationLinks

  return (
    <nav aria-label="Navigation principale" className="hidden items-center gap-3 sm:flex">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) =>
            [
              'rounded-full px-4 py-2 text-sm font-bold shadow-sm transition',
              isActive ? 'bg-[#1a4231] text-white' : 'bg-white text-slate-500 hover:bg-[#edf1ea] hover:text-[#1a4231]',
            ].join(' ')
          }
          key={link.to}
          to={link.to}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
