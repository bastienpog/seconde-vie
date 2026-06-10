import { Link } from 'react-router'
import { PageTitle } from '../../../components/ui/PageTitle.tsx'

export function RegisterPage() {
  return (
    <>
      <PageTitle description="Le formulaire sera ajoute dans l issue auth frontend." title="Inscription" />
      <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-900" to="/login">
        Deja inscrit ? Se connecter
      </Link>
    </>
  )
}
