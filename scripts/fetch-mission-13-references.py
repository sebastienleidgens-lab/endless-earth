"""Re-download only the 38 explicitly catalogued 13A references into work/.

No renderer preparation or network service. SHA-256 mismatch stops the run.
Photographic originals are deliberately not fetched: checksums cover the
documented Wikimedia thumbnails and Panoramax SD files, not HD originals.
"""
import argparse
import hashlib
import json
import pathlib
import urllib.request

p = argparse.ArgumentParser()
p.add_argument('--only', help='Comma-separated catalogue IDs; omit for all 38')
p.add_argument('--cache', default='work/mission-13/sources')
a = p.parse_args()
entries = json.loads(pathlib.Path('docs/mission-13-evidence/catalog.json').read_text())['entries']
selected = set(a.only.split(',')) if a.only else {r['id'] for r in entries}
unknown = selected - {r['id'] for r in entries}
if unknown:
    raise ValueError(f'Unknown reference IDs: {unknown}')
cache = pathlib.Path(a.cache)
cache.mkdir(parents=True, exist_ok=True)
for r in entries:
    if r['id'] not in selected:
        continue
    suffix = '.zip' if r['format'].startswith('ZIP') else '.jpg'
    path = cache / (r['id'] + suffix)
    if not path.exists():
        req = urllib.request.Request(r['download'], headers={'User-Agent': 'EndlessEarth-Mission13/1.0 (material reference research)'})
        with urllib.request.urlopen(req, timeout=90) as response:
            data = response.read()
    else:
        data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != r['sha256']:
        raise ValueError(f'Source changed: {r["id"]}; inspect new provenance before accepting')
    path.write_bytes(data)
    print(r['id'], len(data), r['license'])
