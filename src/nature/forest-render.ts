import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// @ts-ignore Original deterministic metric library.
import {createForestModels,forestAtlas,FOREST_VERSION,FOREST_LIBRARY,forestLayout,forestIdentity} from './forest-model.mjs';
// @ts-ignore Same predicates for offline and runtime fallback.
import {planForest,forestHabitat} from './forest-world.mjs';
// @ts-ignore Convert the shared wind to each instance's rotated/scaled frame.
import {windToInstance} from '../earthlife/wind.mjs';
import {forestMaterial} from './forest-material';
type Resource={geometries:THREE.BufferGeometry[];materials:THREE.Material[]};
export function addForest(scene:THREE.Object3D,anchors:any[],features:any[],height:(x:number,z:number)=>number|null,calendar:{value:THREE.Vector4},resources:Resource,prepared?:any){
 const models=createForestModels(),geo=forestHabitat(features,height),params=typeof location==='undefined'?null:new URLSearchParams(location.search),infill=params?.has('perf')?params.get('forestDensity')!=='crowns':true;
 let plan:any;
 if(prepared?.forest&&infill){const trees=[...anchors,...prepared.forest.added];
  // A source-bound file stores extra anchors only. Clearances/forms are the
  // same pure library contract used by the preparation and fallback.
  plan={...planForest(anchors,features,height,models,{infill:false}),trees,stats:prepared.forest.stats};
  plan.layouts=trees.map((p:any)=>forestLayout(p,geo.context(p),models));
 }else plan=planForest(anchors,features,height,models,{infill});
 const pixels=forestAtlas(),atlas=new THREE.DataTexture(pixels.data,pixels.width,pixels.height);atlas.name='Original branch-rooted temperate spray atlas';atlas.generateMipmaps=true;atlas.minFilter=THREE.LinearMipmapLinearFilter;atlas.magFilter=THREE.LinearFilter;atlas.needsUpdate=true;scene.userData.natureLeafTexture=atlas;
 const nearWood=forestMaterial(calendar,null),nearLeaves=forestMaterial(calendar,atlas),farWood=forestMaterial(calendar,null,true),farLeaves=forestMaterial(calendar,atlas,true);resources.materials.push(nearWood,nearLeaves,farWood,farLeaves);
 const family=new Map<string,any[]>(),matrix=new THREE.Matrix4(),object=new THREE.Object3D();scene.updateWorldMatrix(true,false);
 const items=plan.trees.map((p:any,i:number)=>{const l=plan.layouts[i],m=models.get(l.id);object.position.set(p.x,p.y,p.z);object.rotation.set(0,l.yaw,l.lean);object.scale.fromArray(l.scale);object.updateMatrix();matrix.multiplyMatrices(scene.matrixWorld,object.matrix);
  const x=new THREE.Vector3().setFromMatrixColumn(matrix,0),z=new THREE.Vector3().setFromMatrixColumn(matrix,2),east=windToInstance({x:1,z:0},x,z),south=windToInstance({x:0,z:1},x,z),bound=m.box.clone().applyMatrix4(matrix).getBoundingSphere(new THREE.Sphere()),center=bound.center,radius=bound.radius+1.5;
  const row={p,l,model:m,matrix:object.matrix.clone(),worldMatrix:matrix.clone(),center,radius,traits:[l.phase,l.age,Number(l.evergreen),l.density],form:l.form,basis:[east.x,south.x,east.z,south.z],anchor:[matrix.elements[12],matrix.elements[14]],color:new THREE.Color().setRGB(.90+l.age*.16,.92+l.phase*.12,.91+l.age*.10),lod:2};if(!family.has(l.id))family.set(l.id,[]);family.get(l.id)!.push(row);return row});
 const batches:any[]=[];
 for(const [id,points]of family){const model=models.get(id),group=new THREE.Group();group.name='forest-family-'+id;group.userData.forestFamily=id;scene.add(group);
  for(let lod=0;lod<3;lod++)for(const part of ['wood','leaves']){
   const source=model.levels[lod][part],g=new THREE.BufferGeometry();g.name=source.name;for(const [name,a]of Object.entries(source.attributes))g.setAttribute(name,a as THREE.BufferAttribute);g.setIndex(source.index);g.boundingSphere=source.boundingSphere.clone();g.boundingBox=source.boundingBox.clone();
   const trait=new THREE.InstancedBufferAttribute(new Float32Array(points.length*4),4),basis=new THREE.InstancedBufferAttribute(new Float32Array(points.length*4),4),anchor=new THREE.InstancedBufferAttribute(new Float32Array(points.length*2),2);const form=new THREE.InstancedBufferAttribute(new Float32Array(points.length*4),4);g.setAttribute('forestForm',form);g.setAttribute('natureTraits',trait);g.setAttribute('lifeBasis',basis);g.setAttribute('lifeAnchor',anchor);
   const material=part==='wood'?(lod===2?farWood:nearWood):(lod===2?farLeaves:nearLeaves),mesh=new THREE.InstancedMesh(g,material,points.length);mesh.name=source.name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;group.add(mesh);resources.geometries.push(g);batches.push({id,lod,part,mesh,points,trait,basis,anchor,form});
  }
  for(const level of model.levels)resources.geometries.push(level.wood,level.leaves);
 }
 // Far silhouette proxies are shared by the bounded Mission 14 solar owner.
 const proxies=new Map<string,THREE.BufferGeometry>();
 const casterGroups=()=>{const groups=[];for(const [id,points]of family){let source=proxies.get(id);if(!source){const l=models.get(id).levels[2];source=mergeGeometries([l.wood,l.leaves])!;source.name='forest-solar-'+id;proxies.set(id,source);resources.geometries.push(source)}groups.push({source,forest:true,atlas,trees:points.map(p=>({matrix:p.worldMatrix,x:p.anchor[0],z:p.anchor[1],traits:p.traits,form:p.form,basis:p.basis,anchor:p.anchor}))})}return groups};
 const stats=scene.userData.forest={version:FOREST_VERSION,...plan.stats,forms:Object.keys(FOREST_LIBRARY),visible:0,levels:[0,0,0],submittedTriangles:0,selectionUpdates:0,selectionCpuMs:0,maxSelectionCpuMs:0,source:prepared?.forest?'source-bound prepared infill':'deterministic runtime fallback',items,models,atlas,casterGroups,trees:plan.trees};
 const lastPosition=new THREE.Vector3(Infinity,0,0),lastQuaternion=new THREE.Quaternion(),frustum=new THREE.Frustum(),clip=new THREE.Matrix4(),sphere=new THREE.Sphere();let lastProfile='',lastFov=-1,lastAspect=-1;
 scene.userData.updateForest=(camera:THREE.Camera,profile:string,force=false)=>{
  const perspective=camera as THREE.PerspectiveCamera;
  if(!force&&lastProfile===profile&&lastPosition.distanceToSquared(camera.position)<1.6&&Math.abs(lastQuaternion.dot(camera.quaternion))>.9998&&lastFov===perspective.fov&&lastAspect===perspective.aspect)return;
  const start=performance.now();camera.updateMatrixWorld();clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(clip);const limits=profile==='eco'?[17,90]:profile==='quality'?[48,190]:[32,140],counts=[0,0,0];
  for(const p of items){const d=camera.position.distanceTo(p.center)-p.radius,range=Math.hypot(camera.position.x-p.center.x,camera.position.z-p.center.z);sphere.center.copy(p.center);sphere.radius=p.radius;
   p.visible=range<1050+p.radius&&frustum.intersectsSphere(sphere);if(!p.visible)continue;
   const near=limits[0]+(p.lod===0?7:0),middle=limits[1]+(p.lod===1?14:0);p.lod=d<near?0:d<middle?1:2;counts[p.lod]++;
  }
  let triangles=0;for(const b of batches){let n=0;for(const p of b.points){if(!p.visible||p.lod!==b.lod)continue;b.mesh.setMatrixAt(n,p.matrix);b.mesh.setColorAt(n,p.color);b.trait.array.set(p.traits,n*4);b.form.array.set(p.form,n*4);b.basis.array.set(p.basis,n*4);b.anchor.array.set(p.anchor,n*2);n++}b.mesh.count=n;b.mesh.visible=n>0;if(n){b.mesh.instanceMatrix.needsUpdate=true;b.mesh.instanceColor!.needsUpdate=true;b.form.needsUpdate=b.trait.needsUpdate=b.basis.needsUpdate=b.anchor.needsUpdate=true;triangles+=n*b.mesh.geometry.index!.count/3}}
  stats.visible=counts.reduce((a,b)=>a+b,0);stats.levels=counts;stats.submittedTriangles=triangles;stats.selectionUpdates++;stats.selectionCpuMs=performance.now()-start;stats.maxSelectionCpuMs=Math.max(stats.maxSelectionCpuMs,stats.selectionCpuMs);lastPosition.copy(camera.position);lastQuaternion.copy(camera.quaternion);lastProfile=profile;lastFov=perspective.fov;lastAspect=perspective.aspect;
 };
 scene.userData.natureArt={version:FOREST_VERSION,approach:'branch-rooted folded sprays',texture:[pixels.width,pixels.height],inferredIndividuals:plan.trees.filter((p:any)=>!p.mapped).length,trimmedCrowns:0,alternativeForms:plan.layouts.filter((l:any,i:number)=>l.id!==forestIdentity(plan.trees[i],geo.context(plan.trees[i])).id).length};
 return plan.trees;
}
