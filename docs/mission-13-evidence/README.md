# Mission 13A — Index et reproduction

Ouvrir [la galerie](index.html), [le rapport](../mission-13.md), [les crédits](credits.md).

- `catalog.json` : 38 ressources réellement consultées, sources, auteur, droits, dimensions, format, SHA-256 du fichier consulté et de son aperçu. Les scopes distinguent diffuse originale 1K, archive PBR, miniature Commons et panorama SD.
- `findings.json` : huit familles, acquis Mission 12, défauts observés, gain attendu, coût/risques et bibliothèque conditionnelle pour 13B.
- `baseline/`, `baseline.json` : huit vues du moteur et rue Éco/Qualité, caméra complète, paramètres effectifs, GPU logiciel, six rendus synchronisés par ligne. Toutes proviennent du main fusionné `a8ce9c9`, moteur inchangé.
- `references/` : petits aperçus documentaires, chaque photo garde sa licence et ses crédits ; aucune intégration dans `public/`.
- `rejected.json`, `license-checks.json` : réserves, rejets, accès et vérification officielle des licences.
- `preservation.json` : périmètre protégé et arbres Git identiques.
- `checks/` : contrôles du navigateur rejoués depuis les scripts existants, sans réécrire les preuves Mission 11/12 ; synthèse et limites dans `summary.json`, traces détaillées compressées en `.json.gz` pour alléger la revue.

## Prévisualiser

```sh
npm ci
npm run dev -- --port 5173
```

Galerie : `http://localhost:5173/endless-earth/docs/mission-13-evidence/index.html`.
Les images et le rapport sont aussi visibles sur GitHub ; GitHub ne sert pas cette page HTML comme un site.
Le build public ne contient pas la documentation. Aucun déploiement demandé ou effectué.

## Rejouer les preuves

Chromium doit être installé à `/usr/bin/chromium` ; Playwright vient des dépendances du dépôt. Les sources et dérivés du pilote sont déjà versionnés. Ne pas lancer les préparations Mission 12 pour cette recherche.

```sh
npm test
npm run build
npm run preview -- --port 5180
# Dans un autre terminal, pendant que preview tourne :
TEST_URL='http://localhost:5180/endless-earth/?perf=1&moment=afternoon&weather=clear' npm run test:browser
# Garder le serveur de développement 5173 pour l’instrumentation diagnostique :
node scripts/browser-mission-13-a.mjs
node scripts/browser-mission-13-checks.mjs
python scripts/report-mission-13-a.py
```

`browser-mission-13-checks.mjs` réutilise les contrôles existants de zone, architecture, nature et atmosphère/audio. Seuls leurs chemins d’écriture sont redirigés vers 13A ; les imports Node sont résolus explicitement. Les caméras diagnostiques et pauses de simulation ne constituent pas un itinéraire réellement parcouru. Le smoke test du build utilise la boucle ordinaire et vérifie le déplacement.

Les captures figent l’instant effectif `2026-06-21T13:57:47.015Z`, après-midi clair, soit 15 h 57 à Angles ; `baseline.json` garde toutes les valeurs effectives. Réécrire les captures depuis une future version modifiée ne recréerait pas la référence Mission 12. Utiliser le main `a8ce9c9` avec les seuls scripts 13A pour cette référence.

## Retrouver les sources sans gonfler Git

```sh
python scripts/fetch-mission-13-references.py --only P-old_stone_wall,P-roof_tiles_14,A-Rock023
# Sans --only : les 38 fichiers explicitement catalogués.
```

Téléchargements dans `work/mission-13/sources/`, SHA-256 obligatoire avant acceptation. Aucun service permanent ni collecte ouverte. Les sources évolutives peuvent ne plus correspondre ; arrêter et réexaminer leur provenance, ne pas modifier silencieusement l’empreinte. Les cartes ambientCG sont dans les ZIP 1K-JPG ; l’inventaire et les empreintes de chaque membre sont dans le catalogue. Les SHA-256 des originaux Commons/HD Panoramax non téléchargés ne sont pas connus.

Les aperçus servent uniquement à la revue ; leur réduction n’est pas un pipeline de matériaux 13B. Toute nouvelle redistribution des photos doit conserver les crédits et conditions spécifiques. Les références IGN antérieures restent dans leurs propres preuves Mission 08.5 et ne sont pas dupliquées.

**Arrêt 13A.** Bibliothèque, comparatifs PBR/procédural/hybride, préparation des cartes et intégration M13 non commencés. Validation du propriétaire obligatoire avant 13B.
