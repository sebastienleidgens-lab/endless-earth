import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,open24,settle,out} from './lib/mission-24-browser.mjs';
import {installGPUAllocationProbe} from './lib/webgl-allocation-probe.mjs';
const b=await launch(),games=[],rows=[];
const scenes=[
 ['village',-55,70,.85,-.05,0,'first'],['pont',-184,160,2.57,.06,5,'third'],
 ['foret',-426.723088216,346.512916,.785,.12,5,'third'],['rive',-307.7,94.3,-1.515,-.05,5,'third'],
 ['terrain',-228,55,.65,.1,5,'third'],['route',-160,115,2.57,.12,5,'third'],
 ['nuit',-55,70,.85,-.05,0,'first'],['neige',-426.723088216,346.512916,.785,.12,5,'third']
];
const q=(v,p)=>v.toSorted((a,b)=>a-b)[Math.ceil((v.length-1)*p)];
try{
 for(const [version,port]of [['before',5361],['after',5360]])games.push({version,...await open24(b,port,{viewport:{width:480,height:320},query:'&snowCover=0',init:installGPUAllocationProbe})});
 for(const profile of ['eco','balanced','quality'])for(const station of scenes){const snow=station[0]==='neige',date=station[0]==='nuit'?'2026-01-21':'2026-01-21';
  const states=[];
  for(const g of games){await g.page.evaluate(a=>window.c15.setup(...a),[station,profile,date,'clear']);if(station[0]==='nuit')await g.page.evaluate(()=>{const s=document.querySelector('select[aria-label="Moment de la journée"]');s.value='night';s.dispatchEvent(new Event('change'));for(let i=0;i<60;i++)window.m24.advance(.25)});await g.page.evaluate(c=>window.m24.snow(c),snow?1:0);if(snow){await g.page.waitForFunction(()=>window.endlessDiagnostics.snow?.exposure==='ready');}for(let i=0;i<8;i++)await g.page.evaluate(()=>window.m24.advance());await settle(g.page);for(let i=0;i<3;i++)await g.page.evaluate(()=>window.c15.render());states.push(await g.page.evaluate(()=>window.c15.snapshot()));}
  assert.deepEqual(states[0].camera,states[1].camera,'unmatched camera');assert.equal(states[0].climate.elapsedSeconds,states[1].climate.elapsedSeconds,'unmatched wind time');assert.equal(states[0].climate.date,states[1].climate.date,'unmatched date');assert.equal(states[0].climate.snow.cover,states[1].climate.snow.cover);
  const samples=[[],[]];for(let i=0;i<16;i++)for(const index of i%2?[1,0]:[0,1])samples[index].push(await games[index].page.evaluate(()=>window.c15.render()));
  const summarize=(a,state)=>({medianMs:q(a.map(x=>x.ms),.5),p95Ms:q(a.map(x=>x.ms),.95),submitMedianMs:q(a.map(x=>x.submitMs),.5),calls:a.at(-1).calls,triangles:a.at(-1).triangles,geometries:a.at(-1).geometries,textures:a.at(-1).textures,allocation:state.alloc,heapBytes:state.heap,samples:a});
  const before=summarize(samples[0],states[0]),after=summarize(samples[1],states[1]);rows.push({scene:station[0],profile,camera:states[1].camera,date:states[1].climate.date,windTime:states[1].climate.elapsedSeconds,snowCover:states[1].climate.snow.cover,before,after,deltaPct:(after.medianMs/before.medianMs-1)*100});console.log(profile,station[0],rows.at(-1).deltaPct.toFixed(2)+'%');
 }
 assert.deepEqual(games.flatMap(g=>g.errors),[]);await writeFile(out+'/performance.json',JSON.stringify({method:'Chromium SwiftShader software, 480x320 DPR1, 16 alternating hot synchronized gl.finish/readPixels samples per version/scene/profile. No concurrent graphic workload. Camera, date, wind time and snow cover asserted equal. Logical GL allocation is not physical VRAM; heap includes inspection.',base:'9716fbb40f59a213107e18c699f4b317da86edf3',environment:games.map(g=>({version:g.version,...g.environment,startupMs:g.startupMs})),rows,errors:games.flatMap(g=>g.errors)},null,2)+'\n');
}finally{await b.close()}
