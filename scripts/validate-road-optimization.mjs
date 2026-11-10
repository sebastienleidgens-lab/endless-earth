import {readFile,writeFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const dir='docs/mission-07-3-captures',json=async f=>JSON.parse(await readFile(`${dir}/${f}.json`,'utf8'));
const versions={};for(const v of ['071','072','073'])versions[v]=await json(v);
const names=Object.keys(versions['071'].results);assert.equal(names.length,16);
for(const phase of ['072','073']){
 assert.deepEqual(Object.keys(versions[phase].results),names);assert.deepEqual(versions[phase].errors,[]);
 for(const name of names){const a=versions['071'].results[name],b=versions[phase].results[name];assert.deepEqual(a.station,b.station);
  for(const key of ['position','camera','yaw','mode','quality','zoom'])assert.deepEqual(a.state[key],b.state[key],`${phase} ${name} ${key}`);
  assert.equal(a.state.climate.date,b.state.climate.date);for(const key of ['calls','triangles'])assert.equal(a.samples[0].render[key],b.samples[0].render[key],`${phase} ${name} ${key}`);
  assert.equal(a.memory.geometryBytes,b.memory.geometryBytes,`${phase} ${name} geometry`);
  const pngA=await readFile(`${dir}/071-${name}.png`),pngB=await readFile(`${dir}/${phase}-${name}.png`);assert.equal(pngA.readUInt32BE(16),pngB.readUInt32BE(16));assert.equal(pngA.readUInt32BE(20),pngB.readUInt32BE(20));
 }
}
for(const phase of ['071','072','073']){const d=await json(`motion-${phase}`);assert.deepEqual(d.errors,[]);assert.equal(Object.keys(d.results).length,8);for(const[name,frames]of Object.entries(d.results)){assert.equal(frames.length,6);const n=new Set(frames.map(f=>f.pixelSha256)).size;if(name==='fixe')assert.equal(n,1);else assert.ok(n>1);}}
const sha=b=>createHash('sha256').update(b).digest('hex'),files={};
for(const f of ['angles-osm.geojson','angles-terrain.json','angles-surface.json','angles-surface.pack','angles-road-edge.json','angles-road-edge.pack']){const current=await readFile('public/data/'+f),base=execFileSync('git',['show','72006e0:public/data/'+f],{maxBuffer:12e6});assert.deepEqual(current,base);files[f]=sha(current);}
let walk=null;try{const w=await json('walk');assert.ok(Math.abs(w.frameMeasuredMetres-450)<.05);assert.equal(w.cpuTraceCapped,false);assert.ok(w.cpuFrames.some(f=>f.autoWalk===true));walk={metres:w.frameMeasuredMetres,seconds:w.frameMeasuredSeconds};}catch(error){if(error.code!=='ENOENT')throw error;}
await writeFile(`${dir}/evidence-validation.json`,JSON.stringify({versions:['071','072','073'],matchedStations:names,sameCameraDateQualityResolution:true,sameDrawCallsTrianglesGeometryMemory:true,sourceBase:'72006e0',files,motion:{trajectories:8,framesEach:6,versions:3,staticHashesIdentical:true},walk},null,2)+'\n');
console.log('PASS 16 matching triple comparisons, 24 temporal trajectories and six identical data/geometry resources',walk??'walk pending');
