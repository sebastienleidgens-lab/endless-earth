import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {launch,openGame,settle} from './lib/mission-14-browser.mjs';
const dir='docs/mission-14-evidence',reference=JSON.parse(await readFile(dir+'/before.json')),browser=await launch();
const ids=['rue-chateau','falaise-vallee','village-pont'],profiles=['eco','balanced','quality'];
const quantile=(a,q)=>{a=[...a].sort((x,y)=>x-y);const t=(a.length-1)*q,i=Math.floor(t);return a[i]+(a[Math.ceil(t)]-a[i])*(t-i)};
try{
 const games={before:await openGame(browser,5177),after:await openGame(browser,5173)},rows=[],startup=[];
 for(const [phase,game] of Object.entries(games))startup.push({phase,startupMs:game.startupMs,environment:game.environment,resources:await game.page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/data/')).map(r=>({file:r.name.split('/data/')[1],encodedBytes:r.encodedBodySize,ms:r.duration}))) });
 for(const profile of profiles)for(const id of ids)for(let round=0;round<3;round++){
  const station=reference.rows.find(r=>r.id===id);
  for(const phase of round%2?['after','before']:['before','after']){
   const game=games[phase],p=game.page;await p.evaluate(({station,profile})=>window.m14.setup(station.station,profile,station.state.camera),{station,profile});await settle(p);await p.evaluate(()=>window.earthTest.render());
   const samples=[];for(let i=0;i<4;i++)samples.push(await p.evaluate(()=>{const t=performance.now(),render=window.earthTest.render();return {...render,ms:performance.now()-t}}));
   rows.push({phase,profile,id,round,samples,state:await p.evaluate(()=>window.m14.state())});
  }
  const [a,b]=rows.slice(-2);assert.equal(a.state.camera.fov,b.state.camera.fov);assert.ok(a.state.camera.matrix.every((x,i)=>Math.abs(x-b.state.camera.matrix[i])<1e-12));assert.equal(a.state.climate.date,b.state.climate.date);console.log(profile,id,round);
 }
 const summary=[];
 for(const profile of profiles)for(const id of ids)for(const phase of ['before','after']){
  const rs=rows.filter(r=>r.phase===phase&&r.profile===profile&&r.id===id),samples=rs.flatMap(r=>r.samples),times=samples.map(s=>s.ms);
  summary.push({phase,profile,id,n:times.length,medianMs:quantile(times,.5),p95Ms:quantile(times,.95),peakMs:Math.max(...times),calls:samples.at(-1).calls,triangles:samples.at(-1).triangles,textures:samples.at(-1).textures,geometryBytes:rs.at(-1).state.memory.geometryBytes});
 }
 for(const game of Object.values(games))assert.deepEqual(game.errors,[]);
 const method='216 synchronized full readback renders; 960x640; 3 profiles, 3 fixed cameras, 3 alternating rounds, 4 measured frames. Held simulation, identical civil date/weather. SwiftShader software only. Local dev-server loading observations, not mobile network timings.';
 await writeFile(dir+'/performance.json.gz',gzipSync(JSON.stringify({method,rows,startup}),{level:9,mtime:0}));await writeFile(dir+'/performance-summary.json',JSON.stringify({method,summary,startup},null,2)+'\n');
}finally{await browser.close()}
