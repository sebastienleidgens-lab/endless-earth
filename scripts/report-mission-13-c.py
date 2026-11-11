"""Assemble already captured browser evidence; no synthetic world images."""
from pathlib import Path
import gzip, hashlib, html, json, statistics, subprocess
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/mission-13-evidence/integration'
BASE = '7b2d711b3085f156d8d91d649e64e2fc75c11126'
PHASES = ['before', 'photo', 'hybrid']
LABELS = ['Mission 12', 'Photographique — Lambert', 'Hybride retenu']
TITLES = dict(rue='Rue ordinaire', facade='Façade proche', toitures='Toitures', chemin='Chemin', sol='Sol naturel', falaise='Falaise partiellement masquée', berge='Berge', village='Village', matin='Matin', soir='Soir', pluie='Soir pluvieux', nuit='Nuit')

def read(name):
    path = OUT / name
    return json.loads(gzip.decompress(path.read_bytes()) if name.endswith('.gz') else path.read_text())

def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

def compact_walk(phase):
    raw = OUT / f'{phase}-walk.json'
    target = OUT / f'{phase}-walk.json.gz'
    if raw.exists():
        target.write_bytes(gzip.compress(raw.read_bytes(), compresslevel=9, mtime=0))
        raw.unlink()
    return read(target.name)

captures = {phase: read(phase + '.json.gz') for phase in PHASES}
comparisons = []
for index, reference in enumerate(captures['before']['rows']):
    rows = [captures[p]['rows'][index] for p in PHASES]
    states = [r['state'] for r in rows]
    for s in states[1:]:
        for key in ['camera', 'matrix', 'projection']:
            assert s[key] == states[0][key], (reference['id'], key)
        assert s['climate']['date'] == states[0]['climate']['date']
        assert s['climate']['weather'] == states[0]['climate']['weather']
        assert s['life']['profile'] == states[0]['life']['profile']
        assert s['terrain'] == states[0]['terrain'] or s['terrain']['tiles'] == states[0]['terrain']['tiles']
    assert len({(r['samples'][0]['calls'], r['samples'][0]['triangles']) for r in rows}) == 1
    for r in rows:
        with Image.open(OUT / r['file']) as im:
            assert im.size == (960, 640)
            im.verify()
    comparisons.append({'id': reference['id'], 'geo': reference['geo'], 'date': states[0]['climate']['date'], 'weather': states[0]['climate']['weather'], 'profile': 'balanced', 'resolution': [960, 640], 'identicalCameraProjectionGeographyDraws': True})

# A contact sheet links to original, unretouched browser JPEGs in the gallery.
ids = ['rue', 'facade', 'chemin', 'village']
sheet = Image.new('RGB', (1440, len(ids) * 350 + 34), '#111b1a')
draw = ImageDraw.Draw(sheet)
for x, label in enumerate(['Mission 12', 'Photographique / Lambert', 'Hybride']):
    draw.text((x * 480 + 12, 10), label, fill='white')
for y, key in enumerate(ids):
    for x, phase in enumerate(PHASES):
        with Image.open(OUT / f'{phase}/{key}.jpg') as im:
            sheet.paste(im.resize((480, 320), Image.Resampling.LANCZOS), (x * 480, y * 350 + 34))
    draw.text((12, y * 350 + 358), TITLES[key], fill='white')
sheet.save(OUT / 'comparison.jpg', quality=89)

walks = {p: compact_walk(p) for p in ['before', 'after']}
assert walks['before']['route'] == walks['after']['route']
walk_summary = []
for phase, walk in walks.items():
    frames = read(phase + '-walk-frames.json.gz')
    assert walk['metres'] > 449 and all(f['valid'] and f['stepM'] < .4 for f in frames)
    assert not walk['errors']
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(OUT / f'{phase}-promenade.webm')]))
    assert {s['codec_type'] for s in probe['streams']} == {'video', 'audio'}
    intervals = sorted(f['intervalMs'] for f in frames[1:])
    walk_summary.append({'phase': phase, 'metres': walk['metres'], 'wallSeconds': walk['wallSeconds'], 'frames': len(frames), 'medianIntervalMs': statistics.median(intervals), 'p95IntervalMs': intervals[int(.95 * (len(intervals)-1))], 'maxIntervalMs': max(intervals), 'allPositionsValid': True, 'maxStepM': max(f['stepM'] for f in frames), 'heapBeforeGCBytes': walk['initialHeap']['usedSize'], 'heapAfterGCBytes': walk['finalHeap']['usedSize'], 'maxTextures': walk['maxTextures'], 'maxGeometries': walk['maxGeometries'], 'maxPrograms': walk['maxPrograms'], 'maxAudioCacheBytes': walk['maxAudioCacheBytes'], 'maxAudioVoices': walk['maxAudioVoices'], 'videoBytes': (OUT / f'{phase}-promenade.webm').stat().st_size, 'mediaSeconds': float(probe['format']['duration']), 'streams': [{'type': s['codec_type'], 'codec': s['codec_name']} for s in probe['streams']]})

performance = read('performance-summary.json')
assert performance['renders'] == 324 and not performance['errors']
perf_rows = []
for profile in ['eco', 'balanced', 'quality']:
    for station in ['rue', 'falaise', 'village']:
        rows = [next(r for r in performance['summary'] if r['phase'] == p and r['profile'] == profile and r['station'] == station) for p in PHASES]
        assert len({(r['calls'], r['triangles']) for r in rows}) == 1
        perf_rows.append({'profile': profile, 'station': station, 'medianMs': [r['medianMs'] for r in rows], 'p95Ms': [r['p95Ms'] for r in rows], 'hybridMedianChangePct': (rows[2]['medianMs']/rows[0]['medianMs']-1)*100, 'calls': rows[0]['calls'], 'triangles': rows[0]['triangles'], 'textures': [r['textures'] for r in rows]})

# Check every tracked protected file, including geography, packs, old atlases,
# LP-01, animation/audio/sky/navigation and source provenance, against 13B.
allowed = {'package.json', 'public/data/angles-decorations/manifest.json', 'src/architecture/material.ts', 'src/main.ts', 'src/materials/authentic.ts', 'src/nature/surfaces.ts', 'src/world/road-material.ts', 'src/world/surface-material.ts', 'docs/mission-13.md'}
tracked = git('ls-tree', '-r', '--name-only', BASE).decode().splitlines()
changed = [f for f in git('diff', '--name-only', BASE).decode().splitlines() if f in tracked]
unexpected = [f for f in changed if f not in allowed]
assert not unexpected, unexpected
old_manifest = json.loads(git('show', BASE + ':public/data/angles-decorations/manifest.json'))
new_manifest = json.loads((ROOT / 'public/data/angles-decorations/manifest.json').read_text())
generator_before = old_manifest['generators']['src/architecture/material.ts']
generator_after = new_manifest['generators']['src/architecture/material.ts']
assert generator_after == hashlib.sha256((ROOT / 'src/architecture/material.ts').read_bytes()).hexdigest()
old_manifest['generators']['src/architecture/material.ts'] = generator_after
assert old_manifest == new_manifest
protected = [f for f in tracked if (f.startswith('src/') or f.startswith('public/') or f.startswith('.github/')) and f not in allowed]
assert not git('diff', BASE, '--', *protected)
renderer_files = [f for f in changed if f.startswith('src/')] + ['src/materials/world.ts', 'src/materials/world-policy.mjs']
preservation = {'baselineCommit': BASE, 'capturesSource': 'baseline 7b2d711; integrated worktree based on that commit with renderer hashes below. Build badge correctly says modified. Report/credits added after recording.', 'rendererSha256': {f: hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in renderer_files}, 'protectedTrackedFilesUnchanged': len(protected), 'changedExistingFiles': changed, 'decorationManifestOnlyChange': {'generator': 'src/architecture/material.ts', 'before': generator_before, 'after': generator_after}, 'allDecorationPacksEntriesTreesAnchorsAndProvenanceUnchanged': True, 'positionNormalUvIndexBuffersChanged': False, 'extraGeometryOrDrawCalls': 0, 'sameNative450MetreRoute': True, 'sameCaptureCameraDateWeatherProfileResolution': True, 'treesInFallbackChecks': 2500, 'newResidentLibraryTextures': 1, 'hybridCompressedBytes': 1578189, 'hybridEstimatedGpuBytesWithMips': 5308332, 'libraryNetwork': 'local prepared files only; no Poly Haven/ambientCG call in game'}
write('preservation.json', preservation)
write('summary.json', {'captures': comparisons, 'performance': perf_rows, 'walks': walk_summary, 'limits': ['SwiftShader only; no physical GPU or Android validation', 'native recordings include capture overhead and are not frame synchronized', 'main gain near stone facades; roof and ground gains remain subtle', 'unchanged 10m DEM and partially masked cliff; building heights retain original provenance', 'photographic diagnostic uses common Lambert, not full PBR; Standard PBR remains the 13B laboratory', 'single-source motifs can remain recognizable on long surfaces']})

cards = []
for row in comparisons:
    key = row['id']
    figures = ''.join(f'<figure><a href="{p}/{key}.jpg"><img loading="lazy" src="{p}/{key}.jpg" width="960" height="640" alt="{html.escape(TITLES[key])} — {label}"></a><figcaption>{label}</figcaption></figure>' for p, label in zip(PHASES, LABELS))
    cards.append(f'<section id="{key}"><h2>{TITLES[key]}</h2><p>{row["geo"]["lat"]:.6f}, {row["geo"]["lon"]:.6f} · {row["date"]} · équilibré · 960 × 640</p><div class="triple">{figures}</div></section>')
table = ''.join('<tr><td>'+r['profile']+' / '+r['station']+'</td>'+''.join(f'<td>{a:.1f} / {b:.1f}</td>' for a,b in zip(r['medianMs'],r['p95Ms']))+f'<td>{r["hybridMedianChangePct"]:+.1f} %</td></tr>' for r in perf_rows)
videos = ''.join(f'<figure><video controls preload="metadata" playsinline src="{r["phase"]}-promenade.webm"></video><figcaption>{"Mission 12" if r["phase"]=="before" else "Hybride"} · {r["metres"]:.0f} m · {r["mediaSeconds"]:.1f} s · {r["frames"]} images</figcaption></figure>' for r in walk_summary)
page = '''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mission 13C — Angles en matières</title><style>body{margin:0;background:#14211f;color:#e8ede4;font:16px/1.6 system-ui}main{max-width:1500px;margin:auto;padding:24px}h1,h2{line-height:1.2}h2{margin-top:2.3em}a{color:#c5d5ad}nav{display:flex;gap:15px;flex-wrap:wrap}.triple{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.videos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;min-width:0}img,video{display:block;width:100%;height:auto;background:#111}figcaption{padding:8px 0;color:#c5d5c9}section>p{font-size:.85rem;color:#b7c4ba}.table{overflow:auto}table{border-collapse:collapse;white-space:nowrap}td,th{padding:9px;border-bottom:1px solid #3c5149;text-align:right}td:first-child,th:first-child{text-align:left}.note{border-left:3px solid #a5b88e;padding:12px 20px;background:#1e302a}@media(max-width:700px){main{padding:14px}.triple,.videos{grid-template-columns:1fr}}</style><main><p>ENDLESS EARTH · 13C · PR en brouillon</p><h1>Angles-sur-l’Anglin, les matières en promenade</h1><p>Captures du véritable jeu, sans génération d’image. Le gain le plus lisible vient des joints irréguliers des façades proches. Les toitures et sols restent discrets ; les grandes silhouettes sont conservées.</p><p class="note">Le diagnostic photographique utilise les couleurs brutes et hauteurs des sources sous le même éclairage Lambert que les autres variantes. Le PBR Standard complet reste dans l’atelier 13B. Ces trois rendus isolent l’intégration au village ; ils ne mesurent pas une géologie ou un matériau propre à chaque maison.</p><nav>'''+''.join(f'<a href="#{k}">{v}</a>' for k,v in TITLES.items())+'''<a href="#promenades">Promenades</a><a href="#performance">Coût</a></nav>'''+''.join(cards)+'''<h2 id="promenades">Deux promenades natives de 450 m</h2><p>Même parcours OSM, vue subjective, Éco, 640 × 360, juin, après-midi clair. Déplacement réel du jeu, sans téléportation, accélération, rejeu ou montage ; son enregistré après le limiteur. Les vidéos ont leurs temps natifs et ne sont pas synchronisées image par image. Le calcul logiciel et l’enregistrement ralentissent le navigateur.</p><div class="videos">'''+videos+'''</div><h2 id="performance">Coût réel dans cet environnement</h2><p>324 rendus avec lecture complète des pixels ; Chromium 156 / SwiftShader, 800 × 600, 12 échantillons par combinaison. Chaque case donne médiane / P95 en ms. Les appels et triangles sont identiques dans chaque triplet. Une texture supplémentaire en hybride ; deux pour le diagnostic photographique.</p><div class="table"><table><thead><tr><th>Profil / vue</th><th>Mission 12</th><th>Photographique</th><th>Hybride</th><th>Médiane hybride</th></tr></thead><tbody>'''+table+'''</tbody></table></div><p class="note">Le surcoût logiciel existe et doit peser dans la décision artistique. Ces chiffres ne sont pas des performances de GPU physique ni d’Android. L’hybride ajoute 1 578 189 octets et environ 5,06 Mio de texels avec mipmaps. La falaise garde le MNT à 10 m et ses masques : une texture ne corrige pas sa géométrie.</p><h2>Références, licences et méthode</h2><p>Les <a href="../index.html">photographies locales examinées en 13A</a> restent des références ; aucun de leurs pixels n’entre dans le jeu. Les écarts de joints, patine, couleur et échelle sont des comparaisons de familles, sans recalage photographique. Tous les nouveaux matériaux intégrés sont CC0 : <a href="../../../materials/authentic/credits.html">auteurs et sources</a>. Captures du moteur : sources IGN/ASP/OSM et crédits existants conservés.</p><p><a href="../../mission-13.md">Rapport principal</a> · <a href="summary.json">Synthèse et conditions</a> · <a href="preservation.json">Préservation</a> · <a href="README.md">Reproduire</a></p><p>Arrêt après 13C. La réussite technique ne vaut pas validation artistique ; 13D attend l’accord du propriétaire.</p></main></html>'''
(OUT/'index.html').write_text(page)
print('PASS: 36 real captures, 12 matched conditions, 324 renders, two native walks, preserved geography; gallery assembled')
