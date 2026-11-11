# Mission 13D — ADN des matières et optimisation

Le [rapport principal](../../mission-13.md) présente les choix et leurs limites. La [galerie finale](index.html) rassemble les douze triplets Mission 12 / 13C / 13D, deux scènes régionales synthétiques, les autres lumières, les références et les vidéos natives.

## Essayer sans publier

```sh
git switch mission/13-matieres-authentiques-france
npm ci
npm run dev -- --port 5173 --strictPort
```

- Jeu final : `http://localhost:5173/endless-earth/?materials=hybrid`
- Témoin dans le jeu : `http://localhost:5173/endless-earth/?materials=mission12`
- Galerie : `http://localhost:5173/endless-earth/docs/mission-13-evidence/optimization/index.html`
- Scène atlantique : `http://localhost:5173/endless-earth/fixtures/regions.html?materials=hybrid&fixture=atlantic-village&region=atlantic&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`
- Scène méridionale : même URL avec `fixture=mediterranean-rock&region=mediterranean`.

Les scènes portant `materials=hybrid` utilisent les variantes 13D, dont les règles géométriques et les emplacements des arbres sont fixes. Le sélecteur change l’apparence. Les anciennes URL de fixtures sans ce paramètre conservent les règles de démonstration Mission 12 ; elles ne sont pas les preuves de conservation des dimensions 13D. Aucun de ces paysages synthétiques ne représente un vrai village.

Le diagnostic `materials=photographic` du village reste le diagnostic Lambert de 13C ; ce n’est pas un PBR Standard complet. La comparaison Standard / procédural / hybride demeure dans l’atelier 13B. La photographie brute plus brune est conservée parmi les exemples rejetés.

## Reproduire les comparaisons

Les scripts utilisent Chromium `/usr/bin/chromium`, Playwright fourni par `npm ci`, FFmpeg/ffprobe et Python avec Pillow 13. Ils ne nécessitent aucun service payant. Les PNG livrés sont prêts à l’emploi. La préparation peut réutiliser les sources épinglées du cache ; le granite manquant est téléchargé depuis son URL publique avec contrôle SHA-256.

Dans deux autres checkouts, servir le témoin au commit `7b2d711b3085f156d8d91d649e64e2fc75c11126` sur **5182** et 13C au commit `56a8ed20daba952e22daaaf07da4e77a6a9e2b38` sur **5184**, avec `--strictPort`. Le commit 13B conserve exactement les shaders du jeu Mission 12. Le checkout courant reste sur 5173.

```sh
python scripts/prepare-france-materials.py
node scripts/browser-mission-13-d.mjs before
node scripts/browser-mission-13-d.mjs prior
node scripts/browser-mission-13-d.mjs after
node scripts/benchmark-mission-13-d.mjs
node scripts/browser-france-materials.mjs
node scripts/browser-mission-13-d-checks.mjs
node scripts/browser-mission-13-d-walk.mjs after
python scripts/report-mission-13-d.py
node scripts/browser-mission-13-d-gallery.mjs
```

Exécuter le benchmark et la promenade sans autre travail graphique simultané. La promenade doit rester native : pas de téléportation, d’accélération ou de rejeu. Elle dure environ six minutes, puis douze secondes à l’arrêt. Le son est capturé après le limiteur et les vidéos sont seulement remuxées. Le témoin vidéo Mission 12 est celui déjà enregistré en 13C, avec la brève concurrence de préparation indiquée dans son rapport ; il n’est pas présenté comme une nouvelle mesure isolée de 13D. La vidéo 13C avant optimisation reste accessible dans son dossier historique.

Une variante RGBA8 a été comparée à RG8 sur 72 rendus et neuf paires de pixels identiques : `node scripts/benchmark-france-formats.mjs`. Elle ne présente pas de gain constant et double le stockage théorique de texels ; RG8 est retenu.

Le benchmark réalise 324 lectures complètes, trois profils, trois vues, trois passages alternés et douze valeurs par combinaison. Il vérifie caméra, date, météo, appels et triangles. Les valeurs SwiftShader ne sont ni des FPS de GPU physique ni des mesures Android. Les observations de démarrage et tailles transférées proviennent d’un serveur local de développement, une observation par version : elles ne prédisent pas un réseau mobile.

Les fixtures comparent positions, normales, UV et indices de tous les maillages, plus les ancrages/classes/échelles des arbres. Elles testent douze changements de contexte, un changement concurrent et le plateau des ressources après échauffement. Le cache ne garde que deux packs ; un pack en cours de décodage peut s’y ajouter brièvement côté CPU avant éviction. Les essais sont finis et ne prouvent pas une absence de fuite indéfinie.

Les traces JSON volumineuses sont compressées. `summary.json` expose les mesures essentielles et `preservation.json` contrôle les fichiers protégés contre 13C. Dans le manifeste de décoration, seules les empreintes des deux modules d’apparence sont actualisées ; aucun pack, ancrage, arbre, tracé ou relief n’est régénéré.

Sources : [catalogue des contextes](../../../public/materials/france/catalog.json), [granite : droits, dimensions et empreintes](granite-reference.json), [crédits 13A](../credits.md), bibliothèque CC0 13B inchangée. Le grain à 128 pixels est plus doux de très près ; le MNT à 10 m et les hauteurs estimées restent les limites du terrain et des bâtiments.

Arrêt après 13D pour validation artistique finale. PR en brouillon ; aucune fusion, publication ni modification de Living Paintings / LP-01.
