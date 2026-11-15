# Mission 25 — Le voyageur libre (livraison partielle en brouillon)

La nage est ouverte dans l’Anglin du pilote avec un **fond estimé pour le jeu**. Un packraft original peut être sorti depuis une berge compatible, piloté puis rangé après accostage. La locomotion, les poses de nage/pagaie, le repos au sol, le petit saut et l’apparence humide ont évolué. **La mission entière n’est pas déclarée terminée** : la validation artistique demandée, le mobilier d’assise, le franchissement de troncs, les longues navigations et les mesures matérielles restent ouverts.

[Galerie autonome et films](mission-25-evidence/index.html) · [contrôles sur le véritable pilote](mission-25-evidence/runtime-checks.json) · [sources conservées](mission-25-evidence/preservation.json).

## Base, périmètre et conservation

`origin/main` vérifié par `git ls-remote` : `c73ee0748cb51911e919d4f672010ce3e75df360`, fusion de la PR #34. Parents vérifiés : `9716fbb` et `530c45a` ; le dernier commit M24 est dans l’ascendance. Branche créée depuis cette base : `mission/25-voyageur-libre`. AGENTS.md, ADN artistique, missions 22.1/23/24, systèmes et scripts existants ont été examinés.

**658 fichiers protégés identiques** : intégralité de `public/`, `src/world/`, `src/living/` et workflows suivis par l’audit. Les emprises, élévations, ouvrages, graphes, restrictions et données audio source ne changent pas. Les défauts de terrain et limites de performances historiques M23/M24 restent ouverts. Living Paintings / LP-01 n’est pas modifié. Aucun service, clé, modèle ou son acheté ; coût externe supplémentaire : **0 €**. Aucune fusion ni mise en production.

L’audit initial trouve le rig M24 de 2 656 triangles/17 os/un appel et confirme l’absence de provider aquatique. Le premier essai des tests a rencontré des dépendances absentes ; `npm ci --cache /workspace/.npm-mission-25` a rétabli les versions du lockfile sans le modifier. La référence figée M24 passe ensuite **360 tests** ; le candidat passe **369 tests**.

## Eau : contrat des données et admission

`src/player/bathymetry.mjs` conserve séparément les polygones/axes OSM, le support visible M23 et une reconstruction artistique du fond. La distance à la berge augmente progressivement la profondeur par une tangente hyperbolique ; la largeur inférée et une variation spatiale douce bornent le centre. Le fond n’est pas un plan horizontal uniforme. Les trous, surfaces non chargées, ouvrages, obstacles et berges dont les hauteurs ne se raccordent pas restent exclus.

Chaque échantillon expose `source="estimated"`, `confidence="low"`, une provenance textuelle, `surfaceY` et `bedY` dans le même repère local que le support. `reliable` signifie seulement « contrat géométrique utilisable dans cette simulation », **jamais mesure fiable de profondeur réelle**. Aucune donnée ne reçoit `source="measured"`. Les niveaux de station hydrologique ne sont pas utilisés comme profondeurs spatiales. Ce modèle ne prédit ni profondeur, ni débit, ni sécurité, ni autorisation de baignade dans le monde réel.

La surface d’eau existante est opaque et reste inchangée : **aucun nouveau fond visible** n’est dessiné. La collision aquatique emploie le même fond estimé pour les pieds et l’immersion. Les retours vers une sortie géométriquement admise sont contrôlés, les résultats spatiaux sont bornés en cache, et les obstacles sont revérifiés à chaque petit déplacement. La marche M23 et AutoWalk ne reçoivent aucune permission aquatique implicite.

La sélection des accès refuse les appuis manquants, colliders et raccords de hauteur incompatibles. Des réserves supplémentaires excluent les zones privées cartographiées et les seuils/déversoirs OSM. Les ponts sont conservativement fermés à la navigation : la géométrie disponible ne prouve pas la hauteur libre ni tous les appuis sous le tablier. Ce refus local ne ferme plus toute la rivière.

Les trois accès retenus et leurs coordonnées locales exactes sont dans `runtime-checks.json`. Leurs films `anglin-1/2/3.webm` suivent de vraies entrées depuis les berges du polygone OSM, nage, retournement et retour à pied. Le contrôle numérique du même terrain est distinct des films natifs ; aucune rampe synthétique n’est présentée comme l’Anglin.

## Packraft et activités

`PackraftController` possède un objet réutilisé, inertie, freinage, lacet, poussée liée aux phases de rame et contrôle de son encombrement. Les mises à l’eau et rangements suivent des trajectoires continues sur des espaces contrôlés. L’objet se déplie progressivement et le joueur rejoint le siège ; le chemin inverse restitue la marche. Les transitions sont verrouillées et les doubles clics sont refusés. Quinze cycles automatisés sur le pilote vérifient le retour à la marche et la disparition de l’instance visible, sans multiplication.

« Sortir le bateau » apparaît seulement près d’un accès compatible. À bord, « Ranger le bateau » exige une berge atteignable ; en pleine eau, le bouton reste indisponible et précise le motif. « Rejoindre la berge » suit ouvertement le retour admis puis accoste : c’est une assistance de pilotage, sans téléportation. Le clavier et le joystick tactile servent à avancer, virer et freiner. La caméra reste libre. Aucun courant hydrologique n’est inventé.

Le maillage original comprend des boudins arrondis, plancher, siège, équipement rangé et pagaie. Les pièces sont regroupées par matériau en **quatre appels actifs** ; aucun coût de dessin du bateau rangé. Les mains visent les prises de la pagaie par IK ; les rides sont émises près de la pale lorsqu’elle rejoint la surface. Le mouvement secondaire des tubes est discret. Le film prouve une navigation courte et l’accostage, **pas une longue descente de rivière, un passage sous pont ni tous les culs-de-sac**. Le retour cherche actuellement un segment libre direct vers un accès proche ; il ne constitue pas un planificateur aquatique complet autour des méandres. Le dépliage, les accessoires rangés et les matériaux restent stylisés ; l’action des mains sur chaque pli et sangle ainsi qu’un sillage continu de coque ne sont pas finalisés.

Une seule activité publique est active : marche, course, pataugeage, nage, bateau, saut, assise, camp ou transition. Les contrôleurs spécialisés utilisent `PlayerActivity`, sans seconde boucle de joueur. L’AutoWalk est refusé hors marche/course. Camp, nage, saut, assise et embarquement se refusent mutuellement pendant leurs transitions.

| État | Actions admises / refus principal |
| --- | --- |
| Marche/course | Camp avec site complet ; bateau avec accès ; assise avec appui stable ; saut avec trajectoire/atterrissage contrôlés. |
| Pataugeage/nage | Contrôle aquatique ; pas de camp, saut ou embarquement direct. |
| Bateau | Propulsion, virage, dérive ; rangement uniquement près d’une berge ; assistance de retour. |
| Assise | Regard libre et relèvement ; déplacement et autres activités verrouillés. |
| Saut | Trajectoire bornée vers un sol confirmé ; pas d’action concurrente. |
| Camp | Lever le camp ; comportement et ressources M24 conservés. |
| Transition | Requêtes répétées refusées ; progression à temps natif borné, sans minuterie externe. |

## Corps, mouvement et apparence

Rig original étendu à **19 os**, **3 072 triangles proches / 1 536 en Éco ou au loin**, un SkinnedMesh et un matériau. Les niveaux partagent les attributs et changent d’indices ; aucun modèle ni texture image tiers. Bottes/semelles/lacets, mollets/avant-bras, pouces et forme des articulations sont affinés. Les orteils participent au déroulé. Le sac reste ancré au torse, avec une réponse amortie aux changements de vitesse et aux virages.

Le rythme reste déterminé par la distance horizontale effectivement autorisée. La course réduit la durée d’appui, crée une phase aérienne, augmente le retour du genou et coordonne bras, bassin, torse et épaules. Les pieds plantés et l’IK M23 restent prioritaires. Les subdivisions à faible cadence conservent les événements de contact. Les nouveaux tests couvrent 4/8/30/60/120 Hz et une suite irrégulière, pentes/virages/arrêts et absence de contacts à l’arrêt. Le bassin ne doit pas s’effondrer vers une assise involontaire.

Les vues arrière/profil/face/trois-quarts avant/après utilisent mêmes conditions et entrées. Deux comparaisons supplémentaires montrent les axes de pente et d’escalier OSM déjà documentés par M23, avec arrêts et retour. Les contremarches individuelles ne sont pas relevées dans le MNT. Ces prises restent du rendu logiciel à cadence limitée. Elles permettent d’examiner la différence, **sans prouver à elles seules une course « beaucoup plus réaliste » ni valider tous les escaliers et terrains réels**. Une revue artistique humaine à vitesse réelle et au ralenti de lecture est nécessaire. La galerie ne reconstruit pas les captures quand la vitesse de visionnage change.

La nage emploie un corps horizontal, récupération/traction alternée des bras et battements de jambes ; la caméra vise au-dessus de la surface. Les raccords de poses sont amortis. Le sac peut encore masquer une partie de la tête en vue arrière : l’aspect de la nage chargée reste à améliorer. L’eau opaque cache les jambes ; aucune vue sous-marine complète n’est revendiquée. Les sons dédiés aux gestes natatoires et aux impacts de pagaie ne sont pas livrés ; l’ambiance fluviale existante est conservée.

Le saut est volontaire et petit (portée de 0,95 m, durée 0,56 s, gravité 9,81 m/s²), prévalidé sur le support réel et la capsule terrestre. Murs, eau, vide, réception trop haute/basse et supports inconnus restent bloquants. Sa trajectoire reste prévalidée, sans correction directionnelle en l’air. Les petites marches déjà admises restent utilisables. **Le franchissement animé d’un tronc avec hauteur de collider vérifiée n’est pas livré.**

L’assise est actuellement **au sol stable confirmé**, avec descente/relèvement progressifs et regard libre. Le camp garde son état et ses accessoires distincts. Les meubles/rochers ne deviennent pas des sièges sans surface d’assise inspectable : **assise sur banc/rocher non livrée**.

L’exposition consomme le climat M24 : pluie/immersion humidifient, température et vent règlent le séchage ; albédo et rugosité évoluent sur le même matériau. Le dépôt neigeux réutilise le récepteur/exposition M24. Le séchage long est testé automatiquement ; le film de pluie n’en accélère pas artificiellement la durée. Égouttement, neige sous toutes les sangles et salissures de vêtements ne sont pas complètement finalisés.

Les contacts IK confirmés alimentent un pool de marques de boue, poussière et réaction graphique de l’herbe, classés avec le même `footContact` que l’audio. Les matériaux inconnus restent sans effet inventé ; eau/profondeur/appui non confirmé ne produisent pas de traces terrestres. Pool plafonné à 24/64/96 selon profil, une texture procédurale fixe et un appel actif. Deux films reprennent le même chemin avec matériau OSM explicite, à sec et sous pluie simulée, avec capture de la chaîne audio. Les sons et empreintes de neige M24 restent propriétaires de leurs événements. **Les flaques localisées, éclaboussures terrestres et vraie flexion des brins d’herbe ne sont pas livrées** ; les marques présentes sont une interprétation discrète, pas une simulation de végétation.

## Feu, preuves, coûts et reproduction

Le son du feu existant est testé et réutilisé : **aucun doublon ni nouveau fichier audio**. Le premier enregistrement du mix, conservé dans `camp-audio-before.webm`, présente une moyenne de **−61,1 dBFS** depuis la caméra habituelle : le fichier chargé et la voix active ne suffisaient pas à une présence sonore claire. La correction ajuste seulement cette voix spatiale existante : gain **0,18 → 0,62**, distance de référence **1,8 → 3 m**, distance maximale et fondus conservés. Le volume global reste propriétaire du mix.

Source `Campfire.wav`, Defaultv, CC0-1.0 ; transformations et attribution M24 conservées. Le film final `camp-audio.webm` raccorde directement le limiteur de l’AudioContext à MediaRecorder, après interaction et activation du son. Dix cycles et des changements de profil vérifient une voix de feu active puis aucune après rangement. Les niveaux du mix complet avant/après sont dans `audio.json` ; ils ne prouvent pas à eux seuls l’identité d’un son et le film doit être écouté. Le navigateur headless coupe sa sortie matérielle, mais enregistre bien la destination audio. Écoute casque, haut-parleurs et permutations de politiques navigateur/appareils physiques restent ouvertes.

Les **25 films** de la galerie sont indexés WebM par copie de codecs : hashes des paquets vidéo et timestamps comparés aux enregistrements bruts, sans interpolation ni accélération de capture. Un film de contemplation maintient le feu pendant 24 secondes et passe par la fin/reprise du fichier de 18 secondes avant rangement. Les placements diagnostiques entre scénarios sont indiqués. Les traces, échantillons de benchmark et inventaire des sources sont conservés. Aucun film ancien M24 n’est déclaré nouveau film M25.

Les mesures comparatives détaillées sont dans `mission-25-evidence/performance.json` ; le coût de rendu du bateau actif est séparé dans `active-performance.json`. **SwiftShader logiciel, pas GPU physique**. Les scènes et profils sont appariés, caméra/date/climat identiques, vingt échantillons chauds alternés et `gl.finish`. La CPU de contexte est comptée à chaque échantillon (plus souvent que la mise à jour native à 0,3 s), et cette mesure n’inclut pas toute la simulation physique. Les huit scènes Équilibré restent sous +5 % dans cette passe ; ce résultat ne valide pas l’objectif sur un appareil réel. Les limites sont reprises dans la galerie générée depuis les résultats.

Équilibré : médiane des écarts **+0,52 %**, pire scène **pont +4,18 %**. En Éco, `terrain` dépasse +5 % ; en Qualité, `pont` et `foret` le dépassent. Le coût isolé du bateau actif en Équilibré passe de **186,6 à 213,1 ms (+14,2 %)**, avec quatre appels et 744 triangles supplémentaires : **réserve ouverte**, malgré l’absence de dépassement des scènes ordinaires. Les autres profils présentent une dispersion logicielle qui ne permet pas d’attribuer précisément tout l’écart à un seul effet. Les échantillons et allocations logiques restent disponibles ; il ne s’agit pas de VRAM physique.

Les empreintes du candidat mesuré sont conservées dans `benchmark-runtime-sources.json`. La calibration finale de l’assise au sol, du gain du feu et du texte d’approche de berge intervient ensuite ; ces branches ne sont pas actives dans les échantillons chiffrés (poses marche/bateau, son du camp inactif, pas de rendu du DOM d’actions). Les hashes finaux sont séparés dans `preservation.json`.

Chargement local jusqu’au même état prêt/éclairage : **7 004,7 → 6 828,9 ms**, une ouverture par version, caches serveur/dépendances possiblement chauds ; aucune extrapolation à Internet ou Android. Bundle JS compilé : **1 065 374 → 1 091 551 octets**, gzip **329 768 → 339 480**. Détail et méthode dans `loading.json` ; provenances de tous les ajouts dans [mission-25-assets.md](mission-25-assets.md).

```sh
npm ci --cache /workspace/.npm-mission-25
npm test
npm run build
npm run dev -- --port 5360
# Dans un second terminal, construire la référence M24 figée :
mkdir -p work/mission-25
git archive c73ee0748cb51911e919d4f672010ce3e75df360 src public fixtures index.html vite.config.ts tsconfig.json package.json package-lock.json build | tar -x -C work/mission-25
ln -s ../../node_modules work/mission-25/node_modules
# Lancer Vite depuis work/mission-25 sur 5361, puis les scripts depuis la racine.
node scripts/capture-mission-25.mjs water
node scripts/capture-mission-25.mjs locomotion
node scripts/capture-mission-25.mjs interactions
node scripts/capture-mission-25-terrain.mjs
node scripts/capture-mission-25-ground.mjs
node scripts/mobile-mission-25.mjs
node scripts/regression-mission-25.mjs
node scripts/benchmark-mission-25.mjs
node scripts/benchmark-mission-25-active.mjs
node scripts/preserve-mission-25.mjs
# Jeu : /endless-earth/ ; diagnostic : ?perf=1
# Galerie : /endless-earth/docs/mission-25-evidence/index.html
```

## Matrice d’acceptation

| Exigence | État | Preuve / réserve |
| --- | --- | --- |
| A — Nage sur l’Anglin avec estimation explicite et trois retours | **Atteint pour les trois accès filmés** | Films natifs et routes du pilote ; pas de connaissance des profondeurs réelles. |
| A — Continuité, obstacles et traitement exhaustif des rives | **Partiellement atteint** | Supports/obstacles contrôlés, nombreux refus locaux ; couverture complète non prouvée. |
| A — Finition des poses et sons de nage | **Partiellement atteint** | Corps horizontal et caméra corrigée ; sac à améliorer et sons de gestes dédiés absents. |
| B — Sortie, pilotage et rangement du packraft | **Partiellement atteint** | Cycle jouable et filmé, quinze cycles automatisés ; geste de dépliage détaillé, longues routes et ponts ouverts. |
| C — Course visiblement très naturelle sur tous les cas demandés | **Partiellement atteint** | Refonte, quatre angles et comparaisons pente/escalier ; revue humaine, couverture exhaustive et matériel manquants. |
| D — Marche/IK et adaptation au relief | **Partiellement atteint** | M23 préservé, tests multi-cadences ; couverture visuelle exhaustive non réalisée. |
| E — Petit saut volontaire | **Partiellement atteint** | Réception contrôlée, refus et film sur sol réel ; pas de correction en l’air. |
| E — Enjambement de troncs/obstacles avec geste adapté | **Non atteint** | Pas de hauteur fiable du collider permettant une admission supplémentaire. |
| F — Assise au sol | **Atteint** | Support stable, transitions, camp distinct ; film natif. |
| F — Bancs et rochers | **Non atteint** | Aucun siège inventé sur une géométrie absente. |
| G — Humidité/séchage, neige et salissures complètes | **Partiellement atteint** | Apparence partagée et tests ; égouttement/masques fins et film complet de séchage manquants. |
| H — Silhouette enrichie, rig et LOD | **Partiellement atteint** | 19 os, 3 072/1 536 triangles, mains IK et bottes ; visage/équipement encore stylisés. |
| I — Interactions de sol | **Partiellement atteint** | Pool de contacts, boue/poussière/herbe et neige conservée ; flaques et vraie réaction végétale non livrées. |
| J — Crépitement existant et cycles | **Partiellement atteint** | Sortie audio native et dix cycles ; casque/stéréo, reprise audio dans tous les navigateurs/appareils physiques non validés. |
| K — État unique et conservation des sources | **Atteint dans le périmètre livré** | Tests d’exclusion, 658 fichiers protégés identiques, aucune dépendance ou donnée source modifiée. |
| L — Tous les films, mesures matérielles et validation artistique | **Partiellement atteint** | Preuves natives locales et benchmark logiciel ; matrice complète de films longs et appareil réel absents. |

La PR doit rester en brouillon. Ces réserves sont des travaux ouverts, pas une demande d’accepter silencieusement des critères bloquants manquants.
