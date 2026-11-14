import pathlib,json,statistics
root=pathlib.Path('docs/mission-23-evidence')
def load(name):
 p=root/(name+'.json');return json.loads(p.read_text()) if p.exists() else None
source=load('source-audit');prep=load('surface-preparation');network=load('network-audit');geometry=load('geometry-after')['reports'][0];performance=load('performance');walk=load('walk');native=load('routes-native');bridge=load('pont-native');mobile=load('mobile');inspection=load('inspection');preservation=load('preservation');determinism=load('determinism')
def walk_text():
 if not walk:return 'Mesure native prolongée en cours ; aucune durée validée à ce stade.'
 return f"**{walk['wallSeconds']:.3f} s réelles, {walk['nativeSeconds']:.3f} s natives, {walk['metres']:.2f} m, {walk['frames']} frames**. Trois profils et trois vues ; montées/descentes, arrêts/reprises, course au clavier, AutoWalk, forêt, terrains ouverts, pluie, neige et nuit. Erreurs JS : {len(walk['errors'])}, erreurs GL : {len(walk['glErrors'])}, frames de collision invalide : {walk['invalidCollisionFrames']}, écart maximal au support : {walk['maxGroundErrorM']:.6f} m. Cadence instrumentée SwiftShader, médiane / P95 / pic : {walk['frameMs']['median']:.1f} / {walk['frameMs']['p95']:.1f} / {walk['frameMs']['peak']:.1f} ms. Les travaux de validation concurrents et la lecture des pixels font partie de cette mesure ; elle n’est pas le benchmark isolé. Les sources sont vérifiées inchangées : {len(walk['changed'])} différence(s)."
perf_table='Campagne appariée en cours.'
perf_summary='Mesure non terminée.'
perf_attained=False
if performance:
 rows=performance['rows'];balanced=[r['regressionPercent'] for r in rows if r['profile']=='balanced'];perf_attained=all(x<=5 for x in balanced)
 perf_summary=f"Objectif de +5 % en Équilibré : **{'atteint' if perf_attained else 'non atteint'}**. {sum(x>5 for x in balanced)}/{len(balanced)} scènes dépassent ce seuil ; médiane des écarts {statistics.median(balanced):+.2f} %, pire cas {max(balanced):+.2f} %. Ces rendus logiciels ne permettent pas de conclure sur Android. Le relief fin ajoute des triangles et le support exact ajoute du travail CPU ; la simplification des arêtes a déjà réduit de 22 606 faces le premier candidat. Les résultats initiaux restent archivés séparément."
 perf_table='| Scène | Profil | M22.1 médiane ms | M23 médiane ms | Écart | P95 M23 ms |\n| --- | --- | ---: | ---: | ---: | ---: |\n'+'\n'.join(f"| {r['station']} | {r['profile']} | {r['before']['medianMs']:.1f} | {r['after']['medianMs']:.1f} | {r['regressionPercent']:+.2f} % | {r['after']['p95Ms']:.1f} |" for r in rows)
native_text='Contrôles natifs complémentaires en cours.'
if native:native_text='\n'.join(f"- **{r['name']}** : {r.get('wallSeconds',0):.2f} s, fin atteinte : {r.get('finished')}, frames invalides : {r.get('invalid')}, écart support : {r.get('maxSupportErrorM',0):.6f} m." for r in native['reports'])
bridge_text='Traversée native complémentaire en cours.' if not bridge else f"Traversée native aller/retour : **{bridge['wallSeconds']:.3f} s**, fin atteinte : {bridge['finished']}, {bridge['invalidFrames']} frame(s) invalide(s), écart support maximal {bridge['maxSupportErrorM']:.6f} m. Un seul placement initial sur l’axe source ; le script règle le cap, les déplacements utilisent W puis Shift+W. [Film](mission-23-evidence/pont-native.webm) et [trace](mission-23-evidence/pont-native.json)."
mobile_text='Validation tactile en cours.' if not mobile else f"Chromium tactile **390 × 844** : déplacement réel de **{mobile['metres']:.3f} m**, regard, menu et profil ; débordement horizontal : {mobile['menu']['overflow']}, erreurs JS : {len(mobile['errors'])}. [Mesure et film](mission-23-evidence/mobile.json). Aucun appareil Android physique disponible."
text=f'''# Mission 23 — La vérité du terrain

Branche `mission/23-verite-du-terrain`, depuis le `main` vérifié
`6b17ce324319716cb15859d2195bd5362f603fbe`, fusion de la Mission 22.1 par
la PR #32. [PR #33 en brouillon](https://github.com/sebastienleidgens-lab/endless-earth/pull/33).
Budget supplémentaire : **0 €**. Aucune fusion, aucun déploiement, aucun
changement de Living Paintings / LP-01. Un seul jalon autonome.

**La validation complète des sept captures n’est pas atteinte : leurs originaux
ne sont pas joints.** Les réparations et preuves ci-dessous concernent des
zones effectivement auditées, sans prétendre retrouver ces sept caméras.
[Galerie native](mission-23-evidence/index.html).

## 1. Les sept captures du propriétaire

Seul `Texte collé.txt` était fourni. Aucun original n’a été retrouvé dans les
pièces jointes ou le dépôt. Les horaires **18.32.44, 18.28.25, 18.24.18,
18.21.43, 18.21.13, 18.21.00, 18.15.17** ont chacun une fiche explicite dans
[owner-cases/cases.json](mission-23-evidence/owner-cases/cases.json).
Symptôme propre à l’image, géométrie candidate, matériau, caméra, coordonnées
et cause restent inconnus ; reproduction et correction restent `false`.
Les descriptions générales du texte ne sont pas attribuées arbitrairement
à un horaire. Aucune capture n’est présentée comme corrigée.

## 2. Inventaire géométrique et chaîne complète

Lecture d’AGENTS.md, de l’ADN artistique, des rapports 12–22.1 et des parties
géographiques, collisions, locomotion, budgets et chargements associées.
Les scripts et contrats historiques de préparation sont conservés.

| Étape | Propriétaire et risque de divergence |
| --- | --- |
| Source | Grille IGN API à 10 m, MNT LiDAR HD à 0,5 m, OSM ; repère X est/Z sud, IGN69. Le raster fin et la grille grossière n’ont pas la même résolution. |
| Préparation | `prepare-road-surface`, raffinement M14, sous-sol des ouvrages, correction M16/M22.1 puis dérivé M23 lié aux empreintes. Les anciens dérivés restent des replis. |
| Triangulation | Diagonale commune de grille, Delaunay local, partition routes/eau, quantification Float32 ; les résidus de découpe peuvent devenir dégénérés ou inversés. |
| Rendu | Un maillage terrain/routes/eau par tuile, ouvrages séparés et LOD fins/lointains. La neige et les matières ne déplacent pas les sommets. |
| Support | Anciennement exact seulement dans les limites de correction locale, puis retour à `sampleGrid`. M23 indexe tous les triangles visibles admis, sans copier leurs sommets. |
| Collision | Capsule de 30 cm, emprises OSM, murs patrimoniaux, eau, accès et garde-corps documentés. Les toitures ne sont pas des sols admis. |
| Navigation | Axes OSM et règles d’accès inchangés ; validation des segments dans les deux sens avec le vrai noyau. Aucun passage ni sommet de connexion inventé. |
| Animation | Racine au support commun ; pieds à portée de jambe, repos recentré, bassin borné. Un ancien appui hors de portée ne doit pas abaisser tout le squelette. |

Avant : **130 673 triangles fins**, dont 13 dégénérés et 10 inversés dans le
dérivé actif. Après : **{geometry['fine']['triangles']} triangles fins**, zéro
face dégénérée/inversée, zéro sommet hors emprise de tuile dans l’audit.
{prep['removedInvalid']} résidus de quantification sont retirés, pour
{prep['removedAreaM2']:.9f} m² projetés. Les fortes pentes ne sont pas supprimées.
[Inventaire avant](mission-23-evidence/geometry-before.json),
[après](mission-23-evidence/geometry-after.json).

## 3. Sources de hauteur et contrat commun

Chaque résultat détaillé fournit identifiant tuile/face, catégorie, hauteur,
normale, pente, géométrie, support, restriction, priorité, provenance,
empreintes et confiance. Les catégories terrain/route/eau restent distinctes.
L’eau n’est pas praticable ; un tablier validé possède un propriétaire séparé
au-dessus du terrain. Un toit n’est jamais sélectionné comme support piéton.
Les limites de précision source sont indépendantes de l’accord numérique rendu/support.

`Terrain.supportAt`, `walkingHeight`, `inspectCollision` et `inspectGround`
réutilisent les fournisseurs et buffers du monde. Le MNT reste consultable
comme référence de préparation, sans remplacer silencieusement un trou du
maillage actif par un ancien plan physique invisible.

## 4. Diagnostic des triangles aberrants

L’audit parcourt tous les triangles fins/lointains des quatre générations
historiques, puis le nouveau dérivé. Aire, orientation, normale géométrique,
allongement, dénivelé, cellule, emprise, matériau, eau, source et écart au
référentiel sont conservés. Une face de 20–30 m de dénivelé issue de la grille
grossière n’est pas automatiquement une erreur : certaines falaises sont réelles.
Les suspicions sont classées et gardées dans les JSON, sans filtre de pente destructeur.

Les points hauts/bas du MNT à 10 m peuvent produire de grands plans artificiels
entre échantillons ; l’absence de résolution fine autour d’une rupture demeure
une limite. Les résidus inversés observés sont confirmés comme défauts de
topologie quantifiée, sans les assimiler aux triangles blancs des images absentes.

## 5. Grandes géométries : réparation à la source

**Neuf dalles IGN officielles** déjà référencées sont récupérées sans API payante,
avec leurs SHA-256 bruts inchangés. Acquisition 9 avril 2023, édition 24 janvier
2025, Lambert-93/IGN69, Licence Ouverte 2.0. Aucun nouveau nuage de points ou
relevé centimétrique n’est revendiqué.

Les **40 000 cellules** du pilote sont comparées au raster natif sur 16 sondes
par cellule. Une sélection fondée sur le dénivelé natif et l’erreur par rapport
à la grille prépare **{source['repairedCells']} cellules**, soit 75 800 m².
Les routes, bâtiments, patrimoine, eau et marges sont protégés. Les sommets
intérieurs sont confrontés au MNT ; les coins ne changent que si leurs quatre
cellules incidentes participent. Les limites extérieures restent raccordées.
Les arêtes partagées sont déterministes et simplifiées à 0,25 m de résidu.

Sur des points réservés à la validation, distincts des nœuds de construction :
erreur moyenne **{source['before']['meanAbsoluteM']:.3f} → {source['after']['meanAbsoluteM']:.3f} m**,
P95 **{source['before']['p95AbsoluteM']:.3f} → {source['after']['p95AbsoluteM']:.3f} m**,
maximum **{source['before']['maxAbsoluteM']:.3f} → {source['after']['maxAbsoluteM']:.3f} m**.
Le maximum restant aux raccords conservés interdit de revendiquer un relief
globalement exact. La scène nord-ouest montre la reconstruction native ; le
talus bâti protégé reste une limite visible. Aucun rocher, brouillard, texture
uniforme ou réduction de distance ne sert à cacher ces défauts.

## 6. Terrain visible et support physique

L’index réutilise les Float32/indices du rendu. Des sous-cellules sont préparées
uniquement dans les zones denses ; les triangles grossiers ne sont pas dupliqués
sur une grille fine globale. Stockage des références : **{network['index']['bytes']} octets**,
sans nouvelle copie des sommets. Les réparations restent exactement au même LOD
fin à distance. Autour de la caméra et du joueur, le mécanisme existant conserve
la représentation fine ; la physique reste indépendante des changements de profil.

Le test exhaustif des centres de triangles vérifie l’accord du support avec le
maillage à moins d’un millimètre numérique. Cette concordance ne mesure pas
l’exactitude absolue du paysage. Les trous et surfaces non admises restent des refus. Les falaises naturelles sont aussi contrôlées transversalement, avec leur normale exacte et l’amplitude locale sur 60 cm ; une petite bordure biseautée reste franchissable. Les classes de route et d’escalier cartographiées gardent leur politique directionnelle documentée : une forte normale du MNT grossier ne suffit pas à annuler un escalier.

Hors des cellules réparées, les anciens LOD lointains conservent leur tolérance annoncée de 0,35 m. Cette approximation n’est pas une concordance centimétrique à distance ; le retour au maillage fin intervient autour de la caméra et du joueur avant tout contact.

## 7. Audit des collisions invisibles

**{network['samples']} sondes d’axe**, pas maximal 25 cm, et
**{network['segmentsDirected']} parcours dirigés** sont contrôlés sur les
segments OSM admissibles dans le pilote. Avant/après :
**{network['acceptedBefore']} / {network['acceptedAfter']} parcours physiquement achevés**.
Aucun nouveau segment n’a été inventé pour changer ces comptes.

Les refus échantillonnés sont attribués à bâtiments, accès, eau, maçonnerie
patrimoniale, garde-corps ou pont non validé. Aucun collider injustifié n’est
confirmé dans cette matrice ; cela ne prouve pas l’absence de tout obstacle
invisible dans des images ou positions inconnues. Les formes et identifiants
du collider sont maintenant inspectables. Les collisions légitimes sont conservées.

## 8. Contrôleur de terrain

Le balayage garde ses sous-pas de 10 cm, sa capsule de 30 cm et ses limites de
pente **0,7**, ou **1,2** sur les escaliers documentés. La marche maximale reste
**18 cm** : le contrôleur distingue le dénivelé du raccord de la progression
déjà effectuée sur la pente du palier. Cette séparation corrige un refus qui
variait avec la cadence ou la diagonale. La régression de la capsule future est également corrigée : un cas synthétique s’arrêtait à 0,40 m avant une marche alors que la capsule pouvait atteindre 0,60 m ; la marche est maintenant atteinte sans traverser le mur. La pente du palier est estimée seulement dans la partie libre, sans ajouter une seconde capsule au-delà de la cible. Le test M16 correspondant, qui imposait l’ancien arrêt anticipé, conserve ses cas mur/falaise et vérifie désormais la vraie limite du corps.

Une rampe durablement trop raide,
un mur, une grande rupture et un support inconnu restent bloquants.

Un petit cache de seize coordonnées exactes réutilise accès/support/pente
pendant un sous-pas. Il est réinitialisé avec la topologie ; aucune quantification
ne peut déplacer une limite de mur ou de tablier.

## 9. Montées et descentes

Tests en montée/descente, diagonale, 30/60/120 Hz, temps irréguliers et frames de
250 ms. Les mouvements suivent le support après acceptation. La descente
n’autorise pas de saut dans un vide ou de franchissement artificiel d’une falaise.
Le contrôleur ne possède pas une nouvelle simulation de chute ou de saut.

## 10. Escaliers, marches et bordures

Les petites marches, raccords inclinés, escaliers synthétiques, ruptures répétées
et fortes rampes sont séparés dans les tests. Le réseau réel comprend des axes
OSM `steps` : les parcours natifs utilisent leur support effectivement chargé.
Le MNT ne constitue pas un relevé de chaque contremarche. Les contraintes d’accès
des escaliers restent celles des sources ; aucun escalier décoratif n’est inventé.

## 11. Posture du promeneur

L’audit retrouve une cause reproductible dans le rig : un pied planté loin après
une course, un virage ou une frame lente pouvait abaisser le bassin pour rester
atteignable ; au repos seul Y revenait au sol. Les pieds reviennent désormais
à une position neutre en X/Z, les appuis hors de portée sont replacés sur un
support proche avant l’IK et le bassin reste entre 0,72 et 0,91 m dans ce rig.
Une hauteur inconnue ne devient pas une cible de jambe aberrante.

Les tests existants de semelle/appui à 4/8/30/60 Hz restent conservés et passent.
Une première tentative de simple borne de bassin a révélé une semelle hors cible
en course à 8 Hz ; le replacement préalable du contact corrige ce problème.
Le lien avec la capture assise absente reste **non établi**.

## 12. Objets et supports

La racine du joueur, les habitants, véhicules, animaux et placements runtime
réutilisent le fournisseur chargé. Les pieds de fondation gardent leur correction
bornée ; emprises, ouvertures et hauteurs architecturales ne sont pas déplacées.
Les détails naturels préparés reçoivent, une seule fois lors de leur installation,
le delta entre leur ancien support et le nouveau maillage. Leur préparation est
découpée en tranches de 1 024 sommets. Les formes surplombantes ne sont pas classées
comme des flottements sur la seule base de leur boîte englobante.

L’identification sémantique individuelle de chaque herbe, pierre, racine, lanterne
ou détail fusionné n’existe pas dans les anciens packs. Leur contact exhaustif
reste une limite ; aucun objet n’est supprimé pour masquer son ancrage.

## 13. Ancrage des végétaux

Les **2 500 identités initiales et 1 389 ajouts forestiers** sont conservés,
avec X/Z, échelle et catégories d’origine. Les packs sont validés avant toute
adaptation d’altitude. Arbres et sous-bois interrogent le sol actif ; changer
de LOD, de mois ou de neige ne change pas leurs coordonnées physiques.
L’inspection native trouve **165 altitudes adaptées**, zéro support inconnu et **0 m** d’écart aux 3 889 points d’ancrage. Les racines restent une géométrie artistique simplifiée, pas une fouille du sol.

## 14. Routes

Les axes, largeurs, classes, droits d’accès et surfaces routières précédentes
restent conservés. La Rue du Pont et le tablier gardent leur reconstruction
M22.1 et leurs fournisseurs exacts. La mission ne reconstitue pas une route
absente et ne remplace pas une restriction privée par une voie publique.

## 15. Raccords et pont

Les minuscules faces invalides de quantification sont éliminées du nouveau
dérivé, y compris celles de l’eau ; aucune paroi de forte pente valide n’est
retirée sur ce critère. Le sous-sol ne reprend pas une ancienne rampe au-dessus
du tablier. Les tests M22.1 de la Rue du Pont et des garde-corps restent présents.

{bridge_text}

## 16. Textures et matériaux

Atlas, UV métriques, affectations de matériaux, albédo de façade, filtres et
mipmaps restent ceux des missions précédentes. Les normales du dérivé réparé
sont régénérées sur sa vraie géométrie. Le décodeur vérifie les types des
attributs/indices et l’orientation des faces du nouveau dérivé. Aucun shader
de camouflage ou nouvelle palette n’est ajouté. Les triangles blancs des
sept images ne peuvent pas recevoir de cause certaine sans leurs originaux.

## 17. Avec et sans neige

**24 paires**, 12 stations : pont, Rue du Pont, rue/façade, forêt, berge,
pente, château, talus, relief nord-ouest, raccord, objets et vallée.
Caméra absolue, heure, date, profil Équilibré et résolution 960 × 600 sont
appariés avant/après. Le dépôt est verrouillé à 0 puis 1 en mode diagnostic
pour empêcher une neige résiduelle de fausser le cas « sans neige ».
La neige ne déplace aucun sommet ou collider. Exposition et éclairage sont
recalculés sur le vrai nouveau maillage ; les anciens dérivés incompatibles
ne sont pas simplement réétiquetés. Les scènes manquantes du propriétaire
ne sont pas remplacées par ces stations.

## 18. Audit géographique général et navigation

La sélection couvre tout le pilote et respecte les exclusions spatiales.
Les graphes publics gardent **916 nœuds / 893 arêtes** pour la marche et
**1 103 / 1 106** pour les destinations, comme la référence M22.1.
Ils sont régénérés avec contrôle bidirectionnel par le vrai moteur et liés
aux nouvelles empreintes. Les habitants réutilisent les corrections de
support et du noyau qui leur sont applicables ; leurs règles d’admission
particulières restent conservées.

## 19. Diagnostic de blocage et export

Uniquement avec `?perf=1`, le menu propose **Inspecter le terrain**, **Inspecter
le dernier blocage** et **Exporter le diagnostic**. Activer l’inspection, fermer
le menu, cliquer sur une face puis rouvrir le menu pour lire/exporter.
La sélection montre face, sommets, normale, LOD, matériau, provenance, support
et collider ; le dernier refus inclut position précédente/demandée/autorisée,
direction, vitesse, dénivelé, pente et règle exacte. Les lignes affichent le
collider et les trajectoires. Export JSON local seulement, sans télémétrie externe.
L’interface ordinaire ne reçoit pas de panneau technique permanent.

## 20. Benchmarks

Chromium / **SwiftShader logiciel**, 480 × 320, DPR 1 ; huit scènes × trois
profils, seize échantillons alternés appariés par cas/version après chauffe,
caméra/temps/météo/lumière identiques, synchronisation `gl.finish`. Aucune autre
campagne graphique pendant ce benchmark. CPU support/collisions/mouvement,
allocations logiques, appels, triangles, tas et démarrages locaux sont conservés
dans [performance.json](mission-23-evidence/performance.json). Les allocations
WebGL instrumentées ne sont pas de la VRAM physique ; les démarrages de
développement ne sont pas un débit Internet ou une mesure Android.

{perf_table}

{perf_summary}

## 21. Parcours physiques et films complémentaires

Matrice des axes : pont, rue, chemin étroit, raccord, pentes et escaliers
documentés, dans les deux sens. Les autres traversées du territoire se trouvent
dans la promenade et les stations visuelles ; aucune caméra fixe n’est présentée
comme un parcours physiquement accompli.

{native_text}

Les scénarios sont distincts de la promenade principale. Les films sont issus
du canvas et de l’AudioContext natifs ; MediaRecorder puis indexation WebM sans
création d’images ni accélération. Les sources brutes restent dans `work/`.

## 22. Promenade native prolongée

{walk_text()}

Un premier lancement de scénario est resté immobile après une course manuelle au cap constant, puis a été écarté ; il ne sert pas de preuve de trente minutes. Le scénario final suit les sommets source pendant cette séquence au clavier. Un lancement exploratoire ultérieur a été interrompu volontairement avant la correction finale de capsule ; aucune de ses minutes n’est ajoutée à la session finale.

La couverture réelle est vérifiable dans [walk.json](mission-23-evidence/walk.json)
et sa trace. La traversée du pont est une session complémentaire explicitement
séparée : elle n’est pas revendiquée dans les trente minutes si la trace ne la
contient pas. Les redémarrages d’AutoWalk partent de la même position ; aucune
téléportation de réparation n’est autorisée. Une immobilisation n’est pas
convertie en distance parcourue. Les refus et phases actives sont conservés
pour rechercher des arrêts prolongés.

## 23. Compatibilité mobile

{mobile_text}

## 24. Tests, préservation et reproduction

**342 tests Node réussis, zéro échec**, TypeScript/Vite réussis sur le candidat
runtime. Les contrôles finaux et journaux sont archivés avec la livraison.
Les nouveaux tests couvrent chaque centre de triangle actif, orientation,
LOD, sources, trous, eau, superpositions, types, marches selon la cadence,
refus légitimes, navigation bidirectionnelle et repos du rig. Les tests
historiques restent présents, y compris appuis à cadence très basse. Une assertion M16 qui imposait précisément l’arrêt anticipé erroné devant une bordure est corrigée pour exiger la progression jusqu’à la vraie limite ; les cas de mur, falaise et pente restent bloquants et testés.

Les fichiers IGN/OSM, raffinement antérieur, ouvrages et assets audio historiques
restent inchangés. Les anciens packs de décor restent disponibles ; seuls leurs
contrats de transformation runtime et les caches effectivement régénérés évoluent.
L’éclairage, soleil, Lune, météo, familles, voitures, son, profils adaptatifs et
commandes gardent leurs propriétaires. Aucune nouvelle fonctionnalité artistique.
Le bundle conserve son avertissement Vite de taille supérieur à 500 ko.

```sh
npm ci
npm test
npm run build
npm run dev -- --port 5373
# Jeu : /endless-earth/?perf=1
# Galerie : /endless-earth/docs/mission-23-evidence/index.html
python scripts/fetch-mission-23-mnt.py
# Python : numpy, rasterio, pyproj, scipy, shapely
python scripts/prepare-mission-23-terrain.py
node scripts/prepare-mission-23-surface.mjs
node scripts/prepare-mission-23-bindings.mjs
node scripts/prepare-mission-23-graph.mjs
node scripts/prepare-mission-23-light.mjs
node scripts/prepare-mission-23-snow.mjs
node scripts/audit-mission-23-traversal.mjs
```

Pour la référence, `git archive 6b17ce3` de src/public/build/config/package
dans `work/mission-23/base`, dépendances communes, Vite 5371. Captures via
`capture-mission-23.mjs before/after`, benchmark isolé via `bench:mission-23`.
La promenade utilise une copie **figée** du candidat servie sur 5375 ; les
empreintes sont vérifiées avant/après. Les scripts ne fusionnent ni ne déploient.

## 25. Limites et tableau d’acceptation

Les sept originaux manquent. Certains raccords conservent plus de onze mètres
d’erreur locale au raster natif ; les zones bâties/protégées et les formes
2,5D sans surplomb ne deviennent pas un relevé fidèle par un succès numérique.
La scène du talus protégé reste clairement visible et n’est pas déclarée corrigée.
L’audit des axes ne prouve pas l’absence de tout obstacle hors réseau. Le contact
de chaque objet fusionné et la beauté sur appareil physique restent à vérifier.

| Objectif | État | Preuve et limite |
| --- | --- | --- |
| Sept captures originales retrouvées, reproduites et corrigées | **Non atteint** | Originaux absents ; sept fiches honnêtes, aucune caméra inventée. |
| Audit systématique des maillages et du territoire | **Atteint** | Quatre générations, fin/lointain, 40 000 cellules et neuf dalles source. |
| Réparation des grandes approximations géométriques | **Partiellement atteint** | 758 cellules confrontées au MNT, rendu natif ; limites protégées et erreurs de raccord restantes. |
| Suppression des faces invalides confirmées | **Atteint** | 23 résidus, aucune face dégénérée/inversée du nouveau dérivé ; pas de suppression par pente. |
| Concordance visible/support, ponts et LOD | **Atteint** | Buffers partagés, propriétaires explicites, trous conservés, tests exhaustifs et parcours natifs. |
| Suppression de tous les obstacles invisibles du propriétaire | **Partiellement atteint** | Audit attribué et diagnostics livrés ; aucune association possible aux positions absentes. |
| Locomotion pentes/marches et protections légitimes | **Atteint** | Cadences, diagonales, descentes, ruptures, murs/eau et marches ; seuils conservés. |
| Suppression de la posture anormale de la capture | **Partiellement atteint** | Cause de rig reproduite et corrigée en tests ; lien avec cette capture non établi. |
| Arbres et objets ancrés | **Partiellement atteint** | 3 889 identités conservées et supports adaptés ; contact exhaustif des détails fusionnés non démontré. |
| Raccords et triangles blancs des images | **Partiellement atteint** | Topologie invalide nettoyée ; cause des pixels des originaux inconnue. |
| Neige sans nouvelle géométrie et comparaisons natives | **Atteint** | 24 paires appariées, exposition réellement recalculée. |
| Navigation et habitants | **Atteint** | Graphes physiques régénérés, comptes conservés, support commun et noyau partagé. |
| Objectif de +5 % Équilibré | **{'Atteint' if perf_attained else 'Non atteint'}** | Matrice logicielle détaillée ; dépassements mesurés et expliqués, aucun GPU physique. |
| Parcours natifs et promenade de trente minutes | **{'Atteint' if walk and walk.get('passedMinimumThirtyMinutes') else 'Non atteint'}** | Durées et couvertures réelles dans les traces ; pont complémentaire distingué. |
| Tactile et Android physique | **Partiellement atteint** | Flux Chromium tactile ; matériel Android indisponible. |
| Compilation, tests et sources protégées | **Atteint** | 342 tests, build, contrats et dérivés reproductibles ; aucune fusion ou production. |
| Confiance globale et agrément artistique | **Partiellement atteint** | Réparation vérifiable, mais originaux manquants, raccords incertains et validation humaine restante. |
'''
pathlib.Path('docs/mission-23.md').write_text(text)
print('Report generated; walk available:',bool(walk))
