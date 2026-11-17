from pathlib import Path
import json,math
R=Path('docs/mission-26-4-evidence/visual-regressions');all=[]
for p in sorted(R.glob('*-native.json')):
 d=json.load(open(p))
 for c in d.get('cases',[]):
  if c.get('captureValid')and c.get('environmentBefore'):all.append({'report':p.name,'label':d['label'],'source':d['sourceSHA'],'case':c})
def diff(a,b,path=''):
 if type(a)!=type(b):return[{'field':path,'reference':a,'candidate':b}]
 if isinstance(a,dict):return sum((diff(a.get(k),b.get(k),path+'.'+k)for k in sorted(a.keys()|b.keys())),[])
 if isinstance(a,list):return sum((diff(x,y,path+f'[{i}]')for i,(x,y)in enumerate(zip(a,b))),[])if len(a)==len(b)else[{'field':path,'reference':a,'candidate':b}]
 return[]if a==b else[{'field':path,'reference':a,'candidate':b}]
rows=[]
for key in sorted({(d['case']['scene'],d['case']['profile'])for d in all}):
 refs=[d for d in all if d['label'].startswith('reference')and(d['case']['scene'],d['case']['profile'])==key];cands=[d for d in all if d['label'].startswith('candidate')and(d['case']['scene'],d['case']['profile'])==key]
 if not refs or not cands:continue
 score=lambda d:(d['source']=='d162a653785d656e1a6652c4ca406889a1b55c28','retry'in d['label'],d['label'])
 a=max(refs,key=score);b=max(cands,key=score);x=a['case']['environmentBefore'];y=b['case']['environmentBefore'];matx=x['shadow']['matrix'];maty=y['shadow']['matrix']
 rows.append({'scene':key[0],'profile':key[1],'referenceReport':a['report'],'candidateReport':b['report'],'referenceSHA':a['source'],'candidateSHA':b['source'],'framebufferSame':x['buffer']==y['buffer'],'profileSame':x['profile']==y['profile'],'cameraExactlyEqual':x['camera']==y['camera'],'climateExactlyEqual':x['climate']==y['climate'],'solarExactlyEqual':x['climate'].get('solar')==y['climate'].get('solar'),'windExactlyEqual':x['climate'].get('wind')==y['climate'].get('wind'),'dateSame':x['climate'].get('date')==y['climate'].get('date'),'shadowMatrixMaxAbsDelta':max(abs(u-v)for u,v in zip(matx,maty)),'climateDifferences':diff(x['climate'],y['climate'],'climate'),'cameraDifferences':diff(x['camera'],y['camera'],'camera'),'shadowDifferences':diff(x['shadow'],y['shadow'],'shadow')})
(R/'pairing-audit.json').write_text(json.dumps({'method':'Same intended source stations, requested date/seed/profile/framebuffer and independent fresh-browser setup; real before-states compared, not asserted identical from input labels. Shader/geometry changes are intentional, atmospheric sensitivity and shadow/camera differences remain visible. No<=5percent performance or artistic acceptance inferred from these captures.','pairs':rows},ensure_ascii=False,indent=2))
print('pairs',len(rows),'same framebuffer',sum(x['framebufferSame']for x in rows),'same visual wind',sum(x['windExactlyEqual']for x in rows),'full climate exact',sum(x['climateExactlyEqual']for x in rows))
