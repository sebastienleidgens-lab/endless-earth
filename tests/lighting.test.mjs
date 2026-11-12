import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import {decodeLighting,lightingPolicy,encodeLightingIndices,decodeLightingIndices} from '../src/lighting/model.mjs';import {triangleBVH,contactVisibility} from '../scripts/lib/occlusion-bvh.mjs';
const manifest=JSON.parse(await readFile('public/data/angles-lighting.json')),bytes=gunzipSync(await readFile('public/data/angles-lighting.pack')),buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),data=decodeLighting(manifest,buffer,manifest.bindings);
test('prepared lighting is source-bound and every ambient buffer matches its original vertex count',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.binarySha256);let vertices=0;for(const g of manifest.geometry){const entry=data.geometry.get(g.positionSha256);assert.equal(entry.ao.length,g.vertices*3);assert.ok(entry.ao.every(v=>v>=105&&v<=255));vertices+=g.vertices}assert.ok(vertices>500000);assert.ok(data.cells.reduce((n,c)=>n+c.index.length/3,0)>300000);
});
test('lighting rejects stale sources, malformed descriptors, out-of-range shadow indices and unbounded allocations',()=>{
 for(const change of [m=>m.bindings.terrain='stale',m=>m.geometry[0].ao.offset=-1,m=>m.geometry[0].ao.type='f32',m=>m.geometry[0].vertices+=1,m=>m.shadow.position.length=3000000,m=>m.shadow.cells[0].index.count=2500000,m=>m.shadow.cells[0].bounds[0]=Infinity]){const m=structuredClone(manifest);change(m);assert.throws(()=>decodeLighting(m,buffer,manifest.bindings))}
});
test('lossless shadow index coding preserves winding and rejects truncated, overflowing or trailing data',()=>{
 const source=Uint32Array.from([0,1,2,2,3,0,203454,203453,10,0]);assert.deepEqual(decodeLightingIndices(encodeLightingIndices(source),source.length),source);
 for(const [encoded,count]of [[new Uint8Array([128]),1],[new Uint8Array([255,255,255,255,31]),1],[new Uint8Array([1]),1],[new Uint8Array([0,0]),1]])assert.throws(()=>decodeLightingIndices(encoded,count));
});
test('contact visibility responds to actual nearby triangles and leaves open or degenerate normals unchanged',()=>{
 const triangles=Float32Array.from([-10,0,-10,10,0,-10,10,0,10,-10,0,-10,10,0,10,-10,0,10,0,0,-10,0,10,-10,0,10,10,0,0,-10,0,10,10,0,0,10]),bvh=triangleBVH(triangles);
 assert.ok(Math.abs(bvh.nearest([2,1,0],[0,-1,0],4)-1)<1e-9);assert.equal(bvh.nearest([2,1,0],[0,1,0],4),4);assert.ok(contactVisibility(bvh,[.1,0,0],[0,1,0])<contactVisibility(bvh,[8,0,0],[0,1,0]));assert.equal(contactVisibility(bvh,[8,0,0],[0,0,0]),1);
});
test('profile budgets disable the solar target in Eco and keep higher modes within one bounded map and 256 crowns',()=>{
 assert.equal(lightingPolicy('eco').size,0);for(const name of ['balanced','quality','custom']){const p=lightingPolicy(name);assert.ok(p.size*p.size*5<=6*1024*1024);assert.ok(p.trees<=256&&p.hz<=4&&p.radius<=80)}
});
