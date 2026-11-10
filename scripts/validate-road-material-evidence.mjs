// Check the captured evidence against its own recorded protocol. No renderer
// screenshot is used as a substitute for topology tests or a completed walk.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='docs/mission-07-2-captures',json=async name=>JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));
const before=await json('before'),after=await json('after'),names=Object.keys(before.results);
assert.equal(names.length,16);assert.deepEqual(names,Object.keys(after.results));
for(const name of names){
 const b=before.results[name],a=after.results[name];assert.deepEqual(b.station,a.station,name);
 for(const key of ['position','camera','mode','yaw','zoom','quality'])assert.deepEqual(b.state[key],a.state[key],`${name}: ${key}`);
 assert.equal(b.state.climate.date,a.state.climate.date);assert.equal(b.memory.geometryBytes,a.memory.geometryBytes);
 for(const key of ['calls','triangles'])assert.equal(b.samples.at(-1).render[key],a.samples.at(-1).render[key]);
}
for(const phase of ['before','after','motion-before','motion-after','dawn-after','dusk-after','overcast-after'])assert.deepEqual((await json(phase)).errors,[],phase);
for(const phase of ['before','after']){
 const sequences=(await json(`motion-${phase}`)).results;assert.equal(Object.keys(sequences).length,8);
 for(const [name,frames] of Object.entries(sequences)){assert.equal(frames.length,6);const unique=new Set(frames.map(f=>f.pixelSha256)).size;if(name==='fixe')assert.equal(unique,1);else assert.ok(unique>1);}
}
const walk=await json('walk');assert.ok(Math.abs(walk.frameMeasuredMetres-450)<.05);assert.equal(walk.cpuTraceCapped,false);
const invariants=await json('invariants');for(const file of Object.values(invariants.files))assert.equal(file.sha256,file.baseSha256);
const data=await json('data-validation');assert.equal(Object.keys(data).length,10);for(const test of Object.values(data))assert.deepEqual(test.errors,[]);
await writeFile(`${dir}/comparison-validation.json`,JSON.stringify({sameStations:true,sameCameraTimeAndQuality:true,sameGeometryDrawCallsTriangles:true,comparisons:names,noErrors:true,motionTrajectoriesPerVersion:8,framesPerTrajectory:6,walkMetres:walk.frameMeasuredMetres},null,2)+'\n');
console.log('PASS matched views, stationary/moving sequences, source invariants, data scenarios and complete 450m walk');
