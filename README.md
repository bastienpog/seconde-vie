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
- Publication d'un item
- Consultation de la liste des objets
- Consultation d'une fiche objet
- Recherche par mot-clé
- Filtrage par catégorie
- Filtrage/recherche par ville saisie librement
- Demande de réservation ou d'emprunt
- Acceptation/refus d'une demande par le propriétaire
- Suppression de compte
- Administration minimale des items et catégories

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

### Docker

```bash
docker compose up --build
```


## CI/CD

La CI GitHub Actions est definie dans `.github/workflows/ci.yml`. Elle se declenche sur chaque pull request et sur chaque push vers `develop`.

### Job Backend

Le job `Backend` verifie la partie Symfony avec PHP 8.3 et MySQL 8.0 :

- validation de `backend/composer.json` avec `composer validate --strict` ;
- installation des dependances avec `composer install` ;
- audit de securite avec `composer audit` ;
- creation de la base de test ;
- execution des migrations Doctrine ;
- execution des tests avec `php bin/phpunit`.

### Job Frontend

Le job `Frontend` verifie la partie React avec Node.js 22 :

- installation reproductible avec `npm ci` ;
- audit de securite avec `npm audit --audit-level=high` ;
- lint avec `npm run lint` ;
- tests frontend avec `npm run test` ;
- build de production avec `npm run build`.

`npm audit --audit-level=high` bloque la CI sur les vulnerabilites high et critical. Les alertes moderate ou low restent a surveiller, mais ne bloquent pas le MVP.

### Protection de branche recommandee

Pour rendre la CI bloquante sur `develop`, configurer GitHub avec :

- pull request obligatoire avant merge ;
- status checks obligatoires `Backend` et `Frontend` ;
- branche a jour avant merge ;
- pas de push direct sur `develop` ou `main` pour les contributeurs.

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
test: ajoute les tests d'intégration des items
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

Résultat attendu : l'objet créé apparaît dans la liste publique avec son titre, sa ville, son état, sa catégorie, son propriétaire et sa photo principale. Les objets non disponibles ne sont pas affichés.

Code HTTP attendu : `200 OK`.

### Détail d'un objet

Route :

```http
GET /api/items/{id}
```

Résultat attendu : l'API retourne le titre, la description, la catégorie, la ville, l'état, la photo principale et le propriétaire de l'objet disponible.

Code HTTP attendu : `200 OK`.

### Détail d'un objet introuvable

Route :

```http
GET /api/items/999999
```

Résultat attendu : l'API retourne une erreur claire.

Code HTTP attendu : `404 Not Found`.
