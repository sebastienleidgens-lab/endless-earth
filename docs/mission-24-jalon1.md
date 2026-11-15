# Mission 24 — Un monde vivant, un voyageur crédible

**Travail en cours, PR en brouillon. Mission complète non acceptée.** Ce premier
jalon traite la cause de l’enneigement inversé des branches. Les empreintes,
le chauffage dense du village, l’enrichissement du vent, le nouveau voyageur,
la nage et Camper restent inachevés. Aucune phase A–F n’est déclarée terminée
sur la seule base des tests unitaires.

## Base vérifiée et portée

La PR [#33](https://github.com/sebastienleidgens-lab/endless-earth/pull/33)
est fusionnée depuis le 14 novembre 2026, 21:28:31 UTC. Son dernier commit
`17c45488e7e8eb46ebfc039d0362286e2f72662e` est bien ancêtre du `main`
récupéré : `9716fbb40f59a213107e18c699f4b317da86edf3`.
La branche `mission/24-monde-vivant-voyageur` est créée depuis ce commit,
après vérification distante puis locale. Le checkout initial propre était
encore sur M22 ; il n’a pas servi de base à M24.
Les six commits M23 sont vérifiés dans l’ascendance : `5f78fa38`, `d954452a`,
`bcc5c112`, `3cd2ea37`, `8d9a5ccd`, `17c45488`. Le texte historique de sa PR
mentionnant encore « brouillon » ne remplace pas son statut GitHub fusionné.

Budget supplémentaire **0 €**. Aucun déploiement, aucune fusion, aucun changement
de Living Paintings / LP-01 ni des workflows de production.

## Phase A : inventaire et contrats

AGENTS.md, ADN artistique et rapports M10–M23, y compris les sous-jalons,
sont les références de l’audit. Les propriétaires existants restent prioritaires :

| Chantier | État initial et propriétaire | Prochaine étape nécessaire |
| --- | --- | --- |
| Neige des branches | `forest-model.mjs`, `forest-material.ts`, `snow-state.mjs` ; bois et feuilles fusionnés dans un matériau double face. Winding du bois souvent intérieur, normales radiales extérieures. | Corriger la géométrie et les sémantiques des deux faces ; inspection native des familles/LOD. |
| Empreintes | Le rig publie `motion.footContacts` gauche/droite ; `climate.groundSnowAt` échantillonne l’enveloppe et le grain du dépôt visible. Aucun renderer de traces. | Vérifier les contacts après toutes les corrections IK et grands pas de temps avant projection sur le support M23 ; pool borné, fondu et invalidations. |
| Cheminées | `chimneyCaps` identifie des sorties dans la géométrie existante ; `QuietLife` n’admet que deux foyers occasionnels, pool de 16 puffs soumis au budget global. | Inventaire des bâtiments résidentiels reliés aux sorties ; calendrier déterministe et budget collectif, sans contourner les plafonds par maison. |
| Vent | Champ continu M11, réponse forestière amortie M17, cache M19, racines et pivots conservés ; quatre LOD. | Mesurer le déplacement des charpentières et régler les réponses aux rafales sans dépasser l’enveloppe/les ombres. |
| Voyageur | Rig original de 16 os, petit sac, distance effectivement autorisée, IK et bornes de bassin M23. | Nouveau grand sac et détails originaux, course et transitions, preuves de contact/clipping ; pas de copie de Joel. |
| Eau | Polygones OSM, niveau visuel et champ de courant artistique ; l’eau reste un refus piéton. Aucune bathymétrie fiable chargée. | Provenance du fond et validation des corridors aller/retour avant admission aquatique. Le MNT sous une eau rendue n’est pas un fond mesuré. |
| Camper | Menu et commandes clavier/tactiles existants ; aucune barre d’actions ni transaction de camp. | Validation multi-échantillons, machine d’états unique, placement, animation assise, fondu et nettoyage à prouver sur dix cycles. |

L’inspection du vrai pilote trouve **238 sorties de cheminées géométriquement
identifiées**. Ce nombre ne signifie pas 238 maisons résidentielles éligibles,
ni 238 logements chauffés. L’appariement aux bâtiments et le calendrier de
chauffage dense demandé ne sont pas encore livrés. Aucun nouveau pool par maison.

`scene.userData.climate` est déjà l’équivalent du contrat `environmentState` :
même objet pour graphique et audio, calendrier `naturalSky`, température simulée,
couverture de neige, `groundSnowAt`, heure, météo et vecteur de vent. Aucun second
climat ni nouvelle horloge n’est justifié. L’exposition existante est une
enveloppe approximative, pas une interception feuille par feuille.

Le support reste possédé par `Terrain.supportAt`, `walkingHeight` et les supports
d’ouvrages vérifiés. Les effets visuels n’ajoutent pas de sol physique.
L’extension du joueur devra garder un seul propriétaire marche/course,
aquatique, camping et transition ; aucun nouvel état n’est activé dans ce jalon.

## Défauts M23 conservés

Les raccords hérités de Rue du Pont jusqu’à environ **0,996 m**, les talus bâtis,
les erreurs locales de relief (jusqu’à **11,833 m** dans la comparaison réservée
M23) et les performances restent ouverts. M23 dépasse +5 % dans cinq scènes
Équilibré sur huit, médiane des écarts **+9,11 %**, pire **+16,93 %**.
Le succès d’une traversée ou d’un test de support ne ferme pas ces réserves.
Les sources et géométries géographiques ne sont pas modifiées ici.

## Correction de l’orientation

Le générateur formait les tubes de bois avec une orientation opposée à leurs
normales radiales. Le matériau forestier fusionné est double face ; son éclairage
pouvait donc afficher le bois malgré ce défaut. Le masque de neige multipliait
ensuite toutes les normales par le signe de `gl_FrontFacing` : un dessous vu à
travers le winding intérieur pouvait devenir une surface orientée vers le ciel.

Chaque triangle de tube solide est maintenant orienté dans le sens de la moyenne de ses
normales radiales extérieures, à sa génération. Seul son ordre d’indices change
si nécessaire. Les positions, normales de lissage, racines, articulations,
couleurs, UV, nombres de sommets/triangles et ancrages ne changent pas. Les
rubans ouverts lointains conservent leur ordre : ils ne possèdent pas un volume
fermé avec un intérieur déductible d’une section circulaire.

Le masque utilise les normales extérieures du bois après déformation, matrice
d’instance, matrice normale et retour de la vue au monde. Il ne les retourne plus
selon la caméra. Les feuilles restent des lames minces double face, dont seule
la face supérieure visible reçoit le dépôt. Les autres matériaux conservent
leur règle précédente. Aucun `abs(normal.y)` ni inversion globale des normales.

La gravité reste **−Y monde**, l’accumulation utilise **+Y monde**. Les facteurs
d’inclinaison, exposition, rétention saisonnière/forme persistante, grain,
progression et fonte sont ceux du système existant. Les déformations de vent
continuent à transporter les normales. **Le dépôt reste une couche de couleur
fine : ce jalon ne livre pas de bourrelet géométrique ou d’épaisseur nouvelle.**
L’enrichissement artistique complet demandé pour les rameaux reste à faire.
Le morph statique non linéaire de `forestShape` conserve l’approximation de
normales lissées existante ; ce jalon ne recalcule pas son Jacobien complet.

## Preuves et validation

[Galerie autonome](mission-24-evidence/index-jalon1.html) : **122 captures**, quatre
films natifs, données et limites. **46 paires d’atelier** partagent exactement
caméra et temps de vent, assertion comprise : cinq familles × deux angles ×
deux intensités de vent × avec/sans dépôt, puis trois autres LOD × deux angles.
Les vingt vues rapprochées du pilote, panoramas, stations sèches de M23 et
captures mobiles sont distingués de l’atelier synthétique.

Le contrôle CPU examine **75 556 triangles** proches/intermédiaires sur onze
familles. Le dérivé complet réoriente **75 679 triangles de bois**, y compris
les troncs solides lointains, parmi **177 172 triangles** comparés (bois et
feuilles des trois modèles source). Tous les attributs de sommets et chaque
triplet non orienté restent identiques. Les squelettes, boîtes et cent variantes
de placement sont comparés à la vraie source Git M23. Les indices des rubans
lointains sont inchangés.

La [sonde de rasterisation](mission-24-evidence/branch-raster.json) bascule le
dépôt sans avancer le temps. Un passage diagnostique séparé localise les pixels
de la branche ; les captures conservent le vrai matériau. Un pixel « blanchi »
est éclairci de plus de douze niveaux RGB moyens par le dépôt. Le test exige
plus de mille pixels de branche : une image de ciel vide ne peut pas réussir.

| Famille, vue par-dessous | Pixels blanchis avant | Après |
| --- | ---: | ---: |
| Feuillu étalé | 47,964 % | 0 % |
| Cime haute | 24,297 % | 0 % |
| Ramure retombante | 10,596 % | 0 % |
| Jeune feuillu | 34,415 % | 0 % |
| Conifère | 79,761 % | 0,018 % |

Dans ces cinq sondes, les surfaces supérieures gardent un blanchiment visible
(18,6–64,5 % des pixels) et les silhouettes rasterisées avant/après sont
identiques. Les miettes de pixels du conifère restent mesurées, sans promesse
d’absence de tout défaut partout.

**Limite native LOD :** les gros plans isolés des rubans LOD 2/3 n’ont pas donné
de pixels de branche exploitables dans ce cadrage. Ils sont conservés comme
essais non concluants et ne prouvent ni leur dépôt ni la stabilité de toutes
les transitions. Le LOD 1 est inspecté séparément ; les tests CPU et les panoramas
ne remplacent pas cette validation manquante. La neige sur chaque aiguille et
les dépôts volumétriques de rameaux restent aussi ouverts.

Les trois premiers films montrent une ramure au calme, sous vent fort M11 et
une brève marche réelle dans le pilote. Cette dernière trace contient
**25 frames**, **5,275 m** parcourus et zéro frame invalide au contrôle de
collision. Ce n’est ni une nouvelle promenade de trente minutes ni une preuve
d’empreintes M24. Le quatrième film capture les gestes tactiles du build compilé.
Les quatre films sont entièrement décodés ; FFmpeg ne fait qu’indexer le WebM
par copie de codecs, avec paquets et timestamps identiques aux captures brutes.

**342 tests historiques passent sur la base M23 ; 346 tests passent sur M24,
zéro échec**, avec TypeScript/Vite réussis. Aucun test existant n’est supprimé
ou assoupli. Le premier essai sous sandbox ne remontait que les fichiers de
test, avec des sous-processus Git bridés ; les chiffres ci-dessus proviennent
des réexécutions complètes, avec leurs vrais sous-tests et journaux conservés.
Les quatre nouveaux tests portent sur winding, transformations monde/caméra,
assemblage LOD et composition du masque.

Le smoke du **build compilé**, sans interception de source, couvre chargement,
trois caméras, déplacement, hauteur des yeux, arrêt sans dérive, son et profils.
Le contrôle tactile utilise les événements natifs CDP de Chromium en **390 ×
844** : déplacement, regard, menu, profil et mois, position conservée lors des
réglages, aucun débordement ni erreur JS/WebGL détectée. La galerie est vérifiée
en 1280 × 900 et 390 × 844, images décodées et liens locaux contrôlés.
Les URL `file://` sont bloquées par la politique de ce navigateur géré ; la
galerie statique est vérifiée via HTTP local, sans dépendance au moteur.
**Aucun téléphone Android physique ni GPU matériel n’est mesuré.**

Les **2 898 sondes de collision et vingt déplacements** donnent les mêmes
résultats avant/après. Les stations sèches raccord/talus/pont de M23 restent
dans la galerie. L’audit préserve **608 fichiers** protégés à l’octet près,
dont terrain, collisions, graphes, rig, vent, hydrologie, sons, matières et
workflows. Les deux manifestes de décor renouvellent seulement les empreintes
de transformation runtime après vérification de tous leurs packs et ancrages.

## Performances et ressources

Benchmark isolé : huit scènes × trois profils × deux versions × seize rendus
chauds alternés, **768 échantillons**. Chromium / **SwiftShader logiciel**,
480 × 320, DPR 1, `gl.finish` et lecture d’un pixel ; caméra, date, temps du
vent et couverture de neige sont appariés et vérifiés. Les appels, triangles,
buffers, textures, tas JS et temps de soumission sont dans
[performance.json](mission-24-evidence/performance.json). Ces temps incluent
du travail logiciel et ne séparent pas CPU pur d’un GPU matériel inexistant.

| Équilibré | M23 médiane ms | M24 médiane ms | M24 P95 ms | Écart |
| --- | ---: | ---: | ---: | ---: |
| Village | 320,7 | 333,1 | 408,0 | +3,87 % |
| Pont | 289,0 | 300,7 | 357,9 | +4,05 % |
| Forêt sans neige | 230,6 | 242,5 | 297,2 | **+5,16 %** |
| Rive | 429,3 | 421,6 | 476,8 | −1,79 % |
| Terrain | 237,4 | 236,0 | 266,6 | −0,59 % |
| Route | 303,5 | 294,8 | 352,0 | −2,87 % |
| Nuit | 331,8 | 315,6 | 397,0 | −4,88 % |
| Neige | 214,1 | 244,1 | 286,8 | **+14,01 %** |

**La cible +5 % n’est pas atteinte dans deux scènes Équilibré sur huit.**
La correction ne doit pas être fusionnée sur une prétendue performance validée.
Les dépassements M23 antérieurs demeurent distincts. Les diminutions observées
ailleurs ne démontrent pas un gain général ; le rendu logiciel reste variable.
La cause exacte du surcoût neige n’est pas isolée par ce seul benchmark.

Les appels et triangles soumis sont identiques dans les 24 paires. Aucun nouvel
attribut persistant, texture, géométrie, passe ou pool n’est ajouté au rendu.
Les allocations logiques correspondent dans les scènes neige/forêt ; des
différences de résidence de caches existent dans d’autres scènes et sont
conservées dans les données. Le tas JS n’est pas assimilé à toute la mémoire
native, les buffers GL à de la VRAM physique. Le contrôle d’orientation ajoute
un travail à la création des modèles ; son coût CPU isolé n’a pas été mesuré.

Bundle JavaScript : **1 033 119 → 1 033 806 octets**, soit **+687 octets**.
L’avertissement Vite >500 ko préexistant reste visible. Les médias documentaires
font environ 12 Mo, hors chargement ordinaire du jeu. Aucune nouvelle ressource
de modèle, texture, son ou dépendance ; licences IGN/ASP, OSM, Three.js et assets
antérieurs inchangées et contrôlées par empreintes. Les nouvelles images et
vidéos sont des captures documentaires, pas des ressources du monde.

## Reproduction et inventaire

Le correctif runtime est dans `src/nature/forest-model.mjs` et
`src/nature/snow-state.mjs`. `package.json` sélectionne le rapport M24 ; les deux
manifestes de décor enregistrent le transformateur. Un nouveau fichier de tests,
neuf scripts d’audit/preuve et la galerie complètent cette livraison.
Les [empreintes runtime](mission-24-evidence/runtime-sources.json),
[contrôles et bundle](mission-24-evidence/checks.json) et
[préservation](mission-24-evidence/preservation.json) rendent la portée vérifiable.
L’[inventaire des fichiers](mission-24-evidence/files.json) donne tailles et SHA-256.
Les captures emploient les sources locales M24 modifiées depuis le commit de
base ; aucun identifiant de commit propre fictif n’est inscrit dans les images.

```sh
npm ci
npm test
npm run build
node scripts/prepare-mission-24.mjs
# M23 épinglée dans un worktree séparé, serveur sur 5361 ; M24 sur 5360.
# Build compilé M24 en preview sur 5362.
node scripts/capture-mission-24.mjs
node scripts/verify-mission-24-branches.mjs
# Exécuter ce benchmark seul, sans autre charge graphique :
node scripts/benchmark-mission-24.mjs
node scripts/controls-mission-24.mjs
node scripts/regression-mission-24.mjs
node scripts/report-mission-24.mjs
node scripts/check-mission-24.mjs
```

Chromium, Playwright et FFmpeg sont utilisés localement. Les quatre films bruts
restent sous `work/mission-24/raw` ; les versions indexées et leurs contrôles
sont dans la galerie. Les sondes d’atelier et exportations sont injectées par
le harnais de test, jamais ajoutées à l’interface ordinaire.

## Suite de la mission et acceptation

La PR doit rester en brouillon. Les six autres chantiers et la validation intégrée
complète restent non livrés ; aucun film existant d’une mission antérieure ne
sert de preuve de leur implémentation. La nage ne sera pas ouverte en supprimant
une collision d’eau ou en inventant un fond. Camper ne sera pas affiché tant que
sa validation et sa transaction ne fonctionnent pas de bout en bout.

La revue du propriétaire reste nécessaire pour le naturel de la neige et pour
la mission complète. Aucune validation artistique n’est déduite des compteurs.
