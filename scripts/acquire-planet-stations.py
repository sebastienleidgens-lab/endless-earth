"""Official SNCF open station metadata; bounded free acquisition. --dry-run makes no transfer."""
import urllib.request,urllib.parse,json,pathlib,hashlib,datetime,sys
params={'where':'x_wgs84 >= -0.1 and x_wgs84 <= 1.3 and y_wgs84 >= 46.05 and y_wgs84 <= 47.2'}
url='https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/liste-des-gares/exports/json?'+urllib.parse.urlencode(params)
if '--dry-run' in sys.argv:print(json.dumps({'url':url,'maxBytes':10*1024*1024,'priceEUR':0}));sys.exit()
with urllib.request.urlopen(url,timeout=60) as r:raw=r.read(10*1024*1024+1)
if len(raw)>10*1024*1024:raise ValueError('Station response exceeds budget')
rows=json.loads(raw);print('source',len(rows),'departments',sorted(set(str(r.get('departemen')) for r in rows)))
selected=[r for r in rows if str(r.get('departemen','')).upper() in ['VIENNE','86']];stations={}
for r in selected:
 id=str(r['code_uic']);station=stations.setdefault(id,{'id':'sncf:'+id,'name':r['libelle'],'lat':r['y_wgs84'],'lon':r['x_wgs84'],'x':r['x_l93'],'y':r['y_l93'],'commune':r['commune'],'passenger':r['voyageurs']=='O','freight':r['fret']=='O','lines':[]});station['lines'].append(r['code_ligne'])
value={'schema':'planet-stations-v1','source':'SNCF Réseau · Liste des gares · official open dataset','sourceURL':url,'sourceSHA':hashlib.sha256(raw).hexdigest(),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'license':'© SNCF Réseau · Open Database License (ODbL)','priceEUR':0,'stations':list(stations.values()),'limitation':'Infrastructure metadata, not live service/timetable/platform coordinates. Synthetic train stops are inferred from projection onto the admitted loaded rail; no boarding claim.'}
p=pathlib.Path('public/planet/fr-86/stations.json');p.write_text(json.dumps(value,ensure_ascii=False,indent=2));archive=pathlib.Path('work/mission-26-1/sources/sncf-gares.json');archive.write_bytes(raw);print('selected',len(stations),len(selected))
