"""Bounded, resumable acquisition of source-confirmed MNT around the pilot. --dry-run estimates all transfers."""
import pathlib,json,hashlib,urllib.request,urllib.parse,time,sys,datetime,importlib.util
meta=json.load(open('work/mission-26-1/sources/lidar-metadata.json'));root=pathlib.Path('work/mission-26-1/sources/mnt');root.mkdir(parents=True,exist_ok=True)
pins={f['path']:f['raw_sha256'] for f in json.load(open('docs/mission-08-5-sources.json'))['mnt']['files']};items=[]
for f in meta['features']:
 p=f['properties'];points=[]
 def flatten(v):
  if isinstance(v[0],(int,float)):points.append(v)
  else:
   for child in v:flatten(child)
 flatten(f['geometry']['coordinates']);x=(min(q[0] for q in points)+max(q[0] for q in points))/2;y=(min(q[1] for q in points)+max(q[1] for q in points))/2
 if not (536000<x<541000 and 6621000<y<6627000):continue
 if p.get('systeme_altimetrique')!='IGN69' or p.get('systeme_planimetrique')!='LAMB93':continue
 url=p['url_mnt'];name=urllib.parse.parse_qs(urllib.parse.urlparse(url).query)['FILENAME'][0];items.append((name,url,p))
items.sort();assert len(items)==30
estimate={'tiles':len(items),'cachedTiles':sum((root/n).exists() for n,_,_ in items),'maximumAdditionalBytes':sum(not(root/n).exists() for n,_,_ in items)*32*1024*1024,'nativeStepM':.5,'target':'Contact corridor around the existing pilot; not the whole department','paidServices':False}
print(json.dumps(estimate),flush=True)
if '--dry-run' in sys.argv:sys.exit()
records=[]
for name,url,properties in items:
 p=root/name
 if not p.exists():
  for attempt in range(5):
   try:
    with urllib.request.urlopen(url,timeout=180) as r:raw=r.read(32*1024*1024+1)
    if len(raw)>32*1024*1024:raise ValueError('Download bound exceeded')
    if not raw.startswith(b'II*\x00'):raise ValueError('Expected numeric GeoTIFF')
    p.write_bytes(raw);break
   except Exception:
    if attempt==4:raise
    time.sleep(attempt+1)
 raw=p.read_bytes();digest=hashlib.sha256(raw).hexdigest()
 if name in pins:assert digest==pins[name],'Historical raw MNT changed'
 records.append({'path':str(p.resolve()),'url':url,'sha256':digest,'bytes':len(raw),'metadata':properties,'historicalRawSha256':pins.get(name)})
 print(name,len(raw),digest,flush=True)
out=pathlib.Path('work/mission-26-1/sources/mnt-sources.json');out.write_text(json.dumps({'source':'Official IGN LiDAR HD MNT numeric WMS, metadata from the official WFS','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'license':'Licence Ouverte 2.0','nativeSpacingM':.5,'verticalDatum':'IGN69','files':records},indent=2))
spec=importlib.util.spec_from_file_location('normalizer','scripts/normalize-ign-wms-mnt.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.normalize(out,'work/mission-26-1/sources/normalized')
