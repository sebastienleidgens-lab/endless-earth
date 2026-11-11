import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateFranceCatalogue,resolveFrenchFamily,FRENCH_REGIONS} from '../src/materials/france-model.mjs';
import {mipBytes} from '../src/materials/authentic-model.mjs';
import {frenchMaterialStyle} from '../src/materials/france-style.mjs';
import {buildingPlan} from '../src/architecture/plan.mjs';
import {landscapeFixture,FIXTURE_IDS} from '../src/fixtures/landscapes.mjs';
const root=new URL('../public/materials/france/',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
test('13D context packs match pinned files, two-channel mip costs and CC0 provenance',async()=>{
 const c=validateFranceCatalogue(await read('catalog.json'));
 assert.equal(sha(await readFile(new URL('../authentic/catalog.json',root))),c.baseCatalogueSha256);
 assert.equal(sha(await readFile(new URL('granite-source.json',root))),c.graniteSourceSha256);
 for(const p of c.packs){const data=await readFile(new URL(p.file,root));assert.equal(data.length,p.bytes);assert.equal(sha(data),p.sha256);assert.equal(mipBytes(...p.dimensions,2),p.gpuBytesWithMipmapsEstimate);assert.ok(p.gpuBytesWithMipmapsEstimate<500000);assert.ok(p.entries.every(e=>e.license==='CC0-1.0'))}
 const g=await read('granite-source.json');assert.deepEqual(g.metres,[1.9,1.9]);assert.equal(g.author['Dimitrios Savva'],'All');assert.ok(g.maps.every(m=>/^[a-f0-9]{64}$/.test(m.sha256)));
});
test('13D invalid catalogues cannot select remote packs, duplicate regions or unsafe relief',async()=>{
 const c=await read('catalog.json');for(const change of [c=>c.packs[0].file='https://example.com/a.png',c=>c.packs[1].id='poitou',c=>c.packs[0].entries[0].reliefM=1,c=>c.packs[0].dimensions=[8192,8192],c=>c.packs[0].entries[1].slot=0]){const bad=structuredClone(c);change(bad);assert.throws(()=>validateFranceCatalogue(bad))}
});
test('13D observed local families beat all regional defaults and unknown tags stay unknown',()=>{
 for(const region of FRENCH_REGIONS){assert.equal(resolveFrenchFamily('roof','slate',region).family,'slate');assert.equal(resolveFrenchFamily('wall','wood',region).family,'wood');assert.equal(resolveFrenchFamily('roof','unrecognised',region).family,'unknown');assert.equal(resolveFrenchFamily('ground',null,region).family,'unknown')}
 assert.equal(resolveFrenchFamily('roof',null,'atlantic').family,'slate');assert.equal(resolveFrenchFamily('roof',null,'mediterranean').family,'clay');assert.throws(()=>resolveFrenchFamily('roof',null,'invented'));
});
test('13D two synthetic landscapes keep roof planes, openings, dimensions and anchors across material contexts',()=>{
 for(const id of FIXTURE_IDS){const f=landscapeFixture(id);
  for(const b of f.buildings){const plans=FRENCH_REGIONS.map(r=>buildingPlan(b.rings[0],b.tags,frenchMaterialStyle(r).architecture,new Set(),f.height)),a=plans[0];
   for(const p of plans.slice(1)){for(const key of ['seed','ring','base','eaves','top','total','rise','openings','anchors','ux','uz','width'])assert.deepEqual(p[key],a[key],id+'/'+key);for(const point of p.ring)assert.equal(p.roofY(point),a.roofY(point))}
   if(b.tags['roof:material']==='slate')assert.ok(plans.every(p=>p.appearance.roofKind===3));
  }
 }
 const style=frenchMaterialStyle('atlantic').architecture,ring=landscapeFixture().buildings[0].rings[0];
 for(const tag of ['stone','limestone','wood','granite']){const p=buildingPlan(ring,{'building:material':tag},style);assert.equal(p.appearance.facadeKind,tag==='wood'?4:tag==='granite'?8:0);assert.equal(p.appearance.provenance.wall,'OSM material tag')}
});
