# Mission 13C — Preuves du véritable jeu

Le [rapport courant](../../mission-13.md) décrit les choix et les limites. Ouvrir la [galerie](index.html) via Vite ; GitHub affiche le HTML comme source. Les JPEG, vidéos et JSON compressés restent téléchargeables séparément.

## Prévisualiser la branche sans déployer

```sh
git switch mission/13-matieres-authentiques-france
npm ci
npm run dev -- --port 5173
```

- Jeu retenu : `http://localhost:5173/endless-earth/?materials=hybrid`
- Témoin : `http://localhost:5173/endless-earth/?materials=mission12`
- Diagnostic couleur photographique : `http://localhost:5173/endless-earth/?materials=photographic`
- Galerie : `http://localhost:5173/endless-earth/docs/mission-13-evidence/integration/index.html`

L’hybride est le défaut. Le diagnostic photographique conserve le même éclairage Lambert : il ne constitue pas une intégration complète du PBR Standard de l’atelier 13B. Aucun service de textures n’est contacté pendant le jeu.

## Reproduire les preuves

Les scripts attendent `/usr/bin/chromium`, Playwright installé par `npm ci`, FFmpeg/ffprobe et Python avec Pillow. La préparation des atlas de 13B n’est pas nécessaire pour utiliser les fichiers livrés. Pour le vrai témoin historique, démarrer un second checkout au commit `7b2d711b3085f156d8d91d649e64e2fc75c11126` sur le port 5182, puis le checkout courant sur 5173. Le checkout 13B conserve exactement les matériaux de jeu Mission 12.

```sh
node scripts/browser-mission-13-c.mjs before
node scripts/browser-mission-13-c.mjs photo
node scripts/browser-mission-13-c.mjs hybrid
node scripts/benchmark-mission-13-c.mjs
node scripts/browser-mission-13-c-checks.mjs
node scripts/browser-mission-13-c-walk.mjs before
node scripts/browser-mission-13-c-walk.mjs after
python scripts/report-mission-13-c.py
```

Exécuter les deux promenades seules, sans autre navigateur de mesure. Elles utilisent le véritable AutoWalk à vitesse native sur 450 m, en vue subjective Éco 640 × 360, suivies de douze secondes d’arrêt. Le son est capturé après le limiteur. Les vidéos VP8/Opus sont seulement remuxées pour être navigables. Les durées ne sont pas resynchronisées. Le témoin livré a partagé quelques instants avec des contrôles brefs de préparation ; les intervalles vidéo ne permettent donc pas d’isoler précisément le seul coût des matières.

Les 36 captures utilisent douze stations, dont les huit familles de 13A. Caméra, projection, coordonnées, date, météo, profil, résolution et appels/triangles de chaque triplet sont vérifiés par le générateur de rapport. Les quatre vues supplémentaires montrent matin, soir, pluie et nuit. Les captures immobilisent l’animation pour la comparaison ; les vidéos laissent tourner le jeu natif.

Le benchmark distinct alterne trois fois les variantes pour trois stations et trois profils, avec quatre lectures complètes par passage : 324 rendus, 12 valeurs par combinaison. Les profils appliquent réellement le réglage Éco du renderer. Les nombres sont ceux de SwiftShader, avec synchronisation par lecture des pixels, pas ceux d’un GPU physique ni d’Android.

Les traces de parcours sont compressées après assemblage. `summary.json` résume les conditions, rendus et parcours ; `preservation.json` compare les fichiers protégés au témoin 13B. Les fichiers `checks/*.json.gz` proviennent de nouvelles exécutions des contrôles de navigation, streaming, architecture, nature, météo, audio et mobile existants. `checks/fallback.json` ajoute trois cas : atlas corrompu, catalogue invalide et témoin explicite. Le bâtiment, la collision ou la classe géographique ne changent jamais pour utiliser une texture.

Les photographies du village restent dans la [galerie documentaire 13A](../index.html), avec [crédits](../credits.md). Elles servent à comparer des familles de joints, patine et échelle, sans recalage géométrique. Les textures de jeu sont exclusivement les ressources CC0 du [catalogue 13B](../../../public/materials/authentic/catalog.json).

Arrêt après 13C : validation artistique du propriétaire requise avant 13D. PR en brouillon ; aucune fusion ni publication.
