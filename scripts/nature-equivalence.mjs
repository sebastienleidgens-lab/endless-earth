import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {transpileModule} from 'typescript';import * as THREE from 'three';
await mkdir('work/061-equivalence',{recursive:true});
for(const version of ['initial','optimized']){
 for(const name of ['ecology','surfaces','atmosphere','render','terrain']){
  const file=name==='ecology'?`src/nature/${name}.mjs`:name==='atmosphere'?`src/living/${name}.ts`:name==='terrain'?`src/world/${name}.ts`:`src/nature/${name}.ts`;
  let code=version==='initial'?execFileSync('git',['show',`cf85270:${file}`],{encoding:'utf8'}):await readFile(file,'utf8');
  if(name!=='ecology')code=transpileModule(code,{compilerOptions:{target:9,module:99}}).outputText;
  code=code.replaceAll("'./ecology.mjs'",`'./${version}-ecology.mjs'`).replaceAll("'../living/atmosphere'",`'./${version}-atmosphere.mjs'`).replaceAll("'../nature/surfaces'",`'./${version}-surfaces.mjs'`);
  await writeFile(`work/061-equivalence/${version}-${name}.mjs`,code);
 }
}
const data=JSON.parse(await readFile('public/data/angles-osm.geojson','utf8')),grid=JSON.parse(await readFile('public/data/angles-terrain.json','utf8'));
const {Terrain}=await import('../work/061-equivalence/optimized-terrain.mjs'),terrain=new Terrain(grid),height=(x,z)=>terrain.relativeHeight(x,z);
const local=([lon,lat])=>({x:(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(lat-46.6953)*111320});
const features=data.features.map(f=>{const g=f.geometry,tags=f.properties??{};return {tags,...g.type==='Polygon'?{rings:g.coordinates.map(r=>r.map(local))}:g.type==='LineString'?{line:g.coordinates.map(local)}:g.type==='Point'?{point:local(g.coordinates)}:{}}});
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const outputs={};
for(const version of ['initial','optimized']){const e=await import(`../work/061-equivalence/${version}-ecology.mjs`),r=await import(`../work/061-equivalence/${version}-render.mjs`),world=new THREE.Group(),ecology=e.createEcology(features,height);r.addNature(world,features,height);const trees=world.children.filter(o=>o.userData.natureTreeCell),buffers=trees.map(o=>({cell:[o.userData.natureTreeCell.x,o.userData.natureTreeCell.z],matrix:o.children.map(m=>Array.from(m.instanceMatrix.array)),color:o.children[1].instanceColor?Array.from(o.children[1].instanceColor.array):null}));
 const geometry=trees[0].children.map(o=>({attributes:Object.fromEntries(Object.entries(o.geometry.attributes).map(([n,a])=>[n,Array.from(a.array)])),index:o.geometry.index?Array.from(o.geometry.index.array):null}));
 const cells=[[-4,2],[-4,3],[-3,2],[0,0],[2,-4],[-1,1]],recipes=cells.map(([x,z])=>e.detailRecipe(x,z,ecology));outputs[version]={trees:ecology.trees.length,placementHash:digest(ecology.trees),matrixAndColorHash:digest(buffers),nearGeometryHash:digest(geometry),recipeHash:digest(recipes),details:recipes.map(p=>p.length)};r.disposeNatureZone(world);
}
assert.deepEqual(outputs.optimized,outputs.initial);await mkdir('docs/mission-06-1',{recursive:true});await writeFile('docs/mission-06-1/ecology-equivalence.json',JSON.stringify({reference:'cf85270',dataHash:digest(data),terrainHash:digest(grid),cells:[[-4,2],[-4,3],[-3,2],[0,0],[2,-4],[-1,1]],outputs,passed:true},null,2));console.log('PASS identical placements, matrices, colors, near geometries and sampled detail recipes on real OSM/IGN');
