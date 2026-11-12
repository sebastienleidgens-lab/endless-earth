import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateAuthenticCatalogue,authenticIdentity,mipBytes} from '../src/materials/authentic-model.mjs';
const root=new URL('../public/materials/authentic/',import.meta.url),read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
test('13B delivered atlases match their pinned bytes and exact mip storage estimates',async()=>{
 const c=validateAuthenticCatalogue(await read('catalog.json'));
 for(const f of c.files){const b=await readFile(new URL(f.file,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);assert.equal(mipBytes(...f.dimensions,f.gpuChannels),f.gpuBytesWithMipmapsEstimate)}
 const b=await readFile(new URL('sources.json',root));assert.equal(createHash('sha256').update(b).digest('hex'),c.sourceManifestSha256);
});
test('13B source licences, map provenance and scale uncertainty stay explicit',async()=>{
 const c=await read('catalog.json'),s=await read('sources.json');
 for(const e of c.entries){const source=s.entries.find(r=>r.id===e.sourceId);assert.equal(source.license,'CC0-1.0');for(const kind of ['Diffuse','Displacement','Rough'])assert.match(source.maps.find(m=>m.role===kind).sha256,/^[a-f0-9]{64}$/);if(!source.sourceTileMetres)assert.match(e.scaleStatus,/artistic estimate/)}
 assert.deepEqual(c.entries.find(e=>e.id==='rock-existing').metres,[2.7,2.7]);
 assert.deepEqual(c.entries.find(e=>e.id==='rock-existing').proceduralMetres,[27,27]);
});
test('13B rejects corrupt layout, remote texture paths, duplicate slots and unsafe relief',async()=>{
 const c=await read('catalog.json');
 for(const change of [c=>c.entries[1].slot=c.entries[0].slot,c=>c.entries[0].metres=[0,2],c=>c.entries[0].reliefM=2,c=>c.files[0].file='https://example.com/texture.jpg',c=>c.entries[0].license='unknown']){const bad=structuredClone(c);change(bad);assert.throws(()=>validateAuthenticCatalogue(bad))}
});
test('13B persistent identity is independent of load order and keeps roof orientation fixed',()=>{
 const ids=['osm/way/42','osm/way/99','tile/14/1/2'];
 const forward=new Map(ids.map(id=>[id,authenticIdentity('roof-flat',id)]));
 for(const id of [...ids].reverse())assert.deepEqual(authenticIdentity('roof-flat',id),forward.get(id));
 assert.notDeepEqual(forward.get(ids[0]),forward.get(ids[1]));
 for(const v of forward.values())assert.ok(v.offset.every(x=>x>=0&&x<1));
 assert.equal(mipBytes(1,1,2),2);
});
