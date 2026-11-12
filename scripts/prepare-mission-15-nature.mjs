import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {bakeLocalLighting} from './lib/bake-local-lighting.mjs';
import {launch,openGame,settle,views} from './lib/mission-15-browser.mjs';
import {CANOPY_VERSION} from '../src/nature/canopy.mjs';
const out='docs/mission-15-evidence',scratch='work/mission15',base='public/data/',hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});await mkdir(scratch,{recursive:true});
const generators=Object.fromEntries(await Promise.all(['src/nature/canopy.mjs','src/nature/tree-geometry.mjs','src/nature/render.ts','src/nature/clearance.mjs'].map(async file=>[file,hash(await readFile(file))])));
if(!process.argv.includes('--from-export')){
 const b=await launch();try{const g=await openGame(b,5173,{query:'&lighting=off'});await g.page.evaluate(v=>window.m15.setup(v),views[0]);await settle(g.page);const source=await g.page.evaluate(()=>window.m15.export());assert.deepEqual(g.errors,[]);await writeFile(scratch+'/render-source.json.gz',gzipSync(JSON.stringify(source),{level:9,mtime:0}));await writeFile(scratch+'/render-source-bindings.json',JSON.stringify(generators));console.log('Exported',source.meshes.length,'static meshes and',source.trees.length,'new crown bounds')}finally{await b.close()}
}
assert.deepEqual(JSON.parse(await readFile(scratch+'/render-source-bindings.json')),generators,'Re-export after changing canopy generators');
const started=performance.now(),source=JSON.parse(gunzipSync(await readFile(scratch+'/render-source.json.gz'))),m=JSON.parse(await readFile(base+'angles-relief-decorations/manifest.json')),surface=JSON.parse(await readFile(base+'angles-landmark-surface.json'));
const bindings={terrain:hash(await readFile(base+'angles-terrain.json')),osm:hash(await readFile(base+'angles-osm.geojson')),refinement:hash(await readFile(base+'angles-relief.json')),landmarks:hash(await readFile(base+'angles-landmarks.json')),surface:surface.binarySha256,static:m.static.sha256,trees:hash(JSON.stringify(m.trees)),canopy:CANOPY_VERSION};
const result=bakeLocalLighting(source,m.trees,bindings,'Exact Mission 14 merged static geometry, unchanged in 15A; new generous crown bounds with masonry clearance. Water excluded.');
await writeFile(base+'angles-lighting.json',JSON.stringify(result.manifest)+'\n');await writeFile(base+'angles-lighting.pack',result.packed);
// Detail packs, windows, architecture and anchor data are unchanged. Their
// generator fingerprints are refreshed after the independently owned canopy
// and runtime flower builders change. No pack is blindly regenerated.
for(const name of ['angles-decorations','angles-relief-decorations']){
 const file=base+name+'/manifest.json',j=JSON.parse(await readFile(file));
 for(const f of Object.keys(j.generators))j.generators[f]=hash(await readFile(f));
 await writeFile(file,JSON.stringify(j));
}
await writeFile(out+'/preparation.json',JSON.stringify({canopy:CANOPY_VERSION,stats:result.stats,seconds:(performance.now()-started)/1000,binarySha256:result.manifest.binarySha256,packSha256:hash(result.packed),sourceSha256:hash(JSON.stringify(source)),treeAnchors:source.trees.length,budgetEUR:0},null,2)+'\n');
console.log('Prepared 15A canopy lighting',result.stats);
