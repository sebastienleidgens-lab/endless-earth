import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';
import * as THREE from 'three';
import {CANOPY_VERSION,canopyLayout,canopyGLSL} from '../src/nature/canopy.mjs';
import {createTreeArt} from '../src/nature/tree-geometry.mjs';
import {masonryClearance} from '../src/nature/clearance.mjs';
import {villageFlowerRecipes,flowerSeason} from '../src/nature/flowers.mjs';
import {buildingPlan} from '../src/architecture/plan.mjs';
import {decodeLighting} from '../src/lighting/model.mjs';
import {cpuModules} from '../scripts/lib/cpu-modules.mjs';
const square=(x,z,w=14)=>[{x,z},{x:x+w,z},{x:x+w,z:z+8},{x,z:z+8},{x,z}];
test('larger lobed crowns remain shared, align all seasonal attributes and trim by masonry without moving roots',()=>{
 const art=createTreeArt(),old=createTreeArt('sprays');art.farCrown.computeBoundingBox();old.farCrown.computeBoundingBox();
 assert.ok(art.farCrown.boundingBox.getSize(new THREE.Vector3()).x>old.farCrown.boundingBox.getSize(new THREE.Vector3()).x*1.5);
 for(const g of [art.crown,art.farCrown])for(const key of ['normal','color','natureCluster','natureFringe'])assert.equal(g.attributes[key].count,g.attributes.position.count);
 const p={x:2,y:3,z:4,scale:1.4,kind:'broadleaf'},before=structuredClone(p),wide=canopyLayout(p),trimmed=canopyLayout(p,6);
 assert.deepEqual(p,before);assert.deepEqual(canopyLayout({...p}),wide);assert.ok(trimmed.crownScale[0]<wide.crownScale[0]);assert.deepEqual(trimmed.trunkScale,wide.trunkScale);assert.equal(trimmed.trunkY,wide.trunkY);
 const clear=masonryClearance([{tags:{building:'yes'},rings:[square(10,0)]}]);assert.equal(clear({x:6,z:2}),4);assert.equal(clear({x:12,z:2}),0);assert.equal(clear({x:1000,z:1000}),Infinity);
 assert.match(canopyGLSL,/LIFE_WIND_MODE == 0/);for(const a of [art,old])for(const k of ['crown','farCrown','needle','farNeedle','trunk'])a[k].dispose();
});
test('flower gardens occupy procedural window recesses, preserve doors and respond to the existing calendar',()=>{
 const features=Array.from({length:20},(_,i)=>({tags:{building:'house',osm_id:100+i},rings:[square(i*20,0)]})),recipes=villageFlowerRecipes(features,()=>0);
 assert.ok(recipes.length>10&&recipes.length<=180);assert.deepEqual(recipes,villageFlowerRecipes([...features].reverse(),()=>0));
 const plans=features.map(f=>buildingPlan(f.rings[0],f.tags,undefined,new Set(),()=>0));
 for(const r of recipes){const plan=plans.find(p=>String(p.seed)===r.id.split(':')[0]),opening=plan.openings.find(o=>Math.hypot(o.x-r.x,o.z-r.z)<1e-8);assert.equal(opening.kind,'window');assert.ok(opening.planter);assert.ok(Math.abs(opening.bottom+.26-r.y)<1e-10);assert.ok(r.width<opening.width);assert.match(r.provenance,/artistic interpretation/)}
 assert.equal(flowerSeason('2026-01-15').bloom,0);assert.equal(flowerSeason('2026-01-15').leaf,0);assert.ok(flowerSeason('2026-06-15').bloom>.9);assert.ok(flowerSeason('2026-10-15').bloom<.08);
});
test('flower cell cache releases hidden meshes and zone-owned material on repeated traversal',async()=>{
 const load=await cpuModules(process.cwd(),'work/cpu-m15-flowers'),{addVillageFlowers,updateVillageFlowers}=await load('src/nature/flower-render.ts'),{disposeNatureZone}=await load('src/nature/render.ts'),zone=new THREE.Group();zone.userData.natureResources={geometries:[],materials:[]};
 const features=Array.from({length:30},(_,i)=>({tags:{building:'house',osm_id:100+i},rings:[square((i%10)*70,Math.floor(i/10)*70)]}));addVillageFlowers(zone,features,()=>0);
 const camera=new THREE.PerspectiveCamera();for(const r of zone.userData.villageFlowers.recipes){camera.position.set(r.x,2,r.z);updateVillageFlowers(zone,camera,'2026-06-21',true)}
 assert.ok(zone.userData.villageFlowers.cells.filter(c=>c.children.length&&!c.visible).length<=4);
 let freed=0;zone.userData.villageFlowers.material.addEventListener('dispose',()=>freed++);disposeNatureZone(zone);assert.equal(freed,1);assert.equal(zone.children.length,0);
});
test('canopy lighting is rebuilt and refuses the prior crown contract',async()=>{
 const m=JSON.parse(await readFile('public/data/angles-walk-lighting.json')),packed=gunzipSync(await readFile('public/data/angles-walk-lighting.pack')),buffer=packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength);
 assert.equal(m.bindings.canopy,CANOPY_VERSION);const stale=structuredClone(m);delete stale.bindings.canopy;assert.throws(()=>decodeLighting(stale,buffer,m.bindings));
});
