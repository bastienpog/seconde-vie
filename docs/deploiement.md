# Deploiement - Seconde Vie

## Objectif

Ce document decrit la procedure de deploiement du projet Seconde Vie sur un VPS avec Docker Compose, GitHub Actions, GHCR et Caddy.

Le projet utilise :

- un frontend React/Vite ;
- un backend Symfony 7 ;
- une base MySQL 8 ;
- Docker Compose pour l'environnement local et production ;
- Caddy pour HTTPS en production ;
- GitHub Container Registry pour stocker les images Docker ;
- JWT pour l'authentification.

Le deploiement automatique est prevu depuis la branche `main`.

## Environnements

### Developpement local

Utilise Docker Compose avec les services suivants :

- `frontend` : application React/Vite sur le port `5173` ;
- `backend` : PHP-FPM Symfony ;
- `nginx` : point d'entree HTTP backend sur le port `8080` ;
- `database` : MySQL 8 ;
- `phpmyadmin` : interface de consultation MySQL sur le port `8081`.

Lancement :

```bash
docker compose up --build
```

### Production VPS

La production cible utilise un domaine unique :

```txt
https://domaine.fr
https://domaine.fr/api
```

Cette organisation evite une configuration CORS specifique en production, car le frontend et l'API sont exposes sur la meme origine.

Le VPS doit disposer de :

- Docker et Docker Compose ;
- un utilisateur `deploy` ;
- une cle SSH autorisee pour GitHub Actions ;
- un firewall autorisant SSH, HTTP et HTTPS ;
- un DNS pointant vers l'adresse IP du VPS ;
- une base MySQL persistante ;
- des variables d'environnement de production ;
- des sauvegardes regulieres de la base ;
- un repertoire applicatif, par exemple `/opt/seconde-vie`.

Le fichier `docker-compose.yml` reste dedie au developpement. La production utilise `docker-compose.prod.yml`.

## Variables d'environnement

Variables principales du VPS :

```txt
SERVER_NAME=seconde-vie.example.com
LETSENCRYPT_EMAIL=admin@example.com
FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:<tag>
BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:<tag>
APP_ENV=prod
APP_SECRET=<secret fort>
JWT_PASSPHRASE=<passphrase forte>
MYSQL_DATABASE=seconde_vie
MYSQL_USER=seconde_vie
MYSQL_PASSWORD=<mot de passe fort>
MYSQL_ROOT_PASSWORD=<mot de passe root fort>
DATABASE_URL=mysql://seconde_vie:<mot de passe fort>@database:3306/seconde_vie?serverVersion=8.0.32&charset=utf8mb4
```

Le frontend est construit avec :

```txt
VITE_API_URL=/api
```

Regles de securite :

- ne jamais versionner les secrets de production ;
- garder le fichier `.env` uniquement sur le VPS ;
- generer des cles JWT propres a l'environnement ;
- ne pas reutiliser les valeurs de test en production.

## Preparation du VPS

### 1. Installer Docker

Sur le VPS :

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
```

Se reconnecter ensuite avec l'utilisateur `deploy`.

### 2. Configurer le firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Preparer le repertoire applicatif

```bash
sudo mkdir -p /opt/seconde-vie
sudo chown deploy:deploy /opt/seconde-vie
cd /opt/seconde-vie
```

Copier sur le serveur :

- `docker-compose.prod.yml` ;
- `docker/caddy/Caddyfile` ;
- `.env` de production, cree a partir de `.env.prod.example`.

### 4. Creer le fichier `.env`

Le fichier `.env` reste uniquement sur le VPS. Il ne doit pas etre versionne.

```bash
cp .env.prod.example .env
nano .env
```

Renseigner toutes les valeurs `change_me`.

## Secrets GitHub Actions

Configurer les secrets suivants dans GitHub :

```txt
VPS_HOST
VPS_USER
VPS_SSH_KEY
VPS_APP_DIR
PROD_DOMAIN
GHCR_USERNAME
GHCR_TOKEN
```

`VPS_APP_DIR` correspond au repertoire contenant `docker-compose.prod.yml`, par exemple `/opt/seconde-vie`. `GHCR_TOKEN` doit etre un token autorise a lire les packages GHCR si les images ne sont pas publiques.

## Deploiement automatique

### 1. Verifier la branche

Le deploiement part de `main`. Avant de merger vers `main`, verifier :

- pull request relue ;
- CI verte ;
- aucun secret ajoute au depot ;
- fichier `.env` de production deja present sur le VPS.

### 2. Publication des images

Le workflow `.github/workflows/cd.yml` :

- construit l'image backend avec `backend/Dockerfile.prod` ;
- construit l'image frontend avec `frontend/Dockerfile.prod` ;
- publie les images sur GHCR avec les tags `latest` et le SHA du commit.

### 3. Deploiement sur le VPS

Le job de deploiement se connecte en SSH et lance :

```bash
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.prod.yml --env-file .env ps
```

Le job verifie ensuite que l'API repond :

```bash
curl -fsS https://$PROD_DOMAIN/api/items
```

## Deploiement manuel de secours

Si GitHub Actions est indisponible, le deploiement peut etre relance depuis le VPS :

```bash
cd /opt/seconde-vie
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.prod.yml --env-file .env ps
```

## Verification post-deploiement

```bash
curl -I https://domaine.fr
curl https://domaine.fr/api/items
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100 caddy
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100 backend
```

Parcours applicatifs a verifier :

- page frontend ;
- `GET /api/items` ;
- `POST /api/login` avec un compte de test ;
- creation d'un item ;
- acces admin si necessaire ;
- page `/privacy`.

## Checklist avant mise en production

- CI verte.
- Merge vers `main` valide.
- Secrets de production configures hors depot.
- DNS pointe vers le VPS.
- Ports 80 et 443 ouverts.
- Fichier `.env` present sur le VPS.
- Images GHCR publiees.
- Caddy obtient le certificat HTTPS.
- Migrations Doctrine executees au demarrage backend.
- Routes principales testees.
- Procedure de rollback disponible.

## Limites actuelles

- Pas de monitoring applicatif avance.
- Pas de sauvegarde automatisee configuree dans le depot.
- Pas de haute disponibilite.
- Pas de blue/green deployment.

Ces limites sont acceptables pour un MVP pedagogique si elles sont clairement presentees.
