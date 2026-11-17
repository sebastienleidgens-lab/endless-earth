"""Consolidate existing receipts. Missing evidence never becomes a success."""
import json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/mission-26-1-evidence'
def load(name,default=None):
    p=OUT/name
    return json.loads(p.read_text()) if p.is_file() else default
PROGRAM=load('builds/candidate-final/receipt.json')['runtime']['sourceCommit']
REFERENCE='de3958c6c55b9ef9856d5809b14ef3d41ed8e4b5'
DATA='acb0a73b396229bf90731b90a558a8d5d072a9ec'
rows=[]
def add(id,title,status,files,reason='',unverified=False,sha=PROGRAM):
    evidence=[]
    for name in files:
        p=ROOT/name if name.startswith(('docs/','public/','src/','tests/','scripts/')) else OUT/name
        if not p.is_file():raise FileNotFoundError(str(p))
        evidence.append(p.relative_to(ROOT).as_posix())
    rows.append({'id':id,'title':title,'status':status,'evidence':evidence,'sourceSHA':sha,'failureReason':reason or None,'unverified':unverified})

add('git','Base et ascendance consolidées','ATTEINT',['git-ancestry.json'],'Portée : M25.2 et M26 sont conservées. La décision de fusion reste au propriétaire.')
add('coordinates','Coordonnées, datum et généralisation mondiale','PARTIEL',['docs/mission-26-1-architecture.md','tests/planet.test.mjs'],'WGS84 et IGN69 conservés ; la physique garde le repère régional historique. Aucun moteur géocentrique mondial complet validé.',True)
add('origin','Origine flottante intégrée au rendu et au son','PARTIEL',['origin-eco.json','origin-balanced.json','origin-quality.json','src/planet/render-origin.ts'],'Rebases et invariance numérique contrôlés sur trois profils avec voix actives. Écoute perceptive et tous les acteurs distants non certifiés.',True)
add('fixture','Second manifeste hors projection française','PARTIEL',['public/planet/validation-other-frame/manifest.json','tests/planet.test.mjs'],'Fixture synthétique et composants/projection testés ; aucune session native complète du jeu avec cet autre manifeste.',True)
add('access-policy','Refus des restrictions et niveaux cartographiés','PARTIEL',['tests/planet.test.mjs','src/planet/network.mjs'],'Cas privés/no, bridge=yes, tunnel=yes et niveaux testés. Autres variantes/conditions et accès par classe restent incomplets ou inférés ; aucun certificat juridique de terrain.',True)
add('seam','Couture complète pilote–département','PARTIEL',['seam-strips.json','angles-west-final.json','public/planet/fr-86/navigation/pilot-boundary.json'],'Des sondes restent infranchissables ; pas de validation exhaustive zéro trou/LOD, toutes saisons, tous modes.',True,sha='78b6ef61b1bb2aeab1529cd6b9ceca3a92598d84')
add('legacy-seams','Rue du Pont et résidus hérités','NON ATTEINT',['docs/mission-23.md','docs/mission-26.md'],'Le maillage historique est préservé. La fermeture ciblée du résidu hérité et de tous les micro-vides n’est pas démontrée.',True)
add('fine-data','499 dérivés IGN de contact à 2 m','ATTEINT',['contact-audit.json','contact-coverage.svg','public/planet/fr-86/contact-2m/manifest.json'],sha=load('contact-audit.json')['sourceSHA'])
add('lod','LOD et même support visible/physique','PARTIEL',['tests/planet-contact.test.mjs','src/planet/terrain-lod.mjs','src/planet/mesh-support.mjs','seam-strips.json'],'Concordance locale et contrats testés. Pas de certification millimétrique globale, de toutes les bascules ni de toute la géographie.',True)
add('landscapes','Biomes, paysages et liberté hors routes','PARTIEL',['src/planet/render.ts','src/planet/surface.mjs','docs/mission-26-1-data.md'],'Forêts et bâtiments départementaux restent simplifiés ; pas d’inventaire d’essences ni d’admission générale des terrains publics hors corridors.',True)
add('stations','Toutes les stations visuelles demandées','NON ATTEINT',['reference-session-1.json','candidate-capture.json'],'La campagne Angles ne couvre pas l’ensemble des centres, plateaux, forêts, échangeur, gare et aéroport demandés.',True)
add('preparation','Préparation sans tâche principale ≥50 ms','PARTIEL',['smoke.json','department-water.json','src/planet/work-queue.mjs'],'Le découpage et les workers réduisent le travail synchrone, mais des lots mesurés dépassent encore 50 ms. La cible ne passe pas.')
add('memory','Budgets, éviction et ressources','PARTIEL',['preservation.json','candidate-capture.json','src/planet/tile-manager.mjs'],'96 MiB bornent le compteur d’octets JSON déclarés et de rasters typés, pas les allocations JS réelles, graphes, worker/GPU/audio. Endurance multi-tuiles et fuite globale non certifiées.',True)
add('network','Perte réseau, cache et reprise','PARTIEL',['src/planet/runtime.ts','src/planet/tile-manager.mjs'],'Retry et annulation sont intégrés. Rechargement hors ligne complet et matrice de coupures pendant tous les modes non validés.',True)
add('walking-controller','Contrôleur depuis Angles, sortie et retour','ATTEINT',['angles-west-final.json'],'Portée : simulation accélérée du vrai noyau de mouvement, route de Vicq, pas un film natif ni une traversée départementale.',sha='78b6ef61b1bb2aeab1529cd6b9ceca3a92598d84')
native=load('angles-native-departure.json',{})
add('walking-native','Départ natif Angles → sortie → retour','ATTEINT' if native.get('completed') else 'NON ATTEINT',['angles-native-departure.json'] if native else ['angles-west-final.json'],'' if native.get('completed') else native.get('failure','Aucun voyage natif complet constaté.'),not native.get('completed',False))
add('department-traverse','Grande traversée à pied, plusieurs communes et tuiles','NON ATTEINT',['routes-audit.json','angles-controller.json','angles-west-final.json'],'La connectivité topologique et le petit aller-retour ne constituent pas une simulation intégrale ni un voyage natif entre deux côtés du département.',True)
native_summary=load('native-summary.json',{'cases':[]})
def select_run(version,mode,view):
    candidates=[c for c in native_summary['cases'] if c['file'].startswith(version+'-') and f'-{mode}-{view}.json' in c['file']]
    return max(candidates,key=lambda c:c['longestConsecutiveRunningSeconds'],default=None)
run_cases=[select_run(v,m,a) for v in ['candidate','reference'] for m in ['run-flat','run-terrain'] for a in ['front','rear','left','right']]
run_ok=all(c and c['run180Passed'] for c in run_cases)
add('run-duration','180 s natives consécutives, quatre vues, plat et pente','ATTEINT' if run_ok else 'PARTIEL',['native-summary.json','run-routes.json'], 'Portée : durée observée et état course ; les reprises conservent leurs SHA propres et ne certifient pas le naturel. Les prises initiales trop courtes restent archivées.' if run_ok else 'La vue droite sur pente reste en échec : meilleure prise 177,61 s ; reprise interrompue après 98,78 s de course et 24,91 m. Cause précise du blocage non isolée, aucune collision supprimée.',not run_ok,sha='78b6ef61b1bb2aeab1529cd6b9ceca3a92598d84')
add('gait','P0 voyageur : naturel, démarrage, contacts et caméra','NON ATTEINT',['candidate-gait.json','reference-gait.json','native-summary.json'],'Gait et rig restent identiques à M26 ; pics numériques et validation perceptive ouverts. Les filtrages qui dégradaient le pied planté ont été retirés.',True)
add('car','Voiture, grands trajets intercommunaux et A10','PARTIEL',['src/planet/car.mjs','routes-audit.json'],'La physique et les couloirs source fonctionnent sur de courts essais ; plusieurs grands voyages, jonctions et A10 ne sont pas démontrés.',True)
add('traffic','Trafic varié, voies et priorités','PARTIEL',['src/planet/traffic.mjs','src/planet/transport.ts'],'Agents automobiles simples ; pas de système complet de voies, carrefours, bus/camions et congestion validé.',True)
add('water-preparation','Préparation aquatique extensible','PARTIEL',['department-water.json','public/planet/fr-86/navigation/pilot.json','src/player/water-network.mjs'],'Cache pilote vérifié et calcul inutile sans berge supprimé. Pas de portails aquatiques continus entre bassins/tuiles ni trois corridors admis.')
add('water-new','Trois nouvelles sections en bateau','NON ATTEINT',['department-water.json'],'0 accès admis dans les trois secteurs inspectés. Les règles de support/accès actuelles sont limitantes ; ce résultat ne prouve pas une impossibilité géographique.',True)
add('swimming','Nage et sortie sur les nouveaux secteurs','NON ATTEINT',['department-water.json','tests/mission-25-1.test.mjs'],'Le pilote historique est conservé ; aucune nage départementale nouvelle complète n’a été démontrée.',True)
add('raft-p0','P0 packraft : suivi, pagaie et sillage nouveaux secteurs','PARTIEL',['src/player/packraft.mjs','department-water.json','journeys.json','candidate-final-boat-fixed.json','reference-final-boat-fixed.json'],'Shader des rides/sillages réparé et rendu natif pilote rejoué. Aucun suivi départemental prolongé nouvellement admis ni preuve perceptive suffisante.',True)
add('rail','Rail, gares, circulation et transport de passager','PARTIEL',['public/planet/fr-86/stations.json','src/planet/transport.ts'],'60 gares sourcées, arrêts simulés ; trains simples, pas de voyage passager ni de scénarios natifs multi-tuiles/croisements complets.',True)
add('aviation','Aviation : cycle natif et géographie vérifiée','PARTIEL',['src/planet/transport-motion.mjs','src/planet/transport.ts'],'Circuit synthétique et infrastructure OSM ; cycle natif complet, garde au terrain, roulage et embarquement non validés.',True)
add('birds','P0 oiseaux : vol et ailes perceptivement fluides','PARTIEL',['tests/planet.test.mjs','candidate-birds-fixed.json','reference-birds-fixed.json'],'Échantillonnage analytique préservé. Les films logiciels à très bas FPS ne valident pas la fluidité ni toutes les transitions/espèces.',True)
add('trunk-shadows','P0 troncs : caster stable et clipping','PARTIEL',['src/nature/forest-shadow-source.mjs','tests/planet-contact.test.mjs','candidate-shadows-fixed.json'],'Tronc détaillé stable, branches intermédiaires et feuillage conservés. Fermeture perceptive sur tous profils/essences non démontrée.',True)
add('global-shadows','P0 ombres globales','PARTIEL',['origin-balanced.json','origin-quality.json','candidate-shadows-fixed.json','reference-shadows-fixed.json'],'Composition des shaders corrigée ; aliasing, soleil bas, saisons, mouvement et coût GPU physique restent ouverts.',True)
add('audio','Audio réel, mix stéréo et continuité spatiale','PARTIEL',['audio-audit.json','origin-eco.json','origin-balanced.json','origin-quality.json'],'Paquets audio natifs vérifiés, voix actives lors des rebases. Qualité audible du mix, rail/avion et tous scénarios non certifiés.',True)
add('map','Carte, vrai routage et état restauré','PARTIEL',['routes-audit.json','journeys.json','src/planet/map.ts'],'Routes et distances sur topologie source ; tous les appuis 3D, étapes libres, relief ombré/couches et parcours de carte complets restent ouverts.',True)
add('saves','Reprise marche, voiture, camp et bateau','PARTIEL',['journeys.json','tests/planet-contact.test.mjs'],'Cas indépendants de reload réussis ; la chaîne complète dans une seule géographie, nage, suivi actif et tous champs ne sont pas certifiés.',True)
add('refusal','Refus contrôlé sans relocalisation','ATTEINT',['journeys.json'],'Portée : activité de reprise non prise en charge, position inchangée et erreur explicite. Tous les accès invalides ne sont pas couverts.')
add('endurance','Endurance et nombreuses traversées de tuiles','PARTIEL',['candidate-capture.json','native-summary.json'],'Même contexte actif prolongé mais placements entre scènes ; ce n’est pas 30–60 min de voyage libre multi-tuiles avec toutes les variations demandées.',True)
bench_files=[f for f in ['candidate-benchmark.json','reference-benchmark.json'] if (OUT/f).is_file()]
add('performance','Benchmark trois profils, modes et surcoût ≤5 %','PARTIEL',bench_files or ['native-summary.json'],'SwiftShader et échantillons courts ; tous les modes/streaming ne sont pas couverts. Le seuil ≤5 % et les budgets ne sont pas réputés passés.',True)
add('balanced-regression','Surcoût Équilibré ≤5 % sur scènes comparables','NON ATTEINT',bench_files,'Médiane mesurée : forêt ~0 %, pont +7,3 %, berge +11,5 % dans cette campagne logicielle. Seuil échoué ; échantillons courts, pas une mesure de matériel physique.')
add('hardware','60 FPS desktop et 30 FPS téléphone physique','NON ATTEINT',bench_files or ['native-summary.json'],'Aucun GPU desktop ni smartphone physique disponible ; aucune certification matérielle déduite de SwiftShader.',True)
mobile=load('map-ui.json',{})
add('touch','Desktop et tactile compilé','PARTIEL',['map-ui.json'] if mobile else ['src/planet/map.ts'],'Carte tactile émulée vérifiée si présente ; commandes prolongées de tous les transports et Android physique non validés.',True)
if mobile and mobile.get('cases') and all(c.get('passed') for c in mobile['cases']):add('map-ui-functional','Carte : route UI, pinch, cibles 44 px et cache chargé','ATTEINT',['map-ui.json','desktop-map.png','mobile-map.png'],'Portée : contrôles fonctionnels desktop et émulation tactile ; aucune certification matérielle ou performance active.')
add('preservation','Sources historiques, Living Paintings et workflows','ATTEINT',['preservation.json','builds/reference-tests.log'],'Portée : audit byte à byte listé et tests historiques ; tous les usages perceptifs ne sont pas certifiés.')
add('licenses','Licences, traçabilité et budget 0 €','ATTEINT',['docs/mission-26-1-data.md','sources/native-pilot-mnt.json','sources/sncf-gares-original.json','distribution.json'],'La capacité de l’hébergement gratuit à l’échelle France/monde n’est pas garantie.')
if load('links-audit.json',{}).get('passed'):add('evidence-integrity','Intégrité des fichiers, schéma et liens locaux','ATTEINT',['artifacts.json','links-audit.json','source-tree.json'],'Portée : empreintes et existence des preuves ; pas une validation perceptive ou géographique supplémentaire.')
add('evidence','Galerie, sources exécutées et preuves brutes','PARTIEL',['native-summary.json','audio-audit.json','builds/candidate-final/receipt.json'],'Les scénarios absents restent non atteints. Les films antérieurs à des corrections portent leur SHA exact et ne couvrent pas automatiquement le code final.',True)
def evidence_shas(value,result):
    if isinstance(value,dict):
        for k,v in value.items():
            if k in ['sourceSHA','source','sourceCommit'] and isinstance(v,str) and re.fullmatch('[0-9a-f]{40}',v):result.add(v)
            elif isinstance(v,(dict,list)):evidence_shas(v,result)
    elif isinstance(value,list):
        for v in value:evidence_shas(v,result)
for row in rows:
    versions=set()
    for name in row['evidence']:
        if name.endswith('.json'):evidence_shas(json.loads((ROOT/name).read_text()),versions)
    row['evidenceSourceSHAs']=sorted(versions)
acceptance={'schema':'mission-acceptance-v2','mission':'26.1','overallStatus':'PARTIEL','mergeReady':False,'executedProgramSHA':PROGRAM,'referenceSHA':REFERENCE,'immutableFineDataSHA':DATA,'requirements':rows}
(OUT/'acceptance.json').write_text(json.dumps(acceptance,ensure_ascii=False,indent=2)+'\n')

audit=load('contact-audit.json');routes=load('routes-audit.json');seams=load('seam-strips.json');journey=load('angles-west-final.json');preservation=load('preservation.json');water=load('department-water.json');saves=load('journeys.json'); benchmarks={v:load(v+'-benchmark.json',{}) for v in ['candidate','reference']}
run_table='\n'.join('| '+v+' | '+m+' | '+a+' | '+(f"{c['longestConsecutiveRunningSeconds']:.2f} s · {c['nativeFPS']:.2f} FPS · {c['sourceSHA'][:7]}" if (c:=select_run(v,m,a)) else 'absent')+' |' for v in ['reference','candidate'] for m in ['run-flat','run-terrain'] for a in ['front','rear','left','right'])
perf=[]
for v,d in benchmarks.items():
    for c in d.get('cases',[]):
        s=c.get('stats',{})
        perf.append(f"| {v} | {c['name']} / {c['profile']} | {s.get('frames','—')} | {s.get('p50',0):.1f} / {s.get('p95',0):.1f} / {s.get('p99',0):.1f} | {s.get('max',0):.1f} | {s.get('fps',0):.2f} | {'valide dans sa portée' if c.get('valid') else 'échec / incomplet'} |")
comparisons=[]
for c in benchmarks['candidate'].get('cases',[]):
    if c.get('profile')!='balanced' or c.get('name') not in ['forest','bridge','river'] or not c.get('valid'):continue
    before=next((r for r in benchmarks['reference'].get('cases',[]) if r['name']==c['name'] and r['profile']==c['profile'] and r.get('valid')),None)
    if before and before.get('stats',{}).get('p50'):
        ratio=c['stats']['p50']/before['stats']['p50']-1
        comparisons.append(f"{c['name']} : {ratio:+.1%} sur la médiane de frame")
successes=sum(bool(c.get('crossing',{}).get('completed') and c.get('return',{}).get('completed')) for c in seams['cases'])
failed_seams=[c['feature'] for c in seams['cases'] if not(c.get('crossing',{}).get('completed') and c.get('return',{}).get('completed'))]
water_table='\n'.join(f"| {c['name']} | {c.get('requested')} | {len(c.get('accesses',[]))} | {c.get('metrics',{}).get('department',{}).get('rejected','—')} | {c.get('network',{}).get('reason',c.get('failure','incomplet'))} |" for c in water['cases'])
save_table='\n'.join(f"| {c['name']} | {'réussi dans la portée du cas' if c.get('passed') else 'non atteint'} |" for c in saves['cases'])
tests=(ROOT/'work/mission-26-1/tests-final-wake-map.log').read_text();n=re.search(r'ℹ pass (\d+)',tests);tests_count=n.group(1) if n else 'non constaté'
native_result=(f"Le voyage natif est complété ; voir [film]({ 'mission-26-1-evidence/'+native['video'] }) et [trace](mission-26-1-evidence/angles-native-departure.json)." if native.get('completed') else 'Le voyage natif n’est pas déclaré complété : '+native.get('failure','aucun résultat complet constaté.'))
native_case=next((c for c in native_summary['cases'] if c['file']=='angles-native-departure.json'),{})
wall=native_case.get('observedWallSeconds',0)
native_lead=(f"Un voyage natif de {int(wall//60)} min {int(wall%60):02d} s a quitté Angles par la route de Vicq puis est revenu : {native_case.get('localHorizontalDistanceM',0)/1000:.3f} km enregistrés, sans repositionnement ni erreur JavaScript/shader. Il franchit l’ancien propriétaire pilote mais reste dans une seule tuile départementale de 4 km. Le contrôleur accéléré fournit une preuve indépendante, distincte." if native.get('completed') else 'Le contrôleur a quitté Angles puis est revenu en simulation accélérée ; aucun voyage natif complet n’est déclaré atteint.')
text=f'''# Mission 26.1 — Continuité et fidélité de la Vienne

**Livraison consolidée partielle — PR #38 en brouillon, fusion non prête.** Aucun merge, déploiement, changement de workflow de production ou achat. Ce rapport est l’unique synthèse propriétaire ; la [galerie HTML autonome](mission-26-1-evidence/index.html), la [matrice par exigence](mission-26-1-evidence/acceptance.json), l’[architecture](mission-26-1-architecture.md) et les [sources](mission-26-1-data.md) en donnent le détail.

## Résumé exécutif

Le pilote historique reste disponible avec ses activités. La Vienne possède maintenant un dérivé IGN effectif à 2 m chargé à la demande, des préparations coopératives/worker, des supports issus des triangles affichés, une origine de rendu et de son intégrée, du routage sur les vrais nœuds OSM et des sauvegardes canoniques enrichies. {native_lead}

**Cela ne constitue pas encore le Travel Simulator départemental demandé.** Les traversées intercommunales complètes, trois nouvelles navigations, la locomotion perceptivement corrigée, les transports comme services et la fluidité matérielle restent ouverts. La politique hors pilote admet surtout les couloirs routiers publics ; elle n’implémente pas encore une liberté générale sur les terrains publics. Les forêts et bâtiments départementaux restent des reconstructions simples. L’absence actuelle d’accès aquatique n’est pas une preuve d’impossibilité des sources ou du territoire.

## Base Git, consolidation et version exécutée

La référence exécutable M26 est `{REFERENCE}`. Le code final effectivement compilé et testé est `{PROGRAM}` ; les données fines sont épinglées à `{DATA}`. Les [bundles réellement exécutés](mission-26-1-evidence/builds/candidate-final/receipt.json) sont archivés avec leurs SHA. Les commits ultérieurs d’outillage/documentation n’autorisent pas à attribuer rétroactivement les films à une autre version.

`origin/main` vérifié vaut `01e791be64cefae2eb1e90ab465f9bf0b848c33e`. #36 est fusionnée dans main. #37 est aussi fusionnée, mais dans la branche M25.1 : son merge `5fe6e792f34369926854b649a5b631426b7037c4` et sa tête M25.2 `110b4548aa32297e837874cb6a9a6353c4d1f94b` sont ancêtres de cette branche, absents de main. La PR consolidée apporte donc aussi M25.2. [Preuve d’ascendance](mission-26-1-evidence/git-ancestry.json). La même branche `mission/26-vienne-planet-engine` et la même PR #38 sont conservées.

Les premières prises corrigées portent `4acde98`, les reprises de course et le contrôleur de sortie `78b6ef6`, les contrôles aquatiques/origine/reprise `9d6d0d6`, les reprises bateau/carte et le voyage natif `{PROGRAM[:7]}`. Les dernières corrections concernent le graphe sans berge, la fermeture manquante du fragment shader de rides/sillage et le dessin de carte (emprise visible, simplification d’affichage sous 0,8 px, cibles 44 px et défilement). Elles ne changent ni le rig, ni le mouvement terrestre, ni les triangles des films terrestres antérieurs. Chaque fichier conserve sa version exacte. Les premières tentatives à shaders invalides ou streaming incomplet sont conservées dans `failed-attempts`. Le film de référence bateau qui montre le défaut historique reste explicitement marqué en échec dans la galerie ; il ne valide aucun critère visuel positif.

## Résultats par chantier : M26 → M26.1

| Chantier | Référence M26 | Édition consolidée | État |
|---|---|---|---|
| Relief départemental | Contact généralement à 128 m | 499 dérivés à 2 m, lacunes explicites, parent 16/128 m | PARTIEL pour la fidélité globale |
| Couture | Départ/retour non démontrés | Intersections exactes du pilote, support du triangle routier affiché, {successes}/27 passages courts aller-retour | PARTIEL |
| Préparation | Lots urbains jusqu’à environ 2,06 s rapportés | Décodage worker, accusés de lots, file cible 3 ms, graphe pilote sérialisé | PARTIEL : des lots >50 ms subsistent |
| Coordonnées | Origine surtout isolée | Rendu/audio intégrés, physique Float64 et saves WGS84 | PARTIEL : repère métrique régional hérité |
| Navigation/carte | Outil local incomplet | Index source compact, distances réelles, mode marche/voiture, gares et couverture | PARTIEL |
| Reprise | Bateau/camp/voiture partiels | Cas indépendants marche, voiture garée/occupée, camp et bateau pilote réussis | PARTIEL : chaîne complète non démontrée |
| Eau nouvelle | Hydrographie visible, pas de corridor | Trois secteurs inspectés, zéro accès admis ; refus et coûts exportés | NON ATTEINT pour les trois parcours |
| Transports | Incomplets | Gares officielles, agents source, arrêts synthétiques, circuit aérien | PARTIEL, aucun service passager livré |

## Les cinq bugs P0

| Bug | Cause observée / correction | Preuve | État |
|---|---|---|---|
| Oiseaux | Échantillonnage analytique M26 conservé ; préparation réduite autour | Films appariés et tests de phase, très bas FPS | PARTIEL ; fluidité non confirmée |
| Voyageur | Pics numériques résiduels ; les filtrages dégradant le pied planté ont été retirés. Rig/gait inchangés face à M26 | 4/8/30/60/120 Hz et dt irréguliers simulés, films de course | NON ATTEINT pour la correction perceptive |
| Troncs / clipping | Caster commun : vrai tronc détaillé, branches intermédiaires et feuillage conservés | Test de géométrie, images et films appariés | PARTIEL |
| Ombres globales | Composition idempotente des shaders clonés et repère canonique corrigés ; politique de filtrage M26 conservée | Trois profils et rebases, films fixes | PARTIEL ; soleil/saisons/GPU physique incomplets |
| Packraft | Physique et contacts historiques conservés ; fragment shader des rides/sillage réparé, cache et reprise du pilote | Reprise, films bateau et benchmark actif pilote | PARTIEL ; aucun nouveau suivi prolongé |

Les diagnostics de rotations/contacts ne remplacent pas une revue humaine. Les films à quelques images par seconde ne permettent pas d’affirmer « naturel » ou « fluide ». Le profil Éco conserve sa politique historique sans ombre solaire ; aucun nouvel effet n’a été retiré pour faire passer les chiffres.

## Vérité du département

| Mesure | Résultat et portée |
|---|---|
| Couverture de base | 499 tuiles, 265 communes, emprise préparée M26 ~7 025,633 km² ; pas une certification de chaque lieu |
| Relief fin acquis | {audit['tiles']} packs, {audit['bytes']:,} octets compressés ; pas effectif 2 m |
| Valeurs fines disponibles | {audit['validFraction']*100:.4f} % des échantillons des carrés complets, marges comprises ; **pas un pourcentage de superficie détaillée de la Vienne** |
| Lacunes et bords | {len(audit['missing'])} pack absent ; {audit['seamPairs']} bords communs, maximum {audit['maxSeamDifferenceM']:.3f} m, {audit['seamFailures']} échec de seuil |
| Précision | Quantification ≤0,005 m, différente de l’erreur du relevé. Dates du pilote non extrapolées au département |
| Axes source dans l’union des tuiles | {routes['coverageClippedSourceLengthM']['road-line']/1000:.3f} km de lignes source dédupliquées et clippées ; routes, pistes et sentiers, emprise et marges. Inventaire préparé, pas un compte des images affichées |
| Rail source dans l’union des tuiles | {routes['coverageClippedSourceLengthM']['rail-line']/1000:.3f} km, actifs/inactifs compris avant politique |
| Longueur admise par politique topologique | Marche {routes['coverageClippedPolicyAdmittedLengthM']['foot']/1000:.3f} km ; voiture {routes['coverageClippedPolicyAdmittedLengthM']['car']/1000:.3f} km ; rail {routes['coverageClippedPolicyAdmittedLengthM']['rail']/1000:.3f} km. Chaque arête source clippée est comptée une fois, directions non doublées ; validation topologique, pas un certificat physique |
| Kilomètres effectivement visibles par frame | Non inventoriés ; ne pas remplacer cette mesure par le nombre de lignes du corpus |
| Physiquement parcouru | Voir les trajets ci-dessous ; les kilomètres de graphe ne sont jamais déclarés parcourus |
| Eau | Contours OSM et fond de jeu estimé, confiance faible ; 0 nouveau secteur navigué dans cette édition |
| Gares | 60 UIC uniques, 24 marqués voyageurs dans la source SNCF ; pas un service temps réel ni des quais certifiés |

Le repli RGE 128 m reste déclaré aux nodata fins. La définition de 2 m est celle du dérivé du service numérique IGN ; elle ne certifie ni chaque façade, ni la couverture native à 0,5 m. Les 30 rasters natifs autour d’Angles, les neuf empreintes historiques et 49 métadonnées WFS sont des références locales conservées, pas des packs historiques réécrits.

## Trajets réels, refus et méthode

Le noyau réel de marche a effectué **{journey['outward']['distance']:.2f} m à l’aller et {journey['return']['distance']:.2f} m au retour** vers la sortie Route de Vicq. Simulation accélérée à pas explicite, collisions conservées, aucun changement direct de position pendant la traversée. La préparation et les détours sont exportés. Ce parcours montre une sortie/retour à l’ancienne frontière ; il ne montre pas une grande traversée du département. [Trace du contrôleur](mission-26-1-evidence/angles-west-final.json).

{native_result}

La trace native comprend {next((c['framesObserved'] for c in native_summary['cases'] if c['file']=='angles-native-departure.json'),0)} frames, {next((c['observedWallSeconds'] for c in native_summary['cases'] if c['file']=='angles-native-departure.json'),0):.2f} s observées et {next((c['localHorizontalDistanceM'] for c in native_summary['cases'] if c['file']=='angles-native-departure.json'),0):.2f} m locaux ({next((c['projectedDistanceM'] for c in native_summary['cases'] if c['file']=='angles-native-departure.json'),0):.2f} m en EPSG:2154). Le joueur franchit la limite protégée puis revient ; une seule tuile départementale canonique `131:1617` est parcourue. Il atteint le but du conducteur d’entrées, puis s’arrête naturellement à {native.get('finalHorizontalDistanceToStartM',0):.3f} m du départ après inertie, sans réparation de position. Le temps d’export/indexation est séparé dans `totalJobWallSeconds`. Le climat/saisons complets de toutes les variantes ne sont pas validés par ce seul voyage.

Le premier itinéraire source essayé s’arrêtait après 238,16 m. Un autre essai s’arrêtait à 1 159,73 m près de l’ancienne frontière : le refus utilisait la pente brute du raster, différente du triangle routier affiché. Le contrôle prend maintenant le même support affiché, sans aplanir le raster ni ouvrir les ouvrages. Les échecs antérieurs sont conservés. Les passages courts restant non complétés dans la dernière campagne sont : {', '.join(failed_seams)}. Plusieurs sondes peuvent concerner la même voie ; ce ne sont pas 27 voyages distincts.

L’index départemental contient {routes['graph']['nodes']:,} nœuds, {routes['graph']['directedEdges']:,} arêtes dirigées et {routes['graph']['sources']:,} voies source. Toutes ses longueurs d’arête correspondent à leurs extrémités métriques dans l’[audit](mission-26-1-evidence/routes-audit.json). Un itinéraire calculé Chauvigny–Châtellerault n’est pas une preuve que le contrôleur automobile l’a terminé. Les ponts/niveaux inconnus restent fermés. Aucun grand trajet A10 n’est déclaré atteint.

### Course native : durée réellement observée

Deux vrais segments source du pilote : `osm:way:35478466` (233,74 m, amplitude verticale 0,73 m) et `osm:way:1236532386` (202,63 m, amplitude 15,54 m). Voiture témoin garée sur une chaussée vérifiée avant l’enregistrement, collision conservée. Le runtime livré plafonne dt à 0,25 s : sous bas FPS, le temps simulé et la distance avancent moins vite que le temps mural. La durée de classification course reste native, sans changer ce runtime pour la preuve. Les comparaisons ont la même configuration initiale et le même parcours ; la progression différente interdit une comparaison image à image au même point. Les reprises de 220 s corrigent des fenêtres initiales dont les premières/dernières images ne couvraient pas 180 s. Aucun cumul de passages en marche n’est utilisé.

| Version | Surface | Vue | Plus longue course native observée |
|---|---|---|---|
{run_table}

**La vue droite sur pente ne passe pas le critère** : 177,61 s dans la première campagne, 98,78 s et 24,91 m avant arrêt dans la reprise. Le blocage n’est pas isolé ; le scénario reste en échec, sans suppression de collision ni cumul de marche. Le SHA est indiqué pour chaque prise. Les séquences sont des enregistrements natifs du canvas et de l’AudioContext. Le [résumé](mission-26-1-evidence/native-summary.json) distingue distances locales physiques et distances recalculées en EPSG:2154. Les traces WGS84 sont dérivées exactement du repère historique ; aucune frame manquante n’est reconstruite.

### Nouveaux secteurs aquatiques inspectés

Placements diagnostiques sur routes source **avant** inspection ; aucun kilomètre de bateau déduit de ces placements. Préparation d’au moins une vraie frame avant de laisser travailler les files. Le graphe attend désormais la fin de découverte des berges et devient explicitement vide s’il n’existe aucune sortie vérifiée. Il ne passe plus plus de 100 s CPU à relier une eau inutilisable sans berge, comme dans une tentative antérieure.

| Secteur | Coordonnées demandées | Accès admis | Candidats refusés | Résultat |
|---|---|---|---|---|
{water_table}

Les accès, la cohérence de rive et les supports restent limitants dans cette implémentation. Aucun pont inconnu n’a été ouvert et aucune bathymétrie mesurée n’est prétendue. Les portails entre tuiles/bassins et la navigation départementale prolongée restent à construire/valider.

## Sauvegardes et session

Les saves v2 gardent WGS84/IGN69, cap, activité, véhicule garé/occupé, camp, état du bateau, profil, climat, caméra, carte et route. La migration v1 conserve le document original et son repère déclaré. Les tuiles et activités sont vérifiées avant restitution ; un refus ne relocalise pas le joueur. Les couches de carte sont comparées comme un ensemble, leur ordre d’insertion n’étant pas un changement d’état.

| Cas indépendant compilé | Résultat |
|---|---|
{save_table}

[Reçus de reprise](mission-26-1-evidence/journeys.json). Ces cas utilisent de vrais reloads lorsqu’indiqués. Ils ne constituent pas la chaîne native géographiquement continue marche → voiture → camp → bateau → reprise, ni une validation exhaustive de tous les champs, de la nage, du suivi actif et du hors-ligne. La reprise assise non prise en charge est explicitement refusée.

## Performances : résultats logiciels et limites

Bench séquentiel isolé, sans MediaRecorder ni profiler CPU, viewport et **framebuffer réels 640 × 420, DPR 1**, son actif, seed/date/profil/caméra contrôlés. Les périodes de démarrage sont séparées. Les films ont leur coût de capture et ont aussi subi la contention des campagnes parallèles : leurs FPS ne sont pas substitués au bench isolé. Les temps CPU observés incluent les appels driver ; l’extension de timer GPU est détectée, mais aucun temps GPU séparé fiable n’est publié. Ce point reste non vérifié.

| Version | Scène / profil | Frames | P50 / P95 / P99 ms | Max ms | FPS natifs | Contrôle |
|---|---|---|---|---|---|---|
{chr(10).join(perf)}

Comparaison Équilibré disponible : {' ; '.join(comparisons) if comparisons else 'aucune paire complète constatée'}. Le seuil ≤5 % échoue dans cette campagne sur pont et berge. Les petits échantillons ne permettent aucune généralisation matérielle. Les benchmarks bateau M26 gardent leur échec de shader et sont inéligibles à une comparaison à effets équivalents ; les cas corrigés sont rejoués. Les cas terrestres inchangés conservent leur source `9d6d0d6`, les reprises bateau/carte leur source finale. P99 peut être le maximum avec quelques dizaines de frames. Les contrôles d’activité et de déplacement sont séparés du simple rendu ; un cas raté reste raté. Les scènes absentes, train en streaming, nouveau bateau départemental et nombreux franchissements ne sont pas validés par les seuls cas présents.

Le budget 96 MiB est un plafond comptable : octets JSON décodés déclarés et rasters U16. Il ne mesure pas le coût réel des objets JS issus de ce JSON. Le worker de routage, le tas JS, les buffers CPU/WebGL, textures, audio, captures et ressources du driver sont des budgets distincts. Une longue campagne native dans le même contexte a été enregistrée avec placements entre scènes ; une baisse ponctuelle de heap après GC ne prouve pas l’absence de fuite. L’endurance multi-tuiles 30–60 min avec toute la météo et tous les modes reste partielle.

**60 FPS desktop, 30 FPS sur téléphone et naturel perceptif : NON VALIDÉS sur matériel physique.** Aucun vrai GPU ou smartphone n’était disponible. SwiftShader ne sert pas d’estimation d’un Android réel.

Les contrôles de carte compilée réussissent sur desktop 1280 × 800 et en émulation 390 × 844 : route de 0,06 km via les boutons et le canvas, même route départementale calculée par le vrai worker, pinch, cibles ≥44 px, fenêtre compacte défilable, pas de débordement horizontal et réutilisation hors ligne des seules données déjà chargées. Le jeu est tenu après préparation pour ces contrôles fonctionnels. [Reçus](mission-26-1-evidence/map-ui.json), [desktop](mission-26-1-evidence/desktop-map.png), [mobile](mission-26-1-evidence/mobile-map.png). Ce n’est pas un test Android physique.

## Sources, licences, hébergement et préservation

IGN / API Geo : Licence Ouverte 2.0. OpenStreetMap et SNCF Réseau : ODbL. Les sons/assets historiques conservent leurs licences. Acquisition autorisée, pas de clé commerciale, achat ou coût additionnel. [Données et reçus](mission-26-1-data.md).

Les 1,408 Go de relief fin ne sont pas copiés dans l’artefact du site. Ils sont vérifiés à la demande depuis une URL HTTPS épinglée au commit de données. L’artefact compilé reste d’environ 200 Mo, contre 179 Mo pour la référence. Un transfert navigateur réel, CORS et SHA ont été contrôlés. La capacité/latence du service gratuit pour une extension France/monde n’est pas garantie.

L’audit lit {preservation['checked']} anciens fichiers : {preservation['unchanged']} identiques, un manifeste régional modifié pour déclarer les nouvelles couches, aucun fichier absent. Les packs historiques, `src/world`, `src/living` et les workflows contrôlés restent identiques à M26. Les sources Living Paintings / LP01 n’ont pas été modifiées par cette mission. **{tests_count} tests passent** sur le code final, compilation TypeScript/Vite réussie. Cela ne ferme pas les critères perceptifs. [Préservation](mission-26-1-evidence/preservation.json).

## Défauts résiduels : gravité, position et reproduction

| Gravité | Défaut / position | Reproduction et correction encore nécessaire |
|---|---|---|
| P0 | Continuité non exhaustive ; sondes du fichier `seam-strips.json` | Rejouer les voies en échec, inspecter triangle/appui/obstacle ; ne pas supprimer une falaise légitime. Rue du Pont héritée toujours ouverte |
| P0 | Grande traversée et liberté hors couloirs | Choisir les extrémités de `routes-audit.json`, parcourir réellement les arêtes ; intégrer les terrains publics et ouvrages avec preuves de source |
| P0 | Course/gait et oiseaux | Ouvrir les films et mesures multi-cadences ; rig inchangé, naturel non confirmé. Une revue lisible sur GPU réel reste nécessaire |
| P0 | Eau nouvelle : Chauvigny, Châtellerault, La Roche-Posay | `department-water.json` donne GPS, placement, rejets et supports ; compléter admission des rives/portails sans inventer d’accès |
| P0 | Tâches >50 ms et rendu logiciel très lent | Rejouer les benchmarks avec les mêmes buffers/effets ; profiler les étapes atomiques et uploads/GC ; vérifier ensuite sur GPU/Android physiques |
| P0 | Voiture intercommunale / N10 / A10 | Aucun trajet long complet prouvé ; topologie, ouvrages, voies et trafic doivent être vérifiés par le contrôleur |
| P1 | Camp hors pilote et chaîne complète de reprise | La politique actuelle ne fournit pas de terrain public général hors route ; sauvegardes indépendantes réussies ne suffisent pas |
| P1 | Rail et aviation | Arrêts/circuit synthétiques ne livrent ni passager ni cycle natif complet avec niveaux, occupation, son et collisions validés |
| P1 | Ancrage des objets et LOD départemental | À la relecture, les objets sont ancrés au MNT fin et ne sont pas tous réancrés à chaque changement du maillage lointain ; risque de décalage visible à auditer sur pentes, non certifié par les films du pilote |
| P1 | Biomes et stations visuelles | Reconstructions départementales simples ; campagne de référence sur tous les lieux/saisons incomplète |
| P1 | Carte / offline / mobile | Routage source utile, mais étapes/couches et cache hors ligne limité ; aucune certification Android physique |
| P1 | Échelle mondiale et mémoire | Repère régional hérité et fixture non native complète ; budgets globaux, listeners et nombreuses évictions à éprouver |

## Reproduction et décision proposée

Les commandes sont dans [REPRODUCTION.md](mission-26-1-evidence/REPRODUCTION.md). Les scripts distinguent placement d’inspection, contrôleur accéléré, voyage natif, benchmark hors capture et émulation. Les acquisitions volumineuses possèdent un `--dry-run`. Les hashes et archives de builds permettent de retrouver les sources réellement filmées.

**Décision proposée : conserver la PR #38 en brouillon, non prête pour fusion.** Les progrès sont intégrés et révisables, mais l’acceptation complète de la mission n’est pas atteinte. Aucune validation intermédiaire n’est sollicitée et aucune fusion/publication n’est exécutée.
'''
(ROOT/'docs/mission-26-1.md').write_text(text)
print('Consolidated',len(rows),'requirements; report',len(text),'characters')
