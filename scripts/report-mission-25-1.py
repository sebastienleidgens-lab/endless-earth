from pathlib import Path
import json, html, hashlib, statistics

root=Path('docs/mission-25-1-evidence')
def load(name,default=None):
    p=root/name
    return json.loads(p.read_text()) if p.exists() else default
def esc(v):return html.escape(str(v),quote=True)

media=load('media-audit.json',{}).get('rows',[])
perf=load('performance.json',{}).get('rows',[])
active=load('active-performance.json',{}).get('rows',[])
pres=load('preservation.json',{})
trips=[]
for name in ['voyage-3','voyage-5']:
    d=load(name+'.json')
    if not d:continue
    points=[f['position'] for f in d.get('frames',[])]
    full=sum(((b[0]-a[0])**2+(b[2]-a[2])**2)**.5 for a,b in zip(points,points[1:]))
    coordinates=[[.8844+p[0]/(111320*__import__('math').cos(46.6953*__import__('math').pi/180)),46.6953-p[2]/111320] for p in points]
    trips.append({'name':name,'distanceM':d['distance'],'nativeFrameDistanceM':full,'seconds':next((r['durationSeconds'] for r in media if r['file']==name+'.webm'),d['seconds']),'jobWallSeconds':d['seconds'],'docking':d['docking'],'points':points,'coordinates':coordinates,'errors':d['errors']})
if trips:
    (root/'voyages.geojson').write_text(json.dumps({'type':'FeatureCollection','features':[{'type':'Feature','properties':{k:v for k,v in t.items() if k not in ['points','coordinates']},'geometry':{'type':'LineString','coordinates':t['coordinates']}} for t in trips]},ensure_ascii=False))

statuses=[
 ('1 — Packraft','Partiel','Réseau connecté et conservateur, passages sous pont refusés, deux appels de dessin. Voir distances et accostages mesurés ci-dessous ; streaming au-delà du pilote et budget complet restent ouverts.'),
 ('2 — Personnage / rig','Partiel','31 os, cou, clavicules, doigts regroupés et couvercle de sac ; un SkinnedMesh et LOD partagés. Silhouette encore stylisée ; nage/pagaie restent en grande partie procédurales, pas de qualité AAA revendiquée.'),
 ('3 — Course naturelle','Partiel','Cycles originaux marche/jogging/course, tests d’appuis multi-cadences et films appariés. La faible cadence logicielle et une couverture artistique incomplète empêchent de conclure à une course nettement plus naturelle.'),
 ('4 — Interactions réelles','Partiel / objets non atteints','Bibliothèque sémantique et revalidation ajoutées, assise au sol conservée. Aucun banc/rocher ni tronc avec le contrat géométrique et le balayage corporel requis n’est activé ; aucun film de ces gestes n’est revendiqué.'),
 ('5 — Nage sensorielle','Partiel','Contacts articulaires communs aux rides et bruitages originaux, sac abaissé, eau reliée au champ de vent. L’eau reste opaque ; trois accès à examiner dans les nouveaux films. Respiration, projections détaillées et matrice météo complète restent ouverts.'),
 ('6 — Vent multi-échelle','Partiel','Champ partagé CPU/GPU à variations secondes/minutes/heures, traces déterministes. La diversité acoustique et la qualité sur matériel physique ne sont pas démontrées dans leur totalité.'),
 ('7 — Chants','Partiel','Silences déterministes, anti-répétition, sources fixes et visibles liées. Catalogue sourcé conservé ; couverture native de tous les habitats et réponses entre individus non démontrées complètement.'),
 ('8 — Oiseaux visibles','Partiel','Corps/ailes originaux instanciés, perchoirs sur branches connues, envols et familles longues ailes/oies saisonnières. Gros plans, trajectoires, LOD et formations artistiquement convaincants restent à valider.'),
 ('9 — Espace sonore 3D','Partiel','Rivière/pluie sur toiture en panners 3D, voix mobiles liées, repli equalpower, occultation existante conservée. La marche sonore complète avec retour au camp et écoute sur casque/appareils physiques reste ouverte.')]

cards=[]
for r in media:
    name=r['file'];audio=r.get('audio');levels='Sans piste sonore' if not audio else ('Stéréo non silencieuse' if audio['nonSilent'] else 'Piste silencieuse')
    if audio:levels+=' · RMS '+', '.join(f'{v:.1f}' for v in audio['rmsDbFS'])+' dBFS'
    if name.startswith('failed-') or name=='living-walk-native.webm':label='ESSAI ÉCHOUÉ / STATIQUE — '+name
    else:label=name
    cards.append(f'<article><h3>{esc(label)}</h3><video controls preload="metadata" playsinline src="{esc(name)}"></video><p>{r["durationSeconds"]:.1f} s · {esc(levels)}</p><p><a href="{esc(name[:-5]+".json")}">Trace</a> · <a download href="raw/{esc(name)}">Brut MediaRecorder</a> · <a download href="{esc(name)}">Version indexée</a></p></article>')

table=''.join(f'<tr><td>{esc(a)}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>' for a,b,c in statuses)
trip_table=''.join(f'<tr><td>{esc(t["name"])}</td><td>{t["distanceM"]:.1f} m</td><td>{t["nativeFrameDistanceM"]:.1f} m</td><td>{t["seconds"]/60:.2f} min</td><td>{esc(t["docking"])}</td></tr>' for t in trips)
perf_table=''.join(f'<tr><td>{esc(r["profile"])}</td><td>{esc(r["scene"])}</td><td>{r["before"]["medianMs"]:.1f}</td><td>{r["after"]["medianMs"]:.1f}</td><td>{r["deltaPct"]:+.2f} %</td></tr>' for r in perf)
boat_table=''.join(f'<tr><td>{esc(r["profile"])}</td><td>{r["off"]["medianMs"]:.1f}</td><td>{r["on"]["medianMs"]:.1f}</td><td>{(r["on"]["medianMs"]/r["off"]["medianMs"]-1)*100:+.2f} %</td></tr>' for r in active)
comparisons=''.join(f'<article><h3>{esc(angle)}</h3><div class="pair"><video controls preload="metadata" playsinline src="before-run-{angle}.webm"></video><video controls preload="metadata" playsinline src="after-run-{angle}.webm"></video></div><p>À gauche : main M25. À droite : M25.1. Placement, profil et entrées appariés ; les traces révèlent les différences effectives de cadence et de distance.</p></article>' for angle in ['rear','profile','front','three-quarter'])
page='''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Endless Earth · Mission 25.1</title>
<style>*{box-sizing:border-box}body{margin:0;background:#111c1a;color:#e5e7d8;font:16px/1.65 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:36px 20px 90px}h1{font-size:clamp(2rem,5vw,4rem);line-height:1.1;max-width:850px}h2{margin-top:55px;color:#d6c49c}h3{overflow-wrap:anywhere;font-size:1rem}p{max-width:920px}a{color:#b3d6c6}header small{letter-spacing:.15em;text-transform:uppercase;color:#b1bfae}.notice{border-left:4px solid #c9a968;padding:14px 22px;background:#23332d}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:20px}article{background:#20302b;border:1px solid #43564b;border-radius:10px;padding:16px;margin:16px 0}video,img{width:100%;display:block;border-radius:6px}video{background:#07100c;max-height:540px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.scroll{overflow-x:auto}table{border-collapse:collapse;min-width:620px;width:100%;font-size:.9rem}td,th{padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid #43564b}th{color:#d6c49c}button,select{font:inherit;color:inherit;background:#314d40;border:1px solid #6e8878;padding:9px 14px;border-radius:6px;min-height:44px}nav{position:sticky;top:0;background:#111c1af5;padding:12px 0;z-index:2;display:flex;gap:20px;flex-wrap:wrap}svg{background:#1e3028;width:100%;height:auto;border-radius:8px}footer{margin-top:50px;color:#b5c0b1}@media(max-width:650px){.pair{grid-template-columns:1fr}.grid{display:block}}</style>
<main><header><small>Endless Earth · développement pour revue</small><h1>Le voyageur et le monde vivant</h1><p>Mission 25.1 · Angles-sur-l’Anglin · base vérifiée <code>66a078c</code></p><p class="notice"><b>Brouillon — mission non achevée.</b> Aucun objectif artistique n’est déclaré atteint par le seul passage des tests. Rendu logiciel SwiftShader ; aucun Android ni GPU physique validé. Géographie, ponts et défauts de terrain préservés.</p></header>
<nav><a href="#etat">Acceptation</a><a href="#voyages">Voyages</a><a href="#course">Course</a><a href="#medias">Films natifs</a><a href="#perf">Mesures</a></nav>
<p><a href="../mission-25-1.md">Rapport français</a> · <a href="../mission-25-1-plan.md">Audit initial</a> · <a href="../mission-25-1-assets.md">Sources et licences</a> · <a href="preservation.json">Préservation et versions exactes</a> · <a href="media-audit.json">Pistes audio et cadence native</a></p>
<h2 id="etat">Les neuf chantiers</h2><div class="scroll"><table><tr><th>Demande</th><th>État</th><th>Réserve</th></tr>TABLE</table></div>
<h2 id="voyages">Trajets sur l’eau chargée</h2><p>La trace géographique est l’inverse du repère métrique du pilote, sans nouvelle mesure GPS ni bathymétrie réelle. Le fond est estimé pour le jeu, de confiance basse. Les pannes et limites restent visibles.</p><div class="scroll"><table><tr><th>Film</th><th>Distance à 1 Hz</th><th>Somme des frames</th><th>Durée</th><th>Accostage</th></tr>TRIPS</table></div><p><a href="voyages.geojson">Traces GeoJSON</a> · <a href="water-network.json">Graphe et composantes</a> · <a href="navigation-preflight.json">Simulation accélérée distincte des films</a></p><svg id="map" viewBox="0 0 1000 600" aria-label="Traces locales et nœuds aquatiques échantillonnés"></svg><p>Points : réseau admissible échantillonné. Traits : positions natives. Carte sans fond tiers ; aucune navigabilité réelle revendiquée.</p>
<h2 id="course">Comparer les mêmes scènes</h2><p>Lecture native par défaut. Le ralenti change seulement la vitesse de lecture du fichier : aucun nouveau frame, aucune interpolation.</p><button id="pair-play">Lire les comparaisons ensemble</button> <label>Lecture <select id="rate"><option value="1">1 × native</option><option value=".5">0,5 ×</option><option value=".25">0,25 ×</option></select></label>COMPARISONS
<h2 id="medias">Sources natives et traces</h2><p>Encodage MediaRecorder d’origine. L’ajout de durée/index au conteneur copie les codecs ; les empreintes des paquets vidéo et timestamps sont vérifiées. Les pistes présentes et leur niveau effectif sont inspectés séparément. Une piste audible ne prouve pas à elle seule la qualité artistique ou l’identité d’une source.</p><div class="grid">CARDS</div>
<h2>Terrain conservé, défauts ouverts</h2><p>Ces stations conservent caméra et géographie. Les défauts de raccord et de talus M23/M24 ne sont pas corrigés ni masqués.</p><div class="grid"><article><h3>Raccord</h3><div class="pair"><img loading="lazy" src="before-raccord-sec.png" alt="Raccord avant"><img loading="lazy" src="after-raccord-sec.png" alt="Raccord après, défaut conservé"></div></article><article><h3>Talus</h3><div class="pair"><img loading="lazy" src="before-talus-sec.png" alt="Talus avant"><img loading="lazy" src="after-talus-sec.png" alt="Talus après, défaut conservé"></div></article><article><h3>Pont</h3><div class="pair"><img loading="lazy" src="before-pont-sec.png" alt="Pont avant"><img loading="lazy" src="after-pont-sec.png" alt="Pont après"></div></article></div><h2>Vent partagé à plusieurs échelles</h2><p>Traces de simulation déterministe ; ces courbes ne représentent ni du vent réel mesuré, ni une vidéo accélérée.</p><img loading="lazy" src="wind-scales.png" alt="Vent simulé, échelles secondes minutes et heures"><h2 id="perf">Coûts mesurés</h2><p>Échantillons chauds appariés, rendu logiciel à 480 × 320, gl.finish. Ces mesures du rendu et d’une partie du CPU ne sont pas un benchmark exhaustif de la simulation, ni une mesure de VRAM ou de GPU matériel. Les vidéos longues ont été enregistrées séparément des benchmarks.</p><div class="scroll"><table><tr><th>Profil</th><th>Scène</th><th>Avant ms</th><th>Après ms</th><th>Écart</th></tr>PERF</table></div><h3>Coût isolé du bateau visible</h3><div class="scroll"><table><tr><th>Profil</th><th>Sans coque ms</th><th>Coque ms</th><th>Écart</th></tr>BOAT</table></div><p><a href="native-integrity.json">Intégrité et originaux</a> · <a href="boat-states-performance.json">À pied / actif / rangé</a> · <a href="performance.json">Échantillons ordinaires</a> · <a href="active-performance.json">Bateau actif</a> · <a href="determinism.json">Traces secondes/minutes/heures et silences simulés</a> · <a href="regression.json">Régression terrain</a> · <a href="mobile.json">Essai tactile émulé</a> · <a href="production.json">Build local</a></p>
<footer>Coût externe supplémentaire : 0 €. Aucun compte, clé, asset payant ou service ajouté. Aucune fusion, aucune mise en ligne. Galerie locale sans dépendance externe ; conserver les médias et traces dans le même dossier.</footer></main>
<script>const trips=TRIPDATA,nodes=NODEDATA;const map=document.getElementById('map'),ns='http://www.w3.org/2000/svg';function add(tag,a){const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(a))e.setAttribute(k,v);map.append(e);return e}const xy=p=>[(p[0]+1000)/2,(p[2]+1000)*.3];for(const n of nodes){const q=xy([n.x,0,n.z]);add('circle',{cx:q[0],cy:q[1],r:1,fill:'#739796',opacity:.45})}trips.forEach((t,i)=>{const e=add('polyline',{points:t.points.map(p=>xy(p).join(',')).join(' '),fill:'none',stroke:i?'#efcc78':'#b8dec8','stroke-width':2});const title=document.createElementNS(ns,'title');title.textContent=t.name+' : '+t.distanceM.toFixed(1)+' m';e.append(title)});document.getElementById('rate').onchange=e=>document.querySelectorAll('video').forEach(v=>v.playbackRate=Number(e.target.value));document.getElementById('pair-play').onclick=()=>document.querySelectorAll('.pair video').forEach(v=>{v.currentTime=0;v.play().catch(()=>{})});</script></html>'''
for key,value in [('TABLE',table),('TRIPS',trip_table),('COMPARISONS',comparisons),('CARDS',''.join(cards)),('PERF',perf_table),('BOAT',boat_table),('TRIPDATA',json.dumps([{k:v for k,v in t.items() if k not in ['coordinates','errors']} for t in trips])),('NODEDATA',json.dumps([{'x':n['x'],'z':n['z']} for n in load('water-network.json',{}).get('nodes',[])]))]:page=page.replace(key,value)
(root/'index.html').write_text(page)
(root/'acceptance.json').write_text(json.dumps([{'request':a,'status':b,'limits':c} for a,b,c in statuses],ensure_ascii=False,indent=2))
print('Gallery:',len(media),'films;',len(trips),'voyages;',len(perf),'paired benchmarks')

normal=[r for r in perf if r['profile']=='balanced' and r['scene'] not in ['foret-vent','oiseaux']]
cost='Mesures pas encore disponibles.'
if normal:cost=f"Équilibré, huit scènes ordinaires : médiane des écarts **{statistics.median(r['deltaPct'] for r in normal):+.2f} %**, pire scène **{max(r['deltaPct'] for r in normal):+.2f} %** ; **{sum(r['deltaPct']>5 for r in normal)}/8** au-dessus de +5 %."
boat_cost=' ; '.join(f"{r['profile']} : {(r['on']['medianMs']/r['off']['medianMs']-1)*100:+.2f} %" for r in active) or 'Mesure en attente.'
trip_lines='\n'.join(f"- **{t['name']}** : {t['distanceM']:.1f} m à 1 Hz ; {t['nativeFrameDistanceM']:.1f} m en sommant les frames (installation/retour inclus), {t['seconds']:.2f} s de vidéo native ; état final `{t['docking']}`." for t in trips)
matrix='\n'.join('| '+a+' | **'+b+'** | '+c+' |' for a,b,c in statuses)
report=f'''# Mission 25.1 — Le voyageur et le monde vivant

**Livraison partielle en brouillon. La mission n’est pas achevée.** Deux voyages natifs dépassent 500 m sur des sections distinctes de l’Anglin chargé, avec retour à pied. Le réseau aquatique, le rig, les cycles et les contacts sonores ont progressé. Les bancs/troncs, la qualité artistique complète et les budgets ne sont pas validés par le seul passage des tests.

[Galerie autonome](mission-25-1-evidence/index.html) · [audit et plan](mission-25-1-plan.md) · [sources et licences](mission-25-1-assets.md) · [matrice structurée](mission-25-1-evidence/acceptance.json).

## Base et portée vérifiées

Base distante constatée : `66a078c3febb7fed26c72d23f068cb31cbb5b3e2`, fusion de la PR #35. L’API a confirmé `merged=true`, et la branche M25 pointe à `2617f303`. Nouvelle branche `mission/25-1-voyageur-monde-vivant`. Le statut n’a pas été déduit de l’ancien texte de PR.

**377 tests passent**, contre 369 sur la référence M25 figée ; TypeScript et Vite passent. La première référence avait trois erreurs de dépendance manquante ; `npm ci` a restauré les versions du lockfile sans le modifier, puis les 369 tests ont passé. Les deux assertions historiques du nombre d’os sont actualisées de 19 à 31 ; les contrôles d’appui et de skinning sont conservés.

**{pres.get('protectedUnchanged',0)} fichiers protégés inchangés** : données publiques, terrain/collisions, graphe terrestre, géographie, workflows et adaptateurs Living conservés, avec une exception déclarée : `src/living/sound.ts`, nécessaire aux nouveaux contacts et au partage de la graine audio. Les **2 898 requêtes de collision et 20 déplacements terrestres** correspondent à la référence. Les défauts de talus, raccords et pont M23/M24 restent visibles dans les stations de régression. Aucun changement à Living Paintings / LP-01, aucune fusion ni mise en ligne.

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

{trip_lines}

Les contrôles accélérés du moteur parcourent aussi environ 548 m sur chacune des deux sections : ils sont étiquetés séparément des vidéos. Le premier essai bloqué après 4,3 m est conservé sous `failed-voyage-3`, sans être présenté comme succès. Les traces ont des coordonnées locales et un export GeoJSON suivant exactement le repère du projet ; aucune nouvelle observation GPS ou bathymétrique n’est revendiquée.

Les trois nouveaux films de nage ont une piste audio, des contacts d’entrée/bras/sortie et leurs positions. Les quatre comparaisons de course et les prises pente/escalier sont nouvellement enregistrées ; aucune vidéo d’une ancienne mission n’est réutilisée comme preuve M25.1. **Les vitesses/trajectoires effectivement couvertes diffèrent avec les faibles FPS** : mêmes placements et entrées ne suffisent pas à une comparaison artistique parfaitement appariée. Le rendu logiciel et la couverture incomplète des huit cas sous quatre angles empêchent d’annoncer la fluidité demandée.

Le plan fixe de forêt dure plusieurs minutes. Le premier film intitulé `living-walk-native` est en réalité resté immobile : il est conservé comme essai statique et ne valide pas une marche. Le second `mapped-sound-walk-native` utilise une voie publique réellement validée et contient une marche native ; la couverture simultanée forêt/village/berge et le retour au camp restent à examiner dans sa trace, sans les déduire du trajet prévu. Le camp existant verrouille l’activité : une promenade libre laissant le feu installé n’est pas livrée.

Les médias gardent leurs paquets encodés et timestamps : seul le conteneur WebM reçoit durée/index par copie de codecs. L’audit inspecte effectivement les pistes, les niveaux décodés et les différences gauche/droite. Cela prouve la présence du mix et des différences de canaux, pas à lui seul le réalisme artistique ou l’identité de chaque son. Les bruts et leurs empreintes sont conservés.

Les prises documentent plusieurs révisions **de cette mission** : `capture-v1` pour course et voyage 5, `navigation-capture` pour voyage 3, `sensory-capture` pour nage/ambiances, `render-benchmark` pour la marche cartographiée et le corridor final, `grip-capture` pour la dernière pagaie et l’approche sonore de rivière, `final` pour le nettoyage des cycles d’envol, le tactile et la production locale. Les différences de sources sont explicites dans `preservation.json`. Les longs trajets n’ont pas été intégralement refilmés après les derniers ajustements d’accostage, de prise de pagaie et de cycle d’envol : **validation finale exhaustive encore ouverte**.

## Performances et appareils

{cost}

Coût isolé de la coque, même avatar assis/caméra : **{boat_cost}**. Voir les échantillons complets, P95, appels, triangles, buffers logiques et heap. Les états physiques « à pied / bateau actif / rangé » ont leur mesure distincte : le joueur change réellement de position à la berge, donc ces trois états ne sont pas un trajet apparié au mètre près.

Les benchmarks ordinaires couvrent dix scènes × trois profils, dont forêt ventée, activité d’oiseaux, nuit et neige. Ils mesurent le rendu `gl.finish` et une partie du CPU, **hors construction initiale du réseau et hors simulation exhaustive/audio actif**. Les vidéos longues sont arrêtées avant les benchmarks. Ces résultats SwiftShader ne valident ni un vrai GPU ni l’objectif global de +5 % sur téléphone.

Le tactile CDP 390 × 844 contrôle déplacement, sortie/rangement du bateau, débordement et cibles d’au moins 44 px. Le build compilé fait l’objet d’un contrôle local séparé. **Aucun appareil Android physique, casque ou haut-parleur matériel n’est validé.** Les réserves de qualité/performance restent bloquantes.

## Matrice d’acceptation

| Demande | État | Réserve |
| --- | --- | --- |
{matrix}

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
'''
Path('docs/mission-25-1.md').write_text(report)
