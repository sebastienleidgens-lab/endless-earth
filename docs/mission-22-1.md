# Mission 22.1 — Le monde sans faux-semblants

Branche `mission/22-1-realisme-continuite`, depuis `9b9beaab43d41840ce6b6e5e5a5ad34e7927361e`, fusion de la Mission 22 par la PR #31 vérifiée sur GitHub. Budget supplémentaire : **0 €**. Aucun achat, service permanent, changement de Living Paintings / LP-01, fusion ou déploiement.

Ce rapport distingue les corrections vérifiées, les reconstructions et les limites. Une réussite automatisée ne vaut pas validation artistique. La [galerie autonome](mission-22-1-evidence/index.html), les [79 comparaisons](mission-22-1-evidence/gallery-scenes.json) et les traces sont conservées dans [mission-22-1-evidence](mission-22-1-evidence/). Ouvrir la galerie avec le serveur Vite local : `npm run dev -- --host 0.0.0.0`, puis `/endless-earth/docs/mission-22-1-evidence/index.html`. Aucun hébergement n’est créé.

Les observations finales utilisent les sources figées du commit `91f0f8c6e87874d636cdd164be58ff40984e2587`. Les commits de livraison suivants ajoutent les preuves et ce rapport. Les films sont du rendu natif, limité par SwiftShader ; leurs faibles cadences éventuelles ne sont pas masquées par interpolation ou accélération.

## 1. Audit initial

Lecture d’`AGENTS.md`, des rapports 14–22, de l’ADN artistique, des contrats de provenance, des budgets et scripts existants. Le territoire conserve ses sources IGN/OSM, ses 2 500 ancrages d’arbres, ses bâtiments, saisons, météo, navigation, collisions, résolution adaptative et interface tactile.

Quatre causes sont identifiées : un terrain conservé sous le tablier malgré sa reclassification ; le dévers des berges propagé dans le tablier ; un franchissement de petite marche exigeant un palier presque horizontal ; une contribution colorée des façades interpolée avec la distance. L’ambiance diffuse nocturne était très faible, surtout dans l’hémisphère inférieur, alors que la pluie était directement colorée par son shader.

## 2. Les captures du propriétaire

La vue du pont est retrouvée par l’axe OSM, le tablier et les maisons riveraines. Les stations numériques sont des positions de contrôle dérivées de cette géographie, **pas des coordonnées exactes prétendument extraites des captures**. La position nocturne exacte n’est pas déterminée : les contrôles reproduisent le défaut de forte pluie nocturne dans les mêmes systèmes, notamment en forêt. Les comparaisons avant/après utilisent entre elles les mêmes caméras, dates, météos et profils.

## 3. Diagnostic du terrain

L’ancien sous-sol du pont avait seulement changé de classe route/terre/eau : les triangles hauts restaient visibles à travers la chaussée. Le tablier mélangeait son profil longitudinal à des échantillons transversaux de terrain aux extrémités. Ce dernier mélange transportait jusqu’à environ un mètre de dévers de berge dans une chaussée qui ne possédait pas de relevé de dévers correspondant.

Les indices, le datum IGN69 et le winding ne sont pas établis comme la cause de ces grandes formes. Le MNT à dix mètres et ses raffinements locaux restent par ailleurs des approximations d’un terrain comportant de vraies ruptures.

L’[inspection du moteur](mission-22-1-evidence/ground-inspection.json) associe hauteur rendue, support, pente, matériau, maille, provenance et obstruction. Les points servant aux caméras ne sont pas tous praticables : la station nommée `pont-tablier` est hors de l’axe et rencontre l’eau ; la station de rue présente une pente de terrain forte, sans matériau de chaussée. Ces observations sont conservées et distinguées des contrôles sur les axes source. Elles ne justifient pas d’aplanir toute la vallée.

## 4. Correction géométrique

`prepare-mission-22-1-geometry.mjs` repart des fichiers de la base Git précisée dans le script. Il conserve l’axe et les stations centrales du tablier, reconstruit sa section transversale plane, adapte garde-corps et plinthes, et découpe les anciennes terres dans son emprise. L’eau et les fichiers MNT/raffinement sont conservés.

La Rue du Pont est reconstruite en une chaussée continue de 0,5 m entre stations, sur les 22,964 m de son axe existant. Ses deux altitudes centrales conservées déterminent une pente d’environ 6 %, sans le pic court créé par un déplacement isolé des sommets de fin. Les autres sommets de raccordement raccordent le nouveau dévers sur trois mètres aux extrémités. Leur interpolation affecte également les faces existantes incidentes : ces triangles sont explicitement énumérés dans `roadEndInfluence`. Les tests vérifient cette emprise bornée et les hauteurs source en dehors d’elle. Cette transition est une **reconstruction de chaussée**, pas un nouveau levé. Aucun aplanissement global des berges ou falaises n’est pratiqué.

La découpe retire environ 295,14 m² de terres superposées aux chaussées corrigées et 268 minuscules résidus secs de quantification. Une [régénération indépendante](mission-22-1-evidence/determinism.json) reproduit les six dérivés contrôlés octet pour octet. Les paramètres, emprises et influences sont dans [geometry.json](mission-22-1-evidence/geometry.json).

## 5. Vérification du pont

Le rendu et le support du tablier utilisent toujours le même maillage indexé. Les terres retirées ne remplacent pas le support par une ancienne rampe invisible. Les tests parcourent l’axe dans les deux sens et vérifient les garde-corps, les restrictions de pont inconnu et le support des triangles. Les faces fines sont conservées à distance dans les cellules modifiées pour éviter la réapparition du défaut par LOD.

La [traversée native aller/retour](mission-22-1-evidence/pont-native.webm) dure 407,683 secondes réelles, marche puis course au clavier, depuis la Rue du Pont jusqu’à l’autre rive et retour. Elle se termine avec zéro frame de collision invalide et zéro écart de support mesuré. Le script règle le cap vers les stations source ; il ne déplace pas le joueur après le placement initial. [Résultat et protocole](mission-22-1-evidence/pont-native.json).

## 6. Déplacements sur les pentes

Le noyau conserve ses limites de pente et son balayage de dix centimètres. Après une marche de dix-huit centimètres maximum, il échantillonne maintenant un palier de trente centimètres qui peut être incliné. Le support, les obstacles, les ruptures successives et la pente d’ensemble restent contrôlés. Les rampes durablement trop raides, falaises, vides et murs restent interdits.

## 7. Montée, descente et navigation

Le joueur et le placement physique des habitants réutilisent ce noyau. Les tests couvrent les raccords inclinés en montée/descente/diagonale, marches répétées, bordures, pente continue interdite, obstacles et support inconnu. Les graphes ordinaires et de destination sont régénérés depuis le vrai moteur et liés aux nouveaux dérivés. Les escaliers synthétiques testent la règle ; ils ne prouvent pas l’existence d’un escalier particulier dans le village.

## 8. Diagnostic des façades

`architectureFade` mélangeait des tons proches et lointains différents. Le mode photographique mélangeait même sa photo à la palette du bâtiment. La patine avait également une composante dépendant de la distance. Les mipmaps ne suffisaient pas à compenser ces changements d’albédo explicites.

## 9. Matériaux stables

La couleur utilise désormais les mêmes textures métriques filtrées à toutes les distances. Le relief apparent continue de s’atténuer ; les mipmaps et le filtrage réduisent les hautes fréquences. Humidité, soleil, nuages, ombres et fenêtres conservent leurs propriétaires. Les trois modes de matière et les trois profils font partie de la validation. Le brouillard et les occultations réelles peuvent encore changer l’aspect d’une façade lointaine.

Trois façades dégagées sont mesurées à six distances de 12 à 130 m, sur les trois profils. Le contrôle isole un même petit morceau de façade à taille projetée constante en ajustant le champ de vision, à date/météo/exposition fixes. Dérives maximales du signal moyen : mode Mission 12 **5,638 → 0,364 %**, hybride **0,269 → 0,121 %**, photographique **108,253 → 0,135 %**. Le mode hybride était déjà stable sur ces échantillons ; ces chiffres ne prouvent pas une grande anomalie initiale dans chaque mode. Les six films d’approche conservent séparément un champ de vision naturel de 55°. [Sélection et méthode](mission-22-1-evidence/facades/selection.json), [avant](mission-22-1-evidence/facades/before.json), [après](mission-22-1-evidence/facades/after.json).

## 10. Direction nocturne

L’ambiance du ciel et le retour diffus inférieur reçoivent une adaptation artistique froide, liée à la transition jour/nuit et atténuée par la météo. Elle ne représente pas une Lune cachée. Le supplément lunaire continue de dépendre de l’astronomie, de l’illumination, de la hauteur et de l’occultation. Aucun projecteur sur le joueur, nouvelle passe ou lumière par fenêtre n’est ajouté.

## 11. Nuits et précipitations

La couleur et l’opacité de la pluie nocturne sont réduites pour rétablir son équilibre avec les surfaces Lambert. Les fenêtres et lanternes chaudes sont conservées. La galerie compare Lune, absence de Lune, couvert, pluie, orage, brume, neige, crépuscule et aube dans les trois profils. La lisibilité est jugée sur le personnage, le chemin et les volumes ; la moyenne des pixels reste seulement un indicateur.

Les 79 paires possèdent exactement la même caméra avant/après, avec des vues supplémentaires du village, de la rivière, du pont et de la vallée, en été et en hiver. La forêt sous pluie montre maintenant le sol, les troncs et la silhouette ; le résultat conserve une obscurité marquée. La beauté et la profondeur restent à apprécier par le propriétaire sur ces images natives.

## 12. Habitants proches

Les identités, proportions et tenues persistantes restent celles de Mission 22. La représentation conserve un lot instancié commun, ajoute des raccords d’épaules, genoux et coudes proches et une pose plus souple. Les enfants ne sont pas des adultes simplement réduits. Les modèles demeurent stylisés ; ce travail ne livre pas une bibliothèque de personnages photoréalistes.

Les [portraits et films proches](mission-22-1-evidence/people/people.json) montrent adulte, senior, enfant/famille et amis sur leurs vrais itinéraires. La caméra de contrôle suit un membre réel, sans le redimensionner ni le repositionner. Les volumes de mains, vêtements et visages restent grossiers ; les membres d’un groupe peuvent encore se masquer ou se chevaucher dans certaines poses rapprochées : le naturel demandé est **partiellement atteint**, pas validé par les seuls tests de proportions.

## 13. Animations

Balancement du buste, respiration au repos, gestes asymétriques, regard discret et rotation amortie s’ajoutent aux jambes à deux segments et aux appuis existants. Le calcul évite une allocation vectorielle dans chaque segment. Les raccords géométriques supplémentaires des articulations sont complets à moins de quatre mètres et se résorbent progressivement dans les segments existants jusqu’à sept mètres ; corps, proportions et accessoires conservent leur identité. Les diagnostics de semelle sont limités aux personnes proches ; les groupes hors du champ continuent leur vie logique sans pose visible.

## 14. Routines complètes

Les intentions conservent départ, trajet, pause, activité et retour. Le changement de destination réinitialise correctement l’activité et vérifie l’admissibilité des modes. La nouvelle activité publique utilise ces états dans le monde natif ; son admission déterministe de validation est séparée de la promenade ordinaire.

## 15. Fins de routines

Une routine diurne terminée peut reprendre un trajet après une pause de douze à trente secondes, avec les mêmes identités. Un échec de continuation n’entraîne pas de téléportation. Les restrictions météorologiques et les départs nocturnes de familles restent protégés. **Limite : un groupe suivi qui termine à une heure incompatible peut encore rester au repos public ; aucune disparition visible ou maison fictive n’est utilisée pour cacher cette limite.**

Les trois observations natives complètes montrent départ, trajet, pause, activité, retour, repos borné puis nouvelle intention : [famille](mission-22-1-evidence/family-routine.json), 186,338 s réelles ; [solo](mission-22-1-evidence/solo-routine.json), 180,404 s ; [couple](mission-22-1-evidence/couple-routine.json), 255,618 s. Les traces compressées et films correspondants sont livrés. Les admissions choisissent explicitement une activité rare sur les vrais itinéraires ; elles ne prétendent pas que ces trois rencontres ont eu lieu spontanément pendant la promenade ordinaire.

## 16. Assise et pique-nique

La recherche dépasse l’absence de banc OSM. Deux fiches de l’Office de tourisme de Grand Châtellerault, publiées sur Cirkwi, documentent un usage public de repos : jardin communal/Champ de Foire et quai Périvier. Les photographies accessibles servent à l’examen, sans être copiées comme assets ni utilisées comme relevés métriques.

Un point du jardin est admis après vérification du support, d’un petit dégagement, des collisions et d’une approche intérieure courte depuis la voie de service existante. Cette approche est **inférée**, explicitement séparée du graphe public OSM sauvegardé ; aucune route n’est dessinée. L’emplacement du quai est refusé par les contrôles de planéité. Le siège est **au sol** ; aucun banc ou table prétendument relevé n’est inventé.

L’arrivée ralentit, les personnes se tournent vers l’espace ouvert, s’abaissent, restent assises, effectuent de petits gestes, se relèvent puis repartent. Les groupes peuvent effectuer un pique-nique simple avec un petit bagage interprété. Froid, pluie, neige, nuit, poussette et enveloppe incompatible refusent l’activité. Le mobilier réel et les limites exactes du jardin ne sont pas relevés : l’ancrage reste une reconstruction prudente à revoir artistiquement.

Le point retenu est à 0,75 m du POI publié, avec une approche intérieure inférée de 18,109 m. [Audit chargé dans le moteur, sources et refus du quai](mission-22-1-evidence/public-rest.json). Un banc, une table et un véritable repas manipulé ne sont pas livrés ; le pique-nique reste une interaction gestuelle simple au sol.

## 17. Entrées et sorties

**Non activées.** Les portes restent des ouvertures décoratives fermées, sans corridor intérieur et occlusion validés. Le recoupement disponible ne justifie pas une entrée publique à travers ces façades. Aucun personnage ne les traverse et aucune disparition n’est présentée comme un retour à domicile.

## 18. Ambiance sonore

Trois nouvelles sources enregistrées CC0 ajoutent un rire bref, une toux et un froissement de vêtement. Les pages de licence, empreintes, découpes, transformations et crédits sont enregistrés. Les événements restent ponctuels, attachés à un habitant proche et à son état ; ils ne créent pas une boucle de foule. Une mémoire bornée évite les répétitions immédiates, impose des silences et conserve une petite variation de voix par identité. Les enfants ne reçoivent pas arbitrairement ces voix adultes.

Sources : Reitanna / Freesound 344001, qubodup / 169726, khenshom / 481075, découpées depuis leurs fichiers enregistrés ; [licences, transformations et empreintes](mission-22-1-evidence/audio-sources.json). Les crédits du jeu sont mis à jour. La mémoire conserve au plus 128 clés d’acteurs ; les demandes de buffer tardives expirent après 700 ms. Les sons de conversation existants restent des murmures sans dialogue intelligible.

Cinq [scénarios sonores natifs](mission-22-1-evidence/audio.json) montrent chien, conversation distante, occlusion derrière un bâtiment, passant proche et nuit calme. Le cas derrière bâtiment rencontre une occlusion acoustique de 0,88 ; la nuit sans population forcée conserve le silence humain. Les compteurs échantillonnés peuvent compter plusieurs fois la même voix encore récente : ils ne sont pas un nombre de conversations distinctes. Les études de façade, portraits rapprochés et gestes tactiles sont volontairement muets ; les activités, le pont, les scénarios sonores et les extraits de promenade utilisent l’AudioContext natif, sans piste ajoutée.

## 19. Budgets

Plafonds de nouvelles admissions inchangés : **3 / 4 / 10 personnes**, mises à jour de pose bornées et un appel instancié pour les habitants. Les familles déjà visibles restent entières après baisse de profil. Pas de nouveau squelette CPU par personne, texture de visage individuelle, passe de post-traitement ou lumière dynamique par fenêtre.

## 20. Mesures de performance

Les campagnes utilisent Chromium/SwiftShader : ce sont des mesures de rendu logiciel. Aucun GPU physique ou appareil Android n’est disponible dans cet environnement. Les comparaisons doivent être lues avec leurs caméras, résolutions, profils, échantillons et P95 ; une régression éventuelle demeure explicitement visible dans les données.

La [matrice finale](mission-22-1-evidence/performance.json) couvre village/forêt/pont × Éco/Équilibré/Qualité, à 480 × 320, DPR 1. Par cas et version : 24 échantillons chauds peuplés et 12 vides, alternés, synchronisés par `gl.finish`, sans autre campagne de rendu simultanée. Caméras, dates, uniformes lumineux, identités, tenues et poses sur itinéraires source sont appariés. La médiane des neuf écarts est **−1,96 %**, le maximum **+4,62 %** (village Qualité) ; les neuf restent sous +5 %. Les médianes, P95, appels et allocations sont conservés. Cela ne garantit pas un débit de jeu fluide sur appareil physique.

La première version des articulations proches coûtait **+8,15 %** en forêt Éco ; une répétition donnait **+9,63 %**. Ces résultats [initiaux](mission-22-1-evidence/performance-before-joint-lod.json) et [répétés](mission-22-1-evidence/performance-foret-eco-repeat.json) ont motivé la résorption des petits raccords entre quatre et sept mètres. La version finale ne réduit pas le nombre de personnes pour réussir la mesure.

## 21. Promenade prolongée

Le protocole conserve une session RAF native d’au moins trente minutes réelles, clavier et AutoWalk, plusieurs profils, saisons, vues et météos, sans repositionnement, accélération, population forcée ou bande-son ajoutée. Les sources sont figées par empreintes. Les activités rares utilisent un protocole déterministe distinct.

Résultat : **1 808,793 s réelles (30 min 08,793 s), 1 807,558 s natives, 1 511,00 m, 5 645 frames**, dix destinations atteintes, dix chapitres, trois profils et trois vues. Village, forêt, chemins et terrains ouverts sont rencontrés, avec montée/descente, jour/nuit, pluie, orage, neige et brume. Le clavier produit une courte séquence marche/course ; le reste utilise AutoWalk. Zéro erreur JS/WebGL, perte de contexte, frame de collision invalide, écart vertical au support ou image suspecte détectée. Le déplacement maximal par frame est de 0,711 m ; toutes les empreintes source sont inchangées. [Résultat complet](mission-22-1-evidence/walk.json), [trace](mission-22-1-evidence/walk-trace.json.gz), trois extraits natifs indexés dans la galerie.

**Couverture explicitement séparée :** ce parcours principal ne passe pas sur le pont et reste à au moins 55,49 m de la rive. La traversée native du pont et le contrôle de quai sont donc des observations complémentaires distinctes, pas des séquences prétendument présentes dans les trente minutes. Aucun habitant n’a été visible pendant le parcours principal (au plus deux habitants logiques) ; les rencontres rares ne sont pas forcées pour remplir le film. Leur fonctionnement est observé séparément dans les trois routines et quatre rencontres rapprochées. La promenade ordinaire ne démontre donc pas à elle seule la visibilité ou la densité des habitants.

Le [contrôle complémentaire du quai](mission-22-1-evidence/rive-native.json) dure 134,254 s réelles, 133,080 s natives, et parcourt 159,97 m sur une voie piétonne OSM bidirectionnelle de 13,574 m, proche du POI public. Le cap alterne entre ses extrémités ; aucun déplacement du joueur n’est imposé après l’initialisation. Trois chapitres : jour clair, pluie diurne, pluie nocturne. Support exact, zéro collision invalide, erreur JS/WebGL ou image suspecte. La distance minimale à la berge cartographiée est **25,80 m** : le premier seuil de proximité de 25 m n’est pas atteint. La vidéo documente donc un chemin riverain, pas une marche au ras de l’eau ; l’acceptation du contrôle complémentaire est bornée à 30 m et ce résultat initial est conservé dans les données.

La cadence instrumentée est lente : médiane 232,1 ms, P95 814 ms, pic 2 799,3 ms, sur SwiftShader à 400 × 260 avec lecture complète des pixels et campagnes ponctuelles concurrentes. Ces valeurs ne sont pas le benchmark apparié isolé. Le tas après GC passe d’environ 215,0 à 237,9 Mo ; les géométries et programmes croissent avec le streaming et les nouveaux profils/météos (221 → 409 géométries, 19 → 80 programmes). Ce parcours changeant ne prouve pas l’absence de fuite à très long terme. La fermeture de l’audio libère tous ses nœuds, voix et buffers cachés : zéro nœud et zéro octet de cache restants.

## 22. Non-régressions

La compilation, les tests complets, les liens de provenance, la traversée du pont, les obstacles, les supports, les galeries et les flux natifs sont contrôlés. Les packs d’éclairage et d’exposition neige sont recalculés et leurs liaisons vérifiées. Les sources altimétriques, OSM et ancrages géographiques non concernés restent conservés.

**332 tests réussis**, zéro échec, et `npm run build` réussi sur les sources finales. L’avertissement Vite sur la taille du bundle demeure. Les journaux [tests](mission-22-1-evidence/tests.log) et [compilation](mission-22-1-evidence/build.log) sont conservés avec les preuves. Le [contrôle de préservation](mission-22-1-evidence/preservation.json) vérifie les sources et ancrages ainsi que les dérivés reconstruits. Une sauvegarde d’itinéraire devenue incompatible avec le nouveau graphe peut être refusée au chargement ; les identités déterministes ne sont pas réinventées.

Le [contrôle tactile](mission-22-1-evidence/mobile.json) utilise réellement `touchStart/move/end` dans Chromium à 390 × 844 : déplacement de 5,333 m, regard, menu et changement de profil ; zéro erreur JS et aucun débordement horizontal. Film, capture du jeu et capture du menu sont joints. Il valide le flux tactile du navigateur, **pas les performances Android sur matériel**.

La [galerie](mission-22-1-evidence/index.html) est autonome, avec séparation avant/après et métadonnées de caméra. Son contrôle charge les 158 images des 79 paires et les 24 durées vidéo, vérifie la lecture/recherche temporelle sur trois films, la navigation et la largeur mobile. L’[audit média](mission-22-1-evidence/media.json) compare les paquets audio/vidéo, leurs empreintes et horodatages aux captures MediaRecorder brutes. L’indexation WebM ajoute la durée et la recherche sans réencodage ; aucun lissage d’image ou doublage sonore n’est appliqué.

## 23. Limites et acceptation

Le terrain conserve les limites du MNT dix mètres et du raffinement borné ; une comparaison à un levé absolu n’est pas une précision centimétrique. L’emplacement nocturne exact du propriétaire n’est pas établi. L’adaptation diffuse nocturne est artistique. Les corps, vêtements, mains et interactions restent simplifiés. Le repos public nocturne et les portes fermées restent des limites fonctionnelles.

Aucun résultat Android ou GPU physique n’est revendiqué. Les limites géographiques, corporelles et fonctionnelles restent visibles dans les films ; le propriétaire conserve l’acceptation artistique finale.

| Objectif | État | Preuve et limite |
| --- | --- | --- |
| Grandes intrusions du terrain dans le pont et raccord de Rue du Pont | Atteint | Comparaisons, topologie et traversée native aller/retour ; reconstruction bornée, pas un levé absolu. |
| Cohérence de tous les terrains voisins | Partiellement atteint | Sources préservées et inspection bornée ; précision du MNT et ruptures non relevées restantes. |
| Petites marches sur pentes praticables, montée/descente, obstacles | Atteint | Noyau et tests de collision, pas d’augmentation des limites de pente. |
| Suppression de la recoloration artificielle à l’approche | Atteint | Trois modes/profils, mesures contrôlées et six films ; lumière et brouillard réels conservés. |
| Lisibilité nocturne et pluie | Atteint | Comparaisons dans neuf conditions et trois profils ; adaptation artistique, beauté à valider. |
| Naturel des habitants et gestes proches | Partiellement atteint | Appuis, souplesse et raccords améliorés ; corps, mains et vêtements encore grossiers. |
| Silhouettes d’enfant, adulte et senior distinctes | Atteint | Proportions préservées et films proches de vraies identités. |
| Reprise crédible de toutes les fins de routine | Partiellement atteint | Reprise diurne bornée observée ; repos public nocturne restant. |
| Assise et activité de groupe avec début et fin | Atteint | Trois routines natives complètes au jardin, au sol ; usage documenté, approche inférée. |
| Entrées et sorties de bâtiments | Non atteint | Aucun accès intérieur suffisamment validé ; portes fermées non traversées. |
| Richesse et variété sonore humaine | Partiellement atteint | Trois sources CC0, mémoire et silences ; vocabulaire non verbal encore restreint. |
| Faible densité et budgets d’habitants | Atteint | Plafonds 3/4/10 conservés, un lot instancié, pas de foule artificielle. |
| Performance comparée sur l’environnement disponible | Atteint | Neuf cas finaux sous +5 % sur SwiftShader ; aucune certification matérielle. |
| Compatibilité tactile / Android matériel | Partiellement atteint | Gestes et menu testés dans Chromium mobile ; Android physique non disponible. |
| Non-régressions automatisées et sources protégées | Atteint | 332 tests, compilation, préservation et régénération déterministe. |
| Promenade native d’au moins trente minutes | Atteint | 30 min 08,793 s continues et 1,511 km ; pont/quai contrôlés dans des sessions complémentaires identifiées. |
| Agrément artistique global et fidélité absolue | Partiellement atteint | Améliorations visibles ; acceptation du propriétaire et données métriques plus précises nécessaires. |
