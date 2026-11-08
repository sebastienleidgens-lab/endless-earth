# Mission 01 — première promenade (socle, validation partielle)

## Résultat livré

Branche `mission/01-premiere-promenade`, base `4ff1653`. Le moteur Three.js/Vite est conservé.

- Marche à 1,45 m/s, course Shift à 3,2 m/s, ZQSD/WASD/flèches et joystick préservés. Direction corrigée pour avancer vers le regard. Diagonales normalisées et déplacement en mètres/seconde. Le delta est plafonné à 250 ms pour ne pas téléporter après une suspension ; au-dessous de 4 FPS la simulation ralentit volontairement.
- Trois vues par V et bouton : première personne à 1,65 m, troisième personne, aérienne. Orientation horizontale libre, inclinaison bornée pour le confort, zoom amorti. Première personne directement attachée aux pieds pour éviter le retard de caméra dans un mur.
- Personnage original construit en primitives, environ 1,83 m, palette douce, bras/jambes animés selon la distance parcourue, retour au repos et orientation progressive. Invisible en première personne. Aucun modèle externe.
- Corps de rayon 30 cm contre les polygones de bâtiments ; sous-pas de 10 cm et glissement par axes. Grille spatiale de 20 m calculée une fois pour limiter les recherches.
- Appui sur l'échantillonnage triangulé IGN existant. Pente maximale absolue de 0,7 (environ 35°), en montée comme en descente ; limites du DEM bloquantes. Départ recherché dans un endroit libre et localement peu pentu. En `?tiles=1`, déplacement bloqué tant que relief et géographie ne sont pas prêts.
- Caméra troisième personne : balayage du bras tous les 15 cm contre bâtiments et terrain, rétraction immédiate avant un obstacle ; réextension par zoom amorti. Les bâtiments sont traités comme des colonnes conservatrices, même au-dessus du toit.
- Deux qualités : ratio pixels 1 ou 1,6 maximum ; ombres désactivées en éco. Choix après six secondes mesurées de géographie prête (seuil 45 FPS), commande manuelle. Le mode OSM conserve ses ombres désactivées dans les deux qualités.
- Architecture sonore minimale : vent synthétisé original filtré, boucle déterministe, activation explicite, fondu et suspension en arrière-plan. Ce son n'est pas un enregistrement d'Angles-sur-l'Anglin.
- Diagnostics FPS corrigés : mesure du temps réel écoulé, auparavant artificiellement gonflée par le plafonnement du delta de simulation. Position, mode et disponibilité de la géographie exposés uniquement avec `perf=1` pour les contrôles navigateur.

## Validation exécutée

État initial : 11 tests, compilation réussie. Après modification : 17 tests passent avec `npm test`, et `npm run build` réussit. Avertissement Vite conservé : bundle supérieur à 500 ko (environ 560 ko, 148 ko gzip).

Six nouveaux tests couvrent vitesse et direction, diagonales et temps, cycle des vues, rayon/polygones, traversée et glissement, pentes dans les deux sens et données absentes, ainsi que rétraction caméra devant murs/relief/couverture absente.

Test intégré reproductible : lancer `npm run dev -- --port 5173`, puis `npm run test:browser`. Chromium installé attendu dans `/usr/bin/chromium` (ou `CHROMIUM_PATH`). Le script charge `?tiles=1&perf=1`, vérifie le chargement des données, le cycle des vues et la visibilité du personnage, un déplacement réel, la hauteur des yeux, l'activation sonore et le réglage qualité. Il prend des captures aérienne, troisième personne, première personne et viewport mobile dans `work/visual/`. Aucun test d'écoute subjective ni appareil Android physique.

Première inspection des captures : personnage visible dans la ruelle en troisième personne et absent en première personne, bâtiments et relief chargés. Aucun `pageerror`. L'inspection mobile a conduit à éloigner les boutons du joystick et de l'aide et à repositionner les diagnostics sur petit écran. Ces captures ne constituent pas une comparaison automatisée de scintillement en mouvement.

Mesure : Chromium headless, rendu logiciel ANGLE/SwiftShader, viewport 1280×800, scène OSM de 3 217 objets, DEM IGN 10 m, sans ombres, ratio pixels 1 après sélection automatique. Échantillons : 5–7 FPS, 83–101 draw calls, environ 276 000–296 000 triangles, 47 géométries, 0 texture. Il s'agit de compteurs de ressources, pas d'une mesure en octets de la mémoire GPU. Ni objectif 60 FPS ni fluidité sur GPU réel validés. Le viewport 390×844 teste la disposition seulement, pas les performances Android. Aucun benchmark avant/après équivalent n'a été capturé : aucune amélioration FPS quantifiée revendiquée.

## Géographie et parcours de référence

Les fichiers de données et le code du relief et de la végétation sont inchangés ; aucune nouvelle surface superposée, aucune distance LOD modifiée. Les attributions OSM et IGN existantes sont conservées.

Présence vérifiée dans `public/data/angles-osm.geojson` :

| Élément | Identifiant OSM local |
| --- | --- |
| Anglin | `osm-way-23283664` |
| Pont réel, rue du Pont, `bridge=yes`, `layer=1` | `osm-way-647696691` |
| Rue du Château | `osm-way-58717978`, `osm-way-1395850158` |
| Ruines du château | `osm-way-961675973` |
| Tranchée des Anglais, escalier | `osm-way-1235227989` |

**Le trajet berges–pont–ruelles–château n'est pas validé comme promenade continue.** La marche dans une ruelle près du départ est vérifiée dans le navigateur. Le terrain IGN de 10 m ne décrit ni marches ni tablier. Il faut des supports de marche associés au vrai pont et aux vrais escaliers, avec élévations justifiées : le contrôleur actuel suit uniquement le DEM. Le bouton « Forteresse · situer » passe en vue aérienne ; il reste un repérage approximatif, pas une preuve d'accès à pied. Aucun pont, escalier ou passage inventé.

## Limites et risques restants

- Pas de surfaces physiques du pont et des escaliers ni validation topologique du parcours ; pas d'interdiction de marcher dans l'eau ni de respect général des restrictions OSM d'accès. Ne pas présenter les berges comme toutes accessibles.
- Le seuil de pente utilise la variation dans la direction du mouvement, sans capsule 3D ni simulation de gravité ; une pente raide peut être longée en travers. Le DEM ne permet pas de certifier la sécurité de petits ressauts ou falaises sous sa résolution.
- Collisions uniquement avec les anneaux extérieurs des bâtiments Polygon ; multipolygones, trous et murs indépendants non gérés. Glissement par axes : une dépendance à l'orientation locale subsiste aux coins. Caméra testée sur son centre avec marge horizontale, pas un volume de frustum : du clipping de proximité reste possible dans des configurations serrées.
- La rétraction immédiate peut produire un changement de distance brusque ; le zoom souhaité est amorti, pas toutes les transitions d'occlusion. Souris par glisser, sans pointer lock.
- Le départ est un candidat géométrique libre près de l'origine, pas un point d'accès public audité. Si aucun candidat n'est trouvé, la marche OSM reste bloquée.
- Le cycle jour/nuit et les couchers de soleil ne sont pas développés ; l'éclairage estival reste fixe. Pas de rivière spatialisée, oiseaux, pas de surface, musique ou faune.
- Son activable testé par l'état UI, pas par analyse de la sortie audio. Choix qualité unique au démarrage, sensible à la charge temporaire ; pas de profilage GPU matériel ni mémoire en octets.
- Corrections terrain/végétation préservées dans le code, mais absence de scintillement et de popping non certifiée par un parcours long.

## Cinq priorités recommandées

1. Vérifier la connectivité et les restrictions d'accès OSM du parcours extérieur, puis établir les supports du pont et des escaliers à partir de données justifiées.
2. Étendre les collisions aux multipolygones, murs, eau et volumes caméra ; enregistrer des traversées de référence pour coins, falaises et passage du pont.
3. Mesurer sur GPU intégré et appareil Android réels, avec référence avant/après, temps CPU/GPU et mémoire ; adapter ensuite les lots géométriques et la qualité.
4. Affiner les transitions caméra, l'avatar et la lecture visuelle des chemins, puis préparer un cycle lumineux lent et lisible.
5. Ajouter une ambiance rivière spatialisée et des pas adaptés aux surfaces avec ressources et licences documentées.
