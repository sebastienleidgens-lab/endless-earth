import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('real IGN elevation file has valid provenance and 2 km extent',async()=>{
 const raw=JSON.parse(await readFile(new URL('../public/data/angles-terrain.json',import.meta.url),'utf8'));
 assert.equal(raw.schema,'endless-earth-terrain-v1');
 assert.equal(raw.source,'IGN LiDAR HD MNT, offline Lambert-93 sampling');
 assert.equal(raw.width,201);assert.equal(raw.height,201);
 assert.equal(raw.step_m,10);
 assert.equal(raw.elevations_m.length,raw.width*raw.height);
 assert.equal((raw.width-1)*raw.step_m,2000);
 assert.equal((raw.height-1)*raw.step_m,2000);
 assert.ok(raw.elevations_m.every(v=>Number.isFinite(v)&&v>-1000&&v<9000));
 const min=raw.elevations_m.reduce((a,b)=>Math.min(a,b),Infinity),max=raw.elevations_m.reduce((a,b)=>Math.max(a,b),-Infinity);
 assert.ok(max-min>10,'Terrain should include a real valley, not a flat plane');
 assert.ok(raw.provenance?.retrieved_at);assert.equal(raw.vertical_datum,'IGN69');assert.equal(raw.provenance.acquired_at,'2023-04-09');assert.equal(raw.provenance.files.length,9);assert.ok(raw.provenance.files.every(f=>/^[a-f0-9]{64}$/.test(f.raw_sha256)&&f.metadata.systeme_planimetrique==='LAMB93'));
});
