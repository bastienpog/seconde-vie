import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../components/AuthLayout.tsx'
import { AuthTextField } from '../components/AuthTextField.tsx'
import { useRegisterMutation } from '../hooks.ts'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '')
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    registerMutation.mutate(
      { name, email, password },
      {
        onSuccess: () => {
          navigate('/login', { state: { registered: true } })
        },
      },
    )
  }

  return (
    <AuthLayout>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <AuthTextField autoComplete="name" label="Nom ou pseudo" name="name" required type="text" />
        <AuthTextField
          autoComplete="email"
          label="Adresse e-mail"
          name="email"
          required
          type="email"
        />
        <AuthTextField
          autoComplete="new-password"
          label="Mot de passe"
          minLength={8}
          name="password"
          required
          type="password"
        />

        {registerMutation.isError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {getErrorMessage(registerMutation.error)}
          </p>
        )}

        <button
          className="mt-8 h-16 rounded-full bg-[#1a4231] px-8 text-lg font-bold text-white shadow-xl shadow-[#1a4231]/10 transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={registerMutation.isPending}
          type="submit"
        >
          {registerMutation.isPending ? 'Création...' : 'Créer un compte'}
        </button>

        <Link
          className="flex h-16 items-center justify-center rounded-full text-base font-bold text-[#1a4231] transition hover:bg-white/60"
          to="/login"
        >
          Déjà inscrit ? Se connecter
        </Link>
      </form>
    </AuthLayout>
  )
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "L'inscription a échoué."
}
