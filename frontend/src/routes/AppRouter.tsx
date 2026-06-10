import { BrowserRouter, Route, Routes } from 'react-router'
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
    </BrowserRouter>
  )
}
