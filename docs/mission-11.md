# Mission 11 — Le monde prend vie

## État courant — Jalon D livré pour revue finale

Votre **« Go »** ouvre le Jalon D après le commit C `95bc4b3`. Le travail porte sur le coût des calculs, les chargements audio sous pression et les reprises du navigateur. Les effets, les profils et les ressources sonores de A/B/C sont conservés. **Quatrième commit identifiable, PR #20 toujours en brouillon, sans fusion ni publication sur la version principale.** L’appréciation artistique finale appartient au propriétaire.

Ouvrir la **[galerie de synthèse D](mission-11-evidence/optimization/index.html)** : comparaison C/D, mesures par profil/condition, capture audio de quinze minutes et accès aux galeries A/B/C. La [vidéo simultanée du Jalon C](mission-11-evidence/coherence/ambiances.webm) reste disponible. Aucun rendu généré ou retouché ne sert de preuve.

Pour une prévisualisation isolée : `npm run build`, puis `npm run preview -- --port 5180`, et ouvrir `http://localhost:5180/endless-earth/?perf=1` dans un navigateur avec WebGL. La galerie se consulte sur le serveur de développement, `http://localhost:5173/endless-earth/docs/mission-11-evidence/optimization/index.html`. Aucun de ces serveurs locaux ne modifie l’hébergement public. Le Chrome partagé de cet environnement ne fournit pas WebGL ; la galerie et les lecteurs y fonctionnent, tandis que les tests 3D utilisent un Chromium distinct avec SwiftShader.

## D — Optimisations retenues

- **Calcul solaire et heure locale mis en cache à la seconde.** Le modèle solaire existant n’utilise pas les millisecondes. La date UTC continue à suivre l’horloge à chaque image ; le soleil et les deux formatages civils ne sont recalculés que lorsque la seconde change, y compris pendant les transitions. Les moments manuels figés réutilisent leurs valeurs. Le contexte acoustique reçoit les informations temporelles déjà calculées, ce qui évite un second `Intl.DateTimeFormat` par requête géographique.
- **Travail shader inutile écarté.** À luminosité diurne nulle, la diffusion solaire ne contribue pas à la couleur : son calcul est évité. Les étoiles sont calculées lorsque leur visibilité est positive. `cos(acos(x))` devient directement `x`. Ces conditions conservent les contributions demandées pendant les transitions.
- **Nuages en pleine résolution.** Les couleurs et seuils dépendant uniquement de l’état commun sont calculés une fois par image. Les deux altitudes, bruits, éclairage de détail, advection, ombres et budgets existants restent en place. Aucun framebuffer, texture ou programme supplémentaire n’est ajouté. Des essais préliminaires de filtrage dans une texture et de fusion des passages n’ont pas été retenus : ils augmentaient le coût logiciel. Le résultat conserve le pipeline de rendu à deux passages de C.
- **Admission audio avant fetch/décodage.** Le chargeur vérifie si le fichier peut coexister avec les buffers réellement épinglés par les voix. Il utilise la durée du catalogue mono et la fréquence réelle du contexte, puis conserve le contrôle exact des octets après décodage. Un manque de place reporte la demande ; il ne marque pas la ressource comme défaillante. Le contrôle est répété avant le décodage si le jeu de buffers épinglés a changé pendant le fetch. Le cache reste à 24 MiB et la concurrence à deux opérations.

Le test de pression charge et épingle six captations réelles, soit **23 040 000 octets**, puis demande huit fois une captation de pluie trop grande pour l’espace restant. C effectue huit appels fetch et huit décodages supplémentaires ; D n’en effectue aucun. Après libération de deux buffers, la même pluie est admise normalement. Ce sont des **appels au chargeur**, pas une affirmation de huit transferts complets sur le réseau : le cache HTTP du navigateur peut intervenir. [Preuve et protocole](mission-11-evidence/optimization/audio-cache.json).

## D — Mesures comparatives

La matrice compare C et D à la même station forestière, en 800 × 600 : **trois profils × cinq situations × son coupé/actif × deux tours**, huit rendus synchronisés par version et cas. L’ordre C/D alterne à chaque échantillon. Les situations couvrent matin clair, après-midi couvert/venteux, soir pluvieux, nuit claire et nuit orageuse. Toutes les six météos sont aussi exercées dans le test de changements rapides.

| Profil | Médiane C | Médiane D | Évolution du temps |
| --- | ---: | ---: | ---: |
| Éco | 177.00 ms | 177.80 ms | +0.45 % |
| Équilibré | 186.50 ms | 179.05 ms | −3.99 % |
| Qualité | 184.40 ms | 174.80 ms | −5.21 % |

Il s’agit du temps de rendu avec synchronisation et lecture des pixels sous **SwiftShader**, sur une machine partagée. Ces résultats ne sont pas des FPS physiques ou une garantie de gain sur Android. Les différences sont modestes ; Éco reste proche de C. Les cas individuels et leurs P95, y compris ceux moins favorables, sont dans le [CSV](mission-11-evidence/optimization/performance.csv) et la [synthèse complète](mission-11-evidence/optimization/summary.json). La [trace brute compressée](mission-11-evidence/optimization/matrix.json.gz) conserve tous les échantillons et compteurs.

Le coût moyen isolé d’actualisation de l’atmosphère passe respectivement de **.0078/.0072/.0055 ms à .0055/.0045/.0037 ms** en Éco/Équilibré/Qualité. Les durées sont très petites et quantifiées par l’horloge du navigateur ; il s’agit de moyennes sur des appels contrôlés, sans coût de rendu, pas d’un gain équivalent de temps d’image.

Les intervalles réels entre images et les durées de soumission sont mesurés séparément sur matin clair et nuit orageuse, son coupé/actif. Les deux premières images après chaque pause volontaire du banc sont exclues de leur résumé, mais conservées dans la trace. La soumission WebGL peut attendre le moteur logiciel ; elle ne représente pas uniquement la logique JavaScript.

L’extension `EXT_disjoint_timer_query_webgl2` étant présente, elle est effectivement interrogée dans un protocole séparé. Les [requêtes brutes](mission-11-evidence/optimization/timers.json) gardent disponibilité et indicateur disjoint. **Ces mesures sont celles de la file graphique logicielle** ; leurs petits groupes séquentiels restent variables et ne démontrent pas une amélioration GPU uniforme. Aucun GPU physique n’est disponible ici.

Les quinze paires d’images issues du canevas réel ont un **écart maximal d’un niveau sur 255**, avec un P99 nul dans ces captures. La plus grande erreur moyenne par canal RGBA est .000702/255. Les appels de rendu, triangles et lignes coïncident dans les 480 paires d’échantillons. L’inventaire séparé attend aussi la fin du préchargement asynchrone : mêmes matériaux, géométries, textures et programmes à station/profil identiques. Les nombres de matériaux et programmes sont détaillés dans l’[inventaire](mission-11-evidence/optimization/inventory.json).

Cette matrice compare **C à D à une station donnée**. Elle ne refait pas les six stations du benchmark A et n’efface pas le surcoût A de **19.5–34.5 %** observé face à la version antérieure de la mission. La validation de la fluidité sur GPU physique et Android reste ouverte.

## D — Robustesse exécutée

- **30 changements rapides** de profil, heure et météo dans la véritable boucle rendue ; état final orageux cohérent, pluie visible dans les trois profils et absence de chants diurnes dans la nuit stabilisée.
- **36 destructions/recréations de l’atmosphère**, avec rendu effectif, un seul panneau météo, sept textures et un plateau de géométries/programmes par profil. **24 créations/destructions de contextes audio**, fermeture idempotente et compteurs de nœuds/cache à zéro. Ces compteurs ne prétendent pas mesurer toute la mémoire du pilote ou du processus.
- **Véritable onglet en arrière-plan** : `document.hidden` devient vrai, le véritable AudioContext est suspendu et la marche s’arrête. Au retour, le son reprend et les choix restent conservés ; la marche attend une nouvelle action. Un gel/reprise natif CDP de trois secondes est testé séparément sur le build local compilé. Playwright est connecté avec son option publique `noDefaults` pour désactiver son émulation habituelle de pages toujours actives. Aucun remplacement de `document.hidden` ou événement de visibilité synthétique n’est utilisé. Le serveur de développement rechargeait la page lors de la reconnexion Vite après gel ; ce cas est donc vérifié sur le build local sans client HMR.
- **Retour au temps réel**, sur build compilé sans date de diagnostic : date UTC courante, heure Europe/Paris et soleil comparés au modèle original de part et d’autre d’une seconde civile.
- **Données manquantes** : réponses 404 volontaires du descripteur MNT ou d’OSM. Le statut signale l’indisponibilité, les déplacements restent bloqués tant que la géographie n’est pas prête et la météo reste réactive. Les diagnostics d’erreur attendus sont conservés.
- **Navigation et caméra** : obstacles de bâtiment, zone privée, eau, mur et ruines injectés dans le test après démarrage de la marche ; arrêt avant chaque obstacle. Zoom mémorisé, verrou de caméra pendant le glissement, recentrage et retrait devant un mur vérifiés. Smoke 3D : chargement, trois vues, déplacement, hauteur d’œil, arrêt sans dérive, son, choix de profil et viewport mobile.
- **Mobile et clavier** : panneaux météo dans les orientations portrait et paysage, consommation des flèches par les sélecteurs sans déplacement du joueur ; commandes tactiles dans une émulation mobile Chromium. Une émulation ne vaut pas un appareil Android physique.

[Cycles et changements rapides](mission-11-evidence/optimization/runtime.json) · [Visibilité native et gel](mission-11-evidence/optimization/visibility.json) · [Horloge actuelle](mission-11-evidence/optimization/clock.json) · [Données manquantes](mission-11-evidence/optimization/missing-data.json) · [Mobile tactile](mission-11-evidence/optimization/mobile.json) · [Validation](mission-11-evidence/optimization/validation.json).

## D — Promenade prolongée et écoute

Session réelle de **903.952 s** (quinze minutes), dont neuf minutes consacrées à la marche automatique. La distance cumulée entre relevés est d’environ **696.1 m**, avec une reprise de route existante et sans téléportation pendant les phases de marche. Le moteur admet **329 pas sonores, 6 chants et 2 événements routiers**. Pic de **6 voix**, cache maximal **24,730,140 octets**, aucun dépassement de 24 MiB, deux demandes reportées par le contrôle d’admission et aucune erreur JavaScript détectée. La capture décodée ne présente aucun écrêtage (pic 0.0961, RMS -46.35 dBFS), sans normalisation.

La mémoire JS après collecte passe de **77.50 à 78.88 MiB** ; cette seconde mesure précède l’arrêt du recorder et inclut son instrumentation. Ce n’est pas une mesure de toute la mémoire native. Le renderer reste à au plus **19 programmes / 352 géométries** pendant les changements de zone/profil. Après fermeture : AudioContext **closed**, **zéro nœud, zéro octet de cache et zéro chargement actif**. Les empreintes des sources sont vérifiées inchangées sur toute la session.

L’enregistrement vient du véritable AudioContext après limiteur, avec la boucle du jeu et le rendu WebGL actifs. La capture et l’observation ajoutent du travail : cette session ne sert pas de benchmark comparatif de FPS. Les déplacements de station sont des changements explicites de poste de test, pas une promenade continue ni des chemins publics inventés. Le compteur de distance additionne les positions relevées pendant les phases de marche ; il constitue une approximation inférieure de la longueur effectivement parcourue.

[Capture intégrale](mission-11-evidence/optimization/session-15min.webm) · [Résumé de session](mission-11-evidence/optimization/session-15min.json) · [Relevés temporels compressés](mission-11-evidence/optimization/session-trace.json.gz) · [Évolution des ressources](mission-11-evidence/optimization/session-stability.svg).

## D — Préservation et limites finales

Les **93 ressources / 40 sources audio**, leurs empreintes et crédits, les données IGN/ASP/OSM et les règles de relief/navigation/collision restent conservés. Aucun changement Living Paintings / LP-01 ou workflow de production. Les preuves A, B et C restent archivées ci-dessous et leurs fichiers sont conservés à l’identique.

Budgets conservés : Éco **8 voix / 1 HRTF / 2 lits / 2 Hz** ; Équilibré **12 / 2 / 3 / 2 Hz** ; Qualité **12 / 3 / 3 / 4 Hz**. Cache décodé **24 MiB**, deux chargements/décodages simultanés au plus. La mémoire native transitoire d’un décodage, le cache HTTP et les buffers d’enregistrement sont distincts de ce cache ; ils ne sont pas présentés comme inclus dans les 24 MiB. Les dégradations structurelles de profils, dont la réduction de détail Éco, sont celles déjà documentées dans A/C.

Reproduction développeur : le banc C utilise le commit `95bc4b3` dans un worktree détaché servi sur le port 5179 ; D utilise le port 5173. `npm run bench:immersive` exécute matrice et minuterie, puis `npm run report:immersive` produit la synthèse. `npm run test:immersive` couvre les contrôles rapides, `npm run test:immersive:soak` la session réelle et `npm run test:immersive:visibility` le contrôle X11 sur le build compilé du port 5180.

Compilation et **163 tests Node réussis**. L’avertissement Vite du bundle supérieur à 500 kB reste visible. Les commandes et scripts reproductibles figurent dans la [validation](mission-11-evidence/optimization/validation.json) ; les empreintes des sources de la session dans son résumé. Un affichage X11 de test est nécessaire au contrôle natif de visibilité ; la galerie et l’écoute n’en nécessitent aucune manipulation technique.

À valider humainement : naturel et présence des sons, équilibre des ambiances, lisibilité de la nuit et plaisir de promenade. Limitations conservées : captations réalisées ailleurs qu’à Angles, données de débit/trafic/espèces locales non mesurées, nuages 2.5D et ombres fines approximatives, pluie sans occlusion fine des toits/impacts/flaques, surfaces mouillées non ajoutées, nuit sans lune ni éclairage architectural inventé, orage sans nouveau système d’éclairs et tonnerre synchronisés. Les P2 ne sont pas développés au détriment des priorités principales.

**La revue artistique finale et les mesures sur appareil Android/GPU physique restent nécessaires. Aucune fusion ou publication n’est effectuée.**

## Archive — état à la soumission du Jalon C

Votre **« Go jalon c »** autorise le Jalon C à la suite des commits A `dbafd13` et B `a990a12`. Cette étape corrige et démontre la cohérence perceptive des cinq ambiances et du retour à l’heure réelle. **À cette soumission, le Jalon D restait en attente de votre validation.** La branche et la PR #20 restent en brouillon, sans fusion ou déploiement public.

Ouvrir la **[galerie audiovisuelle du Jalon C](mission-11-evidence/coherence/index.html)** sur le serveur de développement. Elle propose une capture continue avec chapitres, les six paires d’images avant/après et les traces de synchronisation. Pour la lancer : `npm run dev -- --port 5173`, puis `http://localhost:5173/endless-earth/docs/mission-11-evidence/coherence/index.html`. Cette galerie locale ne nécessite pas WebGL ; la capture du jeu provient d’un Chromium distinct avec SwiftShader. Elle complète les galeries A et B conservées ci-dessous.

## C — Corrections de cohérence

L’audit trouvait quatre décalages concrets : les requêtes acoustiques et la pluie utilisaient la caméra de l’image précédente ; l’audio conservait une copie de l’heure et du vent jusqu’à la prochaine requête géographique ; les gouttes recalculaient leur position en multipliant la nouvelle vitesse par tout le temps écoulé ; les fondus de quatre secondes pouvaient prolonger un ancien lit météorologique.

- **Un état partagé.** `climate` et `acousticClimate` désignent maintenant le même objet mutable. L’heure UTC, l’heure civile Europe/Paris, la saison, la hauteur solaire et le vent local sont synchronisés à chaque image. Les calculs de proximité, perchoirs et décisions de mix restent bornés à 2 Hz en Éco/Équilibré et 4 Hz en Qualité, avec une actualisation supplémentaire par commande. L’égalité des données n’est pas une promesse de synchronisation instantanée des échantillons audio.
- **Un vent local commun.** Le champ existant fournit les rafales aux gouttes, au feuillage proche et au mix. Éco reçoit le même vecteur local que l’écouteur ; les autres profils gardent leur champ spatial aux arbres. L’advection des nuages intègre ce porteur local, avec une faible dérive résiduelle de la couche haute. Le bruissement conserve sa loi de gain B, avec un lissage de .45 s ; un enregistrement n’est pas une simulation du son de chaque feuille. Le vent est une force simulée normalisée, sans revendication de mesure en m/s.
- **Pluie continue.** Le déplacement des gouttes est intégré. Changer le vent sans avancer le temps ne déplace plus toute la pluie. Changer de caméra place ciel, gouttes et écouteur sur la position courante de la même image. Nombre de gouttes conservé : 260 / 520 / 900.
- **Transitions manuelles.** Le bus audio répond avec une constante de .32 s pendant la transition ; l’entrée initiale d’un nouveau lit utilise .35 s et le retrait d’un ancien lit .65 s. Les fenêtres de captations continuent à se croiser sur quatre secondes en régime établi. Les charges météo sont demandées avant le préchargement d’oiseaux, sans augmenter cache ou concurrence. Le volume maître, les pas et les gains stationnaires de rivière sont conservés.
- **Animaux et nuit.** Les chants diurnes déjà en lecture s’effacent en .45 s lorsque le soleil passe sous l’horizon, que la pluie dépasse .2 ou que le vent local dépasse .8. La même condition ferme la programmation des nouveaux chants. La nuit claire ne reçoit aucun chœur nocturne inventé. Les étoiles utilisent un uniforme explicite et disparaissent sous la couverture de pluie/orage.
- **Tonnerre admissible seulement en orage.** La source existante `fs-501243` annonce explicitement du tonnerre très lointain. Elle est maintenant exclue de la pluie ordinaire (force ≤ .8) et ses voix se retirent en .65 s si elles deviennent inadmissibles. La source `fs-231687` couvre les averses ordinaires. Aucune nouvelle ressource ou générateur de foudre n’est ajouté ; un éventuel tonnerre enregistré n’est pas accompagné d’un éclair synchronisé.

## C — Vérifications et démonstrations

Les commandes utilisent les véritables sélecteurs du jeu. La caméra reste à la station forestière cartographiée du Jalon B (`214.42, 530.66` dans le repère local) pour comparer les changements sans déplacer le joueur. La date de référence du matin jusqu’au retour au calme est le 10 mai 2026 ; la nuit franchit minuit. Le dernier chapitre retire la référence de diagnostic et revient à l’heure UTC actuelle avec affichage Europe/Paris.

| Situation | Éléments vérifiés ensemble |
| --- | --- |
| Matin ensoleillé | Soleil bas, lumière douce, ciel clair, vent léger, perchoirs et activité diurne plausibles ; chants laissés au directeur naturel |
| Après-midi venteux | Couverture accrue, nuages advectés, feuillage et bruissements alimentés par le même champ |
| Soir pluvieux | Baisse de lumière, couverture et brume, gouttes et lit de pluie réel |
| Nuit claire | Hauteur solaire négative, lumière réduite, étoiles admissibles et absence de chants diurnes actifs |
| Nuit orageuse | Étoiles masquées, nuages sombres, pluie, vent et rafales ; captation avec tonnerre lointain admissible |
| Retour au temps réel | Date UTC proche de l’horloge courante, heure locale Europe/Paris identique dans le rendu et l’audio |

La séquence couvre **soleil → pluie → soleil**, **jour → nuit → jour** et **vent léger → vent renforcé → vent léger**, avec un passage supplémentaire par l’orage. Le profil « Couvert » fournit l’après-midi venteux sans ajouter de réglage isolé du vent. Les six météos et cinq moments A restent disponibles.

Les résultats chiffrés sont dans **[summary.json](mission-11-evidence/coherence/summary.json)**. Dans les comparaisons courtes, l’écart maximal entre date simulée graphique et contexte audio passe de **12 575 789 ms à 0 ms** sur les observations collectées. Le grand nombre avant C correspond à une date simulée parcourant des heures pendant une transition de 2.4 s ; il ne signifie pas un son resté en retard pendant des heures réelles. L’écart maximal de force de vent passe de **.1703 à 0**. Les objets météo restent identiques par référence après C. Les décisions de mix gardent leur cadence et leurs fondus.

La capture continue dure **234.3 s**, avec **513 observations**, **1 178 rendus pendant la séquence**, un pic de **cinq voix** et **24 937 820 octets** décodés (sous 24 MiB). Deux chants sont admis naturellement, aucun chant diurne ne reste actif dans les nuits stabilisées. Le retour à l’heure courante présente au plus **189 ms** d’écart à l’horloge lors des observations stabilisées. La pluie ordinaire devient visible et sa voix joue au premier relevé à **.551 s** ; après le retour au sec, ses voix sont absentes au relevé à **2.754 s**. Ces délais sont bornés par l’échantillonnage, sans prétendre à une mesure audio au sample près. Les [niveaux décodés](mission-11-evidence/coherence/levels.json) ne montrent aucun écrêtage (pic .0492), sans normalisation.

Les tests techniques séparés constatent :

- Position des gouttes inchangée quand la vitesse change au même instant ; pas de saut proportionnel à 10 000 s de temps passé. Après .1 s, déplacement attendu de `.27, −2.5, −.12` dans le cas de contrôle.
- Une voix d’oiseau explicitement injectée pour tester le retrait est absente après .6 s de nuit. Ce test n’est pas présenté comme un événement naturel.
- Sur trois caches de rendu audio neufs, première voix de pluie après **.096 à .128 s**, et gain du bus supérieur à .20 après **.608 s**. Ce délai mesure l’admission d’une condition déjà fournie au renderer, sans coût du sélecteur ni de la transition météo.
- Retrait des voix de pluie vérifié après .85 s, et retrait d’une captation de tonnerre même lorsque le lit de pluie ordinaire reste actif et que son fichier est encore froid.
- Budgets de voix/HRTF et cache de 24 MiB conservés ; destruction des renderers de contrôle sans nœud ou cache restant.

[Contrôles techniques](mission-11-evidence/coherence/runtime.json) · [Caméras en mouvement](mission-11-evidence/coherence/camera.json) · [Trace avant](mission-11-evidence/coherence/before.json) · [Trace après](mission-11-evidence/coherence/after.json) · [Capture simultanée et trace](mission-11-evidence/coherence/realtime.json) · [Rafale et réponse sonore](mission-11-evidence/coherence/gust-coherence.svg).

## C — Reproductibilité, préservation et limites

**Validation exécutée :** compilation de production et **161 tests Node réussis** ; comparaisons avant/après, capture simultanée, contrôles des trois profils audio et caméras en mouvement ; smoke 3D (chargement, cycle des vues, déplacement, hauteur d’œil, arrêt sans dérive, audio, profil et viewport mobile) réussi. Les résultats de vérification figurent dans [validation.json](mission-11-evidence/coherence/validation.json).

Les scripts `browser-coherence.mjs before|after|record`, `browser-coherence-runtime.mjs`, `browser-coherence-camera.mjs`, `browser-coherence-gallery.mjs` et `report-coherence.py` produisent les pièces de revue. Le « before » utilise le worktree détaché du commit B `a990a12` sur le port 5178 ; le résultat courant utilise le port 5173. Les images de revue affichent honnêtement le badge de base B avec modifications locales. Les empreintes des sources capturées figurent dans [source.json](mission-11-evidence/coherence/source.json) et correspondent aux fichiers du troisième commit C.

Les 93 ressources audio / 40 sources et leurs crédits, les données géographiques, navigation, collisions, profils de budget et galeries A/B restent conservés. Aucun changement Living Paintings / LP-01 ou workflow de production. La réorganisation de la boucle principale intervient après le calcul de caméra, sans modifier les règles de déplacement.

La capture audiovisuelle copie le canevas **après chaque vrai rendu** et le flux **du véritable AudioContext après limiteur** vers le même MediaRecorder. Elle garde le rendu et la logique actifs, sans événement forcé, horloge d’animation remplacée ou normalisation sonore. Le titre incrusté indique le chapitre et l’heure. Le conteneur WebM est remultiplexé sans réencodage pour permettre la navigation par chapitres. Le protocole est distinct des relectures OfflineAudioContext et de la capture B qui suspendait la soumission WebGL. Les courtes comparaisons et la vidéo n’utilisent pas une même graine acoustique : les oiseaux restent occasionnels et non déterminés pour la démonstration.

Les égalités de temps et vent concernent l’état partagé observé, les délais sont échantillonnés à environ .45–.8 s plus le coût des commandes. L’audio garde un lissage volontaire. L’impression d’ensemble demande votre écoute et votre appréciation visuelle ; les assertions ne valent pas validation artistique. Le ciel reste une interprétation 2.5D, sans lune ni éclairage architectural inventé. Le tonnerre éventuel vient d’un fichier enregistré, sans garantie d’événement dans cet extrait et sans éclair synchronisé. Aucune nouvelle faune nocturne n’est inventée.

Le rendu SwiftShader est logiciel et la cadence de capture réduite ne valide pas Android ou un GPU physique. Le surcoût A de 19.5–34.5 % reste une limite documentée. Le travail d’optimisation, les campagnes prolongées et la robustesse élargie appartiennent au **Jalon D après votre validation de C**.

## Archive — état à la soumission du Jalon B

Le Jalon B est implémenté sur la même branche `mission/11-monde-vivant-immersif`, à la suite de votre « Continue ». Ce message autorise cette étape ; aucune appréciation artistique humaine détaillée n’est inventée. **À cette soumission, arrêt au Jalon B : le Jalon C n’avait pas commencé.** Aucune fusion ou mise en production, aucun changement Living Paintings / LP-01 ou workflow de production.

Le commit A `dbafd13` est conservé. Les données IGN/OSM, le relief, les bâtiments, distances, collisions, déplacements, profils et animations restent conservés. L’évolution de `src/living/geography.ts` construit des vues acoustiques supplémentaires depuis le GeoJSON déjà chargé ; elle ne modifie pas les données ou chemins de navigation.

Ouvrir la **[galerie d’écoute](mission-11-evidence/audio/index.html)** sur le serveur de développement : trois extraits courts pour commencer, une capture temps réel de trois minutes et quatorze comparaisons avant/après. Les gains sont conservés, sans normalisation des fichiers de revue. Le jugement de présence et de timbre appartient au propriétaire.

## B — Ce qui causait le manque de présence

- Les deux captations d’eau 10.1 décrivent explicitement un petit burn et un petit stream. Leur usage principal pour l’Anglin contribuait au caractère de ruisseau. Elles restent disponibles pour un cours d’eau de type stream, sans être les lits principaux du polygone de l’Anglin.
- Le modèle ignorait les deux polygones de rivière OSM et traitait également les lignes de seuil comme une proximité de rivière. Au poste de comparaison, environ 39.2 m de distance à la ligne centrale masquaient une berge située à environ 7.0 m horizontalement.
- Le feuillage exigeait une force de vent déjà élevée, puis passait par plusieurs gains faibles. Aucun lit de vent aérien n’existait ; augmenter le volume général aurait aussi augmenté les pas et la pluie.
- Les oiseaux cumulaient activité saisonnière, horaires, faible probabilité, perchoirs clairsemés et forte atténuation avec une distance de référence de 3–4 m. Le préchargement pouvait choisir deux perchoirs de la même espèce en laissant les autres ressources froides.
- `paths`, prévu pour la marche, exclut les routes secondaires/tertiaires et les ponts. Il ne pouvait pas devenir directement un modèle de circulation automobile. Les événements routiers étaient absents.

## B — L’Anglin : contours, relief et textures

`src/audio/geography.mjs` construit un index de berges depuis les **deux polygones OSM `water=river`**, et un index séparé des **deux seuils OSM `waterway=weir`**. Ces contours portent notamment une source cadastrale datée de 2010 : ils sont documentés comme contours cartographiques, pas comme un relevé actuel de berge. Aucun débit, largeur mesurée, profondeur ou obstacle nouveau n’est inventé.

La proximité sonore utilise la distance au polygone, puis la différence verticale entre l’oreille et une approximation issue du MNT lorsqu’elle est disponible. Le niveau d’eau n’est pas mesuré : la provenance le précise. Une position dans un trou de polygone reste une terre émergée. Sans polygone, le calcul conserve une distance à la ligne centrale et signale une largeur de berge inconnue ; sans donnée d’eau, aucune rivière n’est ajoutée.

Les trois nouveaux extraits de rivière modérée sont issus de deux fichiers sources : River Flow 1 de deadrobotmusic et Soft flowing water very close to the river de Mixigodo. Une autre source de Mixigodo fournit une texture plus turbulente, uniquement près d’un seuil cartographié. La largeur et le débit des lieux de captation ne sont pas mesurés ; une impression de rivière plus ample est à juger à l’écoute, pas à déduire du titre. Aucune captation de mer ou cascade torrentielle n’est utilisée. Les deux découpes du même fichier ne comptent pas comme deux sources indépendantes.

La loi de gain cible du lit de rivière est :

`0.56 / (1 + (d / 18)^1.5) × (1 − smoothstep(95,150,d))`

`d` est la proximité physique estimée en mètres, pas la distance à une ligne centrale assimilée arbitrairement à une berge. La courbe décroît sans socle lointain et s’annule à 150 m. Le filtre sous .001 ne retire que des niveaux numériques très faibles. La texture de seuil a une enveloppe locale séparée, limitée à 38 m du seuil et réduite avec la distance à l’eau. La météo ne change pas le débit.

Une panoramisation stéréo légère place l’eau du côté de sa géométrie. Elle ne consomme pas de voix HRTF supplémentaires. Le filtre des nouvelles captations d’eau conserve davantage de corps (coupe-bas 90 Hz, au lieu des 170 Hz des anciens petits écoulements), sans créer un grondement permanent ailleurs dans le village.

[Courbe du gain et promenade](mission-11-evidence/audio/river-gain-and-walk.svg) · [valeurs CSV](mission-11-evidence/audio/river-gain.csv).

## B — Vent et feuilles, selon leur contexte

Le vent utilise deux véritables captations de terrain ouvert (Globofonia et wrinex). Le feuillage conserve les prises 10.1 et ajoute celle de teadrinker. L’enveloppe dépend du vent et des rafales déjà partagés avec EarthLife ; aucune nouvelle horloge météo n’est créée, ni aucun balancement de tronc ajouté.

L’exposition est conditionnée par l’habitat cartographié : champ, prairie, eau ou roche plus exposés, sous-bois abrité, village partiellement abrité, broussailles et jardins intermédiaires. L’absence d’exposition pour les broussailles, repérée dans le premier essai, a été corrigée. Une place sans végétation proche ne reçoit pas un lit de feuilles. Le calme ne reçoit pas un bruit d’air pour remplir le silence.

Le feuillage devient audible plus tôt dans une brise, puis se renforce avec le vent et ses rafales. Les petites variations internes des captations restent celles du lieu d’enregistrement : la modulation suit le vent du jeu, pas une mesure locale ni une correspondance parfaite de chaque froissement. Cette dernière cohérence perceptive complète reste à examiner au Jalon C après votre approbation.

Le volume maître, les gains de pas, le limiteur et le niveau de pluie sont conservés. Les familles eau, feuilles, vent et oiseaux sont calibrées séparément.

## B — Oiseaux occasionnels, toujours fixés au lieu

Les perchoirs WGS84 de 10.1 sont conservés et testés à travers déplacement et changement de repère. Les quatre espèces restent des interprétations européennes plausibles, **pas des observations confirmées à Angles**.

Les probabilités, facteurs saisonniers et atténuations sont recalibrés par famille : distances de référence de 8–12 m et gains distincts, avec cooldowns de 55–65 s par perchoir et au moins 20 s entre appels programmés. Le chargement privilégie deux espèces distinctes proches, avec deux décodages simultanés maximum. La phrase suivante évite de reprendre le même fichier source lorsqu’une alternative existe. Aucun changement de hauteur de son ne fabrique une fausse diversité de captations.

Les scènes réelles de contexte couvrent matin de printemps, après-midi d’été, soir d’automne, jour d’hiver et nuit. Leurs nombres de voix démarrées dans la visite déterministe sont respectivement **3 en 3 min, 1 en 2 min, 2 en 2 min, 1 en 2 min, 0 en 2 min**. Ce ne sont pas des taux garantis pour chaque promenade. Les silences restent présents. La capture temps réel distincte comporte quatre voix démarrées en trois minutes, sans forcer leur présence.

Les compteurs `heardBirds` indiquent les voix acceptées par le moteur, pas une certification qu’un humain les a entendues. Les pistes isolées et leurs niveaux permettent de juger la différence.

## B — Une voiture parfois, avec un garde-fou visuel

Une seule nouvelle source de passage automobile (Anya_Media) contient une approche, un passage et un éloignement réels. L’ancrage est choisi sur la géométrie OSM des routes carrossables du GeoJSON complet, incluant les routes absentes du graphe piéton. Les sentiers, chemins, escaliers, voies piétonnes, accès privés/interdits/conditionnels et accès de service inadaptés sont écartés.

La source est initialement à **65–170 m**, derrière l’écouteur, avec une différence d’altitude limitée. Le passage enregistré porte déjà son évolution acoustique ; aucun véhicule proche invisible ne traverse la scène. L’ancrage reste fixe sur le segment cartographié durant cet enregistrement, sans prétendre simuler la trajectoire exacte de cette voiture. Si le joueur tourne vers la source, s’en approche à moins de 45 m ou la cohérence n’est plus réunie, la voix se retire progressivement.

Un délai d’installation de 45 s, un cooldown global de 150 s, une faible probabilité et une fréquence nocturne beaucoup plus faible préservent les longues absences. Dans la visite déterministe de onze minutes, les deux passages surviennent à **6 min 22.5 s et 10 min 08 s** ; la galerie propose un extrait court du premier pour éviter une longue attente. Ce n’est ni un comptage du trafic réel, ni un événement forcé pour la preuve.

Aucune foule, voix humaine, cloche, marché ou activité rurale permanente n’est ajoutée. Les autres micro-événements restent différés faute d’un besoin et de ressources vérifiées suffisants.

## B — Preuves sonores et méthode

- **[Galerie d’écoute](mission-11-evidence/audio/index.html)** : extraits courts, comparaisons avant/après et pistes isolées eau, vent, feuillage, oiseaux, voiture.
- **[Capture temps réel de trois minutes](mission-11-evidence/audio/realtime-forest.webm)** : sortie post-limiteur du véritable AudioContext, enregistrée par MediaRecorder. Le rendu WebGL est suspendu dans ce harnais logiciel pour éviter le coût SwiftShader ; la boucle réelle du jeu, les timers audio, le contexte géographique et le vent continuent. Le conteneur est réindexé sans réencoder l’audio. [Chronologie et diagnostics](mission-11-evidence/audio/realtime.json).
- **[Quatorze scénarios comparés](mission-11-evidence/audio/levels.json)** : mêmes positions, dates, météos, volume maître et graines de programmation, contexte issu du jeu chargé, sortie du même AcousticRenderer/SoundDirector dans OfflineAudioContext. Les fichiers de revue Opus ne sont pas normalisés. Les WAV intermédiaires restent dans `work/`.
- **Promenade continue de 6 min 26** : approche depuis environ 90 m de la berge, arrêt 30 s à environ 4 m, puis éloignement. Le tracé utilise AutoWalk sur le graphe OSM, complété par 25.8 m de déplacement libre vérifié avec le relief et les collisions du moteur. Il n’est pas présenté comme un chemin public réel ou une vidéo de marche en temps réel. [Tracé et protocole](mission-11-evidence/audio/walk-route.json).
- [Courbe et niveaux de la promenade](mission-11-evidence/audio/river-gain-and-walk.svg), [extraits et points de coupe](mission-11-evidence/audio/excerpts.json), [niveaux CSV](mission-11-evidence/audio/levels.csv).

Aucune image ou piste générée par IA ne remplace une preuve du moteur. Aucun niveau numérique n’est présenté comme un dB acoustique calibré au casque. Une hausse du RMS ne certifie ni le timbre de rivière, ni le plaisir de promenade.

### B — Niveaux comparatifs, à volume maître identique

| Scène | RMS avant (dBFS) | RMS après (dBFS) | Voix d’oiseaux après | Passages routiers après |
| --- | ---: | ---: | ---: | ---: |
| village | silence | -77.0 | 1 | 0 |
| forest-spring-morning | -83.7 | -61.3 | 3 | 0 |
| forest-summer-afternoon | silence | -63.2 | 1 | 0 |
| forest-autumn-evening | silence | -63.1 | 2 | 0 |
| forest-winter-day | silence | -63.2 | 1 | 0 |
| forest-night | silence | -63.2 | 0 | 0 |
| river-bank | -69.7 | -40.5 | 1 | 0 |
| river-weir | -59.6 | -37.8 | 2 | 0 |
| river-walk | -73.6 | -46.7 | 5 | 1 |
| wind-open | silence | -52.8 | 0 | 0 |
| foliage | -65.8 | -51.1 | 0 | 0 |
| river-isolated | -69.7 | -40.5 | 0 | 0 |
| birds-isolated | -83.7 | -65.6 | 3 | 0 |
| village-traffic | silence | -74.6 | 0 | 2 |

La moyenne inclut les silences de chaque scénario. Près de la berge, le changement d’environ **+29 dB RMS** résulte du contour de berge reconnu, de la captation et du gain de cette famille. Il ne provient pas d’une augmentation du volume global. Le village conserve une moyenne très basse et des événements ponctuels. Les sorties mesurées ne contiennent aucun échantillon écrêté ; le plus haut pic de cette série reste inférieur à .087 en amplitude numérique.

## B — Ressources, licences et préservation

Budget **0 €**. Sept nouveaux fichiers sources CC0, préparés en onze extraits, portent la bibliothèque à **40 sources et 93 ressources**. Les découpes ne comptent pas comme de nouvelles captations. L’indépendance des sessions de prise de son d’un même auteur n’est pas certifiée ; les fichiers, hashes et transformations sont distincts et documentés.

Les **82 ressources et 33 sources de 10.1 conservent exactement leur contenu audio et leurs métadonnées**, vérifiés contre le commit A. [Preuve de préservation](mission-11-evidence/audio/preservation.json). Les manifestes globaux et les crédits sont étendus ; les empreintes de manifestes de l’archive A ci-dessous décrivent donc cet état historique, pas les manifestes actuels.

Pour chaque ajout, `public/audio/sources.json` conserve auteur, URL de page et média, CC0 exact, fragment et empreinte de page vérifiés, empreinte source et format. `manifest.json` conserve début/durée de coupe, filtres, gain linéaire borné, fondus, codec, canaux et empreinte du fichier final. Les aperçus HQ MP3 fournis par Freesound ne sont pas présentés comme les WAV originaux. La sortie FLAC ne rajoute pas une compression perceptuelle ; la revue utilise Opus pour limiter le poids.

- [River Flow 1 — deadrobotmusic](https://freesound.org/people/deadrobotmusic/sounds/591733/).
- [Soft flowing water — Mixigodo](https://freesound.org/people/Mixigodo/sounds/553606/) et [Flowing water — Mixigodo](https://freesound.org/people/Mixigodo/sounds/553607/).
- [wind open field — Globofonia](https://freesound.org/people/Globofonia/sounds/553733/) et [wind MS — wrinex](https://freesound.org/people/wrinex/sounds/72563/).
- [wind_forest_08 — teadrinker](https://freesound.org/people/teadrinker/sounds/403051/).
- [Quiet rural road car pass — Anya_Media](https://freesound.org/people/Anya_Media/sounds/873189/).

Ces prises viennent d’autres lieux et leurs timbres doivent être jugés comme interprétations. Aucun relevé local de largeur, débit, espèce ou trafic n’est revendiqué. Les crédits CC BY 4.0 existants restent visibles, ainsi que les crédits IGN/ASP/OSM.

Reproduction de la préparation : `python scripts/prepare-audio-immersive.py --download`, avec Python/numpy et FFmpeg. Ce script reconstruit les ajouts et conserve les ressources 10.1 ; le préparateur historique reste disponible séparément.

## B — Budgets, tests et limites

**157 tests Node et compilation réussis**, dont les six tests nouveaux sur berges/polygones/îlots, seuils, données réelles de l’Anglin, routes et visibilité, rareté/cooldowns et cinq cas saisonniers. Les tests de perchoirs fixes, matériaux prudents, données inconnues, collisions et navigation restent actifs.

Les tests navigateur vérifient chargement audio seulement après geste utilisateur, proximité réelle de berge et panoramisation, vent exposé, trois profils, arrêt/reprise/volume, visibilité d’onglet, douze destructions/réinitialisations, saturation des voix, rotation HRTF et atténuation. Une ressource de rivière volontairement indisponible est signalée et remplacée par une autre captation admissible, sans plantage. Le smoke test 3D existant passe : chargement IGN/OSM, marche, vues, hauteur des yeux, arrêt de caméra, son et mobile, sans erreur JavaScript.

Les budgets 10.1 restent inchangés : Éco **8 voix / 1 HRTF / 2 lits**, Équilibré **12 / 2 / 3**, Qualité **12 / 3 / 3**, cache décodé **24 MiB**, au plus deux chargements/décodages simultanés. L’eau utilise une panoramisation légère. Les trois lits prioritaires, ou deux en Éco, varient selon les gains contextuels ; les captations de feuillage contiennent déjà le vent dans les feuilles. Des sorties de lits précédents peuvent finir leur fondu dans les mêmes budgets de voix. Aucun bruit d’air permanent n’est créé pour remplir les emplacements libres.

Dans les quatorze rendus de revue : **six voix simultanées maximum**, pic de cache **24 981 100 octets**, inférieur à 24 MiB. Le test temps réel de trois minutes reste à trois voix actives au maximum. La mémoire du cache augmente à l’intérieur de sa limite existante ; elle n’est pas présentée comme inchangée en consommation.

La [matrice CPU avant/après](mission-11-evidence/audio/performance.json) couvre trois profils et trois postes, son coupé/activé. Soixante mises à jour acoustiques forcées par condition donnent une borne de coût de contexte : médianes B de **.1 à .3 ms**, P95 de **.3 à 1.0 ms**, pic **2.5 ms**. Ce n’est pas un coût par image constant : les contextes réels tournent à 2 ou 4 Hz. Le test ne mesure pas le coût GPU physique ou tout le thread audio natif. Le surcoût graphique A sous SwiftShader et l’absence de validation Android/GPU physique restent des limites ; ce jalon ne les prétend pas résolus.

Les sons restent progressifs à l’arrêt/reprise et à l’éloignement. Les sources et panoramiseurs ajoutés sont déconnectés à la destruction ; les douze cycles ferment leurs AudioContexts et reviennent à zéro nœud/cache. Les diagnostics `?perf=1` exposent le type de proximité de l’eau, les distances berge/centre/verticale quand connues, les gains, panoramisation, voix, ressources, erreurs, compteurs d’oiseaux et passages effectivement démarrés.

### B — Ce qui reste à juger ou à faire après approbation

L’ampleur et le timbre de l’Anglin, le niveau du vent, la douceur des feuilles et la distance perçue des oiseaux exigent votre écoute. Il n’y a pas eu d’écoute humaine revendiquée par Codex. La capture de rivière n’est pas prise à Angles ; les bruits internes des captations ne sont pas une mesure du vent local. La topographie intervient par distance verticale approximative, sans occlusion détaillée des bâtiments/reliefs ni niveau d’eau mesuré. La source automobile est l’ancrage lointain d’un passage enregistré, sans véhicule rendu ou trajectoire détaillée. Les autres sons humains et insectes nouveaux ne sont pas ajoutés.

La cohérence perceptive complète des météos visibles/audibles et l’optimisation générale restent les Jalons C et D. **Ne pas les commencer sans votre approbation acoustique du Jalon B.**

## Prévisualiser le Jalon B sans modifier la production

La branche de travail et la PR restent en brouillon. Sur un checkout séparé :

```sh
git fetch origin mission/11-monde-vivant-immersif
git switch mission/11-monde-vivant-immersif
npm ci
npm run dev -- --port 5173
```

Galerie audio : `http://localhost:5173/endless-earth/docs/mission-11-evidence/audio/index.html`. Elle fonctionne sans WebGL et propose les comparaisons en un écran. Promenade : `http://localhost:5173/endless-earth/?moment=morning&weather=clear`, activer le son puis rejoindre la rivière ou la forêt. Le Chrome partagé du bureau conserve son blocage WebGL ; le moteur a été vérifié dans Chromium distinct et la galerie audio ne requiert pas de WebGL.

Reproduction des preuves : worktree du commit A `dbafd13` sur le port 5177, puis `node scripts/browser-audio-immersive.mjs plan`, `npm run audio:evidence`, `node scripts/browser-audio-immersive-live.mjs` et `python scripts/report-audio-immersive.py`. Tests : `npm test`, `npm run build`, `npm run test:audio:browser`, `npm run bench:audio`, `npm run test:browser`.

---

## Archive du Jalon A — commit `dbafd13`

Ce texte décrit l’étape A au moment de sa livraison, avant votre « Continue ». Les mentions « B non commencé » et les empreintes des manifestes sont historiques. Les preuves visuelles et mesures de cette étape restent conservées.


### Résumé et arrêt au Jalon A

Le Jalon A apporte un ciel atmosphérique Three.js, des nuages à deux altitudes, une véritable nuit, les cinq moments demandés et les six météos simulées. Le soleil, la lumière, la brume, la pluie, le vent et l’état temporel transmis à la faune et au moteur sonore partagent la même situation effective. Les commandes restent mémorisées.

**Jalon A uniquement. Validation artistique du propriétaire attendue. Le Jalon B n’a pas commencé.** Les captations, niveaux, perchoirs, matériaux de pas et budgets audio de la Mission 10.1 sont conservés. Aucune nouvelle ressource audio, voiture ou événement humain n’est ajouté. Les extraits audio comparatifs, la courbe acoustique de rivière et les pistes isolées appartiennent au Jalon B et ne sont pas présentés comme livrés.

La différence est observable dans les captures du moteur et la vidéo. Les nuages restent une interprétation légère, avec des contours parfois encore doux ; leur qualité et la lisibilité de la nuit demandent votre jugement. Aucun succès de compilation n’est assimilé à une validation artistique.

### Isolation et provenance Git

Le checkout fourni était à la Mission 08.6 (`f11f165`). Avant toute modification de l’application, interrogation de GitHub, récupération du dernier `main`, inspection de son historique et création de `mission/11-monde-vivant-immersif` sur **`0f699fa50cb9d9b8158fc88776d27ec75594f575`**. Ce main fusionne la PR #18 / Mission 10.1, après les Missions 09 et 10. Aucun travail local préexistant n’était modifié.

Une worktree détachée de ce même commit sert exclusivement à la comparaison avant, sur le port 5176. La branche de mission utilise 5173. Living Paintings / LP-01, ses branches et ses fichiers n’ont pas été modifiés. Aucune modification de `.github/workflows/`, des données `public/data/` ou `public/tiles/`, des distances, du relief, des bâtiments, de la navigation ou des collisions. Aucun merge ou déploiement de production. Le workflow Pages existant ne se déclenche que sur main ; il n’a pas été modifié.

### Audit du code effectivement exécuté

| Système inspecté | Cause confirmée sur main | Intervention du Jalon A |
| --- | --- | --- |
| `src/nature/sky.ts` | Sphère avec simple mélange zénith/horizon ; horloge réelle ou démo ×72 ; quatre météos | Nouveau ciel, interface et état effectif partagés |
| `src/nature/climate.mjs` | Lissage unique de 45 s ; aucune notion de matin/soir solaire | Six régimes ; choix solaire selon lieu/date ; transition manuelle séparée |
| `src/earthlife/cloud-layer.ts` | Plan horizontal à 230 m, champ sinusoïdal interpolé par sommets, fondu radial | Deux couches projetées sur une enveloppe courbe, détail fragment et relief d’éclairage approximatif |
| `state.mjs`, `wind.mjs` | Vent partagé continu déjà présent ; dérive nuageuse à vitesse constante indépendante de la météo | Dérive intégrée selon le même vent moyen, sans téléportation lors des changements |
| `fauna-render.ts`, préférences et budgets | Faune déjà conditionnée par jour/pluie/vent/saison ; profils bornés et spécialisation des shaders | Conservation ; nouvelles conditions effectives transmises au point existant |
| `src/living/sound.ts` | Audio déjà alimenté par `acousticClimate`, proximité à une ligne centrale OSM, pas à une berge mesurée | Conservation ; même date, soleil et météo que le rendu |
| `src/audio/profiles.mjs` | Eau : gain `.22 × (1 − smooth(4,55,distance))` ; feuillage : végétation × `.16 × smooth(.30,.72,vent)` | Diagnostic confirmé, recalibrage différé au Jalon B |
| `director.mjs`, `renderer.ts` | Oiseaux : faible probabilité, cooldowns 55–70 s, horaires/saison/pluie ; 8 s d’installation ; absence d’air permanent et d’événements routiers | Aucun changement de gains, de probabilités ou de bibliothèque |
| Ressources et licences | 82 extraits issus de 33 captations, CC0 et CC BY 4.0, manifeste avec empreintes/transformations | Fichiers et crédits inchangés |
| Boucle et profils graphiques | `dt` de mouvement plafonné à .25 s ; ombres portées désactivées en mode tuiles ; ombres de nuages légères selon profil | Temps réel séparé pour les commandes ; conservation des décisions d’ombres et des budgets existants |

Le silence du vent est donc aussi un choix explicite de la bibliothèque 10.1, pas un simple problème de volume général. L’Anglin n’est pas arbitrairement amplifié dans cette étape.

### Ciel et éclairage

Réutilisation du **Sky / modèle analytique de Preetham livré dans Three.js 0.180.0**, sous MIT. Cette solution existante évite une nouvelle dépendance, des textures téléchargées, une API ou un ray marching volumétrique. Les alternatives considérées étaient le dégradé existant, la couche plane actuelle, une projection à plusieurs altitudes et le volumétrique. La projection à deux altitudes offre ici le compromis le plus léger ; aucun comparatif universel de bibliothèques n’est revendiqué.

Le modèle est adapté avec compression de la plage lumineuse, raccord de l’horizon au brouillard, mélange diffus sous couverture épaisse et traitement nocturne explicite. La direction solaire provient du calcul géographique existant, utilisé aussi pour la lumière directionnelle. L’ambiance hémisphérique, sa teinte au sol et le contraste baissent avec les nuages et la pluie. Les façades, la végétation et l’eau reçoivent ainsi la même transformation lumineuse sans changer leurs géométries ou couleurs de données.

La nuit utilise un ciel sombre, une ambiance réduite et de petites étoiles procédurales artistiques, non une carte astronomique. Elles disparaissent avec une couverture épaisse. Aucun éclairage public ou fenêtre lumineuse n’est inventé. Pas de lune : position et phase crédibles nécessiteraient une éphéméride supplémentaire. L’absence de lune est explicite, pas présentée comme une observation du lieu.

Les ombres portées restent désactivées dans le mode tuiles existant ; activer des shadow maps sur tout le village aurait changé brutalement le coût. Les profils Équilibré et Qualité conservent les ombres de nuages projetées aux sommets. Leur macro-couverture et leur dérive sont communes au ciel ; les petits détails des nouveaux nuages et leur altitude ne donnent pas des ombres exactes. C’est une approximation documentée.

### Nuages et vent

Une enveloppe courbe couvre toutes les directions sans bord de plan autour du joueur. Deux altitudes apparentes (environ 280 et 540 m dans le repère local), du bruit à plusieurs échelles, une déformation de domaine et des variations de densité donnent de la profondeur apparente, des bords éclairés et des bases plus sombres. La densité augmente avec la couverture et l’orage assombrit aussi les nuages.

La projection utilise des coordonnées du monde. La dérive est intégrée, dans la direction commune du vent, avec une vitesse dépendant de son intensité ; changer le vent ne repositionne pas instantanément les motifs. La couche haute dérive plus lentement. Ces vitesses et hauteurs sont artistiques, pas des mesures météo. Les ombres suivent le même déplacement intégré. Les feuilles et les surfaces d’eau reçoivent le vent existant, sans augmentation générale des amplitudes ni déformation ajoutée aux troncs.

Éco conserve le ciel et la couche basse, avec la couche haute omise explicitement pour réduire le calcul. Équilibré et Qualité affichent les deux couches. Une personnalisation qui désactive les nuages reste respectée.

### Heure et météo : commandes et contrat partagé

Le panneau **« Heure et météo »** propose exactement **Matin, Après-midi, Soir, Nuit, Temps réel**. La démo ×72 reste secondaire, sous `?perf=1` ou `?time=demo`.

Les instants sont calculés à la sélection, sur la date civile **du lieu** (`Europe/Paris` pour Angles), à partir de la latitude, longitude, position solaire, lever et coucher. Matin suit le lever, après-midi suit le midi solaire, soir précède le coucher et nuit se place dans l’intervalle nocturne. Les heures ne sont pas copiées d’Angles vers Venise ou l’équateur. Tests à Angles, Venise, Quito, Sydney et Longyearbyen, en été/hiver et de part et d’autre de la ligne de date.

Aux latitudes polaires sans lever/coucher, les noms désignent des phases de la trajectoire solaire : matin à midi solaire −6 h, après-midi au midi solaire, soir à +6 h, nuit à minuit solaire. L’interface signale « soleil de minuit » ou « nuit polaire ». Choisir Nuit sous le soleil de minuit ne crée pas artificiellement une nuit.

Les instants manuels sont fixes et sauvegardés par lieu, y compris à travers une recharge. Temps réel relit l’instant courant ; seule sa présentation civile utilise le fuseau du lieu. `?date=` est une référence fixe de diagnostic/capture et ne remplace pas le fonctionnement normal. Le mélange temporel dure 2.4 s, de manière progressive ; toute la simulation consomme l’instant effectif pendant ce mélange.

| Régime simulé | Couverture | Vent moyen normalisé | Pluie | Brume |
| --- | ---: | ---: | ---: | ---: |
| Ensoleillé | .16 | .24 | 0 | 0 |
| Nuageux | .49 | .43 | 0 | .06 |
| Couvert | .90 | .52 | 0 | .22 |
| Brumeux | .65 | .12 | 0 | 1 |
| Pluvieux | .96 | .64 | .60 | .44 |
| Orageux | 1 | .95 | 1 | .56 |

Ces nombres sont des paramètres artistiques normalisés, **pas des prévisions, mètres/seconde ou quantités d’eau mesurées**. Le brouillard s’étend progressivement d’environ 320–1450 m par temps clair à 30–330 m en brume, dans le repère métrique existant.

Une commande météo utilise une constante de temps de .65 s, soit 98 % de la transition à 2.55 s. L’évolution naturelle conserve sa constante historique de 45 s. Le temps des commandes utilise le temps réel entre images, séparé du `dt` plafonné destiné aux collisions ; une machine lente n’allonge donc pas systématiquement la transition à cause du déplacement.

La pluie est rendue par un seul appel de lignes, autour de la caméra et incliné selon le vent : **260 gouttes Éco, 520 Équilibré, 900 Qualité**, sans allocation par image. Le budget des particules naturelles existant est conservé séparément. Une borne au niveau du sol réduit les traits sous le terrain local. Pas de collisions de pluie avec chaque toit, pas de flaques ou de surfaces mouillées nouvelles. L’eau ne change pas de débit quand la pluie est sélectionnée.

`scene.userData.acousticClimate` reçoit la date effective, le soleil et la même météo mutable à chaque image. La faune, les animations, la brume, la pluie et les sons existants utilisent donc ces conditions. La pluie sonore de la bibliothèque 10.1 est sollicitée par cette valeur ; son niveau et sa qualité n’ont pas été recalibrés. Pas d’horloge parallèle ajoutée au son.

Sous `?perf=1`, `window.endlessDiagnostics.climate` expose le moment, la date effective, heure/fuseau, régime cible, météo effective, constante de transition, soleil, vent/rafale et nombre de gouttes. `earthLife` conserve les coûts CPU, budgets et ressources. `audio` conserve les couches, gains réels/cibles, distances à la ligne d’eau, voix et ressources décodées. Cette complexité reste hors du panneau du joueur ordinaire.

Les sélecteurs natifs restent utilisables au clavier. Les flèches dans un champ de réglage ne font plus marcher le personnage. Les choix restent stables lors des changements de vue, d’onglet, d’arrêt/reprise du son et de la recharge. Les nouveaux objets graphiques et écouteurs du ciel sont libérés lors du remplacement HMR ou de la fermeture définitive de page ; le retour du cache de navigation conserve sa scène.

### Preuves à regarder

Ouvrir la [galerie comparative](mission-11-evidence/index.html) avec le serveur de développement. Elle propose les cinq moments, toutes les conditions météo, la vue aérienne, une vue du ciel et le soir vers l’ouest. Les images s’ouvrent aussi individuellement dans ce dossier GitHub.

- [Matin avant](mission-11-evidence/before-morning.jpg) / [après](mission-11-evidence/after-morning.jpg).
- [Après-midi avant](mission-11-evidence/before-afternoon.jpg) / [après](mission-11-evidence/after-afternoon.jpg).
- [Soir avant](mission-11-evidence/before-evening.jpg) / [après](mission-11-evidence/after-evening.jpg).
- [Nuit avant](mission-11-evidence/before-night.jpg) / [après](mission-11-evidence/after-night.jpg).
- [Pluie avant](mission-11-evidence/before-rain.jpg) / [après](mission-11-evidence/after-rain.jpg).
- [Nuages en hauteur](mission-11-evidence/after-sky-cloudy.jpg), [vue aérienne](mission-11-evidence/after-aerial-cloudy.jpg), [orage](mission-11-evidence/after-storm.jpg), [brume](mission-11-evidence/after-mist.jpg).
- [Vidéo de transition réelle](mission-11-evidence/atmosphere-transition.mp4) et [chronologie des images/commandes](mission-11-evidence/motion.json).
- [Panneau mobile portrait](mission-11-evidence/mobile-controls.jpg) / [paysage](mission-11-evidence/mobile-landscape.jpg).

Protocole : Chromium, 960 × 640, même caméra sur la berge (`x=-150, z=245`, lacet −1.1, tangage −.15), même profil Équilibré, référence du 21 juin 2026. Les instants UTC des préréglages sont identiques avant/après. La simulation est tenue pour les captures fixes ; les deux versions attendent 240 s simulées par cas pour une météo stabilisée. Le main ne possédait pas Nuageux ou Orageux : comparaisons explicitement avec Couvert ou Pluie, sans prétendre à une équivalence de ces modes.

La vidéo utilise la boucle de rendu réelle avec sélection des commandes dans l’interface. Les images sont horodatées, encodées avec leurs durées réelles, sans accélération. Faible fréquence de capture sous SwiftShader ; elle ne prouve pas la fluidité d’un GPU physique. Aucune illustration générée par IA, piste sonore ou écoute humaine n’est utilisée comme preuve.

Les badges des captures indiquent honnêtement le commit de base et les modifications locales : les captures précèdent le commit de livraison. Le titre de mission est passé à 11 avec le rapport déclaré dans `package.json`.

### Ressources, droits et coût

Budget de nouvelles ressources : **0 €**. Aucune API payante, dépendance nouvelle, texture externe ou fichier sonore nouveau.

- Three.js / Sky : [code officiel r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/Sky.js), auteurs/contributeurs Three.js ; MIT. [Licence conservée](mission-11-evidence/THREE-LICENSE.txt). Adaptations applicatives dans `src/nature/atmosphere.ts` : composition nocturne et météo ; l’original dans la dépendance reste intact.
- Empreinte SHA-256 du Sky installé : `a19982b69e496e52d4cd7072029f0a8e5277203cbebf2277a23267e90b705640`.
- Nuages, pluie et étoiles : code procédural du projet, sans image tiers.
- Audio : `public/audio/sources.json`, `manifest.json` et `credits.html` conservés intégralement, avec auteurs, URLs, licences, transformations et empreintes existantes. SHA-256 manifeste : `59e9e25fe398ae0dc391364e39bc45693bd841d0bcefbaddc233a444ca8cbc00` ; sources : `51c5b976a9066a3ecaa23f14a5b5c8ab8506aef61503e26ca2a50785822d1696`.
- Données IGN/ASP sous Licence Ouverte 2.0 et OSM sous ODbL : crédits visibles et données inchangés.

### Tests et limites de validation

`npm run build` et **151 tests Node réussis**, dont cinq nouveaux tests sur les moments géographiques/saisonniers, le fuseau à travers la ligne de date, les cas polaires, la transition rapide/inversée et la dérive continue selon le vent. Les tests existants de navigation, collisions, relief inconnu, audio, budgets et spécialisations restent actifs.

Le [test des commandes](mission-11-evidence/controls.json) exécute le véritable `main.ts`, sans interception de sa boucle : cinq choix exacts, six météos, transitions dans les deux sens, nuit effective, stabilité temporelle, flèches dans les sélecteurs, trois vues, onglet aller/retour, activation/désactivation du son, recharge, promenade automatique, trois profils, panneaux 390 × 844 et 844 × 390. Ce test n’est pas un essai sur Android physique ou une preuve d’inactivité système prolongée.

Les mesures de rendu et cycles de ressources sont ci-dessous. Les longs parcours de 450 m, les écoutes de plusieurs minutes et l’optimisation complète du Jalon D ne sont pas revendiqués à cette étape.

Le Chrome du bureau partagé a été effectivement essayé : `chrome://gpu` y indique **WebGL désactivé**, et le moteur ne s’y initialise pas. Sa galerie HTML et la vidéo s’affichent ; elles sont ouvertes dans Desktop. Le moteur a bien été exécuté et testé dans un Chromium distinct avec les options SwiftShader explicites des scripts. Ce blocage du Chrome partagé n’est pas masqué par une fausse démonstration navigable.

### Premières mesures de performance

[Mesures brutes avant](mission-11-evidence/before.json), [après](mission-11-evidence/after.json), [synthèse](mission-11-evidence/metrics-summary.json). Huit échantillons après chauffe par profil et météo, son coupé, même caméra et viewport. Chaque durée inclut soumission, gl.finish et lecture RGBA ; c’est une mesure intrusive sur **SwiftShader logiciel**, pas un temps GPU physique ou une promesse de FPS. Les captures principales couvrent aussi le jour, la nuit et le vent renforcé de l’orage.

| Profil | Météo | Rendu + lecture avant / après (ms, médiane) | Écart logiciel | CPU atmosphère avant / après (ms) | Appels avant / après |
| --- | --- | ---: | ---: | ---: | ---: |
| eco | clear | 129.5 / 173.8 | +34.2 % | 0.10 / 0.20 | 170 / 170 |
| eco | overcast | 130.9 / 167.5 | +27.9 % | 0.10 / 0.20 | 170 / 170 |
| eco | rain | 133.2 / 173.0 | +29.9 % | 0.05 / 0.15 | 170 / 171 |
| balanced | clear | 142.7 / 181.1 | +26.9 % | 0.10 / 0.20 | 170 / 170 |
| balanced | overcast | 132.3 / 178.0 | +34.5 % | 0.10 / 0.15 | 170 / 170 |
| balanced | rain | 135.6 / 169.1 | +24.7 % | 0.10 / 0.15 | 170 / 171 |
| quality | clear | 153.1 / 183.0 | +19.5 % | 0.10 / 0.20 | 170 / 170 |
| quality | overcast | 134.9 / 173.0 | +28.3 % | 0.10 / 0.20 | 170 / 170 |
| quality | rain | 144.4 / 187.2 | +29.6 % | 0.05 / 0.15 | 170 / 171 |

Le surcoût logiciel observé reste matériel : **19.5 à 34.5 %** dans cette série. Il est signalé comme limite du Jalon A, sans déclarer la fluidité matérielle validée. Le ciel est rendu après la profondeur opaque pour éviter de calculer la diffusion derrière le terrain ; le bruit nuageux utilise un hash arithmétique, et Éco réduit aussi les octaves et l’éclairage de détail. Aucun effet météo demandé n’est silencieusement retiré. Une mesure GPU physique reste nécessaire, ainsi que le travail d’optimisation du Jalon D après approbations.

Le test de 36 cycles garde **307 géométries, 19 programmes et 7 textures**. Après destruction du ciel, nuages, pluie, faune et événements : 304 géométries et aucun panneau météo. Aucun ajout de texture pour cette mission ; la pluie ajoute un appel de rendu seulement lorsqu’elle est active. Cette stabilité des ressources renderer n’est pas une preuve exhaustive d’absence de fuite du tas JavaScript.

Le smoke test navigateur existant passe : chargement IGN/OSM, cycle des vues, marche réelle, hauteur des yeux, caméra stable après relâchement, activation sonore et viewport mobile, sans erreur JavaScript. L’activation et l’arrêt du son sont vérifiés ; **le benchmark complet son coupé/activé et les mesures de voix/décodages comparatifs n’ont pas été refaits au Jalon A**, l’audio étant conservé.

### Prévisualisation indépendante

Depuis le dépôt, sans toucher à main ni à Pages :

```sh
git fetch origin mission/11-monde-vivant-immersif
git switch mission/11-monde-vivant-immersif
npm ci
npm run dev -- --port 5173
```

Ouvrir `http://localhost:5173/endless-earth/?moment=morning&weather=clear` dans un navigateur avec WebGL. Ouvrir « Heure et météo » et essayer les cinq moments et six régimes ; le son reste activable séparément. La référence `?date=` des captures n’est pas nécessaire à cette promenade.

Galerie : `http://localhost:5173/endless-earth/docs/mission-11-evidence/index.html`.

Reproduction des preuves : lancer une worktree du commit main de référence sur le port 5176, puis `node scripts/browser-atmosphere.mjs before`, `node scripts/browser-atmosphere.mjs after`, `npm run test:atmosphere:browser` et `node scripts/browser-atmosphere-motion.mjs`. Les scripts utilisent `/usr/bin/chromium` ; la vidéo utilise `ffmpeg`.

### Points à valider par le propriétaire

Juger la douceur du matin, l’après-midi ordinaire, le soir et la lisibilité de la nuit ; observer les nouveaux nuages dans les deux vues ; essayer soleil → couvert → pluie → soleil et jour → nuit → jour ; vérifier la présence perceptible de pluie et la brume. Les volumes de rivière, vent, feuillage et oiseaux restent ceux de 10.1 et ne constituent pas une amélioration audio livrée ici.

Limitations artistiques et techniques restantes : nuages 2.5D parfois doux, ombres de leur détail approximatives, nuit sans lune ni lumières architecturales, pluie sans occlusion fine des toits/impacts/flaques, surfaces mouillées non ajoutées, orage sans éclairs ou tonnerre nouveaux, benchmarks logiciels seulement. Les données inconnues de débit, largeur mesurée, trafic et espèces locales restent inconnues.

**La poursuite au Jalon B attend votre approbation explicite du Jalon A.**
