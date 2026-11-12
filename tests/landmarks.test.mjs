import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import * as THREE from 'three';
import {prepareLandmarks} from '../src/world/landmark-model.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {cpuModules} from '../scripts/lib/cpu-modules.mjs';
import {createNavigation} from '../src/world/navigation.mjs';
const loadJSON=async p=>JSON.parse(await readFile(p,'utf8')),raw=await loadJSON('public/data/angles-landmarks.json'),g=await loadJSON('public/data/angles-terrain.json'),osm=await loadJSON('public/data/angles-osm.geojson');g.refinement=validateRefinement(g,await loadJSON('public/data/angles-relief.json'));const zero=sampleGrid(g,0,0),lm=prepareLandmarks(raw,zero,raw.bindings);
const load=await cpuModules(process.cwd(),'work/mission-14B/collision-tests'),collisions=await load('src/world/collisions.ts');
const configure=()=>collisions.setBuildingFootprints([...osm.features,...lm.collisionFeatures],undefined,(f,x,z)=>lm.support(`osm-way-${f.properties?.osm_id}`,x,z));
const road=lm.objects.find(o=>o.id==='pont').parts[1];
test('bridge rendering and physical support use the exact same indexed triangles',()=>{
 const p=road.position,ids=road.index;let count=0;
 for(let i=0;i<ids.length;i+=3){const tri=Array.from(ids.subarray(i,i+3)),x=tri.reduce((h,v)=>h+p[v*3],0)/3,z=tri.reduce((h,v)=>h+p[v*3+2],0)/3,y=tri.reduce((h,v)=>h+p[v*3+1],0)/3;
  assert.ok(Math.abs(lm.support('osm-way-647696691',x,z)-y)<1e-4);count++;
  const [a,b,c]=tri.map(v=>new THREE.Vector3(p[v*3],p[v*3+1],p[v*3+2]));assert.ok(b.sub(a).cross(c.sub(a)).y>0,'road faces point upward');
 }
 assert.ok(count>500);
});
test('manual motor crosses the real mapped bridge axis in both directions without a support jump',()=>{
 configure();const feature=osm.features.find(f=>f.properties?.osm_id===647696691),points=feature.geometry.coordinates.map(([lon,lat])=>({x:(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(lat-46.6953)*111320}));
 const height=collisions.walkingHeight((x,z)=>sampleGrid(g,x,z)-zero);
 for(const path of [points,[...points].reverse()]){
  const p=new THREE.Vector3(path[0].x,height(path[0].x,path[0].z),path[0].z);
  for(let i=1;i<path.length;i++){
   const target=path[i],distance=Math.hypot(target.x-p.x,target.z-p.z),steps=Math.ceil(distance/.08),dx=(target.x-p.x)/steps,dz=(target.z-p.z)/steps;
   for(let j=0;j<steps;j++){const old=p.clone();collisions.moveWithCollision(p,{x:dx,z:dz},(x,z)=>sampleGrid(g,x,z)-zero,false);assert.ok(Math.hypot(p.x-old.x,p.z-old.z)>.001,`blocked bridge step at ${old.x},${old.z}`);assert.ok(Math.abs(p.y-height(p.x,p.z))<1e-8);assert.ok(Math.abs(p.y-old.y)<.08);}
  }
 }
});
test('bridge parapets block lateral movement and unknown bridge heights still block access',()=>{
 configure();const x=-185,z=156,height=collisions.walkingHeight((x,z)=>sampleGrid(g,x,z)-zero),p=new THREE.Vector3(x,height(x,z),z);
 collisions.moveWithCollision(p,{x:10,z:6.4},(x,z)=>sampleGrid(g,x,z)-zero,false);assert.ok(Math.hypot(p.x-x,p.z-z)<4);
 collisions.setBuildingFootprints(osm.features);assert.equal(collisions.canWalk(x,z),false);
 const unknown=createNavigation([{tags:{highway:'footway',bridge:'yes',width:5.5},points:[{x:0,z:0},{x:10,z:0}],support:()=>null}]);
 assert.equal(unknown(-.2,0).clear,false,'a shared provider must not open an unknown bridge endpoint');
 const verified=createNavigation([{tags:{highway:'footway',bridge:'yes',width:5.5},points:[{x:0,z:0},{x:10,z:0}],support:(x)=>x>=0&&x<=10?4:null}]);
 assert.equal(verified(-.2,0).clear,true);assert.equal(verified(0,0).support,4);
});
test('under-deck clipping retains all source surface heights, near and far',async()=>{
 const m=await loadJSON('public/data/angles-landmark-surface.json'),bytes=gunzipSync(await readFile('public/data/angles-landmark-surface.pack')),surface=decodeSurface(m,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));let count=0;
 for(const tile of surface.tiles)for(const lod of ['fine','far']){const p=tile.attributes.position.array,ids=tile[lod].array;
  for(let i=0;i<ids.length;i+=3){const t=Array.from(ids.subarray(i,i+3)),x=t.reduce((s,v)=>s+p[v*3],0)/3,z=t.reduce((s,v)=>s+p[v*3+2],0)/3;if(x<-220||x>-150||z<110||z>205)continue;
   const y=t.reduce((s,v)=>s+p[v*3+1],0)/3;assert.ok(Math.abs(y-(sampleGrid(g,x,z)-zero))<.001);count++;
  }
 }
 assert.ok(count>100);
});
test('invalid source bindings, mesh ranges, normals and collision payloads fail before activation',()=>{
 for(const change of [r=>r.bindings.terrain='stale',r=>r.objects[0].parts[0].index[0]=-1,r=>r.objects[0].parts[0].normal[0]=40000,r=>r.collisionFeatures[0].geometry.coordinates[0][0]=NaN]){
  const data=structuredClone(raw);change(data);assert.throws(()=>prepareLandmarks(data,zero,raw.bindings));
 }
});
