"""Summarize observed validation and hash the final review artifacts."""
import hashlib,json,pathlib,re,subprocess
root=pathlib.Path('docs/mission-22-1-evidence')
def read(name):return json.loads((root/name).read_text())
walk,bridge,river,media,gallery=map(read,['walk.json','pont-native.json','rive-native.json','media.json','gallery-check.json'])
assert walk['passedMinimumThirtyMinutes'] and walk['wallSeconds']>=1800 and walk['nativeSeconds']>=1800
assert not walk['changed'] and not walk['errors'] and not walk['glErrors'] and not walk['suspects'] and not walk['invalidCollisionFrames']
assert bridge['finished'] and not bridge['invalidFrames'] and not river['invalidCollisionFrames'] and river['minRiverDistanceM']<30
assert gallery['comparisons']==79 and gallery['sameCamera'] and gallery['decodedImages']==158 and not gallery['errors'] and not gallery['localLinksMissing'] and not gallery['mobileHorizontalOverflowPx']
assert len(media['rows'])==24 and all(r['streamPacketPayloadsAndPTSIdentical']for r in media['rows'])
assert 'pass 332' in (root/'tests.log').read_text() and 'fail 0' in (root/'tests.log').read_text()
assert not subprocess.check_output(['git','diff','--name-only','--','src','public'],text=True).strip()
report=pathlib.Path('docs/mission-22-1.md').read_text();assert 'En cours' not in report
missing=[]
for link in re.findall(r'\]\(([^)]+)\)',report):
 if not link.startswith(('https:','http:','#')) and not (pathlib.Path('docs')/link).exists():missing.append(link)
assert not missing,missing
validation={'runtimeCommit':walk['sourceCommit'],'baseCommit':'9b9beaab43d41840ce6b6e5e5a5ad34e7927361e','testsPassed':332,'build':'passed; original Vite bundle-size warning remains','nativeWalkSeconds':walk['nativeSeconds'],'wallWalkSeconds':walk['wallSeconds'],'walkMetres':walk['metres'],'mainWalkVisiblePeople':walk['village']['maxLeased'],'mainWalkMinimumRiverDistanceM':walk['minRiverDistanceM'],'bridgeAndQuayAreSeparateNativeSessions':True,'nativeMediaFiles':len(media['rows']),'withNativeAudio':sum(any(s['type']=='audio'for s in r['streams'])for r in media['rows']),'beforeAfterPairs':gallery['comparisons'],'localReportLinksMissing':missing,'gpu':walk['environment'],'physicalAndroid':'not available; Chromium touch flow only','costEUR':0,'merged':False,'deployed':False,'LP01':'unchanged'}
(root/'validation.json').write_text(json.dumps(validation,indent=2,ensure_ascii=False)+'\n')
rows=[]
for file in sorted(root.rglob('*')):
 if file.is_file()and file.name!='evidence-manifest.json':rows.append({'file':str(file.relative_to(root)),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
(root/'evidence-manifest.json').write_text(json.dumps({'runtimeCommit':walk['sourceCommit'],'method':'SHA-256 of every final evidence artifact except this manifest itself. No raw private captures or credentials. The report and scripts remain versioned by Git.','files':rows},indent=2)+'\n')
print('PASS final delivery',len(rows),'artifacts',len(media['rows']),'native films')
