#!/usr/bin/env python3
"""Offline IGN/ASP adapter to provider-neutral, clipped land-use features.

Retains native attributes, source identities, dates (including unknown dates),
licences and hashes. No class is inferred for uncovered ground. Polygon holes
survive clipping and topology-preserving 0.5 m simplification.
"""
import argparse,json,pathlib,hashlib,math

def prepare(raw_dir,output):
 from shapely.geometry import shape,mapping,box
 from shapely.ops import transform
 from pyproj import Transformer
 root=pathlib.Path(raw_dir);catalog={r['name']:r for r in json.loads((root/'vectors-index.json').read_text())}
 forward=Transformer.from_crs(4326,2154,always_xy=True).transform
 inverse=Transformer.from_crs(2154,4326,always_xy=True).transform
 domain=box(537276,6622779,539434,6624931)
 sources=[];features=[]
 for name in ['forest','vegetation','rpg','ocs']:
  path=root/(name+'.geojson');data=json.loads(path.read_text());record=catalog.get(name) or {'url':'https://data.geopf.fr/telechargement/download/OCSGE/OCS-GE_2-0__GPKG_LAMB93_D086_2023-01-01/OCS-GE_2-0__GPKG_LAMB93_D086_2023-01-01.7z','sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
  if data['numberReturned']!=data['numberMatched'] or record['sha256']!=hashlib.sha256(path.read_bytes()).hexdigest():raise ValueError('Truncated or changed WFS extraction')
  source={'id':name,'name':{'forest':'IGN BD Forêt V2','vegetation':'IGN BD TOPO V3 végétation','rpg':'ASP / IGN RPG 2024','ocs':'IGN OCS GE 2023 Vienne'}[name], 'license':'Licence Ouverte 2.0','url':record['url'],'sha256':record['sha256'],'vintage': '2024' if name=='rpg' else '2023' if name=='ocs' else None,'vintage_status':'annual declaration' if name=='rpg' else 'source millesime 2023' if name=='ocs' else 'acquisition not supplied per object; native dates retained, not treated as survey date','extent':[537276,6622779,539434,6624931],'source_crs':'EPSG:4326','query_extent_crs':'EPSG:2154','resolution_m':None,'resolution_status':'vector; not a raster resolution','confidence':'mapped; classifications depend on original product','retrieved_at':'2026-11-10','original_features':len(data['features'])}
  if name=='ocs':source.update(archive_sha256=data['source_archive_sha256'],gpkg_sha256=data['source_gpkg_sha256'],original_crs='EPSG:2154')
  sources.append(source)
  for f in sorted(data['features'],key=lambda f:str(f['id'])):
   p=f['properties'];kind=None;rank={'forest':60,'vegetation':80,'rpg':90,'ocs':70}[name];leaf=None
   if name=='forest':
    text=p.get('tfv','');kind='scrub' if text=='Lande' else 'wood' if 'Forêt' in text or 'Peupleraie' in text else None
    leaf='mixed' if 'conifères' in text and 'feuillus' in text else 'broadleaved' if 'feuillus' in text or 'chênes' in text or 'Peupleraie' in text else None
   elif name=='vegetation':
    text=p.get('nature','');kind='scrub' if text in ['Haie','Lande ligneuse'] else 'wood' if text in ['Bois','Forêt fermée de feuillus','Forêt ouverte','Peupleraie','Forêt fermée mixte'] else None
    leaf='broadleaved' if text in ['Forêt fermée de feuillus','Peupleraie'] else 'mixed' if text=='Forêt fermée mixte' else None
    if text=='Haie':rank=100
   elif name=='ocs':
    code=p['code_cs'];kind='built' if code.startswith('CS1.1') else 'bare' if code=='CS1.2.1' else 'wood' if code.startswith('CS2.1.1') else 'scrub' if code=='CS2.1.2' else 'open' if code in ['CS2.2.1','CS2.2.2'] else None
    if kind=='wood':rank=95;leaf={'CS2.1.1.1':'broadleaved','CS2.1.1.2':'needleleaved','CS2.1.1.3':'mixed'}.get(code)
    if kind=='built':rank=95
   else:
    group=p.get('code_group');kind='meadow' if group in ['17','18','19'] else 'orchard' if group=='20' else 'farmland'
    # Estives/landes are not automatically labelled meadow.
    if group=='17':kind='scrub'
   if kind is None:continue
   g=shape(f['geometry']);g=transform(forward,g)
   if not g.is_valid:raise ValueError('Invalid source polygon: '+str(f['id']))
   g=g.intersection(domain).simplify(.5,preserve_topology=True)
   parts=list(g.geoms) if g.geom_type=='MultiPolygon' else [g]
   for i,part in enumerate(parts):
    if part.is_empty or part.geom_type!='Polygon' or part.area<1:continue
    geographic=mapping(transform(inverse,part))
    def rounded(v):return [round(n,8) for n in v]
    geographic={'type':'Polygon','coordinates':[[rounded(pt) for pt in ring] for ring in geographic['coordinates']]}
    features.append({'type':'Feature','id':f"{name}/{f['id']}/{i}",'geometry':geographic,'properties':{'class':kind,'priority':rank,'leaf_type':leaf,'source_id':name,'original_id':f['id'],'attributes':p,'confidence':'mapped-class; individual vegetation is procedural'}})
 result={'schema':'endless-earth-environment-v1','type':'FeatureCollection','extent':[.870647894,46.685867733,.898152106,46.704732267],'projection':'EPSG:4326','simplification_m':.5,'replaces_generalized_clc_forest':True,'sources':sources,'features':features,'interpretation':'Boundaries and classes from sources; colors, plant individuals, heights and species are procedural. Gaps remain unknown. Priorities are a documented merge policy, not measured certainty.'}
 pathlib.Path(output).write_text(json.dumps(result,separators=(',',':'),ensure_ascii=False)+'\n');print('Prepared',len(features),'environment polygons')
 return result
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('raw_dir');p.add_argument('output');a=p.parse_args();prepare(a.raw_dir,a.output)
