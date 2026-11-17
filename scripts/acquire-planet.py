"""Bounded, resumable open-data acquisition. Raw files stay OUT of public/git.

python scripts/acquire-planet.py [--dry-run] [--only admin|dem|osm]
Each successful download is hash-bound; failures never become fabricated data.
"""
import argparse
import fcntl
import gzip
import hashlib
import json
from pathlib import Path
import time
import urllib.parse
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--dry-run', action='store_true')
parser.add_argument('--only', choices=['admin', 'dem', 'osm'])
parser.add_argument('--osm-format', choices=['pbf', 'overpass'], default='pbf')
parser.add_argument('--cache', default='work/mission-26/sources')
args = parser.parse_args()
root = Path(args.cache)
root.mkdir(parents=True, exist_ok=True)
journal_path = root / 'acquisition.json'
journal = json.loads(journal_path.read_text()) if journal_path.exists() else {}

def download(name, url, *, payload=None, limit=180_000_000, license, datum=None):
    path = root / name
    if path.exists() and name in journal:
        if hashlib.sha256(path.read_bytes()).hexdigest() == journal[name]['sha256']:
            print('CACHE', name, flush=True)
            return path
        raise ValueError('Cache checksum mismatch: ' + name)
    print('PLAN' if args.dry_run else 'FETCH', name, url, flush=True)
    if args.dry_run:
        return path
    req = urllib.request.Request(url, data=payload, headers={
        'User-Agent': 'EndlessEarth-Mission26/1.0 (open geographic data preparation)',
        'Accept-Encoding': 'gzip',
        **({'Content-Type': 'application/x-www-form-urlencoded'} if payload else {})
    })
    started = time.monotonic()
    with urllib.request.urlopen(req, timeout=240) as response:
        raw = response.read(limit + 1)
        if len(raw) > limit:
            raise ValueError('Download budget exceeded')
        decoded = gzip.decompress(raw) if response.headers.get('Content-Encoding') == 'gzip' else raw
        if name.endswith('.json.gz'):
            obj = json.loads(decoded)
            if obj.get('remark') or not obj.get('elements'):
                raise ValueError('Incomplete OSM response: ' + str(obj.get('remark')))
            encoded = gzip.compress(decoded, mtime=0)
        else:
            if name.endswith('.json'):
                json.loads(decoded)
            encoded = decoded
        temporary = path.with_suffix(path.suffix + '.part')
        temporary.write_bytes(encoded)
        temporary.replace(path)
        journal[name] = dict(url=url, request=payload.decode() if payload else None,
            retrievedAt=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            sha256=hashlib.sha256(encoded).hexdigest(), bytes=len(encoded),
            seconds=round(time.monotonic()-started, 3), license=license,
            verticalDatum=datum, etag=response.headers.get('ETag'))
        # Different independent layer downloads may run concurrently. Merge
        # under a filesystem lock instead of overwriting another layer's log.
        with (root/'.acquisition.lock').open('w') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            latest = json.loads(journal_path.read_text()) if journal_path.exists() else {}
            latest[name] = journal[name]
            temporary_journal = root/'acquisition.json.part'
            temporary_journal.write_text(json.dumps(latest, ensure_ascii=False, indent=2)+'\n')
            temporary_journal.replace(journal_path)
        print('SAVED', name, len(encoded), journal[name]['sha256'], flush=True)
    return path

if args.only in [None, 'admin']:
    download('communes-86.json', 'https://geo.api.gouv.fr/departements/86/communes?geometry=contour&format=geojson&fields=nom,code,centre', license='Licence Ouverte 2.0; API Geo / IGN administrative contours')

if args.only in [None, 'dem']:
    # GLO-90 is a surface model, NOT bare-earth IGN LiDAR. EGM2008 remains explicit.
    for lat in [45, 46, 47]:
        for lon in [-1, 0, 1]:
            key = f'Copernicus_DSM_COG_30_N{lat:02d}_00_{"E" if lon >= 0 else "W"}{abs(lon):03d}_00_DEM'
            download(key+'.tif', f'https://copernicus-dem-90m.s3.amazonaws.com/{key}/{key}.tif', license='Copernicus DEM Licence; GLO-90 free worldwide, attribution required', datum='EGM2008 orthometric surface height')

if args.only in [None, 'osm']:
    if args.osm_format == 'pbf':
        download('vienne.osm.pbf', 'https://download.openstreetmap.fr/extracts/europe/france/poitou_charentes/vienne.osm.pbf', license='ODbL 1.0; © OpenStreetMap contributors; extract hosted by OpenStreetMap France')
        raise SystemExit()
    admin = root / 'communes-86.json'
    if not admin.exists():
        raise SystemExit('Acquire administrative contours before OSM')
    points = []
    def coords(v):
        if v and isinstance(v[0], (int, float)):
            points.append(v)
        else:
            for a in v: coords(a)
    for feature in json.loads(admin.read_text())['features']:
        coords(feature['geometry']['coordinates'])
    west, south = min(p[0] for p in points)-.015, min(p[1] for p in points)-.015
    east, north = max(p[0] for p in points)+.015, max(p[1] for p in points)+.015
    box = f'({south:.6f},{west:.6f},{north:.6f},{east:.6f})'
    query = '[out:json][timeout:180][maxsize:536870912];(' + ''.join(
        f'way[{tag}]{box};' for tag in ['highway', 'waterway', 'railway', 'aeroway', 'building', 'landuse', 'natural', 'barrier']) + ');out tags geom;'
    payload = urllib.parse.urlencode({'data':query}).encode()
    errors = []
    for endpoint in ['https://overpass.private.coffee/api/interpreter', 'https://overpass-api.de/api/interpreter']:
        try:
            download('osm-86.json.gz', endpoint, payload=payload, license='ODbL 1.0; © OpenStreetMap contributors; source database kept separate')
            break
        except Exception as error:
            errors.append(dict(endpoint=endpoint, error=str(error)))
            print('UNAVAILABLE', endpoint, str(error), flush=True)
    else:
        (root/'osm-errors.json').write_text(json.dumps(errors, indent=2)+'\n')
        raise SystemExit('OSM unavailable; do not manufacture geographic networks')
