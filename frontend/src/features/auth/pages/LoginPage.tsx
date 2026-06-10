import { Link } from 'react-router'
import { PageTitle } from '../../../components/ui/PageTitle.tsx'

export function LoginPage() {
  return (
    <>
      <PageTitle description="Le formulaire sera ajoute dans l issue auth frontend." title="Connexion" />
      <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-900" to="/register">
        Creer un compte
      </Link>
    </>
  )
}
