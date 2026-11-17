"""Verify deliverable links, exact bundles and hashes after the full campaign."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,json,hashlib,subprocess
ROOT=Path.cwd();E=ROOT/'docs/mission-26-2-evidence';problems=[];checked=[]
(E/'artifact-manifest.json').touch(exist_ok=True)
(E/'link-audit.json').touch(exist_ok=True)
def check(owner,url):
 if not url or url.startswith(('#','mailto:','data:','javascript:')):return
 u=urlsplit(url)
 if u.scheme or u.netloc:return
 p=(owner.parent/unquote(u.path)).resolve()
 if not p.exists():problems.append(dict(owner=str(owner.relative_to(ROOT)),target=url))
 checked.append(dict(owner=str(owner.relative_to(ROOT)),target=url,exists=p.exists()))
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key in ('href','src'):check(self.owner,value)
for p in [E/'index.html',ROOT/'docs/mission-26-2.md',ROOT/'docs/mission-26-2-architecture.md',ROOT/'docs/mission-26-2-data.md',E/'REPRODUCTION.md',E/'MEDIA-LICENSES.md']:
 if p.suffix=='.html':
  parser=Links();parser.owner=p;parser.feed(p.read_text())
 else:
  for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):check(p,target)
a=json.loads((E/'acceptance.json').read_text());assert len(a['scenarios'])==22;assert{r['id']for r in a['scenarios']}=={f'T{i:02d}'for i in range(1,23)};assert len(a['historicalP0'])==5
for r in a['scenarios']+a['historicalP0']:
 assert r['status']in ['ATTEINT','PARTIEL','NON_ATTEINT']
 assert not r['missingEvidence'],r
 for p in r['evidence']:check(E/'acceptance.json',p)
for receipt in sorted((E/'builds').glob('*/receipt.json')):
 d=json.loads(receipt.read_text());subprocess.run(['git','cat-file','-e',(d.get('sourceCommit')or d['sourceSHA'])+'^{commit}'],check=True)
 for f,expected in d['files'].items():
  p=receipt.parent/f
  if isinstance(expected,dict):assert p.stat().st_size==expected['bytes'],p
  digest=expected['sha256']if isinstance(expected,dict)else expected
  assert hashlib.sha256(p.read_bytes()).hexdigest()==digest,p
for label,source in [('reference',a['referenceSHA']),('candidate',a['executedProgramSHA'])]:
 native=json.loads((E/(label+'-native.json')).read_text())
 for case in native['cases']:
  if not case.get('video'):continue
  assert case['sourceSHA']==source,case['name']
  assert hashlib.sha256((E/case['original']).read_bytes()).hexdigest()==case['blobSHA']==case['browserBlobSHA'],case['name']
  assert hashlib.sha256((E/case['video']).read_bytes()).hexdigest()==case['media']['indexedSha256'],case['name']
  assert case['media']['packetPTSAndPayloadsIdentical'],case['name']
  assert case['simulationElapsedS']is None,case['name']
for label in ['reference-final','candidate-final']:
 receipt=json.loads((E/'builds'/label/'receipt.json').read_text())
 for path,digest in receipt.get('instrumentation',{}).items():
  archived=E/'instrumentation'/path.removeprefix('scripts/')
  assert hashlib.sha256(archived.read_bytes()).hexdigest()==digest,path
program=a['executedProgramSHA'];changed=subprocess.check_output(['git','diff','--name-only',program,'--','src','public','package.json','package-lock.json','vite.config.ts']).decode().splitlines();assert not changed,changed
baseline=json.loads((E/'baseline-inventory.json').read_text())
for name, receipt in baseline.items():
 if isinstance(receipt,dict)and 'sha256'in receipt:
  original=ROOT/'docs/mission-26-1-evidence'/name
  assert hashlib.sha256(original.read_bytes()).hexdigest()==receipt['sha256'],original
historic=subprocess.check_output(['git','diff','--name-only',a['referenceSHA'],'--','docs/mission-26-1.md','docs/mission-26-1-architecture.md','docs/mission-26-1-data.md','docs/mission-26-1-evidence']).decode().splitlines()
assert not historic,historic
assert not problems,problems
files={}
for p in sorted(E.rglob('*')):
 if not p.is_file()or p.name in ['artifact-manifest.json','link-audit.json']:continue
 size=p.stat().st_size;assert size<100*1024*1024,p
 files[str(p.relative_to(E))]=dict(bytes=size,sha256=hashlib.sha256(p.read_bytes()).hexdigest())
(E/'artifact-manifest.json').write_text(json.dumps(dict(schema='mission-evidence-artifacts-v1',scope='Every evidence file except this manifest and link-audit.json (avoids hash cycles). Existing large public corpus is referenced by immutable manifests, not duplicated.',files=files,totalBytes=sum(v['bytes']for v in files.values())),indent=2)+'\n')
(E/'link-audit.json').write_text(json.dumps(dict(success=True,localLinksChecked=len(checked),missing=problems,bundleReceiptsVerified=len(list((E/'builds').glob('*/receipt.json'))),productionDiffSinceExecutedProgram=changed,files=len(files)),indent=2)+'\n')
print(dict(links=len(checked),files=len(files),totalBytes=sum(v['bytes']for v in files.values()),productionDiff=changed))
