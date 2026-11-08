# Mission 05 — Les villages prennent vie

## Dernière passe avant fusion — optimisation de la PR #9

Cette section décrit l'état optimisé ; la livraison initiale est conservée plus bas comme historique. Même branche, même PR, aucune fusion ni déploiement. Référence de cette passe : `031f3b60808ccf8ebe7004308a3c932b106fb28a`. Une nouvelle série de six captures a été réalisée sur cette référence avant toute modification, puis sur la version optimisée, avec les mêmes paramètres que la Mission 04.

### Changements retenus

Les volumes, les toits, les découpes des baies et leurs tableaux restent générés immédiatement. Les 10 723 ouvertures ne sont pas remplacées par des textures. Les détails fins sont extraits en recettes déterministes par cellule de 128 m : au chargement, aucun buffer de volets, petits bois, jardinières ou grimpantes éloignés n'est créé. À l'approche, au plus une cellule est construite par mise à jour LOD (environ 4 Hz), en priorité la plus proche. Un même lot reste réutilisé au repos. Douze cellules invisibles au maximum sont gardées en cache ; au-delà, les plus éloignées libèrent leur géométrie. Les cellules visibles sont toujours conservées, même si leur nombre dépasse douze. Les recettes CPU restent attachées à leur groupe géographique et disparaissent avec lui.

Un panneau quadrilatère partage désormais ses quatre sommets au lieu de dupliquer six sommets. Positions, couleurs, UV utiles et triangles sont conservés ; les normales sont recalculées avec les sommets indexés. Les UV inutilisés du matériau uni sont omis. À proximité, les fonds/tableaux des ouvertures et les détails fins partagent un lot de même matériau ; le lot grossier est alors masqué. Cela économise un appel par cellule concernée, sans regrouper toute la ville dans une géométrie unique. Le lot grossier reste en mémoire pour revenir instantanément au LOD lointain ; cette duplication est incluse dans les mesures.

Je n'ai pas supprimé indistinctement les murs mitoyens : des hauteurs et plans voisins différents peuvent laisser apparaître leur partie supérieure. Les silhouettes, pignons, cheminées et baies restent identiques. Pas de quantification des positions/couleurs, pas de nouvel atlas, worker ou changement de collision, navigation, caméra ou contrôleur de promenade.

### Mesures comparables

Les captures comparatives sont exécutées seules sous Chromium/ANGLE/SwiftShader, 1 000 × 720 puis 390 × 844, même ratio de pixels et même séquence Qualité/Éco. Les positions, yaw, zoom et caméra convergée sont contrôlés contre la Mission 04. Les triangles dessinés et appels concernent la scène entière ; triangles conservés et Mo concernent seulement les buffers architecturaux, y compris les lots cachés. Les Mo sont décimaux, somme des attributs typés et index : ils ne mesurent ni le tas JS des recettes/copies CPU, ni la mémoire interne du pilote GPU.

| Vue | Appels PR → optimisé | Triangles dessinés (identiques) | Triangles conservés PR → optimisé | Tampons Mo PR → optimisé | FPS logiciel PR → optimisé |
| --- | ---: | ---: | ---: | ---: | ---: |
| rue | 154 → 149 | 399 027 | 458165 → 329211 | 60.48 → 27.62 | 3 → 2 |
| troisieme | 155 → 150 | 399 823 | 458165 → 329211 | 60.48 → 27.62 | 4 → 4 |
| aerienne | 272 → 268 | 330 420 | 458165 → 386553 | 60.48 → 32.09 | 5 → 4 |
| toitures | 254 → 250 | 329 768 | 458165 → 386553 | 60.48 → 32.09 | 6 → 5 |
| eco | 251 → 250 | 298 508 | 458165 → 386553 | 60.48 → 32.09 | 5 → 6 |
| mobile | 180 → 179 | 274 982 | 458165 → 386553 | 60.48 → 32.09 | 10 → 8 |


Tous les nombres de triangles **dessinés** correspondent exactement à ceux de la PR avant optimisation. Le gain porte sur le travail différé, les sommets partagés, les buffers conservés et quelques appels, plutôt que sur une simplification des maisons. Les tampons architecturaux diminuent de **54,3 % en rue** et **46,9 % après les vues aériennes** ; les triangles conservés diminuent respectivement de **28,1 %** et **15,6 %**. Après cette séquence, seules 14 cellules de détail sur les 67 éligibles ont été construites, contre les 67 auparavant (69 cellules géographiques au total). 266 à 272 meshes sont conservés, contre 325.

L'appel synchrone complet `renderGeoFeatures`, sur les mêmes données IGN/OSM, passe de **884,7 à 589,1 ms** dans cette nouvelle paire d'échantillons (−33,4 %). Sa fenêtre architecturale passe de **716,5 à 433,7 ms**. Ce n'est pas une médiane. Les détails ne sont pas gratuits : les premières huit cellules ont ensuite coûté **124,4 ms cumulées** ; les quatorze de la séquence, **149,9 ms**, réparties sur les mises à jour. Les chiffres de génération différée proviennent de la scène affichée, les temps synchrones du second appel instrumenté ; ils ne doivent pas être additionnés comme une mesure unique de chargement. À froid, le groupe architectural compte **190 095 triangles et 258 meshes**, contre **458 165 triangles et 325 meshes** sur la référence actuelle de PR. Le compte géométrique du groupe géographique complet, instances d’arbres comprises, passe initialement de 698 400 à 430 330 triangles ; ce compte logique n’est pas la taille des buffers uniques des instances. Le champ `generation.bytes` est une somme par mesh et peut recompter les géométries végétales partagées : les comparaisons mémoire ci-dessus utilisent exclusivement `architectureMemory`, dont les géométries sont distinctes.

Les FPS affichés sont ceux de la dernière seconde, arrondis, et restent variables : **aucun gain de FPS n'est établi**. Plusieurs vues sont même plus lentes dans ces échantillons. L'optimisation est retenue pour ses gains mesurés de génération et de ressources sans différence artistique sensible observée, pas pour promettre une amélioration de débit. Aucun résultat sur GPU matériel ou Android physique.

Relevés : [référence PR](mission-05-captures/pr-initial-measurements.json), [mémoire référence](mission-05-captures/pr-initial-memory.json), [optimisé](mission-05-captures/optimized-measurements.json), [comparaison structurée](mission-05-captures/optimization-comparison.json).

### Comparaisons artistiques

| Vue | Mission 04 | PR #9 avant optimisation | Version optimisée |
| --- | --- | --- | --- |
| Rue, Qualité | [Avant](mission-05-captures/before-rue.png) | [PR actuelle](mission-05-captures/pr-initial-rue.png) | [Optimisé](mission-05-captures/optimized-rue.png) |
| Troisième personne éloignée | [Avant](mission-05-captures/before-troisieme.png) | [PR actuelle](mission-05-captures/pr-initial-troisieme.png) | [Optimisé](mission-05-captures/optimized-troisieme.png) |
| Aérienne, Qualité | [Avant](mission-05-captures/before-aerienne.png) | [PR actuelle](mission-05-captures/pr-initial-aerienne.png) | [Optimisé](mission-05-captures/optimized-aerienne.png) |
| Toitures, Qualité | [Avant](mission-05-captures/before-toitures.png) | [PR actuelle](mission-05-captures/pr-initial-toitures.png) | [Optimisé](mission-05-captures/optimized-toitures.png) |
| Toitures, Éco | [Avant](mission-05-captures/before-eco.png) | [PR actuelle](mission-05-captures/pr-initial-eco.png) | [Optimisé](mission-05-captures/optimized-eco.png) |
| Mobile, Éco | [Avant](mission-05-captures/before-mobile.png) | [PR actuelle](mission-05-captures/pr-initial-mobile.png) | [Optimisé](mission-05-captures/optimized-mobile.png) |

Les façades proches, baies, volets, pignons, silhouettes de toitures et matériaux ont été inspectés sur les captures comparées. Aucun appauvrissement sensible constaté dans les vues inspectées. Le soleil et le vivant continuent d'évoluer : ce n'est pas une comparaison d'un monde figé pixel à pixel. À titre de contrôle complémentaire, la différence absolue moyenne par canal (échelle 0–255) est comprise entre 0,000085 et 0,0891 sur les six images PR/optimisé ; [relevé](mission-05-captures/optimization-image-differences.json). Ce faible écart appuie l'inspection visuelle sans la remplacer.

### Compromis et contrôles

Le détail apparaît progressivement à l'approche et après un saut de caméra. La limite est une cellule par mise à jour, pas un budget strict en millisecondes : une cellule dense peut encore provoquer un pic. Les 65 images d'attente par capture permettent la convergence, et ne démontrent pas une absence de transition au premier affichage. Une cellule sortie du cache devra être reconstruite lors d'une visite ultérieure. Les recettes et les tableaux grossiers retenus ont un coût CPU non couvert par la seule mesure de buffers. La génération de la coque reste synchrone ; elle est allégée, pas rendue entièrement asynchrone.

`npm test` : **49 tests réussis**, avec vérification des buffers indexés, de l'enveloppe des **921 bâtiments** (détails matérialisés compris), absence de buffers décoratifs au loin, construction unique au repos et éviction bornée du cache. `npm run build` : réussi, avertissement de taille existant, bundle d'environ 578 ko / 156 ko gzip. Les statistiques `architecture` décrivent la construction initiale stable ; `architectureMemory` expose séparément la résidence et les constructions/évictions de détail.

Les 917 bâtiments et 458 085 triangles du premier rapport précédaient la correction des empreintes minuscules. Cette correction faisait déjà partie du commit de référence de la PR : elle ajoute quatre petits volumes et 80 triangles, d'où **921 bâtiments et 458 165 triangles** avant cette optimisation. L'ancienne phrase affirmant que cette correction ne changeait pas le corpus était inexacte ; cette nouvelle référence et les relevés la corrigent.

`node scripts/browser-architecture.mjs optimized` : six captures réussies, paramètres vérifiés contre Mission 04 et contre la référence de PR. Pour refaire la référence de PR, servir le commit `031f3b6` et lancer le script de cette branche avec `TEST_URL=... node scripts/browser-architecture.mjs pr-initial`, avant de relancer `optimized` sur la version courante.

`node scripts/browser-promenade.mjs` : **450,000 m réellement parcourus en 383,047 s (6 min 23 s), 1 917 images**, arrêt normal à destination, sans accélération ni navigateur concurrent. Les 939 sommets / 918 segments et le trajet de 450 m sont conservés. Les statistiques de construction initiale des bâtiments restent identiques à l'arrivée, `builds: 1` ; les constructions de détails à l'approche sont attendues et distinctes. Le relevé à environ 1 Hz donne 449,684 m, légèrement inférieur à la distance cumulée à chaque image. Environ 5,00 images/s moyennes sous SwiftShader sur cette marche. La durée historique de 485 s comprenait des tests concurrents : on ne peut pas attribuer toute la différence à l'optimisation.

Preuves : [mesure du trajet](mission-05-captures/optimized-promenade-measurement.json), [rue en promenade](mission-05-captures/optimized-promenade-rue.png), [paysage](mission-05-captures/optimized-promenade-paysage.png), [arrivée mobile](mission-05-captures/optimized-promenade-arrivee.png).

Les scénarios `npm run test:browser`, `browser-camera.mjs`, `browser-safety.mjs` et `browser-living.mjs` ont tous été relancés séquentiellement après la marche : **réussis**. Déplacement et repos, trois vues, garde au sol, zoom et pincement, recentrage et rétraction caméra, obstacles injectés après le départ, son (six cycles et douze bascules rapides), mobile et absence d'erreurs JavaScript/HTTP. Aucun changement des modules de navigation ou de collisions. [Résumé de validation](mission-05-captures/optimization-validation.json).

---

## Livraison initiale — historique des mesures et choix artistiques


Branche `mission/05-villages-prennent-vie`, créée depuis `origin/main` au commit **60c39212025a9c44a14be9afb50937d18d7bc452**. La fusion de la [Mission 04, PR #8](https://github.com/sebastienleidgens-lab/endless-earth/pull/8) a été vérifiée par l'historique Git et les métadonnées GitHub (`merged: true`). Aucun déploiement ni fusion demandé pour cette mission.

## Du plan OSM à la maison

Les bâtiments enrichis sont les polygones OSM déjà chargés dans le monde. Aucun bâtiment fictif, aucune liste de maisons particulière au village et aucune coordonnée locale dans le générateur. Les ruines et remparts gardent leur rendu spécifique. Les données géographiques et leurs licences OSM/IGN restent celles des missions précédentes.

Trois couches distinctes :

- `src/architecture/style.mjs` : configuration **Poitou v1**, palette calcaire/enduit, terres cuites, bois et volets sourds, proportions, pentes et distances de détail. Les autres régions ne sont pas développées.
- `src/architecture/plan.mjs` : reconstruction déterministe indépendante de Three.js. Empreinte canonique, identifiant OSM comme graine, hauteur, étages, plans de toiture, baies et ancrages de portes fermées. Les variantes survivent au rechargement, à l'ordre de chargement et au changement de premier sommet/sens du contour.
- `src/architecture/render.ts` : découpe géométrique, matériaux mutualisés, regroupement spatial et LOD. `geodata.ts` adapte seulement OSM et le relief à cette interface.

Les ouvertures sont réellement découpées dans les parois : tableaux de 18 cm, vitrage sombre opaque, petits bois, encadrements clairs, volets dans les tableaux, porte à planches et poignée. Certaines fenêtres reçoivent une jardinière et une petite grimpante dans l'embrasure. Les seuils restent dans l'épaisseur du bâtiment. Trois textures procédurales de 128 × 128 pixels, répétées à une échelle métrique, apportent pierre, enduit patiné et tuiles ; elles sont originales et n'impliquent aucune nouvelle licence d'images.

Les toitures sont triangulées puis découpées suivant leurs plans. Cette méthode fonctionne aussi sur des empreintes concaves et conserve les cours intérieures. Pignons et parois des cours rejoignent les toits. Toits à deux pans, plats, en croupe et pyramidaux sont prévus ; une forme explicitement inconnue reste plate et est signalée comme approximation. Des cheminées peu nombreuses sont placées sur une zone intérieure validée, sans dépasser la hauteur maximale du plan.

`height`, `building:levels`, `roof:height`, `roof:levels`, `roof:angle`, `roof:shape`, `roof:material` et `building:material` sont utilisés lorsqu'ils sont exploitables. `height` est traité comme hauteur totale au-dessus du point le plus haut du contour, toiture comprise ; une hauteur de toiture incompatible est bornée pour garder une paroi valide. Sans hauteur : estimation de 7,2 à 8,34 m pour les maisons et 3,4 m pour les petites dépendances identifiées. Les fondations descendent jusqu'au point bas du contour. Les portes échantillonnent leur propre altitude de terrain et les fenêtres enfouies sont supprimées.

Ces façades sont **une interprétation régionale procédurale**, pas une restitution des façades réelles. Les champs `inferred` du plan distinguent les estimations ; les compteurs d'exécution donnent leur quantité. Les ancrages de portes, associés à l'identifiant du bâtiment dans `architectureAnchors`, préparent de futures interactions ; ils restent `interactive: false`. Aucun intérieur, PNJ, commerce ou nouveau droit d'accès.

## Enveloppe et déplacements

Les ornements restent à l'intérieur des empreintes. Pas de débord de toiture, de volet ouvert sur la rue, de marche ajoutée au chemin ni d'annexe inventée. Le contrôle géométrique parcourt les sommets décoratifs des **917 bâtiments OSM traités**. Il complète les fixtures concaves et les tests de cours intérieures. Les contours partagés exactement sont privés d'ouvertures ; les contacts partiels non concordants ne sont pas reconstruits topologiquement.

Les modules de collisions, de navigation, de marche et de calcul caméra ne changent pas. Une porte décorative ne rend donc jamais une maison traversable. Le changement de volume vertical visuel n'élargit pas les restrictions de déplacement existantes.

## Rendu et coût

Quatre matériaux partagés pour toute la famille régionale, trois petites textures ; couleurs par sommet. Les surfaces sont regroupées par matériau et cellules de 128 m. Le détail fin est un lot distinct : distance à la cellule de 125 m en Qualité et 65 m en Éco, avec 12 m d'hystérésis. La silhouette, la toiture et les fonds sombres des baies restent présents au loin. Les filtres mipmap limitent les motifs scintillants ; aucune transparence concurrente.

La génération est faite une fois par groupe chargé. Les mises à jour à environ 4 Hz ne modifient que la visibilité des lots ; aucun matériau, triangle ou objet n'est reconstruit à chaque image. Les buffers temporaires sont libérés après la constitution des lots. Le déchargement des tuiles libère leurs géométries et conserve les matériaux architecturaux partagés pour les autres tuiles. Le chargement synchrone conserve le décor de secours existant ; le coût supplémentaire de génération est explicité ci-dessous, sans promettre une absence de coût.

Mesures prises sous **Chromium / ANGLE / SwiftShader Device (Subzero)**, sans autre scénario navigateur concurrent pendant les captures comparatives. Viewport 1 000 × 720, ratio de pixels 1,0 ; mobile 390 × 844. Les compteurs correspondent à la scène entière, végétation et terrain compris.

| Point de vue | Draw calls avant → après | Triangles avant → après | FPS logiciel observé avant → après |
| --- | ---: | ---: | ---: |
| Rue, Qualité | 99 → 154 | 306 085 → 398 987 | 5 → 4 |
| Troisième personne éloignée, Qualité | 98 → 155 | 306 085 → 399 783 | 5 → 3 |
| Aérienne, Qualité | 236 → 272 | 276 573 → 330 366 | 6 → 4 |
| Toitures, Qualité | 229 → 254 | 276 489 → 329 728 | 8 → 5 |
| Toitures, Éco | 229 → 251 | 273 897 → 298 468 | 8 → 6 |
| Mobile, Éco | 171 → 180 | 273 201 → 274 942 | 12 → 8 |

Les FPS sont des valeurs arrondies sur la dernière seconde, pas un benchmark statistique. **Une régression du débit logiciel est observée**, et le détail supplémentaire a un coût réel : +30 % de triangles dans la rue en Qualité, +9 % en vue Éco aérienne, +0,6 % en mobile Éco. Ces valeurs ne décrivent pas un GPU matériel ni un téléphone Android. Aucun objectif de FPS matériel n'a été validé.

La génération synchrone de la géographie entière, mesurée par le même appel `renderGeoFeatures` sur les mêmes données IGN/OSM, passe de **312,2 à 758,6 ms** dans cet échantillon. La fenêtre instrumentée du lot architectural représente **531,9 ms** ; elle inclut la boucle des autres objets géographiques hors arbres, et ne prétend donc pas isoler exclusivement les calculs de façade. Le chargement effectif initial a relevé **363,2 ms** pour l'architecture ; caches et compilation rendent ces valeurs variables. Il s'agit d'un échantillon isolé par version, pas d'une médiane. Le coût supplémentaire de génération doit encore être réduit avant un changement d'échelle.

Le groupe architectural contient **917 bâtiments**, dont **916 hauteurs estimées**, **10 723 baies**, **69 cellules**, **325 lots** et **458 085 triangles générés**, détails lointains compris. Ce total généré n'est pas le total dessiné à chaque image. Le groupe de géographie entier contient 698 320 triangles générés, contre 275 409 auparavant. Les détails constituent donc aussi un coût mémoire, même lorsqu'ils sont masqués. Trois textures GPU sont partagées ; aucune nouvelle dépendance de production. Bundle Vite final : environ **576 ko** non compressés / **155 ko** gzip, avertissement de taille existant conservé.

Relevés structurés : [avant](mission-05-captures/before-measurements.json), [après](mission-05-captures/after-measurements.json), [comparaison](mission-05-captures/comparison.json).

## Vérifications

- `npm test` : **48 tests réussis**, dont dix nouveaux scénarios sur le plan architectural et la géométrie réellement produite. Déterminisme, styles, dimensions, seuils sur pente, murs partagés, ouvertures, toits, cours intérieures, triangles non dégénérés, enveloppe des 917 bâtiments, maintien des minuscules volumes cartographiés, LOD et stabilité des buffers.
- `npm run build` : **réussi**.
- `npm run test:architecture` : **réussi**, six paires de captures, mêmes positions et angles vérifiés, profils Qualité/Éco, viewport mobile, aucun rebuild lors des changements de vue, aucune erreur JavaScript.
- `npm run test:browser` : **réussi**, chargement, trois vues, déplacement, stabilité au repos, garde au sol, son, profil et mobile.
- `node scripts/browser-camera.mjs` : **réussi**, zoom mémorisé, glissement, recentrage différé et rétraction devant mur OSM.

- `node scripts/browser-safety.mjs` : **réussi**, obstacles injectés après le départ : bâtiment, voie privée, eau, mur et ruine ; arrêt sûr, positions échantillonnées autorisées.
- `node scripts/browser-living.mjs` : **réussi**, marche, reprise manuelle, vues, mobile et audio (six cycles et douze bascules rapides, un contexte et deux sources d'ambiance), sans erreur JavaScript ni HTTP.

Captures inspectées pendant le trajet : [première rue](mission-05-captures/promenade-echantillon-60.png), [baies, portes et jardinières](mission-05-captures/promenade-echantillon-180.png), [sortie de rue](mission-05-captures/promenade-echantillon-240.png), [descente et paysage](mission-05-captures/promenade-echantillon-360.png). Les numéros désignent des échantillons du scénario, pas des horodatages exacts.

- `node scripts/browser-promenade.mjs` : **réussi**, graphe réel de 939 sommets / 918 segments, zoom, pincement tactile CDP, rotation, trois vues, arrivée et mobile. **450,000 m réellement parcourus en 485,007 s (8 min 05 s), 1 900 images rendues**, sans accélération du temps. Le chronomètre externe donne 485,533 s ; le relevé à environ 1 Hz donne 449,755 m et sous-estime légèrement les angles. Arrêt normal « Fin du parcours OSM validé ». Les statistiques architecturales restent strictement identiques du début à la fin, `builds: 1`.

La Mission 04 avait mesuré 414,438 s sous SwiftShader. Le nouvel essai a partagé le moteur logiciel avec les contrôles navigateur courts pendant environ les trois premières minutes ; la comparaison de durée ne permet donc pas d'isoler le coût de l'architecture. Le plafonnement existant du delta à 250 ms ralentit la simulation sous forte charge ; il n'a pas été modifié. Moyenne du nouvel essai : environ **3,92 images/s** sur 485 s ; arrivée mobile : 6 FPS / 92 draw calls / 293 739 triangles. Les mesures stationnaires comparatives ci-dessus ont été réalisées sans cette concurrence.

Preuves : [mesure de la promenade](mission-05-captures/promenade-measurement.json), [arrivée mobile](mission-05-captures/promenade-arrivee-mobile.png). `node scripts/browser-architecture-motion.mjs` : **réussi**, vidéo de **39,92 s** comprenant le chargement, rotations des façades et du village, dix captures et compteur de génération stable. Inspection des dix captures et d'une planche extraite de la vidéo à une image toutes les quatre secondes : pas de toit détaché, de passage de baie dans un angle ni de scintillement évident dans ces échantillons. Cette inspection échantillonnée ne vaut pas une lecture exhaustive image par image ni une garantie sur toutes les rues. Les textures répétées et certaines longues trames de fenêtres restent perceptibles ; aucune répétition de maison complète indépendante des empreintes n'est ajoutée. [Rotation proche](mission-05-captures/rotation-facade.png), [rotation des toitures](mission-05-captures/rotation-toitures.png). Vidéo et images intermédiaires conservées dans `work/architecture-motion/`.

Un dernier test des empreintes minuscules a renforcé leur traitement : volume conservé pour éviter un obstacle cartographié invisible, détails supprimés sous 40 cm de largeur. Cette correction ajoute quatre petits volumes au rendu : les captures et la promenade historiques ci-dessus précèdent leur ajout. La nouvelle série `pr-initial` de la dernière passe intègre les 921 bâtiments et sert de référence correcte à l'optimisation. Les 48 tests et la compilation ont été relancés après cette correction.

## Reproduire les contrôles

`npm ci`, puis `npm test` et `npm run build`. Démarrer `npm run dev` avant les scénarios Playwright ; ils utilisent le Chromium système `/usr/bin/chromium`. `npm run test:architecture` compare le code courant à la référence Mission 04 versionnée dans le dépôt. Pour refaire la référence, servir séparément le commit `60c3921`, puis exécuter le script de cette branche avec `TEST_URL=http://localhost:PORT/endless-earth/?perf=1 node scripts/browser-architecture.mjs before`. Relancer ensuite `after` contre la Mission 05. Ne pas générer `before` depuis un serveur Mission 05.

Scénarios complémentaires : `npm run test:browser`, `node scripts/browser-camera.mjs`, `node scripts/browser-safety.mjs`, `node scripts/browser-living.mjs`, `node scripts/browser-promenade.mjs`. Le dernier mesure une vraie marche jusqu'à l'arrivée et peut prendre plusieurs minutes sur SwiftShader. Les captures de travail de cette marche sont dans `work/visual/mission04/` pour conserver la compatibilité du scénario existant ; les preuves retenues sont recopiées ci-dessous dans le dossier de Mission 05.

Le scénario `node scripts/browser-architecture-motion.mjs` enregistre les rotations de façade/toiture et dix images dans `work/architecture-motion/`. Il nécessite le binaire ffmpeg de Playwright, installable avec `npx playwright install ffmpeg`. Dans cet environnement, le ffmpeg système existant est exposé par un lien dans un cache local de travail, avec `PLAYWRIGHT_BROWSERS_PATH=.../work/browser-cache` ; aucune dépendance vidéo ne rejoint le bundle du jeu.

## Comparaison artistique

Les paires ci-dessous sont prises au même point géographique, avec les mêmes orientation, zoom, viewport et profil. Le scénario vérifie automatiquement ces paramètres, ainsi que la position caméra à 2,5 cm près après convergence. Le soleil et le vivant continuent leur animation ; il ne s'agit pas d'une comparaison pixel à pixel d'un monde figé.

| Vue | Mission 04 | Mission 05 |
| --- | --- | --- |
| Façades à pied, Qualité | [Avant](mission-05-captures/before-rue.png) | [Après](mission-05-captures/after-rue.png) |
| Troisième personne éloignée | [Avant](mission-05-captures/before-troisieme.png) | [Après](mission-05-captures/after-troisieme.png) |
| Village aérien | [Avant](mission-05-captures/before-aerienne.png) | [Après](mission-05-captures/after-aerienne.png) |
| Toitures rapprochées | [Avant](mission-05-captures/before-toitures.png) | [Après](mission-05-captures/after-toitures.png) |
| Profil Éco | [Avant](mission-05-captures/before-eco.png) | [Après](mission-05-captures/after-eco.png) |
| Mobile 390 × 844, Éco | [Avant](mission-05-captures/before-mobile.png) | [Après](mission-05-captures/after-mobile.png) |

L'inspection a conduit à deux corrections artistiques : réduire le contraste des joints qui produisait un effet de papier peint, et donner deux niveaux d'ouvertures aux maisons dont la hauteur le permet. Les différences les plus lisibles sont la continuité des toits sur les plans irréguliers, les pignons, la profondeur des baies, les boiseries et l'alternance mesurée pierre/enduit. La scène conserve un langage stylisé ; elle ne constitue pas un rendu photoréaliste abouti.

## Limites et approximations

La quasi-totalité des hauteurs et toutes les ouvertures sont estimées dans cette zone ; aucun relevé de façade n'est disponible. Les fenêtres suivent une trame régulière variée par bâtiment, qui reste perceptible dans certaines longues façades. Le plan de toit d'une forme complexe est une reconstruction par plans découpés et peut différer de sa charpente réelle. Les cheminées sont illustratives. Les grimpantes sont de petits éléments dans les embrasures, sans simulation botanique.

Les fondations et les portes dépendent du DEM IGN à 10 m, insuffisant pour connaître chaque seuil réel ; les soubassements peuvent paraître hauts sur les fortes pentes. Les empreintes dégénérées sont écartées. Les très petits bâtiments conservent un volume visible ; les empreintes de moins de 40 cm de largeur ne reçoivent aucune baie en retrait, afin de ne pas créer de décor hors enveloppe. Pas de nouveaux escaliers ou annexes hors de l'empreinte : leur accès demanderait une modification explicite des collisions.

Les cellules de détail sont chargées entièrement, et le LOD est une coupure avec hystérésis, pas une transition progressive par bâtiment. Le pilote conserve le chargement géographique existant ; une couverture nationale nécessitera une génération asynchrone et des budgets/cache par tuile plus élaborés. Les tests d'enveloppe réels utilisent un terrain plat pour isoler les coordonnées horizontales ; les pentes et seuils sont couverts séparément et par l'inspection dans le monde IGN.

Android physique, GPU matériel et exploration exhaustive de toutes les rues non testés. Les captures et séquences inspectées ne prouvent pas l'absence de défaut sur toute la carte. Les résultats SwiftShader sont ceux d'un moteur logiciel et ne sont jamais extrapolés à un GPU matériel.
