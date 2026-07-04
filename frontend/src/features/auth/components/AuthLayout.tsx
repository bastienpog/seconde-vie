import type { ReactNode } from 'react'
import { Link } from 'react-router'

type AuthLayoutProps = {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f5f6f1] px-5 py-8 sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-2 py-8 sm:min-h-0 sm:rounded-[2rem] sm:bg-[#f5f6f1] sm:px-8 sm:py-12">
        <header className="mb-14 text-center sm:mb-12">
          <p className="text-4xl font-bold italic tracking-tight text-[#1a4231]">Seconde Vie</p>
          <p className="mt-4 text-base font-medium text-[#3f4944]">
            Donnez une nouvelle vie à vos objets.
          </p>
        </header>

        {children}

        <footer className="mt-8 text-center">
          <Link
            className="text-xs font-semibold text-[#5f6b65] underline-offset-4 transition hover:text-[#d97706] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d97706]/25"
            to="/privacy"
          >
            Politique de confidentialité
          </Link>
        </footer>
      </div>
    </section>
  )
}
