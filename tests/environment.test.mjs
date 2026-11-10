import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {validateEnvironment,mergeEnvironment} from '../src/world/environment.mjs';import {coverAt} from '../src/world/landcover.mjs';import {createEcology,habitat} from '../src/nature/ecology.mjs';
const text=await readFile('public/data/angles-environment.json','utf8'),data=JSON.parse(text);
test('normalized dataset has complete provenance and matches the rendered atlas dependency',async()=>{
 validateEnvironment(data);const m=JSON.parse(await readFile('public/data/angles-earth.json','utf8'));assert.equal(m.environmentSha256,createHash('sha256').update(text).digest('hex'));assert.equal(data.sources.length,4);assert.ok(data.features.length>100);assert.equal(data.sources.find(s=>s.id==='rpg').vintage,'2024');
 for(const f of data.features)assert.ok(f.properties.attributes&&f.properties.original_id);
});
test('incomplete provenance, wrong projection, invalid geometry and unrecognized classes fail closed',()=>{
 for(const edit of [d=>delete d.sources[0].license,d=>delete d.sources[0].vintage,d=>d.projection='EPSG:2154',d=>d.features[0].properties.class='invented',d=>d.features[0].properties.source_id='missing',d=>d.features[0].geometry.coordinates[0][0][0]=600000]){const d=structuredClone(data);edit(d);assert.throws(()=>validateEnvironment(d))}
});
test('replaces generalized CLC only with a valid dataset, keeps OSM roads and footprints byte-equivalent',()=>{
 const osm=[{properties:{landuse:'forest','CLC:year':'2006'}},{properties:{highway:'path'}},{properties:{building:'yes'}},{properties:{leisure:'garden'}}];assert.equal(mergeEnvironment(osm,null),osm);const merged=mergeEnvironment(osm,data);assert.ok(!merged.includes(osm[0]));for(const f of osm.slice(1))assert.ok(merged.includes(f));assert.equal(osm.length,4);
});
test('land-use priority preserves clearings and polygon holes; unknown remains unclassified',()=>{
 const r=(a,b)=>[{x:a,z:a},{x:b,z:a},{x:b,z:b},{x:a,z:b}];const fs=[{tags:{'world:class':'wood','world:priority':60},rings:[r(0,100)]},{tags:{'world:class':'meadow','world:priority':90},rings:[r(10,90),r(30,40)]}];assert.equal(coverAt(20,20,fs),'meadow');assert.equal(coverAt(35,35,fs),'wood');assert.equal(coverAt(200,200,fs),null);assert.equal(habitat({'world:class':'farmland'}),null);
 const e=createEcology(fs,()=>70);for(const t of e.trees)assert.equal(t.y,70);assert.ok(e.trees.every(t=>!(t.x>10&&t.x<30&&t.z>10&&t.z<30)));
});
test('bounded procedural trees cover separated mapped woods independently of input order',()=>{
 const box=(a,b)=>[[{x:a,z:a},{x:b,z:a},{x:b,z:b},{x:a,z:b}]];const a={tags:{'world:class':'wood','world:priority':95},rings:box(-950,-150)},b={tags:{'world:class':'wood','world:priority':95},rings:box(150,950)};
 const first=createEcology([a,b],()=>70).trees,reverse=createEcology([b,a],()=>70).trees;assert.equal(first.length,2500);assert.ok(first.filter(p=>p.x<0).length>1000);assert.ok(first.filter(p=>p.x>0).length>1000);const keys=trees=>trees.map(p=>[p.x,p.z]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);assert.deepEqual(keys(first),keys(reverse));
});
