"""Resumable 2 m IGN LHD numeric WMS derivatives for the existing Vienne tiles. --dry-run performs no transfer."""
import pathlib,json,urllib.request,urllib.parse,hashlib,gzip,time,sys,concurrent.futures,shutil
import numpy as np,rasterio
from rasterio.io import MemoryFile
root=pathlib.Path('work/mission-26-1/sources/department-contact');root.mkdir(parents=True,exist_ok=True);out=pathlib.Path('public/planet/fr-86/contact-2m');out.mkdir(exist_ok=True)
manifest=json.load(open('public/planet/fr-86/manifest.json'));entries=manifest['tiles'];step=2;size=2049
# Prepare the actual departure and representative towns before distant background data.
anchors=[(538355,6623855),(480000,6605500),(516000,6610000),(503000,6646000)]
entries.sort(key=lambda t:min(((t['bounds'][0]+t['bounds'][2])/2-x)**2+((t['bounds'][1]+t['bounds'][3])/2-y)**2 for x,y in anchors))
estimate={'tiles':len(entries),'effectiveStepM':step,'maximumNetworkBytes':len(entries)*32*1024*1024,'expectedUncompressedFloatBytes':len(entries)*size*size*4,'storageAvailableBytes':shutil.disk_usage(root).free,'rawStorage':'Exact acquired GeoTIFF bytes kept in gzip, SHA of original and compressed copy; raw values never overwritten.','priceEUR':0,'source':'Open official IGN numeric LiDAR HD MNT WMS; acquisition/edition varies geographically and is not inferred from the pilot.'}
print(json.dumps(estimate),flush=True)
if '--dry-run' in sys.argv:sys.exit()
def prepare(t):
 key=t['id'].replace(':','-');receipt=root/(key+'.json');rawpath=root/(key+'.tif.gz');target=out/(key+'.pack')
 if receipt.exists() and target.exists():
  previous=json.load(open(receipt))
  if previous.get('derivativeVersion')==2 or isinstance(previous.get('derivativeVersion'),str):return previous
 x0,y0,x1,y1=t['bounds'];params={'SERVICE':'WMS','VERSION':'1.3.0','REQUEST':'GetMap','LAYERS':'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93','FORMAT':'image/geotiff','STYLES':'','CRS':'EPSG:2154','BBOX':f'{x0-1},{y0-1},{x1+1},{y1+1}','WIDTH':size,'HEIGHT':size,'TRANSPARENT':'FALSE'}
 url='https://data.geopf.fr/wms-r?'+urllib.parse.urlencode(params)
 raw=None
 if rawpath.exists():
  try:raw=gzip.decompress(rawpath.read_bytes())
  except (EOFError,OSError):rawpath.unlink()
 if raw is None:
  for attempt in range(5):
   try:
    with urllib.request.urlopen(url,timeout=240) as r:raw=r.read(32*1024*1024+1)
    if len(raw)>32*1024*1024 or not raw.startswith(b'II*\0'):raise ValueError('Unexpected or oversized numeric GeoTIFF')
    temp=rawpath.with_suffix('.tmp');temp.write_bytes(gzip.compress(raw,compresslevel=3,mtime=0));temp.replace(rawpath);break
   except Exception:
    if attempt==4:raise
    time.sleep(attempt+1)
 with MemoryFile(raw) as mem:
  with mem.open() as ds:
   assert ds.count==1 and ds.width==size and ds.height==size and abs(ds.res[0]-2)<1e-8 and abs(ds.res[1]-2)<1e-8
   # Georeferencing comes from the explicitly requested/verified metric grid.
   assert abs(ds.bounds.left-(x0-1))<.001 and abs(ds.bounds.top-(y1+1))<.001
   a=ds.read(1)[::-1,:];valid=np.isfinite(a)&(a>=0)&(a<5000)
   # WMS interpolation at nodata edges can produce negative blended values.
   # Exclude their 4 m neighbourhood explicitly, retaining original bytes.
   bad=~valid;expanded=bad.copy()
   for dy in range(-2,3):
    for dx in range(-2,3):
     dstY=slice(max(0,dy),min(size,size+dy));dstX=slice(max(0,dx),min(size,size+dx));srcY=slice(max(0,-dy),min(size,size-dy));srcX=slice(max(0,-dx),min(size,size-dx));expanded[dstY,dstX]|=bad[srcY,srcX]
   valid&=~expanded
   offset=int(np.floor(a[valid].min())) if valid.any() else 0
   if valid.any() and (a[valid].max()-offset)*100>=65535:raise ValueError('Elevation span exceeds 16-bit centimetre representation')
   q=np.full(a.shape,65535,dtype=np.uint16);q[valid]=np.rint((a[valid]-offset)*100).astype(np.uint16)
   delta=q.copy();delta[:,1:]=(q[:,1:].astype(np.int32)-q[:,:-1].astype(np.int32)).astype(np.uint16);packed=gzip.compress(delta.astype('<u2').tobytes(),compresslevel=6,mtime=0);target.write_bytes(packed)
   item={'derivativeVersion':2,'nodataPolicy':'Nonfinite or negative numeric WMS samples and their 4 m neighbourhood excluded; mainland Vienne scope only; original raw bytes retained.','id':t['id'],'schema':'planet-contact-tile-v1','url':'contact-2m/'+target.name,'component':'u16-centimetre-row-delta','offsetM':offset,'nodata':65535,'size':size,'step':2,'bounds':t['bounds'],'datum':'IGN69','projection':'EPSG:2154','bytes':len(packed),'decodedBytes':q.nbytes,'sha256':hashlib.sha256(packed).hexdigest(),'validFraction':float(valid.mean()),'rawSha256':hashlib.sha256(raw).hexdigest(),'rawGzipSha256':hashlib.sha256(rawpath.read_bytes()).hexdigest(),'sourceURL':url,'retrievedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'license':'Licence Ouverte 2.0','confidence':'IGN numeric MNT service; effective 2 m resampling; no independent absolute survey accuracy claim','originalCRS':ds.crs.to_wkt() if ds.crs else None,'quantizationMaxErrorM':.005}
 receipt.write_text(json.dumps(item,indent=2));return item
rows=[]
# Four requests at most, bounded raw/derived storage. Each receipt is resumable.
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 futures={pool.submit(prepare,t):t['id'] for t in entries}
 for future in concurrent.futures.as_completed(futures):
  try:r=future.result();rows.append(r);print('CONTACT',len(rows),len(entries),r['id'],r['bytes'],r['validFraction'],flush=True)
  except Exception as e:print('FAILED',futures[future],str(e),flush=True)
  (out/'manifest.tmp').write_text(json.dumps({'schema':'planet-contact-manifest-v1','source':'IGN LiDAR HD MNT numeric WMS','effectiveStepM':2,'datum':'IGN69','license':'Licence Ouverte 2.0','tiles':sorted(rows,key=lambda r:r['id']),'expected':len(entries),'limitation':'Geographic source acquisition dates are not inferred from the pilot metadata. Nodata remains explicit; row-delta centimetre quantization bounds are separate from source accuracy.'},indent=2));(out/'manifest.tmp').replace(out/'manifest.json')
