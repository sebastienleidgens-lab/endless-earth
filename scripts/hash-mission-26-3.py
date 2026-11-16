"""Hash delivered proofs after generation; the manifest excludes only itself."""
from pathlib import Path
import hashlib,json
root=Path('docs/mission-26-3-evidence')
files=sorted([p for p in root.rglob('*')if p.is_file()and p.name!='sha256sums.json']+[Path('docs/mission-26-3.md'),Path('docs/mission-26-3-architecture.md')])
rows=[]
for p in files:
 h=hashlib.sha256()
 with p.open('rb')as source:
  for chunk in iter(lambda:source.read(1024*1024),b''):h.update(chunk)
 rows.append(dict(path=str(p),bytes=p.stat().st_size,sha256=h.hexdigest()))
(root/'sha256sums.json').write_text(json.dumps(dict(method='SHA256 of every delivered evidence file plus final report and architecture. This manifest alone is excluded. Git commits independently bind code and data; no self-referential final commit is asserted.',files=rows),indent=2)+'\n')
print('Hashed',len(rows),'files,',sum(r['bytes']for r in rows),'bytes')
