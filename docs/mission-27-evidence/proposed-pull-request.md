# PR proposée — Mission 27

État : non créée. Le contrôle automatique demande une autorisation explicite avant ouverture sur GitHub. Destination : `sebastienleidgens-lab/endless-earth`, base `main`, tête `mission/27-world-enrichment`, brouillon `true`.

Titre : **Mission 27 — enrichissement tuilé du monde, livraison partielle**

+Hors du pilote, le rendu départemental utilisait des volumes de bâtiments simples. Cette PR ajoute une génération déterministe de façades, ouvertures et toitures, ainsi que des grappes de petits détails contextuels. Les artefacts gzip sont chargés et vérifiés dans le worker existant, puis rendus sans modifier les sources physiques ni les droits d’accès.

**Verdict M27 : PARTIEL. PR en brouillon, non prête à fusionner comme mission achevée.** Base vérifiée : `1d330cab93847a4026194088c60d378c71c0b8f7` (PR #38 fusionnée dans main). Le code du jeu observé est `7845dcb8bbecbe4a5e57ebb13256559d622eb08d` ; les commits documentaires suivants conservent le même arbre src.

- 499 artefacts vérifiés, dont 497 avec contenu et 2 vides signalés ; 529 287 plans de bâtiments uniques et 235 370 petits détails. Deux générations identiques et cache intégral vérifiés. Ces nombres ne prouvent pas une couverture artistique équivalente à Angles.
- 265 centres communaux couverts, 22 cibles source et 32 tuiles stratifiées. Façades effectivement capturées à trois positions admises dans les secteurs de Chauvigny, Poitiers et Montmorillon ; placements diagnostiques exclus des voyages.
- Deux territoires synthétiques montagne/tropical réemploient le runtime : chargement, rendu, collisions et sauvegarde. Géodésie ECEF/ENU et cas extrêmes testés séparément, sans prétendre migrer le runtime mondial.
- 493 tests réussis, build réussi ; smoke du build de production sans hooks avec clavier, audio, trois profils et tactile émulé. 8 960 fichiers historiques protégés inchangés.
- Restent ouverts : parité eau/audio/faune/camp hors pilote, toits et fondations génériques, popping/ombres, longues traversées M27, endurance et matériel physique. Préparation observée jusqu’à 148,5 ms. Courte observation native stationnaire à environ 7,44 images rendues/s sous SwiftShader, framebuffer 384×240 : aucune validation de fluidité ou d’Android. Vidéo seule, sans preuve audio native.

[Rapport final A01–A56](https://github.com/sebastienleidgens-lab/endless-earth/blob/mission/27-world-enrichment/docs/mission-27.md) · [Architecture](https://github.com/sebastienleidgens-lab/endless-earth/blob/mission/27-world-enrichment/docs/mission-27-architecture.md) · [Reproduction et galerie locale](https://github.com/sebastienleidgens-lab/endless-earth/blob/mission/27-world-enrichment/docs/mission-27-evidence/REPRODUCTION.md)

Les premières captures prises avant fin de reconstruction sont conservées et exclues de la validation artistique. Aucun merge, déploiement, achat, nouveau service payant ou workflow de production modifié.
