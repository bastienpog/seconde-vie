# Stratégie de tests – Seconde Vie

## Objectif

La stratégie de tests doit couvrir trois niveaux :

- tests d'intégration ;
- tests système ;
- tests d'acceptation.

## Tests d'intégration backend

Les tests d'intégration vérifient que les endpoints REST fonctionnent avec les services, repositories et la base de données.

Exemples :

| ID | User story | Niveau | Description | Résultat attendu |
|---|---|---|---|---|
| T01 | US-01 | Intégration | Inscription avec données valides | Retour 201 et utilisateur créé |
| T02 | US-01 | Intégration | Inscription avec email déjà utilisé | Retour 400 |
| T03 | US-02 | Intégration | Connexion avec identifiants valides | Retour 200 avec token |
| T04 | US-03 | Intégration | Création d'objet connecté | Retour 201 et objet créé |
| T05 | US-03 | Intégration | Création d'objet non connecté | Retour 401 |
| T06 | US-04 | Intégration | Liste des objets | Retour 200 avec tableau |
| T07 | US-09 | Intégration | Demande d'emprunt valide | Retour 201 et demande créée |
| T08 | US-09 | Intégration | Demande sur son propre objet | Retour 409 ou 403 |
| T09 | US-10 | Intégration | Acceptation par propriétaire | Statut accepté |
| T10 | US-10 | Intégration | Acceptation par non-propriétaire | Retour 403 |
| T16 | US-12 | Intégration | Suppression de compte connecté | Retour 204, utilisateur supprimé, annonces et demandes liées supprimées |
| T17 | US-12 | Intégration | Suppression de compte non connecté | Retour 401 |
| T18 | US-13 | Intégration | Création et modification de catégorie par admin | Retour 201 puis 200 avec slug généré |
| T19 | US-13 | Intégration | Suppression d'une catégorie utilisée | Retour 409 |
| T20 | US-14 | Intégration | Suppression d'une annonce par admin | Retour 204 et annonce supprimée |

## Tests système manuels

Les tests système vérifient l'application complète dans un scénario réel.

| ID | User story | Niveau | Procédure | Résultat attendu |
|---|---|---|---|---|
| T11 | US-01/US-02 | Système | Créer un compte puis se connecter | L'utilisateur arrive sur son espace |
| T12 | US-03/US-04 | Système | Publier un objet puis consulter la liste | L'objet apparaît dans la liste |
| T13 | US-06 | Système | Rechercher un objet par mot-clé | Les résultats sont filtrés |
| T14 | US-09/US-10 | Système | Demander un emprunt puis accepter | La demande change de statut |
| T15 | US-12 | Système | Supprimer son compte | Le compte est supprimé et l'utilisateur déconnecté |
| T21 | US-13 | Système | Créer, modifier puis supprimer une catégorie en admin | Les changements sont visibles dans la liste des catégories |
| T22 | US-14 | Système | Supprimer une annonce en admin | L'annonce n'apparaît plus dans la liste publique |

## Tests d'acceptation

Les tests d'acceptation valident le besoin métier en langage utilisateur.

### TA01 – Création de compte

Given un visiteur non connecté  
When il remplit correctement le formulaire d'inscription  
Then son compte est créé et il peut se connecter

### TA02 – Publication d'un objet

Given un utilisateur connecté  
When il publie un objet avec les informations obligatoires  
Then l'objet est visible dans la liste publique

### TA03 – Recherche d'un objet

Given plusieurs objets publiés  
When un visiteur recherche un mot-clé  
Then seuls les objets correspondants sont affichés

### TA04 – Demande d'emprunt

Given un utilisateur connecté consultant un objet qui ne lui appartient pas  
When il envoie une demande d'emprunt  
Then le propriétaire reçoit une demande en attente

### TA05 – Réponse à une demande

Given un propriétaire ayant reçu une demande  
When il accepte ou refuse la demande  
Then le demandeur voit le statut mis à jour

### TA06 – Suppression de compte

Given un utilisateur connecté avec des annonces ou demandes d'emprunt  
When il supprime son compte  
Then son compte et les données liées du MVP sont supprimés

### TA07 – Administration des catégories

Given un administrateur connecté  
When il crée ou modifie une catégorie avec un nom valide  
Then la catégorie est enregistrée avec un slug généré

### TA08 – Suppression d'une catégorie utilisée

Given une catégorie associée à une annonce  
When un administrateur tente de la supprimer  
Then l'API refuse l'action avec un conflit métier

### TA09 – Modération admin des annonces

Given un administrateur connecté  
When il supprime une annonce  
Then l'annonce est retirée même s'il n'en est pas propriétaire
