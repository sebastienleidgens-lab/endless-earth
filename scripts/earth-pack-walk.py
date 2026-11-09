"""Keep a readable walk summary and lossless, deterministic compressed trace."""
import gzip
import json
import pathlib

root = pathlib.Path('docs/mission-07-captures')
path = root / 'walk.json'
data = json.loads(path.read_text())
if 'cpuFrames' in data:
    frames = data.pop('cpuFrames')
    trace = 'walk-cpu.json.gz'
    encoded = json.dumps(frames, separators=(',', ':')).encode()
    (root / trace).write_bytes(gzip.compress(encoded, mtime=0))
    data['cpuTrace'] = trace
    data['cpuTraceFrames'] = len(frames)
    data['latenciesMs'] = {}
    for field in ['cpuMs', 'submitMs', 'intervalMs']:
        values = sorted(f[field] for f in frames)
        data['latenciesMs'][field] = {name: values[int((len(values)-1)*p)]
                                     for name, p in [('p50', .5), ('p95', .95), ('p99', .99), ('max', 1)]}
        data['latenciesMs'][field]['over300ms'] = sum(v > 300 for v in values)
    path.write_text(json.dumps(data, indent=2)+'\n')
