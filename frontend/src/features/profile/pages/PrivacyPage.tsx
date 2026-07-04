import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { AppHeader } from '../../../components/ui/AppHeader.tsx'
import { BottomNavigation } from '../../items/components/BottomNavigation.tsx'
import { DesktopNavigation } from '../../items/components/DesktopNavigation.tsx'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fdfcf8] pb-32 text-slate-950 sm:bg-[#f8f8f3] sm:pb-12">
      <AppHeader mobileBackTo="/" navigation={<DesktopNavigation />} />

      <main className="mx-auto w-full max-w-4xl px-4 pt-5 sm:px-5 sm:pt-0 lg:px-6">
        <section className="mb-6 sm:mb-7">
          <p className="text-sm font-bold uppercase tracking-[1px] text-[#d97706]">Données personnelles</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1a4231] sm:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Cette page résume les données utilisées par Seconde Vie dans le cadre du MVP pédagogique.
          </p>
        </section>

        <div className="space-y-5">
          <PrivacySection title="Données collectées">
            <p>
              Seconde Vie conserve uniquement les informations nécessaires au fonctionnement du service :
              email, nom ou pseudo, mot de passe hashé, rôles, objets publiés, ville saisie librement et
              demandes d'emprunt.
            </p>
            <p>
              Le projet ne collecte pas de coordonnées bancaires, de document d'identité, d'adresse postale
              complète, de paiement ou de géolocalisation automatique.
            </p>
          </PrivacySection>

          <PrivacySection title="Finalités">
            <p>
              Les données servent à créer un compte, authentifier l'utilisateur, publier des objets, rechercher
              par ville, demander un emprunt et protéger les accès utilisateur ou administrateur.
            </p>
          </PrivacySection>

          <PrivacySection title="Droits utilisateur">
            <p>
              Un utilisateur connecté peut consulter ses informations depuis son profil, gérer ses propres
              annonces et supprimer son compte. La suppression du compte supprime aussi les objets publiés
              et les demandes associées dans le périmètre du MVP.
            </p>
          </PrivacySection>

          <PrivacySection title="Sécurité et limites">
            <p>
              Les mots de passe sont hashés côté backend et les routes sensibles nécessitent un JWT valide.
              Le token est stocké dans le navigateur pour garder une API stateless simple à expliquer.
            </p>
            <p>
              Le MVP n'utilise pas de cookies publicitaires, de suivi marketing, de paiement, de livraison ou de
              système de réputation avancé.
            </p>
          </PrivacySection>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              className="inline-flex justify-center rounded-full bg-[#1a4231] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143629] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d97706]/35"
              to="/profile"
            >
              Retour au profil
            </Link>
            <Link
              className="inline-flex justify-center rounded-full bg-[#edf1ea] px-5 py-3 text-sm font-bold text-[#1a4231] transition hover:bg-[#e2ebe4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d97706]/35"
              to="/"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>

      <BottomNavigation showCreateButton={false} />
    </div>
  )
}

function PrivacySection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">{children}</div>
    </section>
  )
}
