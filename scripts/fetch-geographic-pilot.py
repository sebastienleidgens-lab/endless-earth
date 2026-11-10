#!/usr/bin/env python3
"""Bounded offline acquisition for the Angles pilot. No retries or browser IO.

Downloads official MNT tiles via the URLs in IGN's local WFS metadata, eight
local WFS extracts, and the OCS GE 2023 D086 package (smallest published unit).
Original files remain outside Git in work/. Every request retains its real URL,
status, redirect headers, size and SHA-256. Does not publish or change game data.
"""
import argparse,datetime,hashlib,json,pathlib,subprocess,urllib.parse
BBOX='537276,6622779,539434,6624931,EPSG:2154'
LAYERS={'buildings':'BDTOPO_V3:batiment','hedges':'BDTOPO_V3:haie','vegetation':'BDTOPO_V3:zone_de_vegetation','forest':'LANDCOVER.FORESTINVENTORY.V2:formation_vegetale','rpg':'RPG.2024:parcelles_graphiques','water':'BDTOPO_V3:surface_hydrographique','structures':'BDTOPO_V3:construction_lineaire','ortho-dates':'ORTHOIMAGERY.ORTHOPHOTOS.GRAPHE-MOSAIQUAGE:graphe_bdortho'}
def wfs(layer,crs='EPSG:4326',count=5000):return 'https://data.geopf.fr/wfs/ows?'+urllib.parse.urlencode({'SERVICE':'WFS','VERSION':'2.0.0','REQUEST':'GetFeature','TYPENAMES':layer,'OUTPUTFORMAT':'application/json','SRSNAME':crs,'BBOX':BBOX,'COUNT':count})
def acquire(output,only):
 root=pathlib.Path(output);root.mkdir(parents=True,exist_ok=True)
 if 'work' not in root.parts:raise ValueError('Use a work/ directory; raw archives must not enter the repository')
 records=[]
 def fetch(name,url,maximum=25000000):
  path=root/name
  p=subprocess.run(['curl','-sS','--location','--fail','--max-redirs','5','--max-time','180','--max-filesize',str(maximum),'--dump-header',str(path)+'.headers','--output',str(path), '--write-out','%{json}',url],capture_output=True,text=True)
  info=json.loads(p.stdout) if p.stdout else {};record={'name':name,'url':url,'http':info.get('http_code'),'effective_url':info.get('url_effective'),'redirects':info.get('num_redirects'),'exit':p.returncode,'error':p.stderr,'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
  if path.exists():record.update(bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
  records.append(record);(root/'acquisition-log.json').write_text(json.dumps(records,indent=2))
  if p.returncode:raise RuntimeError(f'{name}: HTTP {record["http"]}: {p.stderr}; no automatic retry')
  print(name,record['http'],record['bytes'],flush=True);return path,record
 if only in ['all','mnt']:
  url=wfs('IGNF_LIDAR-HD_METADONNEE:metadata','EPSG:2154',30);p,_=fetch('lidar-metadata.json',url);data=json.loads(p.read_text());features=data['features']
  if len(features)!=9 or data['numberMatched']!=9:raise ValueError('Re-audit changed tile coverage before downloading')
  files=[]
  for f in features:
   m=f['properties'];u=m['url_mnt'];parsed=urllib.parse.urlparse(u);q=urllib.parse.parse_qs(parsed.query)
   if parsed.netloc!='data.geopf.fr' or parsed.scheme!='https' or 'MNT' not in q.get('LAYERS',[''])[0] or m['systeme_altimetrique']!='IGN69' or m['systeme_planimetrique']!='LAMB93':raise ValueError('Unexpected tile product/CRS/datum')
   name=q['FILENAME'][0]
   if pathlib.Path(name).name!=name:raise ValueError('Unsafe provider filename')
   p,r=fetch(name,u,40000000);files.append({'path':name,'sha256':r['sha256'],'bytes':r['bytes'],'url':u,'metadata':m,'http':r['http']})
  dates={f['metadata']['date_debut_acquisition'].removesuffix('Z') for f in files}
  if len(dates)!=1:raise ValueError('Per-tile acquisition dates differ; review manifest schema')
  (root/'mnt-manifest.json').write_text(json.dumps({'product':'IGN LiDAR HD MNT','vertical_datum':'IGN69','license':'Licence Ouverte 2.0','acquired_at':dates.pop(),'edition':features[0]['properties']['date_edition'].removesuffix('Z'),'source_url':url,'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':files},indent=2))
 if only in ['all','vectors']:
  index=[]
  for name,layer in LAYERS.items():
   u=wfs(layer);p,r=fetch(name+'.geojson',u);d=json.loads(p.read_text())
   if d['numberMatched']!=len(d['features']):raise ValueError('Truncated vector extraction')
   index.append({'name':name,'layer':layer,'url':u,'http':r['http'],'matched':d['numberMatched'],'returned':len(d['features']),'sha256':r['sha256']})
  (root/'vectors-index.json').write_text(json.dumps(index,indent=2))
 if only in ['all','ocs']:
  base='https://data.geopf.fr/telechargement/download/OCSGE/OCS-GE_2-0__GPKG_LAMB93_D086_2023-01-01/OCS-GE_2-0__GPKG_LAMB93_D086_2023-01-01'
  md5,_=fetch('ocs-2023.md5',base+'.md5');archive,_=fetch('ocs-2023.7z',base+'.7z',130000000)
  if hashlib.md5(archive.read_bytes()).hexdigest()!=md5.read_text().split()[0]:raise ValueError('Official OCS archive checksum mismatch')
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',default='work/mission-08-5/raw');p.add_argument('--only',choices=['all','mnt','vectors','ocs'],default='all');a=p.parse_args();acquire(a.output,a.only)
