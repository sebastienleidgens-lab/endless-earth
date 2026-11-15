# Mission 26 — Vienne / Planet Engine — livraison partielle en brouillon

Le dépôt reçoit une première couverture départementale de données réelles : **499 tuiles, 265 communes et 879 255 échantillons d’altitude IGN**. Le streaming, les graphes par mode, une voiture conduisible, la carte locale et le suivi physique du packraft sont intégrés. **La Mission 26 complète n’est pas atteinte** : continuité jouable depuis le pilote, navigations départementales, finesse du relief, transports complets, origine flottante intégrée, budgets et validation perceptive restent ouverts.

Un seul bilan et une seule PR brouillon consolidée. Aucun déploiement, aucune fusion, aucun achat. Les captures de scènes après placement diagnostique ne sont pas présentées comme des traversées du département.

[Galerie et mesures](mission-26-evidence/index.html) · [Architecture / audit](mission-26-architecture.md) · [Données et licences](mission-26-data.md) · [Audit des 499 tuiles](mission-26-evidence/tile-audit.json).

## Base vérifiée et conservation

Les lectures GitHub et Git ont établi :

- Branche par défaut `main`, tête `01e791be64cefae2eb1e90ab465f9bf0b848c33e`, fusion de la PR #36.
- PR #37 fusionnée dans `mission/25-1-voyageur-monde-vivant`, **après** la fusion de #36 dans `main` ; M25.2 n’était donc pas dans cette tête de `main`.
- Base choisie : `5fe6e792f34369926854b649a5b631426b7037c4`, conservant M25.1 et M25.2 ; ancêtre commun avec `main` : `ffbbd765ec75bdcddd0bdb3b58933e46d585b7db`.
- Branche unique `mission/26-vienne-planet-engine`. La PR vers `main` contient par conséquent aussi les acquis M25.2 absents de cette base distante.

La référence M25.2 a été archivée avant modification. **384 tests** et compilation stricts réussis après restauration des dépendances par `npm ci` ; le premier essai sans `polygon-clipping` était une erreur d’environnement, pas une régression du candidat. Le candidat passe **404 tests** et le build TypeScript/Vite. Les journaux finaux et empreintes accompagnent la galerie.

Les données et paquets historiques d’Angles sont conservés. Deux manifestes de décoration déclarent une transformation d’apparence et une empreinte actualisée du matériau ; leurs paquets binaires et ancrages ne changent pas. Les défauts M23, le graphe aquatique coûteux et les ouvrages non vérifiés ne sont pas effacés du bilan.

## Matrice du jalon unique

| Exigence | Statut | Résultat et limite déterminante |
| --- | --- | --- |
| Audit Git, préservation M25.1/M25.2 | Atteint pour la base et les protections contrôlées | Ascendance vérifiée, branche dédiée, référence archivée ; audit de réutilisation des systèmes modifiés, sans certification exhaustive de chaque ancien module. |
| Architecture géographique mondiale | Partiel | Contrats, projections, cache borné, graphes et fixture hors France ; origine flottante testée mais non intégrée à tout le jeu, génération lointaine multirésolution et préparation coopérative incomplètes. |
| Couverture de données de base de la Vienne | Atteint sur l’emprise choisie | 499/499 tuiles, 100 %, zéro `nodata`, 938 raccords sans écart d’échantillon. Emprise géométrique 7 025,633 km² ; finesse nouvelle 128 m, pas 0,5 m. |
| Relief, paysages, bâti et fidélité écologique | Partiel | Relief et vecteurs réels, volumes/essences/densités inférés ; façades, falaises fines, clairières détaillées, ouvrages et habitats régionaux complets non validés. |
| Marche continue entre côtés éloignés / raccord Angles | Non atteint | Admission sur chemins source et terrain chargé ; raccord du terrain fin historique au nouveau relief non fermé. Pas de traversée native départementale démontrée. |
| Voiture conduisible | Partiel | Monter/descendre, inertie, accélération, freinage, recul, balayage de coque, caméra, feux et son existant réutilisé ; longues traversées, échangeurs, manette et matrice native complète non validés. |
| Trafic routier varié et population multimodale | Partiel | Trafic historique conservé, graphes source et agents proches bornés ; trafic départemental varié, priorités, piétons et macro-simulation complète non livrés. |
| Eau départementale / trois longues navigations | Non atteint | Hydrographie importée ; aucune profondeur/hauteur libre inventée. Le suivi demeure limité aux corridors admis du pilote, pas à trois nouvelles rivières. |
| Rail / gares / trains | Partiel | Infrastructure source et simulation régionale/fret bornée, arrêt aux limites et croisements inconnus ; ballast détaillé, exploitation en gare, passages à niveau protégés, embarquement et campagne native non achevés. |
| Aviation / Poitiers-Biard | Partiel | Pistes/aérodromes source, modèle original et trajectoire synthétique continue de décollage/vol/atterrissage ; taxiways opérationnels, plusieurs appareils, audio dédié et film du cycle entier non validés. |
| Carte intégrée | Partiel | Carte locale interactive, position/orientation, échelle, couches, zoom et recentrage ; itinéraires cartographiques, relief ombré détaillé et toutes les couches fines non livrés. |
| Sauvegarde / reprise | Partiel | Position canonique, activité terrestre/voiture et véhicule ; validation du support sans relocalisation cachée. Reprise bateau refusée, état complet camp/inventaire/climat non restauré. |
| Ordinateur / smartphone / budgets | Non atteint pour l’acceptation complète | Vérifications Chromium/SwiftShader et format mobile ; aucun GPU ou téléphone physique attaché. Préparation urbaine peut encore bloquer le thread principal. Cibles 60/30 FPS et régression ≤5 % non validées. |
| Campagne finale native exhaustive | Non atteint | Preuves disponibles et limites dans la galerie ; la matrice de parcours longs, d’angles, de saisons, de profils et d’audio reste incomplète. |

## Les cinq correctifs bloquants

| Défaut | Statut global | Correction et portée de preuve |
| --- | --- | --- |
| A — oiseaux saccadés | Partiel | Position et orientation analytiques à chaque rendu ; ailes sur la même horloge, phases par identité, suppression de l’extrapolation CPU et conservation du propriétaire pendant un vol. Tests de cadences et films disponibles ; séquences complètes proche/lointain/oies/caméra mobile à FPS permettant une revue perceptive non validées. |
| B — tremblement du voyageur | Partiel | Le diagnostic reproduit les pics sur sol parfaitement plat. Le raccord brut entre clé libre et IK, l’allongement excessif avant atterrissage et la disparition de la contrainte de portée au décollage ont été corrigés : trajectoire Hermite, contact par cycle et contrainte commune. Traces de tous les os et tests 30/60/120 Hz/irréguliers ; naturel humain, quatre angles et matrice réelle complète restent à valider. |
| C — popping sur les troncs | Partiel | La réception solaire n’est plus désactivée sur les matériaux de LOD grossier. Le caster canonique ne change pas de géométrie avec la caméra. Pas de suppression générale du feuillage ou de brouillard ajouté ; approches appariées et validation perceptive multi-essences non closes. |
| D — ombres mondiales | Partiel | Projection au texel, profils bornés, vent commun au visible et au caster, mises à jour plus fréquentes et résolution locale accrue. Le coût et la totalité des scènes/saisons ne sont pas validés ; aucun GPU physique ni budget ≤5 % revendiqué. |
| E — suivre la rivière / pagaie / sillage | Partiel | Bouton contextuel, itinéraire sur graphe chargé, commandes du contrôleur existant, arrêt/reprise manuelle et refus conservés. Pose de pagaie partagée avec la poussée, un journal de contacts pour effets/sons, deux sillons discrets et pools bornés. Longues navigations départementales, reprise sauvegardée et filmage complet de tous les cas restent ouverts. |

Les diagnostics numériques [avant](mission-26-evidence/quality-fixes/before-motion-summary.json) / [après](mission-26-evidence/quality-fixes/after-motion-summary.json) et les traces gzip distinguent départ/arrêt, régime établi, appui, vitesse et pose. Un seuil numérique d’angle ou d’appui ne certifie pas un mouvement naturel. Les faibles cadences logicielles ne sont jamais qualifiées de fluides.

Sur le diagnostic **synthétique plat, 60 Hz, 12 s**, après exclusion des deux premières secondes :

| Cas | Pic articulaire avant → après | Dépassements du seuil diagnostique de 12 rad/s avant → après |
| --- | --- | --- |
| Marche 1,45 m/s | 13,15 → 8,98 rad/s | 5 → 0 |
| Course 3,2 m/s | 21,97 → 11,40 rad/s | 207 → 0 |

Ce seuil sert à repérer des discontinuités dans ce test, pas à définir une démarche biologiquement naturelle. Le démarrage de course conserve six dépassements dans les deux premières secondes ; ils ne sont pas effacés du maximum global ni assimilés à un régime établi corrigé sur tous les terrains.

## Géographie réellement préparée

Le relief nouveau échantillonne le service ouvert IGN RGE ALTI en IGN69. Les eaux, routes, bâtiments, rails et aérodromes proviennent d’un extrait OSM traçable. Les bâtiments ont une emprise réelle et une hauteur taguée ou inférée ; les arbres sont générés sur des habitats cartographiés. Les surfaces inconnues ne gagnent pas un droit d’accès par leur simple apparence.

Les kilomètres source, statuts d’éligibilité et échecs d’intégrité sont séparés dans les preuves. Ils ne deviennent pas des kilomètres parcourus. Les ponts/tunnels non vérifiés et les eaux sans corridor admis restent fermés ; aucune téléportation ne termine un trajet interrompu.

L’adaptateur conserve le repère du pilote. Cette compatibilité n’est **pas** présentée comme une exactitude métrique mondiale : l’origine flottante et la migration intégrale des objets/sons/collisions restent à raccorder.

## Tests, navigateur et performances

Les nouveaux tests vérifient projections, datum, rebases atomiques, raccords de grille, corruption/annulation de tuiles, budgets, accès, sens uniques et niveaux, propriétaire partagé, freinage/obstacles, sauvegarde, phase d’oiseaux, contact de pagaie, suivi physique, rail et continuité de vol synthétique. Les anciens tests restent inclus dans `npm test`.

Les scènes de la galerie portent leurs coordonnées, source, profil, date et méthode. Une image de Poitiers après placement de diagnostic prouve le rendu chargé, **pas** une marche Angles → Poitiers. Un fixture synthétique est identifié comme tel. Les vidéos sont des enregistrements natifs du navigateur ; indexation WebM par copie de codecs, originaux et empreintes conservés. Aucun ralenti généré ni interpolation d’images.

**Limites bloquantes de performance :** le plafond de 32 Mio concerne les données décodées, pas toute la mémoire du navigateur. Les lots graphiques et graphes ont un coût supplémentaire. La préparation de scènes urbaines a révélé des blocages, réduits en remplaçant les objets par maison par des buffers regroupés ; le travail n’est pas encore entièrement réparti en tranches. SwiftShader constitue une comparaison logicielle, jamais une validation Android ou GPU physique. Les benchmarks statiques et traces actives doivent être lus séparément ; la matrice combinée demandée n’est pas déclarée atteinte.

## Reproduire et reprendre le travail

```sh
npm ci --cache /workspace/.npm-cache
npm test
npm run build
node scripts/audit-planet.mjs
node scripts/analyze-mission-26-motion.mjs . after
node scripts/build-mission-26.mjs . work/mission-26/compiled
npx vite preview --host 0.0.0.0 --port 5380 --outDir work/mission-26/compiled
# Jeu : /endless-earth/?perf=1&evidence=1
# Galerie : servir le dépôt, puis /docs/mission-26-evidence/index.html
```

Les commandes d’acquisition/régénération sont dans le document de données. Les scripts de capture sont versionnés ; les placements diagnostiques sont antérieurs aux films, les déplacements filmés utilisent les entrées et contrôleurs. Les caches de travail ne sont pas requis par le jeu distribué.

Pour poursuivre l’acceptation : fermer le raccord pilote/département et les appuis/ouvrages, découper les travaux lourds, intégrer l’origine flottante, compléter l’eau départementale et les agents multimodaux, puis réaliser les trajets longs et toute la matrice perceptive sur matériel approprié. Ces points ne sont pas remplacés par la réussite de la couverture ou des tests. **La validation artistique et la fusion restent à la décision du propriétaire ; cette livraison n’annonce pas la mission accomplie.**
