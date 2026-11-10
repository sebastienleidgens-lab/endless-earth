import json,pathlib,numpy as np
p=pathlib.Path('docs/mission-08-5-captures');b=json.loads((p/'benchmark.json').read_text());out={'environment':b['runs'][0]['environment'],'method':b['method'],'comparison':{}}
for name in b['runs'][0]['results']:
 item={}
 for phase in ['before','after']:
  runs=[r for r in b['runs'] if r['phase']==phase];v=[s['completeMs'] for r in runs for s in r['results'][name]['samples']];x=runs[-1]['results'][name]
  item[phase]={'median_ms':float(np.median(v)),'p95_ms':float(np.quantile(v,.95)),'max_ms':max(v),'calls':x['samples'][0]['calls'],'triangles':x['samples'][0]['triangles'],'geometry_bytes':x['memory']['geometryBytes'],'texture_bytes_estimated_with_mipmaps':x['memory']['terrainTextureBytesWithMipmaps'],'round_medians_ms':[float(np.median([s['completeMs'] for s in r['results'][name]['samples']])) for r in runs]}
 item['percent']=(item['after']['median_ms']/item['before']['median_ms']-1)*100;out['comparison'][name]=item
out['load']={phase:{'median_ms':float(np.median([r['loadMs'] for r in b['runs'] if r['phase']==phase])),'samples_ms':[r['loadMs'] for r in b['runs'] if r['phase']==phase],'terrain_cpu_ms':[t for r in b['runs'] if r['phase']==phase for t in r['terrainCpuMs']]} for phase in ['before','after']}
(p/'performance-summary.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
