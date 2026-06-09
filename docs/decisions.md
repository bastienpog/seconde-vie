# Décisions techniques – Seconde Vie

Ce document sert à garder une trace des décisions importantes du projet.
Chaque décision doit être courte, datée et justifiable à l'oral.

## 2026-06-06 – Choix du MVP

Le MVP se limite aux fonctionnalités indispensables : authentification, publication d'objet, consultation, recherche, demande d'emprunt, gestion des demandes et suppression de compte.

Les fonctionnalités comme la messagerie, les favoris, les notes et le carousel multi-images sont reportées afin de garder un périmètre réaliste.

## 2026-06-06 – Ville saisie librement

La ville est saisie librement dans le MVP.
Ce choix évite la complexité d'une API de géolocalisation et permet de livrer rapidement une recherche locale simple.

## 2026-06-06 – Une seule photo par objet

Le MVP limite chaque annonce à une photo principale.
Le multi-photos et le carousel sont conservés comme évolution future.

## 2026-06-06 – Architecture en couches Symfony

Le backend suit une architecture en couches : Controller, Service, Repository, Entity.
Ce choix rend le code plus lisible, testable et défendable à l'oral.

## 2026-06-06 – Organisation frontend par features

Le frontend est organisé par domaine métier : auth, items, loans, profile, admin.
Ce choix évite une structure trop générique et facilite l'évolution du projet.

## 2026-06-09 – Suppression physique du compte MVP

Pour le MVP, la suppression de compte est une suppression physique de l'utilisateur.
Ce choix reste simple à expliquer et supprime aussi les annonces possédées ainsi que les demandes d'emprunt liées par cascade.

## 2026-06-09 – Refus de suppression d'une catégorie utilisée

Une catégorie associée à au moins une annonce ne peut pas être supprimée.
L'API retourne `409 Conflict` afin d'exprimer un conflit métier plutôt qu'une erreur technique de contrainte SQL.
