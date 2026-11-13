# Preuves Mission 17A

Ouvrir `npm run dev -- --port 5317`, puis :

- `/endless-earth/fixtures/trees.html?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z` : atelier interactif, modèles originaux, mètres natifs et promeneur existant.
- `/endless-earth/docs/mission-17-evidence/index.html` : galerie documentaire et paires.

Ces entrées de développement ne sont pas ajoutées au build public du jeu. Aucune URL de déploiement n’est créée. Les captures du paysage passent par le véritable `src/main.ts`, avec injection diagnostique du harnais `scripts/lib/mission-17-browser.mjs` ; les autres arbres sont masqués pour isoler le sujet, et la géométrie inspectée est alternée à caméra/climat fixes. Les positions persistantes ne changent pas. Les ombres fines M14 sont désactivées dans les deux variantes de ces paires.

## Reproduire

`npm ci`, `npm test`, `npm run build`. Servir le dépôt sur 5317.

1. `node scripts/browser-tree-audit.mjs` — été/automne/hiver et ablations du rendu **Mission 16 conservé**, aucune intégration implicite des prototypes.
2. `node scripts/browser-tree-audit-support.mjs` — groupes réellement retenus et géométries des deux LOD.
3. Télécharger l’archive Sapling officielle épinglée dans `sources.json`, vérifier son SHA-256, l’extraire dans `work/mission-17/research/sapling/`. Blender 4.3.2 et Sapling 0.3.6 ont été utilisés.
4. `BLENDER_USER_SCRIPTS="$PWD/work/mission-17/blender-scripts" blender -b --factory-startup --python scripts/prepare-tree-sapling-evaluation.py` — export d’essai local, pas un asset de production.
5. `node scripts/browser-tree-prototypes.mjs` — 114 captures atelier/jeu ; le JSON final contient toutes leurs caméras et états.
6. `node scripts/benchmark-tree-prototypes.mjs` — 288 rendus ; exécuter seul, sur des sources figées, sans autre charge graphique.
7. `node scripts/browser-tree-review.mjs` — planche frontale de même échelle, profils, films natifs, contrôles de la galerie et viewport mobile.
8. `python scripts/prepare-tree-media.py` — indexation sans réencodage des deux films ; conservation vérifiée des paquets et PTS/DTS. FFmpeg requis.
9. `python scripts/report-tree-prototypes.py` — planches, synthèse et compression des mesures ; Pillow requis, comme pour les rapports antérieurs.

`MISSION17_PORT` permet d’utiliser un serveur figé sur un autre port pour les scripts de capture/benchmark. Les dernières mesures et captures individuelles ont utilisé une copie de source sous `work/mission-17/frozen/`, public et dépendances partagés, sur **5318**. La copie est immobile pendant les tests et son serveur doit être redémarré après une mise à jour des sources. La dernière planche frontale et les inspections de revue utilisent 5317. Les changements entre ces captures concernent le cadrage d’ensemble et l’interface de l’atelier, sans modification des géométries individuelles.

Le benchmark compare un sujet original et son prototype dans le même moteur/monde, avec tous deux résidents pendant les bascules. Ce n’est pas un benchmark d’une nouvelle forêt ni une mesure de VRAM. Les profils gardent volontairement la géométrie de référence détaillée du prototype. SwiftShader est un rendu logiciel.

## Médias et droits

Les JPEG sont des captures natives du moteur ; les planches sont seulement des assemblages réduits et légendés. Les deux WebM sont des observations silencieuses à temps réel, sans image générée ni accélération. Le réglage du climat avant leur début n’est pas présenté comme une transition filmée.

Les photos botaniques, extensions téléchargées, maillages d’essai Sapling et exports bruts restent dans `work/`, ignoré par Git. Seuls les images utiles, deux courts films, métadonnées et résultats sont conservés ici. Les sources géographiques et historiques restent inchangées. Les cinq captures du propriétaire n’étaient pas présentes dans la pièce jointe reçue.

Voir [le rapport](../mission-17.md), [la provenance](sources.json), [la préservation](preservation.json), [les contrôles](validation.json) et [la galerie](index.html).
