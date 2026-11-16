"""Summarize observed controller traces; never turn a source plan into travel."""
import json,math,pathlib
root=pathlib.Path('docs/mission-26-3-evidence')
def read(p):return json.loads(p.read_text())
rows=[];features=[]
for p in sorted(root.rglob('*.json')):
 if 'builds' in p.parts:continue
 try:d=read(p)
 except Exception:continue
 if not isinstance(d,dict) or not isinstance(d.get('travel'),dict):continue
 t=d['travel'];trace=[q.get('state',q)for q in t.get('trace',[])]
 if not trace:continue
 path=str(p.relative_to(root));chosen=d.get('chosen',{});end=t.get('end',{});start=d.get('start',d.get('before',{}));reason=(t.get('failureState')or{}).get('reason') or ((end.get('movement')or{}).get('obstruction')or{}).get('reason') or d.get('failure')
 status=d.get('status') or ('COMPLETED' if t.get('completed') else 'ERROR' if d.get('failure') else 'PHYSICAL_BLOCKED')
 coords=[]
 for q in [start,*trace,end]:
  gps=q.get('gps');pos=q.get('position')
  if gps and all(math.isfinite(gps.get(k,float('nan'))) for k in ['lon','lat']):coords.append([gps['lon'],gps['lat']])
 tiles=sorted(set(q['canonicalTile']for q in trace if q.get('canonicalTile')))
 arrived=bool(t.get('completed',d.get('functionalSuccess',False)))
 mode=chosen.get('mode')or('foot'if 'offroad' in path else'boat')
 row=dict(id=path.removesuffix('.json'),evidence=path,sourceSHA=d.get('sourceSHA'),dataPin='acb0a73b396229bf90731b90a558a8d5d072a9ec',mode=mode,status=status,controllerArrived=arrived,allAssertionsPassed=d.get('functionalSuccess',False),distanceM=t.get('distanceM'),offRoadDistanceM=t.get('offRoadDistanceM'),simulationSeconds=t.get('simulatedSeconds'),wallSeconds=t.get('wallSeconds'),startGPS=coords[0]if coords else None,arrivalGPS=coords[-1]if coords and arrived else None,lastGPS=coords[-1]if coords else None,tiles=tiles,tileCount=len(tiles),reason=reason,method=d.get('method'),maxStepM=t.get('maxStepM'),traceSamples=len(trace),errors=d.get('errors',[]),postTrip={k:d[k]for k in ['returnAndResume','parkingAndWalking']if k in d})
 if path=='river-1-priority.json':row['interpretation']='Normal end of the demonstrated short Clain component, manual takeover, return and dock succeeded. Outer PHYSICAL_BLOCKED denotes the unmet1km criterion; it does not prove a collision.'
 # Large raw telemetry remains in its original evidence file, rather than
 # duplicating pose/stream snapshots in the summary.
 for k,v in row['postTrip'].items():row['postTrip'][k]={a:b for a,b in v.items()if a in ['method','completed','distanceM','returnDistanceM','resumeErrorM','resumePositionErrorM','releasedInputDriftM','movedFromSaveM','reason']}
 rows.append(row)
 if len(coords)>1:features.append(dict(type='Feature',properties={k:v for k,v in row.items()if k not in ['postTrip','errors','method']},geometry=dict(type='LineString',coordinates=coords)))
report=dict(method='Horizontal physical root displacement accumulated on EVERY executed controller step. GeoJSON joins sampled roots, not all substeps; its polyline length is NOT the odometer. Restores, car door transitions and independent placements are excluded from travel distance. Source plans are never counted. IGN69 elevations remain in raw traces, WGS84 map has no vertical coordinate.',journeys=rows)
(root/'journeys.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(root/'journeys.geojson').write_text(json.dumps(dict(type='FeatureCollection',features=features),ensure_ascii=False,separators=(',',':'))+'\n')
print([(r['evidence'],r['status'],round(r['distanceM'],2))for r in rows])
