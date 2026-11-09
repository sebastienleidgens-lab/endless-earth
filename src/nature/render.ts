import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
// @ts-ignore Shared ecological rules exercised by Node.
import {createEcology,detailRecipe,noise,POITOU} from './ecology.mjs';
import {animateFoliage} from '../living/atmosphere';
type Tree={x:number;y:number;z:number;kind:string;scale:number};
const dummy=new THREE.Object3D();
export function addNature(scene:THREE.Object3D,features:any[],height:(x:number,z:number)=>number|null){
 const ecology=createEcology(features,height),cells=new Map<string,Tree[]>();
 for(const p of ecology.trees){const key=`${Math.floor(p.x/180)}:${Math.floor(p.z/180)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(p)}
 // Three overlapping, asymmetric lobes in ONE shared crown geometry.
 const positions:number[]=[],normals:number[]=[];
 for(const [x,y,z,sx,sy,sz] of [[0,0,0,2.3,2.9,2.2],[-1.3,-.5,.2,1.9,2.0,1.7],[1.1,.4,-.5,1.7,2.2,1.8]]){const g=new THREE.IcosahedronGeometry(1,x===0?1:0);const a=g.attributes.position,n=g.attributes.normal;for(let i=0;i<a.count;i++){const v=new THREE.Vector3().fromBufferAttribute(a,i).normalize();n.setXYZ(i,v.x,v.y,v.z)}g.scale(sx,sy,sz);g.translate(x,y,z);positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);g.dispose()}
 const crown=new THREE.BufferGeometry();crown.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));crown.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 const stem=new THREE.CylinderGeometry(.19,.36,4.5,5),branches=[stem];for(const side of [-1,1]){const branch=new THREE.CylinderGeometry(.07,.16,2.6,3,1,true);branch.rotateZ(side*.65);branch.translate(-side*.7,1.1,0);branches.push(branch)}const trunk=mergeGeometries(branches)!;branches.forEach(g=>g.dispose());const bark=new THREE.MeshLambertMaterial({color:0x716653}),leaves=new THREE.MeshLambertMaterial({color:0xffffff});animateFoliage(leaves,true);
 // Geometry/materials belong to this geographic zone, shared only within it.
 const palette=[0x526c45,0x66794b,0x74865a,0x546f58,0x7d8552];
 for(const [key,points] of cells){const [cx,cz]=key.split(':').map(Number),group=new THREE.Group();group.userData.natureTreeCell={x:(cx+.5)*180,z:(cz+.5)*180};
  const trunks=new THREE.InstancedMesh(trunk,bark,points.length),crowns=new THREE.InstancedMesh(crown,leaves,points.length);
  points.forEach((p,i)=>{const f=noise(p.x,p.z,2),wet=p.kind==='riparian',s=p.scale,w=wet?.7:.85+f*.35,h=wet?1.35:1;
   dummy.rotation.set(0,f*6.28,0);dummy.position.set(p.x,p.y+2.25*s*h,p.z);dummy.scale.set(s,s*h,s);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   dummy.position.y=p.y+5.6*s*h;dummy.scale.set(s*w,s*h,s*(.85+noise(p.x,p.z,4)*.3));dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color(palette[Math.floor(f*palette.length)]));
  });trunks.frustumCulled=crowns.frustumCulled=false;group.add(trunks,crowns);scene.add(group);
 }
 const detailCells=new Set<string>();
 // Detail cells use a separate, finer grid than the shared tree batches.
 for(const f of features){if(!f.rings||!['meadow','grass','village_green','forest'].includes(f.tags.landuse)&&!['wood','grassland','scrub'].includes(f.tags.natural))continue;const r=f.rings[0],xs=r.map((p:any)=>p.x),zs=r.map((p:any)=>p.z);for(let cz=Math.floor(Math.max(-980,Math.min(...zs))/128);cz<=Math.floor(Math.min(980,Math.max(...zs))/128);cz++)for(let cx=Math.floor(Math.max(-980,Math.min(...xs))/128);cx<=Math.floor(Math.min(980,Math.max(...xs))/128);cx++){const k=`${cx}:${cz}`;if(detailCells.has(k))continue;detailCells.add(k);const g=new THREE.Group();g.userData.natureCell={cx,cz,ecology,height,builds:0};scene.add(g)}}
 scene.userData.nature={trees:ecology.trees.length,cells:cells.size,detailCells:detailCells.size,profile:POITOU.id};
 return ecology.trees;
}
function buildDetail(cell:THREE.Object3D){
 const c=cell.userData.natureCell,recipe=detailRecipe(c.cx,c.cz,c.ecology),vertices:number[]=[],colors:number[]=[],bends:number[]=[];
 for(const p of recipe){
  const h=c.height(p.x,p.z);if(h===null)continue;const scale=p.scale;
  const col=new THREE.Color(({grass:0x85895a,fern:0x637c54,leaf:0x99805b,flower:0xcbbe91,stone:0xa09b85,branch:0x71634e} as Record<string,number>)[p.kind]);
  // Local forms are draped vertex by vertex, including fallen branches on slopes.
  const emit=(x:number,y:number,z:number,bend=0)=>{const a=p.angle,wx=p.x+(x*Math.cos(a)-z*Math.sin(a))*scale,wz=p.z+(x*Math.sin(a)+z*Math.cos(a))*scale;vertices.push(wx,(c.height(wx,wz)??h)+.018+y*scale,wz);colors.push(col.r,col.g,col.b);bends.push(bend)};
  const tri=(a:number[],b:number[],d:number[],bend=false)=>{for(const q of [a,b,d])emit(q[0],q[1],q[2],bend?q[1]:0)};
  if(p.kind==='leaf'){tri([-.10,0,0],[0,.008,-.035],[.10,0,0]);tri([-.10,0,0],[.10,0,0],[0,.008,.035]);}
  else if(p.kind==='branch'){tri([-.5,0,-.014],[.5,.025,-.009],[.5,.025,.009]);tri([-.5,0,-.014],[.5,.025,.009],[-.5,0,.014]);}
  else if(p.kind==='stone'){const a=[-.09,0,-.07],b=[.12,0,-.04],d=[0,0,.11],top=[0,.11,0];tri(a,b,top);tri(b,d,top);tri(d,a,top);}
  else if(p.kind==='fern'){for(let j=0;j<5;j++){const t=j/5,y=.05+t*.28,z=t*.28,w=.18*(1-t);tri([0,y,z],[-w,y-.025,z-.045],[0,y+.045,z+.09],true);tri([0,y,z],[0,y+.045,z+.09],[w,y-.025,z-.045],true);}}
  else {for(let j=0;j<3;j++){const z=(j-1)*.06,y=.28+j*.045;tri([-.018,0,z],[.018,0,z],[.065,y,z+.025],true)}}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('natureBend',new THREE.Float32BufferAttribute(bends,1));geometry.computeVertexNormals();
 const material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});animateFoliage(material,false,true);const mesh=new THREE.Mesh(geometry,material);mesh.name='nature-detail';cell.add(mesh);c.detail=mesh;c.builds++;
}
export function updateNatureLOD(scene:THREE.Object3D,camera:THREE.Camera,eco=false){let built=false;const hidden:any[]=[];scene.traverse(o=>{const tree=o.userData.natureTreeCell;if(tree){const d=Math.hypot(camera.position.x-tree.x,camera.position.z-tree.z);o.children[0].visible=o.children[0].visible?d<650:d<620;o.children[1].visible=o.children[1].visible?d<1050:d<1020;return}const c=o.userData.natureCell;if(!c)return;const d=Math.hypot(camera.position.x-(c.cx+.5)*128,camera.position.z-(c.cz+.5)*128);const range=eco?55:110,near=d<range+(c.detail?.visible?18:0);if(near&&!c.detail&&!built){buildDetail(o);built=true}if(c.detail){c.detail.visible=near;if(!near)hidden.push({o,c,d})}});hidden.sort((a,b)=>a.d-b.d);for(const {o,c} of hidden.slice(4)){o.remove(c.detail);c.detail.geometry.dispose();c.detail.material.dispose();c.detail=null}}
export function disposeNatureZone(group:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();group.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(!m.userData.architectureShared&&!m.userData.natureShared)materials.add(m)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();group.userData={};}
