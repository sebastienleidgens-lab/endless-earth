import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('real IGN elevation file has valid provenance and 2 km extent',async()=>{
 const raw=JSON.parse(await readFile(new URL('../public/data/angles-terrain.json',import.meta.url),'utf8'));
 assert.equal(raw.schema,'endless-earth-terrain-v1');
 assert.equal(raw.source,'IGN RGE ALTI via Géoplateforme altitude API');
 assert.equal(raw.width,101);assert.equal(raw.height,101);
 assert.equal(raw.step_m,20);
 assert.equal(raw.elevations_m.length,10201);
 assert.ok(raw.elevations_m.every(v=>Number.isFinite(v)&&v>-1000&&v<9000));
 const min=Math.min(...raw.elevations_m),max=Math.max(...raw.elevations_m);
 assert.ok(max-min>10,'Terrain should include a real valley, not a flat plane');
 assert.ok(raw.provenance?.retrieved_at);
});
