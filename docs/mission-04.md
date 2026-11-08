# Mission 04 — La grande promenade

Branche `mission/04-grande-promenade`, créée depuis `origin/main` **b63d030**, après `git fetch origin main`. La fusion de la Mission 03 (PR #7) a été vérifiée avant toute modification. Aucun déploiement ni fusion dans main.

## Navigation et expérience

Le graphe piéton est séparé dans `src/living/graph.mjs`, indépendant de Three.js et du village. Il conserve les sommets des polylignes OSM, leurs restrictions et leurs couches. Seuls les sommets coïncidents se raccordent : cellule centimétrique et distance strictement inférieure à un centimètre, pour absorber les erreurs de projection. Aucun raccord entre extrémités distantes, aucune intersection déduite du croisement de deux traits. Les sommets intérieurs partagés permettent également les carrefours réels. Les sens `oneway:foot`, `foot:forward` et `foot:backward` sont respectés.

Chaque segment est contrôlé tous les 25 cm contre les bâtiments, l'eau, les murs, les ruines, les restrictions et le relief existants. Ponts sans tablier vérifié, tunnels et gués restent exclus. `bridge=no`, `tunnel=no` et `ford=no` ne sont plus confondus avec une présence de ces ouvrages. Le graphe validé est construit une fois au chargement ; les collisions sont à nouveau vérifiées pendant chaque déplacement. Un obstacle apparu ensuite arrête la marche, sans déviation ni téléportation.

Une recherche en faisceau bornée (48 candidats, 512 niveaux) choisit un chemin simple long : aucun sommet revisité, aucun aller-retour artificiel. Ce calcul se produit à la préparation du trajet, jamais à chaque image. Il s'agit d'une heuristique, pas d'une preuve du plus long chemin mathématique. La variété provient des branches successives et de l'interdiction de revisiter les lieux ; il n'existe pas encore de classement esthétique des paysages.

La promenade proposée est bornée à **450 m** (environ six minutes à 1,35 m/s, davantage dans les virages). La coupe finale reste strictement sur un segment OSM validé. Au chargement uniquement, le départ privilégie le sommet existant le plus proche du centre de référence offrant cette longueur, dans un rayon de 150 m. Le départ retenu est à environ 35 m de ce centre. Appuyer sur « Promenade automatique » ne déplace jamais instantanément le personnage. Clavier et joystick reprennent immédiatement le contrôle ; perte de focus et onglet masqué conservent la pause existante.

Le contrôleur accélère progressivement, réduit sa vitesse à l'approche d'un angle serré, et ralentit à l'arrivée. Les distances restantes sont précalculées ; suppression du `slice/reduce` du parcours à chaque image. L'arrivée utilise les coordonnées exactes des sommets plutôt qu'une tolérance de 1,5 cm qui aurait coupé les angles.

## Caméra

Vue troisième personne par défaut, à 5 m. Molette et véritable pincement à deux contacts : cible bornée de 1,5 à 15 m, interpolation progressive. Les distances troisième personne et aérienne sont mémorisées séparément. `V` conserve le cycle troisième personne → première personne → aérienne ; aucune sélection de vue liée à la marche. Le repère forteresse conserve son comportement aérien antérieur et interrompt explicitement la promenade.

Rotation souris/tactile libre ; la marche ne recentre pas pendant un glissement, ni pendant les 3,5 secondes qui suivent une interaction. Retour progressif derrière le personnage ensuite, par le plus court arc angulaire. Balayage du bras caméra conservé à chaque image, rétraction immédiate et réextension amortie. Protection supplémentaire des murs et remparts OSM : les restrictions d'accès piéton seules ne deviennent pas des obstacles caméra. Relief et bâtiments conservent les protections de Mission 02.

## Ambiance et architecture

Pas procéduraux par bouffées de bruit filtré, avec attaque brève et décroissance adaptées à la surface OSM, en remplacement des notes triangulaires. Eau filtrée plus sourde et moins forte, appels d'oiseaux plus espacés (10 à 32 secondes), fréquence et durée variables. Vent et transitions progressives conservés. **Tout cet audio reste de la synthèse originale, pas des enregistrements réalistes.** Aucune ressource externe ajoutée, aucune attribution supplémentaire.

Nuages légèrement plus arrondis et volumes moins réguliers, sans transparence ni draw call supplémentaire. Inclinaison et rythme de battement des oiseaux moins synchrones. Cycle lumineux doux, feuillage subtil, batching, LOD hystérétique et profils Éco/Qualité conservés. Pas de météo lourde, de serveur, de métiers ni d'économie.

Géographie/relief, graphe, contrôleur de marche, helpers d'orbite, ambiance visuelle et son sont des modules distincts. L'assemblage de la caméra et du personnage reste dans `main.ts` ; leur extraction complète sera utile avant les futures interactions. Les nouveaux modules génériques ne contiennent aucune coordonnée spécifique au village.

## Mesures et vérifications

- `npm test` : **38/38**, dont raccords OSM, refus des écarts/croisements/couches différentes, restrictions et sens piétons, absence de répétition de sommets dans un réseau cyclique, obstacles dynamiques, arrivée, reprise manuelle, zoom borné et murs caméra.
- `npm run build` : **réussi**, bundle d'environ 576 ko non compressés ; avertissement Vite de taille conservé.
- `npm run test:browser` : **réussi** ; chargement, trois vues, déplacement, stabilité au repos, garde au terrain, audio, profil et viewport mobile. L'attente de stabilité utilise des images réellement rendues, pour résister aux variations de charge de SwiftShader.
- `node scripts/browser-living.mjs` : **réussi** ; marche, reprise manuelle, trois vues, viewport 390 × 844, cycles et rafales audio, un contexte et deux boucles d'ambiance. Le compteur distingue désormais ces boucles des nouvelles sources transitoires des pas. Aucune erreur JavaScript/console ni réponse HTTP ≥ 400.
- `node scripts/browser-safety.mjs` : **réussi** ; cinq obstacles injectés après départ (bâtiment, accès privé, eau, mur et rempart). Chaque position échantillonnée reste autorisée, arrêt avant la zone.
- `node scripts/browser-camera.mjs` : **réussi** ; zoom mémorisé, absence de recentrage pendant glissement et délai d'inactivité, retour derrière le personnage, rétraction devant un mur OSM ajouté et stabilité des trois modes.
- `node scripts/browser-promenade.mjs` : **réussi** ; molette, véritable pincement via événements tactiles Chromium/CDP à deux contacts, rotation, trois vues, arrivée et viewport mobile. **450,000 m effectivement cumulés à chaque image, 414,438 s (6 min 54,44 s), 2 167 images, sans accélération de la simulation.** Le chronomètre externe relève 415,256 s ; l'écart correspond aux échanges avec le navigateur et à la détection de l'arrêt. La mesure temporelle par image a une précision d'environ une image de rendu. Le relevé indépendant à environ 1 Hz donne 449,678 m : il sous-estime légèrement les angles. Ce résultat valide une marche complète de plus de cinq minutes, pas seulement le calcul d'un trajet.
- `node scripts/browser-visual.mjs` : **réussi**, vidéo de 37,32 s et dix captures. Inspection des vues proche/intermédiaire/éloignée, du nuage visible au-dessus des bâtiments, des arbres et de planches vidéo à 2 images/s. Aucun scintillement ou popping anormal évident observé dans ces échantillons. La vidéo comprend le chargement initial et ne représente pas une observation continue de sept minutes.

**Distance maximale réellement parcourue et validée lors de cette mission : 450 m. Durée réelle correspondante : 6 min 54,44 s.** Les unités de temps de la simulation n'ont pas été accélérées. Le plafonnement existant du delta à 250 ms ralentit le monde quand SwiftShader est surchargé ; cela explique une durée supérieure au temps théorique à 1,35 m/s.

Toutes les mesures graphiques utilisent **Chromium / ANGLE / SwiftShader Device (Subzero)**, rendu logiciel. Moyenne pendant la marche longue : environ **5,23 images/s** (2 167 / 414,438), avec d'autres scénarios Chromium en parallèle au début. Captures de départ : environ **3–6 FPS, 99–100 draw calls, 303 493 triangles**. Fin du trajet, viewport mobile : **8 FPS, 112 draw calls, 328 913 triangles**. Le scénario d'ambiance relève 2 FPS sous charge concurrente, 94 draw calls et 300 813 triangles. Ce sont des mesures de logiciel sous charge variable, pas des performances GPU matériel. Aucun résultat matériel ou Android réel disponible.

Les scripts de la Mission 03 et le scénario principal ont été adaptés à la nouvelle vue initiale ; les assertions de sécurité ont été conservées. Pour la vidéo, le ffmpeg système a été exposé via un cache Playwright local temporaire (`PLAYWRIGHT_BROWSERS_PATH=.../work/browser-cache`), sans installer de binaire dans le dépôt. Captures et vidéos de travail restent dans `work/`, exclu de Git.

Le relevé exhaustif des sommets du graphe trouve **939 sommets et 918 segments**, et un chemin calculé de **3 787,53 m** au maximum de la recherche heuristique. Cette distance est une possibilité calculée sur les données et les collisions actuelles ; elle n'est pas une marche de 3,79 km réellement exécutée. Le tronçon de départ précédent donne environ 104 m après raccordement, contre environ 50 m en Mission 03 ; le nouveau départ permet les 450 m proposés.

Captures pendant les essais Chromium/SwiftShader :

- [Caméra proche, 1,5 m](mission-04-captures/proche.png)
- [Caméra intermédiaire, environ 5 m](mission-04-captures/intermediaire.png)
- [Caméra éloignée, 15 m](mission-04-captures/eloignee.png)

Preuves complémentaires : [mesure structurée](mission-04-captures/mesure.json), [viewport mobile à l'arrivée](mission-04-captures/mobile.png), [nuage inspecté](mission-04-captures/nuage.png), [végétation inspectée](mission-04-captures/vegetation.png).

## Limites

La validation est celle d'un modèle géographique : OSM et un DEM IGN à 10 m ne prouvent ni l'accessibilité piétonne actuelle sur le terrain, ni l'absence d'un obstacle non cartographié. Les segments bloqués sont rejetés en entier, ce qui peut fragmenter davantage le réseau. Aucun passage de pont sans altitude certifiée n'est inventé pour prolonger le trajet.

La tolérance centimétrique est volontairement conservatrice et peut manquer des jonctions OSM incohérentes. La recherche bornée peut manquer un meilleur chemin. Le graphe est mis en cache pour le monde chargé ; un futur chargement de nouvelles tuiles devra déclencher explicitement sa reconstruction. Les obstacles dynamiques sont vérifiés à l'exécution, sans recalcul automatique ni contournement.

Android physique, GPU matériel, écoute humaine sur casque et session de plusieurs heures non testés. Les captures de quelques positions et les séquences vidéo ne garantissent pas l'absence de scintillement sur toute la carte. Bundle Vite toujours supérieur à 500 ko ; aucune nouvelle dépendance de production.
