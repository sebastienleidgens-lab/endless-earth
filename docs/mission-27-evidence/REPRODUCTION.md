# Reproduire Mission 27

Référence M26.4 : `1d330cab93847a4026194088c60d378c71c0b8f7`. SHA runtime attesté par les reçus disponibles : `7845dcb8bbecbe4a5e57ebb13256559d622eb08d`. Le rapport est assemblé depuis des preuves existantes; sa génération ne rejoue aucun test, voyage ou capture.

## Prérequis

Node compatible avec Vite 7 (20.19+ ou 22.12+), npm et dépendances du lockfile; mémoire/disque suffisants pour les données fines historiques. Le navigateur de vérification doit être disponible et Playwright utiliser sa version déclarée. Si les binaires Chromium manquent, installer uniquement ceux autorisés par l’environnement ou utiliser un exécutable déjà présent. Les fixtures sont synthétiques. Aucun compte commercial ou clé payante n’est nécessaire.

## Installation et vérification

Depuis la racine du dépôt :

```sh
npm ci --ignore-scripts --cache work/npm-cache
npm test
npm run build
node --test tests/enrichment*.test.mjs
node scripts/audit-mission-27-geodesy.mjs
```

Ces commandes sont les opérations à exécuter pour un nouveau contrôle; les résultats de cette remise sont uniquement ceux de validation.json. Le premier essai baseline avait 446/449 tests, dépendance déclarée absente; après npm ci, 466/466 réussis.

## Régénération et audits

```sh
node scripts/prepare-mission-27.mjs --verify
node scripts/audit-mission-27.mjs
node scripts/prepare-mission-27-fixtures.mjs
```

La préparation lit les manifestes, packs et sources historiques. --verify compare deux générations par tuile. Le reçu génération mesure tailles/durée/répétabilité; l’audit produit couverture, richesse, stations et disponibilité immersive. Il laisse le rendu non observé et ne certifie ni 499 scènes ni 265 polygones communaux. Les sources synthétiques montagne/tropicale restent clairement séparées de la Vienne réelle.

Le terrain fin historique est épinglé à `acb0a73b396229bf90731b90a558a8d5d072a9ec` et peut nécessiter réseau HTTPS. Les contrôles source/licence sont décrits dans le document données; ne pas réacquérir le département entier pour examiner quelques stations. Les artefacts artistiques livrés sont dans public/planet/fr-86/enrichment/.

## Application et fixtures

```sh
npm run dev -- --port 5370
```

Ouvrir /endless-earth/ sur ce serveur. Deux pages de validation : /endless-earth/fixtures/mission-27.html?region=validation-m27-mountain et ?region=validation-m27-tropical. Elles réemploient createPlanetRuntime et le renderer, avec données/permissions synthétiques; leur petit déplacement technique ne devient pas un voyage natif. Le climat fixture, audio et faune ne certifient pas une parité mondiale complète.

Les captures du jeu instrumenté nécessitent un checkout dont src/public/package correspondent au commit courant :

```sh
node scripts/build-mission-27.mjs
```

Ce build de diagnostic réemploie le shim historique et ajoute inspection seulement. Il exige un arbre de sources propre. Il écrit work/mission-27/compiled/runtime-build.json; servir le répertoire compilé en respectant le préfixe /endless-earth/. Les placements diagnostiques ne sont pas des kilomètres joués. Les paramètres et commandes réellement employés par le navigateur appartiennent à browser-gameplay.json et fixtures-runtime.json, quand ils sont présents.

## Rapport reproductible

```sh
node scripts/report-mission-27.mjs
```

Pour servir le build instrumenté et relancer le contrôle : `npx vite preview --host 127.0.0.1 --port 5408 --outDir work/mission-27/compiled` puis `node scripts/verify-mission-27-browser.mjs 5408 all`. Le protocole sert les octets terrain historiques locaux sans supprimer leurs contrôles SHA.

Cette dernière commande ne modifie que docs/mission-27.md, acceptance.json, index.html et ce fichier. Elle lit les reçus actuellement présents; une absence reste explicite. Refaire les captures, tests et audits après une modification de code avant de mettre à jour les reçus. Ne pas attribuer un nouveau SHA aux anciens films.

## Revue encore nécessaire

22 stations et tirage stratifié : visual-stations.json; seed `mission27-stratified-v1`. Une coordonnée source sélectionnée exige admission/support runtime avant placement caméra. Comparer profils, saisons, heures, demi-tours et défauts historiques; garder les échecs. Longs voyages historiques et sessions natives 30–60 minutes ne sont pas rejoués par les commandes d’assemblage. GPU/téléphone physique et écoute matérielle : non validés par SwiftShader.
