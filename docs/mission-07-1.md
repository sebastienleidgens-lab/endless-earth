# Mission 07.1 — Routes et intersections continues

La PR #11 était déjà fusionnée au démarrage. Cette correction part de `main` à `69af2dfe003ff6681ee552abb47d4ed286d0d97b`, sur `fix/07-1-routes-intersections`. Aucun changement direct de `main`, fusion ou déploiement.

## Diagnostic établi avant correction

La Mission 07 découpait chaque tronçon routier en rectangles indépendants, puis les drapait sur les triangles IGN, 4,5 cm au-dessus du sol. Elle regroupait les rectangles par matériau, sans union des intersections. Deux routes pouvaient donc occuper exactement le même plan avec des couleurs différentes. La tessellation du relief était correcte localement ; elle ne constituait pas une triangulation unifiée des carrefours.

L'audit des emprises rectangulaires donne **2 274,40 m² de surface cumulée en excès**, répartis dans 1 387 cellules DEM. C'est la somme des aires moins leur union, avec multiplicité ; ce n'est pas une mesure de surface unique. Les triangles beiges/gris observés étaient des rectangles routiers concurrents, et non de nouvelles zones géographiques.

Deux autres effets se combinaient :

- Le LOD lointain pouvait différer de 25 cm du sol source, alors que la route restait à +4,5 cm. Sur 6 139 échantillons de centres de tronçons dans l'emprise, **104 se retrouvaient sous le terrain lointain** ; écarts mesurés du terrain de −22,27 à +19,52 cm. Les extrémités communes sont comptées plusieurs fois. [Audit reproductible](mission-07-1-captures/legacy-lod-audit.json).
- Une profondeur perspective de 24 bits avec les plans 0,1–1 500 m perd de la précision avec la distance : ordre de grandeur d'un pas de 6 mm à 100 m, 54 mm à 300 m, 60 cm à 1 km. Cela amplifie les conflits entre plans proches, sans expliquer à lui seul les conflits coplanaires au premier plan. Ces valeurs sont théoriques, pas des mesures de performance GPU.

Le changement de caméra révélait tantôt un matériau, tantôt l'autre, et le changement de LOD pouvait enterrer la route. Augmenter globalement sa hauteur ou ajouter `polygonOffset` aurait conservé les doubles surfaces et les raccords incorrects.

## Correction géométrique

Le sol visible forme maintenant **une partition unique terrain/chaussée**, calculée hors navigateur :

1. Les axes OSM existants, en mètres dans le même repère local, produisent des emprises à bords arrondis. Union des tronçons à leurs nœuds, jonctions de largeurs différentes comprises.
2. Les revêtements se partagent l'intersection par priorité déterministe (asphalte, pavés, gravier, terre, inconnu urbain, inconnu rural). Cette règle est une interprétation visuelle, pas une observation de terrain. Chaque emprise est soustraite des suivantes et du terrain naturel.
3. Chaque région est coupée par les triangles du DEM original, puis triangulée avec ses éventuels trous. Les couleurs changent à la frontière, sans deuxième couche de polygones.
4. Les positions et normales de frontière sont communes, même entre tuiles. Les nœuds colinéaires sont insérés des deux côtés avant stockage Float32 : un nœud absent d'un bord voisin provoquerait une microfente après arrondi. Les triangles retournés ou dégénérés après quantification sont rejetés.
5. Les cellules traversées par les voies interdisent la simplification du relief. Le LOD lointain réutilise **exactement les mêmes faces routières et indices** que le LOD proche. Les autres cellules conservent le LOD Mission 07.

**Décalage routier : 0 m. `polygonOffset` : désactivé.** La chaussée suit les mêmes triangles et hauteurs que le joueur et ses collisions. Les routes ne sont plus dessinées comme des maillages séparés. Les bâtiments, fondations, murs, eau, arbres, trois caméras, météo et audio conservent leurs systèmes existants.

Le dérivé comporte 25 tuiles, 117 318 triangles proches, 103 334 lointains, 81 495 sommets et 5 191 cellules routières. Les très petites faces rejetées pendant la préparation totalisent environ 0,00000282 m² ; les tests bornent l'erreur d'aire totale et les intersections numériques, plutôt que de prétendre à une arithmétique exacte en Float32.

## Matières et fidélité des données

Six classes : asphalte, pavés, terre, gravier, revêtement inconnu, chemin rural inconnu. Les classes connues viennent de `surface=*`. Les inconnues restent des interprétations neutres. La variation emploie le petit atlas de bruit existant, avec un grain moins contrasté sur asphalte/pavés. Le joint de pavage est discret, anticrénelé par dérivées et s'efface au loin. Aucune texture supplémentaire, aucun marquage ou trottoir inventé.

Les largeurs numériques OSM sont respectées dans la limite technique de 30 m ; sinon les valeurs héritées 5,5 m / 2,5 m restent **estimées**. 1 567 des 1 580 segments ont une largeur estimée, 13 une largeur explicitement renseignée. Les chemins cyclables rejoignent la classe étroite. Les tracés OSM et le DEM source n'ont pas été modifiés. Les positions ne sont pas des relevés de bordure de voirie.

Le relief reste l'échantillonnage IGN de 10 m de la Mission 07, avec son repère local historique. Les pierres et textures sont procédurales ; aucune revendication LiDAR ni nouvelle précision cadastrale. Attribution IGN/RGE ALTI et OpenStreetMap/ODbL conservée.

## Deux passes de correction

- **Passe 1** : suppression des maillages superposés, partition des emprises et du sol, protection du LOD, palette initiale. Captures `pass1-*.png` et mesures `pass1.json`. La vue initiale de raccord était obstruée par un toit ; elle n'est pas retenue comme preuve finale du raccord.
- **Passe 2** : tests sur l'ensemble des triangles, correction des nœuds de frontière et du sens après arrondi Float32, grain minéral atténué. Reprise du cadrage du raccord en aérien, nouvelles captures avant/après aux coordonnées identiques. Les faces routières ne changent toujours pas entre LOD.

## Comparaisons visuelles

Captures en pause, date identique (21 juin, midi UTC), même viewport 800 × 600, même caméra géographique et même qualité. Le HUD porte honnêtement `Base 69af2dfe · modifié` pendant les travaux. Les tests du badge production contrôlent séparément le hash exact du checkout compilé. Les paramètres et mesures brutes sont dans [before.json](mission-07-1-captures/before.json) et [after.json](mission-07-1-captures/after.json).

| Situation | Avant / après |
|---|---|
| Rue du village | [Comparaison](mission-07-1-captures/compare-village.jpg) |
| Carrefour complexe | [Comparaison](mission-07-1-captures/compare-carrefour.jpg) |
| Intersection de trois voies | [Comparaison](mission-07-1-captures/compare-trois-voies.jpg) |
| Route en pente | [Comparaison](mission-07-1-captures/compare-pente.jpg) |
| Chemin rural | [Comparaison](mission-07-1-captures/compare-rural.jpg) |
| Vue rasante | [Comparaison](mission-07-1-captures/compare-rasante.jpg) |
| Vue aérienne du village | [Comparaison](mission-07-1-captures/compare-aerienne.jpg) |
| Raccord à X = −200 m entre tuiles | [Comparaison](mission-07-1-captures/compare-raccord.jpg) |

Les images originales `before-*.png` / `after-*.png` sont conservées, ainsi que les vues Éco et mobile 390 × 844.

### Images successives et mouvement

Six rendus successifs par trajectoire, avec atmosphère immobilisée pour isoler la surface : fixe, déplacement lent (12 cm/image), rapide (1,8 m/image), rotation (0,05 rad/image), aérien avec translation et recul. La vue fixe donne six empreintes SHA-256 WebGL identiques avant et après ; les quatre trajectoires produisent effectivement des images distinctes. Ce contrôle fixe seul ne démontrerait pas la stabilité en mouvement : les séquences mobiles et aériennes ont aussi été examinées.

| Caméra | Avant | Après |
|---|---|---|
| Lente | [Animation](mission-07-1-captures/motion-before-lent.webp) | [Animation](mission-07-1-captures/motion-after-lent.webp) |
| Rapide | [Animation](mission-07-1-captures/motion-before-rapide.webp) | [Animation](mission-07-1-captures/motion-after-rapide.webp) |
| Rotation | [Planche](mission-07-1-captures/sequence-before-rotation.jpg) | [Planche](mission-07-1-captures/sequence-after-rotation.jpg) |
| Aérienne / carrefour | [Planche](mission-07-1-captures/sequence-before-aerienne.jpg) | [Planche](mission-07-1-captures/sequence-after-aerienne.jpg) |

Les triangles de matériaux concurrents ont disparu dans les vues examinées. Les bords restent attachés à leur sol pendant ces trajectoires. Le rendu raster conserve son anticrénelage ordinaire ; aucune promesse d'absence universelle de scintillement sur tous les GPU ou toutes les distances. [Protocole et hashes après](mission-07-1-captures/motion-after.json).

## Performances

Chromium 156, WebGL2, **SwiftShader logiciel**, environnement Linux à quota 4 CPU. Les chiffres de rendu ci-dessous concernent la scène entière, pas seulement les routes. Les buffers sont dédupliqués pour compter les attributs partagés des LOD ; l'occupation indiquée est leur taille théorique, pas la mémoire totale du pilote.

| Station | Appels avant → après | Triangles avant → après | Géométrie avant → après |
|---|---:|---:|---:|
| Village, Qualité | 123 → 120 | 264 057 → 247 134 | 32,71 → 31,01 Mo |
| Aérienne, Qualité | 154 → 151 | 270 667 → 262 503 | 35,24 → 33,54 Mo |
| Carrefour, Éco | 82 → 79 | 250 138 → 231 313 | 35,24 → 33,54 Mo |
| Mobile, Éco | 90 → 87 | 203 097 → 183 560 | 35,24 → 33,54 Mo |

L'atlas terrain reste à 5,33 Mo estimés avec mipmaps et le compteur à cinq textures sur ces stations. La surface proche est plus subdivisée que le DEM seul, mais remplace les anciens rectangles routiers cachés et supprime trois lots de matériaux. Aucune reconstruction par image. Mise à jour LOD : médianes 0,1–0,2 ms avant/après, proches de la résolution de l'horloge.

La construction CPU des objets terrain passe de 22,0–37,1 ms à 1,2–1,9 ms dans trois échantillons par version. Cette mesure ne comprend pas le téléchargement/décompactage initial. Les deux dernières passes de mesure ont été exécutées successivement, sans autre test actif : [bench-before.json](mission-07-1-captures/bench-before.json), [bench-after.json](mission-07-1-captures/bench-after.json). Le tableau utilise ces passes, dont le parcours de quatre stations diffère des dix captures artistiques ; les cellules de détail résidentes ne sont donc pas identiques entre les deux protocoles. La préparation géométrique complète est désormais **hors navigateur : 4,09 s** sur cet environnement. Le nouveau fichier statique ajoute **1 561 640 octets compressés**, soit 3 116 912 octets décompactés. Normales Int16, couleurs Uint8, indices Uint16 ; les positions restent Float32. `polygon-clipping` est une dépendance de développement, absente du bundle navigateur.

Chargement local jusqu'à disponibilité, essais isolés : 6,53 s avant / 5,99 s après. Les premières captures sous contention donnaient 7,30 / 10,74 s : ce contraste illustre pourquoi une seule mesure ne suffit pas. Le transfert supplémentaire de 1,56 Mo reste réel, notamment sur réseau mobile. Les médianes de rendu avec lecture synchrone GPU sont : village 236 → 214 ms, aérienne 213 → 224 ms, Éco 198 → 209 ms, mobile 137 → 144 ms. **Le logiciel ne montre donc pas un gain uniforme de temps de rendu. Aucun FPS SwiftShader n'est présenté comme performance GPU réelle**, et la réduction de géométrie ne garantit pas à elle seule une fluidité matérielle.

La promenade réelle parcourt **450,000 m en 372,31 s**, sur 2 424 images de déplacement, arrêt « Fin du parcours OSM validé ». Le graphe conserve 939 nœuds et 918 arêtes. Les 921 bâtiments, 10 723 ouvertures, 69 cellules et `builds: 1` restent identiques entre départ et arrivée. Les 1 650 ancrages naturels sont présents. [Trace complète](mission-07-1-captures/walk.json), [graphe et parcours](mission-07-1-captures/walk-survey.json).

La trace CPU couvre le démarrage, le relevé du graphe, les contrôles caméra et toute la promenade ; elle n'est pas plafonnée. Temps CPU avant soumission : médiane 4,7 ms, p95 13,1 ms ; soumission médiane 1,4 ms, p95 6,4 ms. D'autres tests ont tourné pendant une partie du parcours. Les intervalles et pics complets figurent dans le JSON ; ces chiffres ne démontrent pas 60 FPS ni une stabilité matérielle universelle.

## Tests et reproduction

- **87 tests Node réussis** et compilation TypeScript/Vite réussie.
- Nouveaux tests : carrefour à quatre branches, T, angle aigu, changement de largeur, boucle avec trou, doublons et segments nuls ; partition sans recouvrement entre classes ; reproductibilité binaire ; correspondance exacte aux sources ; hauteur de chaque triangle ; absence de triangles inversés/dégénérés ; mêmes faces routières aux deux LOD ; normales et hauteurs communes aux frontières ; rejet de buffers invalides. L'aire mesurée de la surface totale est 4 000 000,0000071 m² ; le test tolère 0,02 m² sur 4 km² et moins de 0,00001 m² de recouvrement numérique par paire dans chaque cellule, sans prétendre à une précision géographique correspondante.
- Régénération complète du manifeste et du pack : fichiers identiques octet pour octet au dérivé livré.
- Navigateur : chargement, déplacement manuel, trois caméras, garde au sol, zoom mémorisé et pincement, retour caméra, mur devant la caméra, absence de dérive au repos, profils Qualité/Éco, mobile, audio activé/désactivé avec un seul contexte et deux boucles.
- Collisions dynamiques : bâtiments, zones privées, eau, murs, ruines ajoutés pendant la marche ; toutes les positions échantillonnées restent légales.
- Sept scénarios de données : normal, ancien manifeste manquant, ancien LOD corrompu, anciennes sources périmées, nouvelle surface manquante/corrompue/périmée. Hauteur des chaussées et fondations vérifiée ; [résultats](mission-07-1-captures/data-validation.json).
- Promenade intégrale et séquences multi-images ci-dessus. Aucune erreur JavaScript/WebGL dans les captures artistiques et les séquences finales.
- Identité de build : le test compile également la mission fractionnaire **07.1** depuis son rapport déclaré. Le test navigateur du bundle production vérifie le vrai commit, le statut, quatre formats et l'absence de requête de métadonnées.

```sh
npm ci
npm run geo:roads                 # dérivés déterministes, aucun réseau
npm test
npm run build
npm run dev                      # port 5173
node scripts/browser-roads.mjs after
node scripts/browser-road-motion.mjs after
node scripts/browser-earth-data.mjs
node scripts/browser-roads-walk.mjs
npm run test:build-identity
```

Pour reproduire l'avant, servir le commit `69af2df` sur le port 5175 dans un checkout séparé, puis lancer `browser-roads.mjs before` et `browser-road-motion.mjs before` depuis ce checkout d'outillage. `scripts/road-contact-sheets.py` assemble les preuves avec Pillow ; les PNG intermédiaires de mouvement peuvent être supprimés après création des animations et planches. Les scripts de comparaison utilisent volontairement une simulation arrêtée et des lectures GPU complètes ; la promenade utilise la boucle réelle.

## Indisponibilité des dérivés et limites

Le chargement vérifie le schéma, les bornes des buffers, le hash du binaire décompacté et la correspondance des sources IGN/OSM. Si le dérivé routier est absent, corrompu ou périmé, le terrain source et les bâtiments restent utilisables ; les voies visuelles sont omises avec la mention **« voies visuelles indisponibles »**. Aucun retour aux rectangles superposés. Les chemins de navigation et collisions restent alimentés par les données sources. La perte de l'ancien dérivé d'occupation/LOD n'empêche pas le chargement indépendant de la nouvelle surface.

Les vues de diagnostic sans terrain / `?tiles=0` n'ont pas de chaussées préparées ; elles ne constituent pas le mode géographique normal. Les routes en pont, tunnels, bordures exactes et ouvrages de voirie ne sont pas reconstruits à partir de relevés absents. L'eau garde son système antérieur. La matérialité et les largeurs estimées ne deviennent pas des données vérifiées. Les erreurs DEM existantes et la précision du repère local subsistent.

Les résultats visuels couvrent les stations et trajectoires jointes. La validation matérielle sur téléphone Android et GPU physique reste à faire ; le profil Éco et le viewport mobile ont été testés automatiquement sur le moteur logiciel disponible.
