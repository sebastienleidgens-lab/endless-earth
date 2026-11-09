import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='docs/mission-07-2-captures',read=async name=>JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));
const stats=values=>{const v=values.toSorted((a,b)=>a-b);return {median:v[Math.floor(v.length*.5)],p95:v[Math.min(v.length-1,Math.floor(v.length*.95))],max:v.at(-1),samples:v.length}};
const runs={};for(const phase of ['before','after'])runs[phase]=await Promise.all([1,2,3].map(i=>read(`bench-${phase}-${i}`)));
const results={};
for(const view of ['village','aerienne','eco','mobile']){
 results[view]={};
 for(const phase of ['before','after']){
  const records=runs[phase].map(r=>r.results[view]),first=records[0],render=first.samples[0].render;
  results[view][phase]={calls:render.calls,triangles:render.triangles,geometryBytes:first.memory.geometryBytes,textureBytesWithMipmaps:first.memory.terrainTextureBytesWithMipmaps,roadTextureBytesWithMipmaps:first.memory.roadTextureBytesWithMipmaps,syncSoftwareFrameMs:stats(records.flatMap(r=>r.samples.map(s=>s.ms))),cpuSubmitMs:stats(records.flatMap(r=>r.samples.map(s=>s.render.cpuSubmitMs))),lodCpuMs:stats(records.flatMap(r=>r.lodMs))};
 }
 for(const key of ['calls','triangles','geometryBytes'])assert.equal(results[view].before[key],results[view].after[key]);
}
const terrainOnly={};for(const phase of ['before','after']){const r=await read(`terrain-${phase}`);assert.equal(r.terrainOnly,true);for(const station of Object.values(r.results))assert.ok(station.samples[0].render.triangles>10000&&station.samples[0].render.triangles<=117318&&station.samples[0].render.calls<=25,'only the actual terrain must be rendered');terrainOnly[phase]=Object.fromEntries(Object.entries(r.results).map(([name,r])=>[name,{syncSoftwareFrameMs:stats(r.samples.map(s=>s.ms)),cpuSubmitMs:stats(r.samples.map(s=>s.render.cpuSubmitMs)),calls:r.samples[0].render.calls,triangles:r.samples[0].render.triangles}]))}
const walk=await read('walk');
const metric={renderer:runs.after[0].environment,hardwareGPUVerified:false,method:'Three alternating pairs of isolated browser instances, 15 held-frame synchronous WebGL readbacks per station per run. CPU submission timed separately. Terrain-only proxy repeats 15 times, preserving lights and the terrain while hiding other scene objects. Software frame time is not GPU timer-query time or a hardware FPS claim.',startup:{before:stats(runs.before.map(r=>r.loadMs)),after:stats(runs.after.map(r=>r.loadMs))},terrainConstructionMs:{before:stats(runs.before.flatMap(r=>r.terrainCpuMs)),after:stats(runs.after.flatMap(r=>r.terrainCpuMs))},results,terrainOnly,walk:{metres:walk.frameMeasuredMetres,seconds:walk.frameMeasuredSeconds,frames:walk.frames,cpuTraceCapped:walk.cpuTraceCapped,cpuMs:stats(walk.cpuFrames.map(f=>f.cpuMs)),submitMs:stats(walk.cpuFrames.map(f=>f.submitMs)),intervalMs:stats(walk.cpuFrames.map(f=>f.intervalMs)),scope:walk.traceScope}};
await writeFile(`${dir}/metrics.json`,JSON.stringify(metric,null,2)+'\n');
console.log(JSON.stringify(metric,null,2));
