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

## Authentification backend

L'API d'authentification permet de créer un utilisateur, de se connecter avec JWT et de récupérer les informations de l'utilisateur connecté.

### Commandes utiles

Depuis la racine du projet :

```bash
docker compose exec backend composer install
docker compose exec backend php bin/console lexik:jwt:generate-keypair
docker compose exec backend php bin/console doctrine:migrations:migrate
```

Si les conteneurs ne sont pas encore lancés :

```bash
docker compose up --build
```

### Routes API

```http
POST /api/register
POST /api/login
GET  /api/me
```

### Inscription

```http
POST /api/register
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Bastien"
}
```

Réponse attendue en succès : `201 Created`.

```json
{
  "message": "Utilisateur créé avec succès"
}
```

### Connexion

```http
POST /api/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Réponse attendue en succès : `200 OK`.

```json
{
  "token": "jwt_token"
}
```

### Utilisation du token JWT

Pour appeler une route protégée, envoyer le token dans le header HTTP :

```http
Authorization: Bearer <token>
```

Exemple :

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/me
```

## Tests manuels authentification

### 1. Inscription réussie

Route :

```http
POST /api/register
```

Body JSON :

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Bastien"
}
```

Résultat attendu : l'utilisateur est créé et le mot de passe est hashé en base de données.

Code HTTP attendu : `201 Created`.

### 2. Inscription avec email déjà utilisé

Route :

```http
POST /api/register
```

Body JSON :

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Bastien"
}
```

Résultat attendu : l'API indique que l'email est déjà utilisé. Le champ `name` reste obligatoire dans le body, comme pour une inscription réussie.

Code HTTP attendu : `409 Conflict`.

### 3. Connexion réussie

Route :

```http
POST /api/login
```

Body JSON :

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Résultat attendu : l'API retourne un token JWT.

Code HTTP attendu : `200 OK`.

### 4. Connexion avec mauvais mot de passe

Route :

```http
POST /api/login
```

Body JSON :

```json
{
  "email": "user@example.com",
  "password": "wrong-password"
}
```

Résultat attendu : l'API refuse la connexion.

Code HTTP attendu : `401 Unauthorized`.

### 5. Accès à `/api/me` avec token valide

Route :

```http
GET /api/me
Authorization: Bearer <token>
```

Résultat attendu : l'API retourne l'id, l'email, le nom et les rôles de l'utilisateur connecté, sans le mot de passe hashé.

Code HTTP attendu : `200 OK`.

### 6. Accès à `/api/me` sans token

Route :

```http
GET /api/me
```

Résultat attendu : l'API refuse l'accès.

Code HTTP attendu : `401 Unauthorized`.


## Tests manuels objets

### Création d'un objet

Route :

```http
POST /api/items
Authorization: Bearer <token>
```

Body JSON :

```json
{
  "title": "Perceuse Bosch",
  "description": "Perceuse en bon état disponible pour un prêt local.",
  "city": "Paris",
  "condition": "Bon état",
  "categoryId": 1,
  "imageUrl": "https://example.com/image.jpg"
}
```

Résultat attendu : l'objet est créé avec le propriétaire connecté.

Code HTTP attendu : `201 Created`.

### Liste des objets

Route :

```http
GET /api/items
```

Résultat attendu : l'objet créé apparaît dans la liste publique avec son titre, sa ville, son état, sa catégorie, son propriétaire et sa photo principale.

Code HTTP attendu : `200 OK`.
