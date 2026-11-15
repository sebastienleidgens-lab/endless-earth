# Mission 25.2 — Finition artistique et réalisme sensoriel

Cette extension améliore le voyageur, ajoute trois interactions artistiques collisionnées et prolonge le paysage sonore et animal de M25.1. **Implémentation technique en validation ; mission artistique partielle.** Aucune validation humaine du rendu ou de l’écoute, aucun GPU physique ou téléphone réel testé. Aucun merge et aucun déploiement.

La [PR brouillon #37](https://github.com/sebastienleidgens-lab/endless-earth/pull/37) cible `mission/25-1-voyageur-monde-vivant`, elle-même dans la [PR brouillon #36](https://github.com/sebastienleidgens-lab/endless-earth/pull/36). La base exacte est `ffbbd765ec75bdcddd0bdb3b58933e46d585b7db`. M25.1 reste non fusionnée. Voir l’[audit initial](mission-25-2-audit.md), commité séparément.

Le code exécuté des preuves finales est figé au commit `f56ab291ded892f620fa08b3087ec7ee09eda3c8`. Les prises « avant » exécutent exclusivement la référence M25.1 ; toutes les prises « après » exécutent ce gel final. Les commits d’archivage ultérieurs modifient les outils et documents, sans changer les sources du jeu.

## Résultat et méthode

Le voyageur possède un visage sculpté, des yeux composés, une implantation de cheveux, des mains à quatre doigts et pouce, des plis, poches, coutures et attaches de sac. Il conserve 31 os et un matériau. Les clés articulaires originales de cuisse/genou/pied précèdent les corrections d’appui ; la jambe libre lit son animation de base, l’appui conserve son contact monde. Le retour neutre utilise un petit pas levé. Les mesures distinguent erreur de semelle, erreur d’ancrage et déplacement effectif du point planté.

Le banc, la roche et le tronc sont des **décors artistiques inventés**, déclarés au joueur et dans les JSON. Le validateur exige le support géographique existant et ses marges hors voies, eau, arbres et propriétés. Les collisions sont additives. L’approche, le bassin, les membres, la tête et le sac sont testés le long de trajectoires subdivisées. Aucun collider géographique n’est désactivé pour réussir l’action.

La préparation des accès aquatiques et du graphe est découpée. Le voisinage des rives est indexé ; un cache exact borné évite de confondre des points situés de part et d’autre d’un obstacle. Le sac du bateau reprend sa géométrie portée. Les contacts d’eau et la respiration discrète utilisent le contexte sonore existant et des positions de joints observées.

Les ailes lisent l’horloge commune à chaque rendu ; les corps extrapolent entre les mises à jour bornées de la faune. Les perchoirs proviennent de branches chargées, les vols ont une destination de branche et une courbe d’altitude. Les familles reçoivent proportions et palettes distinctes. Les chants existants identifiés sont associés aux identités visuelles compatibles. Le bruissement proche est attaché à des branches, modulé par le vent partagé, filtré et limité au budget audio existant.

## Acceptation propriétaire — neuf demandes, ordre M25.1

Les films natifs, comparaisons, caméras et traces sont archivés dans la [galerie autonome](mission-25-2-evidence/index.html). Les statuts portent sur les demandes complètes, y compris leurs exigences perceptives et leurs budgets ; une démonstration technique ne ferme pas ces critères.

| # | Demande | Statut | Preuves et limites |
| --- | --- | --- | --- |
| 1 | Packraft / performance | Partiel | [Deux navigations finales](mission-25-2-evidence/voyages.geojson) : 550,2 m chacune en état bateau, films de 624,6 et 625,3 s, retour à pied. [Départ à froid avant/après](mission-25-2-evidence/cold-boat-after.json), préparation découpée, index de rive, cache exact. Budget initial de 50 ms non atteint ; surcoût actif ≤ +5 % non démontré. |
| 2 | Personnage / rig | Partiel | [Tour 360°](mission-25-2-evidence/traveler-360.webm), portraits et quatre angles avant/après aux caméras documentées ; 31 os, 7 880 / 3 940 triangles, un SkinnedMesh. Style, peau, vêtements et expressions encore simplifiés ; revue artistique indépendante non validée. |
| 3 | Course | Partiel | Quatre angles natifs avant/après, [transitions et reprises pendant 182 s](mission-25-2-evidence/run-turns-and-stops-3min.json), et [439,1 m / 192 s sans pause volontaire](mission-25-2-evidence/run-endurance-3min.json), dont 185,7 s en activité course. Tests à 4/8/30/60/120 Hz et dt irréguliers. Appuis parfois au-dessus de 3,5 cm ; matrice filmée exhaustive pentes/escalier réel/90°/faible FPS incomplète et naturel perceptif non validé. |
| 4 | Interactions | Partiel | Films complets [banc](mission-25-2-evidence/interaction-bench.webm), [roche](mission-25-2-evidence/interaction-rock.webm), [tronc](mission-25-2-evidence/interaction-trunk.webm), et [refus de marche libre](mission-25-2-evidence/trunk-blocks-free-walking.webm). [Inventaire original, supports et provenance](mission-25-2-evidence/interactions-inventory.json). Balayages et refus testés ; contacts/transitions perceptifs à améliorer et à revoir. |
| 5 | Nage | Partiel | Trois films `swim-1/2/3`, environ 73 s chacun : marche → pataugeage → nage → marche, contacts d’eau et souffle. Profondeur estimée, eau opaque et formes encore stylisées. Matrice native complète pluie/hiver/vent/LOD non démontrée ; quelques erreurs de contact de sortie dépassent le seuil annoncé. |
| 6 | Vent | Partiel | [300,6 s natives en forêt](mission-25-2-evidence/forest-wind-5min.webm), [trajet forestier de 175 m](mission-25-2-evidence/forest-path-native.json), séquence de berge ; champ commun et bruissement sur branches chargées. [Trois heures simulées](mission-25-2-evidence/wind-3h-simulated.json) distinctes des films. Nuances visuelles et acoustiques à valider humainement. |
| 7 | Chants | Partiel | Familles sonores déjà identifiées et [licences vérifiées conservées](mission-25-2-evidence/audio-licenses.json), identités des passereaux visibles et sources mobiles ; silences. Aucun nouveau chant tiers ni cri d’oie ajouté ; écoute humaine non validée. |
| 8 | Oiseaux visibles | Partiel | [181,2 s : individu proche et vol](mission-25-2-evidence/birds-near-perch-flight.webm), [150,9 s : groupe d’oies sur prairie cartographiée en novembre](mission-25-2-evidence/birds-geese-autumn.webm), [ciel nocturne calme](mission-25-2-evidence/quiet-sky-native.webm). Formes et pattes simplifiées, contact fin d’atterrissage non validé ; aucune observation réelle attestée. |
| 9 | Audio spatial | Partiel | [487,9 s / 512,4 m de promenade sonore native](mission-25-2-evidence/sound-walk-8min.json), mix stéréo réel, rotations caméra et [éloignement/approche de rivière](mission-25-2-evidence/river-approach-recede-native.json). Forêt filmée séparément. [Contrôle numérique des canaux](mission-25-2-evidence/audio-checks.json), sans échantillon à pleine échelle ; casque/haut-parleurs et comparaison perceptive non validés. |

## Mesures compilées et portée

Même seed 12345, calendrier du 21 juin 2026, caméra, DPR 1 et viewport 480×320. Douze rendus de chauffe puis soixante échantillons de `render + gl.finish`. Les deux sources compilées sont le SHA M25.1 exact et le code final `f56ab29`. Le rendu statique ci-dessous ne mesure pas la totalité de la boucle de jeu ni un GPU physique.

| Profil | M25.1 rendu médiane / P95, ms | M25.2 rendu médiane / P95, ms | Achèvement forcé du graphe, s | Préparation initiale, ms |
| --- | --- | --- | --- | --- |
| eco | 1.70 / 3.00 | 1.80 / 3.90 | 40.21 → 36.20 | 832.9 → 344.5 |
| balanced | 1.60 / 5.20 | 1.80 / 2.70 | 40.70 → 35.01 | 772.4 → 371.9 |
| quality | 1.75 / 3.70 | 1.90 / 3.50 | 39.48 → 35.90 | 935.9 → 467.7 |

L’achèvement forcé est une opération de diagnostic synchrone pour mesurer le coût de calcul restant ; ce n’est pas une durée de gel observée dans le gameplay ordinaire, qui prépare le graphe par tranches. Les 728 accès sont terminés avant les mesures finales du graphe. Il conserve 6 086 nœuds, 22 159 liaisons et six composantes. Les coûts totaux demeurent élevés. La préparation initiale de 345 à 468 ms dépasse l’objectif de 50 ms ; ce budget reste ouvert.

Sur la scène statique Équilibré, la médiane passe de 1,6 à 1,8 ms, soit environ +12,5 %, malgré un P95 inférieur. Cette mesure logicielle courte ne démontre donc pas la cible ≤ +5 %. La matrice appariée complète des huit scènes et du coût isolé du bateau actif reste à établir. Le bateau utilise désormais jusqu’à trois lots réutilisés (coque, pagaie, sac), contre deux auparavant : c’est le coût explicite du sac cohérent et de son transfert unique.

Les films de départ à froid déclenchent l’action alors que le graphe n’est pas prêt. Le callback prend 2,2 ms avant / 2,3 ms après, lecture diagnostique incluse ; ce chiffre n’est ni la durée de déploiement animé ni le temps jusqu’à la fin du graphe. Les six captures natives de démarrage donnent le coût global avec enregistrement et préparation. En Équilibré, leur intervalle inter-images P95 est 953,7 → 454,8 ms ; les longs trajets ont des P95 de 129,7 et 268,4 ms. Ces cadences restent faibles et ne justifient aucune affirmation de fluidité.

Les miroirs CPU des attributs de géométrie passent d’environ 38,97 à 39,51 Mio en Éco/Équilibré et de 40,07 à 40,61 Mio en Qualité. Ils ne représentent pas les allocations du pilote GPU. La collecte native ajoute des cadences, CPU d’animation/collision/audio et mémoire aux traces ; les mesures de démarrage et les longs trajets doivent être lus séparément du rendu statique. Une bonne métrique d’appui n’établit ni le naturel perceptif ni la fluidité matérielle.

## Lecture des preuves et écarts de couverture

Les parcours bateau reprennent les deux corridors locaux admis, avec demi-tours, et non un passage sous pont ajouté. Les 550,2 m excluent déploiement et récupération ; les distances totales d’action sont 557,6 et 558,1 m. L’état bateau dure environ 613 s par film. Les deux retours finissent à pied ; aucune erreur JavaScript, échec de scénario ou double représentation de sac n’est relevé. Les traces enregistrent les poses, la vitesse, la pale et le réseau ; les GeoJSON ne constituent pas des itinéraires de navigation réels.

Le premier film de course de 182 s comprend 147,3 s en activité course, avec arrêts et changements de sens. Il ne satisfait donc pas à lui seul trois minutes de course continue. Son erreur maximale de plante est de 1,82 cm et son glissement maximal de 1,74 cm, sous le seuil annoncé de 3,5 cm pour ce cas. Le film distinct `run-endurance-3min` couvre 192,0 s et 439,1 m sans pause volontaire : 185,7 s **cumulées** en activité course, avec de brefs ralentissements aux raccords et virages ; le plus long segment classé course dure 41,0 s. Le critère strict de 180 s sans aucune transition reste donc ouvert. Son erreur maximale de plante est de 3,86 cm et son glissement de 4,07 cm : le seuil n’est pas respecté sur tout ce trajet. Les films de nage et de reprise près d’un obstacle comportent également des dépassements : erreur de plante jusqu’à 11 cm en sortie, indicateurs de glissement jusqu’à 32,5 cm en pataugeage et 27 cm lors du refus du tronc. Les valeurs après changement d’activité peuvent aussi conserver un diagnostic antérieur ; les maxima bruts hors locomotion (notamment bateau) ne sont pas des glissements de marche. Ces cas restent ouverts et ne sont pas absorbés dans une moyenne favorable.

La promenade sonore continue suit la voie publique entre berge et village, parcourue dans les deux sens. Ses trente contrôles donnent des habitats `built`, `open` et `unknown`, dont vingt-deux avec contexte d’eau. Elle ne traverse pas une forêt ; le trajet forestier de 175 m est une prise distincte de 121 s. Les catégories inconnues restent inconnues.

La prise d’automne depuis la berge est conservée sous `birds-autumn-wood-native` : l’habitat réel y est `wood`, avec oiseaux planeurs, sans oies. La prise `birds-geese-autumn` utilise une prairie réellement classée `meadow`, un support admis, le calendrier de novembre et la fenêtre ordinaire du système ; 530 images de trace incluent la famille `geese`, et le groupe est visible dans le [photogramme natif](mission-25-2-evidence/birds-geese-autumn.png). Aucun individu, habitat ou temps de simulation n’est forcé pendant les films. Les trente dernières secondes de la prise nocturne ne contiennent aucun oiseau rendu. Les destinations de branches et les déplacements sont mesurables, mais la qualité du contact des pattes à l’atterrissage n’est pas prouvée.

Le [test tactile compilé](mission-25-2-evidence/mobile-native.json) utilise de vrais événements CDP à 390×844 : glisser, relâcher et perdre le focus, 3,15 m parcourus ; les boutons d’action mesurent 46 px de hauteur. Le [camp](mission-25-2-evidence/camp-regression-native.json) accomplit deux installations/rangements : la position reste identique lors d’une commande de marche, et la source de feu reste active après 21 s. Cela ne valide pas une promenade avec le feu actif. Aucun téléphone réel ni essai humain n’est remplacé par ces contrôles.

## Validation reproductible

`npm test` : **384 tests réussis, zéro échec** ; `npm run build` : TypeScript et Vite réussis. Journaux : [tests](mission-25-2-evidence/tests.txt), [build](mission-25-2-evidence/build.txt). La référence conserve ses 377 tests verts. Le build final produit un JS de 1 128,5 ko (353,2 ko gzip), avec avertissement Vite de chunk supérieur à 500 ko ; ce budget de chargement reste une dette.

Pour les captures : `node scripts/build-mission-25-2.mjs . work/mission-25-2/compiled`, puis `npx vite preview --host 0.0.0.0 --port 5372 --outDir work/mission-25-2/compiled`. Jeu : `http://localhost:5372/endless-earth/`. Créer le worktree de référence au SHA exact indiqué plus haut, le compiler avec le même script vers `work/mission-25-2/reference-compiled`, puis le servir sur le port 5373. L’instrumentation n’est ajoutée que par ce build diagnostique.

La référence est un worktree détaché au SHA M25.1 exact, compilé avec le même module d’instrumentation explicite. Les preuves utilisent le jeu compilé et sa boucle, ses contrôleurs, ses collisions et son unique AudioContext. Les placements de diagnostic ont lieu avant l’enregistrement ; le pilotage programmé ne fournit que des commandes d’entrée. Ni positions imposées pendant les trajets, ni interpolation des images, ni accélération du temps des films.

La galerie est un fichier autonome : `docs/mission-25-2-evidence/index.html`. On peut aussi servir le dépôt avec `python3 -m http.server 5374 --directory .` et ouvrir `http://localhost:5374/docs/mission-25-2-evidence/index.html`.

Les vidéos originales, traces, SHA-256, mesures compilées, licences et inventaire des fichiers protégés accompagnent la galerie. `node scripts/summarize-mission-25-2.mjs` recalcule l’index et les empreintes. Les commits d’évidence ultérieurs ne changent pas les sources exécutées.

Les modes de `scripts/record-mission-25-2.mjs` sont `short`, `run-continuous`, `wind`, `audio`, `river`, `boat:3`, `boat:5`, `profiles`, `cold-boat`, `camp`, `birds` et `geese-meadow`. Les portraits et le tactile utilisent `scripts/inspect-mission-25-2.mjs` et `scripts/mobile-mission-25-2.mjs`. `scripts/find-mission-25-2-meadow.mjs` recalcule les candidats de prairie depuis les données source inchangées. L’analyse numérique du mix nécessite Python/numpy et ffmpeg : `python scripts/analyze-mission-25-2-audio.py`. Les scripts existants Playwright/Vite et Chromium sont utilisés sans nouvelle dépendance du jeu.

La collecte conserve trois versions explicites du transport natif : tableau d’octets V1, base64 V2, base64 et SHA-256 du Blob navigateur V3. Le module V1 et les bundles exécutés V2/V3 sont archivés. Chaque JSON indique son transport et l’empreinte du Blob lorsqu’elle a été mesurée ; aucune vérification Blob n’est revendiquée pour V1/V2. L’indexation des WebM utilise `ffmpeg -c copy` et vérifie l’identité des paquets vidéo et de leurs timestamps avec l’original conservé dans `raw/`. Aucun son ajouté, aucune normalisation, interpolation ou accélération. Le canvas filmé contient la scène ; les boutons d’interface figurent dans les captures fixes de page.

## Sources et limites connues, dettes ouvertes

Voir [les modèles, animations et licences](mission-25-2-assets-and-licenses.md). Aucun achat, nouvelle dépendance ou asset tiers. Les enregistrements existants conservent les attributions et preuves de licence.

Les défauts géométriques M23, raccords et discontinuités de relief restent ouverts. Aucun pont ni passage sous pont non prouvé n’est rendu navigable. Les sources IGN/ASP/OSM, les voies et les propriétés ne sont pas corrigées arbitrairement. L’Anglin n’a pas de bathymétrie mesurée dans ce jeu ; les profondeurs servent uniquement au gameplay.

Le camp verrouille toujours les déplacements. Aucun éloignement du feu actif n’est prétendu ; la progression spatiale se contrôle avec la rivière et les oiseaux. Les budgets HRTF et de voix sont conservés, sans second mix.

SwiftShader constitue seulement un environnement logiciel de comparaison. Les tests tactiles à 390×844 ne valident ni les performances Android ni une carte graphique réelle. La mémoire des attributs est une estimation par les miroirs CPU, pas une mesure des allocations du pilote GPU. Le tas JavaScript des captures inclut les traces et tampons d’enregistrement ; sa croissance ne mesure pas à elle seule une fuite du jeu. La revue artistique indépendante, l’écoute humaine et les critères subjectifs restent non validés. **La mission n’est pas déclarée terminée.**
