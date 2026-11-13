import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// @ts-ignore Original deterministic metric library.
import {createForestModels,forestAtlas,FOREST_VERSION,FOREST_LIBRARY,forestLayout,forestIdentity} from './forest-model.mjs';
// @ts-ignore Same predicates for offline and runtime fallback.
import {planForest,forestHabitat} from './forest-world.mjs';
// @ts-ignore Convert the shared wind to each instance's rotated/scaled frame.
import {windToInstance} from '../earthlife/wind.mjs';
// @ts-ignore Bounded projected detail and complementary screen-space transitions.
import {optimizeForestModels,flattenForestSprays,forestDetail,forestPackedTraits,FOREST_LOD_POLICIES,FOREST_LOD_VERSION,FOREST_FADE_SECONDS,FOREST_FADE_LIMIT} from './forest-lod.mjs';
import {forestMaterial} from './forest-material';
import {createForestLife,createForestAtlasTexture,FOREST_MOTION_ATTRIBUTES} from './forest-life-runtime';
// @ts-ignore Shared interpreted phenology and conservative motion envelope.
import {forestPhenology,FOREST_MOTION_PADDING} from './forest-life.mjs';
type Resource={geometries:THREE.BufferGeometry[];materials:THREE.Material[]};
export function addForest(scene:THREE.Object3D,anchors:any[],features:any[],height:(x:number,z:number)=>number|null,calendar:{value:THREE.Vector4},resources:Resource,prepared?:any){
 const models=optimizeForestModels(createForestModels()),geo=forestHabitat(features,height),params=typeof location==='undefined'?null:new URLSearchParams(location.search),infill=params?.has('perf')?params.get('forestDensity')!=='crowns':true;
 let plan:any;
 if(prepared?.forest&&infill){const trees=[...anchors,...prepared.forest.added];
  // A source-bound file stores extra anchors only. Clearances/forms are the
  // same pure library contract used by the preparation and fallback.
  plan={...planForest(anchors,features,height,models,{infill:false}),trees,stats:prepared.forest.stats};
  plan.layouts=trees.map((p:any)=>forestLayout(p,geo.context(p),models));
 }else plan=planForest(anchors,features,height,models,{infill});
 const pixels=forestAtlas(),atlas=createForestAtlasTexture(pixels);atlas.name='Original branch-rooted temperate spray atlas';atlas.generateMipmaps=false;atlas.minFilter=THREE.LinearMipmapLinearFilter;atlas.magFilter=THREE.LinearFilter;atlas.needsUpdate=true;scene.userData.natureLeafTexture=atlas;
 scene.updateWorldMatrix(true,false);const life=createForestLife(new THREE.Vector3().setFromMatrixPosition(scene.matrixWorld),models);scene.userData.forestLife=life;
 const nearMaterial=forestMaterial(calendar,atlas,false,life,true),coarseMaterial=forestMaterial(calendar,atlas,true,life,true);resources.materials.push(nearMaterial,coarseMaterial);
 const family=new Map<string,any[]>(),matrix=new THREE.Matrix4(),object=new THREE.Object3D();scene.updateWorldMatrix(true,false);
 const items:any[]=plan.trees.map((p:any,i:number)=>{const l=plan.layouts[i],m=models.get(l.id);object.position.set(p.x,p.y,p.z);object.rotation.set(0,l.yaw,l.lean);object.scale.fromArray(l.scale);object.updateMatrix();matrix.multiplyMatrices(scene.matrixWorld,object.matrix);
  const x=new THREE.Vector3().setFromMatrixColumn(matrix,0),z=new THREE.Vector3().setFromMatrixColumn(matrix,2),east=windToInstance({x:1,z:0},x,z),south=windToInstance({x:0,z:1},x,z),bound=m.box.clone().applyMatrix4(matrix).getBoundingSphere(new THREE.Sphere()),center=bound.center,radius=bound.radius+FOREST_MOTION_PADDING;
  const row={p,l,model:m,matrix:object.matrix.clone(),worldMatrix:matrix.clone(),center,radius,traits:[l.phase,l.age,Number(l.evergreen),l.density],form:[...l.form.slice(0,3),l.form[3]*Math.min(1,Math.max(0,l.clearance-l.radius-.85)/FOREST_MOTION_PADDING)],dates:forestPhenology(l.id,l.phase,l.age),life:[Math.min(1,Math.max(0,l.clearance-l.radius-.85)/FOREST_MOTION_PADDING),.88+l.phase*.26],basis:[east.x,south.x,east.z,south.z],anchor:[matrix.elements[12],matrix.elements[14]],color:new THREE.Color().setRGB(.90+l.age*.16,.92+l.phase*.12,.91+l.age*.10),lod:2,desired:2,next:-1,started:0,pixels:0,rank:0,visible:false};if(!family.has(l.id))family.set(l.id,[]);family.get(l.id)!.push(row);return row});
 const batches:any[]=[];
 for(const [id,points]of family){const model=models.get(id),group=new THREE.Group();group.name='forest-family-'+id;group.userData.forestFamily=id;scene.add(group);
  for(let lod=0;lod<model.levels.length;lod++){
   const level=model.levels[lod],wrap=(source:any)=>{const g=new THREE.BufferGeometry();for(const [name,a]of Object.entries(source.attributes))if(!FOREST_MOTION_ATTRIBUTES.includes(name))g.setAttribute(name,a as THREE.BufferAttribute);g.setIndex(source.index);return g},parts=[wrap(level.wood),wrap(level.leaves)],g=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());g.name=`forest-${id}-${lod}-mixed`;g.computeBoundingSphere();g.computeBoundingBox();g.userData.woodCount=level.wood.index.count;let flat=g;if(lod===0){const leaves=flattenForestSprays(level.leaves),parts=[wrap(level.wood),wrap(leaves)];flat=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());leaves.dispose();flat.userData.woodCount=g.userData.woodCount;flat.name=g.name+'-flat';flat.computeBoundingBox();flat.computeBoundingSphere();resources.geometries.push(flat)}
   const trait=new THREE.InstancedBufferAttribute(new Float32Array(points.length*4),4).setUsage(THREE.DynamicDrawUsage),form=new THREE.InstancedBufferAttribute(new Float32Array(points.length*4),4),dates=new THREE.InstancedBufferAttribute(new Float32Array(points.length*4),4);g.setAttribute('natureTraits',trait);g.setAttribute('forestForm',form);g.setAttribute('forestDates',dates);if(flat!==g){flat.setAttribute('natureTraits',trait);flat.setAttribute('forestForm',form);flat.setAttribute('forestDates',dates)}
   const mesh=new THREE.InstancedMesh(g,lod===0?nearMaterial:coarseMaterial,points.length);mesh.name=g.name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;group.add(mesh);resources.geometries.push(g);batches.push({id,lod,mesh,full:g,flat,points,trait,form,dates,slots:[]});
  }
  for(const level of model.levels)resources.geometries.push(level.wood,level.leaves);
 }
 const casterGroups=()=>batches.filter(b=>b.lod===2).map(b=>({source:b.mesh.geometry,forest:true,atlas,life,trees:b.points.map((p:any)=>({matrix:p.worldMatrix,x:p.anchor[0],z:p.anchor[1],traits:p.traits,form:p.form,dates:p.dates,life:p.life,basis:p.basis,anchor:p.anchor}))}));
 const stats=scene.userData.forest={version:FOREST_VERSION,lodVersion:FOREST_LOD_VERSION,...plan.stats,forms:Object.keys(FOREST_LIBRARY),visible:0,levels:[0,0,0,0],submittedTriangles:0,selectionUpdates:0,selectionCpuMs:0,maxSelectionCpuMs:0,transitioning:0,pendingTransitions:0,maxTransitions:FOREST_FADE_LIMIT,source:prepared?.forest?'source-bound prepared infill':'deterministic runtime fallback',items,models,atlas,batches,casterGroups,trees:plan.trees};
 const lastPosition=new THREE.Vector3(Infinity,0,0),lastQuaternion=new THREE.Quaternion(),frustum=new THREE.Frustum(),clip=new THREE.Matrix4(),sphere=new THREE.Sphere();let lastProfile='',lastFov=-1,lastAspect=-1,initialized=false,lastSeason=-1;
 function rebuild(){for(const b of batches){b.slots=[];let n=0;for(const p of b.points.filter((p:any)=>p.visible&&(p.lod===b.lod||p.next===b.lod)).sort((a:any,b:any)=>a.cameraDistance-b.cameraDistance)){b.mesh.setMatrixAt(n,p.matrix);b.mesh.setColorAt(n,p.color);b.trait.array.set(p.traits,n*4);b.form.array.set(p.form,n*4);b.dates.array.set(p.dates,n*4);b.slots.push(p);n++}b.mesh.count=n;b.mesh.visible=n>0;b.mesh.renderOrder=1+Math.floor((b.slots[0]?.cameraDistance??10000)*10);if(n){b.mesh.instanceMatrix.needsUpdate=true;b.mesh.instanceColor!.needsUpdate=true;b.dates.needsUpdate=b.form.needsUpdate=b.trait.needsUpdate=true}}}
 scene.userData.updateForest=(camera:THREE.Camera,profile:string,force=false)=>{
  const perspective=camera as THREE.PerspectiveCamera,time=life.field.metrics.lastTime??0,start=performance.now();let dirty=false;
  if(!force&&stats.pendingTransitions===0&&lastSeason===Math.floor(life.uniforms.forestDay.value)&&lastProfile===profile&&lastPosition.distanceToSquared(camera.position)<1.6&&Math.abs(lastQuaternion.dot(camera.quaternion))>.9998&&lastFov===perspective.fov&&lastAspect===perspective.aspect)return;
  for(const p of items)if(p.next>=0&&time-p.started>=FOREST_FADE_SECONDS){p.lod=p.next;p.next=-1;dirty=true}
  const select=force||lastProfile!==profile||lastPosition.distanceToSquared(camera.position)>=1.6||Math.abs(lastQuaternion.dot(camera.quaternion))<=.9998||lastFov!==perspective.fov||lastAspect!==perspective.aspect;
  if(select){camera.updateMatrixWorld();clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(clip);const policy=FOREST_LOD_POLICIES[profile]??FOREST_LOD_POLICIES.balanced,scale=(typeof innerHeight==='number'?innerHeight:720)/(2*Math.tan((perspective.fov??55)*Math.PI/360)),visible=[];
   for(const p of items){const distance=camera.position.distanceTo(p.center),range=Math.hypot(camera.position.x-p.center.x,camera.position.z-p.center.z);sphere.center.copy(p.center);sphere.radius=p.radius;p.visible=range<1050+p.radius&&frustum.intersectsSphere(sphere);if(!p.visible){if(p.next>=0){p.lod=p.next;p.next=-1}continue}p.cameraDistance=distance;p.pixels=p.l.height*scale/Math.max(1,distance);p.rank=Math.max(0,distance-p.radius)/Math.max(1,p.l.height)-p.pixels*.00001;p.desired=forestDetail(p.pixels,p.next>=0?p.next:p.lod,profile);visible.push(p)}
   const near=visible.filter(p=>p.desired===0).sort((a,b)=>a.rank-b.rank);near.slice(policy.near).forEach(p=>p.desired=1);const middle=visible.filter(p=>p.desired===1).sort((a,b)=>b.pixels-a.pixels);middle.slice(policy.middle).forEach(p=>p.desired=2);
   if(!initialized){for(const p of visible)p.lod=p.desired;initialized=true}
   dirty=true;stats.selectionUpdates++;lastPosition.copy(camera.position);lastQuaternion.copy(camera.quaternion);lastProfile=profile;lastFov=perspective.fov;lastAspect=perspective.aspect;
  }
  let active=items.filter(p=>p.next>=0).length;for(const p of items.filter(p=>p.visible&&p.next<0&&p.desired!==p.lod).sort((a,b)=>a.rank-b.rank)){if(active>=FOREST_FADE_LIMIT)break;p.next=p.desired;p.started=time;active++;dirty=true}
  if(select)for(const b of batches)if(b.lod===0)b.mesh.geometry=profile==='quality'?b.full:b.flat;
  if(dirty)rebuild();
  const season=Math.floor(life.uniforms.forestDay.value);if(lastSeason!==season){lastSeason=season;for(const b of batches){const leafless=!b.points[0].l.evergreen&&(season<Math.min(...b.points.map((p:any)=>p.dates[0]))-11||season>Math.max(...b.points.map((p:any)=>p.dates[3]))+2);for(const g of new Set<THREE.BufferGeometry>([b.full,b.flat]))g.setDrawRange(0,leafless?g.userData.woodCount:g.index!.count)}}
  if(dirty||active)for(const b of batches){if(!b.mesh.count)continue;for(let i=0;i<b.slots.length;i++){const p=b.slots[i],progress=p.next>=0?(time-p.started)/FOREST_FADE_SECONDS:null;b.trait.array[i*4+3]=forestPackedTraits(p.traits[3],progress,p.next===b.lod)}b.trait.clearUpdateRanges();b.trait.addUpdateRange(0,b.mesh.count*4);b.trait.needsUpdate=true}
  stats.levels=[0,0,0,0];for(const p of items)if(p.visible)stats.levels[p.lod]++;stats.visible=stats.levels.reduce((a:number,b:number)=>a+b,0);stats.transitioning=active;stats.pendingTransitions=items.filter(p=>p.visible&&(p.next>=0||p.desired!==p.lod)).length;stats.submittedTriangles=batches.reduce((n,b)=>n+b.mesh.count*b.mesh.geometry.drawRange.count/3,0);stats.selectionCpuMs=performance.now()-start;stats.maxSelectionCpuMs=Math.max(stats.maxSelectionCpuMs,stats.selectionCpuMs);
 };
 scene.userData.natureArt={version:FOREST_VERSION,approach:'branch-rooted folded near shoots, alternating mid shoot planes, shared 3D far branches',texture:[pixels.width,pixels.height],inferredIndividuals:plan.trees.filter((p:any)=>!p.mapped).length,trimmedCrowns:0,alternativeForms:plan.layouts.filter((l:any,i:number)=>l.id!==forestIdentity(plan.trees[i],geo.context(plan.trees[i])).id).length};
 return plan.trees;
}
