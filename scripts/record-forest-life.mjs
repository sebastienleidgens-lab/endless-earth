import {writeFile,readFile} from 'node:fs/promises';import {gzipSync} from 'node:zlib';import assert from 'node:assert/strict';import {launch,openStage,openLife,settle,forestViews} from './lib/mission-17c-browser.mjs';import {indexNativeWebM} from './lib/native-webm.mjs';
const out='docs/mission-17-evidence/life',work='work/mission-17c',b=await launch(),movies=[];
const selected=process.argv[2];
try{if(!selected||selected==='stage'){const g=await openStage(b),p=g.page;for(const [id,label,tree,date,weather,view,seconds]of [
 ['light-wind','Vent faible · jeune feuillu','young','2026-06-21','clear','three-quarter',10],
 ['moderate-wind','Vent modéré · feuillu étalé','spreading','2026-06-21','cloudy','three-quarter',10],
 ['gusts','Rafales M11 · ramure de berge','riverside','2026-06-21','overcast','three-quarter',12],
 ['spring','Printemps · déploiement des feuilles','spreading','2026-04-16','clear','three-quarter',8],
 ['summer','Été · feuillage développé','spreading','2026-06-21','clear','below',8],
 ['autumn','Automne · teintes et retrait individuels','spreading','2026-10-18','cloudy','three-quarter',8],
 ['winter','Hiver · ramure caduque','spreading','2026-01-21','clear','three-quarter',8],
 ['winter-evergreen','Hiver · feuillage persistant','needle','2026-01-21','clear','three-quarter',8],
 ['season-transition','Diagnostic saisonnier accéléré · mars à décembre','spreading','2026-03-01','clear','three-quarter',18],
 ]){if(process.argv[3]&&!process.argv[3].split(',').includes(id))continue;await p.evaluate(({tree,date,weather,view})=>window.forest17.warm(tree,date,weather,'quality',view),{tree,date,weather,view});if(id==='gusts')await p.evaluate(()=>window.forest17.gustStart());await p.evaluate(label=>{document.querySelector('#title').textContent=label},label);const before=await p.evaluate(()=>window.forest17.inspect());await p.screenshot({path:`${out}/${id}.jpg`,type:'jpeg',quality:86});await p.evaluate(id=>{window.forest17.record();window.forest17.native(true);if(id==='season-transition')window.forest17.seasonDiagnostic(18)},id);await p.waitForTimeout(seconds*1000);await p.evaluate(()=>window.forest17.native(false));const frames=await p.evaluate(()=>window.life17Frames),bytes=Buffer.from(await p.evaluate(()=>window.forest17.stop()));await writeFile(`${out}/${id}.webm`,bytes);const media=await indexNativeWebM(`${out}/${id}.webm`,`${work}/${id}-raw.webm`),after=await p.evaluate(()=>window.forest17.inspect());const row={id,label,scene:'synthetic workshop, actual Three.js models/materials/M11 clock',tree,date,weather,profile:'quality',commandSeconds:seconds,acceleratedCalendar:id==='season-transition',before,after,observedFrames:frames.length,traceSeconds:(frames.at(-1).t-frames[0].t)/1000,windSeconds:frames.at(-1).windTime-frames[0].windTime,media};assert.ok(frames.length>10);if(id!=='season-transition')assert.ok(Math.abs(row.traceSeconds-row.windSeconds)<.2,'single real-time M11 clock');movies.push(row);await writeFile(`${out}/${id}-trace.json.gz`,gzipSync(JSON.stringify(frames),{level:9}));console.log('Recorded',id,row.observedFrames,row.traceSeconds);}
assert.deepEqual(g.errors,[]);await p.close()}
if(!selected||selected==='world'){
 const g=await openLife(b,{viewport:{width:480,height:320}}),p=g.page;
 await p.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 for(const [id,label,weather,date,seconds]of [
  ['forest-wind','Forêt · vent et rafales simulés','overcast','2026-06-21',10],
  ['snow','Neige · conifère dans le pilote réel','snow','2026-01-21',10],
  ['thaw','Fonte · météo douce simulée, vitesse réelle','clear','2026-03-21',16],
 ]){
  if(process.argv[3]&&!process.argv[3].split(',').includes(id))continue;
  if(id==='thaw')await p.evaluate(()=>{window.c17.date('2026-03-21');const s=document.querySelector('select[aria-label="Météo simulée"]');s.value='clear';s.dispatchEvent(new Event('change'));window.c17.advance(.016)});
  else{
   await p.evaluate(({v,weather,date})=>window.c15.setup(v,'eco',date,weather),{v:forestViews[0],weather,date});await settle(p);
   if(id==='snow'){
    const t=await p.evaluate(()=>window.c17.point('needle'));assert.ok(t);
    await p.evaluate(t=>{window.c15.setup(['snow-tree',t.p.x,t.p.z,1,.1,5,'third'],'balanced','2026-01-21','snow');window.c17.reviewCamera([t.p.x+t.l.height*.85,t.p.y+t.l.height*.55,t.p.z+t.l.height*.85],[t.p.x,t.p.y+t.l.height*.48,t.p.z])},t);
    await settle(p);await p.waitForFunction(()=>window.c17.state().snow?.exposure==='ready');for(let i=0;i<80;i++)await p.evaluate(()=>window.c17.advance(.025));
   }
  }
  await p.evaluate(()=>window.c15.render());const before=await p.evaluate(()=>window.c17.state());
  await p.screenshot({path:`${out}/${id}.jpg`,type:'jpeg',quality:86});await p.evaluate(()=>{window.c15.record();window.c17.native(true)});await p.waitForTimeout(seconds*1000);await p.evaluate(()=>window.c17.native(false));
  const frames=await p.evaluate(()=>window.c17Frames),bytes=Buffer.from(await p.evaluate(()=>window.c15.stop()));await writeFile(`${out}/${id}.webm`,bytes);
  const media=await indexNativeWebM(`${out}/${id}.webm`,`${work}/${id}-raw.webm`),after=await p.evaluate(()=>window.c17.state());
  movies.push({id,label,scene:'actual pilot; fixed review camera for snow/thaw; native time and frames, no hidden trees',weather,date,acceleratedCalendar:false,before,after,commandSeconds:seconds,observedFrames:frames.length,traceSeconds:(frames.at(-1).t-frames[0].t)/1000,windSeconds:frames.at(-1).state.life.wind.lastTime-frames[0].state.life.wind.lastTime,media});
  await writeFile(`${out}/${id}-trace.json.gz`,gzipSync(JSON.stringify(frames),{level:9}));assert.ok(frames.length>3);console.log('Recorded',id,frames.length)
 }
 assert.deepEqual(g.errors,[]);assert.deepEqual(g.warnings,[]);await p.close()
}
const path=out+'/movies.json';let old=[];try{old=JSON.parse(await readFile(path)).movies}catch{}await writeFile(path,JSON.stringify({method:'Native captureStream/MediaRecorder. Workshop films copy each newly rendered GPU canvas once to a labelled capture canvas and request its native frame; no extra source frames are generated. No replay, interpolation or playback speed filter; codec-copy indexed containers retain all native encoded packet payloads and PTS. Weather and shaders warmed before capture. Only the seasonal calendar diagnostic is accelerated and labelled in the video. Stage films use the actual shared engine; world films retain the real pilot.',movies:[...old.filter(o=>!movies.some(m=>m.id===o.id)),...movies]},null,2)+'\n');
}finally{await b.close()}
