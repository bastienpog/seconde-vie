import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { setAuthToken } from '../../../lib/api.ts'
import { AuthLayout } from '../components/AuthLayout.tsx'
import { AuthTextField } from '../components/AuthTextField.tsx'
import { useLoginMutation } from '../hooks.ts'

type LocationState = {
  registered?: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLoginMutation()
  const state = location.state as LocationState | null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: ({ token }) => {
          setAuthToken(token)
          navigate('/')
        },
      },
    )
  }

  return (
    <AuthLayout>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {state?.registered === true && (
          <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-medium text-[#1a4231]">
            Compte créé. Vous pouvez vous connecter.
          </p>
        )}

        <AuthTextField
          autoComplete="email"
          label="Adresse e-mail"
          name="email"
          required
          type="email"
        />
        <AuthTextField
          autoComplete="current-password"
          label="Mot de passe"
          name="password"
          required
          type="password"
        />

        <div className="flex justify-end pr-2">
          <button
            className="text-sm font-semibold text-[#1a4231]/70"
            type="button"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {loginMutation.isError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {getErrorMessage(loginMutation.error)}
          </p>
        )}

        <button
          className="mt-8 h-16 rounded-full bg-[#1a4231] px-8 text-lg font-bold text-white shadow-xl shadow-[#1a4231]/10 transition hover:bg-[#143629] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
        </button>

        <Link
          className="flex h-16 items-center justify-center rounded-full text-base font-bold text-[#1a4231] transition hover:bg-white/60"
          to="/register"
        >
          Créer un compte
        </Link>
      </form>
    </AuthLayout>
  )
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'La connexion a échoué.'
}
