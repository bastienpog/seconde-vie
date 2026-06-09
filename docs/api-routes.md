# Routes API prévues – Seconde Vie

## Convention générale

- Toutes les routes commencent par `/api`.
- Les réponses sont au format JSON.
- Les routes protégées nécessitent un JWT.
- Les routes admin nécessitent le rôle `ROLE_ADMIN`.

## Authentification

| Méthode | Route | Protection | Description |
|---|---|---|---|
| POST | `/api/register` | Public | Créer un compte |
| POST | `/api/login` | Public | Se connecter |
| GET | `/api/me` | Utilisateur connecté | Récupérer son profil |
| DELETE | `/api/me` | Utilisateur connecté | Supprimer physiquement son compte |

## Objets

| Méthode | Route | Protection | Description |
|---|---|---|---|
| GET | `/api/items` | Public | Lister les objets |
| GET | `/api/items/{id}` | Public | Voir le détail d'un objet |
| POST | `/api/items` | Utilisateur connecté | Publier un objet |
| GET | `/api/me/items` | Utilisateur connecté | Lister mes objets |
| PUT | `/api/items/{id}` | Propriétaire | Modifier un objet |
| DELETE | `/api/items/{id}` | Propriétaire ou admin | Supprimer un objet. Un admin peut supprimer toute annonce pour modération. |

Filtres possibles sur `GET /api/items` :

```txt
?search=perceuse
?category=1
?city=Paris
```

## Catégories

| Méthode | Route | Protection | Description |
|---|---|---|---|
| GET | `/api/categories` | Public | Lister les catégories |
| POST | `/api/admin/categories` | Admin | Créer une catégorie |
| PUT | `/api/admin/categories/{id}` | Admin | Modifier une catégorie |
| DELETE | `/api/admin/categories/{id}` | Admin | Supprimer une catégorie |


## Suppression de compte

`DELETE /api/me` supprime physiquement l'utilisateur connecté et retourne `204 No Content`.

La suppression entraîne aussi la suppression des annonces possédées par l'utilisateur et des demandes d'emprunt liées, directement ou via ses annonces. L'absence de JWT retourne `401`.

## Administration des catégories

Les routes `/api/admin/categories` nécessitent `ROLE_ADMIN`.

Body minimal pour créer ou modifier une catégorie :

```json
{
  "name": "Outillage"
}
```

Le champ `name` est obligatoire. Le `slug` est généré automatiquement depuis le nom. La création retourne `201`, la modification retourne `200`, la suppression retourne `204`. Une catégorie inexistante retourne `404`. La suppression d'une catégorie utilisée par une annonce est refusée avec `409 Conflict`.

## Demandes d'emprunt

| Méthode | Route | Protection | Description |
|---|---|---|---|
| POST | `/api/items/{id}/loan-requests` | Utilisateur connecté | Demander un emprunt |
| GET | `/api/me/loan-requests/sent` | Utilisateur connecté | Voir mes demandes envoyées |
| GET | `/api/me/loan-requests/received` | Utilisateur connecté | Voir mes demandes reçues |
| PUT | `/api/loan-requests/{id}/accept` | Propriétaire | Accepter une demande |
| PUT | `/api/loan-requests/{id}/refuse` | Propriétaire | Refuser une demande |


Les demandes d'emprunt sont confirmées dans le MVP : un utilisateur connecté peut demander un objet qui ne lui appartient pas, consulter ses demandes envoyées et reçues, et le propriétaire peut accepter ou refuser une demande.

## Création d'un objet

`POST /api/items` crée un item pour l'utilisateur connecté.

Body minimal :

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

La réponse de succès est `201 Created`. Les données invalides retournent `400`, une catégorie inexistante retourne `404`, et l'absence de JWT retourne `401`. L'objet créé est ensuite visible dans `GET /api/items`.

## Codes HTTP attendus

| Code | Usage |
|---|---|
| 200 | Succès |
| 201 | Ressource créée |
| 204 | Suppression réussie sans contenu |
| 400 | Erreur de validation |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource introuvable |
| 409 | Conflit métier, par exemple demande impossible |
| 500 | Erreur serveur |
