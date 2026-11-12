import pathlib,json,subprocess,statistics,gzip,math,html
from PIL import Image,ImageDraw,ImageFont
root=pathlib.Path('docs/mission-15-evidence/signs-life');load=lambda n:json.loads((root/n).read_text())
perf=load('performance-summary.json');components=load('components.json');soak=load('soak.json');audit=load('audit.json');media=load('media.json');captures=load('captures.json');starts=load('starts.json');rarity=load('rarity.json')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19)
sheet=Image.new('RGB',(1280,4*455+45),'#17382c');draw=ImageDraw.Draw(sheet);draw.text((15,10),'Mission 14 / Mission 15 · vrai moteur · mêmes caméras, soleil et vent',fill='white',font=font)
for i,kind in enumerate(['foret','rue','chimneys','aircraft']):
 for j,version in enumerate(['M14','M15']):
  im=Image.open(root/f'{version}-{kind}.jpg');im.thumbnail((640,425));y=45+i*455;sheet.paste(im,(j*640,y));draw.text((j*640+12,y+426),f'{version} · {kind}',font=font,fill='white')
sheet.save(root/'comparison.jpg',quality=88)
render='| Profil · scène | M14 médiane ms | M15 médiane ms | Écart M14 | Écart 15C | M15 P95 / pic ms |\n| --- | ---: | ---: | ---: | ---: | ---: |\n'
for profile in ['eco','balanced','quality']:
 for view in ['rue','foret','vallee']:
  a,b=[next(r for r in perf['summary'] if r['id']==v and r['profile']==profile and r['view']==view) for v in ['M14','15D']]
  render+=f'| {profile} · {view} | {a["medianMs"]:.1f} | {b["medianMs"]:.1f} | {b["deltaM14Percent"]:+.1f} % | {b["delta15CPercent"]:+.1f} % | {b["p95Ms"]:.1f} / {b["peakMs"]:.1f} |\n'
names={'trees':'Maillages d’arbres visibles','flowers':'Fleurs','clouds':'Nuages + ombres nuageuses','character':'Personnage','snow':'Neige : dépôt + flocons','chimneys':'Finitions de cheminées','smoke':'Fumée','aircraft':'Avion','combined':'15D combiné sous neige'}
ct='| Élément isolé | Éco on / off ms | Équilibré on / off ms | Qualité on / off ms |\n| --- | ---: | ---: | ---: |\n'
for kind,label in names.items():
 vals=[next(r for r in components['summary'] if r['profile']==p and r['kind']==kind) for p in ['eco','balanced','quality']]
 ct+='| '+label+' | '+' | '.join(f'{r["onMedianMs"]:.1f} / {r["offMedianMs"]:.1f}' for r in vals)+' |\n'
native='| Séquence native | Durée conteneur | Distance | Médiane / P95 / pic ms |\n| --- | ---: | ---: | ---: |\n'
for id in ['M14-native-walk','M15-native-walk']:
 d=load(id+'.json');f=json.loads(gzip.decompress((root/(id+'-trace.json.gz')).read_bytes()));t=sorted(r['ms'] for r in f[1:]);m=next(r for r in media['rows'] if r['id']==id)
 native+=f'| {id} | {float(m["metadata"]["format"]["duration"]):.2f} s | {d["distanceMetres"]:.1f} m | {statistics.median(t):.1f} / {t[math.floor((len(t)-1)*.95)]:.1f} / {max(t):.1f} |\n'
source=audit['newRecordings'][0]
report=f'''# Mission 15 — Un monde vivant, généreux et immersif

## Mission 15 complète — proposée à la validation artistique finale

**Un village plus généreux, un ciel vivant, une promenade dégagée et quelques signes de vie discrets.** Les « Go » du propriétaire ont accepté 15A, 15B puis 15C et autorisé 15D. Les quatre jalons sont livrés dans la [PR brouillon #24](https://github.com/sebastienleidgens-lab/endless-earth/pull/24), branche `mission/15-monde-vivant-immersif`. **Arrêt pour revue finale ; aucune fusion, aucun déploiement, aucune modification de GitHub Pages ou Living Paintings / LP-01. Budget supplémentaire : 0 €.**

[Galerie et six films natifs](mission-15-evidence/signs-life/index.html) · [Planche M14 / M15](mission-15-evidence/signs-life/comparison.jpg) · [Historique 15A](mission-15a.md) · [15B](mission-15b.md) · [15C](mission-15c.md).

![Comparaisons réelles Mission 14 et Mission 15](mission-15-evidence/signs-life/comparison.jpg)

## Ce qui reste des quatre jalons

**15A — Nature généreuse.** Les 2 500 ancrages sont conservés ; les couronnes sont plus amples, ajourées de près et simplifiées à distance. Les écotypes, saisons et exclusions autour des maçonneries restent explicites. Les **180 compositions fleuries** sont des interprétations guidées par les références documentaires du village, sans devenir des observations géolocalisées. Les essais de techniques et les ombres re-préparées sont conservés dans le [rapport 15A](mission-15a.md), avec ses images et ses limites de densité.

**15B — Neige et ciel.** Le choix Neigeux, le dépôt/fonte progressifs, l’abri et les contacts utilisent les dérivés liés aux mêmes sources. Fleurs et feuillages respectent calendrier et dépôt ; rivière et surfaces verticales ne deviennent pas de la glace. La pluie laisse sa place à la neige sans particules contradictoires. Les nuages se déforment lentement et gardent le porteur du vent commun. Les films de plusieurs minutes et le compromis sous neige restent dans le [rapport 15B](mission-15b.md), accepté par le propriétaire.

**15C — Promeneur et immersion.** Un personnage original de **1 936 triangles / 16 os / un appel**, appuis liés à la distance réellement parcourue, marche/course/repos et contacts sonores partagés. Un seul bouton de menu, fermé par défaut ; gestes tactiles relatifs, clavier, son, profils et sources restent accessibles. Forteresse et sa téléportation, joystick visible et panneaux permanents sont supprimés. Chaque chargement ordinaire tire un nouveau départ parmi **1 556 points / 80 secteurs** vérifiés ; `spawnSeed` reproduit les mêmes données. Les 112 ouvertures et les films de marche/course/pentes restent [archivés en 15C](mission-15c.md). La navigation précalculée évite son ancien calcul bloquant au premier bouton et ne téléporte pas le promeneur.

**15D — Petits signes de vie.** Un avion générique original, quelques finitions de cheminées et une fumée occasionnelle s’ajoutent à ce monde. Leur rareté, leurs budgets et leur provenance restent séparés de la géographie vérifiée.

## Avions : un passage, pas un fond permanent

Le petit appareil à aile haute est une création de **228 triangles**, un matériau à couleurs de sommets et une envergure de **10,1 m**. Il suit une trajectoire rectiligne continue, à altitude décorative constante au-dessus de l’enveloppe chargée, sans virage artificiel ou ré-ancrage à la caméra. Il devient minuscule au loin et s’efface dans la distance. **Un seul appareil peut exister à la fois. Aucun trafic aérien réel ou service de suivi n’est utilisé.**

Le planificateur utilise une graine de session, des attentes exponentielles et un intervalle minimal de calme. Il attend au moins trois minutes avant un premier passage éventuel ; les grosses pluies et brumes peuvent supprimer une tentative. Une promenade n’a aucune garantie d’en voir un. Dans **120 simulations unitaires de trente minutes**, {rarity['zeroFlightSessions']} sessions ne contiennent aucun avion. Ces simulations accélérées ne remplacent pas la vraie session prolongée ci-dessous. [Distribution](mission-15-evidence/signs-life/rarity.json).

Le son vient de [Small plane flyover 1, SoundsLikeYukon](https://freesound.org/people/SoundsLikeYukon/sounds/820324/), annoncé **CC0** par l’auteur et vérifié sur sa page. La captation est canadienne ; elle ne documente pas Angles. L’aperçu HQ MP3 est déclaré comme tel, découpé sur 24 s puis filtré, réglé par gain linéaire borné, fondu et préparé en mono 32 kHz / FLAC PCM16. Il reste une source initialement avec pertes. **{audit['resources']['audio']['bytes']:,} octets compressés**, 3 072 000 octets décodés au taux demandé.

Le passage utilise **le Soundscape et l’AcousticRenderer existants** : une voix ponctuelle de faible priorité, déplacement du Panner en trois dimensions, atténuation avec la distance et extinction naturelle. Aucun oscillateur, second contexte ou lit de vrombissement. Si la voix, le cache ou l’enregistrement sont indisponibles, le passage peut rester silencieux. Les limites de **24 Mio**, 8/12/12 voix et 1/2/3 HRTF restent en place. [Sources, licences et empreintes](../public/audio/sources.json) · [Transformations](../public/audio/manifest.json) · [Crédits](../public/audio/credits.html).

## Cheminées et fumée : hypothèses artistiques discrètes

Le moteur possédait déjà des cheminées dans ses toitures procédurales. **238 caps existants** sont retrouvés dans les vraies géométries indexées chargées, avec leurs dimensions et leur teinte caractéristiques ; aucun point aléatoire n’est posé sur une emprise. Les murs et toitures d’origine ne sont pas déplacés. Des couronnements de pierre et pots de terre cuite, **52 triangles par instance**, ajoutent une petite variation de hauteur et de ton. Ils restent sur environ un quart des bâtiments, jamais sur chaque toit. Un seul appel instancié, avec disparition progressive à distance et plafonds **24 / 48 / 72** détails pour Éco / Équilibré / Qualité. Ils reçoivent lumière et neige communes. [Inventaire](mission-15-evidence/signs-life/chimneys.json).

La température vient de la neige/calendrier déjà simulés. Le planificateur choisit parmi **toutes** les cheminées et ne consulte ni caméra ni visibilité pour décider d’un chauffage. Un maximum de deux sources peut être planifié ; le budget global peut en refuser. Cela ne constitue pas une observation d’occupation, de cheminée réelle, de chauffage ou d’émission réelle d’une maison.

Les bouffées naissent irrégulièrement, montent peu, s’élargissent, dérivent avec **le même vecteur de vent** puis se dissipent. Le bassin de particules est fixe ; le rendu est diffus, transparent et sans texture d’image. Avions, fumée, oiseaux et micro-événements partagent **un seul WorldLifeBudget**. Éco reçoit un petit plafond global de quatre particules, contre huit et seize dans les autres profils ; un refus de particules ne permet plus aux feuilles d’en dessiner sans allocation. Les sons gardent leur budget distinct existant. Une cheminée n’émet pas seulement parce qu’elle devient visible.

La séquence de fumée est une **inspection explicite avec graine et caméra de toiture**, à temps natif ; elle n’est pas présentée comme un événement rencontré au hasard. Elle est volontairement silencieuse, sans crépitement d’occupation inventé. La session prolongée n’utilise aucun forçage d’avion ou de foyer.

## Une vraie promenade continue de trente minutes

**{soak['elapsedSeconds']:.2f} secondes réelles continues**, **{soak['distanceMetres']:.1f} m cumulés**, **{soak['frames']:,} intervalles instrumentés**, sur une copie figée du build de production, 720 × 460. Le départ est celui de `spawnSeed={soak['initialSpawn']['seed']}` et le planificateur ordinaire reçoit `lifeSeed=normal-30m-0`. Aucun déplacement de position, trajet imposé pendant la session, accélération ou inspection d’événement rare. Les reprises d’AutoWalk utilisent le graphe depuis la position courante ; la distance est cumulée et peut inclure des retours sur des voies déjà parcourues.

La session couvre été, passage au calendrier hivernal et neige, pluie printanière, orage, retour estival, soir, trois profils, plusieurs pauses contemplatives et reprises. Les réglages météo/heure/profil utilisent le menu ; les dates utilisent le diagnostic de calendrier existant, déclaré dans le protocole. Le monde continue ses événements pendant les arrêts. Les quatre premières minutes restent calmes ; deux vols ont été planifiés pendant cette session, avec **{soak['flightVisibleSamples']} échantillons où l’appareil est rendu**, et **{soak['aircraftAudioEvents']} événement audio admis**. Une voix n’est pas garantie pour chaque vol. Un foyer a été admis hors champ pendant cette marche ; aucune bouffée n’y a été visible. La scène active visible est donc vérifiée séparément par l’inspection déclarée.

**Médiane {soak['medianMs']:.1f} ms, P95 {soak['p95Ms']:.1f} ms, pic {soak['peakMs']:.1f} ms** : ce sont les intervalles du rendu logiciel, avec interface, streaming et enregistrement, sans retirer les pauses longues. Aucun autre travail navigateur/GPU pendant la session. Les contrôles n’ont relevé ni coordonnées invalides, mélange pluie/flocons contradictoire, dépassement des voix/cache/allocations de vie, ni recours à l’inspection rare. Les seules pistes sonores des extraits viennent du véritable bus après limiteur, observé par une branche diagnostique. [Résultat et chronologie](mission-15-evidence/signs-life/soak.json) · [Trace complète comprimée](mission-15-evidence/signs-life/soak-trace.json.gz).

Deux films supplémentaires comparent la marche native M14/M15 à une même station initiale : vrai bouton AutoWalk, arrêt, première personne puis vue élevée. Ces films ne prétendent pas apparier chaque position à la même seconde : le pas physique reste plafonné pendant une image lente.

{native}

Les médias gardent leurs paquets et PTS/DTS natifs par remuxage, sans accélération ou bande-son ajoutée. Les six films sont intégralement décodés ; le poster de vol au milieu vient d’une vraie image du flux. [Vérification audiovisuelle](mission-15-evidence/signs-life/media.json).

## Coûts finaux : mêmes caméras et météo commune

**324 rendus synchronisés**, 960 × 640 DPR 1 : trois profils × trois scènes × M14 fusionnée / 15C / 15D × trois passages alternés × quatre échantillons. Caméra, soleil, date, phase du vent et champs météo communs sont vérifiés identiques. Le mode Neigeux n’existant pas en M14, la matrice principale utilise un été clair commun ; son coût est isolé ensuite. **SwiftShader logiciel uniquement**, aucun GPU physique ou Android disponible mesuré. Douze valeurs par ligne ne constituent pas une garantie statistique de fluidité matérielle.

{render}

**Le seuil de 10 % est dépassé en forêt Qualité (+11,5 % face à M14), avec +1,3 % pour 15D / 15C.** Les profils alternatifs mesurés restent à +2,9 % en forêt Éco et +3,9 % en Équilibré face à M14. Les grandes couronnes et les ombres locales sont conservées pour leur apport artistique déjà accepté ; ce compromis Qualité reste proposé à votre revue finale, sans garantie de fluidité matérielle.

Les appels, triangles, textures, tas après GC, allocations WebGL logiques, temps de préparation et streaming figurent dans la [matrice complète](mission-15-evidence/signs-life/performance-summary.json). Ces estimations ne sont pas de la VRAM physique. Les compromis historiques 15A et 15B restent archivés, notamment **+16,0 à +26,4 % sous neige en 15B / 15A** et la scène de forêt 15C ; une nouvelle campagne ne les efface pas.

**486 rendus supplémentaires** séparent les coûts, avec activation/désactivation du propriétaire réel, boucles tenues et échauffement :

{ct}

Les scènes diffèrent selon l’effet : forêt, rue et fleurs proches, ciel, rue enneigée, toitures. « Combiné » enlève les ajouts 15D d’une scène enneigée ; les événements simultanés restent ceux admis par le profil, un seul en Éco. Les ombres statiques d’arbres restent dans le cache lors de l’ablation de leurs maillages. Les petites inversions de temps illustrent le bruit du rendu logiciel ; elles ne constituent pas un gain garanti. Ces écarts marginaux **ne s’additionnent pas** et la visibilité ne libère pas les allocations. Les événements de ces inspections sont explicitement placés pour les mesurer ; ils ne prouvent pas la rareté ordinaire. [Composants, P95, pics, appels et triangles](mission-15-evidence/signs-life/components.json).

## Préservation, ressources et validation

**235 tests Node**, TypeScript/Vite et contrôles du navigateur compilé. Les nouveaux tests couvrent rareté, trajectoire, hauteur, chauffage saisonnier, reconnaissance des caps, budgets partagés, changements de profils et destruction. Les contrôles navigateur couvrent collisions, chargements retardés/manquants, navigation, clavier/focus et tactile, trois profils, six cycles réels de création/rendu/destruction des nouveaux objets et douze stations distinctes de streaming. Ces stations sont des inspections, pas un itinéraire de marche fabriqué. Le repli sans captation d’avion garde les autres sons et ne fabrique pas de bruit.

Les **112 démarrages de 15C** restent conservés ; **12 ouvertures complètes supplémentaires** vérifient les sources finales, six graines, deux répétitions et quatre ouvertures ordinaires. Les mêmes graines reproduisent exactement les positions et orientations de 15C. Menu, météo et vue ne relancent pas la sélection.

**{audit['protectedFilesIdentical']} fichiers protégés identiques à 15C**, dont données géographiques, relief, routes, emprises, pont/ruines, surfaces, colliders, navigation, personnage, végétation, matières et éclairage. **{audit['historicalEvidenceFilesIdentical']} preuves historiques** conservées. Les 40 captations et {audit['originalAudioAssetsIdentical']} actifs audio antérieurs restent identiques ; une seule captation CC0 est ajoutée. Les crédits IGN/ASP Licence Ouverte 2.0, OSM ODbL et matières/sons préexistants sont conservés. Les trois nouveaux petits modèles/effets sont originaux et n’ajoutent aucune texture d’image. [Audit et inventaire](mission-15-evidence/signs-life/audit.json) · [Contrôles finaux](mission-15-evidence/signs-life/validation.json).

Les preuves sont produites sur les sources figées. Les captures portent la base `8455726` modifiée avant le commit 15D ; les builds suivants embarquent leur propre commit, sans requête de métadonnées distante.

## Limites et choix artistiques à valider

Le MNT, les hauteurs estimées, les accès M14 au pont et aux ruines, le style des couronnes, vêtements et visages restent ceux des jalons documentés. Les pots/couronnements nouveaux ne sont pas ré-intégrés à la silhouette du cache d’ombres statiques M14 ; ils reçoivent la lumière commune mais n’ajoutent pas une passe solaire. La fumée est une approximation légère, sans aérodynamique ou combustion ; l’avion générique n’est pas du trafic réel. Les pas restent silencieux sur un sol de matière inconnue et il n’y a pas de nouvelle captation de pas neigeux. La fluidité et l’accessibilité sur un appareil Android physique restent à examiner par le propriétaire.

La décision finale porte sur : **1.** beauté et volume des arbres ; **2.** densité naturelle des forêts ; **3.** présence et fidélité des fleurs ; **4.** neige convaincante ; **5.** ciel vivant ; **6.** promeneur agréable en marche/course ; **7.** paysage dégagé ; **8.** départs sans incident ; **9.** subtilité des avions et fumées ; **10.** fluidité et plaisir de promenade. Les tests techniques ne répondent pas à votre place.

**Arrêt après 15D pour validation artistique finale. Ne pas fusionner ou déployer sans nouvel accord explicite.**
'''
archive=pathlib.Path('docs/mission-15c.md')
if not archive.exists():archive.write_text('> Rapport historique 15C au commit 8455726, accepté par le « Go » du propriétaire. Les mentions d’arrêt avant 15D décrivent cet état historique. [Rapport courant](mission-15.md).\n\n'+subprocess.check_output(['git','show','8455726:docs/mission-15.md'],text=True))
pathlib.Path('docs/mission-15.md').write_text(report)
photos=''.join(f'<figure><a href="{r["file"]}"><img loading="lazy" src="{r["file"]}" alt="{r["id"]} · {r["kind"]}"></a><figcaption>{r["id"]} · {r["kind"]}. {html.escape(r["caption"])}</figcaption></figure>' for r in captures['rows'])
video=''.join(f'<figure><video controls preload="metadata" src="{r["id"]}.webm" poster="{("soak-natural-flight-mid" if r["id"]=="soak-natural-flight" else r["id"] if r["id"].startswith("soak") or r["id"]=="smoke-inspection" else r["id"]+"-0s")}.jpg"></video><figcaption>{r["id"]} · durée native {float(r["metadata"]["format"]["duration"]):.2f} s</figcaption></figure>' for r in media['rows'])
ui=''.join(f'<figure><img loading="lazy" src="{name}.jpg" alt="{name}"><figcaption>{name}</figcaption></figure>' for name in ['menu-960x640','menu-390x844','menu-320x568','menu-844x390','mobile-gesture'])
(root/'index.html').write_text(f'''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Endless Earth · Mission 15 finale</title><style>body{{margin:0;background:#17382c;color:#f2eee2;font:16px/1.6 system-ui}}main{{max-width:1300px;margin:auto;padding:24px}}h1,h2{{font-family:Georgia,serif}}a{{color:#c7e1ce}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}}figure{{margin:0;padding:10px;background:#294b3a}}img,video{{display:block;width:100%;height:auto}}figcaption{{padding:8px 0}}p{{max-width:90ch}}</style><main><h1>Mission 15 · Le plaisir de promenade</h1><p>15A–C acceptés ; 15D et Mission 15 proposés à la validation artistique finale. Aucune fusion ni mise en ligne. <a href="../../mission-15.md">Rapport final</a> · <a href="../walker-menu/index.html">15C</a> · <a href="../snow-sky/index.html">15B</a> · <a href="../index.html">15A</a>.</p><a href="comparison.jpg"><img src="comparison.jpg" alt="Mission 14 et Mission 15, vrais rendus"></a><h2>Promenade et événements natifs</h2><p>Une vraie session continue de {soak['elapsedSeconds']:.1f} secondes et {soak['distanceMetres']:.1f} m cumulés. Trois extraits de cette session, deux comparaisons natives M14/M15 et une inspection de fumée. Les inspections rares sont déclarées ; aucune accélération, aucun trajet imposé pendant les films. La cheminée d’inspection est silencieuse ; les autres pistes sont le vrai bus audio. Les films de canevas excluent les contrôles HTML, montrés séparément.</p><div class="grid">{video}</div><h2>Avant / après</h2><p>Vrai moteur, mêmes caméras, soleil et vent. Neige de toiture : dépôt diagnostique verrouillé, ciel clair identique ; M14 n’a pas de neige. Vue rapprochée du modèle distincte de sa taille apparente en vol.</p><div class="grid">{photos}</div><h2>Menu et toucher</h2><div class="grid">{ui}</div><h2>Preuves et reproduction</h2><p><a href="soak.json">Trente minutes réelles</a> · <a href="soak-trace.json.gz">Trace</a> · <a href="performance-summary.json">324 rendus comparatifs</a> · <a href="components.json">486 rendus par effet</a> · <a href="rarity.json">Rareté simulée</a> · <a href="chimneys.json">Cheminées interprétées</a> · <a href="starts.json">Départs</a> · <a href="runtime.json">Physique et replis</a> · <a href="life-runtime.json">Ressources et réinitialisations</a> · <a href="media.json">Décodage et paquets</a> · <a href="audit.json">Droits et préservation</a> · <a href="validation.json">Validation finale</a> · <a href="README.md">Reproduire</a>.</p><p>Mesures SwiftShader uniquement ; aucun FPS de GPU physique ou Android revendiqué. Les effets ne documentent ni trafic réel, ni occupation réelle de maisons. Arrêt pour votre revue artistique, sans fusion ni déploiement.</p></main></html>''')
print('Wrote final Mission15 report,15C archive,comparison and gallery')
