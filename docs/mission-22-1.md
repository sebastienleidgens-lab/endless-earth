# Mission 22.1 — Le monde sans faux-semblants

Branche `mission/22-1-realisme-continuite`, depuis `9b9beaab43d41840ce6b6e5e5a5ad34e7927361e`, fusion de la Mission 22 par la PR #31 vérifiée sur GitHub. Budget supplémentaire : **0 €**. Aucun achat, service permanent, changement de Living Paintings / LP-01, fusion ou déploiement.

Ce rapport distingue les corrections vérifiées, les reconstructions et les limites. Une réussite automatisée ne vaut pas validation artistique. La galerie et les traces sont conservées dans [mission-22-1-evidence](mission-22-1-evidence/).

## 1. Audit initial

Lecture d’`AGENTS.md`, des rapports 14–22, de l’ADN artistique, des contrats de provenance, des budgets et scripts existants. Le territoire conserve ses sources IGN/OSM, ses 2 500 ancrages d’arbres, ses bâtiments, saisons, météo, navigation, collisions, résolution adaptative et interface tactile.

Quatre causes sont identifiées : un terrain conservé sous le tablier malgré sa reclassification ; le dévers des berges propagé dans le tablier ; un franchissement de petite marche exigeant un palier presque horizontal ; une contribution colorée des façades interpolée avec la distance. L’ambiance diffuse nocturne était très faible, surtout dans l’hémisphère inférieur, alors que la pluie était directement colorée par son shader.

## 2. Les captures du propriétaire

La vue du pont est retrouvée par l’axe OSM, le tablier et les maisons riveraines. Les stations numériques sont des positions de contrôle dérivées de cette géographie, **pas des coordonnées exactes prétendument extraites des captures**. La position nocturne exacte n’est pas déterminée : les contrôles reproduisent le défaut de forte pluie nocturne dans les mêmes systèmes, notamment en forêt. Les comparaisons avant/après utilisent entre elles les mêmes caméras, dates, météos et profils.

## 3. Diagnostic du terrain

L’ancien sous-sol du pont avait seulement changé de classe route/terre/eau : les triangles hauts restaient visibles à travers la chaussée. Le tablier mélangeait son profil longitudinal à des échantillons transversaux de terrain aux extrémités. Ce dernier mélange transportait jusqu’à environ un mètre de dévers de berge dans une chaussée qui ne possédait pas de relevé de dévers correspondant.

Les indices, le datum IGN69 et le winding ne sont pas établis comme la cause de ces grandes formes. Le MNT à dix mètres et ses raffinements locaux restent par ailleurs des approximations d’un terrain comportant de vraies ruptures.

## 4. Correction géométrique

`prepare-mission-22-1-geometry.mjs` repart des fichiers de la base Git précisée dans le script. Il conserve l’axe et les stations centrales du tablier, reconstruit sa section transversale plane, adapte garde-corps et plinthes, et découpe les anciennes terres dans son emprise. L’eau et les fichiers MNT/raffinement sont conservés.

La Rue du Pont est reconstruite en une chaussée continue de 0,5 m entre stations, sur les 22,964 m de son axe existant. Ses deux altitudes centrales conservées déterminent une pente d’environ 6 %, sans le pic court créé par un déplacement isolé des sommets de fin. Les autres sommets de raccordement raccordent le nouveau dévers sur trois mètres aux extrémités. Leur interpolation affecte également les faces existantes incidentes : ces triangles sont explicitement énumérés dans `roadEndInfluence`. Les tests vérifient cette emprise bornée et les hauteurs source en dehors d’elle. Cette transition est une **reconstruction de chaussée**, pas un nouveau levé. Aucun aplanissement global des berges ou falaises n’est pratiqué.

## 5. Vérification du pont

Le rendu et le support du tablier utilisent toujours le même maillage indexé. Les terres retirées ne remplacent pas le support par une ancienne rampe invisible. Les tests parcourent l’axe dans les deux sens et vérifient les garde-corps, les restrictions de pont inconnu et le support des triangles. Les faces fines sont conservées à distance dans les cellules modifiées pour éviter la réapparition du défaut par LOD.

## 6. Déplacements sur les pentes

Le noyau conserve ses limites de pente et son balayage de dix centimètres. Après une marche de dix-huit centimètres maximum, il échantillonne maintenant un palier de trente centimètres qui peut être incliné. Le support, les obstacles, les ruptures successives et la pente d’ensemble restent contrôlés. Les rampes durablement trop raides, falaises, vides et murs restent interdits.

## 7. Montée, descente et navigation

Le joueur et le placement physique des habitants réutilisent ce noyau. Les tests couvrent les raccords inclinés en montée/descente/diagonale, marches répétées, bordures, pente continue interdite, obstacles et support inconnu. Les graphes ordinaires et de destination sont régénérés depuis le vrai moteur et liés aux nouveaux dérivés. Les escaliers synthétiques testent la règle ; ils ne prouvent pas l’existence d’un escalier particulier dans le village.

## 8. Diagnostic des façades

`architectureFade` mélangeait des tons proches et lointains différents. Le mode photographique mélangeait même sa photo à la palette du bâtiment. La patine avait également une composante dépendant de la distance. Les mipmaps ne suffisaient pas à compenser ces changements d’albédo explicites.

## 9. Matériaux stables

La couleur utilise désormais les mêmes textures métriques filtrées à toutes les distances. Le relief apparent continue de s’atténuer ; les mipmaps et le filtrage réduisent les hautes fréquences. Humidité, soleil, nuages, ombres et fenêtres conservent leurs propriétaires. Les trois modes de matière et les trois profils font partie de la validation. Le brouillard et les occultations réelles peuvent encore changer l’aspect d’une façade lointaine.

## 10. Direction nocturne

L’ambiance du ciel et le retour diffus inférieur reçoivent une adaptation artistique froide, liée à la transition jour/nuit et atténuée par la météo. Elle ne représente pas une Lune cachée. Le supplément lunaire continue de dépendre de l’astronomie, de l’illumination, de la hauteur et de l’occultation. Aucun projecteur sur le joueur, nouvelle passe ou lumière par fenêtre n’est ajouté.

## 11. Nuits et précipitations

La couleur et l’opacité de la pluie nocturne sont réduites pour rétablir son équilibre avec les surfaces Lambert. Les fenêtres et lanternes chaudes sont conservées. La galerie compare Lune, absence de Lune, couvert, pluie, orage, brume, neige, crépuscule et aube dans les trois profils. La lisibilité est jugée sur le personnage, le chemin et les volumes ; la moyenne des pixels reste seulement un indicateur.

## 12. Habitants proches

Les identités, proportions et tenues persistantes restent celles de Mission 22. La représentation conserve un lot instancié commun, ajoute des raccords d’épaules, genoux et coudes proches et une pose plus souple. Les enfants ne sont pas des adultes simplement réduits. Les modèles demeurent stylisés ; ce travail ne livre pas une bibliothèque de personnages photoréalistes.

## 13. Animations

Balancement du buste, respiration au repos, gestes asymétriques, regard discret et rotation amortie s’ajoutent aux jambes à deux segments et aux appuis existants. Le calcul évite une allocation vectorielle dans chaque segment. Les raccords géométriques supplémentaires des articulations sont complets à moins de quatre mètres et se résorbent progressivement dans les segments existants jusqu’à sept mètres ; corps, proportions et accessoires conservent leur identité. Les diagnostics de semelle sont limités aux personnes proches ; les groupes hors du champ continuent leur vie logique sans pose visible.

## 14. Routines complètes

Les intentions conservent départ, trajet, pause, activité et retour. Le changement de destination réinitialise correctement l’activité et vérifie l’admissibilité des modes. La nouvelle activité publique utilise ces états dans le monde natif ; son admission déterministe de validation est séparée de la promenade ordinaire.

## 15. Fins de routines

Une routine diurne terminée peut reprendre un trajet après une pause de douze à trente secondes, avec les mêmes identités. Un échec de continuation n’entraîne pas de téléportation. Les restrictions météorologiques et les départs nocturnes de familles restent protégés. **Limite : un groupe suivi qui termine à une heure incompatible peut encore rester au repos public ; aucune disparition visible ou maison fictive n’est utilisée pour cacher cette limite.**

## 16. Assise et pique-nique

La recherche dépasse l’absence de banc OSM. Deux fiches de l’Office de tourisme de Grand Châtellerault, publiées sur Cirkwi, documentent un usage public de repos : jardin communal/Champ de Foire et quai Périvier. Les photographies accessibles servent à l’examen, sans être copiées comme assets ni utilisées comme relevés métriques.

Un point du jardin est admis après vérification du support, d’un petit dégagement, des collisions et d’une approche intérieure courte depuis la voie de service existante. Cette approche est **inférée**, explicitement séparée du graphe public OSM sauvegardé ; aucune route n’est dessinée. L’emplacement du quai est refusé par les contrôles de planéité. Le siège est **au sol** ; aucun banc ou table prétendument relevé n’est inventé.

L’arrivée ralentit, les personnes se tournent vers l’espace ouvert, s’abaissent, restent assises, effectuent de petits gestes, se relèvent puis repartent. Les groupes peuvent effectuer un pique-nique simple avec un petit bagage interprété. Froid, pluie, neige, nuit, poussette et enveloppe incompatible refusent l’activité. Le mobilier réel et les limites exactes du jardin ne sont pas relevés : l’ancrage reste une reconstruction prudente à revoir artistiquement.

## 17. Entrées et sorties

**Non activées.** Les portes restent des ouvertures décoratives fermées, sans corridor intérieur et occlusion validés. Le recoupement disponible ne justifie pas une entrée publique à travers ces façades. Aucun personnage ne les traverse et aucune disparition n’est présentée comme un retour à domicile.

## 18. Ambiance sonore

Trois nouvelles sources enregistrées CC0 ajoutent un rire bref, une toux et un froissement de vêtement. Les pages de licence, empreintes, découpes, transformations et crédits sont enregistrés. Les événements restent ponctuels, attachés à un habitant proche et à son état ; ils ne créent pas une boucle de foule. Une mémoire bornée évite les répétitions immédiates, impose des silences et conserve une petite variation de voix par identité. Les enfants ne reçoivent pas arbitrairement ces voix adultes.

## 19. Budgets

Plafonds de nouvelles admissions inchangés : **3 / 4 / 10 personnes**, mises à jour de pose bornées et un appel instancié pour les habitants. Les familles déjà visibles restent entières après baisse de profil. Pas de nouveau squelette CPU par personne, texture de visage individuelle, passe de post-traitement ou lumière dynamique par fenêtre.

## 20. Mesures de performance

Les campagnes utilisent Chromium/SwiftShader : ce sont des mesures de rendu logiciel. Aucun GPU physique ou appareil Android n’est disponible dans cet environnement. Les comparaisons doivent être lues avec leurs caméras, résolutions, profils, échantillons et P95 ; une régression éventuelle demeure explicitement visible dans les données.

## 21. Promenade prolongée

Le protocole conserve une session RAF native d’au moins trente minutes réelles, clavier et AutoWalk, plusieurs profils, saisons, vues et météos, sans repositionnement, accélération, population forcée ou bande-son ajoutée. Les sources sont figées par empreintes. Les activités rares utilisent un protocole déterministe distinct.

## 22. Non-régressions

La compilation, les tests complets, les liens de provenance, la traversée du pont, les obstacles, les supports, les galeries et les flux natifs sont contrôlés. Les packs d’éclairage et d’exposition neige sont recalculés et leurs liaisons vérifiées. Les sources altimétriques, OSM et ancrages géographiques non concernés restent conservés.

## 23. Limites et acceptation

Le terrain conserve les limites du MNT dix mètres et du raffinement borné ; une comparaison à un levé absolu n’est pas une précision centimétrique. L’emplacement nocturne exact du propriétaire n’est pas établi. L’adaptation diffuse nocturne est artistique. Les corps, vêtements, mains et interactions restent simplifiés. Le repos public nocturne et les portes fermées restent des limites fonctionnelles.

Les résultats chiffrés et le tableau final sont complétés après les observations natives et la campagne appariée. Aucun résultat Android, GPU physique ou animation seulement montrée en atelier n’est revendiqué.
