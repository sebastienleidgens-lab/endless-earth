"""Summarize actual native timestamps; do not infer missing frames or journeys."""
import json, math, pathlib, statistics, subprocess, gzip

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/mission-26-1-evidence'

def percentile(values, p):
    v = sorted(values)
    return v[min(len(v) - 1, math.ceil(p * len(v)) - 1)] if v else None

cases = []
def project(lon,lat):
    # Same published GRS80 / Lambert-93 constants as coordinates.mjs.
    phi=math.radians(lat); e=.0818191910428158; n=.725607765053267
    sine=e*math.sin(phi); iso=math.log(math.tan(math.pi/4+phi/2))-.5*e*math.log((1+sine)/(1-sine))
    radius=11754255.426096*math.exp(-n*iso);theta=n*math.radians(lon-3)
    return 700000+radius*math.sin(theta),12655612.049876-radius*math.cos(theta)
assert math.hypot(project(3,46.5)[0]-700000,project(3,46.5)[1]-6600000)<.001
origin_lat,origin_lon=46.6953,.8844
base=json.loads((ROOT/'work/mission-26-1/pilot-boundary.json').read_text())['base']
for path in sorted(OUT.glob('*.json')):
    d = json.loads(path.read_text())
    if not isinstance(d, dict) or d.get('type') not in ['native-video','native-journey']:
        continue
    frames = d.get('frames', [])
    if not frames and d.get('framesFile'):
        with gzip.open(OUT/d['framesFile'],'rt') as stream:frames=json.load(stream)
    if not frames:
        continue
    spans, start, last, distance, bymode = [], None, None, 0, {}
    for i, f in enumerate(frames):
        running = f.get('activity') == 'running' and f.get('gait', {}).get('mode') == 'run'
        if running:
            start = f['t'] if start is None else start
            last = f['t']
        elif start is not None:
            spans.append((last - start) / 1000)
            start = None
        if i:
            a, b = frames[i-1]['position'], f['position']
            delta = math.hypot(b[0]-a[0], b[2]-a[2])
            distance += delta
            bymode[f['activity']] = bymode.get(f['activity'], 0) + delta
    if start is not None:
        spans.append((last - start) / 1000)
    wall = (frames[-1]['t'] - frames[0]['t']) / 1000
    ms = [f['ms'] for f in frames[1:] if f.get('ms', 0) > 0]
    geographic=[];projected_distance=0;last_projected=None
    for f in frames:
        x,y,z=f['position'];lat=origin_lat-z/111320;lon=origin_lon+x/(111320*math.cos(math.radians(origin_lat)));east,north=project(lon,lat)
        if last_projected:projected_distance+=math.hypot(east-last_projected[0],north-last_projected[1])
        last_projected=(east,north)
        geographic.append({'t':f['t'],'position':f['position'],'gps':{'lat':lat,'lon':lon,'height':y+base,'datum':'IGN69'},'projected':{'east':east,'north':north},'tile':f'{math.floor(east/4096)}:{math.floor(north/4096)}','owner':'protected-pilot' if abs(x)<=1000 and abs(z)<=1000 else 'department-contact','activity':f.get('activity'),'gait':f.get('gait'),'render':f.get('render')})
    trace=path.stem+'-geographic-trace.json.gz'
    with (OUT/trace).open('wb') as dest:
        with gzip.GzipFile(fileobj=dest,mode='wb',mtime=0) as compressed:compressed.write(json.dumps({'method':'Canonical WGS84 reconstructed exactly from the unchanged historical east/south frame. EPSG:2154 distance is separate from physical local-frame distance. Tile IDs derive from position; a protected pilot owner remains identified separately. No missing frames reconstructed.','sourceSHA':d.get('before',{}).get('source'),'frames':geographic},separators=(',',':')).encode())
    case = {
        'file': path.name, 'video': d['file'], 'raw': d['original'],
        'sourceSHA': d.get('before', {}).get('source'),
        'framebuffer': d.get('before', {}).get('buffer'),
        'framesObserved': len(frames), 'observedWallSeconds': wall,
        'longestConsecutiveRunningSeconds': max(spans, default=0),
        'run180Passed': max(spans, default=0) >= 180,
        'projectedDistanceM':projected_distance,'geographicTrace':trace,'canonicalTilesVisited':sorted(set(f['tile'] for f in geographic)),'localHorizontalDistanceM': distance, 'localDistanceByModeM': bymode,
        'nativeFPS': (len(frames)-1)/wall if wall else None,
        'frameMs': {'p50': percentile(ms,.5), 'p95':percentile(ms,.95), 'p99':percentile(ms,.99), 'max':max(ms,default=0)},
        'heapFirstBytes': frames[0].get('heap'), 'heapLastBytes':frames[-1].get('heap'),
        'heapMaxBytes':max(f.get('heap',0) for f in frames),
        'renderMemoryFirst':frames[0].get('memory'), 'renderMemoryLast':frames[-1].get('memory'),
        'errors':d.get('errors',[]), 'failure':d.get('failure'), 'media':d.get('media'),
        'rebases':len(d.get('rebaseEvents',[])),
        'limitations':['Observed intervals only; no hidden-time interpolation.', 'Distance in the historical local frame, not a surveyed EPSG metric.', 'Software GPU with simultaneous captures; not the isolated performance benchmark.', 'No perceptual certification from a low frame rate.']
    }
    cases.append(case)
report={'method':'Native rendered frame timestamps and actual controller positions, unmodified recordings. Running requires both activity=running and gait mode=run for every observed frame in a span. No cumulative-duration substitution.', 'cases':cases}
(OUT/'native-summary.json').write_text(json.dumps(report,indent=2)+'\n')
for c in cases:
    print(c['file'], round(c['longestConsecutiveRunningSeconds'],2), round(c['localHorizontalDistanceM'],2), round(c['nativeFPS'],2))
