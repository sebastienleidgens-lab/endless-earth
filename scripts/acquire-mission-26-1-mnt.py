"""Reacquire nine pinned 0.5 m IGN tiles, bounded before any transfer. No historical file is overwritten."""
import json,pathlib,hashlib,urllib.request,concurrent.futures,sys,datetime,time
meta=json.load(open('docs/mission-08-5-sources.json'))['mnt'];root=pathlib.Path('work/mission-26-1/sources/mnt');root.mkdir(parents=True,exist_ok=True)
if '--dry-run' in sys.argv:
 print(json.dumps({'tiles':len(meta['files']),'nativeStepM':.5,'maximumDownloadBytes':len(meta['files'])*32*1024*1024,'source':'Existing pinned IGN LiDAR HD WMS numeric GeoTIFF requests','existingBytes':sum(p.stat().st_size for p in root.glob('*.tif'))},indent=2));sys.exit()
def acquire(f):
 p=root/f['path'];data=p.read_bytes() if p.exists() else None
 if data is None:
  for attempt in range(4):
   try:
    with urllib.request.urlopen(f['url'],timeout=180) as r:data=r.read(32*1024*1024+1)
    break
   except Exception:
    if attempt==3:raise
    time.sleep(1+attempt)
  if len(data)>32*1024*1024:raise ValueError('Raster request exceeded estimated maximum')
  if hashlib.sha256(data).hexdigest()!=f['raw_sha256']:raise ValueError('Pinned IGN payload changed; do not use without new provenance')
  p.write_bytes(data)
 digest=hashlib.sha256(data).hexdigest();assert digest==f['raw_sha256'];print(p.name,len(data),flush=True)
 return {'path':str(p),'bytes':len(data),'sha256':digest,'url':f['url'],'metadata':f['metadata']}
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:rows=list(pool.map(acquire,meta['files']))
pathlib.Path('docs/mission-26-1-evidence/mnt-acquisition.json').write_text(json.dumps({'method':'Pinned numeric source, no imagery interpreted as height. Original WMS serialization CRS issue must be normalized before use.','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'license':meta['license'],'datum':meta['vertical_datum'],'edition':meta['edition'],'files':rows},indent=2))
