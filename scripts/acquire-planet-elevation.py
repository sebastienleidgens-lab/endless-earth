"""Resume an IGN69 terrain lattice; 2,500 points/request, one request at a time.
This is a sampled open RGE ALTI service, NOT a 0.5 m LiDAR acquisition.
"""
import argparse, hashlib, json, math, sys, time, urllib.request
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work/mission-26/python'))
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform, unary_union
p=argparse.ArgumentParser();p.add_argument('--step',type=int,default=128);p.add_argument('--dry-run',action='store_true');p.add_argument('--cache',default='work/mission-26/sources');a=p.parse_args()
root=Path(a.cache);admin=json.loads((root/'communes-86.json').read_text());project=Transformer.from_crs(4326,2154,always_xy=True).transform;inverse=Transformer.from_crs(2154,4326,always_xy=True).transform
boundary=unary_union([transform(project,shape(f['geometry'])) for f in admin['features']]);minx,miny,maxx,maxy=boundary.bounds
step=a.step;x0=math.floor((minx-4096)/step)*step;y0=math.floor((miny-4096)/step)*step;width=math.ceil((maxx+4096-x0)/step)+1;height=math.ceil((maxy+4096-y0)/step)+1
points=[(x0+x*step,y0+y*step) for y in range(height) for x in range(width)]
print('IGN lattice',width,height,len(points),'spacing',step,'requests',math.ceil(len(points)/2500),flush=True)
if a.dry_run:raise SystemExit()
batches=root/f'ign-{step}m-batches';batches.mkdir(exist_ok=True);values=[];records=[]
for offset in range(0,len(points),2500):
 file=batches/f'{offset:07d}.json';part=points[offset:offset+2500];ll=[inverse(*q) for q in part]
 request={'lon':'|'.join(f'{q[0]:.8f}' for q in ll),'lat':'|'.join(f'{q[1]:.8f}' for q in ll),'resource':'ign_rge_alti_wld','delimiter':'|','indent':'false','measures':'false','zonly':'true'}
 if not file.exists():
  body=json.dumps(request).encode();req=urllib.request.Request('https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json',data=body,headers={'Content-Type':'application/json','User-Agent':'EndlessEarth-Mission26 offline terrain preparation'})
  for attempt in range(3):
   try:
    with urllib.request.urlopen(req,timeout=120) as response:result=json.load(response)
    zs=result.get('elevations');assert isinstance(zs,list) and len(zs)==len(part)
    zs=[v.get('z') if isinstance(v,dict) else v for v in zs]
    if any(not isinstance(v,(int,float)) or not math.isfinite(v) or v < -999 for v in zs):raise ValueError('IGN nodata; preserve the gap')
    file.write_text(json.dumps({'offset':offset,'requestSha256':hashlib.sha256(body).hexdigest(),'retrievedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'elevations':zs},separators=(',',':'))+'\n');break
   except Exception as error:
    print('RETRY',offset,attempt,str(error),flush=True)
    if attempt==2:raise
    time.sleep(2*(attempt+1))
 data=json.loads(file.read_text());values.extend(data['elevations']);records.append({'path':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'retrievedAt':data['retrievedAt']});print('IGN',len(values),'/',len(points),flush=True)
 if offset+2500<len(points):time.sleep(.3)
out={'schema':'planet-elevation-lattice-v1','projection':'EPSG:2154','verticalDatum':'IGN69 normal height','source':'IGN RGE ALTI sampled API; native resolution not guaranteed by the point response','url':'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json','license':'Licence Ouverte 2.0','origin':[x0,y0],'width':width,'height':height,'step':step,'batches':records,'elevations':[round(v,2) for v in values]}
file=root/f'ign-{step}m.json';file.write_text(json.dumps(out,separators=(',',':'))+'\n');print('COMPLETE',file,hashlib.sha256(file.read_bytes()).hexdigest(),flush=True)
