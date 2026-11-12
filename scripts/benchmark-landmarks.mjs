import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {launch,openGame,settle} from './lib/browser-landmarks.mjs';
const dir='docs/mission-14-evidence/heritage',reference=JSON.parse(await readFile(dir+'/before.json')),browser=await launch(),ids=['chateau-pont','pont-ensemble','village'],profiles=['eco','balanced','quality'];
const q=(a,p)=>{a=[...a].sort((x,y)=>x-y);const x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.ceil(x)]-a[i])*(x-i)};
try{
 const games={before:await openGame(browser,5179),after:await openGame(browser,5173)},rows=[],startup=[];
 for(const [phase,game]of Object.entries(games))startup.push({phase,ms:game.startupMs,resources:await game.page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/data/')).map(r=>({file:r.name.split('/data/')[1],encodedBytes:r.encodedBodySize,durationMs:r.duration}))) });
 for(const profile of profiles)for(const id of ids)for(let round=0;round<3;round++){
  const ref=reference.rows.find(r=>r.id===id);
  for(const phase of round%2?['after','before']:['before','after']){
   const p=games[phase].page;await p.evaluate(({ref,profile})=>window.m14b.setup(ref.station,profile,ref.state.camera),{ref,profile});await settle(p);await p.evaluate(()=>window.earthTest.render());const samples=[];
   for(let i=0;i<4;i++)samples.push(await p.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {...render,ms:performance.now()-t}}));
   rows.push({phase,profile,id,round,samples,state:await p.evaluate(()=>window.m14b.state())});
  }
  const [a,b]=rows.slice(-2);assert.ok(a.state.camera.matrix.every((x,i)=>Math.abs(x-b.state.camera.matrix[i])<1e-12));assert.equal(a.state.climate.date,b.state.climate.date);console.log(profile,id,round);
 }
 const summary=[];
 for(const profile of profiles)for(const id of ids)for(const phase of ['before','after']){
  const rs=rows.filter(r=>r.phase===phase&&r.profile===profile&&r.id===id),samples=rs.flatMap(r=>r.samples),ms=samples.map(s=>s.ms);summary.push({phase,profile,id,n:ms.length,medianMs:q(ms,.5),p95Ms:q(ms,.95),peakMs:Math.max(...ms),calls:samples.at(-1).calls,triangles:samples.at(-1).triangles,geometryBytes:rs.at(-1).state.memory.geometryBytes,textures:samples.at(-1).textures});
 }
 for(const game of Object.values(games))assert.deepEqual(game.errors,[]);
 const method='216 full synchronized readback renders, Chromium/SwiftShader software, 960x640, 3 profiles, 3 fixed poses, 3 alternating rounds, 4 samples. Same date, weather, absolute cameras. Local loading observations are not Internet or Android timings.';
 await writeFile(dir+'/performance.json.gz',gzipSync(JSON.stringify({method,rows,startup}),{level:9,mtime:0}));await writeFile(dir+'/performance-summary.json',JSON.stringify({method,summary,startup},null,2)+'\n');
}finally{await browser.close()}
