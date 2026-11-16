"""Build a local, standalone evidence gallery. No CDN, framework or publishing."""
import html, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/mission-26-1-evidence'
esc = html.escape
def load(name, default=None):
    p = OUT / name
    return json.loads(p.read_text()) if p.exists() else default

summary = {c['file']: c for c in load('native-summary.json', {'cases': []})['cases']}
acceptance = load('acceptance.json', {'requirements': []})
parts = ['''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Endless Earth · Mission 26.1 · Preuves</title><style>
:root{color-scheme:light;--ink:#243c35;--paper:#f2f1e7;--line:#c9d0bf;--muted:#53645b}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:32px 24px 80px}header{padding:28px 0;border-bottom:1px solid var(--line)}h1{font:clamp(30px,5vw,54px)/1.1 Georgia,serif;max-width:900px}h2{margin-top:48px;font:30px/1.2 Georgia,serif}h3{font-size:18px}p{max-width:85ch}.kicker{letter-spacing:.14em;text-transform:uppercase;font-size:12px}a{color:#275c50;text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:3px solid #ba8439;outline-offset:3px}.notice{overflow-wrap:anywhere;padding:16px 20px;background:#e7dcc2;border-left:4px solid #a66d22;margin:24px 0}.grid,.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.card,figure,details{margin:0;padding:18px;border:1px solid var(--line);border-radius:12px;background:#fafaf4}figure img,video{display:block;width:100%;height:auto;background:#182d28;border-radius:6px}figcaption,.meta{font-size:13px;color:var(--muted);overflow-wrap:anywhere}.pair figure{padding:10px}.pair{gap:12px;margin:14px 0 26px}details{margin:12px 0}summary{cursor:pointer;min-height:44px;padding:8px 0;font-weight:600}audio{width:100%;margin:10px 0}.badge{display:inline-block;border-radius:20px;padding:3px 10px;background:#dde7da;font-size:12px}.warn{background:#ead8bd}.fail{background:#ead0ca}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top}.scroll{overflow:auto}ul{padding-left:22px}code{font-size:.85em}nav{display:flex;flex-wrap:wrap;gap:10px}nav a{padding:9px 14px;border:1px solid var(--line);border-radius:30px;min-height:44px}.links{columns:3;column-gap:24px}.links li{break-inside:avoid;margin-bottom:8px}@media(max-width:700px){main{padding:18px 14px 60px}.grid,.pair{grid-template-columns:1fr}.links{columns:1}th,td{padding:9px 6px}}
</style><main><header><div class="kicker">Endless Earth · Vienne · Mission 26.1</div><h1>Géographie, mouvement et limites observées</h1><p>Galerie locale autonome, compilations réelles, médias natifs et fichiers de contrôle. Aucun média interpolé ni parcours déduit d’un placement de caméra.</p><span class="badge warn">Mission PARTIELLE · Fusion non prête</span></header>
<div class="notice">Les films utilisent Chromium / SwiftShader, avec un framebuffer de 640 × 420 pixels, DPR 1 et le vrai son du jeu. Les cadences très faibles rendent les mouvements difficiles à juger. Une durée de course réussie ne certifie pas la fluidité perceptive, un GPU physique ou Android.</div>
<nav><a href="#matrice">Acceptation</a><a href="#avant-apres">Avant / après</a><a href="#films">Films natifs</a><a href="#trajets">Trajets</a><a href="#controle">Fichiers de contrôle</a><a href="#manquants">Preuves manquantes</a></nav>
<p><a href="../mission-26-1.md">Rapport final unique</a> · <a href="../mission-26-1-architecture.md">Architecture</a> · <a href="../mission-26-1-data.md">Données et droits</a> · <a href="acceptance.json">Matrice JSON</a></p>
<h2 id="matrice">Acceptation par exigence</h2><div class="scroll"><table><thead><tr><th>Exigence</th><th>État</th><th>Limite</th></tr></thead><tbody>''']
for row in acceptance.get('requirements', []):
    status = row.get('status', 'NON ATTEINT')
    cls = '' if status == 'ATTEINT' else 'warn' if status == 'PARTIEL' else 'fail'
    parts.append(f'<tr><td>{esc(row.get("title",row["id"]))}</td><td><span class="badge {cls}">{esc(status)}</span></td><td>{esc(row.get("failureReason") or "Voir la portée exacte des preuves dans la matrice.")}</td></tr>')
parts.append('</tbody></table></div><h2 id="avant-apres">Même scène, même résolution</h2><p>Référence M26 <code>de3958c</code> et première compilation corrigée <code>4acde98</code>. Les métadonnées de chaque session donnent caméra, profil, climat, framebuffer et SHA. Les poses des images fixes restent un instant de diagnostic ; les films montrent la locomotion active.</p>')
for scene, label in [('bridge','Rue du Pont'),('forest','Clairière du pilote'),('river','Berge du pilote')]:
    for profile in ['eco','balanced','quality']:
        paths=[f'{version}-{scene}-{profile}.png' for version in ['reference','candidate']]
        if all((OUT/p).is_file() for p in paths):
            parts.append(f'<details><summary>{label} · {profile}</summary><div class="pair">')
            for p, version in zip(paths,['M26','M26.1 · 4acde98']):
                parts.append(f'<figure><a href="{p}"><img loading="lazy" src="{p}" alt="{esc(label)} · {esc(version)} · {profile}"></a><figcaption>{version} · {profile} · 640 × 420</figcaption></figure>')
            parts.append('</div></details>')
parts.append('<h2 id="films">Images et son natifs</h2><p>Les conteneurs indexés gardent les paquets vidéo encodés et leurs timestamps. Les originaux et empreintes sont conservés. Le JSON et la trace accompagnent chaque film. Les prises trop courtes restent affichées comme telles.</p>')
for path in sorted(OUT.glob('*.json')):
    d = load(path.name)
    if not isinstance(d,dict) or d.get('type') != 'native-video' or not (OUT / d.get('file','-')).is_file():
        continue
    s = summary.get(path.name, {})
    run = d.get('mode','').startswith('run')
    duration = s.get('longestConsecutiveRunningSeconds',0)
    badge = f'{duration:.2f} s de course consécutive observée' if run else f'{s.get("observedWallSeconds",0):.2f} s observées'
    cls = 'fail' if d.get('errors') or d.get('failure') else '' if not run or duration>=180 else 'fail'
    if d.get('errors') or d.get('failure'):badge+=' · échec shader/JS conservé'
    parts.append(f'<details><summary>{esc(path.stem)} · <span class="badge {cls}">{badge}</span></summary><video controls preload="none" src="{esc(d["file"])}"></video><p class="meta">SHA exécuté : <code>{esc(d.get("before",{}).get("source","inconnu"))}</code> · Cadence native observée : {s.get("nativeFPS",0):.2f} FPS · Distance locale : {s.get("localHorizontalDistanceM",0):.2f} m. Ces chiffres incluent le coût de capture et la contention des campagnes parallèles.</p><p>')
    for p,label in [(path.name,'Métadonnées / frames'),(d['original'],'Original brut'),(path.stem+'-transforms.json.gz','Transformations'),(path.stem+'-geographic-trace.json.gz','Trace géographique')]:
        if (OUT/p).is_file():parts.append(f'<a href="{esc(p)}">{label}</a> · ')
    parts.append('</p>')
    if d.get('errors') or d.get('failure'):parts.append('<p class="notice">'+esc(str(d.get('failure') or d['errors'][0]))+'</p>')
    parts.append('</details>')
parts.append('<h2 id="trajets">Parcours, données et coût</h2><div class="grid">')
for name,label in [('contact-coverage.svg','Disponibilité IGN à 2 m'),('journey-map.svg','Traces et refus observés'),('performance.svg','Benchmark isolé'),('memory.svg','Mémoire native observée'),('desktop-map.png','Carte compilée · desktop 1280 × 800'),('mobile-map.png','Carte compilée · émulation tactile 390 × 844')]:
    if (OUT/name).is_file():parts.append(f'<figure><a href="{name}"><img loading="lazy" src="{name}" alt="{label}"></a><figcaption>{label} · voir méthode et limites dans le rapport.</figcaption></figure>')
parts.append('</div>')
for name in ['angles-native-departure.webm','candidate-rebases-fixed.webm','candidate-birds-fixed.webm']:
    if (OUT/name).is_file():
        parts.append(f'<details><summary>Écoute du mix réel · {esc(name)}</summary><audio controls preload="none" src="{name}"></audio><p class="meta">Piste native du même enregistrement ; une présence sonore ne prouve pas à elle seule le réalisme ou l’absence de défaut audible.</p></details>')
if (OUT/'angles-native-departure.webm').is_file():parts.append('<video controls preload="none" src="angles-native-departure.webm"></video><p><a href="angles-native-departure.json">Voyage natif depuis le vrai départ : résultat et refus éventuel</a></p>')
parts.append('<h2 id="controle">Fichiers de contrôle réellement présents</h2><ul class="links">')
for path in sorted(OUT.glob('*.json')):
    parts.append(f'<li><a href="{esc(path.name)}">{esc(path.name)}</a></li>')
for folder in ['sources','builds','previous-runtime-4acde98','previous-runtime-78b6ef6','failed-attempts']:
    for path in sorted((OUT/folder).rglob('*.json')):
        p=path.relative_to(OUT).as_posix()
        parts.append(f'<li><a href="{esc(p)}">{esc(p)}</a></li>')
parts.append('''</ul><h2 id="manquants">Ce que cette galerie ne valide pas</h2><p>Trois nouvelles navigations départementales prolongées ; plusieurs grands voyages automobiles et l’A10 ; train comme transport de passager ; cycle aérien natif complet ; campagne de toutes les stations géographiques demandées ; Android physique et fluidité 30/60 FPS ; correction perceptive définitive des cinq P0. Les refus et essais incomplets restent des résultats non atteints.</p><p class="meta">IGN / API Geo : Licence Ouverte 2.0. © OpenStreetMap contributors / SNCF Réseau : ODbL. Les sons et assets historiques conservent leurs attributions dans le dépôt. Les fonds aquatiques sont estimés pour le jeu, sans bathymétrie mesurée. Aucune publication ou dépense supplémentaire.</p></main></html>''')
(OUT/'index.html').write_text(''.join(parts))
print('Gallery:',len(''.join(parts)),'bytes')
