import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
import {decodeDecoration} from '../src/world/decoration-pack.mjs';
import {buildingPlan} from '../src/architecture/plan.mjs';import {POITOU} from '../src/architecture/style.mjs';
import {createArchitectureAtlas} from '../src/architecture/texture.mjs';
const hash=a=>createHash('sha256').update(a).digest('hex'),ring=[{x:0,z:0},{x:12,z:0},{x:12,z:9},{x:0,z:9}];
test('architectural identity is stable, source materials override regional defaults and unknown stays inferred',()=>{
 const a=buildingPlan(ring,{osm_id:12}),b=buildingPlan([...ring].reverse(),{osm_id:12});assert.deepEqual(a.appearance,b.appearance);assert.equal(a.appearance.roofKind,2);assert.match(a.appearance.provenance.roof,/unknown/);
 assert.equal(buildingPlan(ring,{'roof:material':'slate'}).appearance.roofKind,3);assert.equal(buildingPlan(ring,{'roof:material':'zinc'}).appearance.roofKind,5);assert.equal(buildingPlan(ring,{'roof:material':'unsupported'}).appearance.roofKind,5);assert.equal(buildingPlan(ring,{'building:material':'wood'}).appearance.facadeKind,4);
 const legacy=buildingPlan(ring,{osm_id:12},{...POITOU,id:'poitou-v1',geometrySeed:'poitou-v1'});assert.equal(a.seed,legacy.seed);assert.equal(a.total,legacy.total);assert.equal(a.rise,legacy.rise);
 const regional=structuredClone(POITOU);regional.id='configurable-test';regional.roof.defaultMaterial='slate';regional.details.frames=[0xffffff];assert.equal(buildingPlan(ring,{},regional).appearance.roofKind,3);
 const appearances=new Set(Array.from({length:32},(_,id)=>JSON.stringify(buildingPlan(ring,{osm_id:id}).appearance)));assert.ok(appearances.size>24);
});
test('delivered atlas is original, checksummed, bounded and its gutters wrap each family',async()=>{
 const m=JSON.parse(await readFile('public/materials/architecture/catalog.json')),bytes=await readFile('public/materials/architecture/atlas.png');assert.equal(hash(bytes),m.sha256);assert.equal(m.budgetEUR,0);assert.ok(bytes.length<1500000);
 const a=createArchitectureAtlas(),b=createArchitectureAtlas();assert.equal(hash(a.data),m.rawSha256);assert.deepEqual(a,b);const stride=a.size+2*a.gutter;
 const offset=(k,x,y)=>((Math.floor(k/3)*stride+y)*a.width+(k%3)*stride+x)*4,wrap=x=>((x-a.gutter)%a.size+a.size)%a.size+a.gutter;
 for(let k=0;k<6;k++)for(const [x,y] of [[0,20],[287,24],[40,0],[70,287]]){const i=offset(k,x,y),j=offset(k,wrap(x),wrap(y));assert.deepEqual(a.data.slice(i,i+4),a.data.slice(j,j+4))}
});
test('all 258 coarse architecture meshes retain exact A positions, normals and indices',async()=>{
 const ref=JSON.parse(gunzipSync(await readFile('docs/mission-12-evidence/architecture/geometry-reference.json.gz'))),raw=gunzipSync(await readFile('public/data/angles-decorations/static.pack')),m=decodeDecoration(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
 const bytes=a=>Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength);
 assert.equal(m.meshes.length,ref.meshes.length);for(let i=0;i<m.meshes.length;i++){const g=m.meshes[i].geometry,r=ref.meshes[i];assert.equal(m.meshes[i].name,r.name);assert.equal(hash(bytes(g.attributes.position)),r.position);assert.equal(hash(bytes(g.attributes.normal)),r.normal);assert.equal(hash(bytes(g.index)),r.indices);assert.equal(g.attributes.architectureMaterial.count,g.attributes.position.count);g.dispose()}
});
