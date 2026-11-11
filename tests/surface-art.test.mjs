import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {habitatWeights,makeGroundAtlas,ART_TILE,ART_GUTTER,validateSurfaceArt} from '../src/world/surface-art.mjs';
import {cpuModules} from '../scripts/lib/cpu-modules.mjs';
import * as THREE from 'three';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('unknown and cultivated/built land never acquire meadow or forest detail',()=>{
 for(const type of [null,undefined,'unknown','farmland','built','bare','wetland'])assert.deepEqual(habitatWeights(type),[0,0,0]);
 assert.deepEqual(habitatWeights('wood'),[0,1,0]);assert.deepEqual(habitatWeights('meadow'),[1,0,0]);assert.deepEqual(habitatWeights('rock'),[0,0,1]);
});
test('shared atlas is repeatable and every gutter wraps its own material',()=>{
 const a=makeGroundAtlas(),b=makeGroundAtlas();assert.deepEqual(a,b);assert.equal(a.width,576);
 const stride=ART_TILE+ART_GUTTER*2,offset=(k,x,y)=>((Math.floor(k/2)*stride+y)*a.width+(k%2)*stride+x)*4;
 const wrap=x=>((x-ART_GUTTER)%ART_TILE+ART_TILE)%ART_TILE+ART_GUTTER;
 for(let k=0;k<4;k++)for(const [x,y] of [[0,27],[14,180],[287,100],[40,0],[200,287]]){
  const i=offset(k,x,y),j=offset(k,wrap(x),wrap(y));assert.deepEqual(a.data.slice(i,i+4),a.data.slice(j,j+4));
 }
});
test('delivered images are source-bound, checksummed and fit the declared budget',async()=>{
 const root='public/materials/earth/',m=JSON.parse(await readFile(root+'surface-art.json'));
 const sources=Object.fromEntries(await Promise.all(Object.entries({terrain:'terrain.json',osm:'osm.geojson',environment:'environment.json'}).map(async([k,file])=>[k,sha(await readFile('public/data/angles-'+file))])));
 assert.equal(validateSurfaceArt(m,sources),m);
 assert.throws(()=>validateSurfaceArt({...m,sources:{...m.sources,osm:'stale'}},sources));
 assert.throws(()=>validateSurfaceArt({...m,size:8192},sources));
 let bytes=0;for(const [key,file] of [['atlas','surface-atlas.png'],['field','surface-field.png']]){const b=await readFile(root+file);assert.equal(sha(b),m.hashes[key]);bytes+=b.length}
 assert.ok(bytes<800000);assert.equal(m.size,1024);assert.equal(m.range,16);
 const c=JSON.parse(await readFile(root+'catalog.json'));assert.equal(c.budgetEUR,0);assert.equal(c.families.at(-1).license,'CC0-1.0');
});
test('zone teardown releases appearance textures and bitmaps with the existing terrain owner',async()=>{
 const load=await cpuModules(process.cwd(),'work/cpu-surface-tests'),{disposeNatureZone}=await load('src/nature/render.ts');
 const group=new THREE.Group(),textures=[new THREE.Texture(),new THREE.Texture()];let disposed=0,closed=0;
 textures.forEach(t=>{t.image={close(){closed++}};t.addEventListener('dispose',()=>disposed++)});group.userData.surfaceTextures=textures;
 disposeNatureZone(group);assert.equal(disposed,2);assert.equal(closed,2);assert.equal(group.children.length,0);
});
