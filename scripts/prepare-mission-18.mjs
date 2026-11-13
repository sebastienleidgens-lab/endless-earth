// Rebuild appearance only; retain the licensed rock tile and all mapped fields.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {makeGroundAtlas,ART_METRES} from '../src/world/surface-art.mjs';
import {png} from './prepare-earth.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),base='bad03f5e07a72496e26c62427fa43f800a97471f';
const original=execFileSync('git',['show',base+':public/materials/earth/surface-atlas.png'],{maxBuffer:4e6}),chunks=[];
for(let at=8;at<original.length;){const n=original.readUInt32BE(at),type=original.toString('ascii',at+4,at+8);if(type==='IDAT')chunks.push(original.subarray(at+8,at+8+n));at+=n+12}
assert.equal(original.readUInt32BE(16),576);assert.equal(original.readUInt32BE(20),576);
const scan=inflateSync(Buffer.concat(chunks)),atlas=makeGroundAtlas();
for(let y=0;y<576;y++){assert.equal(scan[y*(576*4+1)],0,'source PNG uses the documented unfiltered encoder');if(y>=288)for(let x=288;x<576;x++)atlas.data.set(scan.subarray(y*(576*4+1)+1+x*4,y*(576*4+1)+1+x*4+4),(y*576+x)*4)}
const bytes=png(576,576,atlas.data),root='public/materials/earth/',m=JSON.parse(await readFile(root+'surface-art.json')),catalog=JSON.parse(await readFile(root+'catalog.json'));
m.hashes.atlas=sha(bytes);m.bytes.atlas=bytes.length;m.interpretation.finish='Mission 18: jittered metric grass fibres, leaf relief, fixed world rotation, seasonal tint and shared rainfall wetness. Existing licensed rock pixels retained exactly.';
catalog.checked='2026-11-13';catalog.atlas.sha256=sha(bytes);catalog.families.forEach((f,i)=>f.metres=ART_METRES[i]);catalog.usage='Shared ground and river-bank material; one existing atlas, no geometry displacement. Month/date and rainfall come from the Mission 11 owner.';
await writeFile(root+'surface-atlas.png',bytes);await writeFile(root+'surface-art.json',JSON.stringify(m,null,2)+'\n');await writeFile(root+'catalog.json',JSON.stringify(catalog,null,2)+'\n');
for(const p of ['public/data/angles-decorations/manifest.json','public/data/angles-relief-decorations/manifest.json']){const d=JSON.parse(await readFile(p));for(const file of ['src/nature/render.ts','src/nature/material.ts'])d.runtimeTransforms.generators[file]=sha(await readFile(file));d.runtimeTransforms.appearanceCalendar='Mission 18: shared calendar phenology and ground-detail visibility only. All stored positions, source classes, tree anchors and chunk checksums retained.';await writeFile(p,JSON.stringify(d)+'\n')}
await mkdir('docs/mission-18-evidence',{recursive:true});
await writeFile('docs/mission-18-evidence/atlas.json',JSON.stringify({base,atlasSha256:sha(bytes),bytes:bytes.length,dimensions:[576,576],extraTextures:0,rockTilePreserved:true,habitatFieldUnchanged:true,metres:ART_METRES},null,2)+'\n');
console.log('Rebuilt shared atlas:',bytes.length,'bytes; licensed rock retained.');
