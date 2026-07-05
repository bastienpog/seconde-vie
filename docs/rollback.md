# Rollback - Seconde Vie

## Objectif

Ce document decrit comment revenir a une version stable en cas de probleme apres deploiement VPS.

Un rollback doit rester simple, rapide et documente. Pour Seconde Vie, il concerne :

- les images Docker frontend/backend ;
- la base de donnees MySQL ;
- la configuration `.env` du VPS ;
- Caddy et les certificats HTTPS.

## Cas qui peuvent necessiter un rollback

- erreur 500 sur des routes critiques ;
- frontend inutilisable apres deploiement ;
- migration Doctrine incorrecte ;
- authentification JWT cassee ;
- probleme de connexion MySQL ;
- regression bloquante sur creation d'item ou connexion.

## Preparation avant deploiement

### Identifier la version stable

Avant de deployer, noter le SHA actuellement en production :

```bash
grep '^BACKEND_IMAGE=' .env
grep '^FRONTEND_IMAGE=' .env
```

Les images sont taguees avec le SHA GitHub :

```txt
ghcr.io/<owner>/<repo>-backend:<sha>
ghcr.io/<owner>/<repo>-frontend:<sha>
```

### Sauvegarder la base MySQL

Depuis le VPS :

```bash
cd /opt/seconde-vie
mkdir -p backups
docker compose -f docker-compose.prod.yml --env-file .env exec database   mysqldump -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE   > backups/backup-before-deploy-$(date +%Y%m%d-%H%M%S).sql
```

## Rollback applicatif par image SHA

Si le probleme vient du code applicatif mais que la base reste valide :

1. Modifier `.env` pour remettre les anciens tags d'images :

```txt
BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:<ancien_sha>
FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:<ancien_sha>
```

2. Relancer les conteneurs :

```bash
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.prod.yml --env-file .env ps
```

3. Verifier :

```bash
curl -I https://domaine.fr
curl https://domaine.fr/api/items
```

## Rollback base de donnees

Si une migration a modifie la base de facon incorrecte, l'option la plus claire pour le MVP est de restaurer la sauvegarde.

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec -T database   mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE   < backups/<backup-a-restaurer>.sql
```

A utiliser si les donnees creees apres le deploiement peuvent etre perdues ou si le deploiement vient juste d'etre realise.

## Rollback de configuration

Si le probleme vient d'une variable d'environnement :

1. restaurer l'ancienne valeur dans `.env` ;
2. relancer les services ;
3. verifier les logs.

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100 backend
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100 caddy
```

## Verification apres rollback

Verifier les parcours critiques :

- consultation de la liste des items ;
- connexion utilisateur ;
- recuperation de `/api/me` ;
- creation d'un item ;
- demande d'emprunt ;
- acces admin si le compte existe ;
- page `/privacy`.

Verifier aussi :

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100 backend
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100 caddy
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=100 database
```

## Communication apres incident

En cas de rollback, noter :

- date et heure ;
- version deployee initialement ;
- version restauree ;
- cause identifiee ;
- action corrective prevue ;
- impact utilisateur.

## Limites actuelles

- Pas de rollback automatique.
- Pas de sauvegarde automatisee configuree.
- Pas de monitoring de production avance.
- Les migrations doivent etre relues avant chaque deploiement.

Pour la certification, l'important est de montrer que ces limites sont connues et qu'une procedure manuelle claire existe.
