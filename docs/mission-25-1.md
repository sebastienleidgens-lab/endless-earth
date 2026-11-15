# Mission 25.1 — Le voyageur et le monde vivant

**Livraison partielle en brouillon. La mission n’est pas achevée.** Deux voyages natifs dépassent 500 m sur des sections distinctes de l’Anglin chargé, avec retour à pied. Le réseau aquatique, le rig, les cycles et les contacts sonores ont progressé. Les bancs/troncs, la qualité artistique complète et les budgets ne sont pas validés par le seul passage des tests.

[Galerie autonome](mission-25-1-evidence/index.html) · [audit et plan](mission-25-1-plan.md) · [sources et licences](mission-25-1-assets.md) · [matrice structurée](mission-25-1-evidence/acceptance.json).

## Base et portée vérifiées

Base distante constatée : `66a078c3febb7fed26c72d23f068cb31cbb5b3e2`, fusion de la PR #35. L’API a confirmé `merged=true`, et la branche M25 pointe à `2617f303`. Nouvelle branche `mission/25-1-voyageur-monde-vivant`. Le statut n’a pas été déduit de l’ancien texte de PR.

**377 tests passent**, contre 369 sur la référence M25 figée ; TypeScript et Vite passent. La première référence avait trois erreurs de dépendance manquante ; `npm ci` a restauré les versions du lockfile sans le modifier, puis les 369 tests ont passé. Les deux assertions historiques du nombre d’os sont actualisées de 19 à 31 ; les contrôles d’appui et de skinning sont conservés.

**657 fichiers protégés inchangés** : données publiques, terrain/collisions, graphe terrestre, géographie, workflows et adaptateurs Living conservés, avec une exception déclarée : `src/living/sound.ts`, nécessaire aux nouveaux contacts et au partage de la graine audio. Les **2 898 requêtes de collision et 20 déplacements terrestres** correspondent à la référence. Les défauts de talus, raccords et pont M23/M24 restent visibles dans les stations de régression. Aucun changement à Living Paintings / LP-01, aucune fusion ni mise en ligne.

## Intégration des neuf chantiers

Le réseau `water-network.mjs` dérive ses nœuds et corridors de l’eau effectivement chargée, du support existant et des refus physiques. Il trouve **6 086 nœuds, 22 159 liens et six composantes**, avec 723 accès géométriquement compatibles dans cet inventaire. Ce ne sont pas des accès de baignade officiels. Les liens sont balayés, et la coque reste contrôlée à chaque sous-pas. Une recherche multi-source conserve les retours vers les accès ; aucun graphe global n’est reconstruit à chaque frame. La construction initiale coûtait environ **40–45 s CPU/wall synchrones** dans les diagnostics ; en production elle est fractionnée en tranches coopératives. Ce coût initial reste une réserve de performance. Le pilote reste borné : pas de streaming fluvial infini ni de passage sous pont dont la hauteur libre serait inconnue.

Le packraft passe de quatre à **deux appels de dessin**, de 744 à **488 triangles**, avec un matériau partagé et couleurs de sommets. La navigation assistée conserve les positions continues. Une correction finale oblige l’accostage à passer par le point d’eau puis le corridor de berge inspecté ; un test avec un obstacle sur la diagonale démontre que ce raccourci n’est plus emprunté. Le film `final-bank-corridor` contrôle cette dernière version sur un cycle court.

Le voyageur conserve **un SkinnedMesh, un matériau, 31 os, 3 312/1 656 triangles**, sans texture image. Cou, clavicules, prises des doigts regroupés et couvercle du sac sont articulés. Les matrices logiques représentent 1 984 octets, pas une mesure de VRAM. Tous les os restent actifs dans les profils ; seul le détail géométrique change. `clips.mjs` apporte des clés originales de contact, compression, propulsion et récupération avec mélange marche/jogging/course. **Le système reste hybride**, avec un rôle important de l’IK et des poses procédurales de nage/pagaie/assise ; aucun pipeline humanoïde complet, retargeting ou résultat AAA n’est revendiqué. Le sac est abaissé en nage, mais son apparence reste perfectible.

`InteractableSurfaces` exige sémantique, provenance, permission, collider, surface et balayage corporel. Le monde ne fournit actuellement pas le contrat complet pour des bancs, rochers ou troncs ; ils restent donc non activés. L’assise au sol est revalidée et se termine si son support disparaît. Aucun volume de décor n’est arbitrairement rendu franchissable.

`WaterContacts` observe les mains et la pagaie par rapport à la surface chargée ; le même identifiant alimente rides et bruitage, sans double son d’un contact immergé. Le sillage est borné et lié à la distance parcourue. Les nouveaux bruitages sont de la **synthèse originale**, pas des captations naturelles ; ils réutilisent l’AudioContext existant, 15 petits buffers réutilisés et les budgets de voix. La respiration et la projection détaillée restent ouvertes. L’eau demeure opaque ; aucun fond réel ou transparence bathymétrique n’est inventé.

Le champ de vent partagé combine variations secondes, minutes et heures, avec interpolation lisse déterministe. Le porteur CPU alimente aussi le GPU ; végétation, particules, eau et mix existants lisent ce même climat. Les traces de trois heures sont de la **simulation**, pas une vidéo native accélérée. Les vêtements et toutes les nuances acoustiques demandées ne sont pas intégralement traités.

Les oiseaux utilisent des silhouettes solides originales instanciées, branches connues, envols et familles génériques. Les sources proches visibles sont reliées à leurs voix. Des fenêtres calmes et intervalles irréguliers complètent l’anti-répétition et les profils saisonniers existants. La silhouette générique n’atteste pas une identification biologique ; les formations d’oies, plans proches et comportements complets ne sont pas tous démontrés nativement. Les chants existants et leurs licences restent inchangés.

Le renderer sonore existant spatialise les couches rivière/toiture et les contacts de pas ; les voix mobiles suivent leurs positions. Le HRTF cède la place à un panner `equalpower` lorsque son quota est occupé. L’occultation reste limitée aux obstacles connus, sans acoustique scientifique revendiquée. Le test `audio-contract.json` prouve deux contacts distincts, une voix HRTF + une voix de repli en Éco, une sortie stéréo non silencieuse et zéro ressource après destruction ; c’est une fixture technique séparée des films du pilote.

## Preuves et limites natives

- **voyage-3** : 548.2 m à 1 Hz ; 555.7 m en sommant les frames (installation/retour inclus), 638.88 s de vidéo native ; état final `walking`.
- **voyage-5** : 549.3 m à 1 Hz ; 566.7 m en sommant les frames (installation/retour inclus), 1113.29 s de vidéo native ; état final `walking`.

Les contrôles accélérés du moteur parcourent aussi environ 548 m sur chacune des deux sections : ils sont étiquetés séparément des vidéos. Le premier essai bloqué après 4,3 m est conservé sous `failed-voyage-3`, sans être présenté comme succès. Les traces ont des coordonnées locales et un export GeoJSON suivant exactement le repère du projet ; aucune nouvelle observation GPS ou bathymétrique n’est revendiquée.

Les trois nouveaux films de nage ont une piste audio, des contacts d’entrée/bras/sortie et leurs positions. Les quatre comparaisons de course et les prises pente/escalier sont nouvellement enregistrées ; aucune vidéo d’une ancienne mission n’est réutilisée comme preuve M25.1. **Les vitesses/trajectoires effectivement couvertes diffèrent avec les faibles FPS** : mêmes placements et entrées ne suffisent pas à une comparaison artistique parfaitement appariée. Le rendu logiciel et la couverture incomplète des huit cas sous quatre angles empêchent d’annoncer la fluidité demandée.

Le plan fixe de forêt dure plusieurs minutes. Le premier film intitulé `living-walk-native` est en réalité resté immobile : il est conservé comme essai statique et ne valide pas une marche. Le second `mapped-sound-walk-native` utilise une voie publique réellement validée et contient une marche native ; la couverture simultanée forêt/village/berge et le retour au camp restent à examiner dans sa trace, sans les déduire du trajet prévu. Le camp existant verrouille l’activité : une promenade libre laissant le feu installé n’est pas livrée.

Les médias gardent leurs paquets encodés et timestamps : seul le conteneur WebM reçoit durée/index par copie de codecs. L’audit inspecte effectivement les pistes, les niveaux décodés et les différences gauche/droite. Cela prouve la présence du mix et des différences de canaux, pas à lui seul le réalisme artistique ou l’identité de chaque son. Les bruts et leurs empreintes sont conservés.

Les prises documentent plusieurs révisions **de cette mission** : `capture-v1` pour course et voyage 5, `navigation-capture` pour voyage 3, `sensory-capture` pour nage/ambiances, `render-benchmark` pour la marche cartographiée et le corridor final, `grip-capture` pour la dernière pagaie et l’approche sonore de rivière, `final` pour le nettoyage des cycles d’envol, le tactile et la production locale. Les différences de sources sont explicites dans `preservation.json`. Les longs trajets n’ont pas été intégralement refilmés après les derniers ajustements d’accostage, de prise de pagaie et de cycle d’envol : **validation finale exhaustive encore ouverte**.

## Performances et appareils

Équilibré, huit scènes ordinaires : médiane des écarts **+0.57 %**, pire scène **+8.05 %** ; **2/8** au-dessus de +5 %.

Coût isolé de la coque, même avatar assis/caméra : **eco : -9.54 % ; balanced : +5.82 % ; quality : +8.49 %**. Voir les échantillons complets, P95, appels, triangles, buffers logiques et heap. Les états physiques « à pied / bateau actif / rangé » ont leur mesure distincte : le joueur change réellement de position à la berge, donc ces trois états ne sont pas un trajet apparié au mètre près.

Les benchmarks ordinaires couvrent dix scènes × trois profils, dont forêt ventée, activité d’oiseaux, nuit et neige. Ils mesurent le rendu `gl.finish` et une partie du CPU, **hors construction initiale du réseau et hors simulation exhaustive/audio actif**. Les vidéos longues sont arrêtées avant les benchmarks. Ces résultats SwiftShader ne valident ni un vrai GPU ni l’objectif global de +5 % sur téléphone.

Le tactile CDP 390 × 844 contrôle déplacement, sortie/rangement du bateau, débordement et cibles d’au moins 44 px. Le build compilé fait l’objet d’un contrôle local séparé. **Aucun appareil Android physique, casque ou haut-parleur matériel n’est validé.** Les réserves de qualité/performance restent bloquantes.

## Matrice d’acceptation

| Demande | État | Réserve |
| --- | --- | --- |
| 1 — Packraft | **Partiel** | Réseau connecté et conservateur, passages sous pont refusés, deux appels de dessin. Voir distances et accostages mesurés ci-dessous ; streaming au-delà du pilote et budget complet restent ouverts. |
| 2 — Personnage / rig | **Partiel** | 31 os, cou, clavicules, doigts regroupés et couvercle de sac ; un SkinnedMesh et LOD partagés. Silhouette encore stylisée ; nage/pagaie restent en grande partie procédurales, pas de qualité AAA revendiquée. |
| 3 — Course naturelle | **Partiel** | Cycles originaux marche/jogging/course, tests d’appuis multi-cadences et films appariés. La faible cadence logicielle et une couverture artistique incomplète empêchent de conclure à une course nettement plus naturelle. |
| 4 — Interactions réelles | **Partiel / objets non atteints** | Bibliothèque sémantique et revalidation ajoutées, assise au sol conservée. Aucun banc/rocher ni tronc avec le contrat géométrique et le balayage corporel requis n’est activé ; aucun film de ces gestes n’est revendiqué. |
| 5 — Nage sensorielle | **Partiel** | Contacts articulaires communs aux rides et bruitages originaux, sac abaissé, eau reliée au champ de vent. L’eau reste opaque ; trois accès à examiner dans les nouveaux films. Respiration, projections détaillées et matrice météo complète restent ouverts. |
| 6 — Vent multi-échelle | **Partiel** | Champ partagé CPU/GPU à variations secondes/minutes/heures, traces déterministes. La diversité acoustique et la qualité sur matériel physique ne sont pas démontrées dans leur totalité. |
| 7 — Chants | **Partiel** | Silences déterministes, anti-répétition, sources fixes et visibles liées. Catalogue sourcé conservé ; couverture native de tous les habitats et réponses entre individus non démontrées complètement. |
| 8 — Oiseaux visibles | **Partiel** | Corps/ailes originaux instanciés, perchoirs sur branches connues, envols et familles longues ailes/oies saisonnières. Gros plans, trajectoires, LOD et formations artistiquement convaincants restent à valider. |
| 9 — Espace sonore 3D | **Partiel** | Rivière/pluie sur toiture en panners 3D, voix mobiles liées, repli equalpower, occultation existante conservée. La marche sonore complète avec retour au camp et écoute sur casque/appareils physiques reste ouverte. |

## Reproduire et poursuivre la revue

Les versions de référence et les instantanés runtime sont décrits dans `preservation.json`. Référence sur 5361 ; candidat final sur 5367. Les scripts distinguent les sources, captures et simulations et ne fusionnent rien.

```sh
npm ci
npm test
npm run build
# Dans des terminaux distincts : référence M25 sur 5361, candidat sur 5367.
# Référence : git worktree add --detach work/mission-25-1/reference 66a078c3febb7fed26c72d23f068cb31cbb5b3e2
# Dans cette référence : npm ci puis npm run dev -- --port 5361
# Candidat courant : npm run dev -- --port 5367
M251_PORT=5367 node scripts/record-mission-25-1-voyages.mjs
M251_PORT=5367 node scripts/capture-mission-25-1.mjs water
M251_PORT=5367 node scripts/capture-mission-25-1.mjs atmosphere
node scripts/record-mission-25-1-final.mjs
node scripts/benchmark-mission-25-1.mjs
node scripts/benchmark-mission-25-1-active.mjs
node scripts/benchmark-mission-25-1-states.mjs
node scripts/preserve-mission-25-1.mjs
python scripts/analyze-mission-25-1-media.py
python scripts/report-mission-25-1.py
```

Les films de forêt/riverbank supplémentaires et l’examen artistique restent des critères à satisfaire, pas des demandes d’accepter silencieusement les manques. Budget externe supplémentaire : **0 €** ; aucun nouveau service, compte, clé, abonnement ou asset tiers. **PR en brouillon, sans fusion ni déploiement.**
