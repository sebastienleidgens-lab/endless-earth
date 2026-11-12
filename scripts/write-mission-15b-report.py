import json,pathlib,statistics,gzip,math
root=pathlib.Path('docs/mission-15-evidence/snow-sky')
load=lambda n:json.loads((root/n).read_text())
perf=load('performance-summary.json');data=perf['summary'];alt=load('alternatives.json');audit=load('audit.json');cpu=load('animation-cpu.json')
cpu_table='| Profil | 15A ms/update | 15B sec | 15B neige |\n| --- | ---: | ---: | ---: |\n'
for profile in ['eco','balanced','quality']:
 vals=[next(r for r in cpu['rows'] if r['profile']==profile and r['id']==id)['medianMs'] for id in ['15a','bare','snow']]
 cpu_table+=f'| {profile} | {vals[0]:.4f} | {vals[1]:.4f} | {vals[2]:.4f} |\n'
find=lambda p,v,id:next(r for r in data if r['profile']==p and r['id']==v and r['variant']==id)
table='| Profil · vue | 15A ms | 15B sans dépôt ms (écart) | Dépôt ms (écart) | Flocons ms (écart) | Flocons P95 / pic ms |\n| --- | ---: | ---: | ---: | ---: | ---: |\n'
for p in ['eco','balanced','quality']:
 for v in ['rue','foret','vallee']:
  a,b,c,d=[find(p,v,id) for id in ['15a','15b-bare','15b-covered','15b-snowfall']]
  table+=f'| {p} · {v} | {a["medianMs"]:.1f} | {b["medianMs"]:.1f} ({b["deltaPercent"]:+.1f} %) | {c["medianMs"]:.1f} ({c["deltaPercent"]:+.1f} %) | {d["medianMs"]:.1f} ({d["deltaPercent"]:+.1f} %) | {d["p95Ms"]:.1f} / {d["peakMs"]:.1f} |\n'
alternatives='| Vue | Conservé ms | Un grain ms (écart / conservé) | Sans abri ms (écart / conservé) |\n| --- | ---: | ---: | ---: |\n'
for v in ['rue','foret','vallee']:
 a,b,c=[next(r for r in alt['summary'] if r['view']==v and r['id']==id) for id in ['retained','coarse','unprotected']]
 alternatives+=f'| {v} | {a["medianMs"]:.1f} | {b["medianMs"]:.1f} ({b["deltaRetainedPercent"]:+.1f} %) | {c["medianMs"]:.1f} ({c["deltaRetainedPercent"]:+.1f} %) |\n'
motion='| Observation native | Durée observée | Images moteur | Intervalle médian / P95 / pic ms | Dépôt début → fin |\n| --- | ---: | ---: | ---: | ---: |\n'
for id in ['snow-walk','melt','light','heavy']:
 d=load(id+'.json');a=json.loads(gzip.decompress((root/(id+'-trace.json.gz')).read_bytes()));s=sorted(r['ms'] for r in a[1:]);q=lambda p:s[math.floor((len(s)-1)*p)];motion+=f'| {id} | {d["observations"][-1]["wallSeconds"]:.2f} s | {len(a)} | {statistics.median(s):.1f} / {q(.95):.1f} / {max(s):.1f} | {d["observations"][0]["state"]["snow"]["cover"]:.3f} → {d["observations"][-1]["state"]["snow"]["cover"]:.3f} |\n'
cloudstats=[]
for phase in ['before','after']:
 d=load(phase+'-cloud-observation.json')['observations'];a,b=d[0],d[-1];drift=math.hypot(b['drift'][0]-a['drift'][0],b['drift'][1]-a['drift'][1]);cloudstats.append(f'{phase} : {b["wallSeconds"]-a["wallSeconds"]:.1f} s observées, {b["simulation"]-a["simulation"]:.1f} s de simulation native, {drift:.1f} m d’advection')
walk=load('snow-walk.json');frames=json.loads(gzip.decompress((root/'snow-walk-trace.json.gz').read_bytes()));distance=sum(math.hypot(b['position'][0]-a['position'][0],b['position'][2]-a['position'][2]) for a,b in zip(frames,frames[1:]));steps=walk['observations'][-1]['state']['audio']['steps']
captures=len(load('captures.json')['rows']);start=perf['startup'];bare=[find('balanced',v,'15b-bare')['deltaPercent'] for v in ['rue','foret','vallee']];snow=[find('balanced',v,'15b-snowfall')['deltaPercent'] for v in ['rue','foret','vallee']]
text=f'''# Mission 15 — Un monde vivant, généreux et immersif

## 15B livré pour validation — arrêt avant 15C

**Neige progressive, paysage blanchi et formes nuageuses en évolution lente.** Le « go » du propriétaire valide 15A et autorise 15B. Le jalon 15B est proposé pour revue artistique ; **15C et 15D ne sont pas commencés**. Branche `mission/15-monde-vivant-immersif`, [PR brouillon #24](https://github.com/sebastienleidgens-lab/endless-earth/pull/24). Budget supplémentaire **0 €**. Aucune fusion, aucun déploiement, aucune modification de GitHub Pages ou Living Paintings / LP-01.

[Galerie 15B avec films](mission-15-evidence/snow-sky/index.html) · [Planche comparée](mission-15-evidence/snow-sky/comparison.jpg) · [Rapport historique 15A](mission-15a.md) · [Preuves 15A conservées](mission-15-evidence/index.html).

![Sans neige / dépôt faible / dépôt fort, mêmes poses](mission-15-evidence/snow-sky/comparison.jpg)

Le témoin est le commit **`62be56993d7f7ec69a45406f57d298a1885daea9`**, livré en 15A, dans un checkout détaché propre. Mission 14 reste fusionnée dans `main` par la [PR #23](https://github.com/sebastienleidgens-lab/endless-earth/pull/23), base `96a2687`. Les captures 15B indiquent honnêtement base 62be569 + sources modifiées avant le commit 15B ; leurs empreintes sont conservées dans l’audit. Les 58 fichiers de preuve historiques de 15A restent identiques.

## Neigeux : chute et dépôt progressifs

Le choix **Neigeux** réutilise le propriétaire existant du calendrier, de la météo, du vent et des transitions audio. C’est une simulation artistique, sans prévision ni relevé météorologique. Il ajoute une intensité de neige au vecteur des six météos existantes. Une transition pluie → neige termine la phase sortante avant de commencer l’autre : les deux émetteurs ne produisent pas de précipitations contradictoires. Aucun changement de date n’est imposé pour fabriquer l’hiver.

**Un seul objet GPU Points**, sans objet CPU par flocon : 1 100 graines statiques au maximum, 26 400 octets de positions/graines, un appel supplémentaire seulement pendant la chute. Les plafonds Éco / Équilibré / Qualité sont **240 / 680 / 1 100**, modulés par l’intensité. La descente varie de 0,55 à 1,40 m/s, les diamètres de 2,5 à 7,5 cm, avec fluctuations indépendantes, taille apparente et couleur selon profondeur/lumière. Le volume est ancré dans le monde autour de la caméra ; il ne glisse pas avec elle. Le vent commun entraîne les flocons, les arbres et les nuages.

La profondeur du moteur masque les flocons derrière les bâtiments. Une enveloppe supérieure les efface sous les toits, le tablier du pont ou le sol ; une capsule de proximité protège le personnage, et le voisinage immédiat de la caméra est estompé. Le modulo du volume reste une approximation bornée ; ce n’est pas une simulation collisionnelle de chaque cristal ou feuille.

Le dépôt part de **zéro**. À intensité normale 0,72 et masse d’air simulée à −3 °C, il gagne environ **0,10 en 30 s**, **0,62 en 3 min**, puis sature en environ cinq minutes. L’état utilise le temps réel écoulé, plafonné à une seconde par mise à jour afin de ne pas blanchir brutalement le lieu au retour d’un onglet inactif. Après arrêt des précipitations, la température saisonnière simulée, la lumière du jour et la pluie favorisent une fonte continue. Aucun échange brutal d’atlas, aucun déplacement de sommet ou de collision.

Le shader compose une **fine couche de couleur** avec les matières et l’éclairage existants : orientation montante, pente, exposition au-dessus des volumes opaques, grain large et fin, intensité et durée. Les toitures, rebords, roches, sol, branches et couronnes compatibles blanchissent avec des irrégularités ; les façades verticales et le verre sont préservés, l’eau courante est exclue. **Aucun modèle de glace** n’est ajouté. Le calendrier garde les feuillus hivernaux dégarnis et les persistants feuillés ; le dépôt estompe aussi les fleurs estivales si l’on choisit artificiellement la neige en été. Un léger rebond blanc du sol accompagne le dépôt.

Le diagnostic `?perf=1&weather=snow&snowCover=0.65` reproduit un niveau **verrouillé**, sans le présenter comme une accumulation instantanée normale. `snowfall=0.15` ou `snowfall=1`, également derrière `perf`, inspecte une faible ou forte chute. Le banc de test peut amorcer un dépôt puis le déverrouiller par événement diagnostique ; la vidéo de début naturel n’utilise aucun amorçage. Ces outils n’ajoutent pas de commandes au parcours ordinaire.

## Abri, droits et cycle de vie

L’enveloppe **1024² RG8**, 1,953125 m par texel, vient des positions et indices opaques exacts du dérivé d’éclairage 15A : relief, bâtiments, patrimoine, pont. L’eau est exclue. Hauteurs quantifiées au 1/64 m ; **2 097 152 octets bruts, 1 175 798 compressés**, 188 186 triangles non verticaux rasterisés. Ce masque représente un abri artistique approché, pas de nouvelles altitudes mesurées ou une épaisseur de neige.

Chargement différé au premier besoin ; **aucune requête d’exposition en météo sèche sans dépôt**. Les révisions terrain/refinement/surface/patrimoine/statique et les SHA-256 compressé/décompressé doivent correspondre. Allocations et décompression sont bornées. Les réponses tardives d’un ancien propriétaire sont ignorées ; remplacement et destruction libèrent texture, géométrie, matériau et écouteurs. En cas de données absentes, périmées, corrompues ou trop grandes, le jeu conserve ses autres météos et sa navigation ; le dépôt et les flocons sont retenus, avec indication d’indisponibilité.

Forme des flocons, graines, grain et shaders **originaux au projet**. Aucun modèle, son, texture tiers ou achat nouveau. Le dérivé conserve les crédits **IGN Licence Ouverte 2.0 / © contributeurs OSM ODbL**. [Préparation](mission-15-evidence/snow-sky/exposure-preparation.json) · [Licence du dérivé](../public/data/angles-snow-exposure.LICENSE.md) · [Audit des sources et ressources](mission-15-evidence/snow-sky/audit.json).

## Ciel : diagnostic avant modification

L’advection existait déjà en 15A. Les formes restaient essentiellement fixes dans leur repère advecté, et le plancher d’opacité élevé du ciel couvert rendait leurs contours difficiles à suivre. La couche basse visible se projetait à **280 m**, alors que le champ macro d’ombres utilisait **230 m**. Sur une courte promenade, la lenteur apparente, les grands motifs et ce faible contraste pouvaient donner une impression d’immobilité.

La vitesse d’advection et le vent sont conservés. Trois phases lentes, calculées une fois par image, déforment progressivement le champ macro et la distorsion des détails. Le même état pilote le ciel et la réception des ombres nuageuses. La couche basse visible utilise maintenant **230 m** ; la couche haute reste à **540 m**, avec 0,65 de l’advection basse et une évolution différente. Le plancher du couvert descend de 0,80 à 0,46 pour laisser lire les contours. Même nombre d’échantillons de bruit et de passes ; aucune rotation rapide artificielle.

Deux observations natives de **quatre minutes chacune**, caméra fixe, météo Nuageux, captures espacées d’une minute : {' ; '.join(cloudstats)}. Les vidéos conservent les **120 premières secondes**, par copie de paquets, à vitesse normale. Les formes évoluent en plus du déplacement ; les ombres restent une approximation macro, sans prétendre reproduire chaque détail de nuage. [Avant](mission-15-evidence/snow-sky/before-clouds.webm) · [Après](mission-15-evidence/snow-sky/after-clouds.webm) · [Observation et coordonnées avant](mission-15-evidence/snow-sky/before-cloud-observation.json) · [Après](mission-15-evidence/snow-sky/after-cloud-observation.json).

## Captures, marche, fonte et audio réels

**{captures} captures de comparaison** : rue, pont, dessous du pont, forêt, falaise, toitures, vallée et persistants ; dépôt 0 / 0,18 / 0,85 ; profils Éco/Équilibré/Qualité et format mobile 390 × 844. Les poses, date, soleil et vent sont contrôlés. Les vues de pont et sous le pont sont des stations d’inspection distinctes, avec altitude absolue explicitée, sans prétendre les relier par un itinéraire accessible. [États des captures](mission-15-evidence/snow-sky/captures.json).

La promenade sous la neige utilise la boucle normale : 30 s d’arrêt, AutoWalk activé par son bouton ordinaire pendant 80 s, puis arrêt. **{distance:.1f} m réellement parcourus**, **{steps} pas audio** ; aucun chemin forcé, changement de position ou déplacement de caméra diagnostique pendant le film. Le premier déclenchement charge et compile réellement la neige pendant cette séquence. La fonte observe séparément **cinq minutes réelles** en juillet ensoleillé, depuis un dépôt diagnostique 0,24 déverrouillé avant l’observation.

{motion}

Le nombre d’images moteur inclut aussi la courte chauffe native préalable ; la fenêtre des observations et la durée conteneur sont distinctes. Ces intervalles incluent l’enregistrement VP9/Opus, les transitions, les compilations éventuelles et le rendu **SwiftShader logiciel**. Ils exposent les pauses ; ils ne constituent pas un benchmark sur matériel physique. Les vidéos capturent le canevas à un maximum de 8 images/s et le **véritable bus audio après limiteur**. Remuxage uniquement par copie, sans accélération, reconstruction ou ajout de piste. [Début et marche](mission-15-evidence/snow-sky/snow-walk.webm) · [Fonte](mission-15-evidence/snow-sky/melt.webm) · [Chute faible](mission-15-evidence/snow-sky/light.webm) · [Forte](mission-15-evidence/snow-sky/heavy.webm) · [Contrôle des paquets et décodage](mission-15-evidence/snow-sky/video-validation.json).

La neige atténue discrètement les couches existantes d’eau, de détail et de feuillage, et adoucit leur filtrage ; le vent reste celui du système audio. Une garde retire rapidement les anciennes voix de pluie à l’entrée en neige pure. Le test fait jouer réellement la pluie puis la neige et vérifie l’absence de couche/voix de pluie, ainsi que les budgets. **Aucun bruit blanc de remplissage, aucun nouvel enregistrement**. Le catalogue vérifié ne comporte pas de pas sur neige adaptés ; les pas gardent le matériau physique existant, limite audible assumée. [Audio et transitions réels](mission-15-evidence/snow-sky/runtime.json).

## Coût : ciel seul, dépôt et flocons séparés

**432 rendus synchronisés** avec fin WebGL et lecture complète, **960 × 640 / DPR 1**, trois profils × trois scènes × quatre variantes × trois passages alternés × quatre échantillons. Caméra absolue, date, soleil, phase du vent et vecteur lumineux commun vérifiés par assertions. Le banc reproduit explicitement cloud 0,96 / mist 0,30 / wind 0,38 / rain 0 dans 15A et 15B ; seule la variante flocons émet snow 0,72. Les libellés météo du banc restent Couvert : ce vecteur est un diagnostic, pas un mode ordinaire ajouté. Aucun autre travail navigateur/graphique pendant les mesures. P95 et pics sont conservés ; douze échantillons par ligne ne garantissent pas une borne statistique haute.

{table}

En Équilibré sans dépôt, l’écart complet est **{min(bare):+.1f} à {max(bare):+.1f} %**. Avec neige en chute, il atteint **{min(snow):+.1f} à {max(snow):+.1f} %**, au-delà du seuil de 10 %. **Le coût n’est donc pas validé implicitement.** Une campagne séparée de 108 rendus compare réellement le shader conservé, la suppression du grain fin et la suppression supplémentaire de l’abri :

{alternatives}

Le grain fin est déjà retiré en Éco. La variante sans abri perd la protection sous les volumes ; elle est rejetée pour cette perte de protection. La version conservée garde les irrégularités du dépôt et sa cohérence avec les toits. **Le gain artistique majeur proposé est le paysage réellement blanchi**, avec ce surcoût actif explicitement soumis au propriétaire. Le chemin sec compile sans échantillonnage ni varyings de neige. Les sources et captures des alternatives sont conservées ; ces variantes d’essai ne modifient pas le réglage livré. [Alternatives et protocole](mission-15-evidence/snow-sky/alternatives.json).

La mise à jour CPU du propriétaire d’atmosphère complet est mesurée séparément, rendu tenu : 200 appels de chauffe puis dix lots de 100 appels par cas, trois profils. Le temps du vent et des formes avance par pas diagnostiques de 1/60 s, le dépôt et l’horloge climatique sont tenus. Ces valeurs comprennent les systèmes existants et ne prétendent pas isoler le seul coût des flocons. Médianes des lots, en ms par mise à jour :

{cpu_table}
[Échantillons CPU et pics des moyennes de lot](mission-15-evidence/snow-sky/animation-cpu.json).

En Équilibré, mêmes triangles couleur (**rue 216 808, forêt 109 900, vallée 282 207**). Le dépôt seul n’ajoute aucun appel ; les flocons ajoutent **un appel** : 118 → 119 en rue, 34 → 35 en forêt, 170 → 171 dans la vallée. Textures moteur **11 → 13** ; les allocations logiques supplémentaires mesurées sont **2 102 613 octets de texture estimée** et **26 400 octets de buffers** pour la chute. Le chemin sec n’alloue pas de buffers/textures WebGL supplémentaires dans ces scènes. Tas JS après GC : environ +0,3 Mo à sec, +2,5 Mo avec dépôt/chute, instrumentation comprise. Ce ne sont pas des mesures de VRAM physique.

Chargement local jusqu’aux données prêtes : **{start['15a']['ms']/1000:.2f} s en 15A / {start['15b-bare']['ms']/1000:.2f} s à sec en 15B**, une observation par version ; aucune conclusion réseau Internet. Le pack d’exposition différé ajoute 1,18 Mo seulement à son activation. Streaming, packs et caches existants sont conservés, avec leurs métriques brutes. Compilation **798,06 ko**, avertissement Vite >500 ko déjà présent. [Matrice, mémoire, chargement, streaming et ombres](mission-15-evidence/snow-sky/performance-summary.json) · [Trace brute compressée](mission-15-evidence/snow-sky/performance.json.gz).

## Géographie, ombres et validation

**{audit['physicalFilesIdentical']} fichiers protégés identiques à 15A**, incluant données publiques, collisions, commandes de déplacement, navigation et éclairage. Les deux manifestes décoratifs changent uniquement leurs empreintes de générateurs, pas les packs, ancrages, matrices ou autres champs. Le calendrier conserve ses règles et son propriétaire existants. Les 2 500 arbres et le relief réel restent en place. Le vrai navigateur retrouve **2 898 réponses de collision et 20 mouvements identiques** à 15A. Le dépôt reste purement visuel, sans pente physique, épaisseur ou collider ajouté.

Le pack et le manifeste d’éclairage 15A restent **identiques**, liés à `generous-canopy-v2`. Aucune silhouette ne change en 15B ; leur régénération serait sans bénéfice géométrique. Les nouvelles couleurs continuent à recevoir le contact, le soleil et les ombres existants. Budgets solaires inchangés : Éco sans carte, Équilibré 512² / 48 m / 2 Hz, Qualité 1024² / 64 m / 4 Hz. **Zéro passe d’ombre supplémentaire pour la neige.** L’enveloppe d’abri séparée est liée aux révisions courantes et régénérable de manière déterministe.

**221 tests Node**, TypeScript/Vite et shaders dans le vrai navigateur passent. Le [contrôle de l’identité compilée](mission-15-evidence/snow-sky/build-identity.json) couvre 1280, 390, 320 et 844 pixels : le long titre de mission rogné à 320 px a reçu un retour à la ligne uniquement à 360 px et moins. Toutes les prises et mesures 3D (390 px et plus) gardent leur rendu ; cette correction CSS postérieure est consignée avec ses empreintes dans l’audit. Le runtime contrôle quinze changements de scène/profil, trois retours avec ressources stabilisées, la progression du dépôt, l’exclusivité pluie/neige, l’audio réellement décodé et quatre erreurs de données. Les régions de pixels échantillonnées confirment le blanchiment du toit/sol, le maintien de la rivière et l’éclairage modéré d’une façade. Le smoke du build compilé vérifie chargement, déplacement, caméras, arrêt sans dérive, activation sonore et mobile. [Runtime](mission-15-evidence/snow-sky/runtime.json) · [Échantillons de surfaces réelles](mission-15-evidence/snow-sky/surface-samples.json) · [Audit](mission-15-evidence/snow-sky/audit.json) · [Validation finale, médias et sources](mission-15-evidence/snow-sky/validation.json).

Limites : neige stylisée sans congères ni traces de pas, masque d’abri d’environ deux mètres sans occlusion feuille par feuille, couverture parfois simplifiée près des arêtes et rebords étroits, ombres nuageuses macro, fonte selon un modèle artistique générique, pas de son de pas neigeux dédié. Aucun GPU physique ou Android disponible ; ni fluidité matérielle ni session de trente minutes de 15D revendiquée. Le personnage, le menu et les départs aléatoires restent réservés à 15C.

**Arrêt après 15B. La validation du naturel de la neige, du ciel et du compromis de coût reste humaine avant tout démarrage de 15C.**
'''
report=pathlib.Path('docs/mission-15.md');archive=pathlib.Path('docs/mission-15a.md')
if not archive.exists():archive.write_text('> Archive du rapport 15A livré au commit 62be569 et accepté par le « go » du propriétaire. Les mentions d’arrêt avant 15B ci-dessous décrivent cet état historique. Le rapport courant est [mission-15.md](mission-15.md).\n\n'+report.read_text())
report.write_text(text)
print('Wrote current 15B report and preserved historical 15A report')
