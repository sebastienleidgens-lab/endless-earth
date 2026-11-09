"""Compare matched held-frame measurements; never infer hardware FPS."""
import json
import pathlib
import statistics

root = pathlib.Path('docs/mission-07-captures')
b = json.loads((root / 'before.json').read_text())
a = json.loads((root / 'after.json').read_text())
result = {'referenceCommit': 'cc7cf2cd17eadb6a240830e9877dc5a2c6fad86a',
          'protocol': 'same held cameras/caches/date; 5 full RGBA readbacks after 2 warmup renders per station; one rotation before then after; no hardware FPS claim',
          'cpuQuota': '4 CPU (400000/100000), allowed cores 0-4', 'environment': a['environment'],
          'loadingMs': {'before': b['loadMs'], 'after': a['loadMs']},
          'terrainPreparationMs': {'before': b['terrainCpuMs'], 'after': a['terrainCpuMs']}, 'views': {}}
for name, row in a['results'].items():
    old = b['results'][name]
    for field in ['position', 'camera', 'mode', 'quality']:
        assert old['state'][field] == row['state'][field], (name, field)
    for field in ['buildings', 'openings', 'cells', 'triangles', 'pitchedRoofs', 'inferredHeights', 'builds']:
        assert old['state']['architecture'][0][field] == row['state']['architecture'][0][field]
    assert old['state']['natureAnchors'] == row['state']['natureAnchors'] == 1650
    assert old['state']['architectureMemory']['bytes'] == row['state']['architectureMemory']['bytes']
    render = lambda r: r['samples'][0]['render']
    result['views'][name] = {
        'calls': [render(old)['calls'], render(row)['calls']],
        'triangles': [render(old)['triangles'], render(row)['triangles']],
        'geometryBytes': [old['memory']['geometryBytes'], row['memory']['geometryBytes']],
        'terrainTextureBytesWithMipmaps': [old['memory']['terrainTextureBytesWithMipmaps'], row['memory']['terrainTextureBytesWithMipmaps']],
        'drawCompleteMedianMs': [statistics.median(s['ms'] for s in r['samples']) for r in [old, row]],
        'lodPreparationMaxMs': [max(old['lodMs']), max(row['lodMs'])], 'terrain': row['terrain']}
(root / 'comparison.json').write_text(json.dumps(result, indent=2)+'\n')
print('View | Calls before → after | Triangles before → after | Software completion median ms')
for name, row in result['views'].items():
    print(f"{name} | {row['calls'][0]} → {row['calls'][1]} | {row['triangles'][0]} → {row['triangles'][1]} | {row['drawCompleteMedianMs'][0]:.1f} → {row['drawCompleteMedianMs'][1]:.1f}")
print('Load ms:', result['loadingMs'], 'Terrain CPU ms:', result['terrainPreparationMs'])
