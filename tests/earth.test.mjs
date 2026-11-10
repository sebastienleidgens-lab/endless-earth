import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {transpileModule} from 'typescript';
import * as THREE from 'three';
import {sampleGrid,drapePolygon,clipLineToGrid} from '../src/world/terrain-grid.mjs';
import {coverAt,coverClass} from '../src/world/landcover.mjs';
import {prepare} from '../scripts/prepare-earth.mjs';
import {ruinHeight} from '../src/world/ruins.mjs';
import {createEcology} from '../src/nature/ecology.mjs';
await mkdir('work',{recursive:true});
for(const [source,out,replacements] of [
 ['src/world/road-material.ts','earth-road-material',[["'./road-texture.mjs'","'../src/world/road-texture.mjs'"]]],
 ['src/nature/surfaces.ts','earth-surfaces',[["'../world/road-material'","'./earth-road-material.mjs'"]]],
 ['src/world/terrain.ts','earth-terrain',[["'./environment.mjs'","'../src/world/environment.mjs'"],["'./road-material'","'./earth-road-material.mjs'"],["'../nature/surfaces'","'./earth-surfaces.mjs'"],["'./terrain-grid.mjs'","'../src/world/terrain-grid.mjs'"],["'./source-geometry.mjs'","'../src/world/source-geometry.mjs'"],["'./surface-mesh.mjs'","'../src/world/surface-mesh.mjs'"]]],
 ['src/world/geo.ts','earth-geo',[]]
]){let code=transpileModule(await readFile(source,'utf8'),{compilerOptions:{target:9,module:99}}).outputText;for(const [a,b] of replacements)code=code.replaceAll(a,b);await writeFile(`work/${out}.mjs`,code)}
const {Terrain,updateTerrainLOD}=await import('../work/earth-terrain.mjs');
const {toLocal,ANGLES}=await import('../work/earth-geo.mjs');
const g=JSON.parse(await readFile('public/data/angles-terrain.json','utf8'));
const m=JSON.parse(await readFile('public/data/angles-earth.json','utf8'));
const raw=await readFile('public/data/angles-terrain-lod.bin'),indices=new Uint16Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
const prepared=()=>{const t=new Terrain(g);t.prepared={manifest:m,indices};return t};
test('metric frame preserves orientation, original source positions and declared distance limits',()=>{
 const origin=toLocal(ANGLES);assert.ok(origin.x===0&&origin.z===0);
 const east=toLocal({lat:ANGLES.lat,lon:ANGLES.lon+1000/(111320*Math.cos(ANGLES.lat*Math.PI/180))});
 const north=toLocal({lat:ANGLES.lat+1000/111320,lon:ANGLES.lon});assert.ok(Math.abs(east.x-1000)<1e-8);assert.ok(Math.abs(north.z+1000)<1e-8);
 // Independent WGS84 meridian/prime-vertical scales quantify legacy projection error.
 const phi=ANGLES.lat*Math.PI/180,a=6378137,e2=6.69437999014e-3,q=1-e2*Math.sin(phi)**2;
 const ns=a*(1-e2)/q**1.5*Math.PI/180,ew=a/Math.sqrt(q)*Math.cos(phi)*Math.PI/180;
 assert.ok(Math.abs(ns/111320-1)<.002);assert.ok(Math.abs(ew/(111320*Math.cos(phi))-1)<.002);
});
test('rendered fine triangles and collision interpolation agree on cliffs and both diagonals',()=>{
 const terrain=new Terrain(g),mesh=terrain.createMesh().children[0],ray=new THREE.Raycaster();
 mesh.updateMatrixWorld();const baseline=sampleGrid(g,0,0);
 for(let i=0;i<120;i++){const x=-990+(i*173.271%1980),z=-990+(i*331.873%1980);ray.set(new THREE.Vector3(x,1000,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-(sampleGrid(g,x,z)-baseline))<.0001)}
 assert.equal(sampleGrid(g,1001,0),null);mesh.geometry.dispose();mesh.material.dispose();
});
test('road draping splits every source edge without lost area, buried corners or floating centres',()=>{
 const grid={origin_x_m:0,origin_z_m:0,step_m:10,width:3,height:3,elevations_m:[0,5,0,8,25,2,0,3,0]},p=[{x:1,z:3},{x:18,z:3},{x:18,z:16},{x:1,z:16}];
 const vertices=drapePolygon(p,grid);let area=0;
 for(let i=0;i<vertices.length;i+=9){const a={x:vertices[i],z:vertices[i+2]},b={x:vertices[i+3],z:vertices[i+5]},c={x:vertices[i+6],z:vertices[i+8]};area+=Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))/2;
  for(const [u,v] of [[0,0],[1,0],[0,1],[.25,.4],[1/3,1/3]]){const x=a.x+(b.x-a.x)*u+(c.x-a.x)*v,z=a.z+(b.z-a.z)*u+(c.z-a.z)*v,h=vertices[i+1]+(vertices[i+4]-vertices[i+1])*u+(vertices[i+7]-vertices[i+1])*v;assert.ok(Math.abs(h-sampleGrid(grid,x,z)-.045)<1e-6)}
 }assert.ok(Math.abs(area-17*13)<1e-6);
});
test('river lines crossing DEM bounds never receive the unsupported local-zero altitude',()=>{
 const grid={origin_x_m:-10,origin_z_m:-10,step_m:10,width:3,height:3,elevations_m:Array(9).fill(65)};
 assert.deepEqual(clipLineToGrid(grid,{x:-20,z:0},{x:20,z:0}),[{x:-10,z:0},{x:10,z:0}]);
 assert.equal(clipLineToGrid(grid,{x:-20,z:11},{x:20,z:11}),null);
 for(const a of [{x:0,z:0},{x:-40,z:-10},{x:30,z:30}])for(const b of [{x:0,z:0},{x:40,z:10},{x:20,z:-20}]){
  const clipped=clipLineToGrid(grid,a,b);if(clipped)for(const p of clipped)assert.equal(sampleGrid(grid,p.x,p.z),65);
 }
});
test('terrain tiles retain identical boundary positions/normals and every boundary vertex in far LOD',()=>{
 const t=prepared(),group=t.createMesh();assert.equal(group.children.length,25);
 const points=new Map();for(const mesh of group.children){const a=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,used=new Set(mesh.userData.earthTile.farIndex.array);
  for(let z=0;z<=m.tileCells;z++)for(let x=0;x<=m.tileCells;x++){if(x&&x!==m.tileCells&&z&&z!==m.tileCells)continue;const i=z*(m.tileCells+1)+x,key=`${a.getX(i)},${a.getZ(i)}`,v=[a.getY(i),n.getX(i),n.getY(i),n.getZ(i)];if(points.has(key))assert.deepEqual(v,points.get(key));else points.set(key,v);assert.ok(used.has(i))}
 }
});
test('unknown-only tiles omit atlas sampling while mapped habitat tiles retain it',()=>{
 const terrain=prepared();terrain.landcover=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1);
 const group=terrain.createMesh();let covered=0,bare=0;
 for(let i=0;i<group.children.length;i++){
  const material=group.children[i].material,shader={uniforms:{},vertexShader:THREE.ShaderLib.lambert.vertexShader,fragmentShader:THREE.ShaderLib.lambert.fragmentShader};
  material.onBeforeCompile(shader,{});
  if(m.tiles[i].cover){assert.ok(shader.uniforms.earthCover);covered++}else{assert.equal(shader.uniforms.earthCover,undefined);bare++}
 }assert.ok(covered>0);assert.equal(covered,m.tiles.filter(t=>t.cover).length);assert.equal(covered+bare,m.tiles.length);
});
test('all far triangles stay within their declared error throughout each intersected source plane',()=>{
 let max=0;
 for(const tile of m.tiles){const size=tile.size+1,p=id=>{const x=tile.x+id%size,z=tile.z+Math.floor(id/size);return {x:g.origin_x_m+x*g.step_m,z:g.origin_z_m+z*g.step_m}};
  for(let i=tile.offset;i<tile.offset+tile.count;i+=3){const [a,b,c]=[indices[i],indices[i+1],indices[i+2]].map(p),ha=sampleGrid(g,a.x,a.z),hb=sampleGrid(g,b.x,b.z),hc=sampleGrid(g,c.x,c.z);
   for(const [u,v] of [[.2,.2],[.1,.7],[.65,.3],[1/3,1/3]]){const x=a.x+(b.x-a.x)*u+(c.x-a.x)*v,z=a.z+(b.z-a.z)*u+(c.z-a.z)*v;max=Math.max(max,Math.abs(sampleGrid(g,x,z)-(ha+(hb-ha)*u+(hc-ha)*v)))}
  }
 }assert.ok(max<=m.maxFarErrorM+1e-7,`far error ${max}`);assert.ok(m.farTriangles<m.fineTriangles);
});
test('LOD keeps walking terrain exact, has hysteresis and reuses all buffers at rest and on return',()=>{
 const t=prepared(),group=t.createMesh(),mesh=group.children[12],tile=mesh.userData.earthTile,near={x:0,z:0};
 updateTerrainLOD(group,near,near);assert.equal(tile.far,false);
 const far={x:2000,z:2000};updateTerrainLOD(group,far,far);assert.equal(tile.far,true);assert.equal(mesh.geometry.index,tile.farIndex);
 updateTerrainLOD(group,{x:0,z:550},{x:0,z:550});assert.equal(tile.far,true);
 updateTerrainLOD(group,{x:0,z:500},{x:0,z:500});assert.equal(tile.far,false);
 updateTerrainLOD(group,near,near);const before=group.children.map(o=>[o.geometry,o.geometry.index]);for(let i=0;i<100;i++)updateTerrainLOD(group,near,near);assert.deepEqual(group.children.map(o=>[o.geometry,o.geometry.index]),before);
 // Player safety dominates an aerial camera: the source surface stays exact near feet.
 updateTerrainLOD(group,far,near);assert.equal(tile.far,false);
});
test('explicit land use respects clearings, water, agricultural semantics and unknown areas',()=>{
 const box=(a,b)=>[{x:a,z:a},{x:b,z:a},{x:b,z:b},{x:a,z:b}];
 const features=[{tags:{landuse:'forest'},rings:[box(0,100),box(20,40)]},{tags:{landuse:'farmland'},rings:[box(200,250)]}];
 assert.equal(coverAt(5,5,features),'wood');assert.equal(coverAt(30,30,features),null);assert.equal(coverAt(220,220,features),'farmland');assert.equal(coverAt(150,150,features),null);assert.equal(coverClass({natural:'water'}),null);
});
test('inferred ruin heights remain continuous, bounded and deterministic',()=>{
 for(let x=-200;x<200;x+=.5){const h=ruinHeight(x,150,true);assert.equal(h,ruinHeight(x,150,true));assert.ok(h>=4.2&&h<=9.4);assert.ok(Math.abs(h-ruinHeight(x+.5,150,true))<.1)}
});
test('forest leaf shapes use explicit OSM leaf_type while roots retain source terrain contact',()=>{
 const rings=[[{x:-300,z:-300},{x:300,z:-300},{x:300,z:300},{x:-300,z:300}]];
 const trees=tags=>createEcology([{tags:{landuse:'forest',...tags},rings}],(x,z)=>sampleGrid(g,x,z)).trees;
 const broad=trees({leaf_type:'broadleaved'}),mixed=trees({leaf_type:'mixed'}),unknown=trees({});
 assert.ok(broad.every(p=>p.leaf==='broad'));assert.ok(unknown.every(p=>p.leaf==='broad'));assert.ok(mixed.some(p=>p.leaf==='needle'));
 const placement=points=>points.map(({leaf,...p})=>p);assert.deepEqual(placement(broad),placement(mixed));
 for(const p of mixed)assert.equal(p.y,sampleGrid(g,p.x,p.z));
});
test('offline assets are byte deterministic and retain source provenance',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'endless-earth-'));try{
  for(const f of ['angles-terrain.json','angles-osm.geojson','angles-environment.json'])await copyFile(`public/data/${f}`,`${dir}/${f}`);
  await prepare(dir);for(const f of ['angles-earth.json','angles-terrain-lod.bin','angles-landcover.png'])assert.deepEqual(await readFile(`${dir}/${f}`),await readFile(`public/data/${f}`));
  assert.equal(m.cover.source.license,'ODbL 1.0');assert.ok(m.cover.counts.wood>0&&m.cover.counts.farmland>0&&m.cover.counts.meadow>0);assert.equal(m.cover.stepM,2);
 }finally{await rm(dir,{recursive:true,force:true})}
});
