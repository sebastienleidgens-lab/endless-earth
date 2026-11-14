"""Assemble the final report only from completed native evidence. Run after soak."""
import json,pathlib,statistics,subprocess,html
root=pathlib.Path(__file__).resolve().parents[1];out=root/'docs/mission-22-evidence'
def load(name):return json.loads((out/(name+'.json')).read_text())
walk=load('walk');family=load('family');density=load('density');perf=load('performance');cpu=load('cpu');audio=load('audio');diversity=load('diversity');preserve=load('preservation');compiled=load('compiled');media=load('media');validation=load('validation');lifecycle=load('lifecycle');equivalence=load('runtime-equivalence')
assert walk['passedMinimumThirtyMinutes'] and family['completedRoutineAndReturn'];assert len(perf['rows'])==9 and len(density['rows'])==7 and len(audio['rows'])==10 and lifecycle['stable']
perf['rows'].sort(key=lambda r: (['village','foret','riviere'].index(r['station']),['eco','balanced','quality'].index(r['profile'])))
bench='\n'.join(f"| {r['station']} | {r['profile']} | {r['population']['count']} | {r['before']['medianMs']:.1f} | {r['after']['medianMs']:.1f} | {r['regressionPercent']:+.1f} % | {r['after']['p95Ms']:.1f} / {r['after']['peakMs']:.1f} |" for r in perf['rows'])
dens='\n'.join(f"| {r['name']} | {statistics.mean(d['meanOutdoor'] for d in r['days']):.2f} | {max(d['maxOutdoor'] for d in r['days'])} | {statistics.mean(d['fractionEmptyAtVillage'] for d in r['days'])*100:.1f} % | {max(d['longestEmptyAtVillageSeconds'] for d in r['days'])/60:.0f} min |" for r in density['rows'])
cpus='\n'.join(f"| {r['people']} | {r['simulation']['medianMs']:.4f} | {r['simulation']['p95Ms']:.4f} | {r['pose']['medianMs']:.4f} | {r['pose']['p95Ms']:.4f} |" for r in cpu['rows'])
balanced=[r['regressionPercent'] for r in perf['rows'] if r['profile']=='balanced'];bmedian=statistics.median(balanced)
report=f'''# Mission 22 — Les vies silencieuses d’Angles-sur-l’Anglin

PR en brouillon pour revue artistique et technique. Base `main` **b8e354025259368abdc4303711e7b6b1272fcac5**, fusion de la Mission 21 par PR #30 vérifiée avant création de `mission/22-vies-silencieuses`. Budget supplémentaire **0 €**, aucun service permanent, asset payant, API payante ou modèle de langage pour les habitants. Aucune fusion ni publication du jeu. Living Paintings / LP-01 et les workflows de déploiement sont inchangés.

[Galerie native, portraits et films](mission-22-evidence/index.html) · [promenade ordinaire](mission-22-evidence/walk.json) · [famille suivie](mission-22-evidence/family.json) · [mesures](mission-22-evidence/performance.json) · [densité](mission-22-evidence/density.json) · [validation](mission-22-evidence/validation.json).

La livraison apporte une architecture fonctionnelle et une vie discrète, avec **des limites artistiques et fonctionnelles explicites**. Elle ne certifie pas des habitants « humains » ou une diversité exceptionnelle sur le seul fondement des tests. Les modèles sont des silhouettes procédurales stylisées à membres rigides articulés. Les entrées de maison, bancs et pique-niques ne sont pas activés faute d’ancrages locaux validés.

## 1. Architecture du Village Life Director

`village-director.mjs` possède les identités, intentions, états, itinéraires, progression, rencontres, horaires probables et animaux. Il n’importe aucune caméra, renderer ou stockage. `village-navigation.mjs` annote le graphe existant ; `village-identity.mjs` porte identité, vêtements, fréquentation et budgets. `village.ts` adapte le calendrier M21, support physique, représentations, mémoire locale et événements audio. `village-render.mjs` dessine le même modèle dans le jeu et l’atelier de contrôle.

Le temps de vie reçoit le temps écoulé natif, sans deuxième calendrier. Un retour d’onglet avance les vies existantes sans rejouer une rafale de départs ni de sons. Le contexte horaire et saisonnier vient exclusivement de `naturalSky`. La caméra ne démarre pas une routine. Les tests reproduisent les mêmes vies sans caméra.

## 2. Modèle probabiliste de fréquentation

L’occasion suivante utilise une attente `30 − log(1 − u) × 155` secondes, avec PRNG stable et état sauvegardé. Une occasion choisit d’abord une origine du graphe et un itinéraire admissible ; elle peut échouer. L’admission dépend ensuite de `rythme × saison × jour × météo × température × zone`. Aucun minimum de population n’est recherché. Les groupes et occasions non admis ne sont pas remplacés pour remplir la scène.

Le pool logique est borné à environ quarante personnes ; il ne constitue pas un objectif de présence extérieure. Les routines terminées restent logiquement au dernier point public puis attendent une occasion ultérieure. Les reprises respectent à nouveau météo et horaires familiaux. La rotation à très long terme du pool de visiteurs est limitée : ce n’est pas encore un renouvellement démographique complet.

## 3. Densité selon les heures

Poids d’interprétation, pas comptages locaux : avant 5 h **0,013**, 5–7 h **0,13**, 7–10 h **0,55**, 10–12 h **0,88**, midi **0,72**, 14–18 h **1**, 18–21 h **0,45**, fin de soirée **0,055**. L’heure civile M21 et Europe/Paris restent propriétaires. Une personne isolée demeure possible la nuit. Les départs de familles et poussettes sont refusés avant 7 h et après 21 h, y compris après une ancienne routine diurne.

Ces fenêtres ne décrivent pas les habitudes d’occupants réels. Une famille déjà observée peut terminer son trajet ; elle n’est pas supprimée au changement d’heure.

## 4. Densité selon les saisons

Les poids mensuels vont de **0,34 en janvier à 1,16 en juillet**. Week-end ×1,18 et jour de semaine ×0,87. La pluie, neige, activité électrique et vent réduisent l’admission ; températures négatives ou très chaudes la réduisent aussi. La probabilité reste positive pour les individus admissibles. Les conditions affectent les occasions, pas une consigne de nombre visible.

## 5. Densité selon les lieux

Village 1 ; résidentiel 0,52 ; patrimoine 1,05 ; pont 0,55 ; berge 0,48 ; chemin 0,40 ; forêt 0,19 ; zone isolée 0,07 ; point de vue 0,64. Le moteur dispose de ces catégories, mais l’annotation actuelle active surtout **village, résidentiel, pont, chemin et forêt** depuis les tags source et l’habitat chargé. Les destinations patrimoniales/belvédères et berges ne possèdent pas encore toutes une classification dédiée au directeur. Aucun nouveau chemin public n’est inventé pour remplir une catégorie.

## 6. Diversité physique

Identité stable : taille, carrure, épaules, proportions jambes/tête, forme du visage, carnation, cheveux, coiffure, barbe, lunettes, posture, vitesse, foulée et amplitude des bras. Sept âges apparents couvrent bébé accompagné, jeune enfant, enfant, adolescent, jeune adulte, adulte et senior. Les enfants possèdent une tête proportionnellement plus grande et des jambes proportionnellement plus courtes. La vitesse n’est pas déduite automatiquement de l’âge ; des seniors rapides sont vérifiés.

La présentation est variée et les morphologies ne sont pas réduites à une palette. L’expressivité faciale, les doigts et le naturel proche restent limités par la géométrie stylisée.

## 7. Génération des personnages

Les personnes sont une création procédurale originale du projet. Aucun modèle acheté ni texture de visage externe. Graine FNV de l’identifiant fictif ; PRNG déterministe. Le même identifiant recrée les mêmes proportions et accessoires permanents. Les personnes récurrentes sont une petite bibliothèque de 32 identités fictives ; les visiteurs prennent des identifiants distincts. Aucune donnée personnelle ou composition de ménage réelle n’est utilisée.

## 8. Vêtements et accessoires

Bibliothèque de silhouettes : tee-shirt, chemise, pull, veste, manteau, imperméable, short, jupe et robe ; chaussures, coiffures, lunettes, barbe, chapeau/bonnet, écharpe, sac et parapluie. Les volumes du bas, manteaux et jupes changent effectivement de géométrie. La tenue est choisie au départ selon température et pluie, puis conservée pendant toute la sortie. Un orage ne remplace pas une tenue devant la caméra.

Les détails de couture, tissus souples et une grande bibliothèque de tenues de randonnée spécialisées ne sont pas livrés. Le parapluie est une approximation géométrique, sans animation mécanique d’ouverture. Le renouvellement saisonnier des tenues entre plusieurs reprises du même groupe reste limité ; la continuité de l’apparence visible est prioritaire.

## 9. Démarches et animations

La distance parcourue pilote la phase des jambes et le roulement des roues. Vitesse, foulée, amplitude, phase et posture varient par identité. Les appuis sont conservés en coordonnées du monde ; les cibles de pieds utilisent le même support physique. Démarrage et ralentissement sont bornés ; tête et respiration restent discrètes. Pause, observation, attente, conversation gestuelle et photographie utilisent des poses finies.

Le pied est un volume simplifié ; `footSupportError` mesure l’écart des points de contrôle de la semelle au support échantillonné, pas chaque sommet dans toute pose. Les rotations du corps, la course des PNJ, les animations assises et les interactions fines avec objets ne constituent pas une bibliothèque complète. Le personnage principal M19 est préservé.

## 10. Couples

Une destination commune, une vitesse compatible avec les deux personnes et un arrêt partagé. Le partenaire ne reçoit pas une destination aléatoire indépendante. La formation s’adapte à la largeur estimée du chemin, avec représentation atomique de tout le couple. Les gestes de conversation restent stylisés ; les mains liées et le regard social précis ne sont pas animés.

## 11. Familles

Configurations : adulte/enfant ; deux adultes/jeune enfant ; deux adultes/deux enfants ; adulte/senior/enfant. Un bébé accompagné existe dans la configuration poussette et compte dans le quota humain même lorsqu’il est contenu dans la poussette. Les enfants ont des proportions propres et une variation d’avance limitée sur les voies larges. Aucun enfant ne reçoit une routine indépendante qui abandonnerait son groupe.

## 12. Cohésion des groupes

Progression commune, retards longitudinaux et décalages latéraux contrôlés. Les passages étroits imposent la file ; le leader attend une personne retardée. Les groupes distincts vérifient occupation et possibilités de décalage avant de poursuivre. Une destination n’est pas recalculée à chaque image.

Les décisions de collision sont conservatrices et ne constituent pas un solveur de foule. Le raccord aux changements de largeur, les demi-tours et l’évitement du joueur restent moins riches qu’une animation humaine. Aucune collision dure de PNJ n’est ajoutée au contrôleur du joueur.

## 13. Routines individuelles

Départ → marche → arrêt intermédiaire fini → reprise → activité à destination → retour public lorsque le graphe dirigé le permet → repos logique → prochaine occasion. Les chemins sont calculés par Dijkstra sans répétition de nœud, avec des destinations distinctes et une courte mémoire de visites. Les habitants reviennent vers une origine publique, sans prétendre rejoindre une maison identifiée.

Le test de famille vérifie une sortie et son retour complets. Une observation très longue d’un personnage au repos peut encore exposer une attente peu expressive au point public ; la vie domestique n’est pas simulée derrière une façade.

## 14. Activités et rencontres

Contemplation, photographie, conversation brève, arrêt de cohésion, promenade et reniflement du chien. Deux solitaires suffisamment proches peuvent ralentir pour une rencontre, avec garde de répétition. Les gestes et le son suivent l’événement. Les activités favorites modulent le choix d’activité ; les créneaux individuels enregistrés ne constituent pas encore un emploi du temps domestique détaillé.

Il n’existe pas de dialogue intelligible, de marqueur de quête, de réaction systématique à la caméra ni de LLM embarqué.

## 15. Maisons et entrées

**Aucune entrée activée.** Les ouvertures existantes sont décoratives, sans continuité intérieure ni ancrage de franchissement validé. Aucun PNJ ne traverse une façade ou ne disparaît dans un mur. Le directeur termine sur un point du réseau public. Il ne déduit pas une entrée privée de la proximité d’une porte. Un futur ancrage devra valider seuil, orientation, enveloppe, corridor public et transition occultée avant admission.

## 16. Bancs, pauses et pique-niques

L’audit du jeu de données n’a trouvé aucun banc ni site de pique-nique documenté. Les pauses debout sont actives ; **s’asseoir sur un banc et pique-niquer ne sont pas activés**. Un terrain libre dans le moteur n’est pas déclaré espace public autorisé. Aucun banc synthétique n’est utilisé comme preuve géographique. Les séquences d’installation, rangement et assise restent à réaliser après acquisition d’ancrages admissibles.

## 17. Petite faune terrestre

Chien attaché logiquement au groupe, plusieurs tailles et teintes, marche, arrêt et reniflement. Le propriétaire attend pendant l’arrêt. Les décalages du chien sont validés contre les obstacles ; les jambes ne flottent pas volontairement au-dessus d’un support absent. Chats discrets dans village/résidentiel ; écureuils lorsque l’habitat est compatible. Ils utilisent un pool borné et des activités propres, avec renouvellement d’itinéraire après repos.

Les oiseaux, insectes et leur directeur M20 sont conservés ; aucun second moteur aviaire. La laisse géométrique, des races détaillées, les chats sur un vrai mur et des animations zoologiques fines ne sont pas livrés. Ces animaux sont des interprétations d’habitat, pas des observations locales documentées.

## 18. Cyclistes et poussettes

Le directeur propose rarement ces modes. Les arêtes doivent respecter classe, largeur et restrictions ; les sens uniques automobiles ambigus sont exclus du vélo. L’enveloppe complète est échantillonnée à 0,5 m : support, obstacles, dévers et pente maximum **12 % vélo / 10 % poussette**. Escaliers, chemins incompatibles et restrictions de vélo sont exclus. Roues et pédalage sont liés à la distance.

Les modèles et postures sont simples ; la banque de virages inclinés et de mains exactement contraintes n’est pas complète. Une démonstration d’atelier n’est pas présentée comme une rencontre spontanée sur un itinéraire local.

## 19. Vie hors champ et LOD

Trois coûts : vie logique sans rendu ; silhouette perceptible avec détails réduits ; pose observable avec visage/accessoires et appuis au support. Les routines et identifiants ne dépendent pas du regard. L’adaptateur ne représente un nouveau groupe qu’à distance suffisante ; il ne fait pas apparaître une famille à proximité pour compenser le silence. Un fondu bref accompagne l’admission. La libération nécessite éloignement et absence du champ ; elle ne supprime pas l’identité ou sa progression logique.

Éco/Équilibré/Qualité : **3/4/10 personnes**, **1/2/3 animaux**, poses au plus **12/20/30 Hz**. Ce sont des plafonds de nouvelles admissions ; une famille entière dépasse temporairement le nouveau plafond lors d’une baisse de profil afin de préserver sa continuité. Aucun groupe incomplet n’est créé. Les niveaux proches/lointains restent des variantes du même lot rigide, pas trois modèles artistiques indépendants.

## 20. Persistance de la communauté

`endless-earth-village-life-v1` dans `localStorage`, version, graine, état du PRNG, horloge logique, dernière visite, routes, apparences de départ, progression et états. Limite **180 000 caractères**, validation des coordonnées source et de l’admissibilité des modes, refus des instantanés obsolètes/corrompus. En cas de stockage indisponible, la session continue. Aucun identifiant réel, nom d’occupant ou envoi externe.

La continuité est locale au navigateur ; pas de serveur partagé. Les écureuils/chats de session ne sont pas restaurés comme des animaux domestiques persistants.

## 21. Signes de vie invisibles

Fenêtres et pauses d’éclairage M21 restent déterministes et indépendantes du regard. Elles ne sont pas réattribuées à des ménages réels. Aucun volet articulé, silhouette derrière une vitre opaque, chat sur un mur non validé ou bruit humain permanent n’est ajouté. Le lien entre fenêtres et individus du nouveau directeur reste incomplet ; la présence invisible supplémentaire est donc partielle.

## 22. Ambiance sonore native

Les pas de PNJ proviennent de leur phase de déplacement et de la matière source de l’arête. Une matière inconnue reste silencieuse. Conversations brèves, aboiement lors d’un arrêt admissible et petits roulements de vélo/poussette utilisent les événements simulés et les positions de leurs sources. Les voix passent dans **le même AcousticRenderer, ses panners, obstacles, filtres, limiteur et budgets**. Un événement trop ancien, une ressource absente ou un budget plein n’est pas rattrapé en rafale.

Trois nouvelles prises CC0 : [Sadiquecat, 850823](https://freesound.org/people/Sadiquecat/sounds/850823/) ; [morganveilleux, 389993](https://freesound.org/people/morganveilleux/sounds/389993/) ; [Rudmer_Rotteveel, 719482](https://freesound.org/people/Rudmer_Rotteveel/sounds/719482/). Préécoutes HQ MP3 honnêtement identifiées, extraits mono FLAC 32 kHz, filtres/gain/fondus et SHA-256 conservés dans [les sources](mission-22-evidence/audio-sources.json) et [les crédits](../public/audio/credits.html). Rien n’est attribué à une prise à Angles. Le roulement de poussette est une interprétation issue du roulement de vélo, pas une captation spécifique.

Les **{len(audio['rows'])} films natifs** enregistrent le canevas et la vraie sortie AudioContext après limiteur. Aucun son ajouté après capture. Les inspections choisissent une routine et préchargent les assets ; leur pré-roll accéléré est déclaré, puis l’enregistrement reste natif. Le naturel des murmures, les rires distincts et la variété de voix restent à améliorer et à écouter lors de la revue.

## 23. Piétons et voitures

La route automobile M20 demeure le sous-ensemble audité existant ; aucune nouvelle route. Le contrôleur reçoit les positions de tous les piétons logiques proches du passage, conserve freinage et arrêt, sans heurter le joueur. Un groupe peut attendre une voiture. Une attente mutuelle de plus de quatorze secondes déclenche un retour admissible vers l’origine ou une fin de déplacement sûre. Les tests vérifient arrêt, reprise et récupération sans relocaliser les membres.

Il ne s’agit pas d’un code de circulation complet avec passages protégés et priorités cartographiées. La coordination fine d’une traversée familiale reste partielle. Les cas sans retour dirigé admissible demandent encore une validation et une récupération plus robustes ; le système ne certifie pas toutes les configurations d’attente réciproque.

## 24. Réactions à la météo

Le directeur consomme pluie, neige, vent, température et activité électrique M21. L’admission diminue ; une sortie déjà engagée se termine plus directement et raccourcit sa pause, sans disparition ni changement de vêtements en vue. Les reprises depuis le repos repassent par les mêmes gardes, y compris les horaires des enfants. Aucun abri décoratif n’est admis comme refuge praticable sans validation.

## 25. Choix techniques et optimisation

Comparaison retenue : modules géométriques partagés et instanciation plutôt qu’un rig skinné complet par passant. Un seul prototype arrondi et un seul matériau partagé regroupent corps, accessoires et animaux ; **un draw de population**, aucune texture image, bone texture, VAT ou passe d’ombre supplémentaire. Les poses sont mises à jour à fréquence bornée ; les visages sont omis au loin. Les champs d’instance et le pool sont réutilisés.

Les squelettes M19 restent adaptés au personnage principal, mais leurs skins et ombres multipliés étaient trop coûteux pour cette population. Une VAT aurait ajouté texture, variantes d’âge et contraintes sur les gestes ; elle n’est pas imposée. Le contrôle de démontage a mesuré deux buffers d’instance oubliés, **91 200 octets par lot**. Le dernier correctif appelle explicitement `InstancedMesh.dispose()` ; trois cycles réels de création/rendu/libération reviennent au même nombre de buffers et aux mêmes octets. [Contrôle WebGL](mission-22-evidence/lifecycle.json). Il reste des allocations temporaires de vecteurs et de listes dans la pose/évitement : leur coût mesuré est publié plutôt que présenté comme nul.

Le premier contrôle apparié à six personnes Équilibré donnait une médiane de **+5,34 %**. Le plafond Équilibré est donc ramené de six à **quatre personnes**, avant de dégrader le paysage ou les silhouettes. Une famille de quatre reste entière. [Matrice à six personnes](mission-22-evidence/performance-six-people.json).

## 26. Benchmarks

Comparaisons **isolées** sur Chromium/SwiftShader logiciel, 480 × 320 DPR1, caméra/profil/date appariés, 18 échantillons chauds alternés par condition, `gl.finish` et lecture de pixels. Le contrôle sans population exige le même nombre d’appels et de triangles du paysage avant chaque paire. La première campagne sans cet appariement complet est conservée comme exploratoire et exclue de la conclusion. La population est explicitement admise pour mesurer son coût ; ce n’est pas une scène de foule naturelle. Une ablation du lot sur le même build complète les comparaisons de version. Les coûts CPU purs sont séparés des attentes GL.

| Scène | Profil | Personnes | M21 médiane ms | M22 médiane ms | Écart | M22 P95 / pic ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
{bench}

Écart médian des cellules Équilibré : **{bmedian:+.1f} %**. La cible de régression médiane < 5 % est **{'atteinte dans cette campagne logicielle' if bmedian<5 else 'non atteinte dans cette campagne logicielle'}**. Les cellules défavorables restent visibles ; une médiane globale favorable ne les annule pas. Ni FPS Android, ni temps de GPU physique ne sont certifiés.

| Personnes, micro-banc Node | Logique médiane ms | Logique P95 ms | Pose médiane ms | Pose P95 ms |
| ---: | ---: | ---: | ---: | ---: |
{cpus}

Ce micro-banc exclut le GPU, les interrogations physiques du navigateur et le streaming. Le cas 36 personnes est une contrainte CPU synthétique, au-delà de tout plafond de rendu normal. [Données](mission-22-evidence/cpu.json).

## 27. Tests de densité

**56 journées complètes simulées**, huit graines par condition, pas de cinq secondes et statistiques à la minute, graphe réel. Les nombres ci-dessous portent sur les personnes logiquement en activité extérieure. Le rayon de 145 m autour d’une station publique de village est une mesure analytique de rencontres potentielles ; il ne se substitue pas aux quotas du renderer ou à la promenade native. Les périodes vides sont quantifiées à une minute.

| Journée interprétée | Population extérieure moyenne | Maximum logique | Échantillons sans activité extérieure proche | Plus longue période vide, huit graines |
| --- | ---: | ---: | ---: | ---: |
{dens}

Les JSON conservent horaires, familles, tailles de groupe, âges, activités, zones et animaux. Les poids résidentiels/forestiers et les gardes nuit/orage sont aussi testés indépendamment. **Aucune statistique démographique ou touristique locale réelle n’est revendiquée.**

## 28. Galerie de diversité

**{len(diversity['rows'])} portraits natifs**, chacun en couleur et en niveaux de gris, issus de la même bibliothèque du jeu. L’atelier utilise un sol synthétique métrique explicitement annoncé ; il ne sert pas de preuve géographique. Les silhouettes se distinguent par proportions, volumes de vêtements, coiffures et accessoires, pas seulement par leur teinte. [Atelier local](../fixtures/village-life.html) · [descripteurs](mission-22-evidence/diversity.json).

La planche est une vérification technique et un support de revue. Elle ne prouve pas une qualité humaine exceptionnelle ni le naturel de chaque animation.

## 29. Suivi prolongé d’une famille

**{family['wallSeconds']:.1f} s réelles**, **{family['nativeSeconds']:.1f} s natives**, **{family['frames']} images**. Le banc suit la position produite en temps réel par le directeur. Aucun membre n’est relocalisé, aucun itinéraire précalculé ne remplace sa décision. La caméra diagnostique et son observateur suivent le groupe ; ce n’est pas une promenade ordinaire du joueur.

La sortie atteint sa destination, fait sa pause et revient au point public d’origine. Identités conservées : **{len(family['identities'])}** ; cohésion maximale **{family['maxCohesionM']:.2f} m** ; erreur de support des racines **{family['maxGroundErrorM']:.6f} m** ; images sur collision invalide **{family['invalidFrames']}**. Le plus grand déplacement entre deux images est de **{family["maxMemberStepM"]:.2f} m** ; la trace conserve son intervalle natif pour distinguer une trajectoire continue d’un saut. Le rendu logiciel est trop lent pour certifier la fluidité perceptive des démarches. Le conteneur MediaRecorder dure **{next(r["durationSeconds"] for r in media["rows"] if r["file"]=="family-native.webm"):.1f} s** ; cet écart avec l’horloge du suivi est conservé et limite l’analyse temporelle de la captation sous charge. Aucun rééchantillonnage n’a été appliqué. Le film s’arrête à la fin cohérente de cette routine, sans exiger trente minutes de marche artificielle. Le test logique séparé couvre trente minutes de simulation.

La continuité de cette sortie ne certifie pas une journée domestique complète. [Film](mission-22-evidence/family-native.webm) · [trace](mission-22-evidence/family-trace.json.gz).

## 30. Promenade native ordinaire

**{walk['wallSeconds']:.1f} s réelles**, **{walk['nativeSeconds']:.1f} s natives**, **{walk['frames']} images**, **{walk['metres']:.1f} m**. Départ normal, véritable déplacement clavier, AutoWalk, rotation complète, changements de profil et de vue. Samedi de mai et temps clair choisis au départ. **Aucune population forcée**, aucun repositionnement réparateur, accélération de temps ou substitution d’images.

Personnes différentes représentées : **{walk['encounteredPeopleCount']}** ; images avec une représentation humaine admise **{walk['framesWithPeople']}** ; images avec animaux **{walk['framesWithAnimals']}**. Ce compteur porte sur les représentations admises à proximité, même hors champ ou occultées ; il ne certifie pas quatre rencontres effectivement remarquées à l’écran. Une scène vide demeure valide. Le JSON et la trace donnent les événements, périodes, identités, états et ressources ; les inspections déterministes séparées prouvent les fonctionnalités possibles.

Frametime logiciel natif : médiane **{walk['frameMs']['median']:.1f} ms**, P95 **{walk['frameMs']['p95']:.1f} ms**, pic **{walk['frameMs']['peak']:.1f} ms**. Les inspections de famille et certaines validations ont partagé l’environnement pendant une partie de la séance ; cette trace n’est pas le benchmark isolé de la section 26. Pas de promesse de fluidité matérielle. Sources `src/` et `public/` identiques pendant toute la séance, commit **{walk['sourceCommit']}**.

Erreurs JS **{len(walk['errors'])}**, erreurs GL **{len(walk['glErrors'])}**, candidats de présentation effacée/surexposée **{len(walk['suspects'])}**, collisions joueur invalides **{walk['invalidCollisionFrames']}**. Écart maximal au support **{walk['maxGroundErrorM']:.6f} m**. Le contexte audio est fermé à la fin : **{walk['disposedAudio']['stats']['nodes']} nœud restant**. Les clips proviennent directement du moteur, avec sa piste audio.

Après cette séance, la libération GPU est corrigée dans `dispose` et le plafond des nouvelles représentations Équilibré passe de six à quatre. Aucun modèle, shader ou comportement logique ne change. La trace ordinaire ne dépasse jamais quatre personnes en Équilibré ; ce plafond réduit ne retire donc aucune admission acceptée dans cette trace. La famille suivie reste intégralement représentable, tandis que d’autres scènes pourront admettre moins de groupes. La transformation exacte est vérifiée dans [la portée d’équivalence](mission-22-evidence/runtime-equivalence.json) et le comportement de démontage est testé séparément.

## 31. Non-régressions et preuves

**{validation['tests']} tests Node réussis**, compilation TypeScript/Vite et contrôle du véritable build compilé. Menu mobile 390 × 844, calendrier, météo, réglages et persistance locale vérifiés. La présence du directeur dans le build est contrôlée, sans interception de `main.ts` pour ce test.

**{preserve['dataFilesCompared']} fichiers de données historiques** et **{preserve['originalAudioAssets']} anciens assets audio** comparés, aucun changement de leurs octets. Le noyau de collision, les graphes, géographie, relief, ponts, architecture, végétation, rivière, éclairage, calendrier, orages, personnage principal et sources historiques sont préservés. L’intégration `main.ts`, le nouveau directeur et l’extension du freinage automobile constituent les changements explicites.

Le contrôle de présentation M21 est réutilisé après le retour complet du RAF, donc après toute adaptation de résolution. Les films sont indexés par copie des codecs ; [l’audit média](mission-22-evidence/media.json) compare paquets et timestamps de chaque flux audio/vidéo aux captures brutes, et mesure les niveaux. Les tests ne valent pas approbation perceptive. Aucun fichier LP-01 ou workflow de déploiement n’est modifié.

## 32. Limites, reproduction et décision

Les priorités restantes sont le naturel proche des corps, la réception fine des ombres sur les PNJ, la course et les gestes fins ; ancrages publics validés pour assises/pique-niques ; entrées avec vraie occlusion ; diversité zoologique et laisse ; traversées et évitement social plus riches ; emplois du temps individuels et rotation des visiteurs à longue durée ; liaison entre fenêtres et ménages fictifs ; contrôle sur GPU physique/Android. La qualité artistique et sonore revient au propriétaire. La mission ne transforme pas des tests réussis en certification d’humanité.

```sh
npm ci --cache work/npm-cache
npm test
npm run build
npm run dev -- --port 5352 --strictPort
node scripts/density-mission-22.mjs
node scripts/cpu-mission-22.mjs
node scripts/gallery-mission-22.mjs
node scripts/browser-mission-22.mjs
node scripts/follow-family-mission-22.mjs
node scripts/audio-mission-22.mjs
node scripts/soak-mission-22.mjs  # 1808 secondes réelles, sources propres
# main b8e3540 en checkout détaché, Vite sur 5351 ; aucune autre campagne GL :
node scripts/benchmark-mission-22.mjs
npm run preview -- --port 5354 --strictPort
node scripts/compiled-mission-22.mjs
node scripts/preserve-mission-22.mjs
MISSION22_REQUIRE_STABLE=1 node scripts/lifecycle-mission-22.mjs
python scripts/audit-mission-22-media.py
python scripts/report-mission-22.py
```

La galerie locale est `/endless-earth/docs/mission-22-evidence/index.html`. Les validations prolongées interrompues avant correction des reprises nocturnes ou des attentes mutuelles ne sont pas comptées comme preuves finales. Les fichiers audio proviennent exclusivement de sources licenciées et les personnages sont entièrement procéduraux.

## Tableau final

| Objectif | État | Portée / limite |
| --- | --- | --- |
| Directeur indépendant de la caméra | Atteint | Logique séparée et test reproductible sans renderer. |
| Fréquentation probabiliste et scènes vides | Atteint | Aucun quota minimal, journées et promenade ordinaires mesurées. |
| Variations horaires | Atteint | Calendrier commun, gardes familiales aux reprises. |
| Variations saisonnières et météo | Atteint | Admissions et fins de sorties adaptées, tenue conservée. |
| Toutes les catégories de lieux | Partiellement atteint | Plusieurs poids patrimoniaux/belvédères encore non annotés. |
| Diversité physique exceptionnelle | Partiellement atteint | Proportions et volumes distincts ; style et expressivité à valider. |
| Génération stable | Atteint | Graine, PRNG et identité persistants. |
| Bibliothèque vestimentaire complète | Partiellement atteint | Silhouettes saisonnières ; tissus et détails limités. |
| Toutes les animations demandées | Partiellement atteint | Marche, pauses, photo, gestes ; course/assise fines manquantes. |
| Couples | Atteint | Destination et pauses partagées, gestes simples. |
| Familles | Atteint | Plusieurs compositions, enfants proportionnés et bébé accompagné. |
| Cohésion et évitement avancés | Partiellement atteint | Bornes vérifiées, transitions et interactions sociales simples. |
| Routines autonomes finies | Atteint | Sortie, pause, retour ; repos domestique non représenté. |
| Petites scènes de vie | Partiellement atteint | Observation, photo, rencontre, chien ; activités assises absentes. |
| Entrées et sorties de maisons | Non atteint | Aucune entrée praticable validée, aucune façade traversée. |
| Bancs et pique-niques | Non atteint | Aucun ancrage public validé dans la source actuelle. |
| Faune terrestre détaillée | Partiellement atteint | Chien/chat/écureuil simples, pas de laisse ou espèces fines. |
| Cyclistes et poussettes | Partiellement atteint | Contrôles d’itinéraires et modèles simples. |
| Vie hors champ | Atteint | Position logique et routine continuent, LOD de représentation. |
| Communauté persistante | Atteint | Stockage local borné, pas de données personnelles. |
| Nouvelle vie invisible du village | Partiellement atteint | Fenêtres M21 conservées, pas de nouvelle vie derrière vitrages. |
| Ambiance sonore liée aux événements | Partiellement atteint | Pas, murmure, chien, roues ; richesse et écoute à poursuivre. |
| Cohabitation avec voitures | Partiellement atteint | Freinage, attente et repli ; traversées complètes non simulées. |
| Continuité par mauvais temps | Atteint | Aucune suppression visible ou tenue remplacée instantanément. |
| Budgets et rendu partagé | Atteint | Une passe instanciée, cap atomique et aucun nouveau shadow pass. |
| Régression médiane Équilibré < 5 % | {'Atteint' if bmedian<5 else 'Non atteint'} | {bmedian:+.1f} % dans cette campagne logicielle ; matériel non certifié. |
| Statistiques de densité | Atteint | 56 jours, données fictives explicitement séparées du réel. |
| Galerie d’au moins vingt personnes | Atteint | 28 modèles, couleur et niveaux de gris, vrai renderer. |
| Suivi d’une famille | Atteint | Routine native complète ; pas de séquence précalculée. |
| Promenade native de trente minutes | Atteint | Conditions ordinaires, sources figées, clips et trace. |
| Non-régressions mesurées | Atteint | Tests, build, données et présentation conservés dans les cas vérifiés. |
| Humanité et fluidité sur matériel | Non atteint | Revue artistique et essais physiques indispensables. |
'''
(root/'docs/mission-22.md').write_text(report)
# Standalone evidence index; screenshots and encoded native media are unchanged.
figures=''.join(f'<figure><img class="color" loading="lazy" src="gallery/person-{i}.png" alt="Personnage {i+1}"><img class="gray" loading="lazy" src="gallery/person-{i}-gray.png" alt="Silhouette sans couleurs {i+1}"><figcaption>{i+1:02d} · {html.escape(r["person"]["age"])} · {r["person"]["height"]:.2f} m · {html.escape(r["outfit"]["style"])}</figcaption></figure>' for i,r in enumerate(diversity['rows']))
clips=[('Une famille, de son départ à son retour','family-native.webm')]+[(r['title'],r['file']) for r in audio['rows']]+[(f'Promenade ordinaire — {label}',f'walk-{name}.webm') for name,label in [('opening','début'),('middle','milieu'),('closing','fin')] if (out/f'walk-{name}.webm').exists()]
videos=''.join(f'<article><h3>{html.escape(title)}</h3><video controls preload="metadata" src="{file}"></video><p><a href="{file}">Ouvrir la captation native</a></p></article>' for title,file in clips)
page='''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Les vies silencieuses — preuves Mission 22</title><style>:root{color-scheme:light;background:#eeefe7;color:#2a3d32;font:16px/1.65 system-ui}body{margin:0}main{max-width:1200px;margin:auto;padding:32px 24px 80px}h1{font:500 clamp(30px,5vw,58px)/1.15 Georgia,serif;max-width:850px}h2{font:400 30px Georgia,serif;margin-top:48px}p{max-width:850px}a{color:#426959}header{border-bottom:1px solid #b8c4b7;padding-bottom:22px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}figure{margin:0;background:#e1e5d9;border-radius:12px;overflow:hidden}img{width:100%;display:block}figcaption{padding:10px;font-size:13px}.gray{display:none}#gray:checked~.grid .gray{display:block}#gray:checked~.grid .color{display:none}article{background:#e1e5d9;border-radius:12px;padding:20px;margin:18px 0}video{width:100%;max-height:600px;background:#172c24}.links{display:flex;flex-wrap:wrap;gap:16px}.notice{padding:18px 22px;border-left:4px solid #94a589;background:#e1e5d9}</style><main><header><p>ENDLESS EARTH · MISSION 22 · REVUE EN BROUILLON</p><h1>Les vies silencieuses<br>d’Angles-sur-l’Anglin</h1><p>Une communauté fictive, des chemins vérifiés et la place laissée au calme.</p><nav class="links"><a href="../mission-22.md">Rapport complet</a><a href="performance.json">Mesures</a><a href="density.json">56 journées</a><a href="walk.json">Promenade native</a><a href="family.json">Famille</a><a href="validation.json">Validation</a><a href="media.json">Intégrité média</a></nav></header><p class="notice">Les images sont rendues par le véritable code du jeu. Les portraits utilisent un atelier métrique synthétique, sans attribution géographique. Les scènes de famille et les prises sonores sont des inspections déclarées. La promenade ordinaire conserve ses admissions probabilistes. Ces preuves techniques ne remplacent pas le jugement artistique.</p><h2>Vingt-huit silhouettes</h2><p>Les proportions des enfants, les volumes de vêtements, les coiffures et les accessoires restent visibles sans leur palette.</p><input type="checkbox" id="gray"><label for="gray"> Comparer sans couleurs</label><div class="grid">'''+figures+'''</div><h2>Films natifs et sons du moteur</h2><p>Audio capturé après le limiteur du véritable AudioContext. Aucun ajout de bande-son après capture. Les conteneurs sont indexés sans réencoder les flux.</p>'''+videos+'''<p>Modèles stylisés et activités fines incomplètes ; aucune entrée de maison, assise ou aire de pique-nique n’est inventée. Aucun déploiement du jeu.</p></main></html>'''
(out/'index.html').write_text(page)
print('Wrote report and native evidence index')
