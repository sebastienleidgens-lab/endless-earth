# Mission 06 — La nature extraordinaire

Branche `mission/06-nature-extraordinaire`, base `60a8f104b92f317d84c4c0ff989d31ec6ad16ae2` (`origin/main`). Fusion de la Mission 05, PR #9, vérifiée par Git et par GitHub (`merged: true`) avant les changements. Livraison en une PR en brouillon, sans fusion ni déploiement. Aucun workflow, aucune dépendance ni donnée géographique source modifiés.

## Audit et direction artistique

Lecture de l’architecture, des rapports des Missions 03, 04 et 05, du terrain triangulé IGN, des couvertures et empreintes OSM, du graphe piéton, des collisions, de la caméra, des instances végétales, du LOD architectural différé et de l’audio sérialisé. La référence possède déjà une forêt instanciée, une végétation riveraine illustrative, des buissons, quatre oiseaux et des nuages regroupés. Les insuffisances observées sont les couronnes très similaires, les exclusions incomplètes des petits décors, les surfaces uniformes et le cycle lumineux restant dans une journée de démonstration.

L’intention est une nature plus différenciée et un paysage lisible, avec davantage de profondeur, sans cacher les maisons. Le résultat demeure stylisé : les captures ne constituent pas une restitution photoréaliste ni une observation botanique. Les deux forêts du corpus sont des couvertures OSM, dont certaines descriptions remontent à CORINE 2006. Aucune prairie n’est identifiée dans ce corpus : la vue nommée `prairie` dans les preuves montre un **espace ouvert non caractérisé**, sans prétendre en connaître l’usage.

## Systèmes et provenance

- `src/nature/ecology.mjs` : profil Poitou v1, règles et placement indépendants de Three.js. Échantillonnage déterministe, forêt, jeunes sujets, silhouettes riveraines plus élancées, quelques arbres isolés seulement dans une couverture compatible. Emprises, trous des polygones, eau, routes et chemins, murs et monuments, marges autour des bâtiments et pente maximale de 0,58 sont contrôlés. Relief manquant : pas de plantation. Les arbres cartographiés ne sont pas déplacés ; un conflit avec une exclusion les écarte. Ces règles restent une approximation à la résolution des données disponibles.
- `src/nature/render.ts` : troncs et branches regroupés dans une géométrie partagée, couronnes composées de trois volumes asymétriques, variation de dimensions, orientation et teintes. Deux lots instanciés par cellule d’arbres de 180 m. Pas de draw call par arbre. Les cellules de détail de 128 m sont indépendantes : feuilles, petites branches, pierres, herbes et formes de fougères sobres dans les bois ; fleurs très rares uniquement si un habitat ouvert compatible existe. Le pilote ne reçoit donc pas de tapis de fleurs inventé.
- `src/nature/surfaces.ts` : variations de sol dans le matériau existant, petite texture procédurale originale de 64 × 64 pixels, échantillonnée à deux échelles et orientations pour atténuer la répétition ; micrograin mipmappé et atténué avec la distance. Ondulations et variations de teinte de l’eau par shader, mélange léger suggérant le ciel aux angles rasants. Pas de réflexion de scène, de miroir parfait, de déplacement des cours d’eau ou d’altération de leur relief. Les trous OSM des surfaces d’eau sont conservés.
- `src/nature/climate.mjs` et `sky.ts` : position solaire approximative à partir de l’UTC, de la latitude, de la longitude et du jour de l’année ; affichage civil `Europe/Paris` avec heure d’été. Heure et date réelles par défaut. Mode **Démo ×72** du temps simulé (delta plafonné existant conservé), explicite et séparé, accessible dans « Temps et atmosphère ». Les paramètres `?time=demo` et `?weather=mist` servent à la démonstration. La date fixe utilisée par les captures est signalée comme référence.
- Clair, couvert, brume et régime pluvieux simulés ; interpolation exponentielle d’environ 45 s, sans événement automatique fréquent. Le régime pluvieux est une ambiance couverte, venteuse et sonore, **sans gouttes, ruissellement ou particules de pluie**. Cela évite une pluie traversant les toitures ; ce n’est pas une simulation complète de pluie. Pas de données météo réelles ni de revendication en ce sens. La brume conserve une portée suffisante pour les bâtiments proches.
- Vent partagé entre feuillage, plantes souples et ondulations d’eau. Le poids de flexion des détails au sol est explicite : une pierre ou une branche morte ne se met pas à osciller avec l’altitude du terrain. Les couleurs automnales et hivernales sont approximatives ; il n’y a pas encore de chute des feuilles ni de défoliation complète.
- Données génériques d’un petit passereau, comportement temporel et représentation distincts. Fenêtres de présence brèves, longues absences, début d’envol depuis la couronne et réaction à moins de 7 m du personnage. Les départs varient entre fenêtres temporelles déterministes. Ni orbite permanente autour du joueur, ni observation d’une espèce réellement recensée. Les silhouettes restent minimalistes.
- Audio : synthèse originale uniquement. Bruit filtré plus long et moins aigu, départs décalés du vent et de l’eau, distance aux **segments** de rivière plutôt qu’aux seuls sommets, appels beaucoup plus espacés et suspendus la nuit. Pas par surface, opt-in, deux sources d’ambiance et sérialisation `resume/suspend` conservés. Le bus maître reste le point d’intégration d’un futur ambient original. Pas de musique ni d’enregistrement externe ajouté ; aucune nouvelle licence d’asset.

## Passes artistiques et preuves

Les dix vues de référence ont été réalisées avant l’intégration. La première position de « bois » était hors forêt : elle et le gros plan du sol ont été repris sur une couverture réellement cartographiée, à `x=-430, z=340` mètres locaux. Les réglages, position du personnage, caméra et profil sont enregistrés dans les JSON. Ces positions sont des stations de caméra de diagnostic ; elles ne sont pas toutes des positions piétonnes autorisées. Le script de relevé fixe le mode de vue dans son instrumentation, sans modifier les contrôles ni les exclusions du produit. La marche réelle est validée séparément sur le trajet OSM.

1. **Passe 1**, fichiers `pass1-*` : implantation, ciel et lumière, premiers sols et eau. Inspection des vues de rue, rivière, forêt, sol et nuit. Corrections d’un nom GLSL réservé et d’un regroupement incompatible de géométries d’eau détectés pendant le travail, avant la livraison.
2. **Passe 2**, fichiers `after-*` : suppression d’une trame trop périodique au sol, éclairage plus doux des couronnes, végétation également guidée par les contours réels d’eau. Inspection des dix captures : présence excessive de triangles décoratifs dans le bois et hausse des appels de rendu encore trop forte.
3. **Passe finale**, fichiers `final-*` : cellules d’arbres regroupées à 180 m, branches simplifiées sans supprimer la silhouette, feuilles étroites, petites pierres en volume, fougères à folioles et détails drapés sur le relief. Les détails rigides cessent de bouger au vent. Correction du départ des oiseaux depuis leur perchoir.

| Vue | Position locale / réglage | Référence Mission 05 | Version finale |
| --- | --- | --- | --- |
| Rue | Départ sûr existant, troisième personne | [Avant](mission-06-captures/before-rue.png) | [Final](mission-06-captures/final-rue.png) |
| Anglin | -120, 245 ; yaw 0,9 ; recul 15 m | [Avant](mission-06-captures/before-riviere.png) | [Final](mission-06-captures/final-riviere.png) |
| Bois cartographié | -430, 340 ; yaw 1 ; recul 8 m | [Avant](mission-06-captures/before-bois.png) | [Final](mission-06-captures/final-bois.png) |
| Espace ouvert | 330, -400 ; yaw 1 ; recul 15 m | [Avant](mission-06-captures/before-prairie.png) | [Final](mission-06-captures/final-prairie.png) |
| Ensemble aérien | -100, 155 ; yaw 0,5 ; zoom 210 m | [Avant](mission-06-captures/before-aerienne.png) | [Final](mission-06-captures/final-aerienne.png) |
| Sol forestier | -430, 340 ; première personne, regard abaissé | [Avant](mission-06-captures/before-sol.png) | [Final](mission-06-captures/final-sol.png) |
| Aurore | Vue Anglin, 21 juin 2026, 04:00 UTC | [Ancien cycle](mission-06-captures/before-aurore.png) | [Soleil calculé](mission-06-captures/final-aurore.png) |
| Nuit | Vue Anglin, 21 juin 2026, 23:00 UTC | [Ancien cycle](mission-06-captures/before-nuit.png) | [Nuit](mission-06-captures/final-nuit.png) |
| Éco | Vue Anglin, midi UTC | [Avant](mission-06-captures/before-eco.png) | [Final](mission-06-captures/final-eco.png) |
| Mobile | 390 × 844, Éco | [Avant](mission-06-captures/before-mobile.png) | [Final](mission-06-captures/final-mobile.png) |

Sélection des passes intermédiaires conservée : [bois en passe 1](mission-06-captures/pass1-bois.png), [bois en passe 2](mission-06-captures/after-bois.png), [sol en passe 1](mission-06-captures/pass1-sol.png), [sol en passe 2](mission-06-captures/after-sol.png). Les autres captures intermédiaires restent du travail local ; aucun fichier vidéo ne rejoint le dépôt.

**Limite de comparaison lumineuse :** l’ancienne version ignore le paramètre de date et n’offre pas de véritable nuit. Les images `before-aurore` et `before-nuit` documentent son cycle existant ; elles ne sont pas présentées comme des captures nocturnes équivalentes. Les autres vues finales utilisent le 21 juin à midi UTC, à positions et réglages identiques, mais avec le nouveau calcul de lumière. Les animations continuent : il ne s’agit pas d’un test pixel à pixel figé.

4. **Passe d’optimisation supplémentaire** : une première tentative de promenade est interrompue après environ 15 m et 77 s sous SwiftShader, sans atteindre les 450 m. Elle signale un coût logiciel excessif, sans isoler une cause unique. Le bruit de sol calculé par fonctions trigonométriques dans chaque fragment est remplacé par la texture partagée de 16 384 octets hors mipmaps ; les nuages passent à une géométrie partagée plus simple. Le mélange de ciel dans l’eau utilise aussi l’angle à la normale. La marche complète est reprise à 640 × 480, sans changer le contrôleur, sa vitesse ni le calcul du temps. Le harnais autorise au maximum 30 minutes réelles sous SwiftShader au lieu de 11 ; il conserve les chronomètres `Date.now`/`performance.now`, la distance réelle à chaque image et l’exigence de terminer les 450 m. Le pincement CDP est recentré sur le canevas pour éviter le panneau de météo à cette résolution. Ces changements et la résolution différente empêchent d’attribuer isolément un éventuel gain de durée au shader.

## Coûts, mémoire et chargement

Les mesures ci-dessous concernent Chromium/ANGLE/SwiftShader, 800 × 600 puis 390 × 844, ratio 1. Elles ne sont pas extrapolées à un GPU matériel. Les appels et triangles dessinés couvrent la scène entière. `memory.bytes` additionne les attributs et index des **géométries uniques conservées**, y compris les objets masqués ; il exclut les matrices/couleurs d’instances, les textures, le tas JavaScript et la mémoire interne du pilote. `memory.triangles` compte les triangles des buffers uniques, sans expansion virtuelle des instances. `architectureMemory` conserve le compteur architectural de la Mission 05.

| Vue | Appels avant → final | Triangles dessinés | Triangles des buffers uniques | Buffers Mo | FPS logiciel approximatif |
| --- | ---: | ---: | ---: | ---: | ---: |
| rue | 150 → 141 | 399027 → 424837 | 422653 → 423159 | 30.48 → 30.49 | 0.70 → 0.57 |
| riviere | 126 → 115 | 300656 → 324936 | 456871 → 457377 | 33.14 → 33.16 | 1.83 → 1.26 |
| bois | 81 → 70 | 253131 → 282993 | 444161 → 453189 | 32.15 → 33.19 | 2.50 → 1.86 |
| prairie | 98 → 97 | 214651 → 228331 | 437491 → 437987 | 31.63 → 31.65 | 2.91 → 2.11 |
| aerienne | 310 → 304 | 349379 → 377795 | 454675 → 455171 | 32.97 → 32.99 | 1.55 → 1.08 |
| sol | 75 → 64 | 252511 → 282373 | 434381 → 443409 | 31.39 → 32.43 | 1.96 → 1.49 |
| aurore | 125 → 115 | 290842 → 315122 | 443235 → 452263 | 32.08 → 33.12 | 0.79 → 1.54 |
| nuit | 125 → 115 | 290842 → 315122 | 443235 → 452263 | 32.08 → 33.12 | 1.43 → 1.49 |
| eco | 125 → 115 | 288250 → 312722 | 413435 → 413931 | 29.76 → 29.77 | 1.14 → 1.32 |
| mobile | 92 → 82 | 268655 → 293127 | 413435 → 413931 | 29.76 → 29.77 | 0.96 → 1.05 |

Les buffers architecturaux sont **strictement identiques dans les dix paires** : 27,62 Mo dans la rue, par exemple. Les appels diminuent de 1 à 11 selon la vue ; les triangles dessinés augmentent d’environ **6 à 12 %**. Les arbres passent de 2147 à 1650 : la variété vient des formes et proportions, pas d’une multiplication des individus. Le détail forestier ajoute environ **1,04 Mo** dans les vues bois/sol ; les vues de rue ne prennent qu’environ **18 ko de buffers géométriques** supplémentaires. La texture commune de 16 ko hors mipmaps ajoute un quatrième objet texture au rendu, sans être incluse dans ces Mo.

**Régression observée en Qualité :** plusieurs échantillons logiciels sont plus lents d’environ 19 à 31 %, malgré les appels réduits. Les vues Éco et mobile ne montrent pas de baisse dans cette paire, mais ces mesures uniques ne prouvent aucun gain reproductible de FPS. Elles incluent la convergence et la charge variable de SwiftShader, sans réplication statistique. La préférence est donnée à une densité mesurée et au profil Éco pendant la marche ; le surcoût Qualité reste une limite à profiler sur GPU. Les images aurore/nuit ne sont pas des comparaisons d’éclairage équivalent.

Trois générations synchrones sur les mêmes données, dans le même navigateur : référence **1 483,9 / 1 311,7 / 1 131,5 ms**, final **1 529,5 / 1 242,5 / 1 019,9 ms** ; médianes **1 311,7 → 1 242,5 ms**. L’ordre référence puis final, la compilation et les caches empêchent de présenter les −5,3 % comme un gain statistique établi. Les 921 bâtiments et leur coque restent identiques ; la nature finale compte **42 cellules d’arbres et 168 cellules éligibles de détail**. Le chargement réel initial de cette session à 640 × 480 prend **16,118 s** jusqu’au monde prêt et aux commandes activées, réseau local et compilation compris ; aucune mesure initiale comparable de bout en bout n’est disponible.

L’instrumentation du callback atmosphérique relève **28 échantillons CPU**, médiane **0,20 ms**, maximum **32,70 ms**, avec un coût de démarrage. Cela exclut le dessin, les shaders GPU, le LOD et l’audio : ce n’est ni une borne ni le coût total d’une image. Au repos, cette scène compte une cellule de détail végétal résidente/visible et une construction ; les tests séparés couvrent l’éviction lors des déplacements. Les pics d’approche architecturaux/végétaux ne font pas l’objet d’un percentile exhaustif dans cette mission.

Relevés : [comparaison structurée](mission-06-captures/comparison.json), [génération, horloge, météo et mise à jour](mission-06-captures/generation-climate.json).

Chaque capture attend au moins 20 images rendues, puis huit images consécutives stables pour les positions caméra arrondies au millimètre, les constructions architecturales et la taille des buffers conservés. Un défaut de convergence après 100 images fait échouer le scénario ; les objets permanents ne sont pas régénérés pour la photographie.

Le détail végétal est construit au plus une cellule par mise à jour LOD (4 Hz), seulement à proximité : rayon du centre de cellule 110 m en Qualité, 55 m en Éco, hystérésis de 18 m. Quatre cellules invisibles au maximum sont gardées ; les autres libèrent géométrie et matériau. Les tests vérifient la stabilité au repos et l’éviction. Ce budget en cellules **ne garantit pas un plafond de millisecondes** lors de la première approche. Les arbres ont leurs propres distances hystérétiques. L’architecture différée de la Mission 05 et son cache ne sont pas reconstruits par le vivant.

Le bruit audio de 17 s est partagé entre les deux ambiances et les pas : environ 3,26 Mo à 48 kHz en mono float32, contre 0,58 Mo pour les 3 s précédentes, alloués uniquement à l’activation volontaire. Ce coût audio n’est pas inclus dans les buffers géométriques du tableau.

Le déchargement d’une zone libère chaque géométrie unique et matériau possédé une fois, puis les recettes ; le coordinateur retire ses ancrages de faune/audio. Les matériaux partagés de route/eau et d’architecture sont conservés pour les autres zones. Le pilote normal reste chargé en un seul groupe géographique : ces mécanismes préparent le déchargement, sans démontrer une exploration nationale en streaming. Le chargement initial des arbres et de la coque architecturale reste synchrone.

## Vérifications et reproduction

- Référence : `npm test` **49/49** et `npm run build` réussis avant intégration. Version finale : **58/58** et compilation réussie, bundle de **589,32 ko / 160,41 ko gzip**, contre environ 578,24 / 155,82 ko ; avertissement Vite de taille déjà présent.
- Nouveaux tests : déterminisme, exclusions des routes/bâtiments/eaux, marge des cours intérieures, relief absent et pentes, clairières, habitat, cycle solaire, transition météorologique, longues absences animales, stabilité des buffers au repos, cache végétal borné et destruction unique des ressources par zone.
- `browser-camera.mjs` : réussi ; zoom, glissement, délai de recentrage, rétraction devant un mur et trois modes. `browser-safety.mjs` : réussi ; cinq obstacles injectés après départ (bâtiment, accès privé, eau, mur, ruine), chaque position échantillonnée autorisée. Ces deux contrôles précèdent la dernière optimisation de texture/nuages ; aucun module de caméra, collision ou navigation n’a ensuite changé.
- `browser-living.mjs` : réussi ; marche, trois vues, reprise manuelle, mobile, absence d’erreur JavaScript/HTTP, six cycles et douze bascules rapides, un contexte audio et deux sources d’ambiance. Une attente initiale fixe de 6 s ne garantissait pas 50 cm de déplacement sous SwiftShader ; le test attend maintenant ce déplacement réellement observé, avec une limite de 90 s. Il ne change ni la vitesse ni le temps de simulation.

**Promenade complète : 450,000 m cumulés à chaque image, en 1 136,269 s (18 min 56,27 s), 1 462 images rendues.** Le chronomètre externe donne 1 137,549 s ; le relevé moins fréquent donne 449,946 m et sous-estime légèrement les angles. Arrêt normal « Fin du parcours OSM validé ». Graphe : 939 sommets / 918 segments. Le trajet calculé de 3 787,53 m trouvé par l’heuristique reste une possibilité calculée, pas une marche effectivement réalisée.

Le scénario est exécuté seul en navigateur, à 640 × 480 et profil Éco automatique, puis 390 × 844 à l’arrivée. La vitesse, l’accélération, les virages et le plafonnement existant du delta à 250 ms restent inchangés. Moyenne approximative : **1,29 image/s sous SwiftShader**, sans signification de FPS matériel. La Mission 05 rapportait 383 s sur un autre passage logiciel : **la nouvelle marche est beaucoup plus longue en temps réel**, mais ce chiffre historique ne permet pas d’isoler le changement de code dans cet environnement. Les relevés stationnaires avant/après sur le même environnement servent de comparaison graphique séparée.

Les statistiques architecturales initiales sont strictement conservées à l’arrivée : 921 bâtiments, 10 723 ouvertures, 69 cellules, `builds: 1`. Les constructions différées et évictions de détails à l’approche restent prévues. Inspection de plusieurs étapes en rue et à l’ouverture du paysage : aucune traversée ou obstruction nouvelle évidente dans ces échantillons. Preuves : [mesure complète](mission-06-captures/promenade.json), [rue](mission-06-captures/promenade-rue.png), [paysage](mission-06-captures/promenade-paysage.png), [arrivée mobile](mission-06-captures/promenade-arrivee-mobile.png).

`npm run test:browser` a été relancé après la dernière optimisation graphique : **réussi**, avec déplacement, trois modes, garde au sol, audio, profil et mobile, sans erreur JavaScript. `browser-nature.mjs` : **dix paires validées**, positions et modes identiques, caméra à moins de 2,5 cm, aucune erreur console de shader ou JavaScript. `browser-nature-metrics.mjs` : **réussi**, horloge réelle vérifiée contre l’UTC actuel, mode Démo séparé et transition météo progressive observée. Chromium **156.0.8078.79**, ANGLE/Vulkan/SwiftShader Subzero. [Résumé de validation](mission-06-captures/validation.json).

Démarrer `npm run dev`, puis `node scripts/browser-nature.mjs final` pour les dix vues. La téléportation des vues est injectée **uniquement dans le module servi au navigateur de test** ; aucune commande de téléportation n’est exposée dans le produit. Après détection de la conservation involontaire du mode première personne sur certaines stations de caméra, le script vérifie le mode et la position caméra à 2,5 cm près contre la référence. La séquence de référence complète est reprise sur un checkout isolé de `60a8f10` pour comparer aussi le même historique de cache.

Les JSON [référence](mission-06-captures/before.json), [passe 1](mission-06-captures/pass1.json), [passe 2](mission-06-captures/after.json) et [final](mission-06-captures/final.json) conservent les états.

`node scripts/browser-nature-metrics.mjs` prépare automatiquement un module de mesure de la référence `60a8f10` dans `work/`, mesure trois générations par version sur les mêmes données et teste l’horloge et la météo. La référence utilise les modules d’architecture inchangés et le compilateur de feuillage courant ; ses mesures de génération CPU n’évaluent pas l’ancien shader à l’écran. Le module temporaire est exclu du dépôt. Pour refaire entièrement les images « avant », servir le commit de référence avec le script de capture de cette mission ; ne pas écraser les images avant avec le serveur courant.

## État des objectifs encore partiels

| Objectif | État livré et limite |
| --- | --- |
| Végétation régionale | Silhouettes, règles, exclusions et forêt enrichies ; essences précises, sols pédologiques et exposition non renseignés. |
| Sols et microdétails | Texture originale et détails forestiers ; pas de mousses spécialisées ni de végétation murale supplémentaire. |
| Eau et atmosphère | Ondulations légères, ciel nuancé, soleil réel et brume ; pas de reflets de scène ni de reconstruction des berges. |
| Météo | Régimes progressifs sélectionnables ; pluie visuelle, abris, neige et données météo réelles reportés. |
| Faune et sons | Présences rares, perchoirs et synthèse originale ; insectes, sons nocturnes spécialisés et écoute longue non validés. |
| Performances et territoires | Instances, détails différés et destruction par zone ; GPU matériel, Android et streaming national non validés. |

## Limites, reports et Mission 07

Les proportions, essences et implantations individuelles restent inférées. Le DEM de 10 m ne décrit pas un seuil, une berge détaillée ou chaque talus. Les marges sont conservatrices et peuvent écarter un arbre pourtant présent sur le terrain. Les zones sans couverture ne reçoivent pas une flore inventée pour embellir une capture. Le monde reste visiblement stylisé ; les grands espaces ouverts et certaines berges restent sobres. L’interface historique occupe encore une part importante des captures mobiles.

Sont reportés : botanique précise par espèce, exposition solaire et pédologie des sols, buissons et mousses spécialisés au pied des murs, défoliation saisonnière, insectes et papillons, sons nocturnes spécialisés, pluie avec abris et ruissellement, neige, reflets de scène, météo réelle, musique originale et génération asynchrone nationale. Ces choix évitent une accumulation de simulations superficielles ou de nouvelles dépendances. La simple coloration saisonnière ne constitue pas un cycle biologique complet.

Écoute humaine de vingt minutes sur casque, Android physique, GPU matériel et exploration exhaustive de la carte non réalisés. Les captures et scénarios échantillonnés ne prouvent pas l’absence de défaut partout. Les gains de compteurs et les impressions artistiques doivent rester distincts.

Pour la Mission 07 : prioriser une mesure sur téléphone réel, un budget de génération en temps plutôt qu’en cellules, un couvert du sol plus récent et détaillé, puis des assets régionaux originaux plus fins pour quelques lieux observés. Poursuivre les relevés d’approche et les écoutes longues avant d’accroître la densité. Aucune de ces évolutions n’est développée ici.
