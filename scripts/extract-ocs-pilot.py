#!/usr/bin/env python3
"""Read only intersecting OCS GE GeoPackage records through its RTree index."""
import sqlite3,pathlib,json,argparse,hashlib

def extract(gpkg,archive,output):
 from shapely import from_wkb
 from shapely.geometry import mapping,box
 from shapely.ops import transform
 from pyproj import Transformer
 gpkg=pathlib.Path(gpkg);archive=pathlib.Path(archive);c=sqlite3.connect(f'file:{gpkg}?mode=ro',uri=True);c.row_factory=sqlite3.Row
 if c.execute("select srs_id from gpkg_geometry_columns where table_name='OCCUPATION_SOL'").fetchone()[0]!=2154:raise ValueError('Unexpected OCS CRS')
 if c.execute('pragma quick_check').fetchone()[0]!='ok':raise ValueError('Invalid GeoPackage')
 rows=c.execute('select o.* from OCCUPATION_SOL o join rtree_OCCUPATION_SOL_the_geom r on r.id=o.fid where r.minx<=? and r.maxx>=? and r.miny<=? and r.maxy>=? order by o.id',(539434,537276,6624931,6622779)).fetchall()
 extent=box(537276,6622779,539434,6624931);inverse=Transformer.from_crs(2154,4326,always_xy=True).transform;features=[]
 for row in rows:
  p=dict(row);blob=p.pop('the_geom');flags=blob[3];envelope=(flags>>1)&7;size={0:0,1:32,2:48,3:48,4:64}.get(envelope)
  if size is None or blob[:2]!=b'GP':raise ValueError('Invalid GPKG geometry')
  g=from_wkb(blob[8+size:]);g=g.intersection(extent)
  if g.is_empty:continue
  if not g.is_valid:raise ValueError('Invalid source OCS polygon')
  features.append({'type':'Feature','id':p['id'],'geometry':mapping(transform(inverse,g)),'properties':p})
 result={'type':'FeatureCollection','numberMatched':len(features),'numberReturned':len(features),'source_archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'source_gpkg_sha256':hashlib.sha256(gpkg.read_bytes()).hexdigest(),'features':features}
 pathlib.Path(output).write_text(json.dumps(result,separators=(',',':'),ensure_ascii=False));print('Extracted',len(features),'OCS polygons')
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('gpkg');p.add_argument('archive');p.add_argument('output');a=p.parse_args();extract(a.gpkg,a.archive,a.output)
