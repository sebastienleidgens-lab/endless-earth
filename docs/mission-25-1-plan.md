# Mission 25.1 — audit et plan d’intégration

Base vérifiée le 15 novembre 2026 : `main` = `66a078c3febb7fed26c72d23f068cb31cbb5b3e2`, fusion de la PR #35. Git distant et API de la PR concordent (`merged=true`). La branche Mission 25 pointe à `2617f303da9511350d3e5026675c60e61ed779c8`. Aucun statut n’est déduit du texte historique de la PR. Branche de travail : `mission/25-1-voyageur-monde-vivant`.

## Contrats examinés

AGENTS.md, ADN artistique et rapports M10–M25 : calendrier/climat M11, hiérarchie moteur/région/données M12, budgets de vie M17–M19, météo/audio M20–M22, support/collisions M23, neige/camp M24, activités/bathymétrie M25. Les défauts M23 de talus et de raccord routier restent ouverts.

- `PlayerActivity` reste propriétaire des exclusions et transactions ; la physique terrestre M23 n’est pas modifiée.
- `AquaticController` exige une profondeur de jeu explicitement estimée et un retour vérifié. Le retour M25 se limite à un segment direct de 110 m et peut fermer un méandre pourtant connecté.
- `PackraftController` : cinq sondes de coque, inertie, sous-pas ; quatre appels de dessin, 744 triangles dans le rapport M25. Pas de navigation sous pont prouvée.
- Rig M25 : 19 os, un SkinnedMesh, 3 072/1 536 triangles ; animation originale procédurale, IK de jambes et mains. Pas de clips importés ou de retargeting. Captures M25 courtes et lentes sous SwiftShader, insuffisantes pour une validation artistique générale.
- Climat partagé : `scene.userData.climate`, `windAtWorld`, `windTemporal` et contrat GPU commun ; ne pas créer de météo supplémentaire.
- Audio : un AudioContext dans `Soundscape`, un `AcousticRenderer`, budgets de voix/HRTF et occultation des bâtiments connus. Perchoirs fixes et catalogue de chants sourcés existent déjà ; silhouette visible actuelle à trois points.
- Terrain chargé : pilote borné, pas un monde fluvial infini. Les frontières du support connu restent fermées. Aucune hauteur libre sous pont, bathymétrie mesurée, assise ou tronc franchissable ne sera supposé.

## Jalons

1. Réseau de corridors de l’eau chargée, construit une fois, connectivité vers les accès admissibles et traces de limites. Conserver les collisions à chaque déplacement et les refus de pont.
2. Clips originaux de locomotion et rig articulé (cou/clavicules/mains/sac), corrections d’appui après animation ; comparaisons natives sur la même base.
3. Couche sémantique d’interactions liée aux surfaces/colliders connus, revalidation et interruptions. Refuser les objets non inspectables.
4. Contacts aquatiques provenant des articulations, effets bornés, sons originaux dans l’AudioContext existant ; placement du sac cohérent.
5. Vent partagé multi-échelle CPU/GPU ; eau, végétation et mix lisent le même champ. Tests de déterminisme et traces longues.
6. Événements vocaux moins répétitifs, familles de silhouettes et sources mobiles liées ; sources fixes réellement spatialisées.
7. Validation intégrée : tests antérieurs, build, production locale/tactile, préservation, benchmarks appariés, médias natifs et matrice des neuf objectifs. Brouillon sans fusion ni déploiement.

Risques principaux : construction initiale du graphe et obstacles, perte d’appuis avec des cycles plus expressifs, coût des petites silhouettes et des HRTF, dispersion SwiftShader. Mesurer avant de conclure ; le matériel physique et la revue artistique humaine ne sont pas disponibles par simple assertion.
