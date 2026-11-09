// CPU-only, actual nature generation and cell preparation; no GPU/FPS inference.
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {transpileModule} from 'typescript';
import * as THREE from 'three';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
const root='work/mission07/cpu';await mkdir(root,{recursive:true});
const reference='cc7cf2c';
const old=path=>execFileSync('git',['show',`${reference}:${path}`],{encoding:'utf8'});
const compile=async(text,name,replacements)=>{let js=transpileModule(text,{compilerOptions:{target:9,module:99}}).outputText;for(const [a,b] of replacements)js=js.replaceAll(a,b);await writeFile(`${root}/${name}.mjs`,js)};
await writeFile(`${root}/reference-ecology.mjs`,old('src/nature/ecology.mjs'));
await compile(await readFile('src/nature/surfaces.ts','utf8'),'surfaces',[]);
await compile(await readFile('src/living/atmosphere.ts','utf8'),'foliage',[["'../nature/surfaces'","'./surfaces.mjs'"]]);
await compile(old('src/nature/render.ts'),'before',[["'./ecology.mjs'","'./reference-ecology.mjs'"],["'../living/atmosphere'","'./foliage.mjs'"]]);
await compile(await readFile('src/nature/render.ts','utf8'),'after',[["'./ecology.mjs'","'../../../src/nature/ecology.mjs'"],["'../living/atmosphere'","'./foliage.mjs'"]]);
const g=JSON.parse(await readFile('public/data/angles-terrain.json','utf8')),data=JSON.parse(await readFile('public/data/angles-osm.geojson','utf8'));
const local=([lon,lat])=>({x:(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(lat-46.6953)*111320});
const features=data.features.map(f=>{const t=f.properties??{},a=f.geometry?.coordinates;return f.geometry?.type==='Polygon'?{tags:t,rings:a.map(r=>r.map(local))}:f.geometry?.type==='LineString'?{tags:t,line:a.map(local)}:f.geometry?.type==='Point'?{tags:t,point:local(a)}:{tags:t}});
const height=(x,z)=>{const h=sampleGrid(g,x,z);return h===null?null:h-sampleGrid(g,0,0)};
const result={node:process.version,protocol:'Node CPU, before then after, three generations; 80 near-cell LOD updates per generation at (-430,340); buffers counted when builds increases. No rendering.',before:[],after:[]};
for(const phase of ['before','after']){
 const module=await import(`../${root}/${phase}.mjs`);
 for(let run=0;run<3;run++){
  const group=new THREE.Group(),camera=new THREE.PerspectiveCamera();camera.position.set(-430,2,340);
  const start=performance.now();const trees=module.addNature(group,features,height);const generationMs=performance.now()-start,slices=[],buffers=[];
  for(let i=0;i<80;i++){
   const before=module.natureMemory(group),t=performance.now();module.updateNatureLOD(group,camera,false);const ms=performance.now()-t,after=module.natureMemory(group);
   if(after.builds>before.builds)buffers.push(ms);else if(after.pending||before.pending)slices.push(ms);
  }
  result[phase].push({generationMs,trees:trees.length,cells:module.natureMemory(group),recipeSliceAndLodMs:slices,finalBufferAndLodMs:buffers});module.disposeNatureZone(group);
 }
}
await writeFile('docs/mission-07-captures/nature-cpu.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(['before','after'].map(p=>[p,result[p].map(r=>({generationMs:r.generationMs,bufferMaxMs:Math.max(...r.finalBufferAndLodMs),sliceMaxMs:Math.max(...r.recipeSliceAndLodMs)}))])),null,2));
