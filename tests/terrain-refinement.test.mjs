import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {sourceGeometry} from '../src/world/source-geometry.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {moveGrounded} from '../src/controls/walking.mjs';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const base=await load('public/data/angles-terrain.json'),raw=await load('public/data/angles-relief.json'),g={...base,refinement:validateRefinement(base,raw)},zero=sampleGrid(g,0,0);
test('local TINs preserve the original grid perimeter and have no internal cracks or T junctions',()=>{
 const geometry=sourceGeometry(g),p=geometry.attributes.position.array,ids=geometry.index.array,edges=new Map();
 for(let i=0;i<ids.length;i+=3)for(let e=0;e<3;e++){const a=ids[i+e],b=ids[i+(e+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,(edges.get(key)??0)+1)}
 let boundary=0;
 for(const [key,count] of edges){assert.ok(count===1||count===2);if(count===1){boundary++;const [a,b]=key.split(':').map(Number);assert.ok([0,2].some(axis=>Math.abs(p[a*3+axis])===1000&&p[a*3+axis]===p[b*3+axis]),`Internal open edge ${key}`)}}
 assert.equal(boundary,800);
 for(let i=0;i<base.elevations_m.length;i++)assert.ok(Math.abs(p[i*3+1]-(base.elevations_m[i]-zero))<.00001);
 geometry.dispose();
});
test('every refined road/ground/water triangle agrees with walking support at fine and far LOD',async()=>{
 const m=await load('public/data/angles-relief-surface.json'),packed=gunzipSync(await readFile('public/data/angles-relief-surface.pack'));
 assert.equal(createHash('sha256').update(packed).digest('hex'),m.binarySha256);
 const surface=decodeSurface(m,packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength));
 let checked=0,maxError=0;
 for(const tile of surface.tiles)for(const lod of ['fine','far']){
  const p=tile.attributes.position.array,ids=tile[lod].array;
  for(let i=0;i<ids.length;i+=3){const t=Array.from(ids.slice(i,i+3));const x=t.reduce((s,v)=>s+p[v*3],0)/3,z=t.reduce((s,v)=>s+p[v*3+2],0)/3;
   const cell=g.refinement.cells.get(Math.floor((z+1000)/10)*g.width+Math.floor((x+1000)/10));if(!cell)continue;
   const y=t.reduce((s,v)=>s+p[v*3+1],0)/3,error=Math.abs(y-(sampleGrid(g,x,z)-zero));maxError=Math.max(maxError,error);checked++;
   assert.ok(error<.0005,`${lod} support mismatch ${error} at ${x},${z}`);
  }
 }
 assert.ok(checked>20000);console.log('Refined surface centroid checks',checked,'max numeric residual',maxError);
});
test('refinement rejects wrong datum, duplicate cells, invalid winding and incomplete cells',()=>{
 for(const change of [r=>r.verticalDatum='ellipsoid',r=>r.cells.push(r.cells[0]),r=>r.cells[0].indices[0]=-1,r=>r.cells[0].indices.splice(0,3),r=>r.cells[0].vertices[0]=1e6]){
  const r=structuredClone(raw);change(r);assert.throws(()=>validateRefinement(base,r));
 }
});
test('steep documented slopes stop movement; accepted steps stay on the same TIN',()=>{
 let blocked=0,moved=0;
 for(const c of raw.cells){const x=-1000+c.x*10+5,z=-1000+c.z*10+5,p={x,z,y:sampleGrid(g,x,z)};
  moveGrounded(p,{x:.5,z:0},()=>true,(x,z)=>sampleGrid(g,x,z),()=>.7,false);
  assert.ok(Math.abs(p.y-sampleGrid(g,p.x,p.z))<1e-8);
  if(p.x===x)blocked++;else moved++;
 }
 assert.ok(blocked>20&&moved>20);
});
test('prepared anchors keep tree identity and coordinates and reuse unchanged packs',async()=>{
 const a=await load('public/data/angles-decorations/manifest.json'),b=await load('public/data/angles-relief-decorations/manifest.json');
 assert.equal(a.trees.length,b.trees.length);let changed=0;
 for(let i=0;i<a.trees.length;i++){
  const {y:oldY,...old}=a.trees[i],{y,...current}=b.trees[i];assert.deepEqual(current,old);
  assert.equal(y,sampleGrid(g,current.x,current.z)-zero);if(y!==oldY)changed++;
 }
 assert.ok(changed>0);assert.ok(b.entries.filter(e=>e.shared).length>290);
 for(const entry of [b.static,...b.entries]){
  const path=entry.shared?'angles-decorations':'angles-relief-decorations',bytes=await readFile(`public/data/${path}/${entry.file}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
 }
});
