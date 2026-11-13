import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {launch,open17,settle} from './lib/mission-17-browser.mjs';
const b=await launch(),rows=[];try{
 const g=await open17(b,{query:'&lighting=off'}),p=g.page;
 for(const profile of ['eco','balanced','quality']){
  await p.evaluate(profile=>window.c15.setup(['tree-bench',-430,340,1,-.12,0,'first'],profile),profile);await settle(p);
  const trees=await p.evaluate(()=>window.t17.trees()),t=trees.filter(t=>!t.needle&&Math.hypot(t.x+430,t.z-340)<80).sort((a,b)=>Math.hypot(a.x+430,a.z-340)-Math.hypot(b.x+430,b.z-340))[0];await p.evaluate(t=>window.t17.isolate(t.cell,t.index),t);
  for(const id of ['spreading','slender','riverside','young']){
   const metrics=await p.evaluate(({id,t})=>window.t17.prototype(id,t),{id,t});
   await p.evaluate(t=>window.t17.camera([t.x+21,t.ground+7,t.z+21],[t.x,t.ground+7,t.z],55),t);
   for(const v of [true,false])await p.evaluate(v=>{window.t17.originalVisible(v);window.t17.render()},v);
   for(let pass=0;pass<3;pass++)for(const version of pass%2?['after','before']:['before','after']){
    await p.evaluate(v=>{window.t17.originalVisible(v==='before');window.t17.render()},version);
    for(let sample=0;sample<4;sample++){const result=await p.evaluate(()=>window.t17.render());rows.push({profile,id,version,pass,sample,...result,metrics,state:await p.evaluate(()=>window.t17.state())})}
   }
  }
 }
 const summary=[];for(const profile of ['eco','balanced','quality'])for(const id of ['spreading','slender','riverside','young']){const r={profile,id};for(const v of ['before','after']){const a=rows.filter(r=>r.profile===profile&&r.id===id&&r.version===v),t=a.map(x=>x.ms).sort((a,b)=>a-b);r[v]={median:t[Math.floor(t.length/2)],p95:t[Math.ceil(t.length*.95)-1],max:t.at(-1),calls:a[0].calls,triangles:a[0].triangles,geometries:a[0].geometries,textures:a[0].textures,prototypeBytes:a[0].metrics.bytes}}r.deltaPercent=(r.after.median/r.before.median-1)*100;summary.push(r)}
 for(let i=0;i<rows.length;i+=4){const a=rows[i],b=rows[i+(i%8===0?4:-4)];if(b&&a.version!==b.version){assert.deepEqual(a.state.camera,b.state.camera);assert.deepEqual(a.state.climate,b.state.climate)}}assert.deepEqual(g.errors,[]);
 await writeFile('docs/mission-17-evidence/performance.json',JSON.stringify({method:'288 synchronized WebGL renders after warmup, one frozen server, alternating versions, 12 samples per version/archetype/profile, 960x640 DPR1. Actual world with all tree cells hidden except the selected original/prototype. Finite M14 cache disabled in both variants; no global forest or LOD claim. Current Eco original uses its far crown, detailed prototypes intentionally remain reference meshes. No concurrent browser workload.',environment:g.environment,startupMs:g.startupMs,summary,rows,errors:g.errors},null,2)+'\n');console.log(JSON.stringify(summary));
}finally{await b.close()}
