import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createForestModels,forestLayout} from '../src/nature/forest-model.mjs';
const base='9716fbb40f59a213107e18c699f4b317da86edf3',sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir('work/mission-24',{recursive:true});await mkdir('docs/mission-24-evidence',{recursive:true});
const original=execFileSync('git',['show',base+':src/nature/forest-model.mjs'],{encoding:'utf8'}).replace("from 'three'",`from '${import.meta.resolve('three')}'`);
await writeFile('work/mission-24/forest-before.mjs',original);
const old=await import(pathToFileURL(resolve('work/mission-24/forest-before.mjs'))),before=old.createForestModels(),after=createForestModels();
const geometry=[];let reversed=0,triangles=0;
for(const [id,a]of after){const b=before.get(id);assert.deepEqual(a.tree,b.tree);assert.deepEqual(a.box,b.box);
 for(let lod=0;lod<3;lod++)for(const part of ['wood','leaves']){const x=a.levels[lod][part],y=b.levels[lod][part];
  for(const key of Object.keys(y.attributes))assert.deepEqual(x.attributes[key].array,y.attributes[key].array,`${id}/${lod}/${part}/${key} moved`);
  assert.equal(x.index.count,y.index.count);let flipped=0;
  for(let i=0;i<x.index.count;i+=3){const ai=Array.from(x.index.array.slice(i,i+3)),bi=Array.from(y.index.array.slice(i,i+3));assert.deepEqual(ai.toSorted((a,b)=>a-b),bi.toSorted((a,b)=>a-b));if(ai[1]!==bi[1])flipped++;triangles++;}
  if(part==='leaves')assert.equal(flipped,0);
  if(part==='wood'&&lod===2)assert.deepEqual(x.index.array.slice(72),y.index.array.slice(72),'far open ribbons changed');
  reversed+=flipped;
  geometry.push({id,lod,part,triangles:x.index.count/3,reoriented:flipped,positionsSha256:sha(new Uint8Array(x.attributes.position.array.buffer)),normalsSha256:sha(new Uint8Array(x.attributes.normal.array.buffer)),allAttributesUnchanged:true});
 }
}
for(let i=0;i<100;i++){const p={x:i*1.3,z:17,kind:i%3?'broadleaf':'young',leaf:i%11?'broad':'needle',scale:.5+i%17/10},c={clearance:30,habitat:'wood'};assert.deepEqual(forestLayout(p,c,after),old.forestLayout(p,c,before));}
// No cache is relabelled until its actual stored geometry and anchors are proven
// unchanged. Winding is a runtime model transform; source geographic packs stay.
const manifests=[];
for(const name of ['angles-decorations','angles-relief-decorations']){const file='public/data/'+name+'/manifest.json',m=JSON.parse(await readFile(file)),prior=JSON.parse(execFileSync('git',['show',base+':'+file],{maxBuffer:16*1024*1024}));
 assert.deepEqual(m.trees,prior.trees);assert.deepEqual(m.architectureAnchors,prior.architectureAnchors);
 for(const entry of [m.static,...m.entries]){assert.ok([prior.static,...prior.entries].some(e=>e.file===entry.file&&e.sha256===entry.sha256));assert.equal(sha(await readFile('public/data/'+(entry.shared?'angles-decorations':name)+'/'+entry.file)),entry.sha256);}
 for(const f of new Set([...Object.keys(m.generators),...Object.keys(m.runtimeTransforms.generators)]))m.runtimeTransforms.generators[f]=sha(await readFile(f));
 m.runtimeTransforms.mission24='Orient solid branch indices against their existing exterior radial normals. Stored packs, all vertex attributes, branch pivots, model bounds, layouts and geographic anchors unchanged; far ribbons retain original indices.';
 await writeFile(file,JSON.stringify(m)+'\n');manifests.push({file,treeSha256:m.treeSha256,packs:m.entries.length+1});
}
const protectedFiles=['src/world/collisions.ts','src/world/surface-support.mjs','src/world/terrain.ts','src/character/walker.mjs','src/character/gait.mjs','src/earthlife/wind.mjs','src/life/model.mjs','src/life/render.mjs','src/controls','src/living','public/data','public/audio','public/materials','public/art','.github'];
const paths=execFileSync('git',['ls-tree','-r','--name-only',base,'--',...protectedFiles],{encoding:'utf8'}).trim().split('\n').filter(f=>!manifests.some(m=>m.file===f)),preserved=[];
for(const f of paths){const a=await readFile(f),b=execFileSync('git',['show',base+':'+f],{maxBuffer:128*1024*1024});assert.deepEqual(a,b,f+' changed');preserved.push({file:f,sha256:sha(a)});}
const proof={base,reversedSolidTriangles:reversed,trianglesChecked:triangles,geometry,manifests,protectedFiles:preserved,source:'All comparisons use actual pinned Git objects; no source terrain, rig, wind or hydrology change.'};
await writeFile('docs/mission-24-evidence/preservation.json',JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify({base,reversed,triangles,protectedFiles:preserved.length,manifests:manifests.length}));
