"""Verify local links/schema and hash the deliverable without self-hash cycles."""
import hashlib,json,pathlib,re,urllib.parse
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/mission-26-1-evidence'
PROGRAM=json.loads((OUT/'source-tree.json').read_text())['sourceSHA']
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=set()
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if d.get('id'):self.ids.add(d['id'])
  for key in ['href','src']:
   if d.get(key):self.links.append(d[key])
errors=[];checked=[]
pages=[ROOT/'docs/mission-26-1.md',ROOT/'docs/mission-26-1-architecture.md',ROOT/'docs/mission-26-1-data.md',OUT/'REPRODUCTION.md',OUT/'index.html']
for page in pages:
 text=page.read_text()
 if page.suffix=='.html':
  parsed=Links();parsed.feed(text);links=parsed.links
 else:links=re.findall(r'\[[^\]]*\]\(([^)]+)\)',text)
 for link in links:
  url=urllib.parse.urlsplit(link.strip('<>'))
  if url.scheme or url.netloc:continue
  if not url.path:
   if page.suffix=='.html' and url.fragment and url.fragment not in parsed.ids:errors.append({'file':str(page.relative_to(ROOT)),'link':link,'reason':'missing-anchor'})
   continue
  target=(page.parent/urllib.parse.unquote(url.path)).resolve()
  checked.append({'file':str(page.relative_to(ROOT)),'link':link})
  if not target.is_file():errors.append({'file':str(page.relative_to(ROOT)),'link':link,'reason':'missing-file'})
acceptance=json.loads((OUT/'acceptance.json').read_text())
for row in acceptance['requirements']:
 for key in ['status','evidence','sourceSHA','failureReason','unverified']:
  if key not in row:errors.append({'requirement':row.get('id'),'missing':key})
 if row['status'] not in ['ATTEINT','PARTIEL','NON ATTEINT'] or not isinstance(row['unverified'],bool):errors.append({'requirement':row['id'],'reason':'invalid-status-schema'})
 if not re.fullmatch('[a-f0-9]{40}',row['sourceSHA']):errors.append({'requirement':row['id'],'reason':'invalid-source-sha'})
 for name in row['evidence']:
  if not (ROOT/name).is_file():errors.append({'requirement':row['id'],'missing-file':name})
excluded={OUT/'artifacts.json',OUT/'links-audit.json'}
files=set(p for p in OUT.rglob('*') if p.is_file() and p not in excluded)
files.update(p for p in (ROOT/'scripts').glob('*mission-26-1*') if p.is_file())
files.update([ROOT/'scripts/lib/mission-26-browser.mjs',ROOT/'scripts/lib/native-webm.mjs',*pages[:-2]])
entries=[]
for p in sorted(files):
 data=p.read_bytes();entries.append({'path':str(p.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 if len(data)>100*1024*1024:errors.append({'file':str(p.relative_to(ROOT)),'reason':'over-github-100MiB-file-limit'})
manifest={'sourceSHA':PROGRAM,'method':'Every listed deliverable read and SHA-256 hashed. The two manifest/audit JSON files are excluded to avoid self-reference; every gallery/report/media/source receipt remains included. Immutable terrain packs have their own exhaustive contact audit.','excludedMetadata':['docs/mission-26-1-evidence/artifacts.json','docs/mission-26-1-evidence/links-audit.json'],'files':entries,'totalBytes':sum(e['bytes'] for e in entries)}
(OUT/'artifacts.json').write_text(json.dumps(manifest,indent=2)+'\n')
result={'sourceSHA':PROGRAM,'passed':not errors,'localLinksChecked':len(checked),'requirementsChecked':len(acceptance['requirements']),'filesHashed':len(entries),'largestFileBytes':max(e['bytes'] for e in entries),'errors':errors}
(OUT/'links-audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if errors:raise SystemExit(1)
