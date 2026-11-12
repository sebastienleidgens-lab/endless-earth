import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {worldMaterialMode,WORLD_MATERIAL_BINDINGS,authenticRoadPolicy} from '../src/materials/world-policy.mjs';
test('integrated appearance bindings keep the approved source slots, metres and bounded relief',async()=>{
 const c=JSON.parse(await readFile('public/materials/authentic/catalog.json','utf8'));
 for(const b of Object.values(WORLD_MATERIAL_BINDINGS)){const e=c.entries.find(e=>e.slot===b.slot);assert.ok(e);assert.deepEqual(b.metres,e.metres);assert.equal(b.reliefM,e.reliefM);assert.equal(e.license,'CC0-1.0');assert.ok(b.reliefM<=.025)}
});
test('road policy retains paved/unknown/gravel classes and never promotes an unknown to documented soil',()=>{
 for(const kind of [0,1,2,4,5,7])assert.equal(authenticRoadPolicy(kind),'retain-mission12');
 assert.equal(authenticRoadPolicy(3),'documented-rural');assert.equal(authenticRoadPolicy(6),'unknown-neutral-grain');
 assert.equal(worldMaterialMode('mission12'),'mission12');assert.equal(worldMaterialMode('photographic'),'photographic');assert.equal(worldMaterialMode(null),'hybrid');
});
