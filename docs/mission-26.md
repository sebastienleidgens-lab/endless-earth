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

La référence M25.2 a été archivée avant modification. **384 tests** et compilation stricts réussis après restauration des dépendances par `npm ci` ; le premier essai sans `polygon-clipping` était une erreur d’environnement, pas une régression du candidat. Le candidat passe **406 tests** et le build TypeScript/Vite. Les journaux finaux et empreintes accompagnent la galerie.

L’[audit de préservation](mission-26-evidence/preservation.json) contrôle 658 fichiers préexistants : 656 sont identiques et deux métadonnées d’apparence changent explicitement ; aucun fichier protégé ne manque et aucun autre changement n’est autorisé. Les données et paquets historiques d’Angles sont conservés. Deux manifestes de décoration déclarent une transformation d’apparence et une empreinte actualisée du matériau ; leurs paquets binaires et ancrages ne changent pas. Les défauts M23, le graphe aquatique coûteux et les ouvrages non vérifiés ne sont pas effacés du bilan. Les [réserves M23](mission-23.md#25-limites-et-tableau-dacceptation), les [acquis M25.1](mission-25-1.md) et les [limites M25.2](mission-25-2.md#sources-et-limites-connues-dettes-ouvertes) restent consultables. En particulier, M23 décrit des bords de Rue du Pont proches de 0,996 m et un micro-vide préexistant près de `x=-37, z=194` ; ces observations historiques ne sont pas déclarées réparées ou nouvellement mesurées ici.

## Matrice du jalon unique

| Exigence | Statut | Résultat et limite déterminante |
| --- | --- | --- |
| Audit Git, préservation M25.1/M25.2 | Atteint pour la base et les protections contrôlées | Ascendance vérifiée, branche dédiée, référence archivée ; audit de réutilisation des systèmes modifiés, sans certification exhaustive de chaque ancien module. |
| Architecture géographique mondiale | Partiel | Contrats, projections, cache borné, graphes et fixture hors France ; origine flottante testée mais non intégrée à tout le jeu, génération lointaine multirésolution et préparation coopérative incomplètes. |
| Couverture de données de base de la Vienne | Atteint sur l’emprise choisie | 499/499 tuiles, 100 %, zéro `nodata`, 938 raccords sans écart d’échantillon. Emprise géométrique 7 025,633 km² ; finesse nouvelle 128 m, pas 0,5 m. |
| Relief, paysages, bâti et fidélité écologique | Partiel | Relief et vecteurs réels, volumes/essences/densités inférés ; façades, falaises fines, clairières détaillées et ouvrages non validés. Végétation départementale simplifiée : parité complète des biomes, saisons, neige et faune non livrée. |
| Marche continue entre côtés éloignés / raccord Angles | Non atteint | Admission sur chemins source et terrain chargé ; raccord du terrain fin historique au nouveau relief non fermé. Pas de traversée native départementale démontrée ; camping hors pilote refusé et parcours de voyage complet non livré. |
| Voiture conduisible | Partiel | Monter/descendre, inertie, accélération, freinage, recul, balayage de coque, caméra, feux et son existant réutilisé. Parcours natif de 1 149,48 m sur une voie OSM, puis sortie et marche ; longues traversées, échangeurs, manette et matrice complète non validés. |
| Trafic routier varié et population multimodale | Partiel | Trafic historique conservé, graphes source et agents proches bornés ; trafic départemental varié, priorités, piétons et macro-simulation complète non livrés. |
| Eau départementale / trois longues navigations | Non atteint | Hydrographie importée ; aucune profondeur/hauteur libre inventée. Le suivi demeure limité aux corridors admis du pilote, pas à trois nouvelles rivières. |
| Rail / gares / trains | Partiel | Infrastructure source et simulation régionale/fret bornée, arrêt aux limites et croisements inconnus ; ballast détaillé, exploitation en gare, passages à niveau protégés, embarquement et campagne native non achevés. |
| Aviation / Poitiers-Biard | Partiel | Pistes/aérodromes source, modèle original et trajectoire synthétique continue de décollage/vol/atterrissage ; taxiways opérationnels, plusieurs appareils, audio dédié et film du cycle entier non validés. |
| Carte intégrée | Partiel | Carte locale interactive, position/orientation, échelle, couches, zoom et recentrage ; itinéraires cartographiques, relief ombré détaillé et toutes les couches fines non livrés. |
| Sauvegarde / reprise | Partiel | Position canonique et activité terrestre/voiture ; validation du support sans relocalisation cachée. Reprise bateau refusée, véhicule stationné et état complet camp/inventaire/climat non restaurés. |
| Ordinateur / smartphone / budgets | Non atteint pour l’acceptation complète | Vérifications Chromium/SwiftShader et format mobile ; aucun GPU ou téléphone physique attaché. Préparation urbaine peut encore bloquer le thread principal. Cibles 60/30 FPS et régression ≤5 % non validées. |
| Campagne finale native exhaustive | Non atteint | Preuves disponibles et limites dans la galerie ; la matrice de parcours longs, d’angles, de saisons, de profils et d’audio reste incomplète. |

## Les cinq correctifs bloquants

| Défaut | Statut global | Correction et portée de preuve |
| --- | --- | --- |
| A — oiseaux saccadés | Partiel | Position et orientation analytiques à chaque rendu ; ailes sur la même horloge, phases par identité, suppression de l’extrapolation CPU et conservation du propriétaire pendant un vol. Tests de cadences et films disponibles ; séquences complètes proche/lointain/oies/caméra mobile à FPS permettant une revue perceptive non validées. |
| B — tremblement du voyageur | Partiel | Le diagnostic reproduit les pics sur sol parfaitement plat. Le raccord brut entre clé libre et IK, l’allongement excessif avant atterrissage et la disparition de la contrainte de portée au décollage ont été corrigés : trajectoire Hermite, contact par cycle et contrainte commune. Traces de tous les os et tests 30/60/120 Hz/irréguliers ; naturel humain, quatre angles et matrice réelle complète restent à valider. |
| C — popping sur les troncs | Partiel | La réception solaire n’est plus désactivée sur les matériaux de LOD grossier. Le caster canonique ne change pas de géométrie avec la caméra. Pas de suppression générale du feuillage ou de brouillard ajouté ; approches appariées et validation perceptive multi-essences non closes. |
| D — ombres mondiales | Partiel | Projection au texel, profils bornés, vent commun au visible et au caster, mises à jour plus fréquentes et résolution locale accrue. Le coût et la totalité des scènes/saisons ne sont pas validés ; aucun GPU physique ni budget ≤5 % revendiqué. |
| E — suivre la rivière / pagaie / sillage | Partiel | Bouton contextuel, itinéraire sur graphe chargé, commandes du contrôleur existant, arrêt/reprise manuelle et refus conservés. Pose de pagaie et immersion de la pale partagées avec la poussée, coque balayée jusqu’aux tubes extérieurs, un journal de contacts pour effets/sons, deux sillons discrets et pools bornés. Longues navigations départementales, reprise sauvegardée et filmage complet de tous les cas restent ouverts. |

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

Les scènes de la galerie portent leurs coordonnées, source, profil, date et méthode. Une image de Poitiers après placement de diagnostic prouve le rendu chargé, **pas** une marche Angles → Poitiers. Un fixture synthétique est identifié comme tel. Les vidéos sont des enregistrements natifs du navigateur ; indexation WebM par copie de codecs, originaux et empreintes conservés. Aucun ralenti généré ni interpolation d’images. Les PNG sont des captures du viewport ; la scène peut y être agrandie par la résolution adaptative du jeu. Les dimensions réellement encodées dans chaque vidéo sont consignées séparément dans le résumé natif.

Les [quatre contrôles d’interface](mission-26-evidence/ui-checks.json) réussissent sans erreur JavaScript : pan/pincement par événements tactiles natifs CDP, carte déjà chargée utilisable hors connexion, sauvegarde/reprise entre deux placements de diagnostic (écart mesuré 0 m), et quatre tuiles synthétiques dans un autre repère avec les mêmes fournisseurs. Le contrôle hors connexion ne couvre pas une première installation sans réseau ; le test tactile n’implique pas un téléphone physique.

Les captures avant/après utilisent les mêmes paramètres de départ, parcours, caméra, date et profil. Leurs pas de temps et leurs commandes de poursuite divergent avec la cadence native : elles ne sont pas des entrées identiques image par image. Les films de marche/course dépassent 183 secondes réelles. Le film after-run compte environ 175,29 s cumulées en activité course et un plus long segment de 83,64 s, d’après les intervalles de télémétrie (frontières incertaines à une image près) : le critère strict de 180 s de course sans transition n’est pas atteint. Leur faible FPS ne ferme pas l’acceptation perceptive ; l’horloge climatique et l’intégration physique bornée sont distinguées dans les mesures. [Résumé des films et distances réellement effectuées](mission-26-evidence/native-summary.json).

Le runtime des films qualité et du premier essai voiture est `990969bd9c718d456c36504a64fcb422cd7b66d4`. La correction suivante `3743d54b840e672cd6fb295c8761ec630b797aa9` ne touche que la coque et l’immersion de la pale du packraft, inactives dans ces films. Les captures de navigation et les derniers contrôles utilisent ce second runtime. Les bundles exécutés, le bundle de référence et leurs empreintes sont archivés dans `mission-26-evidence/builds/` ; les commits ultérieurs de documentation ne sont pas présentés comme déjà filmés. Le correctif de rendu final `0c8f5c9d9306e1ab82a29c06b2a745b00ea6618c` soustrait aussi le pilote des polygones d’eau départementaux. Il est couvert par le nouveau test géométrique, le build, les sondes de propriété et les mesures finales ; les films qualité/navigation restent ceux des versions explicitement indiquées, et ne constituent pas une nouvelle campagne perceptive complète sur cette dernière version.

Le [parcours voiture final](mission-26-evidence/car-native.json) atteint sa destination sur `osm:way:306417557` : **1 149,48 m à l’odomètre du contrôleur**, 1 341 images de télémétrie, aucune erreur JavaScript. L’entrée, les commandes, le freinage, la sortie et les pas suivants sont filmés ; seul le placement initial sur la route est diagnostique et antérieur au film. Le [contrôle source de la coque](mission-26-evidence/car-route-admission.json) couvre séparément 1 156 sondes sur la sous-route choisie ; ce contrôle géométrique ne remplace pas le trajet natif. Le premier départ bloqué et un essai interrompu par une erreur du script de capture restent archivés ; ils ne comptent pas comme trajets réussis.

Les [navigations finales 3](mission-26-evidence/boat-3-native.json) et [5](mission-26-evidence/boat-5-native.json) activent le suivi pendant 125 s réelles chacune, reprennent les commandes manuelles, puis reviennent à pied sans échec de script ni erreur JavaScript. Distances cumulées **en activité bateau** : 88,49 m et 58,52 m, retours inclus ; il ne s’agit pas de la longueur de rivière prévue ni de deux traversées départementales. Les écarts latéraux maximum du contrôleur de suivi sont 0,405 m puis 0,522 m (maximum cumulé dans le même navigateur). Les flux comprennent de l’Opus natif ; aucune écoute perceptive exhaustive n’est déclarée. La résolution adaptative a abaissé les vidéos de navigation à 384 × 252 pixels pour un viewport 640 × 420 ; cadences rendues d’environ 3,58 et 1,55 images/s. Ce sont des preuves fonctionnelles limitées, pas une validation de fluidité ou des longues navigations exigées.

Les cinq placements de communes réussis ont un écart entre hauteur physique et raycast du terrain affiché inférieur à **0,000035 m aux points contrôlés**. Cette mesure ponctuelle n’est ni la précision de la source IGN ni un audit de toute la surface. Le [contrôle final de propriété de l’eau](mission-26-evidence/water-owner.json) ne trouve aucun nouveau plan d’eau départemental sur les 729 rayons intérieurs au pilote ; les 24 sondes extérieures touchent bien les lots départementaux affichés. Douze lots et 442 triangles d’eau sont présents : le résultat n’est pas obtenu en masquant toute la couche. Les sources et supports historiques ne changent pas. Le point choisi à Poitiers-Biard (`46,5863° N`, `0,3067° E`) est refusé faute de route admise à proximité ; aucun placement forcé n’a remplacé ce refus.

**Limites bloquantes de performance :** le plafond de 32 Mio concerne les données décodées, pas toute la mémoire du navigateur. Les lots graphiques et graphes ont un coût supplémentaire. La préparation de scènes urbaines a révélé des blocages, réduits en remplaçant les objets par maison par des buffers regroupés ; le travail n’est pas encore entièrement réparti en tranches. SwiftShader constitue une comparaison logicielle, jamais une validation Android ou GPU physique. Les benchmarks statiques et traces actives doivent être lus séparément ; la matrice combinée demandée n’est pas déclarée atteinte.

Les [rendus statiques](mission-26-evidence/benchmarks.json) et les [séquences actives sans encodage vidéo](mission-26-evidence/active-benchmarks.json) couvrent chacun deux scènes et trois profils, avec référence et candidat séparés. La simulation active garde l’audio, les ombres, le climat, les acteurs et le streaming. Le rendu statique les suspend et mesure render + gl.finish ; ses temps ne sont pas les temps d’une image complète du jeu.

| Profil / scène | Médiane du rendu statique, référence → final | p95 des intervalles d’image actifs, référence → final | Échelle adaptative en fin de séquence, référence → final |
| --- | ---: | ---: | ---: |
| eco / field | 9.30 → 10.05 ms | 2883.1 → 1300.0 ms | 0.94 → 0.88 |
| eco / forest | 3.60 → 6.25 ms | 633.3 → 649.9 ms | 0.82 → 0.76 |
| balanced / field | 5.95 → 7.10 ms | 2316.6 → 2499.9 ms | 0.76 → 0.70 |
| balanced / forest | 3.15 → 6.20 ms | 733.3 → 583.4 ms | 0.66 → 0.66 |
| quality / field | 4.70 → 8.20 ms | 1250.0 → 2866.6 ms | 0.72 → 0.72 |
| quality / forest | 2.20 → 5.50 ms | 750.0 → 750.0 ms | 0.72 → 0.72 |

La résolution adaptative demeure active : même viewport et DPR CSS ne signifient pas même buffer de dessin. Les références statiques ne consignent pas ses dimensions effectives ; ces nombres ne constituent donc pas une comparaison à résolution verrouillée. Les séquences actives ne durent qu’environ 15 s, avec peu d’images dans certains cas ; elles ne permettent ni une conclusion causale par correctif ni une certification matérielle. **Les cibles 60/30 FPS ne sont pas atteintes dans cet environnement logiciel ; le budget relatif complet ≤5 % n’est pas fermé**, avec notamment une dégradation du p95 actif du champ en Qualité. Les acquis et dépassements ponctuels ne sont pas fusionnés en un résultat global favorable. Les mesures de l’itération précédente restent archivées séparément.

## Défauts ouverts et reproduction

| Zone / gravité | Cause constatée ou limite identifiée | Reproduction et conséquence |
| --- | --- | --- |
| Bord du pilote, bloquant | Deux résolutions et propriétaires de support ; aucune couture géométrique validée entre l’ancien relief raffiné et la grille IGN à 128 m. | Aller vers une limite locale `x/z = ±1 000 m` depuis Angles. L’audit des 938 raccords ne porte que sur les nouvelles tuiles. Traversée continue non acceptée. |
| Poitiers et villes denses, bloquant pour le budget | Installation des index/graphes et reconstruction des buffers encore synchrones. Un lot atteint environ 2,06 s dans la campagne de scènes. | Lancer `node scripts/browser-mission-26.mjs`, lire `maxInstallMs` / `maxBatchMs` dans `browser.json`. Le plafond de mémoire des tuiles ne garantit pas le temps par image. |
| Eaux nouvelles, bloquant | Absence de profondeur, de berge vérifiée et de hauteur libre documentée ; le graphe navigable reste celui du pilote. | Hydrographie départementale visible sur la carte ; aucun nouveau corridor n’est ouvert automatiquement. Trois longues navigations nouvelles non livrées. |
| Pilote aquatique, majeur historique | Préparation coopérative des accès et du graphe coûteuse, même sans navigation active. | Les deux premiers essais atteignent le délai de 240 s sans graphe prêt. Résultats conservés ; reprise des essais avec rendu suspendu pendant la seule préparation, avant film. Ce procédé ne valide pas la latence interactive. |
| Voiture, majeur pour les longs parcours | Premier départ à une jonction, orientation fournie par une autre voie proche ; la coque rencontre un refus. | `car-attempt-1/` conserve le film et sa trace. Le scénario suivant part à l’intérieur de la voie source, dans son orientation ; aucune collision n’est désactivée. Une longueur source n’est jamais comptée comme parcourue. |
| Monde / origine, majeur | Contrat de rebase testé séparément ; objets historiques, sons et collisions non migrés ensemble dans le jeu. | `metrics.floatingOrigin` annonce explicitement le repère adapté. Pas de démonstration à grande distance mondiale ni de garantie Float32 planétaire. |
| Art et matériel, bloquant pour l’acceptation | Relief grossier, végétation régionale et bâti simplifiés ; aucun GPU/téléphone physique disponible. | Galerie, profils et traces SwiftShader. Naturel du voyageur, oies, saisons, ombres multi-essences, 60/30 FPS et régression ≤5 % restent à examiner. |

Les anciens défauts et restrictions M23/M25 figurent toujours dans les rapports historiques. Le présent bilan n’efface aucun trou de support ni ouvrage invalide pour obtenir un film réussi.

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

Pour la galerie seule : lancer `python -m http.server 8080 --bind 127.0.0.1` à la racine du dépôt et ouvrir `http://127.0.0.1:8080/docs/mission-26-evidence/index.html`. Les anciens stages de capture qui retournent un code 0 indiquent la production d’un résultat, pas sa réussite fonctionnelle : les champs `failure`, `routeCompleted` et les erreurs de chaque scénario font foi. Les commandes d’acquisition/régénération sont dans le document de données. Les scripts de capture sont versionnés ; les placements diagnostiques sont antérieurs aux films, les déplacements filmés utilisent les entrées et contrôleurs. Les caches de travail ne sont pas requis par le jeu distribué.

Pour poursuivre l’acceptation : fermer le raccord pilote/département et les appuis/ouvrages, découper les travaux lourds, intégrer l’origine flottante, compléter l’eau départementale et les agents multimodaux, puis réaliser les trajets longs et toute la matrice perceptive sur matériel approprié. Ces points ne sont pas remplacés par la réussite de la couverture ou des tests. **La validation artistique et la fusion restent à la décision du propriétaire ; cette livraison n’annonce pas la mission accomplie.**
