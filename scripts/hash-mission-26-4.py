from pathlib import Path
import hashlib,json,subprocess,datetime
R=Path('docs/mission-26-4-evidence')
files=[p for p in R.rglob('*')if p.is_file()and p.name!='sha256sums.json'and not p.name.endswith('.lock')]
files += [Path('docs/mission-26-4.md'),Path('docs/mission-26-4-architecture.md')]
files += list(Path('scripts').glob('*mission-26-4*.*'))+[Path('scripts/lib/mission-26-4-diagnostic.mjs')]
d={'method':'SHA256 of every delivered M26.4 proof, report, architecture and dedicated script, excluding this manifest itself and transient locks. Historical public/data/mission preservation is separately verified in preservation.json. No self-hash claim.','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{str(p):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted(set(files))}}
(R/'sha256sums.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');print('SHA256',len(d['files']),'files')
