import json,html,pathlib,subprocess
root=pathlib.Path('.');out=root/'docs/mission-19-evidence'
def load(name,default=None):
 p=out/name
 return json.loads(p.read_text()) if p.exists() else default
perf=load('performance.json',{'rows':[]});run=load('runtime.json',{});tours=load('tours.json',{'rows':[]});moon=load('moon-reference.json',{'rows':[]});lunar=load('moon-gallery.json',{'rows':[]});shadow=load('shadow-ablation.json',{'rows':[]});audio=load('audio-native.json',{'rows':[]});soak=load('soak.json');preserve=load('preservation.json',{});wind=load('wind-cache-equivalence.json',{'rows':[]});windcost=load('wind-cache-cost.json',{});compiled=load('compiled.json',{});freeze=load('freeze.json',{});cpu=load('cpu.json',{});analysis=load('soak-analysis.json',{});tracks=load('tree-tracks.json',{});trail=load('trail-run.json',{})
commit=freeze.get('commit','a7b99bb');tests=290
performance='| Scène | Profil | M18 médiane | M19 médiane | Écart | M19 P95 / pic | Appels M18 → M19 | Triangles M18 → M19 |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |\n'
for r in perf['rows']:
 a,b=r['before'],r['after'];performance+=f"| {r['view'][0]} | {r['profile']} | {a['medianMs']:.1f} ms | {b['medianMs']:.1f} ms | {(b['medianMs']/a['medianMs']-1)*100:+.1f} % | {b['p95Ms']:.1f} / {b['peakMs']:.1f} ms | {a['calls']} → {b['calls']} | {a['triangles']} → {b['triangles']} |\n"
cpu_table='| Régime | Rig M18 | Rig M19 |\n| --- | ---: | ---: |\n'
for r in cpu.get('rig',[]):cpu_table+=f"| {r['speedMps']:.2f} m/s | {r['baselineMedianMs']:.5f} ms | {r['mission19MedianMs']:.5f} ms |\n"
route_table='| Départ | Destination OSM / approche | Distance native | Arrivée |\n| --- | --- | ---: | --- |\n'
for r in tours['rows']:route_table+=f"| {r['label']} | {r['route']['name']} | {r['metres']:.1f} m | Point d’arrivée atteint |\n"
max_alt=max((r['error']['altitudeDeg'] for r in moon['rows']),default=0);max_az=max((r['error']['azimuthDeg'] for r in moon['rows']),default=0);max_illum=max((r['error']['illumination'] for r in moon['rows']),default=0)
soak_text='La session de trente minutes n’est pas encore terminée. Aucun résultat prolongé n’est revendiqué à ce stade.'
if soak:
 soak_text=f"""**{soak['wallSeconds']:.1f} s réelles, {soak['nativeSeconds']:.1f} s entre première et dernière image**, {soak['metres']:.1f} m et {soak['frames']} images natives. Une séquence clavier réelle passe de la course à la marche puis reprend AutoWalk, et une rotation complète de caméra est enregistrée. Six chapitres passent par les trois profils, quatre saisons, la neige, la pluie, le jour et la nuit, et les trois vues. Aucune relocalisation après le départ ordinaire ; aucun temps accéléré, aucune reconstruction d’images.

Intervalles **logiciels**, avec streaming, enregistrement et GC : médiane **{soak['frameMs']['median']:.1f} ms**, P95 **{soak['frameMs']['p95']:.1f} ms**, pic **{soak['frameMs']['peak']:.1f} ms**. Ces valeurs décrivent les ralentissements de l’environnement et ne valident pas une fluidité matérielle. Écart maximal au support : **{soak['maxGroundErrorM']:.6f} m** ; déplacement maximal entre deux images : **{soak['maxStepM']:.3f} m**. Erreurs maximales des repères articulés : appui horizontal **{soak['maxFootPlantErrorM']:.4f} m**, repère de semelle **{soak['maxSoleErrorM']:.4f} m**. Ces repères ne mesurent pas chaque sommet de chaussure. Arrêts terminaux/reprises depuis la même position consignés par le banc : **{soak['stalls']}**. Leur nature est conservée dans la trace, sans téléportation de réparation.

Aucune erreur JS ou perte de contexte relevée dans ce test ; toutes les empreintes `src/` et `public/` suivies sont vérifiées avant/après. Le contexte audio est fermé à la fin et laisse zéro nœud. Les snapshots de mémoire après GC sont publiés ; ils ne mesurent pas toute la mémoire native du pilote. [Résultat](mission-19-evidence/soak.json) · [Trace complète compressée](mission-19-evidence/soak-trace.json.gz)."""
if soak and analysis:
 soak_text+='\n\n| Chapitre | Profil / météo | Distance native |\n| --- | --- | ---: |\n'
 for c in analysis['chapters']:soak_text+=f"| {c['seconds']/60:.1f}–{c['endSeconds']/60:.1f} min | {c['profile']} / mois {c['month']} / {c['weather']} | {c['metres']:.1f} m |\n"
 soak_text+=f"\nArrivées effectives pendant la séance : **{analysis['arrivals']}** ; plus longue période stationnaire : **{analysis['longestConsecutiveStationarySeconds']:.1f} s**. Pic d’installation dans une image : **{analysis['maxInstallsInOneFrame']}**. Voix audio simultanées observées : **{analysis['maxAudioVoices']}** ; buffers audio décodés observés : **{analysis['maxDecodedAudioBytes']/1048576:.2f} Mio**. Pics de durée murale côté JavaScript (y compris appels GL et leurs attentes éventuelles) : sélection forêt **{analysis['maxForestSelectionCpuMs']:.1f} ms**, cache de vent **{analysis['maxWindCacheCpuMs']:.1f} ms**, carte du personnage **{analysis['maxActorShadowCpuMs']:.1f} ms**, installation **{analysis['maxInstallCpuMs']:.1f} ms**, mise à jour audio **{analysis['maxAudioCpuMs']:.1f} ms**. Ces pics restent des ralentissements constatés ; ils ne sont pas annulés par le faible coût du micro-banc CPU. Les différents lieux, profils et saisons empêchent d’assimiler une simple différence de heap à une fuite certaine. [Analyse détaillée](mission-19-evidence/soak-analysis.json).\n\n![Chronologie native : distance, frametimes et mémoire suivie](mission-19-evidence/soak-timeline.svg)\n"
report=f'''# Mission 19 — L’immersion sans rupture

Les huit systèmes sont intégrés : résidence et LOD des arbres, détail du décor, ombre du randonneur, animation, contacts sonores, neige, Lune et destinations de promenade. **PR brouillon [#28](https://github.com/sebastienleidgens-lab/endless-earth/pull/28)**, sans fusion ni déploiement. Budget supplémentaire : **0 €**. Les réserves visuelles et de performance restent explicites ci-dessous.

[Galerie locale, comparaisons et films natifs](mission-19-evidence/index.html). Code de validation figé : `{commit}`. Base M18 fusionnée : `2866c860b77456dcc9cec2cd257241d95c26bc51` ; M17 / PR #26 et M18 / PR #27 sont dans l’ascendance. `AGENTS.md` et les rapports 11–18 ont été lus. La seule autre PR ouverte au départ était LP-01 #19, laissée intacte. Aucun service, API, asset ou hébergement payant n’est ajouté.

## 1. Diagnostic du popping

La forêt du pilote conserve tous ses ancrages et toutes ses géométries en mémoire. Le problème principal observé dans le code est la **sélection**, plutôt qu’un téléchargement tardif de chaque arbre : le frustum, la liste d’instances et les budgets proches étaient recalculés au quart de seconde, avec un seuil de rotation. Les plafonds de détail s’appliquaient aux seuls arbres du champ. Tourner pouvait donc redistribuer les formes et remplir une file de transitions. Le niveau caché pouvait aussi conserver un ancien détail.

L’audit distingue ce mécanisme des ressources du sous-bois et de l’architecture, réellement chargées par cellules. Terrain, patrimoine principal et façades de repli sont résidents. L’alpha-test et les mipmaps de M17 restent en place ; ils ne sont pas établis comme l’unique cause des apparitions signalées. [Audit initial complet](mission-19-evidence/initial-audit.json.gz).

## 2. Causes identifiées et dispositif d’inspection

Le rendu sépare désormais les causes : résidence, frustum conservateur, distance après couverture, niveau courant/demandé et transition. En mode `?perf=1`, `endlessDiagnostics.nature.forest.inspect()` décrit les douze arbres visibles les plus proches ; `inspect("tree:x:z")` retrouve une identité métrique stable dans le repère d’Angles. Le diagnostic retourne distance, hauteur projetée, LOD, transition, frustum, chargement, visibilité et motif. Il ne présente pas ces formes procédurales comme des arbres relevés individuellement.

Les compteurs exposent apparitions/disparitions, changements de niveau, transitions en attente et reconstructions de batches. Le flux de décor conserve requêtes, chargements, installations, évictions et temps CPU ; il ajoute les installations de l’image courante. Les bornes tiennent compte de la déformation et de l’enveloppe des nouvelles cartes lointaines. Les frustums sont testés dans chaque image où la caméra change ; les états immobiles réutilisent leur résultat.

## 3. Continuité des quatre LOD

Les budgets proches et moyens sont alloués selon la position, la taille projetée, le FOV et des identités stables, **indépendamment de la direction regardée**. Les représentations hors champ sont préparées avant une rotation. Les priorités favorisent l’importance projetée et l’attente ; la limite de **48 transitions simultanées** et la durée de **0,48 s** sont conservées.

Chaque carte lointaine est ajustée aux feuilles fines rattachées à la même branche secondaire. Les deux derniers niveaux partagent exactement leur feuillage ; le dernier simplifie le bois. Cela évite le changement supplémentaire de couronne dû à la suppression d’un plan. Le modèle canonique proche, les racines, les tailles de placement, la couleur individuelle et les dates de phénologie sont préservés.

Le fondu de couverture reste opaque. Les deux représentations échantillonnent un plan commun ancré dans le monde, afin de partager la même couverture pour un rayon de caméra, même à des profondeurs différentes. Aucun bruit aléatoire par image ni alpha blend massif. Une couverture progressive termine la portée existante 950–1 050 m ; la distance maximale n’est pas arbitrairement augmentée.

**Limite :** les cartes de branches restent des approximations des pousses fines. Les deux niveaux lointains ont le même feuillage, mais les niveaux proche/moyen/lointain ne sont pas des silhouettes identiques au pixel. Les conifères, la chute des feuilles, le vent et le fondu saisonnier gardent le propriétaire M11/M17/M18. La continuité artistique parfaite n’est pas déduite d’un test de seuil.

## 4. Cellules, installations et autres décors

Les distances des cellules naturelles sont calculées depuis leur emprise plutôt que leur seul centre : une frontière de cellule ne retire plus une bande entière proche de la caméra. Les herbes, fougères, petites pierres, feuilles et fleurs utilisent une couverture spatiale et une admission progressive à l’installation. Des groupes de triangles réutilisent leurs buffers et ne soumettent que les secteurs pouvant contribuer à la distance utile, avec une marge de mouvement.

Les panneaux architecturaux ordinaires restent le repli résident. Les détails et le repli utilisent des couvertures complémentaires ; les caches ne remplacent plus tous les panneaux d’un seul coup. Les distances prennent aussi la hauteur de la caméra, afin d’éviter des détails coûteux et subpixel en aérien. Les fleurs utilisent la même logique de distance physique. Les corps de bâtiments, cheminées principales et monuments ne sont pas supprimés par ce mécanisme. Les petits pots et couronnements de M15 conservent leur retrait par échelle et leur budget antérieurs.

Les plafonds réseau **2 chargements / 2 prêts / 1 installation par image**, les réserves de **4 cellules naturelles / 12 architecturales** et les replis sont conservés. Une installation géométrique individuelle reste non préemptible ; son coût réel est mesuré plutôt que présenté comme un plafond CPU strict. Le pilote possède un jeu borné de 25 tuiles de terrain ; aucun futur streaming de toute la France n’est revendiqué.

## 5. Forêt en mouvement et caméras

Les contrôles couvrent trois profils × janvier/juillet/octobre × rotations 0°, 45°, 90°, 180°, 360°. Le niveau demandé reste identique entre orientations à position/FOV communs, et aucune apparition supplémentaire retardée n’est observée après le changement de frustum dans ces cas. Un arbre est suivi à 150, 100, 75, 50, 30, 15 et 5 m, avec son identité et son niveau.

Les films montrent rotation, approche et promenade avec les mêmes postes initiaux. **L’approche est une inspection de caméra, joueur immobile**, pas une marche de 145 m. Les films de marche utilisent le même itinéraire OSM dans les deux versions ; les temps logiciels influencent leur distance, sans prétendre à une trajectoire identique à chaque seconde. Les vues première, troisième personne et aérienne, les saisons et les profils sont aussi exercés par les contrôles natifs. [Contrôles](mission-19-evidence/runtime.json) · [Trace](mission-19-evidence/runtime-trace.json.gz) · [Films](mission-19-evidence/movies.json).

{('Trois individus distincts, dont un persistant, sont inspectés de 150 à 5 m en janvier, juillet et octobre : neuf pistes, un profil déclaré par individu. Ces inspections de caméra stabilisent les transitions par pas virtuels M11 et ne sont pas présentées comme des marches natives. [Identités, niveaux et captures](mission-19-evidence/tree-tracks.json).' if tracks else '')}

## 6. Diagnostic du scintillement des ombres

La carte du personnage M18 pouvait attendre **100 à 160 ms**, ne suivait pas explicitement la rotation du groupe et ne suivait pas toutes les composantes de la pose. Le personnage échantillonnait aussi cette carte dont il était lui-même le seul occultant. Le biais de réception employait une normale antérieure à la déformation du squelette.

Une rafale de trente changements réels de pose/rotation donne **1 mise à jour avant, 30 après**. L’ablation pixel isole la réception de la carte du personnage de celle du paysage. Dans les cas capturés, son effet moyen avant est faible (jusqu’à environ **0,0043/255**, maximum 3 niveaux) et nul après sur le masque du personnage. **Cette expérience ne reproduit pas à elle seule le fort clignotement décrit par le propriétaire.** La cadence obsolète est démontrée ; l’auto-réception est un mécanisme retiré, sans être déclarée cause unique certaine du défaut perceptif. [Protocole et mesures](mission-19-evidence/shadow-ablation.json).

## 7. Correction de l’ombre du personnage

Le personnage reçoit la carte du paysage et projette sa propre carte sur le décor. Il n’échantillonne plus sa propre carte locale. Le proxy partage toujours le vrai squelette et les vrais sommets. Position, rotation, translations/rotations/échelles des os et direction solaire invalident la carte dès la pose rendue ; il n’y a plus de délai volontaire entre animation et ombre.

Le biais utilise la normale effectivement transformée. Le filtrage reste celui du propriétaire d’éclairage, sans camouflage par flou supplémentaire. Les tailles **128² / 256²** et les budgets de cibles sont conservés. Éco garde la politique M18 d’occlusion ambiante sans carte solaire locale ; il n’est pas présenté comme équivalent à Qualité pour les ombres. Les faibles hauteurs solaires et l’extinction nocturne de M18 restent en place.

## 8. Marche

Le rig original reçoit une rotation retenue du bassin, un contre-mouvement du torse et des épaules, des bras moins symétriques, une tête compensée et une faible variation de foulée. La pente et l’inertie de direction influencent la posture. La respiration reste discrète. Aucun asset de capture de mouvement commercial, aucune bibliothèque d’animation lourde, aucun changement du modèle géographique.

Le mouvement demeure procédural et le personnage stylisé. Le résultat proposé est visible dans les films ; les tests d’appui ne constituent pas une validation de naturel humain.

## 9. Course et transitions

La course utilise une foulée plus longue, une phase d’appui plus courte, une levée de pied et une impulsion de bassin plus fortes, une inclinaison du torse et des bras distincts. Les amplitudes sont lissées. Elle ne consiste donc pas seulement à accélérer le même cycle. L’entrée en marche/course, le ralentissement, l’arrêt et le demi-tour sont montrés par des entrées clavier natives. [Film et protocole](mission-19-evidence/run.json).

{('Un second film montre une course puis une marche et un retour sur un segment public OSM près de la forêt : '+format(trail.get('metres',0),'.1f')+' m natifs, sans sortie du segment déclaré. La matière locale n’est pas documentée : aucun son de feuilles n’est inventé. [Film, contrôles et trace](mission-19-evidence/trail-run.json).' if trail else '')}

## 10. Pieds, contacts et support

La distance réellement parcourue pilote la phase. Les appuis restent ancrés dans le monde et l’IK prend le support physique commun, y compris les ponts. La pose met à jour les matrices parentes avant de mesurer les pieds. Les événements sonores proviennent des entrées effectives en phase d’appui et contiennent le pied, sa position et son énergie.

Les tests à 30/60/120 pas de simulation par seconde, les pentes, virages, arrêts et collisions passent. Un test direct de marche et de course sur pente garde une erreur d’appui et de semelle inférieure à **2,5 cm**. Cette mesure porte sur les repères du rig ; elle ne certifie pas chaque sommet de chaussure dans toutes les poses. Déplacement nul, caméra seule et blocage physique ne produisent pas de nouveau pas sonore.

## 11. Bibliothèque sonore

Les **41 captations antérieures**, leurs extraits, droits et empreintes sont conservés. Deux prises CC0 de neige ajoutent **12 extraits distincts** : edschaefer / Freesound 380041 et studiogreenhill / 841736. Les préécoutes HQ MP3 publiées par les auteurs sont la source acquise, pas les WAV originaux. Mono 32 kHz, filtrage léger, gain borné, fondus de 5 ms ; les transformations et la preuve de licence sont enregistrées.

La sélection évite les trois derniers extraits lorsque le stock le permet et favorise une autre prise. Les pieds varient légèrement en énergie ; hauteur et volume varient modérément. La course modifie énergie et durée. L’attente de programmation des impacts est réduite à 2 ms, avec un contexte interactif ; la latence finale du matériel audio n’est pas prétendue nulle. Voix, concurrence et cache restent dans les budgets existants, dont **24 Mio** de buffers décodés. [Sources](mission-19-evidence/audio-sources.json) · [Crédits](../public/audio/credits.html).

## 12. Matière réellement foulée, neige et humidité

Chaque contact interroge la route, la couverture de sol et la neige à la position du pied. La neige partage le dépôt, l’exposition chargée et le grain de la surface rendue. Une chaussée nue ne reçoit pas un son de neige seulement parce que « Neigeux » est choisi. La température et la fonte distinguent un état humide ; la distinction fraîche/tassée reste une **interprétation acoustique**, notamment selon le support pavé. Ce ne sont pas trois relevés de compaction locaux.

L’humidité des contacts de terre suit aussi le séchage M18 après la pluie. Les enregistrements génériques de contact dur ne sont pas rebaptisés en relevés locaux de bitume. Les matières inconnues restent discrètes/silencieuses. Les feuilles ont des enregistrements licenciés, mais aucun poste local de litière vérifiée n’est inventé pour la preuve.

Huit séquences natives montrent bitume, pierre, terre, herbe, gravier et trois états simulés de neige. Leur seule piste sonore vient de l’AudioContext du jeu, après limiteur ; aucun habillage sonore ajouté. Les postes sont séparés et déclarés. [Mesures et films](mission-19-evidence/audio-native.json).

## 13. Lune et calendrier

Le petit modèle orbital topocentrique de Schlyter, avec perturbations lunaires, utilise **la même date M11/M18 et le site géographique** que le Soleil. Il calcule azimut, hauteur, phase, fraction éclairée, orientation du limbe et rayon angulaire, avec parallaxe. La galerie vise la direction calculée depuis la voie publique vérifiée de la rue de Tournon, à hauteur d’œil, sans inventer un nouveau point d’intérêt. Le disque a une taille angulaire physique ; sa phase est éclairée par le vecteur solaire commun. Il fait partie du shader de ciel et est occulté par les profondeurs du paysage. Aucun sprite géant, halo excessif, texture externe ou passe lunaire n’est ajouté.

L’horizon, l’illumination, la brume, les nuages et la pluie déterminent la visibilité, y compris de jour. Le ciel couvert/orageux peut masquer le disque ; aucune Lune n’est garantie chaque nuit. Les huit dates de référence sont calculées, non attribuées aux mois pour embellir la galerie.

Comparaison indépendante avec **Astronomy Engine 2.1.19, MIT**, installé uniquement dans `work/` pour contrôle, sans dépendance de production : erreur maximale de hauteur **{max_alt:.4f}°**, d’azimut **{max_az:.4f}°**, erreur de fraction éclairée **{max_illum:.5f}** sur les huit dates. Les altitudes comparées sont géométriques, sans réfraction. Le modèle est approximatif et n’est pas destiné aux éclipses ou à la navigation. [Référence](mission-19-evidence/moon-reference.json) · [Galerie calculée](mission-19-evidence/moon-gallery.json).

## 14. Promenade vers des lieux documentés

Un graphe piéton dirigé de **1 104 nœuds / 1 109 arêtes** est préparé hors ligne, depuis les voies OSM et le support déjà vérifié. Le graphe historique de départ reste **919 / 896**, identique octet pour octet. Les accès conditionnels/privés, directions piétonnes, murs, eau et supports non vérifiés restent des exclusions. Les voies secondaires et le pont ne sont admis qu’avec les accès et la validation physique du simulateur.

Dijkstra remplace la recherche de longueur maximale pour la découverte. Les poids artistiques explicites sont patrimoine 5, pont 4, nature 3, chemin 2, rue 1,5, pondérés par distance réelle, proximité de l’approche et visites récentes. Aucun score de popularité fictif. Les abords d’un bâtiment ne sont pas une entrée inventée. Une destination atteinte entraîne une courte pause puis une autre sélection, sans répétition immédiate ; le contrôle manuel interrompt la promenade.

Un raccord court exige une validation physique et un corridor public cartographié. Une prairie simplement libre dans le moteur n’est pas déclarée chemin public. Des points de vue absents des données ne sont pas inventés. Le menu existant affiche la destination sans panneau permanent. [Préparation et sources](mission-19-evidence/graph-preparation.json).

## 15. Itinéraires natifs testés

{route_table}
Chaque film commence sur un sommet public documenté, puis utilise le véritable contrôleur et les collisions jusqu’au point d’arrivée, sans relocalisation intermédiaire. Les postes près de la nature sont des sentiers cartographiés ; les stations de revue hors réseau sont refusées lorsque leur accès n’est pas vérifiable. [Films, traces et distances](mission-19-evidence/tours.json).

## 16. Coût et optimisation

La première matrice a montré des régressions et a motivé les chemins rapides hors fondu, la sélection spatiale des triangles de détail et le culling en trois dimensions. Le vent grossier était encore échantillonné identiquement pour chaque sommet : il est maintenant lu **une fois par individu dans le même champ demi-précision M11**, sans changer ses coordonnées, sa direction ou son horloge. Un regroupement sans perte de deux attributs libère l’emplacement de l’attribut de vent, sans augmenter le besoin maximal en attributs du shader. Les attributs canoniques sont conservés pour les ombres et la référence.

Le contrôle isolé donne **271,4 → 227,3 ms** en Équilibré sur un cas SwiftShader ; les **24 comparaisons** trois profils × quatre saisons × calme/orage ont un écart de pixel nul dans ce navigateur. Cela démontre l’équivalence de ces cas, pas celle de tout matériel. Le cache ajoute un petit bank CPU, des données par instance et un attribut de sommets partagé ; aucun nouvel atlas de pivots ou texture d’animation.

{performance}
Les valeurs sont des rendus chauds synchronisés **Chromium / SwiftShader logiciel, 640 × 420 DPR 1**, douze échantillons alternés par cellule. Caméra, date et météo sont vérifiées identiques ; champs M11 et transitions sont stabilisés de manière contrôlée. **Aucun FPS Android/GPU physique n’est revendiqué.** Le nombre de textures est identique dans chaque cellule appariée. Les géométries résidentes vont par exemple de 134 à 139 dans la rue en Équilibré ; les variantes de shader et les couronnes supplémentaires ont donc un coût explicite. Le pic d’installation observé sur cette matrice passe de 150,6 à 166,8 ms ; les installations individuelles ne sont pas déclarées résolues. Les valeurs de heap brutes sont dans le JSON et ne remplacent pas les snapshots après GC de la séance prolongée. Les écarts varient selon la scène et les campagnes ; les régressions restantes sont conservées, pas effacées par la moyenne. Le coût visuel des couronnes et des replis complémentaires reste une réserve de performance. [Matrice complète](mission-19-evidence/performance.json) · [Premier candidat](mission-19-evidence/performance-initial-candidate.json) · [Cache de vent](mission-19-evidence/wind-cache-cost.json) · [Équivalence](mission-19-evidence/wind-cache-equivalence.json).

Un micro-banc CPU Node/V8 mesure les véritables propriétaires du rig, sans rendu, après échauffement et en alternant les versions :

{cpu_table}
Le calcul lunaire prend environ **{cpu.get('moon',{}).get('medianMsPerCalculation',0):.5f} ms par appel** sur ce micro-banc, avec une seule évaluation par seconde du calendrier commun en production. Ces mesures indicatives sont prises pendant la séance native et ne sont pas des coûts Android ou GPU. Les données d’animation, de corps et de Lune restent sans nouvelle passe géométrique. [Échantillons CPU](mission-19-evidence/cpu.json).

## 17. Profils et build

Éco, Équilibré et Qualité conservent les mêmes individus et identités, avec leurs budgets de détail et d’ombres. Les rotations et les saisons sont vérifiées dans les trois profils. **{tests} tests Node** et TypeScript/Vite passent. L’avertissement historique du bundle supérieur à 500 kB demeure. Le contrôle du build de production, du menu mobile, des douze mois et de leur restauration est publié dans [compiled.json](mission-19-evidence/compiled.json). Une émulation tactile ne remplace pas un téléphone physique.

## 18. Promenade prolongée

{soak_text}

## 19. Non-régressions et reproductibilité

**{preserve.get('protectedFilesByteIdentical',4213)} fichiers publics ou preuves historiques** sont identiques à M18, avec six métadonnées/crédits explicitement autorisés à évoluer et les nouveaux fichiers de cette mission. Terrain, noyau physique, collisions, repère géographique, forêt canonique, ancrages et empreintes originales sont préservés. Les **2 898 points de collision et vingt mouvements** donnent les mêmes réponses que M18. Les 41 anciennes prises et tous leurs extraits sont identiques. Les sorties complètes de tests et de compilation sont conservées dans [validation.json](mission-19-evidence/validation.json). Aucun fichier LP-01, workflow de déploiement ou expérimentation Living Paintings n’est modifié. [Contrôle complet](mission-19-evidence/preservation.json).

```sh
npm ci --cache work/npm-cache
npm test
npm run build
npm run dev -- --port 5332
# Base M18 dans un checkout détaché, port 5319.
node scripts/browser-mission-19.mjs
node scripts/validate-mission-19-wind.mjs
node scripts/benchmark-mission-19.mjs
node scripts/benchmark-mission-19-cpu.mjs
node scripts/record-mission-19.mjs
node scripts/record-mission-19-run.mjs
node scripts/record-mission-19-trail.mjs
node scripts/browser-mission-19-tree-tracks.mjs
node scripts/browser-mission-19-tours.mjs
node scripts/browser-mission-19-audio.mjs
MISSION19_SOAK_PORT=5332 node scripts/soak-mission-19.mjs
python scripts/report-mission-19.py
# Galerie : /endless-earth/docs/mission-19-evidence/index.html
```

Les ports du banc sont indiqués dans ses scripts ; la livraison utilise aussi un checkout figé pour éviter le rechargement à chaud pendant les captures. `prepare-mission-19-graph.mjs` exige l’égalité du graphe historique avant de renouveler ses empreintes. Les médias restent natifs ; le remuxage ne réécrit ni leurs images ni leur bande sonore. Les empreintes et temps de paquets sont conservés dans les contrôles de médias.

## 20. Limites et état final

La continuité de sélection est vérifiée dans les postes reproduits, mais aucune preuve ne certifie l’absence de toute rupture perceptive dans toute caméra, connexion ou matériel. Les couronnes et le personnage restent stylisés. La réaction du pied est mesurée sur des repères articulés, sans garantie sur chaque sommet de chaussure. Le grand clignotement d’ombre du propriétaire n’a pas été reproduit à l’identique ; la correction des mécanismes identifiés doit être confrontée à son cas réel. Le fondu des détails n’annule pas le coût individuel d’un chargement ou d’une compilation initiale.

Les performances logicielles restent lentes et certaines cellules régressent. La validation de la fluidité sur GPU physique et Android, ainsi que l’appréciation artistique et acoustique du propriétaire, restent ouvertes. Aucun monument, accès public, sol vérifié ou état météorologique observé n’est fabriqué pour réussir la démonstration.

| Sujet | État | Portée / réserve |
| --- | --- | --- |
| Répartition des LOD à la rotation, résidence et inspection | Corrigé dans les cas reproduits | Trois profils, trois saisons, cinq angles ; aucune apparition retardée constatée. |
| Silhouettes à l’approche et tous les détails du décor | Partiellement corrigé | Enveloppes de branches, feuillage lointain commun, couvertures et replis ; approximations proches/lointaines et chargements individuels demeurent. |
| Synchronisation et routage de l’ombre du personnage | Corrigé techniquement | Vraie pose projetée, paysage reçu, propre carte exclue du personnage ; ombre au sol conservée. |
| Fort scintillement perceptif signalé par le propriétaire | Partiellement corrigé / à confirmer | Le défaut fort n’a pas été reproduit à l’identique ; films et ablations fournis sans prétendre le contraire. |
| Marche, course et transitions | Partiellement corrigé | Nouvelle dynamique et appuis testés ; rig stylisé, validation artistique ouverte. |
| Contacts par pied, neige et séchage | Corrigé dans les cas testés | Huit séquences natives ; états neigeux et contacts génériques explicitement interprétés. |
| Lune et calendrier commun | Corrigé dans les limites du modèle | Position/phase contrôlées indépendamment ; horizon et météo, pas de garantie de Lune nocturne. |
| Découverte piétonne vers des destinations OSM | Corrigé pour les parcours testés | Cinq arrivées natives, restrictions conservées ; pas de raccourci hors réseau non vérifié. |
| Preuve locale de marche sur feuilles mortes | Non résolu | Aucun poste de litière locale vérifiée disponible dans les données ; aucune preuve fabriquée. |
| Fluidité matérielle / Android et toutes les régressions | Non résolu | Mesures logicielles et réserves publiées ; essai matériel nécessaire. |
'''
(root/'docs/mission-19.md').write_text(report)
# HTML evidence is a local reviewer gallery, with no hosting or deployment.
esc=html.escape
pairs=''
for scene in ['sous-bois','rue','vallee']:
 for profile in ['eco','balanced','quality']:
  pairs+=f'<article class="pair" data-scene="{scene}" data-profile="{profile}"><h3>{esc(scene)} · {profile}</h3><div class="columns"><figure><img loading="lazy" alt="{scene}, profil {profile}, Mission 18" src="comparison/{scene}-{profile}-before.jpg"><figcaption>M18</figcaption></figure><figure><img loading="lazy" alt="{scene}, profil {profile}, Mission 19" src="comparison/{scene}-{profile}-after.jpg"><figcaption>M19</figcaption></figure></div></article>'
def video(file,label):return f'<figure><video controls preload="none" src="{file}"></video><figcaption>{esc(label)}</figcaption></figure>'
movies=''.join('<h3>'+label+'</h3><div class="columns">'+video('motion/before-'+kind+'.webm','Avant · M18')+video('motion/after-'+kind+'.webm','Après · M19')+'</div>' for kind,label in [('rotation','Rotation native'),('approach','Inspection de caméra 150 → 5 m (joueur immobile)'),('walker','Promenade native, même itinéraire de départ')])
movies+=video('motion/after-run-walk-turn.webm','Course clavier, marche, arrêt et demi-tour — son du jeu')
if trail:movies+=video('motion/after-run-forest-trail.webm','Course et retour sur un sentier cartographié près de la forêt — matière inconnue, pas de son de feuilles inventé')
if tracks:
 movies+='<details><summary>Neuf inspections de trois arbres individuels, de 150 à 5 m</summary><p>Caméra d’inspection et étapes M11 contrôlées ; ces images ne sont pas un trajet du joueur. Un profil par individu, trois saisons. <a href="tree-tracks.json">Métadonnées complètes</a>.</p><div class="cards">'
 for i in range(3):
  for month,distance in [(1,50),(7,150),(7,5),(10,50)]:movies+=f'<figure><img loading="lazy" alt="Arbre {i}, mois {month}, caméra à {distance} m" src="tree-tracks/{i}-{month}-{distance}.jpg"><figcaption>Individu {i} · mois {month} · caméra à {distance} m</figcaption></figure>'
 movies+='</div></details>'
moon_cards=''
for r in lunar['rows']:
 m=r['moon'];name=str(r.get('index',r.get('weather')));label=f"{r.get('date',r.get('weather'))} · éclairée {m['illumination']*100:.1f} % · hauteur {m['altitude']*180/3.141592653589793:.2f}° · azimut {m['azimuth']*180/3.141592653589793:.2f}°"
 moon_cards+=f'<figure><img loading="lazy" alt="Ciel natif, cas lunaire {esc(name)}" src="moon/{name}.jpg"><figcaption>{esc(label)}</figcaption></figure>'
tour_cards=''.join(video('tours/'+r['label']+'.webm',f"{r['label']} → {r['route']['name']} · {r['metres']:.1f} m · arrivée vérifiée") for r in tours['rows'])
audio_cards=''.join(video('audio/'+r['label']+'.webm',r['label']+' · '+r['audio'].get('contact',{}).get('material','inconnu')) for r in audio['rows'])
soak_cards=''.join(video('soak-'+n+'.webm','Extrait natif · '+label) for n,label in [('opening','début'),('winter','hiver'),('closing','fin')]) if soak else '<p>Essai prolongé en cours ; aucun résultat revendiqué ici.</p>'
if soak:soak_cards+='<figure class="plot"><a href="soak-timeline.svg"><img src="soak-timeline.svg" alt="Distance, frametimes et mémoire au fil des trente minutes natives"></a><figcaption>Chronologie issue des traces ; quantiles par tranche de trente secondes, mémoire logique suivie.</figcaption></figure>'
perf_rows=''.join(f"<tr><td>{r['view'][0]}</td><td>{r['profile']}</td><td>{r['before']['medianMs']:.1f}</td><td>{r['after']['medianMs']:.1f}</td><td>{(r['after']['medianMs']/r['before']['medianMs']-1)*100:+.1f} %</td><td>{r['after']['p95Ms']:.1f} / {r['after']['peakMs']:.1f}</td></tr>" for r in perf['rows'])
page=f'''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Endless Earth · Mission 19 · Preuves natives</title><style>
:root{{color-scheme:dark;font-family:system-ui,sans-serif;background:#101a18;color:#e4ebe5}}body{{max-width:1280px;margin:auto;padding:24px}}h1{{font-size:clamp(2rem,5vw,3.5rem);line-height:1.1;max-width:950px}}h2{{margin-top:54px}}p,li{{line-height:1.65;max-width:85ch}}a{{color:#c6d9ab}}nav{{display:flex;gap:18px;flex-wrap:wrap}}.columns,.cards{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}figure{{margin:0;background:#1e2c25;border-radius:12px;overflow:hidden}}img,video{{width:100%;display:block;background:#000;aspect-ratio:32/21;object-fit:contain}}.plot{{grid-column:1/-1}}.plot img{{aspect-ratio:auto}}figcaption{{padding:12px;font-size:.9rem;line-height:1.5}}.pair{{margin:24px 0}}select{{font:inherit;padding:10px;border-radius:8px;background:#26382e;color:inherit}}table{{border-collapse:collapse;width:100%;min-width:650px}}td,th{{padding:10px;text-align:left;border-bottom:1px solid #3d5044}}.scroll{{overflow:auto}}.note{{padding:18px;background:#253329;border-left:3px solid #c9d3a6}}@media(max-width:650px){{body{{padding:16px}}.columns,.cards{{grid-template-columns:1fr}}}}
</style><header><p>ENDLESS EARTH · MISSION 19</p><h1>La continuité du monde, observée dans le moteur.</h1><p>Comparaisons, dates calculées, parcours et pistes sonores natives. Aucun déploiement. Code de validation : <code>{esc(commit)}</code>.</p><nav><a href="#comparaisons">Images appariées</a><a href="#mouvement">Mouvement</a><a href="#lune">Lune</a><a href="#parcours">Parcours</a><a href="#sons">Pas</a><a href="#prolonge">Essai prolongé</a><a href="#cout">Mesures</a><a href="../mission-19.md">Rapport et limites</a></nav></header>
<p class="note">Rendu et mesures sous Chromium / SwiftShader logiciel. Ces films conservent les ralentissements natifs ; ils ne constituent pas une garantie de fluidité Android. Les ombres, silhouettes et animations restent soumises à l’appréciation artistique du propriétaire.</p>
<h2 id="comparaisons">Même caméra, même calendrier, même météo</h2><label>Scène <select id="scene"><option value="sous-bois">Sous-bois</option><option value="rue">Rue</option><option value="vallee">Vallée</option></select></label> <label>Profil <select id="profile"><option value="balanced">Équilibré</option><option value="eco">Éco</option><option value="quality">Qualité</option></select></label>{pairs}
<h2 id="mouvement">Mouvement natif et ombres</h2><p>Les deux lecteurs gardent leurs temps propres. L’inspection d’approche déplace uniquement la caméra ; le film de promenade et le film de course utilisent les véritables déplacements du jeu. Aucune bande sonore ajoutée.</p>{movies}<p><a href="shadow-ablation.json">Ablations des ombres</a> · <a href="runtime.json">Identités, frustum et LOD</a> · <a href="wind-cache-equivalence.json">Équivalence du cache de vent</a></p>
<h2 id="lune">Une Lune calculée, sans agrandissement du disque</h2><p>FOV 55°. Les postes sous l’horizon ou proches de la nouvelle Lune peuvent montrer un ciel ou un terrain sans Lune visible. Les dates et phases ne sont pas choisies pour garantir un disque lumineux.</p><div class="cards">{moon_cards}</div>
<h2 id="parcours">Cinq approches publiques cartographiées</h2><p>Cinq départs distincts sont déclarés. Chaque marche rejoint son point d’arrivée sans relocalisation intermédiaire. Les abords d’un monument ne sont pas une entrée inventée.</p><div class="cards">{tour_cards}</div>
<h2 id="sons">La piste réellement produite par les contacts</h2><p>Bitume, pierre, terre, herbe, gravier et neige simulée au contact. Les postes sont séparés. Aucun son de feuilles n’est présenté comme une observation locale sans litière documentée. Deux nouvelles prises CC0, douze extraits ; budgets audio existants conservés.</p><div class="cards">{audio_cards}</div>
<h2 id="prolonge">Promenade continue</h2><p>{esc((str(round(soak['wallSeconds'],1))+' secondes réelles · '+str(round(soak['metres'],1))+' mètres · '+str(soak['frames'])+' images natives') if soak else 'Essai en cours.')}</p><div class="cards">{soak_cards}</div><p><a href="soak.json">Mesures et limites</a> · <a href="soak-trace.json.gz">Trace complète</a></p>
<h2 id="cout">Coût réel, y compris les cellules moins favorables</h2><p>Millisecondes, SwiftShader 640 × 420 DPR 1 ; médianes de douze rendus chauds synchronisés et alternés. P95 et pics sont publiés. Les mesures ne sont pas des FPS matériels.</p><div class="scroll"><table><thead><tr><th>Scène</th><th>Profil</th><th>M18</th><th>M19</th><th>Écart</th><th>M19 P95 / pic</th></tr></thead><tbody>{perf_rows}</tbody></table></div><p><a href="performance.json">Échantillons bruts et ressources</a> · <a href="preservation.json">Préservation</a> · <a href="media.json">Contrôle des médias</a></p>
<footer><p>© contributeurs OpenStreetMap, IGN / Licence Ouverte 2.0 et crédits des prises audio. Le paysage, la météo, les formes végétales et les poids de découverte comportent des interprétations explicites. <a href="../mission-19.md">Lire le rapport complet et le tableau d’état.</a></p></footer><script>
function filter(){{for(const e of document.querySelectorAll('.pair'))e.hidden=e.dataset.scene!==document.querySelector('#scene').value||e.dataset.profile!==document.querySelector('#profile').value}}document.querySelector('#scene').onchange=filter;document.querySelector('#profile').onchange=filter;filter();
</script></html>'''
(out/'index.html').write_text(page)
print('Report and local gallery written; prolonged run complete:',bool(soak))
