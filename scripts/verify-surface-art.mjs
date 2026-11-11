import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
const base='83d9258587177593bc3debd681544d7704a68882',out='docs/mission-12-evidence';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024});
const changed=git('diff','--name-only',base).trim().split('\n').filter(Boolean);
const protectedChanges=changed.filter(p=>p.startsWith('.github/')||p.startsWith('src/audio/')||p.startsWith('src/architecture/')||p.startsWith('src/living/')||p==='src/main.ts'||/living.?paintings|lp-01/i.test(p)||p.startsWith('public/data/')&&!['public/data/LICENSE.md','public/data/angles-decorations/manifest.json'].includes(p));
assert.deepEqual(protectedChanges,[]);
const old=JSON.parse(git('show',base+':public/data/angles-decorations/manifest.json')),current=JSON.parse(await readFile('public/data/angles-decorations/manifest.json'));
const generatorChanges=Object.keys(old.generators).filter(k=>old.generators[k]!==current.generators[k]);assert.deepEqual(generatorChanges,['src/nature/render.ts']);
const oldWithout={...old},currentWithout={...current};delete oldWithout.generators;delete currentWithout.generators;assert.deepEqual(currentWithout,oldWithout);
const oldNature=git('show',base+':src/nature/render.ts'),currentNature=await readFile('src/nature/render.ts','utf8');
assert.equal(currentNature.split('export function disposeNatureZone')[0],oldNature.split('export function disposeNatureZone')[0]);
const files={};for(const file of ['angles-terrain.json','angles-osm.geojson','angles-environment.json','angles-surface.json','angles-surface.pack','angles-road-edge.json','angles-road-edge.pack']){const bytes=await readFile('public/data/'+file);files[file]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}}
const before=JSON.parse(await readFile(out+'/before.json')),after=JSON.parse(await readFile(out+'/after.json'));
assert.deepEqual(before.environment.resolution,after.environment.resolution);assert.equal(before.results.length,8);assert.equal(after.results.length,8);
for(let i=0;i<8;i++){const a=before.results[i],b=after.results[i];assert.deepEqual(a.station,b.station);assert.deepEqual(a.state.matrix,b.state.matrix);assert.equal(a.state.climate.date,b.state.climate.date);assert.deepEqual(a.state.climate.weather,b.state.climate.weather);assert.equal(a.state.life.profile,b.state.life.profile);assert.equal(b.state.terrain.surface,'integrated')}
const performance=JSON.parse(gunzipSync(await readFile(out+'/performance.json.gz')).toString());assert.equal(performance.rows.length,72);assert.deepEqual(performance.errors,[]);
for(const r of performance.rows){assert.equal(r.samples.length,4);const other=performance.rows.find(x=>x.phase!==r.phase&&x.profile===r.profile&&x.station===r.station&&x.pass===r.pass);assert.deepEqual(r.state.camera,other.state.camera);assert.deepEqual(r.state.position,other.state.position);for(let i=0;i<4;i++){assert.equal(r.samples[i].calls,other.samples[i].calls);assert.equal(r.samples[i].triangles,other.samples[i].triangles)}}
const runtime=JSON.parse(await readFile(out+'/runtime.json'));assert.deepEqual(runtime.errors,[]);assert.equal(runtime.results.profileWeatherCycles.length,18);assert.equal(runtime.results.lifetime.length,6);
await writeFile(out+'/preservation.json',JSON.stringify({base,sourceFiles:files,protectedChanges,generatorChanges,decorationDataIdentical:true,natureGenerationAndTreeRenderingIdentical:true,pairedCaptureConditions:8,pairedPerformanceFrames:144,method:'Git comparison to the verified merged Mission 11. All geographic source/partition/edge/chunk files unchanged. Decoration manifest regenerated; only teardown-source hash differs, all trees, anchors, metadata and chunk checksums identical. Nature generator/rendering prefix identical; texture teardown is the only nature-render change. 144 paired actual GL submissions retain the same cameras, calls and triangles.'},null,2));
console.log('PASS 8 exact capture conditions, 144 paired render inventories, source/decoration/navigation/audio/architecture/workflow preservation');
