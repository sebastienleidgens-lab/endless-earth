"""Reacquire pinned, licensed IGN MNT tiles for independent terrain checks."""
import pathlib,json,hashlib,urllib.request,concurrent.futures,datetime
root=pathlib.Path('work/mission-23/mnt');root.mkdir(parents=True,exist_ok=True)
meta=json.load(open('docs/mission-08-5-sources.json'))['mnt']
def acquire(item):
 p=root/item['path']
 if not p.exists():
  with urllib.request.urlopen(item['url'],timeout=90) as response:data=response.read()
  if hashlib.sha256(data).hexdigest()!=item['raw_sha256']:raise ValueError('Pinned IGN payload changed: '+item['path'])
  p.write_bytes(data)
 if hashlib.sha256(p.read_bytes()).hexdigest()!=item['raw_sha256']:raise ValueError('Corrupt cached IGN raster')
 print(item['path'],p.stat().st_size,flush=True)
 return {'path':item['path'],'url':item['url'],'sha256':item['raw_sha256'],'bytes':p.stat().st_size,'metadata':item['metadata']}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(acquire,meta['files']))
pathlib.Path('docs/mission-23-evidence/mnt-sources.json').write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'license':meta['license'],'acquiredAt':meta['acquired_at'],'edition':meta['edition'],'verticalDatum':meta['vertical_datum'],'nativeSpacingM':.5,'method':'Unchanged raw GeoTIFFs from official URLs pinned by Mission 08.5; WMS CRS serialization issue known, exact grid/declared Lambert93 used without resampling. No new absolute accuracy claim.','files':rows},indent=2)+'\n')
