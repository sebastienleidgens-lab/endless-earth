import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='docs/mission-07-3-captures',read=async f=>JSON.parse(await readFile(`${dir}/${f}.json`,'utf8'));
const stats=a=>{const v=a.toSorted((a,b)=>a-b);return {samples:v.length,median:v[Math.floor(v.length/2)],p95:v[Math.min(v.length-1,Math.floor(v.length*.95))],max:v.at(-1)}};
const runs={};for(const phase of ['071','072','073'])runs[phase]=await Promise.all([1,2,3].map(n=>read(`final-bench-${phase}-${n}`)));
const results={};
for(const view of ['village','aerienne','eco','mobile']){
 const row=results[view]={};
 for(const phase of ['071','072','073']){
  const r=runs[phase].map(d=>d.results[view]),first=r[0];
  row[phase]={calls:first.samples[0].render.calls,triangles:first.samples[0].render.triangles,geometryBytes:first.memory.geometryBytes,textureBytesWithMipmaps:first.memory.terrainTextureBytesWithMipmaps,roadTextureBytesWithMipmaps:first.memory.roadTextureBytesWithMipmaps,syncSoftwareFrameMs:stats(r.flatMap(v=>v.samples.map(s=>s.ms))),cpuSubmitMs:stats(r.flatMap(v=>v.samples.map(s=>s.render.cpuSubmitMs))),lodCpuMs:stats(r.flatMap(v=>v.lodMs)),runMedianMs:r.map(v=>stats(v.samples.map(s=>s.ms)).median)};
 }
 for(const key of ['calls','triangles','geometryBytes'])assert.equal(row['071'][key],row['073'][key]);
 row.changeVs072Percent=(row['073'].syncSoftwareFrameMs.median/row['072'].syncSoftwareFrameMs.median-1)*100;
 row.overheadVs071Percent=(row['073'].syncSoftwareFrameMs.median/row['071'].syncSoftwareFrameMs.median-1)*100;
}
const terrainOnly={},subsets={};
for(const phase of ['071','072','073']){
 const d=await read(`final-terrain-${phase}`);terrainOnly[phase]={};subsets[phase]={};
 for(const [name,r]of Object.entries(d.results)){const render=r.samples[0].render;assert.ok(render.calls<=25&&render.triangles>10000&&render.triangles<=117318);terrainOnly[phase][name]={calls:render.calls,triangles:render.triangles,syncSoftwareFrameMs:stats(r.samples.map(s=>s.ms)),cpuSubmitMs:stats(r.samples.map(s=>s.render.cpuSubmitMs))};}
 for(const subset of ['roads','ground']){const d=await read(`subset-${phase}-${subset}`);subsets[phase][subset]=Object.fromEntries(Object.entries(d.results).map(([name,r])=>[name,{calls:r.samples[0].render.calls,triangles:r.samples[0].render.triangles,syncSoftwareFrameMs:stats(r.samples.map(s=>s.ms))}]))}
}
const preparation={};for(const p of ['071','072','073'])preparation[p]={loadMs:stats(runs[p].map(r=>r.loadMs)),terrainConstructionMs:stats(runs[p].flatMap(r=>r.terrainCpuMs))};
const metrics={renderer:runs['073'][0].environment,hardwareGPUVerified:false,method:'Three sequential rotating orders (071,072,073), (073,072,071), (072,071,073). 15 synchronized software samples/view/run; CPU submission separate. Terrain-only proxies 15 samples/view; exact-index road/ground subsets 9 samples/view. These are software draws/readbacks, not hardware GPU timer-query results. Subset costs are non-additive because coverage, visibility and scheduling differ.',results,terrainOnly,subsets,preparation};
try{const w=await read('walk'),moving=w.cpuFrames.filter(f=>f.autoWalk);metrics.walk={metres:w.frameMeasuredMetres,seconds:w.frameMeasuredSeconds,frames:w.frames,cpuTraceCapped:w.cpuTraceCapped,scope:w.traceScope,movingFrames:moving.length,movingCPU:stats(moving.map(f=>f.cpuMs)),movingSubmit:stats(moving.map(f=>f.submitMs)),movingIntervals:stats(moving.map(f=>f.intervalMs)),allCPU:stats(w.cpuFrames.map(f=>f.cpuMs)),allIntervals:stats(w.cpuFrames.map(f=>f.intervalMs))};}catch(error){if(error.code!=='ENOENT')throw error;}
await writeFile(`${dir}/metrics.json`,JSON.stringify(metrics,null,2)+'\n');
for(const[k,r]of Object.entries(results))console.log(k,Object.fromEntries(['071','072','073'].map(p=>[p,r[p].syncSoftwareFrameMs.median])),r.changeVs072Percent,r.overheadVs071Percent);
