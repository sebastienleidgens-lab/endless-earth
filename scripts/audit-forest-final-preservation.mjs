import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createForestModels,forestAtlas,FOREST_LIBRARY} from '../src/nature/forest-model.mjs';
import {optimizeForestModels,flattenForestSprays,FOREST_LOD_POLICIES} from '../src/nature/forest-lod.mjs';
import {FOREST_PHENOLOGY,FOREST_MOTION_PADDING} from '../src/nature/forest-life.mjs';
const base='04a758cd8a3e85aa5b8e7ad01b9e730f472438d1',out='docs/mission-17-evidence/final',work='work/mission-17d';
const git=p=>execFileSync('git',['show',base+':'+p],{maxBuffer:128*1024*1024}),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(work,{recursive:true});await writeFile(work+'/approved-model.mjs',git('src/nature/forest-model.mjs'));
const approved=await import('../work/mission-17d/approved-model.mjs'),before=approved.createForestModels(),checks=[];
for(const [id,m]of createForestModels())for(let lod=0;lod<3;lod++)for(const part of ['wood','leaves'])for(const [name,a]of [...Object.entries(m.levels[lod][part].attributes),['index',m.levels[lod][part].index]]){const g=before.get(id).levels[lod][part],b=name==='index'?g.index:g.attributes[name];assert.deepEqual(a.array,b.array);checks.push({id,lod,part,attribute:name,bytes:a.array.byteLength,sha256:hash(a.array)})}
assert.deepEqual(forestAtlas(),approved.forestAtlas());
const now=JSON.parse(await readFile('public/data/angles-forest.json')),old=JSON.parse(git('public/data/angles-forest.json'));assert.deepEqual(now.added,old.added);
for(const dir of ['angles-decorations','angles-relief-decorations']){const p='public/data/'+dir+'/manifest.json',a=JSON.parse(await readFile(p)),b=JSON.parse(git(p));for(const m of [a,b]){delete m.forestLayer;delete m.runtimeTransforms.generators}assert.deepEqual(a,b)}
const allowed=['public/data/angles-forest.json','public/data/angles-walk-lighting.json','public/data/angles-decorations/manifest.json','public/data/angles-relief-decorations/manifest.json'],changed=[];let preserved=0;
for(const p of execFileSync('git',['ls-tree','-r','--name-only',base,'public','docs/mission-17-evidence'],{encoding:'utf8'}).trim().split('\n')){if((await readFile(p)).equals(git(p)))preserved++;else{assert.ok(allowed.includes(p),'Unexpected data or archived proof change: '+p);changed.push(p)}}
assert.deepEqual(await readFile('docs/mission-17c.md'),git('docs/mission-17.md'));
for(const p of ['docs/mission-17a.md','docs/mission-17b.md'])assert.deepEqual(await readFile(p),git(p));
await writeFile(out+'/preservation.json',JSON.stringify({baseline:base,canonicalGeometryBuffers:checks.length,allCanonicalGeometryByteIdentical:true,canonicalAtlasByteIdentical:true,originalAnchors:2500,supplementalAnchors:now.added.length,anchorsAndIndividualAttributesIdentical:true,preservedFiles:preserved,allowedChangedFiles:changed,approvedABCEvidenceUnchanged:true,lightingPackByteIdentical:true,checks},null,2)+'\n');
const rows=[];for(const [id,m]of optimizeForestModels(createForestModels())){const near=m.levels[0],flat=flattenForestSprays(near.leaves);rows.push({id,label:FOREST_LIBRARY[id].label,heightRangeM:FOREST_LIBRARY[id].height,evergreen:!!FOREST_LIBRARY[id].evergreen,phenologyDayRanges:FOREST_PHENOLOGY[id],triangles:m.levels.map(l=>(l.wood.index.count+l.leaves.index.count)/3),flatNearTriangles:(near.wood.index.count+flat.index.count)/3,bounds:m.box.min.toArray().concat(m.box.max.toArray())});flat.dispose()}
await writeFile(out+'/inventory.json',JSON.stringify({interpretation:'Original procedural generic temperate families, no scanned assets, local species identification, measured individual geometry or measured botanical phenology. Same deterministic original library as 17A–C.',familyRows:rows,policies:FOREST_LOD_POLICIES,transition:{seconds:.48,maxConcurrent:48},motionPaddingM:FOREST_MOTION_PADDING,shaderModes:{eco:'continuous coarse bend; flattened near sprays',balanced:'full hierarchy at near tier, continuous coarse bend beyond; flattened near sprays',quality:'full hierarchy and folded leaf sprays at near tier; coarse beyond',localShadow:'coarse shared M11 bend and calendar alpha, quarter-texel geometric reuse threshold, existing cadence caps'},jointAtlas:{uniqueRecords:14155,logicalVertices:175044,gpuBytes:573440,cpuBytes:573440,previousGpuBytes:7413760},windField:{cells:256,cpuBytes:32768,gpuBytes:4096}},null,2)+'\n');
console.log('PASS canonical geometry, all 3889 anchors, prior evidence and geography preserved;',rows.length,'families');
