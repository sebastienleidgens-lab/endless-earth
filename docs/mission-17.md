# Mission 17 — La renaissance des arbres (17D)

**17D apporte quatre niveaux de détail, une réduction de l’atlas de pivots et une validation prolongée. La réserve de fluidité reste ouverte : cette branche demeure en brouillon.** Le « Go » après 17C autorise ce jalon. Aucune fusion ni publication.

[PR brouillon #26](https://github.com/sebastienleidgens-lab/endless-earth/pull/26) · [Galerie de trente paires et six films](mission-17-evidence/final/index.html) · [17C archivé](mission-17c.md) · [17B](mission-17b.md) · [17A](mission-17a.md).

| Été dans le pilote | Hiver dans le pilote |
| --- | --- |
| ![Groupe à 40 m en été](mission-17-evidence/final/groupe-40m-06-after.jpg) | ![Même groupe en hiver](mission-17-evidence/final/groupe-40m-01-after.jpg) |

## Résultat perceptif et limites

Le tronc, les charpentières et les vides entre pousses remplacent les anciens lobes autonomes. L’hiver expose une ramure ; l’automne laisse voir des feuilles et des ouvertures différentes selon les individus. La vue aérienne montre des peuplements plus irréguliers. **Ce constat visuel ne vaut pas approbation artistique du propriétaire.** Les couronnes restent stylisées ; les pousses planes et les ramifications simplifiées se lisent dans certaines vues lointaines. Les LOD 2/3 forcés à grande taille dans l’atelier révèlent des amas plus grossiers et une enveloppe différente du niveau proche ; le fondu atténue la transition sans rendre ces silhouettes identiques. La structure de quelques arbres paraît encore répétitive. Les tests et le nombre de triangles ne démontrent pas leur beauté.

La galerie fournit **dix situations en été, automne et hiver**, sans retirer les arbres pour la prise : arbre seul à 5 m, plusieurs arbres à 15 m, groupe à 40 m, lisière à 100 m, forêt lointaine, ciel, berges, village, pente et sous-bois dense. Les trente paires Mission 16 / 17D ont exactement la même caméra, date et météo. L’arbre isolé est un ancrage original, dont le voisin le plus proche est à 94,38 m. Le cadrage à cinq mètres coupe volontairement la couronne haute. La station lointaine est une caméra de revue, sans prétention de point de vue relevé.

**Les cinq captures du propriétaire n’étaient pas jointes au texte reçu.** Elles ne sont donc ni réinventées ni déclarées reproduites à l’identique. Les stations documentées couvrent les situations demandées. [Protocole et positions complets](mission-17-evidence/final/captures.json).

## Détail projeté et profils

Les quatre représentations utilisent la même bibliothèque déterministe et les mêmes identités. Les niveaux détaillés gardent les branches et les pousses attachées de 17C. À moyenne distance, chaque pousse garde son contour et sa racine, avec un plan sur deux alterné dans le volume de la couronne ; le centre plié est supprimé. Les deux niveaux lointains gardent des branches distribuées en trois dimensions. Le dernier conserve un plan alterné par pousse. Aucun arbre entier n’est remplacé par un panneau universel visible de profil.

La sélection dépend de la hauteur projetée dans le viewport CSS, du FOV et de la distance. Les seuils ont une hystérésis de 12 à 14 %. Les changements passent par un fondu complémentaire de **0,48 s**, limité à **48 arbres simultanés** ; les autres changements attendent leur tour. Les deux représentations d’un arbre partagent les pixels pendant le fondu et la densité saisonnière reste distincte. Un déplacement ou une rotation rapides peuvent encore rendre cette simplification perceptible ; les films natifs l’exposent.

| Profil | Proches détaillés maximum | Niveau moyen maximum | Feuillage proche | Mouvement |
| --- | ---: | ---: | --- | --- |
| Éco | 3 | 48 | Pousses aplaties, deux plans par pousse | Flexion continue simplifiée |
| Équilibré | 6 | 80 | Pousses aplaties, deux plans par pousse | Hiérarchie au premier niveau, flexion simplifiée au-delà |
| Qualité | 10 | 120 | Pousses pliées de 17C | Hiérarchie au premier niveau, flexion simplifiée au-delà |

Ces limites concernent le détail, pas le nombre total d’arbres. Les **3 889 individus** restent présents ; les suivants utilisent les niveaux lointains avec le même culling conservateur jusqu’à la portée de 1 050 m. Les niveaux proches respectent leurs plafonds après stabilisation. Un fondu peut temporairement soumettre deux représentations du même individu. Les compteurs distinguent individus visibles et triangles effectivement soumis.

[Comparaison des quatre LOD à caméra fixe et des trois profils](mission-17-evidence/final/index.html#library) · [Politiques et inventaire](mission-17-evidence/final/inventory.json).

## Coût réduit et propriétaires conservés

Le bois et le feuillage partagent un batch par famille et niveau, deux matériaux de forêt, un atlas de feuilles et les géométries communes. Les instances sont triées de l’avant vers l’arrière dans chaque batch. Le bois lointain supprime une surface redondante de ses rubans double face. En hiver caduc dormant, le draw range s’arrête après le bois ; les persistants gardent leurs aiguilles.

Les mipmaps sont préparés avec RGB pondéré par alpha et une correction de couverture au seuil d’alpha-test. Le niveau de base reste identique à 17C. La chaîne s’arrête à deux pixels par côté de tuile pour conserver les huit motifs ; le filtrage bilinéaire peut encore mélanger des bordures à très petite échelle. Les matériaux utilisent un alpha-test avec écriture de profondeur, sans tri transparent par arbre. Un essai de prépasse de profondeur augmentait le coût logiciel malgré une image identique ; il a été écarté.

L’atlas partagé de pivots déduplique les tuples de cinq articulations : **14 155 enregistrements uniques pour 175 044 sommets logiques**, soit **573 440 octets (0,55 Mio)** au lieu de **7 413 760 (7,07 Mio)** en 17C, une baisse d’environ **92,3 %** pour cette texture. Il évite toujours de dépasser les seize emplacements d’attributs WebGL. Les géométries source et les variantes de rendu restent en mémoire ; cette réduction n’est pas celle de toute la forêt.

La forme statique s’applique une seule fois après la chaîne de joints. Le niveau simplifié utilise une déformation continue de hauteur, commune aux points d’attache. Il ne construit aucune armature CPU par arbre. La banque de vent reste partagée : **256 cellules, 32 Kio CPU et 4 Kio GPU**, pilotées par le champ, le climat et l’horloge **Mission 11**. La commande de calme du banc de test agit sur la cible météo existante ; elle n’introduit pas un autre vent dans le jeu.

Les ombres **Mission 14** gardent leurs plafonds : Éco sans target local ; Équilibré **160 arbres / 512 px / 2 Hz** ; Qualité **256 / 1 024 px / 4 Hz**. Une estimation conservatrice de déplacement du proxy permet de réutiliser la carte lorsque l’écart reste inférieur à un quart de texel. Les changements de saison, de sélection, de soleil ou les invalidations imposent toujours une mise à jour. Le quart de texel est un seuil de décision géométrique, pas une preuve d’égalité pixel à pixel ni une borne garantie entre deux contrôles sous rafale rapide. Le proxy conserve la flexion grossière, sans frémissement fin.

La neige, l’accumulation, l’exposition et la fonte restent celles de **Mission 15**. Les pousses et aiguilles reçoivent la neige sur leurs surfaces, sans volume blanc de couronne ajouté. Les douze films 17C sur neige, fonte et mouvements restent consultables dans [l’archive intacte](mission-17-evidence/life/index.html).

## Mesures directes et réserve de fluidité

**17D améliore neuf des douze cellules face à 17C, mais reste plus coûteux que Mission 16 dans les douze. La fusion reste bloquée sur la fluidité et l’évaluation artistique.** Les gains les plus nets concernent le bois en Équilibré et Qualité. Trois cellules régressent légèrement face à 17C ; elles restent dans le tableau.

**SwiftShader logiciel**, Chromium, **960 × 640, DPR 1**. **432 rendus synchronisés** par `finish` et lecture GPU, douze échantillons chauds alternés par cellule. Caméra et climat complets identiques sont vérifiés automatiquement. Le temps est tenu pendant les échantillons et les LOD sont stabilisés avant mesure. Les trois copies sont résidentes ; aucune autre campagne graphique ne tourne simultanément. Les campagnes « couleur » désactivent la carte solaire locale des trois versions ; « ombre locale » conserve la carte compatible stable de chaque version. Cette dernière ne mesure pas son recalcul forcé. Les quantiles suivent l’échantillon trié d’indice `ceil((n−1) × q)` ; avec seulement douze échantillons par cellule, le P95 observé coïncide avec la pointe.

| Campagne | Profil | Vue | M16 médiane ms | 17C médiane ms | 17D médiane ms | Δ D/C | 17D P95 ms | 17D pic ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Couleur | Éco | bois | 218.9 | 506.1 | 448.0 | -11.5 % | 557.6 | 557.6 |
| Couleur | Éco | aerienne | 243.5 | 393.0 | 418.5 | +6.5 % | 470.4 | 470.4 |
| Couleur | Éco | berge | 162.4 | 245.1 | 250.4 | +2.2 % | 287.9 | 287.9 |
| Couleur | Équilibré | bois | 257.4 | 682.7 | 474.3 | -30.5 % | 521.7 | 521.7 |
| Couleur | Équilibré | aerienne | 351.9 | 611.8 | 620.0 | +1.3 % | 730.8 | 730.8 |
| Couleur | Équilibré | berge | 253.9 | 390.8 | 331.6 | -15.1 % | 393.3 | 393.3 |
| Couleur | Qualité | bois | 297.0 | 732.4 | 488.7 | -33.3 % | 623.3 | 623.3 |
| Couleur | Qualité | aerienne | 381.4 | 682.7 | 459.3 | -32.7 % | 586.1 | 586.1 |
| Couleur | Qualité | berge | 221.0 | 380.3 | 325.8 | -14.3 % | 379.6 | 379.6 |
| Ombre locale | Éco | bois | 211.6 | 464.1 | 436.4 | -6.0 % | 458.9 | 458.9 |
| Ombre locale | Équilibré | bois | 327.3 | 994.9 | 618.7 | -37.8 % | 758.4 | 758.4 |
| Ombre locale | Qualité | bois | 337.6 | 1105.3 | 671.6 | -39.2 % | 774.0 | 774.0 |

Les versions comparées sont **Mission 16 `9cde6af`**, **17C `04a758c`** et le runtime **17D `7f43739`**. Les manifestes actifs des deux bases sont servis depuis leurs objets Git épinglés, même lorsque les fichiers publics inchangés sont mutualisés localement. Mission 16 a 2 500 arbres, 17C/17D en ont 3 889 : cette différence, demandée et introduite en 17B, fait partie du coût réel du résultat proposé.

[Résumé et allocations par cellule](mission-17-evidence/final/performance-summary.json) · [432 mesures brutes compressées](mission-17-evidence/final/performance.json.gz).

Snapshots chauds du bois en couleur seule, dans l’ordre cumulatif de la campagne : géométries / programmes déjà rencontrés restent en cache. Les appels et triangles comprennent toute la scène, pas seulement les arbres. Les buffers et textures sont des allocations logiques instrumentées.

| Profil | Version | Appels | Triangles | Textures | Buffers Mio | Textures estimées Mio |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Éco | M16 | 36 | 80966 | 9 | 1.43 | 18.87 |
| Éco | 17C | 54 | 389108 | 12 | 10.02 | 26.61 |
| Éco | 17D | 34 | 202520 | 12 | 4.50 | 20.09 |
| Équilibré | M16 | 36 | 113180 | 12 | 2.04 | 21.74 |
| Équilibré | 17C | 54 | 509274 | 14 | 10.82 | 29.14 |
| Équilibré | 17D | 37 | 251626 | 14 | 7.05 | 22.62 |
| Qualité | M16 | 36 | 126557 | 12 | 2.04 | 21.74 |
| Qualité | 17C | 54 | 592400 | 14 | 11.38 | 29.14 |
| Qualité | 17D | 39 | 326648 | 14 | 11.60 | 22.62 |


En Qualité dans cette cellule, les buffers augmentent légèrement de **11,38 à 11,60 Mio**, tandis que les textures estimées passent de **29,14 à 22,62 Mio**. La coexistence des variantes proches a donc un coût, même si la texture de pivots baisse nettement.

Sur un arbre étalé isolé, le rendu synchronisé mesure **97.9 / 99.5 / 103.0 ms** à la médiane sans vent / flexion simplifiée / hiérarchie complète, avec douze échantillons par mode en 640 × 480. Le P95 sans vent atteint 612.7 ms : la variabilité interdit d’en déduire un coût exact de la forêt entière. La banque CPU seule a une médiane sous la résolution du chronomètre, un P95 de **0.1 ms** et une pointe de **0.2 ms**, hors conversion half-float et transfert GPU.

Le recalcul forcé des ombres est mesuré séparément, en **480 × 320** sur le bois, quatre rendus forcés alternés avec quatre cartes tenues par cellule. Les résultats sont peu échantillonnés et restent sensibles au logiciel :

| Version | Profil | Forcé médiane ms | Carte tenue médiane ms | Arbres soumis / visibles |
| --- | --- | ---: | ---: | ---: |
| M16 | Éco | 111.1 | 90.3 | 476 |
| M16 | Équilibré | 139.8 | 150.8 | 476 |
| M16 | Qualité | 161.4 | 151.1 | 476 |
| 17C | Éco | 295.9 | 286.4 | 528 |
| 17C | Équilibré | 563.3 | 577.3 | 528 |
| 17C | Qualité | 538.7 | 511.3 | 528 |
| 17D | Éco | 163.6 | 201.8 | 532 |
| 17D | Équilibré | 215.2 | 206.1 | 532 |
| 17D | Qualité | 268.0 | 207.5 | 532 |

Mission 16 compte les instances de couronnes des cellules dont le volume passe le frustum ; 17C/17D comptent les individus dont le volume conservateur passe le frustum. Ce sont des compteurs de soumission, pas des feuilles réellement visibles après occultation. Les caps de casters et les allocations de chaque mesure figurent dans [le protocole et les données](mission-17-evidence/final/costs.json).

Les temps de chargement sont des observations locales individuelles de cette campagne, avec caches et sources du serveur de développement ; ils ne constituent pas une mesure réseau, froide reproductible ou mobile. Le nombre de textures et les allocations logiques sont conservés dans chaque état. **Ces octets ne mesurent pas la VRAM physique.**

L’exécuteur ne possède pas de `/dev/dri`. Chromium lancé sans forcer ANGLE expose aussi SwiftShader. [Sonde matérielle](mission-17-evidence/final/hardware-probe.json). Aucun FPS smartphone n’est inventé. La vérification mobile porte sur les contrôles, la disposition et le fonctionnement WebGL dans des viewports mobiles. Une mesure sur téléphone Android / GPU physique et un budget d’image accepté restent nécessaires avant de lever la réserve.

## Promenade native de trente minutes

Essai terminé sur le worktree détaché propre **`7f43739`** : **30.12 minutes murales**, **30.12 minutes de frames natives**, **2029.9 m**, **9013 images**, 4 inversions uniquement aux extrémités. Tous les échantillons restent marchables, avec un écart au sol maximal de **0.000 mm** et un pas maximal de **0.338 m**. Aucune perte de contexte WebGL, erreur GL ou erreur JavaScript. Les empreintes de tous les fichiers source / publics suivis du worktree sont identiques avant et après.

Intervalles natifs **logiciels**, 480 × 320 DPR 1 : **médiane 173.2 ms, P95 433.7 ms, pointe 1557.0 ms**. Ces valeurs incluent le streaming, les commandes de chapitre, les enregistrements et les GC. Elles révèlent des lenteurs et ne valident pas une promenade fluide. La limite M11 de reprise à une seconde s’applique sous les très longues pauses ; ce test ne prétend pas à une identité parfaite entre temps du vent et trente minutes murales.

| Chapitre | Profil | Saison / météo | Vue | Cellules de sous-bois libérées |
| --- | --- | --- | --- | ---: |
| 1 | Équilibré | 2026-06-21 · clear | first | 0 |
| 2 | Éco | 2026-06-21 · storm | first | 0 |
| 3 | Qualité | 2026-10-18 · cloudy | aerial | 0 |
| 4 | Équilibré | 2026-01-21 · clear | third | 6 |
| 5 | Qualité | 2026-04-25 · clear · calme M11 | first | 0 |
| 6 | Équilibré | 2026-06-21 · clear | first | 6 |


L’avatar suit une véritable route admise du graphe OSM, longue de 450 m. Le départ est fixé avant l’essai, puis aucune relocalisation n’est autorisée. Le parcours ne peut s’inverser qu’à son extrémité validée. La direction de caméra suit doucement le trajet ; les chapitres passent aussi en troisième personne et en aérien. Les dates et la météo sont des commandes diagnostiques, sans accélération de la marche ni du vent. Le test conserve les à-coups du rendu logiciel et les passages de GC dans les intervalles.

Six chapitres de cinq minutes couvrent l’été équilibré, l’orage Éco, l’automne Qualité aérien, l’hiver Équilibré en troisième personne, le printemps Qualité au calme, puis l’été Équilibré. Deux chapitres libèrent et rechargent les cellules de sous-bois pendant la marche. Cela teste le cycle du décor bas ; les arbres du pilote gardent tous leurs ancrages et leur bibliothèque commune, sans prétendre à un streaming de tuiles forestières du territoire entier.

Trois extraits natifs avec son sont conservés, et non une vidéo redondante de trente minutes. Les films supplémentaires montrent le vent puis son retour au calme, les trois profils et les quatre saisons. **Seul le calendrier accéléré mars–décembre est explicitement marqué comme diagnostic dans ses pixels.** Les WebM sont indexés par copie de codec, avec identité des paquets vidéo et timestamps vidéo vérifiée. [Galerie](mission-17-evidence/final/index.html#motion) · [Trace prolongée](mission-17-evidence/final/soak-trace.json.gz).

Les **six cycles contrôlés** de création/destruction reviennent exactement aux mêmes compteurs : 56 géométries et 16 textures logiques dans ce scénario. Buffers et textures estimées reviennent aussi aux mêmes octets. Il ne faut pas confondre ce retour contrôlé avec le chargement progressif du pilote entier.

Pendant la marche, les snapshots GPU vont de **156 à 361 géométries**, **13 à 16 textures**, et **17 à 23 programmes**, selon profil, vue, premières utilisations et cellules de décor. Après GC, le tas JavaScript passe de **101.28 Mio** au départ à **103.91 Mio** à la fin. Ces états à positions et saisons différentes ne suffisent pas à attribuer toute hausse à une fuite. Les allocations par chapitre et tous les points de GC sont conservés dans [le résultat prolongé](mission-17-evidence/final/soak-30min.json). Le son est ensuite disposé : contexte **fermé**, **zéro nœud** restant. Après les cinq premières minutes, les points de GC oscillent entre **103.02 et 104.18 Mio** ; aucune dérive continue nette n’est observée sur cet essai.

Le chapitre calme atteint une entrée M11 minimale de **9.91e-197**. Les compteurs de tests / réutilisations de carte solaire sont conservés par frame ; le mouvement de l’avatar impose aussi des recentrages, donc ces passages ne mesurent pas une économie à caméra immobile.

## Géométrie, navigation et préservation

**275 tests Node passent**, dont les nouveaux contrôles de LOD, alpha, fondu, mise à jour par frame et borne de mouvement des ombres. Les joints quantifiés restent attachés à moins de **1,5 mm** dans les tests ; les racines de pousses à moins de **2 mm**, avec croissance et frémissement. L’enveloppe de mouvement passe à **3,8 m**, vérifiée jusqu’à l’échelle **2,2**, couvrant le maximum réel du pilote **2,194626**. Les restrictions d’habitat et les marges des chemins, bâtiments et berges restent celles de la préparation approuvée. Elles décrivent des volumes artistiques conservateurs, sans promettre l’absence de tout contact visuel de feuille dans toute météo.

- **3 889 ancrages et attributs individuels identiques** à 17C, dont les 1 389 compléments inférés de 17B. Aucun individu ajouté ou supprimé en 17D.
- **792 buffers source canoniques identiques octet par octet** sur les onze familles et trois niveaux d’origine, y compris leurs attributs de mouvement ; les variantes simplifiées de rendu sont construites séparément. Atlas de base identique.
- **843 fichiers publics ou preuves antérieures identiques**. Seuls les quatre manifestes JSON autorisés changent de version / empreinte. Rapports et preuves 17A–C conservés ; `docs/mission-17c.md` est une copie exacte du rapport approuvé.
- Terrain, eaux, relief, routes, bâtiments, repères et packs de décor inchangés. Graphe recalculé : **919 nœuds, 896 arêtes**, même SHA-256. **2 898 points de collision et vingt déplacements identiques** aux deux bases.
- Contrat `branch-attached-forest-v3`. Le dérivé de lumière actif est réellement rebaké à partir des **287 maillages / 3 889 arbres**. Ses bounds au repos étant conservés, son binaire reste identique ; le manifeste porte la nouvelle compatibilité.
- Trois profils, transitions par frame, cinq états saisonniers / neige, rechargement stable, caches absent / corrompu / périmé reconstruits avec les mêmes individus. Aucune erreur ni avertissement WebGL dans ces contrôles.

[Audit de préservation](mission-17-evidence/final/preservation.json) · [Navigation](mission-17-evidence/final/navigation-equivalence.json) · [Lumière recalculée](mission-17-evidence/final/light-preparation.json) · [Validation navigateur](mission-17-evidence/final/validation.json).

Le bundle de production du commit propre **`7f43739`** passe chargement du monde, déplacement, arrêt sans dérive, hauteur d’œil, cycle de caméras, son, profils et viewport mobile. L’identité embarquée 17D passe **quatre formats**, sans recouvrement des contrôles ni requête de métadonnées externe. La galerie décode les **soixante JPEG de comparaison** et les **six vidéos** (décodage complet, métadonnées et seek), avec audio dans les trois extraits de marche ; ses quatre formats n’ont pas de débordement horizontal. [Validation compilée](mission-17-evidence/final/compiled-validation.json) · [Validation des médias et formats](mission-17-evidence/final/media-validation.json).

<details>
<summary>Ouvrir les trente paires avant/après directement dans GitHub</summary>

### Arbre seul à 5 m

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Arbre seul à 5 m, Été, Mission 16](mission-17-evidence/final/isole-5m-06-m16.jpg) | ![Arbre seul à 5 m, Été, Mission 17D](mission-17-evidence/final/isole-5m-06-after.jpg) |
| Automne | ![Arbre seul à 5 m, Automne, Mission 16](mission-17-evidence/final/isole-5m-10-m16.jpg) | ![Arbre seul à 5 m, Automne, Mission 17D](mission-17-evidence/final/isole-5m-10-after.jpg) |
| Hiver | ![Arbre seul à 5 m, Hiver, Mission 16](mission-17-evidence/final/isole-5m-01-m16.jpg) | ![Arbre seul à 5 m, Hiver, Mission 17D](mission-17-evidence/final/isole-5m-01-after.jpg) |

### Plusieurs arbres à 15 m

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Plusieurs arbres à 15 m, Été, Mission 16](mission-17-evidence/final/groupe-15m-06-m16.jpg) | ![Plusieurs arbres à 15 m, Été, Mission 17D](mission-17-evidence/final/groupe-15m-06-after.jpg) |
| Automne | ![Plusieurs arbres à 15 m, Automne, Mission 16](mission-17-evidence/final/groupe-15m-10-m16.jpg) | ![Plusieurs arbres à 15 m, Automne, Mission 17D](mission-17-evidence/final/groupe-15m-10-after.jpg) |
| Hiver | ![Plusieurs arbres à 15 m, Hiver, Mission 16](mission-17-evidence/final/groupe-15m-01-m16.jpg) | ![Plusieurs arbres à 15 m, Hiver, Mission 17D](mission-17-evidence/final/groupe-15m-01-after.jpg) |

### Groupe à 40 m

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Groupe à 40 m, Été, Mission 16](mission-17-evidence/final/groupe-40m-06-m16.jpg) | ![Groupe à 40 m, Été, Mission 17D](mission-17-evidence/final/groupe-40m-06-after.jpg) |
| Automne | ![Groupe à 40 m, Automne, Mission 16](mission-17-evidence/final/groupe-40m-10-m16.jpg) | ![Groupe à 40 m, Automne, Mission 17D](mission-17-evidence/final/groupe-40m-10-after.jpg) |
| Hiver | ![Groupe à 40 m, Hiver, Mission 16](mission-17-evidence/final/groupe-40m-01-m16.jpg) | ![Groupe à 40 m, Hiver, Mission 17D](mission-17-evidence/final/groupe-40m-01-after.jpg) |

### Lisière à 100 m

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Lisière à 100 m, Été, Mission 16](mission-17-evidence/final/lisiere-100m-06-m16.jpg) | ![Lisière à 100 m, Été, Mission 17D](mission-17-evidence/final/lisiere-100m-06-after.jpg) |
| Automne | ![Lisière à 100 m, Automne, Mission 16](mission-17-evidence/final/lisiere-100m-10-m16.jpg) | ![Lisière à 100 m, Automne, Mission 17D](mission-17-evidence/final/lisiere-100m-10-after.jpg) |
| Hiver | ![Lisière à 100 m, Hiver, Mission 16](mission-17-evidence/final/lisiere-100m-01-m16.jpg) | ![Lisière à 100 m, Hiver, Mission 17D](mission-17-evidence/final/lisiere-100m-01-after.jpg) |

### Forêt lointaine

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Forêt lointaine, Été, Mission 16](mission-17-evidence/final/foret-lointaine-06-m16.jpg) | ![Forêt lointaine, Été, Mission 17D](mission-17-evidence/final/foret-lointaine-06-after.jpg) |
| Automne | ![Forêt lointaine, Automne, Mission 16](mission-17-evidence/final/foret-lointaine-10-m16.jpg) | ![Forêt lointaine, Automne, Mission 17D](mission-17-evidence/final/foret-lointaine-10-after.jpg) |
| Hiver | ![Forêt lointaine, Hiver, Mission 16](mission-17-evidence/final/foret-lointaine-01-m16.jpg) | ![Forêt lointaine, Hiver, Mission 17D](mission-17-evidence/final/foret-lointaine-01-after.jpg) |

### Vue du ciel

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Vue du ciel, Été, Mission 16](mission-17-evidence/final/aerienne-06-m16.jpg) | ![Vue du ciel, Été, Mission 17D](mission-17-evidence/final/aerienne-06-after.jpg) |
| Automne | ![Vue du ciel, Automne, Mission 16](mission-17-evidence/final/aerienne-10-m16.jpg) | ![Vue du ciel, Automne, Mission 17D](mission-17-evidence/final/aerienne-10-after.jpg) |
| Hiver | ![Vue du ciel, Hiver, Mission 16](mission-17-evidence/final/aerienne-01-m16.jpg) | ![Vue du ciel, Hiver, Mission 17D](mission-17-evidence/final/aerienne-01-after.jpg) |

### Berges

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Berges, Été, Mission 16](mission-17-evidence/final/berge-06-m16.jpg) | ![Berges, Été, Mission 17D](mission-17-evidence/final/berge-06-after.jpg) |
| Automne | ![Berges, Automne, Mission 16](mission-17-evidence/final/berge-10-m16.jpg) | ![Berges, Automne, Mission 17D](mission-17-evidence/final/berge-10-after.jpg) |
| Hiver | ![Berges, Hiver, Mission 16](mission-17-evidence/final/berge-01-m16.jpg) | ![Berges, Hiver, Mission 17D](mission-17-evidence/final/berge-01-after.jpg) |

### Village

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Village, Été, Mission 16](mission-17-evidence/final/village-06-m16.jpg) | ![Village, Été, Mission 17D](mission-17-evidence/final/village-06-after.jpg) |
| Automne | ![Village, Automne, Mission 16](mission-17-evidence/final/village-10-m16.jpg) | ![Village, Automne, Mission 17D](mission-17-evidence/final/village-10-after.jpg) |
| Hiver | ![Village, Hiver, Mission 16](mission-17-evidence/final/village-01-m16.jpg) | ![Village, Hiver, Mission 17D](mission-17-evidence/final/village-01-after.jpg) |

### Pente boisée

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Pente boisée, Été, Mission 16](mission-17-evidence/final/pente-06-m16.jpg) | ![Pente boisée, Été, Mission 17D](mission-17-evidence/final/pente-06-after.jpg) |
| Automne | ![Pente boisée, Automne, Mission 16](mission-17-evidence/final/pente-10-m16.jpg) | ![Pente boisée, Automne, Mission 17D](mission-17-evidence/final/pente-10-after.jpg) |
| Hiver | ![Pente boisée, Hiver, Mission 16](mission-17-evidence/final/pente-01-m16.jpg) | ![Pente boisée, Hiver, Mission 17D](mission-17-evidence/final/pente-01-after.jpg) |

### Sous-bois dense

| Saison | Mission 16 | Mission 17D |
| --- | --- | --- |
| Été | ![Sous-bois dense, Été, Mission 16](mission-17-evidence/final/sous-bois-06-m16.jpg) | ![Sous-bois dense, Été, Mission 17D](mission-17-evidence/final/sous-bois-06-after.jpg) |
| Automne | ![Sous-bois dense, Automne, Mission 16](mission-17-evidence/final/sous-bois-10-m16.jpg) | ![Sous-bois dense, Automne, Mission 17D](mission-17-evidence/final/sous-bois-10-after.jpg) |
| Hiver | ![Sous-bois dense, Hiver, Mission 16](mission-17-evidence/final/sous-bois-01-m16.jpg) | ![Sous-bois dense, Hiver, Mission 17D](mission-17-evidence/final/sous-bois-01-after.jpg) |

</details>

![Bibliothèque métrique de onze familles](mission-17-evidence/final/library.jpg)

| Printemps | Été | Automne | Hiver |
| --- | --- | --- | --- |
| ![spring](mission-17-evidence/final/season-spring.jpg) | ![summer](mission-17-evidence/final/season-summer.jpg) | ![autumn](mission-17-evidence/final/season-autumn.jpg) | ![winter](mission-17-evidence/final/season-winter.jpg) |

## Bibliothèque, provenance et portée géographique

Onze familles procédurales originales : étalé, cime haute, élancé, berge, pendant, jeune, asymétrique, petit, dense, conifère et verger. Le verger reste disponible dans la bibliothèque et n’est pas implanté artificiellement dans le pilote. Les plages de dimensions, triangles des quatre niveaux, phénologies génériques et budgets sont dans [l’inventaire](mission-17-evidence/final/inventory.json). La galerie montre les silhouettes à échelle commune, les quatre saisons et les quatre représentations à caméra fixe. Les [vues individuelles de la bibliothèque 17B](mission-17-evidence/forest/index.html) restent conservées ; leur géométrie proche canonique est inchangée.

Aucun modèle téléchargé, scan, texture botanique externe ou service payant n’est ajouté en 17D. Les références photographiques 17A et les vidéos naturalistes CC BY-SA 17C restent attribuées dans leurs journaux : [sources 17A](mission-17-evidence/sources.json), [observations de mouvement 17C](mission-17-evidence/life/naturalist-references.json). Leurs pixels n’entrent pas dans les matériaux du jeu. Les données géographiques gardent leurs [licences et attributions](../public/data/LICENSE.md) IGN / OSM et leurs compléments de relief et navigation.

Les positions originales sont déjà des ancrages reconstruits ; les compléments se limitent aux bois cartographiés existants. Les familles, hauteurs, formes, distances entre arbres et dates de feuillaison sont des interprétations déterministes, **pas un inventaire arboricole local ni une identification d’espèces**. Le résultat ne constitue pas une nouvelle observation de terrain.

Même branche et PR #26 en brouillon. Aucun travail Living Paintings / LP-01. Budget supplémentaire : **0 €**.

## Reproduction

```sh
npm test
npm run build
npm run dev -- --port 5317
node scripts/audit-forest-final-preservation.mjs
node scripts/verify-forest-final-integration.mjs
node scripts/validate-forest-final.mjs
```

Les campagnes 17D écrivent dans `docs/mission-17-evidence/final/`. Ne pas relancer les anciens générateurs 17A–C sur leurs archives. `prepare-forest-final-baselines.mjs` prépare les copies exactes de Mission 16 / 17C ; les servir respectivement aux ports 5322 / 5321. Le helper fournit leurs manifestes depuis Git. Exécuter les campagnes graphiques **séparément** :

```sh
node scripts/benchmark-forest-final.mjs
node scripts/measure-forest-final-cost.mjs
node scripts/capture-forest-final.mjs
node scripts/capture-forest-final-library.mjs
node scripts/record-forest-final.mjs
```

L’essai prolongé exige le worktree détaché propre `work/mission-17d/frozen` au commit `7f43739`, ses dépendances, et son serveur Vite sur **5330**. `choose-forest-walk.mjs` prépare les candidats de route, puis `node scripts/soak-forest-final.mjs` exécute **1 805 secondes réelles au minimum**. Un essai court via `FOREST_SOAK_SECONDS` écrit seulement dans `work/mission-17d/soak-smoke/` et ne peut devenir une preuve de trente minutes. `python scripts/report-forest-final.py` régénère la galerie depuis les résultats complets. Les exports bruts, copies de sources et enregistrements intermédiaires restent dans `work/`, hors Git.
