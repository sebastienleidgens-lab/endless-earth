import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const dir='docs/mission-08-captures',read=async p=>JSON.parse(await readFile(`${dir}/${p}`,'utf8'));
const before=await read('before.json'),after=await read('after.json');assert.ok(Object.keys(before.results).length>=12);assert.deepEqual(Object.keys(before.results).sort(),Object.keys(after.results).sort());
for(const name of Object.keys(before.results)){
 const a=before.results[name],b=after.results[name];assert.deepEqual(a.station,b.station,name+' camera fixture');assert.deepEqual(a.state.camera,b.state.camera,name+' rendered camera');assert.deepEqual(a.state.position,b.state.position,name+' source altitude');assert.deepEqual(a.state.climate,b.state.climate,name+' atmosphere');assert.equal(b.terrain.surface,'integrated');assert.equal(b.terrain.water,'mapped-outline-dem-drape-v1');
}
assert.deepEqual(after.errors,[]);
const bench=await read('benchmark.json');assert.equal(bench.runs.length,6);for(const r of bench.runs){assert.deepEqual(r.errors,[]);assert.match(r.environment.gpu,/SwiftShader/);for(const v of Object.values(r.results)){assert.equal(v.samples.length,21);assert.equal(v.state.terrain.surface,'integrated')}}
const walk=await read('walk.json');assert.ok(Math.abs(walk.frameMeasuredMetres-450)<.05);assert.ok(walk.frameMeasuredSeconds>200);assert.equal(walk.cpuTraceCapped,false);assert.ok(walk.cpuFrames.some(f=>f.autoWalk));
for(const phase of ['before','after']){const motion=await read(`motion-${phase}.json`);assert.deepEqual(motion.errors,[]);assert.ok(Object.keys(motion.results).length>=8);for(const [name,frames] of Object.entries(motion.results)){assert.equal(frames.length,6);assert.equal(new Set(frames.map(f=>f.pixelSha256)).size===1,name==='fixe')}}
const roads=await read('road-preservation.json');assert.ok(roads.preserved.every(f=>f.before===f.after));assert.ok(Math.abs(roads.before.area-roads.after.area)<.001);
console.log('PASS landscape: paired cameras, atmosphere, software benchmark, motion, 450 m and preserved sources/materials');
