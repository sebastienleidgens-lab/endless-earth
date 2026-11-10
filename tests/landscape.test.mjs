import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {roadSegments} from '../scripts/lib/road-topology.mjs';
import {buildSurface} from '../scripts/prepare-road-surface.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {createEcology} from '../src/nature/ecology.mjs';
import {floorTint} from '../scripts/prepare-earth.mjs';
const read=p=>readFileSync('public/data/'+p),manifest=JSON.parse(read('angles-surface.json')),grid=JSON.parse(read('angles-terrain.json')),bytes=gunzipSync(read('angles-surface.pack'));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),surface=decodeSurface(manifest,buffer);
const sha=b=>createHash('sha256').update(b).digest('hex');
const area=(a,b,c)=>Math.abs((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]))/2;
const waterFaces=(t,index)=>{const a=t.attributes.position,w=t.attributes.earthWater,out=[];for(let i=0;i<index.count;i+=3){const ids=[0,1,2].map(j=>index.getX(i+j));if(w.getX(ids[0]))out.push(ids.map(v=>[a.getX(v),a.getY(v),a.getZ(v)]).sort((a,b)=>a[0]-b[0]||a[2]-b[2]))}return out.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))};
test('mapped water shares exact collision terrain, has constant classes and identical near/far faces',()=>{
 let total=0,triangles=0;const baseline=sampleGrid(grid,0,0);
 for(const t of surface.tiles){
  assert.deepEqual(waterFaces(t,t.fine),waterFaces(t,t.far));
  const a=t.attributes.position,w=t.attributes.earthWater,r=t.attributes.earthRoad;
  for(let i=0;i<t.fine.count;i+=3){const ids=[0,1,2].map(j=>t.fine.getX(i+j));assert.ok(ids.every(v=>w.getX(v)===w.getX(ids[0])));if(!w.getX(ids[0]))continue;assert.ok(ids.every(v=>r.getX(v)===0));
   const p=ids.map(v=>[a.getX(v),a.getY(v),a.getZ(v)]);total+=area(...p);triangles++;
   for(const [u,v] of [[0,0],[.3,.2],[1/3,1/3]]){const q=p[0].map((x,k)=>x+(p[1][k]-x)*u+(p[2][k]-x)*v);assert.ok(Math.abs(q[1]+baseline-sampleGrid(grid,q[0],q[2]))<.00005)}
  }
 }
 assert.ok(triangles>2000);assert.ok(Math.abs(total-manifest.stats.waterAreaM2)<.02);assert.equal(manifest.roadOffsetM,0);assert.equal(manifest.polygonOffset,false);
 assert.equal(manifest.water.mode,'mapped-outline-dem-drape-v1');assert.equal(manifest.terrainSha256,sha(read('angles-terrain.json')));
});
test('water union respects islands, overlap, DEM bounds and crossing road priorities without extra area',()=>{
 const g={width:5,height:5,step_m:10,origin_x_m:-20,origin_z_m:-20,elevations_m:Array.from({length:25},(_,i)=>100+(i%5)*.1)};
 const ring=(x,z,w)=>[[x,z],[x+w,z],[x+w,z+w],[x,z+w],[x,z]];
 const waterAreas=[[ring(-30,-30,60),ring(-5,-5,10)],[ring(-18,-18,2)]];
 const segments=roadSegments([{properties:{highway:'residential',surface:'asphalt',width:'4'},geometry:{type:'LineString',coordinates:[[-20,10],[20,10]]}}]);
 const dry=buildSurface(g,segments,{tileCells:2}),wet=buildSurface(g,segments,{tileCells:2,waterAreas});
 assert.ok(Math.abs(dry.stats.roadAreaM2-wet.stats.roadAreaM2)<1e-7);assert.ok(Math.abs(wet.stats.waterAreaM2-(1600-100-160))<1e-7);
 let total=0;for(const t of wet.tiles)for(let i=0;i<t.fine.length;i+=3){const ids=[0,1,2].map(j=>t.fine[i+j]),p=ids.map(id=>Array.from(t.positions.subarray(id*3,id*3+3)));total+=area(...p);assert.ok(ids.every(v=>t.water[v]===t.water[ids[0]]));if(t.water[ids[0]])assert.ok(ids.every(v=>!t.roads[v]))}
 assert.ok(Math.abs(total-1600)<.001);
});
test('decoder refuses missing, truncated, mixed and conflicting water attributes',()=>{
 for(const mutate of [
  (m,b)=>{delete m.tiles[0].earthWater},
  (m,b)=>{m.tiles[0].earthWater.length=1},
  (m,b)=>{const t=m.tiles[0];new Uint8Array(b,t.earthWater.offset,t.earthWater.length)[0]=2},
  (m,b)=>{const t=m.tiles.find(t=>t.earthRoad.length>0),r=new Uint8Array(b,t.earthRoad.offset,t.earthRoad.length),w=new Uint8Array(b,t.earthWater.offset,t.earthWater.length),i=r.findIndex(v=>v);assert.ok(i>=0);w[i]=1}
 ]){const m=structuredClone(manifest),b=buffer.slice(0);mutate(m,b);assert.throws(()=>decodeSurface(m,b),/water/i)}
});
test('weir linework never creates a river habitat and mapped roots retain their DEM heights',()=>{
 const lines=[{tags:{waterway:'weir'},line:[{x:-200,z:0},{x:200,z:0}]}];
 const e=createEcology(lines,()=>0);assert.equal(e.trees.length,0);assert.equal(e.waterDistance({x:0,z:0}),Infinity);
 const forest={tags:{landuse:'forest',leaf_type:'broadleaved'},rings:[[{x:-200,z:-200},{x:200,z:-200},{x:200,z:200},{x:-200,z:200}]]};
 const h=(x,z)=>sampleGrid(grid,x,z),a=createEcology([forest],h),b=createEcology([forest,...lines],h);
 assert.ok(a.trees.length>0);for(const p of b.trees)assert.equal(p.y,h(p.x,p.z));assert.ok(b.trees.every(p=>p.leaf==='broad'));
});
test('forest material colors are decorative, slope weighted and do not classify unknown land',()=>{
 const m=JSON.parse(read('angles-earth.json'));assert.deepEqual(Object.keys(m.cover.counts),['wood']);assert.ok(m.cover.sourceFeatures.every(f=>f.year==='2006'));
 assert.match(m.cover.provenanceByAttribute.classification,/unknown/);assert.match(m.cover.provenanceByAttribute.floorColor,/procedural/);
 assert.ok(floorTint('wood',10,10,1).alpha<floorTint('wood',10,10,0).alpha);assert.notDeepEqual(floorTint('wood',10,10,0),floorTint('wood',40,30,0));
});

test('an agricultural overlay overrides coarse woodland and unknown banks gain no invented forest',()=>{
 const square=(lo,hi)=>[{x:lo,z:lo},{x:hi,z:lo},{x:hi,z:hi},{x:lo,z:hi}];
 const wood={tags:{landuse:'forest','CLC:year':'2006'},rings:[square(-100,100)]},crop={tags:{landuse:'farmland'},rings:[square(-40,40)]};
 const e=createEcology([wood,crop]);assert.equal(e.biome({x:0,z:0}),null);assert.ok(e.trees.every(p=>Math.abs(p.x)>40||Math.abs(p.z)>40));
 const unknown=createEcology([{tags:{natural:'water'},rings:[square(-30,30)]},{tags:{waterway:'river'},line:[{x:-100,z:0},{x:100,z:0}]}]);assert.equal(unknown.trees.length,0);
});
