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
type Tree={x:number;y:number;z:number;kind:string;leaf?:string;scale:number};
const dummy=new THREE.Object3D();
export function addNature(scene:THREE.Object3D,features:any[],height:(x:number,z:number)=>number|null,prepared?:any){
 const ecology=prepared?{trees:prepared.manifest.trees,profile:POITOU}:createEcology(features,height),cells=new Map<string,Tree[]>();
 for(const p of ecology.trees){const key=`${Math.floor(p.x/180)}:${Math.floor(p.z/180)}:${p.leaf==='needle'&&p.kind!=='riparian'?'needle':'broad'}`;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(p)}
 const art=createTreeArt(),crown=art.crown,distantCrown=art.farCrown,needleCrown=art.needle,farNeedleCrown=art.farNeedle,trunk=art.trunk;
 const pixels=leafSprayPixels(),texture=new THREE.DataTexture(pixels.data,pixels.width,pixels.height);texture.name='Original procedural leaf sprays';texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
 const calendar={value:new THREE.Vector4(1,0,0,.1)};
 const bark=new THREE.MeshLambertMaterial({color:0x716653});animateFoliage(bark,false,false,false,true,true);
 const leaves=natureArtMaterial(calendar,art.approach==='sprays'?texture:null),distantLeaves=natureArtMaterial(calendar,null,false,true);
 scene.userData.natureArt={version:NATURE_ART_VERSION,approach:art.approach,texture:[pixels.width,pixels.height],inferredIndividuals:ecology.trees.filter((p:any)=>!p.mapped).length};
 scene.userData.natureCalendar=calendar;scene.userData.natureLeafTexture=texture;
 scene.userData.natureResources={geometries:[trunk,crown,distantCrown,needleCrown,farNeedleCrown],materials:[bark,leaves,distantLeaves]};
 // Geometry/materials belong to this geographic zone, shared only within it.
 const palette=[0x566d48,0x617548,0x6d7d50,0x506951,0x758052];
 scene.updateWorldMatrix(true,false);
 for(const [key,points] of cells){const [cx,cz]=key.split(':').map(Number),needle=key.endsWith(':needle'),nearGeometry=needle?needleCrown:crown,farGeometry=needle?farNeedleCrown:distantCrown,group=new THREE.Group();group.userData.natureTreeCell={x:(cx+.5)*180,z:(cz+.5)*180,nearGeometry,farGeometry,nearMaterial:leaves,farMaterial:distantLeaves,lod:'near'};
  const trunks=new THREE.InstancedMesh(trunk,bark,points.length),crowns=new THREE.InstancedMesh(nearGeometry,leaves,points.length);
  points.forEach((p,i)=>{const f=noise(p.x,p.z,2),wet=p.kind==='riparian',s=p.scale,w=wet?.7:.85+f*.35,h=wet?1.35:1;
   dummy.rotation.set(0,f*6.28,0);dummy.position.set(p.x,p.y+2.25*s*h,p.z);dummy.scale.set(s,s*h,s);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   dummy.position.y=p.y+5.6*s*h;dummy.scale.set(s*w,s*h,s*(.85+noise(p.x,p.z,4)*.3));dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color(needle?0x586d56:palette[Math.floor(f*palette.length)]));
  });
  const traits=new Float32Array(points.length*4);points.forEach((p,i)=>{const t=treeIdentity(p);traits.set([t.variant/3,t.phase,Number(t.evergreen),t.openness],i*4)});
  const trunkWrap=instanceWindGeometry(trunks,scene.matrixWorld),crownWrap=instanceWindGeometry(crowns,scene.matrixWorld),nearWind=crownWrap(nearGeometry),farWind=crownWrap(farGeometry),trunkWind=trunkWrap(trunk);
  const traitAttribute=new THREE.InstancedBufferAttribute(traits,4);nearWind.setAttribute('natureTraits',traitAttribute);farWind.setAttribute('natureTraits',traitAttribute);
  trunks.geometry=trunkWind;crowns.geometry=nearWind;group.userData.natureTreeCell.nearGeometry=nearWind;group.userData.natureTreeCell.farGeometry=farWind;scene.userData.natureResources.geometries.push(trunkWind,nearWind,farWind);
  trunks.computeBoundingSphere();crowns.computeBoundingSphere();trunks.boundingSphere!.radius+=.5;crowns.boundingSphere!.radius+=1.5;trunks.frustumCulled=crowns.frustumCulled=true;group.add(trunks,crowns);scene.add(group);
 }
 const detailCells=new Set<string>();
 if(prepared){for(const e of prepared.manifest.entries.filter((e:any)=>e.kind==='nature')){const g=new THREE.Group();g.userData.natureCell={cx:e.cx,cz:e.cz,ecology,height,builds:0,calendar,prepared:e.id};scene.add(g)}scene.userData.nature={trees:ecology.trees.length,cells:cells.size,detailCells:prepared.manifest.entries.filter((e:any)=>e.kind==='nature').length,profile:POITOU.id,art:NATURE_ART_VERSION};return ecology.trees;}
 // Detail cells use a separate, finer grid than the shared tree batches.
 for(const f of features){if(!f.rings||!habitat(f.tags))continue;const r=f.rings[0],xs=r.map((p:any)=>p.x),zs=r.map((p:any)=>p.z);for(let cz=Math.floor(Math.max(-980,Math.min(...zs))/128);cz<=Math.floor(Math.min(980,Math.max(...zs))/128);cz++)for(let cx=Math.floor(Math.max(-980,Math.min(...xs))/128);cx<=Math.floor(Math.min(980,Math.max(...xs))/128);cx++){const k=`${cx}:${cz}`;if(detailCells.has(k))continue;detailCells.add(k);const g=new THREE.Group();g.userData.natureCell={cx,cz,ecology,height,builds:0,calendar};scene.add(g)}}
 scene.userData.nature={trees:ecology.trees.length,cells:cells.size,detailCells:detailCells.size,profile:POITOU.id,art:NATURE_ART_VERSION};
 return ecology.trees;
}
function buildDetail(cell:THREE.Object3D,recipe:any[]){
 const c=cell.userData.natureCell,vertices:number[]=[],colors:number[]=[],bends:number[]=[],kinds:number[]=[];
 for(const p of recipe){
  const kind=({grass:0,fern:1,leaf:2,flower:3,stone:4,branch:5,shrub:6,reed:7} as Record<string,number>)[p.kind];
  const h=c.height(p.x,p.z);if(h===null)continue;const scale=p.scale;
  const col=new THREE.Color(({grass:0x85895a,fern:0x637c54,leaf:0x99805b,flower:0xcbbe91,stone:0xa09b85,branch:0x71634e,shrub:0x64784c,reed:0x78895a} as Record<string,number>)[p.kind]);
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
 const material=natureArtMaterial(c.calendar,null,true);const mesh=new THREE.Mesh(geometry,material);mesh.name='nature-detail';cell.add(mesh);c.detail=mesh;c.builds++;
}
export function updateNatureLOD(scene:THREE.Object3D,camera:THREE.Camera,eco=false){
 const hidden:any[]=[],near:any[]=[],requests:any[]=[];const stream=scene.userData.decorationStream;
 const climate=scene.userData.climate,season=foliageSeason(climate?.date,climate?.latitude??46);
 scene.traverse(o=>{
  if(o.userData.natureCalendar)o.userData.natureCalendar.value.fromArray(season);
  const tree=o.userData.natureTreeCell;
  if(tree){const d=Math.hypot(camera.position.x-tree.x,camera.position.z-tree.z),crowns=o.children[1] as THREE.InstancedMesh;
   o.children[0].visible=o.children[0].visible?d<650:d<620;crowns.visible=crowns.visible?d<1050:d<1020;
   const nearDistance=Math.max(0,camera.position.distanceTo(crowns.boundingSphere!.center)-crowns.boundingSphere!.radius),threshold=eco?NATURE_LOD.eco:scene.userData.earthLife?.profile==='quality'?NATURE_LOD.quality:NATURE_LOD.balanced;
   tree.lod=!eco&&nearDistance<(tree.lod==='near'?threshold+NATURE_LOD.hysteresis:threshold)?'near':'far';
   crowns.geometry=tree.lod==='near'?tree.nearGeometry:tree.farGeometry;crowns.material=tree.lod==='near'?tree.nearMaterial:tree.farMaterial;return;
  }
  const c=o.userData.natureCell;if(!c)return;
  const d=Math.hypot(camera.position.x-(c.cx+.5)*128,camera.position.z-(c.cz+.5)*128),range=eco?c.ecology.profile.ecoRange:c.ecology.profile.detailRange;
  const visible=d<range+(c.detail?.visible?18:0);c.wanted=visible;
  if(c.detail){c.detail.visible=visible;if(!visible)hidden.push({o,c,d})}
  else if(c.prepared){if(d<range+(stream?.policy.prefetchM??48))requests.push({id:c.prepared,priority:d-(visible?1000:0),d,visible,install:(data:any)=>{const geometry=data.meshes[0].geometry;const material=natureArtMaterial(c.calendar,null,true);const mesh=new THREE.Mesh(geometry,material);mesh.name='nature-detail';mesh.visible=c.wanted;o.add(mesh);c.detail=mesh;c.builds++;}});}
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
  if(job.cursor===3200){const started=performance.now();buildDetail(o,job.points);work.maxBuildMs=Math.max(work.maxBuildMs,performance.now()-started);c.pending=null}
 }
 hidden.sort((a,b)=>a.d-b.d);for(const {o,c} of hidden.slice(4)){o.remove(c.detail);c.detail.geometry.dispose();c.detail.material.dispose();c.detail=null;if(c.prepared)stream?.release(c.prepared)}
}
export function natureMemory(scene:THREE.Object3D){let treeCells=0,farCells=0,cells=0,resident=0,builds=0,pending=0,work=0,needed=0;scene.traverse(o=>{const t=o.userData.natureTreeCell;if(t){treeCells++;if(t.lod==='far')farCells++}const c=o.userData.natureCell;if(c){cells++;if(c.detail)resident++;else if(c.wanted)needed++;builds+=c.builds;if(c.pending){pending++;work+=c.pending.cursor}}});return {treeCells,farCells,cells,resident,builds,pending,work,needed,preparation:scene.userData.natureWork??null}}
export function disposeNatureZone(group:THREE.Object3D){group.userData.decorationStream?.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();group.traverse(o=>{const resources=o.userData.natureResources??o.userData.terrainResources;if(resources){for(const g of resources.geometries)geometries.add(g);for(const m of resources.materials)materials.add(m)}if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(!m.userData.architectureShared&&!m.userData.natureShared)materials.add(m)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.traverse(o=>{for(const t of [o.userData.terrainTexture,o.userData.roadEdgeTexture,o.userData.natureLeafTexture,...(o.userData.surfaceTextures??[])])if(t){t.dispose();t.image?.close?.()}});group.clear();group.userData={};}
