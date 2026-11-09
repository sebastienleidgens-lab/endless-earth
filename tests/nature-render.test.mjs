import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {transpileModule} from 'typescript';import * as THREE from 'three';
await mkdir('work',{recursive:true});
for(const [file,replacements] of [['road-material',[["'./road-texture.mjs'","'../src/world/road-texture.mjs'"]]],['surfaces',[["'../world/road-material'","'./road-material.mjs'"]]],['foliage',[["'../nature/surfaces'","'./surfaces.mjs'"]]],['nature-render',[["'./ecology.mjs'","'../src/nature/ecology.mjs'"],["'../living/atmosphere'","'./foliage.mjs'"]]]]){
 const path=file==='road-material'?'src/world/road-material.ts':file==='foliage'?'src/living/atmosphere.ts':file==='nature-render'?'src/nature/render.ts':'src/nature/surfaces.ts';let compiled=transpileModule(await readFile(path,'utf8'),{compilerOptions:{target:9,module:99}}).outputText;for(const [a,b] of replacements)compiled=compiled.replaceAll(a,b);await writeFile(`work/${file}.mjs`,compiled);
}
const {addNature,updateNatureLOD,disposeNatureZone}=await import('../work/nature-render.mjs');
const features=[{tags:{natural:'wood'},rings:[[{x:-500,z:-500},{x:500,z:-500},{x:500,z:500},{x:-500,z:500}]]}];
test('nature detail buffers build once at rest, remain hysteretic and evict with a bounded cache',()=>{const g=new THREE.Group(),camera=new THREE.PerspectiveCamera();addNature(g,features,()=>0);camera.position.set(64,2,64);for(let i=0;i<80;i++)updateNatureLOD(g,camera);const ids=[];g.traverse(o=>{if(o.geometry)ids.push(o.geometry.uuid)});for(let i=0;i<20;i++)updateNatureLOD(g,camera);const later=[];g.traverse(o=>{if(o.geometry)later.push(o.geometry.uuid)});assert.deepEqual(ids,later);for(let x=-450;x<500;x+=128){camera.position.set(x,2,0);for(let i=0;i<80;i++)updateNatureLOD(g,camera)}let hidden=0;g.traverse(o=>{const c=o.userData.natureCell;if(c?.detail&&!c.detail.visible)hidden++});assert.ok(hidden<=4);disposeNatureZone(g)});
test('zone unload disposes each unique geometry and owned material once, releases recipes',()=>{const g=new THREE.Group(),camera=new THREE.PerspectiveCamera();addNature(g,features,()=>0);updateNatureLOD(g,camera);const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.userData.natureResources){for(const g of o.userData.natureResources.geometries)geometries.add(g);for(const m of o.userData.natureResources.materials)materials.add(m)}if(o.geometry){geometries.add(o.geometry);materials.add(o.material)}});let disposed=0,disposedMaterials=0;for(const geom of geometries)geom.addEventListener('dispose',()=>disposed++);for(const mat of materials)mat.addEventListener('dispose',()=>disposedMaterials++);disposeNatureZone(g);assert.equal(disposed,geometries.size);assert.equal(disposedMaterials,materials.size);assert.equal(g.children.length,0);assert.deepEqual(g.userData,{})});

test('tree culling bounds contain all instanced vertices; far LOD is shared and hysteretic',()=>{
 const g=new THREE.Group(),camera=new THREE.PerspectiveCamera();addNature(g,features,()=>0);
 const cell=g.children.find(o=>o.userData.natureTreeCell),crowns=cell.children[1],tree=cell.userData.natureTreeCell;
 assert.ok(crowns.frustumCulled);assert.ok(crowns.boundingSphere.radius>0);
 const matrix=new THREE.Matrix4(),v=new THREE.Vector3(),a=tree.nearGeometry.attributes.position;
 for(let i=0;i<crowns.count;i++){crowns.getMatrixAt(i,matrix);for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).applyMatrix4(matrix);assert.ok(crowns.boundingSphere.containsPoint(v),'wind-padded bound includes each crown')}}
 const center=crowns.boundingSphere.center,edge=crowns.boundingSphere.radius;
 camera.position.copy(center).add(new THREE.Vector3(edge+360,0,0));updateNatureLOD(g,camera);assert.equal(tree.lod,'near');
 camera.position.copy(center).add(new THREE.Vector3(edge+395,0,0));updateNatureLOD(g,camera);assert.equal(tree.lod,'far');assert.ok(crowns.geometry.attributes.position.count<tree.nearGeometry.attributes.position.count);
 camera.position.copy(center).add(new THREE.Vector3(edge+365,0,0));updateNatureLOD(g,camera);assert.equal(tree.lod,'far');
 camera.position.copy(center).add(new THREE.Vector3(edge+340,0,0));updateNatureLOD(g,camera);assert.equal(tree.lod,'near');disposeNatureZone(g);
});
test('detail recipes progress in bounded slices and cancel when a cell leaves range',()=>{
 const g=new THREE.Group(),camera=new THREE.PerspectiveCamera();addNature(g,features,()=>0);camera.position.set(64,2,64);updateNatureLOD(g,camera);
 const c=g.children.find(o=>o.userData.natureCell?.pending)?.userData.natureCell;assert.ok(c);assert.equal(c.pending.cursor,256);assert.equal(c.builds,0);camera.position.set(3000,10,3000);updateNatureLOD(g,camera);assert.equal(c.pending,null);assert.equal(c.builds,0);disposeNatureZone(g);
});
