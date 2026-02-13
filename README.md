# Hannah Hajar — Site interactif audio-réactif

## Présentation

Ce projet est un site web expérimental conçu pour un duo musical.  
Il ne s’agit pas d’un site vitrine classique, mais d’un espace interactif dans lequel le son, les fragments visuels et la navigation spatiale constituent l’interface elle-même.

L’objectif est d’explorer une autre manière de concevoir le web : sans menu traditionnel, sans hiérarchie verticale, sans scroll linéaire.

L’expérience repose sur la relation entre le déplacement de l’utilisateur, la proximité spatiale et l’intensité sonore.

Une attention particulière a été portée à la cohérence entre intention artistique, architecture technique et performance.

---

## Concept

Le site est pensé comme un espace navigable.

L’utilisateur entre dans une zone centrale, déclenche l’audio, puis peut se déplacer librement dans un canvas étendu.

Les contenus (textes, images, vidéos, concerts, fragments abstraits) sont disposés dans l’espace et apparaissent selon la position de navigation.

Le son évolue en fonction de la distance entre l’utilisateur et certaines zones définies.

La navigation remplace la structure hiérarchique classique.

---

## Fonctionnalités

- Navigation par drag (pan libre sur un espace étendu)
- Lecture d’un drone audio au moment de l’entrée
- Modulation sonore selon la proximité spatiale
- Forme organique audio-réactive
- Fragments de contenu modulaires (texte, image, vidéo)
- Ouverture des médias en plein écran
- Logique de zones (bio, abstract, concerts, etc.)
- Gestion des médias lourds via Git LFS

---

## UI / UX

L’interface repose sur une immersion minimale.

Aucun menu traditionnel n’est visible.  
L’espace est l’interface.

La hiérarchie n’est pas verticale mais spatiale.  
La distance devient un paramètre d’organisation.

Les interactions sont volontairement limitées afin de préserver une sensation d’exploration fluide et organique.

---

## Stack technique

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Web Audio API (moteur audio personnalisé)
- Git LFS (gestion des médias lourds)

---

## Architecture

Le cœur du projet repose sur un composant central `Experience` qui orchestre :

- la position utilisateur  
- la logique de zones  
- le calcul d’intensité selon la distance  
- la modulation audio  
- l’affichage des fragments  

Structure simplifiée :

Structure simplifiée :

```txt
src/
 ├── app/
 ├── components/
 │    ├── Experience/
 │    ├── zones/
 ├── lib/
 │    ├── audio/
 │    ├── data/
 │    ├── hooks/
 │    └── math/
```

La logique de distance et d’intensité est isolée dans des modules dédiés afin de conserver une architecture claire et évolutive.

## Choix techniques

### Navigation

La navigation repose sur un système de coordonnées internes (pan) plutôt que sur le scroll natif.  
L’objectif est de permettre une exploration libre dans un espace étendu, proche d’une logique de constellation.

### Audio

L’audio est déclenché lors de l’entrée (afin de respecter les contraintes navigateur autour de l’AudioContext).  
Un moteur audio dédié permet de contrôler :

- le volume global
- l’intensité par zone
- les transitions progressives (fade)

### Composants

Les contenus sont organisés sous forme de fragments spécialisés (image, texte, vidéo).  
Chaque composant est conçu pour être découplé, réutilisable et facilement extensible.

## Démarche

Le projet a été conçu à partir de croquis conceptuels définissant :

- un espace central
- des zones satellites
- un principe de constellation
- une navigation par déplacement plutôt que par clic hiérarchique

L’intention est de créer une interface qui fonctionne autant comme :

- prototype artistique
- terrain d’expérimentation UX
- architecture interactive
- outil de performance numérique

## Installation et lancement

### Prérequis

- Node.js >= 20
- npm

### Installation

bash
npm install

### Lancer en local

bash
npm run dev

### Build de production

bash
npm run build
npm run start

## Gestion des médias

Ce projet utilise Git LFS pour versionner certains médias volumineux.

Si besoin, installer Git LFS puis :

bash
git lfs install
git lfs pull

## Pistes d’évolution

- Optimisation des performances
- Intégration WebGL
- TreeJs
- Spatialisation audio plus avancée
- Placement procédural des fragments
- Version mobile optimisée
- Synchronisation multi-utilisateurs

---

## Autrice

Thalia Woods  
Développeuse créative — systèmes interactifs  

Portfolio : https://thalia-woods.vercel.app
