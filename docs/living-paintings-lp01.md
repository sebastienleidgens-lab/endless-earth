# Endless Earth — LP-01 : Living Paintings

## Statut et périmètre

Prototype indépendant de trois tableaux jouables, dans `experiments/living-paintings/`. Les coordonnées OSM et le relief IGN restent séparés des coordonnées projetées des images. Le personnage marche à 1,38 m/s, possède une hauteur logique de 1,75 m et conserve sa position et son orientation aux transitions. Silence intégral, sans import de la Mission 10.

**Validation artistique réservée au propriétaire dans le navigateur.** Le rendu livré est une étude procédurale stylisée, à perspective orthographique fixe, avec grain et touches picturales. Il n'atteint pas à lui seul la finition de décors peints par un artiste pour Baldur's Gate. Les bâtiments restent schématiques et les arbres sont illustratifs. Le succès des tests ne constitue pas une approbation de la beauté, de la lisibilité ou du plaisir de promenade.

## Isolation vérifiée

- État initial : branche locale `work`, arbre propre, commit `f11f165`. Le `main` distant avait avancé jusqu'à `8cefef9b0f8a24bd7ee7b8deb661126a50854c80` (fusion de la Mission 10).
- `main` distant interrogé et récupéré avant de créer `prototype/living-paintings` depuis ce SHA. Aucune branche `main` locale créée ou modifiée.
- Seuls `experiments/living-paintings/` et les nouveaux rapport/preuves `docs/living-paintings-*` sont ajoutés. Les données existantes sont lues uniquement ; leurs SHA-256 sont conservés dans `public/world.json`.
- Aucun changement de `src/`, `public/`, du package racine ni de `.github/workflows/`. Aucun lancement de workflow de déploiement, aucune fusion, aucune activation de fusion automatique.
- Build Vite propre au prototype, base relative, sortie `experiments/living-paintings/dist/`. Il n'utilise pas le plugin d'identité ni le dossier `dist/` de production.

## Itinéraire et statut géographique

| Tableau | Tracé OSM principal | Distance | Durée théorique à 1,38 m/s |
|---|---|---:|---:|
| 01 — Les ruelles de pierre | Rue du Pont, ways 58717597 et 900319308 | 106,18 m | 76,94 s |
| 02 — Le passage de l'Anglin | Pont de la rue du Pont, way 647696691, tag `bridge=yes` | 83,77 m | 60,71 s |
| 03 — Vers Sainte-Croix | Rue Sainte-Croix, way 647696678, parcourue en sens inverse de la liste source | 96,59 m | 69,99 s |

Total : **286,55 m à l'aller**, environ **573,10 m aller-retour**, **415,29 secondes théoriques** sans arrêts. Les petits seuils d'arrivée aux points et les changements de direction expliquent les écarts de la marche mesurée. Aucun objectif de quinze secondes, aucune téléportation entre lieux et aucune augmentation de vitesse pour les tests.

Chaque fin de tracé est exactement le début du suivant. Projection locale identique au projet : origine 0,8844° E, 46,6953° N ; X vers l'est, Z vers le sud ; 111 320 m/degré avec correction cosinus de latitude. Longitude et latitude sont récupérables à tout instant depuis l'état de navigation. Chaque tableau utilise le même axe de vue et 125 m de largeur logique ; ce sont trois rasterisations de lieux distincts, pas trois recadrages d'une peinture unique.

Les branches de rues sont aussi explorables, dans les limites visibles de la peinture. Deux paires de passages secondaires sont posées sur les tracés des ways OSM 647696686 (« Le quai », entre 01 et 02) et 647696688 (« La rive sud », entre 02 et 03). Le premier utilise un sommet source ; le second un point interpolé à 40 % du premier segment. Les points restent dans les deux vues correspondantes. Les deux côtés d'un passage ont exactement les mêmes coordonnées. Un verrou temporaire empêche les bascules immédiates dans les deux sens. Les routes au-delà de cette étude ne deviennent pas de nouveaux tableaux : les limites du carnet ne constituent pas une promesse de couverture supplémentaire.

**Cartographié :** tracés routiers, présence/position du pont, empreintes bâties, contours de rivière et zones d'habitat végétal. **Échantillonné :** relief du MNT IGN du dépôt, grille source de 10 m interpolée sur 5 m pour LP-01, sans gain de précision. **Interprété :** largeurs praticables, hauteurs bâties, toits, fenêtres, couleurs, implantation des arbres, ombres et lumière. Le tablier du pont est interpolé entre les altitudes de ses extrémités ; son profil et les parapets ne sont pas un relevé architectural. Le niveau d'eau dessiné à 66 m est un choix visuel local, pas un relevé hydrologique.

Les trois tableaux n'inventent ni un autre pont ni un monument. Le troisième suit une rue existante vers le coteau ; il ne prétend pas représenter un sentier forestier vérifié ou une randonnée jusqu'au sommet. Aucune vérification sur le terrain n'a été réalisée.

## Méthodes étudiées et décision

| Critère | A — Géométrie simplifiée précalculée, méthode livrée | B — Peinture générée ou retouchée avec navigation/profondeur |
|---|---|---|
| Cohérence géographique | Même géométrie pour projection, routes et bâtiments ; coordonnées auditables | Doit être contrainte puis vérifiée après chaque retouche ; risque de déplacer un accès ou inventer un édifice |
| Qualité visuelle | Stable et reproductible, mais schématique ; meilleure texture et direction artistique nécessaires | Potentiel pictural supérieur ; continuité inter-tableaux et respect architectural difficiles |
| Navigation/occultation | Découlent du modèle de base ; masque recalculable | Cartes à produire/retoucher et aligner sur chaque version finale |
| Coût de reprise | Recalcul déterministe, aucune ressource payante | Reprises artistiques et annotation du décor, coût variable ; droits à vérifier pour chaque modèle et ressource |
| Généralisation | Bon socle de pipeline sous réserve de données suffisantes et de styles régionaux | Plus de supervision artistique et géographique, stabilité entre régions incertaine |

**Choix A pour LP-01.** Le rasteriseur TypeScript utilise Three.js pour la projection orthographique et Canvas2D pour les faces géométriques, matériaux originaux, végétation et touches de texture. Il ne charge pas un moteur 3D de scène pendant la promenade. La méthode B a été étudiée conceptuellement ; aucune peinture B n'a été produite, aucun coût ou résultat mesuré n'est présenté comme une comparaison expérimentale. Aucune IA d'image n'a été utilisée.

## Ce qui est automatique, manuel ou artistique

| Travail | Réalisé dans LP-01 | Limite |
|---|---|---|
| Extraction et projection | Automatique, déterministe, versionnée ; hashes des entrées | Le parcours et les zones doivent d'abord être choisis |
| Choix du trajet, caméra, palette, échelles, hypothèses et passages | Codés manuellement | Pas un générateur mondial autonome |
| Peintures 2048 × 1280 | Générées automatiquement depuis les données et règles originales | Toitures simplifiées en éventail ; certaines empreintes complexes méritent une reprise |
| Obstacles/navigation | Corridors routiers, bâtiments, eau et tablier calculés depuis la géométrie | Marges et largeurs supposées ; pas de marche dans tous les jardins/champs |
| Profondeur | Masques PNG encodés sur 16 bits puis décodés en Uint16 ; interpolation sur les faces ; découpe du personnage pixel par pixel | Modèle 2,5D : aucun intérieur, étage praticable ou passage sous le pont. Bords de feuillage rasterisés avec tolérance de 12 cm ; contrôle artistique encore nécessaire aux silhouettes complexes |
| Animation | Eau/reflets sur masque, petits groupes de feuilles indépendants, oiseaux occasionnels, variation lumineuse, marche et repos du personnage | Feuillage animé limité à quelques touches, pas une canopée physique entière ; arrêt possible et préférence système respectée |
| Finition artistique | Palette, grain, ombres, matériaux originaux définis par code | Travail d'artiste requis pour régionaliser les façades, améliorer les toits et composer les premiers plans |

## Navigation et expérience

Flèches, ZQSD ou WASD : déplacement libre à l'intérieur des corridors. Pas de rotation de caméra. La marche est normalisée et découpée en sous-pas de 15 cm pour éviter de traverser un obstacle entre deux images. Le clic/toucher cherche une route sur le graphe des voies OSM et rejette une destination hors réseau. Il ne dessine pas une ligne droite à travers une maison. La promenade automatique suit les points source, rejoint le coteau, se retourne et revient au village ; toute saisie manuelle l'interrompt.

Les trois tableaux sont préchargés après l'ouverture du premier. Cela favorise les transitions rapides au prix d'une mémoire supérieure au chargement d'une seule peinture. Sur écran étroit, le cadrage suit horizontalement le personnage, sans changer d'axe de projection ; les boutons tactiles restent accessibles. Les commandes ont un état de pause, les touches sont relâchées à la perte de focus et l'onglet masqué ne poursuit pas une marche invisible.

Les crédits sont accessibles dans « À propos » et distribués avec le build dans `ATTRIBUTION.txt`. Inventaire détaillé : [LICENSES.md](../experiments/living-paintings/LICENSES.md). Données dérivées sous ODbL, attribution IGN conservée ; Three.js sous MIT. Aucune ressource graphique tierce téléchargée, aucun son et aucune police embarquée.

## Validation et mesures

Les captures sont issues de Chromium exécutant le vrai prototype ; les WebP de `public/` sont des **décors précalculés**, pas des captures du moteur 3D de production. Les JSON des preuves décrivent dimensions, méthode et limites. Aucun test de téléphone Android physique, GPU matériel ou réseau mobile n'est revendiqué.

Les mesures finales et la comparaison 3D figurent dans les [preuves et captures](living-paintings-evidence/README.md) et la [synthèse chiffrée](living-paintings-evidence/metrics.md). Les tests racine de la base initiale passent (140/140), ceux du `main` final de référence aussi (146/146), ainsi que les 7 tests géométriques LP-01. Les résultats sont conservés dans [checks.json](living-paintings-evidence/checks.json). La reconstruction répétée des douze fichiers de peintures/masques/feuillages donne les mêmes SHA-256. Les tests couvrent : continuité géographique, aller-retour au travers du solveur de collisions, vitesse maximale, murs/eau/limites, clic sur graphe, profondeur devant/derrière, passages secondaires, compilation et navigateur. Une marche complète à vitesse normale est exécutée par le bouton public, sans injection de position ni accélération de l'horloge.

## Comparaison à la 3D actuelle

Référence finale : code 3D du `main` revérifié au commit `0f699fa50cb9d9b8158fc88776d27ec75594f575`, Mission 10.1. Pendant LP-01, `main` a avancé par fusion de la PR #18 audio. Le prototype conserve sa base initiale `8cefef9` ; cette comparaison est construite dans un autre worktree détaché, sans fusion/rebase dans la branche du prototype. Sa capture fraîche est conservée avec les preuves LP-01. La date de simulation 3D est fixée au 10 mai 2026 à 13:00 UTC pour obtenir une vue de jour lisible ; LP-01 possède un seul éclairage précalculé. Les conditions lumineuses ne sont donc pas identiques. La comparaison du chargement et de la fluidité est indicative : LP-01 est une promenade 2D avec 3 tableaux limités, tandis que la 3D construit un monde exploratoire, un terrain et de la végétation en temps réel. Chromium logiciel dans le cloud ne mesure pas un GPU de téléphone.

| Aspect | Living Paintings LP-01 | Endless Earth 3D actuel |
|---|---|---|
| Point de vue | Perspective fixe, composition stable ; recadrage mobile | Caméras libres, première/troisième personne et vue aérienne |
| Charge graphique | Images et quelques animations Canvas2D | Géométrie, matériaux, ombres, végétation et atmosphère WebGL en temps réel |
| Personnage | Sprite original, hauteur logique 1,75 m ; petit dans une vue large | Avatar 3D dans un monde continu |
| Exploration | Réseau géographique limité aux trois peintures | Monde local plus continu, distances et perspectives plus souples |
| Aspect visuel | Cohérence de palette ; encore très géométrique et schématique | Relief et volumes perceptibles ; rendu et coût dépendent du matériel |
| Évolutivité | Coût mémoire/images et travail de composition par caméra | Coût des données et des ressources régionales ; vues réutilisables |
| Son | Silence | Ambiances de la Mission 10, non reprises ici |

## Coût de cent tableaux et passage au monde

Estimation de planification, **pas un devis ni une mesure de temps humain réalisé**. Hypothèse : même région, données déjà accessibles, 100 tableaux à une caméra chacun, qualité nettement supérieure à l'étude procédurale brute.

- Données, réseau, hypothèses et cadrages : 1 à 4 h/tableau.
- Finition artistique / matériaux / occultation : 6 à 16 h/tableau.
- Validation géographique, marche, mobile et revue : 1 à 2 h/tableau.
- Total : **800 à 2 200 h**, plus **80 à 160 h** d'outillage et styles régionaux. À 60–90 €/h : ordre de grandeur **52 800 à 212 400 €**. Les heures d'artiste et de contrôle dominent ; multiplier seulement le temps du script serait trompeur.
- Le rendu batch et la compression sont automatisables. Le stockage se chiffre en dizaines/centaines de Mo pour 100 tableaux selon qualité et masques, à mesurer après finition. Ne pas précharger les 100 : streaming par voisinage, budgets, niveaux de résolution et éviction seraient nécessaires.

À l'échelle mondiale : couverture et fraîcheur OSM variables, altimétrie de précision inégale, licences et obligations régionales, styles architecturaux, ponts/escaliers/passages couverts, topologie piétonne, saisons, frontières de tableaux, maintien des peintures après changement d'une source. Les données IGN utilisées ici ne constituent pas une source mondiale. Chaque nouvelle caméra multiplie peintures et contrôles ; une retouche de façade peut invalider son masque. LP-01 ne démontre donc pas une production mondiale automatique ni économiquement validée.

## Tester sans affecter la production

```sh
git switch prototype/living-paintings
cd experiments/living-paintings
npm ci
npm run dev
# http://localhost:5181/
```

Pour un test du build final : `npm run build && npm run preview`. Le port 5181 est indépendant et strict. Ne pas copier cette sortie vers le `dist/` racine et ne pas lancer le workflow Pages. Aucune prévisualisation publique indépendante n'est configurée dans le dépôt : la livraison utilise le serveur local / navigateur partagé de l'environnement, sans publier d'URL de production. Le dossier autonome peut être servi par n'importe quel serveur statique local.

Livraison : branche dédiée et PR **en brouillon**, sans fusion automatique. Le propriétaire doit parcourir les trois tableaux, examiner les silhouettes et le personnage, puis décider si cette direction artistique mérite une itération avec un artiste.
