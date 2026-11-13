import {coverageReceiver,selectDetailIndices} from '../world/coverage';
// @ts-ignore Shared frame time for staggered resource admission.
import {lifeUniforms} from '../earthlife/state.mjs';
// @ts-ignore Static instancing metadata, no per-frame tree CPU animation.
import {instanceWindGeometry} from '../earthlife/instance-wind.mjs';
// @ts-ignore Original reusable procedural art.
import {createTreeArt} from './tree-geometry.mjs';
// @ts-ignore Stable family metadata and phenology from the existing calendar.
import {treeIdentity,foliageSeason,NATURE_ART_VERSION,NATURE_LOD} from './library.mjs';
// @ts-ignore Original deterministic RGBA artwork.
import {leafSprayPixels} from './leaf-texture.mjs';
import {natureArtMaterial} from './material';
import * as THREE from 'three';
// @ts-ignore Shared ecological rules exercised by Node.
import {createEcology,detailRecipe,noise,POITOU,habitat} from './ecology.mjs';
import {animateFoliage} from '../living/atmosphere';
// @ts-ignore Appearance envelopes; persistent geography is untouched.
import {canopyLayout,CANOPY_VERSION} from './canopy.mjs';
// @ts-ignore Once-per-zone masonry index.
import {masonryClearance} from './clearance.mjs';
import {addVillageFlowers,updateVillageFlowers} from './flower-render';
import {addForest} from './forest-render';
type Tree={x:number;y:number;z:number;kind:string;leaf?:string;scale:number};
const dummy=new THREE.Object3D();
export function addNature(scene:THREE.Object3D,features:any[],height:(x:number,z:number)=>number|null,prepared?:any,style=POITOU,fixedAnchors?:Tree[]){
 if(prepared&&prepared.manifest.natureStyleId!==style.id)prepared=undefined;
 const ecology=prepared?{trees:prepared.manifest.trees,profile:style}:createEcology(features,height,style),cells=new Map<string,Tree[]>();
 if(!prepared&&fixedAnchors)ecology.trees=fixedAnchors;
 const calendar={value:new THREE.Vector4(1,0,0,.1)};
 scene.userData.natureCalendar=calendar;scene.userData.natureLatitude=style.latitude;
 const resources={geometries:[] as THREE.BufferGeometry[],materials:[] as THREE.Material[]};scene.userData.natureResources=resources;
 const legacy=typeof location!=='undefined'&&new URLSearchParams(location.search).has('perf')&&new URLSearchParams(location.search).get('forest17')==='legacy';
 if(!legacy){
  const trees=addForest(scene,ecology.trees,features,height,calendar,resources,prepared);
  // Existing understory cells retain their original ecology, buffers and stream.
  addVillageFlowers(scene,features,height);
  const detailCells=new Set<string>();
  if(prepared){for(const e of prepared.manifest.entries.filter((e:any)=>e.kind==='nature')){const g=new THREE.Group();g.userData.natureCell={cx:e.cx,cz:e.cz,ecology,height,builds:0,calendar,natureStyle:style,prepared:e.id};scene.add(g)}}
  else for(const f of features){if(!f.rings||!habitat(f.tags))continue;const r=f.rings[0],xs=r.map((p:any)=>p.x),zs=r.map((p:any)=>p.z);for(let cz=Math.floor(Math.max(-980,Math.min(...zs))/128);cz<=Math.floor(Math.min(980,Math.max(...zs))/128);cz++)for(let cx=Math.floor(Math.max(-980,Math.min(...xs))/128);cx<=Math.floor(Math.min(980,Math.max(...xs))/128);cx++){const k=`${cx}:${cz}`;if(detailCells.has(k))continue;detailCells.add(k);const g=new THREE.Group();g.userData.natureCell={cx,cz,ecology,height,builds:0,calendar,natureStyle:style};scene.add(g)}}
  scene.userData.nature={trees:trees.length,cells:scene.userData.forest.forms.length,detailCells:prepared?prepared.manifest.entries.filter((e:any)=>e.kind==='nature').length:detailCells.size,profile:style.id,art:scene.userData.forest.version};
  return trees;
 }
 for(const p of ecology.trees){const key=`${Math.floor(p.x/180)}:${Math.floor(p.z/180)}:${p.leaf==='needle'&&p.kind!=='riparian'?'needle':'broad'}`;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(p)}
 const params=typeof location==='undefined'?null:new URLSearchParams(location.search);
 const art=createTreeArt(params?.has('perf')&&['perforated','volume'].includes(params.get('canopy')??'')?params.get('canopy'):'hybrid'),clearance=masonryClearance(features),crown=art.crown,distantCrown=art.farCrown,needleCrown=art.needle,farNeedleCrown=art.farNeedle,trunk=art.trunk;
 const pixels=leafSprayPixels(),texture=new THREE.DataTexture(pixels.data,pixels.width,pixels.height);texture.name='Original procedural leaf sprays';texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
 const bark=new THREE.MeshLambertMaterial({color:style.bark});animateFoliage(bark,false,false,false,true,true);
 const leaves=natureArtMaterial(calendar,art.approach==='volume'?null:texture,false,false,art.approach==='perforated'),distantLeaves=natureArtMaterial(calendar,null,false,true);
 scene.userData.natureArt={version:NATURE_ART_VERSION,canopy:CANOPY_VERSION,approach:art.approach,texture:[pixels.width,pixels.height],trimmedCrowns:0,inferredIndividuals:ecology.trees.filter((p:any)=>!p.mapped).length};
 scene.userData.natureCalendar=calendar;scene.userData.natureLatitude=style.latitude;scene.userData.natureLeafTexture=texture;
 scene.userData.natureResources={geometries:[trunk,crown,distantCrown,needleCrown,farNeedleCrown],materials:[bark,leaves,distantLeaves]};
 addVillageFlowers(scene,features,height);
 // Geometry/materials belong to this geographic zone, shared only within it.
 const palette=style.palette;
 scene.updateWorldMatrix(true,false);
 for(const [key,points] of cells){const [cx,cz]=key.split(':').map(Number),needle=key.endsWith(':needle'),nearGeometry=needle?needleCrown:crown,farGeometry=needle?farNeedleCrown:distantCrown,group=new THREE.Group();group.userData.natureTreeCell={x:(cx+.5)*180,z:(cz+.5)*180,nearGeometry,farGeometry,nearMaterial:leaves,farMaterial:distantLeaves,lod:'near'};
  const trunks=new THREE.InstancedMesh(trunk,bark,points.length),crowns=new THREE.InstancedMesh(nearGeometry,leaves,points.length);
  points.forEach((p,i)=>{const f=noise(p.x,p.z,2),layout=canopyLayout(p,clearance(p));
   if(layout.limit<1)scene.userData.natureArt.trimmedCrowns++;
   dummy.rotation.set(0,layout.yaw,0);dummy.position.set(p.x,layout.trunkY,p.z);dummy.scale.fromArray(layout.trunkScale);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   dummy.position.y=layout.crownY;dummy.scale.fromArray(layout.crownScale);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color(needle?style.needleColor:palette[Math.floor(f*palette.length)]));
  });
  const traits=new Float32Array(points.length*4);points.forEach((p,i)=>{const t=treeIdentity(p);traits.set([t.variant/3,t.phase,Number(t.evergreen),t.openness],i*4)});
  const trunkWrap=instanceWindGeometry(trunks,scene.matrixWorld),crownWrap=instanceWindGeometry(crowns,scene.matrixWorld),nearWind=crownWrap(nearGeometry),farWind=crownWrap(farGeometry),trunkWind=trunkWrap(trunk);
  const traitAttribute=new THREE.InstancedBufferAttribute(traits,4);nearWind.setAttribute('natureTraits',traitAttribute);farWind.setAttribute('natureTraits',traitAttribute);
  trunks.geometry=trunkWind;crowns.geometry=nearWind;group.userData.natureTreeCell.nearGeometry=nearWind;group.userData.natureTreeCell.farGeometry=farWind;scene.userData.natureResources.geometries.push(trunkWind,nearWind,farWind);
  trunks.computeBoundingSphere();crowns.computeBoundingSphere();trunks.boundingSphere!.radius+=.5;crowns.boundingSphere!.radius+=1.5;trunks.frustumCulled=crowns.frustumCulled=true;group.add(trunks,crowns);scene.add(group);
 }
 const detailCells=new Set<string>();
 if(prepared){for(const e of prepared.manifest.entries.filter((e:any)=>e.kind==='nature')){const g=new THREE.Group();g.userData.natureCell={cx:e.cx,cz:e.cz,ecology,height,builds:0,calendar,natureStyle:style,prepared:e.id};scene.add(g)}scene.userData.nature={trees:ecology.trees.length,cells:cells.size,detailCells:prepared.manifest.entries.filter((e:any)=>e.kind==='nature').length,profile:style.id,art:NATURE_ART_VERSION};return ecology.trees;}
 // Detail cells use a separate, finer grid than the shared tree batches.
 for(const f of features){if(!f.rings||!habitat(f.tags))continue;const r=f.rings[0],xs=r.map((p:any)=>p.x),zs=r.map((p:any)=>p.z);for(let cz=Math.floor(Math.max(-980,Math.min(...zs))/128);cz<=Math.floor(Math.min(980,Math.max(...zs))/128);cz++)for(let cx=Math.floor(Math.max(-980,Math.min(...xs))/128);cx<=Math.floor(Math.min(980,Math.max(...xs))/128);cx++){const k=`${cx}:${cz}`;if(detailCells.has(k))continue;detailCells.add(k);const g=new THREE.Group();g.userData.natureCell={cx,cz,ecology,height,builds:0,calendar,natureStyle:style};scene.add(g)}}
 scene.userData.nature={trees:ecology.trees.length,cells:cells.size,detailCells:detailCells.size,profile:style.id,art:NATURE_ART_VERSION};
 return ecology.trees;
}
function buildDetail(cell:THREE.Object3D,recipe:any[]){
 const c=cell.userData.natureCell,vertices:number[]=[],colors:number[]=[],bends:number[]=[],kinds:number[]=[];
 for(const p of recipe){
  const kind=({grass:0,fern:1,leaf:2,flower:3,stone:4,branch:5,shrub:6,reed:7} as Record<string,number>)[p.kind];
  const h=c.height(p.x,p.z);if(h===null)continue;const scale=p.scale;
  const col=new THREE.Color((c.natureStyle.groundColors as Record<string,number>)[p.kind]);
  // Local forms are draped vertex by vertex, including fallen branches on slopes.
  const emit=(x:number,y:number,z:number,bend=0)=>{const a=p.angle,wx=p.x+(x*Math.cos(a)-z*Math.sin(a))*scale,wz=p.z+(x*Math.sin(a)+z*Math.cos(a))*scale;vertices.push(wx,(c.height(wx,wz)??h)+.018+y*scale,wz);const shade=(.82+noise(p.x,p.z,67)*.18)*(.84+Math.min(.2,y*.3));colors.push(col.r*shade,col.g*shade,col.b*shade);bends.push(bend*scale);kinds.push(kind)};
  const tri=(a:number[],b:number[],d:number[],bend=false)=>{for(const q of [a,b,d])emit(q[0],q[1],q[2],bend?q[1]:0)};
  if(p.kind==='leaf'){tri([-.10,0,0],[0,.008,-.035],[.10,0,0]);tri([-.10,0,0],[.10,0,0],[0,.008,.035]);}
  else if(p.kind==='branch'){tri([-.5,0,-.014],[.5,.025,-.009],[.5,.025,.009]);tri([-.5,0,-.014],[.5,.025,.009],[-.5,0,.014]);}
  else if(p.kind==='stone'){const a=[-.09,0,-.07],b=[.12,0,-.04],d=[0,0,.11],top=[0,.11,0];tri(a,b,top);tri(b,d,top);tri(d,a,top);}
  else if(p.kind==='fern'){
   for(let frond=0;frond<2;frond++){const angle=frond*Math.PI*.5,cs=Math.cos(angle),sn=Math.sin(angle),v=(x:number,y:number,z:number)=>[x*cs-z*sn,y,x*sn+z*cs];for(let j=0;j<(frond===0?3:2);j++){const t=(j+1)/4,y=.06+Math.sin(t*2)*.35,z=t*.42,w=.18*(1-t);tri(v(0,y,z),v(-w,y-.04,z-.04),v(0,y+.035,z+.11),true);tri(v(0,y,z),v(0,y+.035,z+.11),v(w,y-.04,z-.04),true)}}
  }else if(p.kind==='shrub'){
   for(let j=0;j<2;j++){const a=j*Math.PI*.5,cs=Math.cos(a),sn=Math.sin(a),v=(x:number,y:number)=>[x*cs,y,x*sn],y=.45+(j%2)*.12;tri(v(-.01,0),v(.01,0),v(.14,y),true);for(let k=1;k<4;k++){const yy=y*k/4,xx=.14*k/4,sign=k%2?1:-1;tri(v(xx,yy),v(xx+sign*.09,yy+.02),v(xx+sign*.12,yy+.08),true);tri(v(xx,yy),v(xx+sign*.12,yy+.08),v(xx+sign*.035,yy+.09),true)}}
  }else {
   const blades=p.kind==='reed'?4:3;
   for(let j=0;j<blades;j++){const a=j*2.4,cs=Math.cos(a),sn=Math.sin(a),base=(j%3-1)*.065,h=(p.kind==='reed'?.8:.36)+(j%3)*.09;tri([cs*base-.018,0,sn*base],[cs*base+.018,0,sn*base],[cs*(base+.13),h,sn*(base+.13)],true)}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Uint8BufferAttribute(colors.map(v=>Math.round(Math.max(0,Math.min(1,v))*255)),3,true));geometry.setAttribute('natureBend',new THREE.Float32BufferAttribute(bends,1));geometry.setAttribute('natureKind',new THREE.Uint8BufferAttribute(kinds,1));geometry.computeVertexNormals();
 const material=natureArtMaterial(c.calendar,null,true);coverageReceiver(material,new THREE.Vector2((c.range19??110)*.65,c.range19??110),lifeUniforms.lifeTime.value);const mesh=new THREE.Mesh(geometry,material);mesh.name='nature-detail';cell.add(mesh);c.detail=mesh;c.builds++;
}
export function updateNatureLOD(scene:THREE.Object3D,camera:THREE.Camera,eco=false){
 const hidden:any[]=[],near:any[]=[],requests:any[]=[];const stream=scene.userData.decorationStream;
 const climate=scene.userData.climate;
 scene.traverse(o=>{
  if(o.userData.villageFlowers)updateVillageFlowers(o,camera,climate?.date,eco);
  if(o.userData.natureCalendar)o.userData.natureCalendar.value.fromArray(foliageSeason(climate?.date,o.userData.natureLatitude??46));
  o.userData.forestLife?.update(climate?.date,o.userData.natureLatitude??46);
  if(o.userData.updateForest){o.userData.forestCamera=camera;o.userData.updateForest(camera,eco?'eco':scene.userData.earthLife?.profile??'balanced');}
  const tree=o.userData.natureTreeCell;
  if(tree){const d=Math.hypot(camera.position.x-tree.x,camera.position.z-tree.z),crowns=o.children[1] as THREE.InstancedMesh;
   o.children[0].visible=o.children[0].visible?d<650:d<620;crowns.visible=crowns.visible?d<1050:d<1020;
   const nearDistance=Math.max(0,camera.position.distanceTo(crowns.boundingSphere!.center)-crowns.boundingSphere!.radius),threshold=eco?NATURE_LOD.eco:scene.userData.earthLife?.profile==='quality'?NATURE_LOD.quality:NATURE_LOD.balanced;
   tree.lod=!eco&&nearDistance<(tree.lod==='near'?threshold+NATURE_LOD.hysteresis:threshold)?'near':'far';
   crowns.geometry=tree.lod==='near'?tree.nearGeometry:tree.farGeometry;crowns.material=tree.lod==='near'?tree.nearMaterial:tree.farMaterial;return;
  }
  const c=o.userData.natureCell;if(!c)return;
  const d=Math.hypot(Math.max(0,Math.abs(camera.position.x-(c.cx+.5)*128)-64),Math.max(0,Math.abs(camera.position.z-(c.cz+.5)*128)-64)),range=eco?c.ecology.profile.ecoRange:c.ecology.profile.detailRange;
  c.range19=range;const visible=d<range+(c.detail?.visible?18:0);c.wanted=visible;
  if(c.detail){const m=c.detail.material;if(!m.userData.coverage19)coverageReceiver(m,new THREE.Vector2(range*.65,range),lifeUniforms.lifeTime.value);else m.userData.coverage19.range.value.set(range*.65,range);c.detail.visible=visible;if(visible){selectDetailIndices(c.detail,camera,range);c.detail.visible=c.detail.geometry.userData.detailSelection19.submittedTriangles>0;}if(!visible)hidden.push({o,c,d})}
  else if(c.prepared){if(d<range+(stream?.policy.prefetchM??48))requests.push({id:c.prepared,priority:d-(visible?1000:0),d,visible,install:(data:any)=>{const geometry=data.meshes[0].geometry;const material=natureArtMaterial(c.calendar,null,true);coverageReceiver(material,new THREE.Vector2(range*.65,range),lifeUniforms.lifeTime.value);const mesh=new THREE.Mesh(geometry,material);mesh.name='nature-detail';mesh.visible=c.wanted;o.add(mesh);c.detail=mesh;c.builds++;selectDetailIndices(mesh,camera,c.range19??range);}});}
  else if(visible)near.push({o,c,d});
  else c.pending=null;
 });
 if(stream){const reserve=[...hidden.map(({c,d})=>({id:c.prepared,d})),...requests.filter(r=>!r.visible)].sort((a,b)=>a.d-b.d).slice(0,4);const keep=new Set(reserve.map(r=>r.id));stream.want('nature',requests.filter(r=>r.visible||keep.has(r.id)));}
 near.sort((a,b)=>a.d-b.d);
 // One bounded recipe slice per update, then one final buffer build. Same sequence.
 const next=near[0];if(next){const {o,c}=next;c.pending??={cursor:0,points:[]};const job=c.pending;
  const started=performance.now(),limit=Math.min(3200,job.cursor+256);
  do{const end=Math.min(limit,job.cursor+32);job.points.push(...detailRecipe(c.cx,c.cz,c.ecology,job.cursor,end));job.cursor=end}while(job.cursor<limit&&performance.now()-started<2);
  scene.userData.natureWork??={maxSliceMs:0,maxBuildMs:0,slices:0};const work=scene.userData.natureWork;work.slices++;work.maxSliceMs=Math.max(work.maxSliceMs,performance.now()-started);
  if(job.cursor===3200){const started=performance.now();buildDetail(o,job.points);selectDetailIndices(c.detail,camera,c.range19??110);work.maxBuildMs=Math.max(work.maxBuildMs,performance.now()-started);c.pending=null}
 }
 hidden.sort((a,b)=>a.d-b.d);for(const {o,c} of hidden.slice(4)){o.remove(c.detail);c.detail.geometry.dispose();c.detail.material.dispose();c.detail=null;if(c.prepared)stream?.release(c.prepared)}
}
export function natureMemory(scene:THREE.Object3D){let treeCells=0,farCells=0,cells=0,resident=0,builds=0,pending=0,work=0,needed=0;let forest:any=null;scene.traverse(o=>{const t=o.userData.natureTreeCell;if(t){treeCells++;if(t.lod==='far')farCells++}const f=o.userData.forest;if(f){treeCells+=f.models.size;farCells+=f.levels[2];forest={version:f.version,total:f.total,original:f.original,added:f.added,visible:f.visible,levels:f.levels,triangles:f.submittedTriangles,families:f.families,selectionUpdates:f.selectionUpdates,maxSelectionCpuMs:f.maxSelectionCpuMs,source:f.source,selectionCpuMs:f.selectionCpuMs,appearances:f.appearances,disappearances:f.disappearances,lodChanges:f.lodChanges,pendingTransitions:f.pendingTransitions,transitioning:f.transitioning,batchRebuilds:f.batchRebuilds,inspect:(id?:string)=>{const describe=(t:any)=>({id:t.id,distance:t.cameraDistance,projectedPixels:t.pixels,lod:t.lod,requested:t.desired,transition:t.next<0?null:{to:t.next,started:t.started},frustum:t.inFrustum,loaded:t.loaded,visible:t.visible,reason:t.reason});return id?f.items.filter((t:any)=>t.id===id).map(describe):f.items.filter((t:any)=>t.visible).sort((a:any,b:any)=>a.cameraDistance-b.cameraDistance).slice(0,12).map(describe)}}}const c=o.userData.natureCell;if(c){cells++;if(c.detail)resident++;else if(c.wanted)needed++;builds+=c.builds;if(c.pending){pending++;work+=c.pending.cursor}}});return {treeCells,farCells,cells,resident,builds,pending,work,needed,forest,preparation:scene.userData.natureWork??null}}
export function disposeNatureZone(group:THREE.Object3D){group.userData.decorationStream?.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();group.traverse(o=>{o.userData.releaseNatureAnchors?.();o.userData.forestLife?.dispose();const resources=o.userData.natureResources??o.userData.terrainResources;if(resources){for(const g of resources.geometries)geometries.add(g);for(const m of resources.materials)materials.add(m)}if(o instanceof THREE.Mesh){if((o as THREE.InstancedMesh).isInstancedMesh)(o as THREE.InstancedMesh).dispose();geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(!m.userData.architectureShared&&!m.userData.natureShared)materials.add(m)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.traverse(o=>{for(const t of [o.userData.terrainTexture,o.userData.roadEdgeTexture,o.userData.natureLeafTexture,...(o.userData.surfaceTextures??[])])if(t){t.dispose();t.image?.close?.()}});group.clear();group.userData={};}

// M11 has advanced its single environment clock; sync responses even at a fixed camera.
export function updateForestLife(scene:THREE.Object3D,camera?:THREE.Camera){const climate=scene.userData.climate;scene.traverse(o=>{o.userData.forestLife?.update(climate?.date,o.userData.natureLatitude??46);if(camera&&o.userData.updateForest)o.userData.forestCamera=camera;if(o.userData.forestCamera)o.userData.updateForest(o.userData.forestCamera,scene.userData.earthLife?.profile??'balanced')});}
