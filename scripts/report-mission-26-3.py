import json,pathlib,datetime,subprocess
r=pathlib.Path('docs/mission-26-3-evidence')
def load(p,default=None):
 try:return json.loads((r/p).read_text())
 except FileNotFoundError:return default

def proof(path):
 d=load(path,{})
 return d,d.get('travel',{})
foot,ft=proof('travel/Chauvigny-foot-21km-foot.json');angles,at=proof('travel/spawn-east-dense-avoid-water-foot.json');car,ct=proof('predictive/Vallee-stop-car-40km-car.json')
allcar=[]
for p in r.glob('*/*car-80km-car.json'):
 d,t=proof(str(p.relative_to(r)))
 if t:allcar.append((str(p.relative_to(r)),d,t))
passed=[q for q in allcar if q[1].get('functionalSuccess')and q[2].get('completed')and q[2].get('distanceM',0)>=80000]
longpath,longcar,lt=max(passed or allcar,key=lambda q:q[2].get('distanceM',0))
seams=load('seam-strips.json',{});offroad=load('offroad-complete.json',{});gait=load('visual-regressions/candidate-physical-gait.json',{});water=load('river-1-priority.json',{});network=load('streaming-network-corrected.json',{});reload=load('reload-corrected.json',{});verification=load('verification.json',{});performance=load('performance.json',{});preservation=load('preservation.json',{})
bestarea=offroad.get('travel',{});gaitpass=sum(c.get('longestConsecutiveMovingSeconds',0)>=180 for c in gait.get('cases',[]));seampass=sum(c.get('functionalSuccess',False)for c in seams.get('cases',[]))
parking=car.get('parkingAndWalking',{});ret=foot.get('returnAndResume',{});waterdistance=water.get('travel',{}).get('distanceM',0)
def gps(d,where='end'):
 return d.get(where,{}).get('gps')
def tiles(t):return sorted(set(q.get('canonicalTile')for q in t.get('trace',[])if q.get('canonicalTile')))
def metadata(d,t):return dict(codeSHA=d.get('sourceSHA'),startGPS=gps(d,'start'),arrivalGPS=gps(t)if t.get('completed')else None,lastGPS=gps(t),physicalDistanceM=t.get('distanceM'),tiles=tiles(t),wallSeconds=t.get('wallSeconds'),simulationSeconds=t.get('simulatedSeconds'),method=d.get('method'),refusal=(t.get('failureState')or{}).get('reason'),errors=d.get('errors',[]))
def scenario(id,name,status,result,evidence,limits='',d=None,t=None):
 return dict(id=id,scenario=name,status=status,result=result,evidence=evidence,limits=limits,**(metadata(d,t)if d else dict(codeSHA=None,method='See linked protocols; no route length is substituted for physical travel.')))
sc=[
 scenario('V01','Chauvigny ≥20 km et reprise','ATTEINT'if ft.get('completed')and ret.get('completed')else'PARTIEL',f"{ft.get('distanceM',0):.2f} m, arrivée, {len(tiles(ft))} tuiles ; retour {ret.get('returnDistanceM',0):.2f} m ; reprise du point sauvegardé pendant le voyage.",['travel/Chauvigny-foot-21km-foot.json','communes-trace.json'], 'Accéléré ; reprise normale dans la même page. Le reload de page est vérifié séparément, sans l’attribuer rétroactivement à ce voyage.',foot,ft),
 scenario('V02','Vrai spawn Angles →3 tuiles','ATTEINT'if at.get('completed')and len(tiles(at))>=3 else'PARTIEL',f"{at.get('distanceM',0):.2f} m, {len(tiles(at))} tuiles canoniques, arrivée depuis le spawn intact.",['travel/spawn-east-dense-avoid-water-foot.json','communes-trace.json'], 'Les tuiles couvrent la frontière administrative ; un échantillon longe Lurais/Indre. L’arrivée exacte est à Angles selon API Geo. Pas de nouvelle acquisition hors Vienne.',angles,at),
 scenario('V03','Coutures et hors chaussée','PARTIEL',f"{seampass}/27 bandes aller-retour ; traversée totale de {bestarea.get('distanceM',0):.2f} m, dont {bestarea.get('offRoadDistanceM',0):.2f} m hors chaussée mesurés à chaque pas.",['seam-strips.json','offroad-complete.json','offroad.json','offroad-verified.json','offroad-verified-retry.json'],'Rue du Pont historique reste distinct et non retesté ici. OSM access=yes est une admission de jeu, pas une preuve cadastrale.'),
 scenario('V04','Raccord automobile 3,883 km','ATTEINT','Même corridor historique dépassé jusqu’à l’arrivée du 40 km ; trou de chaussée corrigé, quatre coins de coque et triangles visibles exportés.',['geometry-comparison.json','geometry-comparison.svg','geometry-reference-3d/visible-mesh.obj','geometry-candidate-3d/visible-mesh.obj','predictive/Vallee-stop-car-40km-car.json'],'Le premier carrefour de Chauvigny est suivi séparément ; il ne faut pas le déclarer réparé par cette seule preuve.',car,ct),
 scenario('V05','Voiture ≥40 km puis ≥200 m à pied','ATTEINT'if car.get('functionalSuccess')and ct.get('distanceM',0)>=40000 and parking.get('completed')else'PARTIEL',f"{ct.get('distanceM',0):.2f} m jusqu’à l’arrivée ; parking, sortie et {parking.get('distanceM',0):.2f} m à pied.",['predictive/Vallee-stop-car-40km-car.json','visual-regressions/candidate-native-car-junction-verified.json','visual-regressions/candidate-native-car.json','reload-corrected.json','communes-trace.json'],'Simulation accélérée, coque active. La prise native corrigée documente frontière/carrefour/arrêt/sortie/reprise en68frames à1,57FPS ; ce n’est pas une preuve de fluidité. Les premiers protocoles incomplets sont conservés.',car,ct),
 scenario('V06','Voiture ≥80 km jusqu’à l’arrivée','ATTEINT'if passed else'NON ATTEINT',(f"{lt.get('distanceM',0):.2f} m, destination physiquement atteinte."if passed else f"Plus grand essai archivé : {lt.get('distanceM',0):.2f} m, sans arrivée ; ne valide pas 80 km."),[longpath], 'Le trajet aller-retour est déclaré. Les déplacements de manœuvre sont réels ; aucun itinéraire calculé n’est compté comme accompli.',longcar,lt),
 scenario('V07','Nouveau packraft ≥1 km','PARTIEL',f"Clain : suivi physique {waterdistance:.2f} m, retour à la berge {water.get('recovery',{}).get('distanceM',0):.2f} m, débarquement et marche {water.get('afterDockWalk',{}).get('distanceM',0):.2f} m.",['river-1-priority.json','river-0.json','river-2-warm.json','river-3-final.json','river-4-cycle.json','clain-diameter-plan.json'],'Seuil de corridor ≥1 km NON ATTEINT. Ne pas additionner aller et retour pour le fabriquer. Cinq secteurs essayés ; profondeur/courant/niveau estimés, ouvrages inconnus fermés.'),
 scenario('V08','Streaming borné et reprise','PARTIEL','HTTP503 retardé : arrêt devant la tuile manquante, clic de reprise sans déplacement, franchissement par le même acteur.'if network.get('functionalSuccess')else'Essai navigateur de reprise incomplet.',['streaming-network-corrected.json','streaming-network.json','tests.log','travel/Chauvigny-foot-21km-foot.json'],'Annulation ignorée, génération périmée, éviction et délais aussi couverts en unités ; matrice navigateur non exhaustive. Tâches >50ms encore observées.'),
 scenario('V09','Démarche/course, plat/pente,4 vues','PARTIEL',f"{gaitpass}/16 reprises atteignent 180 s simulées réellement consécutives. Films natifs disponibles, perceptif NON VALIDÉ.",['visual-regressions/candidate-physical-gait.json','visual-regressions/candidate-checked-native.json','visual-regressions/reference-checked-native.json'],'Rig inchangé. Premières captures fonctionnelles parfois cadrées trop bas ; films récents cadrent les pieds. L’ancien banc et ses erreurs restent conservés. Pas de certification de naturel.'),
 scenario('V10','Oiseaux et quatre familles d’ombres','PARTIEL','Hystérésis de casters8m testée ; films natifs Éco/Équilibré/Qualité et états initiaux appariés.',['visual-regressions/candidate-checked-native.json','visual-regressions/reference-checked-native.json','visual-regressions/paired-comparison.json'],'Instances d’oiseaux déclarées par le moteur, visibilité et fluidité non certifiées. Shimmer, pixel et cohérence du vent non résolus perceptivement. Pas de nouvelle correction du vol.'),
 scenario('V11','Performances et endurance','PARTIEL','Benchmarks isolés et intervalles bruts ; deux sessions murales >30min sur versions intermédiaires.',['performance.json','reference-benchmarks.json','candidate-benchmarks.json','endurance.json','endurance-recovery.json','terrain-equivalence.json'],'SwiftShader : 60/30FPS matériel NON VALIDÉ. ≤8ms / aucune tâche >50ms / ≤5% non démontrés. Endurance à stations indépendantes, sans la présenter comme30min de trajet natif continu.'),
 scenario('V12','Conservation, tests et reproduction','ATTEINT'if preservation.get('oldEvidence',{}).get('unchanged')and verification.get('tests',{}).get('fail')==0 and reload.get('functionalSuccess')else'PARTIEL',f"{verification.get('tests',{}).get('pass',0)} tests réussis ; données/anciens rapports conservés ; reload réel conduite et marche ; PR38 en brouillon.",['verification.json','preservation.json','baseline.json','reload-corrected.json','REPRODUCTION.md','pr-before-delivery.json'],'Voir les SHA réellement exécutés et reçus de builds. Les comparaisons de versions et limites des anciens conducteurs sont explicites. Aucun merge, achat ou déploiement.')]
# Each scenario resolves its linked executions separately; no borrowed gait SHA.
for c in sc:
 observations=[]
 for path in c['evidence']:
  if not path.endswith('.json'):continue
  d=load(path,{})
  if not isinstance(d,dict)or not d.get('sourceSHA'):continue
  t=d.get('travel',{});start=d.get('start',d.get('before',{}));end=t.get('end',d.get('end',d.get('after',{})))
  receipts=[]
  for receipt in sorted((r/'builds').glob('*/receipt.json')):
   if json.loads(receipt.read_text()).get('sourceCommit')==d['sourceSHA']:receipts.append(str(receipt.relative_to(r)))
  observations.append(dict(evidence=path,codeSHA=d['sourceSHA'],sameSourceBuildReceipts=receipts,buildLimit='Receipts sharing source SHA; instrumentation may differ. Use the exact archived bundle and protocol for identity, not a reconstruction with later helpers.',sourcePolicy='Existing OSM/IGN source manifests and preserved licences; no new geographic acquisition.',startGPS=start.get('gps'),arrivalGPS=end.get('gps')if t.get('completed')else None,lastGPS=end.get('gps'),physicalDistanceM=t.get('distanceM'),offRoadDistanceM=t.get('offRoadDistanceM'),tiles=tiles(t),wallSeconds=t.get('wallSeconds',d.get('wallSeconds')),simulationSeconds=t.get('simulatedSeconds',d.get('simulationSeconds',d.get('counter',{}).get('simulationSeconds'))),renderedFps=d.get('averageRenderedFps'),method=d.get('method'),refusal=(t.get('failureState')or{}).get('reason'),unrecordedFields='Null means not recorded by that protocol; nested cases and local geometry remain in the raw file. No inferred GPS, duration or FPS.'))
 c['executions']=observations
 if not c.get('codeSHA')and observations:c['codeSHA']=observations[0]['codeSHA']
assert len(sc)==12 and [c['id']for c in sc]==[f'V{i:02}'for i in range(1,13)]
acceptance={'mission':'26.3','overallStatus':'PARTIEL','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'referenceExecutedM262':'58ba496050f7541a63599c28a1a553f7f0b453e9','referenceDeliveryM262':'0e51a60a95d65dbc1dccc647dfe2a40da7493636','dataPin':'acb0a73b396229bf90731b90a558a8d5d072a9ec','environment':{'renderer':'Chromium Linux / ANGLE SwiftShader, software Vulkan','physicalGPUValidated':False,'phoneHardwareValidated':False,'acceleratedViewport':[320,210],'nativeViewport':[800,600],'benchmarkViewport':[640,420],'dpr':1,'sound':'Enabled in corrected native/benchmark protocols; early multi-case gait harness toggled audio in some cases, visible in snapshots. Physical180s results do not claim audio/performance acceptance.'},'statuses':['WAITING_FOR_TILE','RETRYABLE_BLOCKED','PHYSICAL_BLOCKED','SOURCE_UNKNOWN','ERROR','COMPLETED'],'scenarios':sc}
(r/'acceptance.json').write_text(json.dumps(acceptance,indent=2,ensure_ascii=False)+'\n')
# Every failed geographic attempt remains a distinct defect observation, without
# pretending that its steering failure proves source geography impossible.
defects=[]
for p in sorted(r.glob('*/*.json')):
 d=load(str(p.relative_to(r)),{});t=d.get('travel')if isinstance(d,dict)else None
 if not isinstance(t,dict)or t.get('completed')or not d.get('chosen'):continue
 reason=(t.get('failureState')or{}).get('reason')or((t.get('end',{}).get('movement')or{}).get('obstruction')or{}).get('reason')or'physical-target-nonprogress'
 defects.append(dict(priority='P0',status='OBSERVED_ATTEMPT',name=str(p.relative_to(r)),gps=gps(t),tile=(t.get('failureState')or{}).get('ground',{}).get('tile'),way=(t.get('failureState')or{}).get('ground',{}).get('road'),reason=reason,sourceSHA=d.get('sourceSHA'),physicalDistanceM=t.get('distanceM'),impact='This selected controller attempt did not arrive.',cause='See actual support/pose/input and source at the stop. An outside-corridor corner or passed target is not evidence that the whole source road is geographically impossible.',reproduction='Use chosen.from/to/mode and its recorded build; original raw evidence retained.',possibleCorrection='Choose legitimate controls/source alternative; never open unknown land, remove an obstacle, or reposition during travel.',evidence=str(p.relative_to(r))))
for name,cause,evidence in [('Nouveau corridor1km','Only886.04m followed on the demonstrated Clain corridor; longer verified corridor not demonstrated.','river-1-priority.json'),('Animations et oiseaux','No physical-GPU/human perceptual validation; character and bird source rigs unchanged.','visual-regressions/candidate-checked-native.json'),('Ombres','Caster hysteresis is a limited correction; shimmer/pixel/wind quality remains unvalidated.','visual-regressions/paired-comparison.json'),('Préparation/performance','Observed tasks>50ms and software FPS; no hardware budget or ≤5% acceptance.','performance.json'),('Rue du Pont héritée','Original detailed-pilot defect not silently closed by the27 exit strips.','../mission-26-2-evidence/residual-defects.json')]:defects.append(dict(priority='P0',status='OPEN',name=name,cause=cause,evidence=evidence))
(r/'residual-defects.json').write_text(json.dumps({'scope':'Residual product requirements plus all retained failed attempt observations. A later success does not erase an earlier failure.','defects':defects},indent=2,ensure_ascii=False)+'\n')
def fmt(v):return f'{v:,.2f}'.replace(',','\u202f').replace('.',',')
def coord(g):return 'non relevé'if not g else f"{g['lat']:.6f} N / {g['lon']:.6f} E"
def table():return '\n'.join(f"|{c['id']}|{c['scenario']}|**{c['status']}**|{c['result']} [Preuve](mission-26-3-evidence/{c['evidence'][0]})|"for c in sc)
performance_table='|Version|Scène|Profil|N|P50 ms|P95 ms|P99 ms|Max ms|FPS moyen|\n|---|---|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join('|'+ '|'.join([b['label'],c['scene'],c['profile'],str((c.get('frameMs')or{}).get('samples',0)),*[f'{(c.get("frameMs")or{}).get(k,0):.2f}'for k in ['p50','p95','p99','max']],f'{c.get("averageFps",0):.2f}'])+'|'for b in performance.get('benchmarks',[])for c in b.get('cases',[]))
report=f'''# Mission26.3 — Voyages débloqués, livraison encore partielle

## 1. Verdict simple

**La Vienne reste partiellement jouable.** Deux blocages majeurs de marche sont franchis : **{fmt(ft['distanceM'])}m depuis Chauvigny jusqu’à l’arrivée**, et **{fmt(at['distanceM'])}m depuis le vrai spawn d’Angles à travers trois tuiles**. La voiture accomplit **{fmt(ct['distanceM'])}m jusqu’à une arrivée déclarée**, puis stationne et laisse le joueur marcher **{fmt(parking.get('distanceM',0))}m**.

{sc[5]['result']} Le nouveau packraft fonctionne sur le Clain : **{fmt(waterdistance)}m suivis**, prise manuelle, arrêt, retour et débarquement, puis marche. **Le corridor≥1km demandé n’est pas démontré.** La démarche, les oiseaux et les ombres ne reçoivent aucune validation perceptive sur ce GPU logiciel. Les objectifs essentiels ouverts maintiennent **la PR38 en brouillon, non prête à fusionner**.

[Galerie autonome](mission-26-3-evidence/index.html) · [V01–V12 machine](mission-26-3-evidence/acceptance.json) · [Reproduction](mission-26-3-evidence/REPRODUCTION.md) · [Architecture](mission-26-3-architecture.md).

## 2. Comparaison M26.2 → M26.3

|Constat de référence|Cause et correction réelle|Résultat mesuré|
|---|---|---|
|Rapport : marche arrêtée à12966,98m ; nouvelle exécution du programme58ba :11902,92m|Le contact attend une tuile ; le délai réseau pouvait expirer pendant l’attente de l’installateur. Générations, délais séparés, états bornés, priorités physiques et bouton de reprise.|Arrivée à21034,73m,7 tuiles. Les différences de distance d’arrêt des reprises asynchrones sont conservées.|
|Voiture annoncée à3882,77m ; reprise58ba à3904,83m, même voie927245732|Au point46,577320 /0,631644, absence de triangle routier : retour au terrain, puis saut d’environ15cm vers la chaussée voisine. Sections mitrées et phase source commune avant découpage par tuile.|Contact/raycast sur chaussée corrigée ; parcours historique dépassé et40km achevés. Tolérances de coque inchangées.|
|25/27 bandes de sortie|La seule pente normale du dévers fermait toutes les directions. La marche sur route admise réutilise le contrôle directionnel et les atterrissages du même contrôleur.|27/27 aller-retour ; seuil de pente0,7 et marche18cm conservés ; eau/rail/privé/inconnu restent fermés.|
|Préparation lente et banques d’eau vides|Priorité−2 au détail requis,−1 au contact acteur ; copie/projection de terrain réutilisée ; cache aquatique lié à la révision de contact, support sec lié à la chaussée réellement admise.|Buffers terrain strictement identiques sur6 comparaisons ; projections65541→16646. Le Clain devient lançable, navigable et débarquable. Pas de réussite générale≤8ms.|
|Trafic arrêté aux fins d’horizons ; oscillation de casters|Prolongation sur liens sources, cycles distingués des impasses ; hystérésis8m des identités de casters.|Tests ciblés verts ; conflits de circulation et qualité d’ombre globale restent ouverts.|

Les essais échoués sont [tous conservés](mission-26-3-evidence/journeys.json), avec refus et versions. Un défaut du conducteur de preuve est distingué d’une correction du moteur : commandes anticipées, nœuds dépassés, manœuvres sur une copie du contrôleur, puis réexécution physique. Aucune position calculée par une sonde n’est appliquée au vrai acteur.

## 3. Table V01–V12

|ID|Critère|Statut|Observation et preuve|
|---|---|---|---|
{table()}

## 4. Voyages réellement accomplis

**Chauvigny → Vouneuil-sur-Vienne.** Départ{coord(gps(foot,'start'))}, arrivée{coord(gps(ft))}. API Geo confirme des points réellement parcourus à Chauvigny, Bonnes, Bellefonds, Bonneuil-Matours et Vouneuil-sur-Vienne. {len(tiles(ft))}tuiles, {fmt(ft['distanceM'])}m, {fmt(ft['wallSeconds'])}s murales, {fmt(ft['simulatedSeconds'])}s simulées. Sauvegarde créée après10km ; retour physique de{fmt(ret.get('returnDistanceM',0))}m ; reprise normale avec erreur de position{ret.get('resumeErrorM',0):.3g}m et dérive relâchée{ret.get('releasedInputDriftM',0):.3g}m. Ce test de reprise reste distinct du vrai reload de page effectué séparément.

**Angles, spawn historique intact.** Départ{coord(gps(angles,'start'))}, arrivée{coord(gps(at))}. Tuiles{', '.join(tiles(at))}. Le corridor évite la sortie Saint-Pierre problématique par des voies sources réellement marchées. Les tuiles canoniques ne sont pas des communes : un échantillon intermédiaire est classé Lurais/Indre, près de la frontière ; l’arrivée exacte est classée Angles-sur-l’Anglin. Aucun agrandissement de données n’en découle.

**Bonnes → Moulismes en voiture.** Départ{coord(gps(car,'start'))}, arrivée{coord(gps(ct))}. Les échantillons administratifs confirment Bonnes, Valdivienne, Civaux, Lussac-les-Châteaux et Moulismes ; ce n’est pas un inventaire exhaustif de toutes les limites. {len(tiles(ct))}tuiles, {fmt(ct['wallSeconds'])}s murales et {fmt(ct['simulatedSeconds'])}s simulées. Parking, sortie,205,13m à pied ; déplacement de1,16m après sauvegarde, reprise avec erreur{parking.get('resumePositionErrorM',0):.3g}m.

**Voiture80km :** {sc[5]['result']} [Trace et méthode](mission-26-3-evidence/{longpath}). Les voies rapides ou ouvrages inconnus ne sont pas ouverts pour atteindre une distance. Les alternatives restent soumises aux sources, à la direction admise et à la coque.

**Arrêt final du80km :** {coord(gps(lt))}, D749 Route de la Tour au Cognum, `osm:way:1214545135`, tuile127:1610. Après l’aller, un véritable demi-tour et le retour incluant la N147, la coque refuse `steep-support`. Le centre de chaussée a une pente de3,50% ; le coin exact refusé n’a pas été exporté dans cet essai. Au centre, le terrain et la route diffèrent de0,612m : cet écart mesuré mérite un audit de cohérence, sans suffire à établir la cause du coin refusé. Vingt-quatre manœuvres bornées n’ont pas permis de repartir. Ce constat ne prouve pas que toute la D749 est infranchissable.

**Clain / Poitiers.** Embarquement{coord(water.get('launch',{}).get('state',{}).get('gps'))}. Suivi886,04m, commande manuelle interrompant le suivi, arrêt, retour957,86m, débarquement puis2,13m à pied. Les957,86m de retour ne transforment pas ce corridor en corridor≥1km. Vauchiron, Chauvigny, Châtellerault et La Roche-Posay ont aussi des essais conservés ; composant court, accès refusé ou préparation non achevée sont distingués. Le double balayage du graphe du Clain est un calcul exploratoire, pas une borne supérieure ni une navigation.

La [carte](mission-26-3-evidence/index.html) sépare vert(fin physique du composant ou arrivée), rouge(critère ou parcours incomplet), gris pointillé(source calculée). Distances : somme des déplacements horizontaux de la racine à chaque pas ; GPS échantillonné et altitude IGN69 séparés. Les restaurations, transitions de porte et placements indépendants ne gonflent pas les odomètres. Pas explicite≤0,25s, contrôleurs et collisions actifs ; ce n’est pas une expérience native en temps réel.

## 5. Animation et ombres

Les16 reprises marche/course, plat/pente, face/dos/profils, atteignent chacune180s simulées consécutives avec activité et vitesse réelles. Leurs traces contiennent les appuis, poses et refus. **Le rig du personnage n’a pas été modifié** : les correctifs de support ne sont pas présentés comme la disparition perceptive du tremblement. L’ancien banc court, des erreurs d’initialisation diagnostique et des cadrages trop bas sont conservés. Le protocole natif corrigé cadre les pieds en800×600 et garde les originaux.

Films natifs avant/après, trois profils pour forêt/oiseaux/ombres : cadence logicielle de l’ordre de0,4–1,7FPS selon les prises, temps simulé publié séparément. Les paramètres/matrices des états initiaux sont dans les preuves appariées ; le sous-ensemble climatique exporté ne certifie pas toute la météo réelle identique. Le nombre d’instances d’oiseaux ne prouve pas leur visibilité ou un vol naturel à l’écran. Aucune nouvelle correction du vol n’est revendiquée. L’hystérésis de casters traite une cause de popping ; shimmer, pixellisation et accord perceptif avec le vent restent non validés. La revue GPU pratique est décrite dans la reproduction ; aucun `ATTEINT` artistique.

## 6. Performances

[Mesures et intervalles bruts](mission-26-3-evidence/performance.json). Benchmarks sans encodeur et sans autre campagne de rendu,640×420 DPR1, sons et effets du profil actifs : forêt, pont, berge, Poitiers, voiture, bateau et carte sous trois profils. P50/P95/P99/max et échecs sont publiés ; petits échantillons et phases/caméras non appariées interdisent de certifier≤5%.

L’équivalence terrain conserve positions/couleurs/indices/coutures sur les six cas. Les pas de générateur et copies sont découpés ; les dépassements>50ms restent réels et recensés, notamment eau/préparation urbaine. `performance.now()` donne du temps écoulé, incluant préemption/GC, pas un CPU exclusif. Les coûts des bancs accélérés ne sont pas confondus avec la campagne native isolée.

Endurance :1820,62s et1993,05s murales sur versions intermédiaires, dans une même page par session, avec stations diagnostiques déclarées, chargements/évictions, carte et changements d’activité. La seconde charge14tuiles et en évince5 ; des délais échouent. Son heap observé varie de406,11à1319,80Mo, le résident final vaut82,58Mo. Dans les benchmarks, les résidents observés vont de8,69à68,05Mo ; ces valeurs ne constituent pas une preuve d’absence de fuite. Ce n’est ni30min de trajet géographique continu, ni un test natif matériel final. **≤8ms, absence totale de>50ms,60FPS desktop et30FPS téléphone restent non démontrés.**

{performance_table}

La plus longue tâche observée dans ces benchmarks est de{performance.get('maxObservedNativeBenchmarkLongTaskMs')}ms (référence, berge, Équilibré). Les21cas de chaque version terminent sans erreur. Les coûts de préparation détaillés et leurs coordonnées sont dans le JSON ; ils ne sont pas des temps CPU exclusifs.

## 7. Préservation, données, licences et Git

[Inventaire et hashes](mission-26-3-evidence/preservation.json), [versions gelées](mission-26-3-evidence/builds/) et [audit](mission-26-3-evidence/verification.json). Les anciens rapports et preuves sont inchangés. Les données/sons/textures/bâtiments d’Angles,499packs de relief2m et leurs licences restent conservés ; pin`acb0a73b396229bf90731b90a558a8d5d072a9ec`,1407876165octets. Le staging existant exclut ces packs de l’artefact du site et le runtime les demande avec SHA à proximité ; aucune acquisition nouvelle.

Référence exécutée58ba496050f7541a63599c28a1a553f7f0b453e9 ; livraison antérieure0e51a60a95d65dbc1dccc647dfe2a40da7493636(src/public équivalents). Chaque essai indique le SHA exécuté ; les commits de documentation/métadonnées ne changent pas rétroactivement ce programme. Sources : IGN/MNT et OSM selon les [licences conservées](../public/planet/fr-86/LICENSE.md), API Geo/Licence Ouverte2.0 pour les communes. Relief fin dérivé et profondeurs de jeu ne sont pas des mesures de sécurité réelle.

{verification.get('tests',{}).get('pass',0)}tests réussis, compilation et contrôles navigateur documentés. Carte desktop/tactile, mémoire source, activités, sauvegardes et vrai reload conduite/marche sont vérifiés dans leur périmètre. Les fumées de région synthétique ne comptent pas comme des kilomètres de Vienne. Trains/avions gardent le socle existant, sans nouveau service passager.

Branche`mission/26-vienne-planet-engine`, PR38 ouverte et en brouillon. `main` observé à`01e791be64cefae2eb1e90ab465f9bf0b848c33e`. M25.2(tête110b4548 et merge5fe6e792) reste ancêtre de cette branche, absent de main. **Aucun achat, abonnement, merge, déploiement ni workflow de production modifié.**

## 8. Défauts restants et décision

[Registre géolocalisé](mission-26-3-evidence/residual-defects.json). {('Le80km est accompli, mais'if passed else'Le80km non arrivé reste un P0 ;')} le nouveau corridor fluvial≥1km, la validation perceptive et les budgets de préparation/performance empêchent de déclarer la mission pleinement réussie. Le premier carrefour de Chauvigny et Rue du Pont restent identifiés tant que leur propre reprise ne les ferme pas ; une réussite sur une autre route ne les efface pas.

**Décision : livraison corrective partielle, PR maintenue en brouillon.** Les voyages accomplis sont consultables, les échecs restent visibles, et aucune fusion automatique n’est effectuée. Les limites non testées ou non atteintes ne sont pas remplacées par une distance de graphe, un compteur vert ou une vidéo accélérée.
'''
import re
report=report.replace('Mission26.3','Mission 26.3')
parts=re.split(r'(`[^`]*`|\]\([^)]*\))',report)
report=''.join(part if i%2 else re.sub(r'(?<=\d)(ms|km|cm|mm|m|s|FPS|tests|tuiles|octets|min)\b',r' \1',part)for i,part in enumerate(parts))
pathlib.Path('docs/mission-26-3.md').write_text(report)
print([(c['id'],c['status'])for c in sc])
