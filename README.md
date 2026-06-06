# Seconde Vie

Seconde Vie est une application web collaborative permettant à des particuliers de prêter des objets inutilisés à d'autres personnes de leur quartier ou de leur ville.

Le projet a un objectif pédagogique et écologique : sensibiliser à la surconsommation, valoriser les objets dormants et encourager une logique de réutilisation locale.

## Stack technique

- Frontend : React + TypeScript + Tailwind CSS
- Backend : Symfony 7 + Doctrine
- Base de données : MySQL 8.0
- Authentification : JWT
- Gestion de projet : GitHub Projects
- Méthode : Agile, par user stories

## Fonctionnalités du MVP

- Inscription
- Connexion
- Publication d'une annonce d'objet
- Consultation de la liste des objets
- Consultation d'une fiche objet
- Recherche par mot-clé
- Filtrage par catégorie
- Filtrage/recherche par ville saisie librement
- Demande de réservation ou d'emprunt
- Acceptation/refus d'une demande par le propriétaire
- Suppression de compte
- Administration minimale des annonces et catégories

## Hors périmètre du MVP

- Paiement
- Livraison
- Caution
- Messagerie temps réel
- Notifications push
- Géolocalisation automatique
- Système de réputation avancé
- Multi-photos / carousel, sauf évolution future validée

## Commandes utiles

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run lint
npm run test
npm run build
```

### Backend

```bash
cd backend
composer install
symfony server:start
php bin/console doctrine:migrations:migrate
php bin/phpunit
```

### Docker, à compléter selon la configuration

```bash
docker compose up --build
```

## Organisation Git recommandée

- `main` : branche stable et déployable
- `develop` : intégration des fonctionnalités validées
- `feature/us-xx-nom-fonctionnalite` : une branche par user story

Exemples :

```txt
feature/us-01-register
feature/us-03-create-item
feature/us-06-request-loan
```

## Convention de commits

Utiliser Conventional Commits :

```txt
feat: ajoute la publication d'objet
fix: corrige la validation du formulaire
refactor: simplifie le service de réservation
test: ajoute les tests d'intégration des annonces
docs: met à jour le périmètre du projet
chore: configure les outils de développement
```
