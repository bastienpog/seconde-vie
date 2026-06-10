import type { ReactNode } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router'
import { AdminPage } from '../features/admin/pages/AdminPage.tsx'
import { LoginPage } from '../features/auth/pages/LoginPage.tsx'
import { RegisterPage } from '../features/auth/pages/RegisterPage.tsx'
import { ItemCreatePage } from '../features/items/pages/ItemCreatePage.tsx'
import { ItemDetailPage } from '../features/items/pages/ItemDetailPage.tsx'
import { ItemListPage } from '../features/items/pages/ItemListPage.tsx'
import { MyItemsPage } from '../features/items/pages/MyItemsPage.tsx'
import { LoanRequestsPage } from '../features/loans/pages/LoanRequestsPage.tsx'
import { ProfilePage } from '../features/profile/pages/ProfilePage.tsx'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const location = useLocation()
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
  const isHomeRoute = location.pathname === '/'
  const usesPageShell = isAuthRoute || isHomeRoute

  return (
    <div className={getShellClassName(isAuthRoute, isHomeRoute)}>
      {!usesPageShell && (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link className="text-lg font-semibold" to="/">
              Seconde Vie
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <NavigationLink to="/">Objets</NavigationLink>
              <NavigationLink to="/items/new">Publier</NavigationLink>
              <NavigationLink to="/me/items">Mes objets</NavigationLink>
              <NavigationLink to="/loans">Demandes</NavigationLink>
              <NavigationLink to="/profile">Profil</NavigationLink>
              <NavigationLink to="/admin">Admin</NavigationLink>
              <NavigationLink to="/login">Connexion</NavigationLink>
            </nav>
          </div>
        </header>
      )}

      <main className={usesPageShell ? 'min-h-screen' : 'mx-auto max-w-6xl px-4 py-8'}>
        <Routes>
          <Route element={<ItemListPage />} path="/" />
          <Route element={<ItemDetailPage />} path="/items/:id" />
          <Route element={<ItemCreatePage />} path="/items/new" />
          <Route element={<MyItemsPage />} path="/me/items" />
          <Route element={<LoanRequestsPage />} path="/loans" />
          <Route element={<ProfilePage />} path="/profile" />
          <Route element={<AdminPage />} path="/admin" />
          <Route element={<LoginPage />} path="/login" />
          <Route element={<RegisterPage />} path="/register" />
        </Routes>
      </main>
    </div>
  )
}

function getShellClassName(isAuthRoute: boolean, isHomeRoute: boolean): string {
  if (isAuthRoute) {
    return 'min-h-screen bg-[#f5f6f1]'
  }

  if (isHomeRoute) {
    return 'min-h-screen bg-[#fdfcf8] text-slate-950'
  }

  return 'min-h-screen bg-slate-50 text-slate-950'
}

type NavigationLinkProps = {
  children: ReactNode
  to: string
}

function NavigationLink({ children, to }: NavigationLinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          'rounded-md px-2 py-1 transition',
          isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
      to={to}
    >
      {children}
    </NavLink>
  )
}
