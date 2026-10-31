# Hannah Hajar — site 3D audio-réactif

Site expérimental conçu pour un duo musical. Ce n'est pas un site vitrine :
les contenus sont dispersés dans une scène 3D qu'on explore à l'orbite, sans
menu et sans scroll. La navigation spatiale remplace la hiérarchie.

→ [hannah-hajar.vercel.app](https://hannah-hajar.vercel.app/)

---

## Fonctionnement

La page passe par trois états : `enter` (écran d'accueil avec le logo),
`loading` (préchargement de la scène), puis `ready`.

Une fois entré, on tourne autour d'une sphère centrale et on s'en rapproche ou
s'en éloigne. Les contenus — images, vidéos, textes (bio, abstract, tech rider),
dates de concerts — sont posés sur la sphère et restent toujours face à la
caméra.

---

## Stack

- Next.js 14 (App Router)
- React 18, TypeScript
- Three.js + React Three Fiber + drei
- GLSL (shaders écrits à la main)
- GSAP (transitions)
- Bunny CDN (hébergement des médias)

Pas de Tailwind : le style est en CSS global et en styles inline.

---

## Architecture

```txt
src/
 ├─ app/
 │   ├─ page.tsx            # machine à états enter / loading / ready
 │   ├─ layout.tsx
 │   └─ globals.css
 ├─ components/
 │   ├─ SphereScene.tsx     # la scène 3D (le gros du projet)
 │   ├─ ThreeBackground.tsx # le fond, shader GLSL plein écran
 │   └─ CursorParticles.tsx # les particules qui suivent le curseur
 └─ lib/
     ├─ bunny.ts            # résolution des URL CDN + listing côté serveur
     └─ data/
         ├─ world.ts        # position et type de chaque élément de la scène
         ├─ media.ts
         └─ concerts.ts     # textes bio / abstract / tech rider / dates
```

---

## Choix techniques

### Répartition des contenus sur la sphère

Les éléments sont placés selon l'**angle d'or**, `π(3 − √5)`, ce qui donne la
distribution dite en tournesol de Fibonacci. L'intérêt : les points sont
régulièrement espacés sans jamais former de ligne ni de spirale visible. Une
distribution au hasard ferait des paquets et des trous, une grille ferait
apparaître des alignements.

### Orientation des panneaux

Pas de composant `Billboard` : chaque élément appelle `lookAt(camera.position)`
à chaque frame. Les panneaux restent donc toujours lisibles, quelle que soit la
position de l'orbite.

### Navigation

`OrbitControls` de drei, avec le **zoom natif désactivé** (`enableZoom={false}`)
et remplacé par un contrôle trackpad maison, pour que le geste à deux doigts
soit interprété correctement. La distance caméra est bornée par `minDistance` et
`maxDistance` autour du rayon de la sphère.

### Le fond

Le fond n'est pas une image mais un shader GLSL calculé à chaque frame. Un bruit
fractal (`fbm`) est replié trois fois sur lui-même — technique du *domain
warping* — ce qui produit des volutes qui ne se répètent jamais. Le centre de la
déformation suit la position du curseur (`uMouse`). Les rouges viennent du
mélange de trois teintes par `smoothstep` successifs.

### Positions déterministes

`world.ts` place les éléments avec une fonction pseudo-aléatoire déterministe
(`fract(sin(n) * 43758.5453)`) plutôt qu'avec `Math.random()`. La disposition a
l'air d'un hasard mais elle est strictement identique à chaque visite et à
chaque build.

### Audio

Un drone en boucle, en balise `<audio>` HTML, volume fixe à `0.35`, démarré à
l'entrée dans la scène (les navigateurs refusent la lecture automatique avant un
geste utilisateur, d'où le repli sur un `click`).

**Il n'y a pas de spatialisation ni de modulation du son selon la distance.**
C'était l'intention de départ, ce n'est pas ce qui est en ligne.

### Médias

Servis par Bunny CDN. `lib/bunny.ts` résout les URL côté client et expose un
listing de la zone de stockage côté serveur. Pas de Git LFS.

---

## Lancer le projet

Prérequis : Node.js >= 20.

```bash
npm install
npm run dev
```

Build de production :

```bash
npm run build
npm run start
```

### Variables d'environnement

```bash
NEXT_PUBLIC_BUNNY_CDN_URL=   # URL publique de la pull zone
BUNNY_STORAGE_ZONE=          # serveur uniquement
BUNNY_STORAGE_HOST=          # défaut : storage.bunnycdn.com
BUNNY_STORAGE_PASSWORD=      # serveur uniquement
```

Sans `NEXT_PUBLIC_BUNNY_CDN_URL`, les chemins locaux sont utilisés en repli.

---

## Limites connues

- Pas de spatialisation audio.
- `SphereScene.tsx` fait près de 900 lignes et mériterait d'être découpé.
- Le mobile n'est pas optimisé : la scène est pensée pour un pointeur et un
  trackpad.
- Les fichiers `* 2.ts` dans `lib/data/` sont des doublons à nettoyer.

---

## Autrice

Thalia Woods — développeuse créative, systèmes interactifs
[thalia-woods.vercel.app](https://thalia-woods.vercel.app)
