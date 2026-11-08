import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';import {transpileModule} from 'typescript';import * as THREE from 'three';
import {buildingPlan} from '../src/architecture/plan.mjs';
await mkdir('work',{recursive:true});
const source=await readFile(new URL('../src/architecture/render.ts',import.meta.url),'utf8');
const compiled=transpileModule(source,{compilerOptions:{target:9,module:99}}).outputText.replaceAll("'./plan.mjs'","'../src/architecture/plan.mjs'").replaceAll("'./style.mjs'","'../src/architecture/style.mjs'");
await writeFile('work/architecture-render.mjs',compiled);
const {ArchitectureBatch,updateArchitectureLOD,architectureMemory}=await import('../work/architecture-render.mjs');
const outer=[{x:0,z:0},{x:12,z:0},{x:12,z:9},{x:5,z:9},{x:5,z:14},{x:0,z:14}];
function inside(x,z,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)yes=!yes}return yes}
function distance(x,z,ring){return Math.min(...ring.map((a,i)=>{const b=ring[(i+1)%ring.length],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz)}))}
test('actual meshes stay within mapped footprint, valid height and contain no degenerate triangles',()=>{
 for(const shape of ['gabled','flat','hipped','pyramidal']){
  const tags={height:'9','roof:shape':shape,osm_id:51},p=buildingPlan(outer,tags),scene=new THREE.Group(),batch=new ArchitectureBatch(scene);batch.add(outer,tags,new Set(),()=>0);const stats=batch.finish();updateArchitectureLOD(scene,new THREE.PerspectiveCamera());assert.equal(stats.buildings,1);
  scene.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,n=o.geometry.attributes.normal;
   for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);assert.ok(Number.isFinite(x+y+z+n.getX(i)+n.getY(i)+n.getZ(i)));assert.ok(y>=p.base-1e-6&&y<=p.top+1e-6,`${shape}: height ${y}`);assert.ok(inside(x,z,outer)||distance(x,z,outer)<1e-5,`${shape}: outside ${x},${z}`)}
   const triangles=o.geometry.toNonIndexed().attributes.position;for(let i=0;i<triangles.count;i+=3){const x=new THREE.Vector3().fromBufferAttribute(triangles,i),y=new THREE.Vector3().fromBufferAttribute(triangles,i+1),z=new THREE.Vector3().fromBufferAttribute(triangles,i+2);assert.ok(y.sub(x).cross(z.sub(x)).length()>1e-9)}
  });
 }
});
test('roof triangles preserve concavities and courtyard holes, including their centroids',()=>{
 const ring=[{x:0,z:0},{x:14,z:0},{x:14,z:14},{x:0,z:14}],hole=[{x:5,z:5},{x:9,z:5},{x:9,z:9},{x:5,z:9}],scene=new THREE.Group(),b=new ArchitectureBatch(scene);b.add(ring,{},new Set(),()=>0,[hole]);b.finish();
 const roofMesh=scene.children.find(o=>o.name==='architecture-roof');const roof=roofMesh.geometry.toNonIndexed().attributes.position;
 for(let i=0;i<roof.count;i+=3){const x=(roof.getX(i)+roof.getX(i+1)+roof.getX(i+2))/3,z=(roof.getZ(i)+roof.getZ(i+1)+roof.getZ(i+2))/3;assert.ok(!inside(x,z,hole),'no roof crosses courtyard')}
});
test('LOD updates reuse geometry, materials and anchors; no reconstruction or collision mutation',()=>{
 const scene=new THREE.Group(),b=new ArchitectureBatch(scene);b.add(outer,{},new Set(),()=>0);b.finish();updateArchitectureLOD(scene,new THREE.PerspectiveCamera());const ids=scene.children.filter(o=>o.isMesh).map(o=>o.geometry.uuid),stats={...scene.userData.architecture},camera=new THREE.PerspectiveCamera();
 camera.position.set(1000,20,1000);updateArchitectureLOD(scene,camera,true);assert.ok(scene.children.filter(o=>o.userData.architectureDetail).every(o=>!o.visible));
 camera.position.set(5,2,5);for(let i=0;i<100;i++)updateArchitectureLOD(scene,camera,false);assert.ok(scene.children.filter(o=>o.userData.architectureDetail).every(o=>o.visible));assert.deepEqual(scene.children.filter(o=>o.isMesh).map(o=>o.geometry.uuid),ids);assert.deepEqual(scene.userData.architecture,stats);
});
test('real OSM corpus has no decorative vertices outside its existing collision footprints',async()=>{
 const data=JSON.parse(await readFile('public/data/angles-osm.geojson','utf8'));let tested=0;
 for(const f of data.features){if(!f.properties?.building||f.properties.historic==='castle'||f.properties.historic==='ruins'||f.geometry?.type!=='Polygon')continue;
  const rings=f.geometry.coordinates.map(r=>r.slice(0,-1).map(([x,z])=>({x:(x-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:(46.6953-z)*111320}))),ring=rings[0],scene=new THREE.Group(),b=new ArchitectureBatch(scene);b.add(ring,f.properties,new Set(),()=>0,rings.slice(1));const stats=b.finish();if(!stats.buildings)continue;tested++;const camera=new THREE.PerspectiveCamera();camera.position.set(ring[0].x,2,ring[0].z);updateArchitectureLOD(scene,camera);
  scene.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);assert.ok(inside(x,z,ring)||distance(x,z,ring)<.0002,`OSM ${f.properties.osm_id}: ${o.name} outside (${x},${z})`)}o.geometry.dispose()});
 }
 assert.ok(tested>900);console.log(`Validated decoration envelopes for ${tested} actual OSM buildings`);
});

test('tiny mapped footprints retain a visible volume without projecting recessed details outside',()=>{
 const ring=[{x:0,z:0},{x:5,z:0},{x:5,z:.1},{x:0,z:.1}],scene=new THREE.Group(),b=new ArchitectureBatch(scene);b.add(ring,{building:'shed'},new Set(),()=>0);const stats=b.finish();assert.equal(stats.buildings,1);assert.equal(stats.openings,0);assert.ok(stats.triangles>0);assert.ok(scene.children.some(o=>o.name==='architecture-shell'||o.name==='architecture-render'));
});

test('far details allocate no buffers, near details build once and hidden cache is bounded',()=>{
 const scene=new THREE.Group(),b=new ArchitectureBatch(scene);for(let i=0;i<18;i++)b.add(outer.map(p=>({x:p.x+i*1000,z:p.z})),{osm_id:i},new Set(),()=>0);b.finish();const initial=architectureMemory(scene);assert.equal(initial.detailCells,0);const camera=new THREE.PerspectiveCamera();for(let i=0;i<18;i++){camera.position.set(i*1000,2,0);updateArchitectureLOD(scene,camera);}const after=architectureMemory(scene);assert.ok(after.detailCells<=13);assert.ok(after.evictions>0);const count=after.detailBuilds;for(let i=0;i<100;i++)updateArchitectureLOD(scene,camera);assert.equal(architectureMemory(scene).detailBuilds,count);assert.ok(after.bytes>initial.bytes);
});
