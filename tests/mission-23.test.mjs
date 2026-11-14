import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {surfaceSupport} from '../src/world/surface-support.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
import {moveGrounded} from '../src/controls/walking.mjs';
import {createWalker} from '../src/character/walker.mjs';
import {buildGraph} from '../src/living/graph.mjs';
const json=async f=>JSON.parse(await readFile('public/data/'+f+'.json'));
const manifest=await json('angles-ground-truth'),packed=gunzipSync(await readFile('public/data/angles-ground-truth.pack')),surface=decodeSurface(manifest,packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength)),support=surfaceSupport(surface.tiles,[-1000,-1000,1000,1000]);
test('source-bound repairs reject stale data and keep a bounded shared support index',async()=>{
 assert.equal(createHash('sha256').update(packed).digest('hex'),manifest.binarySha256);
 assert.equal(manifest.groundTruth.baseSurfaceSha256,(await json('angles-walk-surface')).binarySha256);
 const g=await json('angles-terrain'),r=await json('angles-ground-truth-repairs');assert.equal(createHash('sha256').update(await readFile('public/data/angles-ground-truth-repairs.json')).digest('hex'),manifest.groundTruth.repairsSha256);assert.equal(validateRefinement(g,r).cells.size,manifest.groundTruth.cells);
 assert.ok(support.indexBytes<8*1024*1024);assert.equal(support.triangles,manifest.stats.fineTriangles);
});
test('every active fine triangle faces up, stays finite and is its physical support',()=>{
 let checked=0,maxResidual=0;
 for(const t of surface.tiles){const p=t.attributes.position.array,ids=t.fine.array;
  for(let i=0;i<ids.length;i+=3){const a=ids[i]*3,b=ids[i+1]*3,c=ids[i+2]*3,ny=(p[b+2]-p[a+2])*(p[c]-p[a])-(p[b]-p[a])*(p[c+2]-p[a+2]);assert.ok(ny>1e-10);
   const x=(p[a]+p[b]+p[c])/3,z=(p[a+2]+p[b+2]+p[c+2])/3,y=(p[a+1]+p[b+1]+p[c+1])/3,h=support.sample(x,z);assert.ok(Number.isFinite(h));maxResidual=Math.max(maxResidual,Math.abs(h-y));checked++;
  }
 }
 assert.ok(checked>130000);assert.ok(maxResidual<.001,`support/mesh residual ${maxResidual}`);
});
test('all repaired cells remain in the exact fine representation at distant LOD',async()=>{
 const g=await json('angles-terrain'),r=await json('angles-ground-truth-repairs');
 for(const c of r.cells){const t=surface.tiles.find(t=>c.x>=t.descriptor.x&&c.x<t.descriptor.x+t.descriptor.size&&c.z>=t.descriptor.z&&c.z<t.descriptor.z+t.descriptor.size);assert.deepEqual(t.far.array,t.fine.array);const x=g.origin_x_m+c.x*g.step_m+5,z=g.origin_z_m+c.z*g.step_m+5;assert.ok(Number.isFinite(support.sample(x,z)));}
});
test('support holes, water ownership, inverted faces and nonfinite positions are explicit',()=>{
 const tile={attributes:{position:{array:Float32Array.from([0,0,0,0,0,1,1,0,0,0,4,0,0,4,1,1,4,0])},earthRoad:{array:new Uint8Array(6)},earthWater:{array:Uint8Array.from([0,0,0,1,1,1])}},fine:{array:Uint16Array.from([0,1,2,3,4,5])}};
 const s=surfaceSupport([tile],[-1,-1,2,2]);assert.equal(s.sample(.2,.2),4);assert.equal(s.inspect(.2,.2).category,'water');assert.equal(s.inspect(.2,.2).walkable,false);assert.equal(s.sample(.9,.9),undefined);assert.equal(s.sample(NaN,0),undefined);
 tile.fine.array=Uint16Array.from([0,2,1]);assert.equal(surfaceSupport([tile],[-1,-1,2,2]).sample(.2,.2),undefined);
});
test('the same 18cm sloped kerb passes up/down/diagonally at 30/60/120Hz and irregular frames',()=>{
 for(const sign of [-1,1])for(const diagonal of [false,true])for(const times of [[1/30],[1/60],[1/120],[.008,.042,.013,.25,.016]]){
  const h=x=>sign*(x*.55+(x>=.5?.18:0)),p={x:0,y:0,z:0};let time=0,i=0;
  while(time<3-1e-10){const dt=Math.min(3-time,times[i++%times.length]);moveGrounded(p,{x:dt,z:diagonal?dt:0},()=>true,h,()=>.7,false);time+=dt;}
  assert.ok(Math.abs(p.x-3)<1e-8,`${sign}/${diagonal}/${times}: ${p.x}`);assert.equal(p.y,h(p.x));
 }
});
test('walls, unsupported drops, sustained steep ramps and numeric errors remain blocking',()=>{
 for(const h of [x=>x*.95,x=>-x*.95,x=>x>=.5?1:0,x=>x>=.5?-1:0,x=>x>=.5?NaN:0]){const p={x:0,y:0,z:0},events=[];moveGrounded(p,{x:3,z:0},()=>true,h,()=>.7,false,d=>events.push(d));assert.ok(p.x<.51);assert.ok(events.length&&events[0].rule);}
 const p={x:0,y:0,z:0},events=[];moveGrounded(p,{x:NaN,z:0},()=>true,()=>0,()=>.7,false,d=>events.push(d));assert.equal(p.x,0);assert.equal(events[0].rule,'numeric-error');
});
test('a kerb may land beside a wall or water without a second future capsule blocking it early',()=>{
 const height=x=>x>=.5?.12:0,clear=x=>x<=.65,p={x:0,y:0,z:0};
 moveGrounded(p,{x:1,z:0},clear,height,()=>.7,false);
 assert.ok(p.x>=.59&&p.x<=.65,`Body should stop at actual clearance after climbing the kerb, x=${p.x}`);assert.equal(p.y,.12);
});
test('exact support normals stop sideways cliff walking while a short bevel remains a walkable kerb',()=>{
 const strip=(xs,heights)=>{const p=[],ids=[];for(let i=0;i<xs.length;i++)p.push(xs[i],heights[i],-1,xs[i],heights[i],1);for(let i=1;i<xs.length;i++){const a=(i-1)*2,b=i*2;ids.push(a,a+1,b,b,a+1,b+1)}return surfaceSupport([{attributes:{position:{array:Float32Array.from(p)},earthRoad:{array:new Uint8Array(p.length/3)},earthWater:{array:new Uint8Array(p.length/3)}},fine:{array:Uint16Array.from(ids)}}],[-1,-1,1,1])};
 const cliff=strip([-1,1],[-3,3]),p={x:0,y:0,z:-.5};assert.ok(cliff.slope(0,0)>2.99);moveGrounded(p,{x:0,z:1},(x,z)=>cliff.walkable(x,z),(x,z)=>cliff.sample(x,z)??null,()=>.7,false);assert.equal(p.z,-.5);
 const kerb=strip([-1,0,.02,1],[0,0,.12,.12]);assert.ok(kerb.slope(.01,0)>5);assert.equal(kerb.walkable(.01,0),true);const q={x:-.2,y:0,z:0};moveGrounded(q,{x:.6,z:0},(x,z)=>kerb.walkable(x,z),(x,z)=>kerb.sample(x,z)??null,()=>.7,false);assert.ok(q.x>.39);assert.ok(Math.abs(q.y-.12)<1e-8);assert.equal(strip([-1,0,.02,1],[0,0,.5,.5]).walkable(.01,0),false,'a 50cm bevelled wall is not a kerb');
});
test('navigation rejects an apparently clear segment if either physical direction fails',()=>{
 const line={points:[{x:0,z:0},{x:10,z:0}],tags:{highway:'path'}};
 assert.equal(buildGraph([line],()=>true,()=>true,()=>false).edges.length,0);assert.equal(buildGraph([line],()=>true,()=>true,(a,b)=>a.x<b.x).edges.length,0);assert.equal(buildGraph([line],()=>true,()=>true,()=>true).edges.length,1);
});
test('blocked and turned rig returns to standing; unknown foot support cannot fold the pelvis',()=>{
 const w=createWalker(),scene=new THREE.Scene();scene.add(w.avatar);w.avatar.rotation.y=Math.PI/2;
 for(let i=0;i<180;i++){const d=1.45/60;w.avatar.position.x+=d;w.avatar.position.y=w.avatar.position.x*.4;w.update(d,1/60,x=>x*.4);}
 for(let i=0;i<180;i++){w.avatar.rotation.y+=Math.PI/180;w.update(0,1/60,i<60?()=>null:x=>x*.4);assert.ok(w.hips.position.y>=.72&&w.hips.position.y<=.91);for(const b of w.avatar.children[0].skeleton.bones)assert.ok(b.rotation.toArray().slice(0,3).every(Number.isFinite));}
 assert.equal(w.metrics.mode,'idle');for(const f of w.feet)assert.ok(Math.hypot(f.target.x-w.avatar.position.x,f.target.z-w.avatar.position.z)<.15);w.dispose();
});
