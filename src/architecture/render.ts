// @ts-ignore Shared shader module.
import {cloudReceiver} from '../earthlife/state.mjs';
import * as THREE from 'three';
// @ts-ignore Pure deterministic planning shared with Node tests.
import {buildingPlan, detailVisible} from './plan.mjs';
// @ts-ignore Regional configuration is data, independent of Three.js.
import {POITOU} from './style.mjs';
type Point={x:number;z:number};
type Bucket={p:number[];uv:number[];c:number[];indices:number[]};
const bucket=():Bucket=>({p:[],uv:[],c:[],indices:[]});
const color=new THREE.Color();
function triangle(b:Bucket,points:number[][],tint:number,uv:number[][]){
 const [a,c,d]=points,ux=c[0]-a[0],uy=c[1]-a[1],uz=c[2]-a[2],vx=d[0]-a[0],vy=d[1]-a[1],vz=d[2]-a[2];
 if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-9)return;
 const start=b.p.length/3;b.indices.push(start,start+1,start+2);color.setHex(tint);for(let i=0;i<3;i++){b.p.push(...points[i]);b.uv.push(...uv[i]);b.c.push(color.r,color.g,color.b)}}
function quad(b:Bucket,p:number[][],tint:number,uv=[[0,0],[1,0],[1,1],[0,1]]){
 // A planar panel shares its diagonal vertices, with exactly the same triangles.
 const [a,c,d,e]=p,ux=c[0]-a[0],uy=c[1]-a[1],uz=c[2]-a[2],vx=d[0]-a[0],vy=d[1]-a[1],vz=d[2]-a[2],wx=e[0]-a[0],wy=e[1]-a[1],wz=e[2]-a[2];
 if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-9||Math.hypot(vy*wz-vz*wy,vz*wx-vx*wz,vx*wy-vy*wx)<1e-9){
  triangle(b,[p[0],p[1],p[2]],tint,[uv[0],uv[1],uv[2]]);triangle(b,[p[0],p[2],p[3]],tint,[uv[0],uv[2],uv[3]]);return;
 }
 const start=b.p.length/3;color.setHex(tint);for(let i=0;i<4;i++){b.p.push(...p[i]);b.uv.push(...uv[i]);b.c.push(color.r,color.g,color.b)}b.indices.push(start,start+1,start+2,start,start+2,start+3);
}
// Small shared, repeating physical-scale textures: no external art or per-house maps.
function texture(kind:'stone'|'tile'|'plaster'){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const row=Math.floor(y/32),sx=(x+(row%2)*32)%64;
  const n=((Math.imul(x+1,73)^Math.imul(y+1,157))>>>0)%13;
  let v:number;
  if(kind==='stone'){const jitter=(Math.floor(y/4)*13+row*7)%3;v=(y%32<1||sx<1+jitter*.35)?214+n*.5:230+((row*17+Math.floor((x+(row%2)*32)/64)*11)%14)+n*.55;}
  else if(kind==='plaster')v=238+n+Math.sin(x*.13+y*.07)*3;
  else {const tx=x%16;v=y%16<2?153:tx<2?181:211+Math.sin(tx/16*Math.PI)*31+n*.5;}
  const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=Math.min(255,v);data[i+3]=255;
 }
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
}
const stone=new THREE.MeshLambertMaterial({vertexColors:true,map:texture('stone'),side:THREE.DoubleSide});
const plaster=new THREE.MeshLambertMaterial({vertexColors:true,map:texture('plaster'),side:THREE.DoubleSide});
const tile=new THREE.MeshLambertMaterial({vertexColors:true,map:texture('tile'),side:THREE.DoubleSide});
const plain=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
for(const m of [stone,plaster,tile,plain]){m.userData.architectureShared=true;cloudReceiver(m)}
function mesh(b:Bucket,material:THREE.Material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));if((material as THREE.MeshLambertMaterial).map)g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setIndex(b.indices);g.computeVertexNormals();g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.receiveShadow=true;return m}
// Clip a triangulated footprint to each roof plane, preserving concavities/holes.
function clip(poly:Point[],value:(p:Point)=>number){const out:Point[]=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],va=value(a),vb=value(b);if(va>=-1e-8)out.push(a);if((va>0&&vb<0)||(va<0&&vb>0)){const t=va/(va-vb);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t})}}return out}
function fineDetails(detail:Bucket,p:any,style:typeof POITOU){
 for(const o of p.openings){
  const panel=(dest:Bucket,x0:number,x1:number,y0:number,y1:number,inset:number,tint:number)=>{const v=(x:number,y:number)=>[o.x+o.ux*x-o.nx*inset,y,o.z+o.uz*x-o.nz*inset];quad(dest,[v(x0,y0),v(x1,y0),v(x1,y1),v(x0,y1)],tint)};
  const pos=(s:number,yy:number,inset:number)=>[o.x+o.ux*s-o.nx*inset,yy,o.z+o.uz*s-o.nz*inset];
  const w=o.width/2,y=o.bottom,h=o.height,window=o.kind==='window';
   const frame=0xe5d7ba,thick=.09;
   panel(detail,-w,-w+thick,y,y+h,.008,frame);panel(detail,w-thick,w,y,y+h,.008,frame);panel(detail,-w,w,y+h-.14,y+h,.006,frame);
   panel(detail,-w,w,y,y+.09,.004,frame);
   if(window){
    panel(detail,-.025,.025,y+.08,y+h-.12,.09,0xb7ad91);panel(detail,-w+.08,w-.08,y+h*.48,y+h*.48+.04,.09,0xb7ad91);
    // Leaves stay in the window recess; no shutters swing into the street.
    if(o.shutters){const sc=style.shutters[p.shutter];panel(detail,-w+.09,-w+.24,y+.10,y+h-.15,.05,sc);panel(detail,w-.24,w-.09,y+.10,y+h-.15,.05,sc);for(let yy=y+.28;yy<y+h-.15;yy+=.32){panel(detail,-w+.10,-w+.23,yy,yy+.025,.042,0x4f6258);panel(detail,w-.23,w-.10,yy,yy+.025,.042,0x4f6258)}}
    if(o.planter){
     // A small potted climber follows the recessed jamb, with no street projection.
     if((p.seed+o.edge)%3===0){panel(detail,-w+.19,-w+.21,y+.23,y+h-.2,.018,0x65754c);for(let j=0;j<4;j++){const yy=y+.35+j*.19,xx=-w+.20+(j%2?.045:-.045);panel(detail,xx-.045,xx+.045,yy,yy+.09,.012,0x6e824e)}}
     panel(detail,-w+.1,w-.1,y+.09,y+.23,.025,0x986f50);for(let j=0;j<4;j++){const x=-w+.16+j*(o.width-.32)/3;panel(detail,x-.07,x+.07,y+.22,y+.35+(j%2)*.08,.02,0x657a4c)}}
   }else{
    for(let j=1;j<5;j++){const x=-w+j*o.width/5;panel(detail,x,x+.015,y+.09,y+h-.15,.17,0x403c30)}
    panel(detail,w-.23,w-.16,y+.92,y+.98,.15,0xb5a17b);
    // Shallow threshold INSIDE the footprint, at the sampled ground level.
    quad(detail,[pos(-w,y,.01),pos(w,y,.01),pos(w,y,.18),pos(-w,y,.18)],0xc4b69b);
   }
 }
}
export class ArchitectureBatch{
 private cells=new Map<string,{shell:Bucket;render:Bucket;roof:Bucket;openings:Bucket;recipes:any[];x:number;z:number}>();
 private started=performance.now();private anchors:Array<{id:unknown;doors:unknown[]}>=[];private buildings=0;private openings=0;private inferred=0;private roofs=0;
 constructor(private scene:THREE.Object3D,private style=POITOU){}
 add(ring:Point[],tags:Record<string,unknown>,shared:Set<string>,ground:(x:number,z:number)=>number|null,holes:Point[][]=[]){
  const plan=buildingPlan(ring,tags,this.style,shared,ground);if(!plan)return;
  const p=plan,cellSize=this.style.cellSize,cx=Math.floor(ring[0].x/cellSize),cz=Math.floor(ring[0].z/cellSize),key=`${cx}:${cz}`;
  let cell=this.cells.get(key);if(!cell){cell={shell:bucket(),render:bucket(),roof:bucket(),openings:bucket(),recipes:[],x:(cx+.5)*cellSize,z:(cz+.5)*cellSize};this.cells.set(key,cell)}
  const {roof,openings}=cell,shell=(tags['building:material']==='plaster'||tags['building:material']==='render'||!tags['building:material']&&p.seed%3===0)?cell.render:cell.shell,wall=this.style.walls[p.wall],roofColor=(this.style.roofMaterials as Record<string,number>)[String(tags['roof:material'])]??this.style.roofs[p.roof];
  this.anchors.push({id:tags.osm_id??p.seed,doors:p.anchors});this.buildings++;this.inferred+=Number(p.inferred.height);this.openings+=p.openings.length;this.roofs+=Number(p.rise>0);
  const drawWall=(a:Point,b:Point,y0:number,y1:number)=>{if(y1<=y0)return;const l=Math.hypot(b.x-a.x,b.z-a.z);if(l<.001)return;const u0=(a.x*(b.x-a.x)+a.z*(b.z-a.z))/l/2.8,u1=u0+l/2.8;quad(shell,[[a.x,y0,a.z],[b.x,y0,b.z],[b.x,y1,b.z],[a.x,y1,a.z]],wall,[[u0,y0/1.4],[u1,y0/1.4],[u1,y1/1.4],[u0,y1/1.4]])};
  for(const edge of p.edges){
   const {a,b,length,index}=edge,ux=(b.x-a.x)/length,uz=(b.z-a.z)/length;
   const os=p.openings.filter((o:any)=>o.edge===index);
   // Divide into horizontal bands and cut actual holes; no opaque wall behind glass.
   const bands=[p.base,p.eaves,...os.flatMap((o:any)=>[o.bottom,o.bottom+o.height])].sort((a:number,b:number)=>a-b);
   for(let j=1;j<bands.length;j++){
    const low=bands[j-1],high=bands[j];if(high-low<.001)continue;
    const occupied=os.filter((o:any)=>o.bottom<high-.001&&o.bottom+o.height>low+.001).sort((a:any,b:any)=>a.s-b.s);
    let last=0;for(const o of occupied){const left=o.s-o.width/2;drawWall({x:a.x+ux*last,z:a.z+uz*last},{x:a.x+ux*left,z:a.z+uz*left},low,high);last=o.s+o.width/2}drawWall({x:a.x+ux*last,z:a.z+uz*last},b,low,high);
   }
   // Vertical stone gables meet the clipped roof exactly, also on skew footprints.
   const times=[0,1];
   for(let i=0;i<p.roofPlanes.length;i++)for(let j=i+1;j<p.roofPlanes.length;j++){
    const f=p.roofPlanes[i],g=p.roofPlanes[j],va=f(a)-g(a),vb=f(b)-g(b);
    if(va*vb<0)times.push(va/(va-vb));
   }
   times.sort((a,b)=>a-b);const cuts=times.map(t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}));
   for(let j=1;j<cuts.length;j++){const a=cuts[j-1],b=cuts[j];quad(shell,[[a.x,p.eaves,a.z],[b.x,p.eaves,b.z],[b.x,p.roofY(b),b.z],[a.x,p.roofY(a),a.z]],wall,[[0,p.eaves/1.4],[length/2.8,p.eaves/1.4],[length/2.8,p.roofY(b)/1.4],[0,p.roofY(a)/1.4]])}
  }
  for(const hole of holes)for(let i=0;i<hole.length;i++){
   const a=hole[i],b=hole[(i+1)%hole.length];drawWall(a,b,p.base,p.eaves);
   const times=[0,1];for(let j=0;j<p.roofPlanes.length;j++)for(let k=j+1;k<p.roofPlanes.length;k++){
    const f=p.roofPlanes[j],g=p.roofPlanes[k],va=f(a)-g(a),vb=f(b)-g(b);if(va*vb<0)times.push(va/(va-vb));
   }
   times.sort((a,b)=>a-b);const cuts=times.map(t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}));
   for(let j=1;j<cuts.length;j++){const c=cuts[j-1],d=cuts[j];quad(shell,[[c.x,p.eaves,c.z],[d.x,p.eaves,d.z],[d.x,p.roofY(d),d.z],[c.x,p.roofY(c),c.z]],wall)}
  }
  const contour=p.ring.map((q:Point)=>new THREE.Vector2(q.x,q.z));
  const holeVectors=holes.map(h=>h.map(q=>new THREE.Vector2(q.x,q.z)));
  const all=[...p.ring,...holes.flat()];const faces=THREE.ShapeUtils.triangulateShape(contour,holeVectors);
  for(const face of faces)for(let plane=0;plane<p.roofPlanes.length;plane++){
   let poly=face.map((i:number)=>all[i]);const f=p.roofPlanes[plane];
   for(let other=0;other<p.roofPlanes.length;other++)if(other!==plane){const g=p.roofPlanes[other];poly=clip(poly,q=>g(q)-f(q))}
   for(let i=2;i<poly.length;i++){const t=[poly[0],poly[i-1],poly[i]];triangle(roof,t.map(q=>[q.x,p.roofY(q),q.z]),roofColor,t.map(q=>[p.along(q)/2.56,p.across(q)/2.56]))}
  }
  for(const o of p.openings){
   const panel=(dest:Bucket,x0:number,x1:number,y0:number,y1:number,inset:number,tint:number)=>{
    const v=(x:number,y:number)=>[o.x+o.ux*x-o.nx*inset,y,o.z+o.uz*x-o.nz*inset];quad(dest,[v(x0,y0),v(x1,y0),v(x1,y1),v(x0,y1)],tint);
   };
   const w=o.width/2,y=o.bottom,h=o.height,window=o.kind==='window';
   panel(openings,-w,w,y,y+h,.18,window?0x374c4b:0x62503d);
   // Recess reveals close the wall thickness and keep the aperture dark from oblique views.
   const pos=(s:number,yy:number,inset:number)=>[o.x+o.ux*s-o.nx*inset,yy,o.z+o.uz*s-o.nz*inset];
   for(const [x0,x1,y0,y1] of [[-w,-w,y,y+h],[w,w,y,y+h],[-w,w,y+h,y+h],[-w,w,y,y]])quad(openings,[pos(x0,y0,0),pos(x1,y1,0),pos(x1,y1,.18),pos(x0,y0,.18)],0xbfb197);
  }
  cell.recipes.push({seed:p.seed,shutter:p.shutter,openings:p.openings});
  // Sparse chimney on a genuine roof interior point, never a new ground obstacle.
  if(p.rise>0&&p.seed%3===0&&faces.length){
   const f=faces[p.seed%faces.length],q=f.map((i:number)=>all[i]),center={x:(q[0].x+q[1].x+q[2].x)/3,z:(q[0].z+q[1].z+q[2].z)/3};
   const radius=.25;const safelyInside=p.edges.every((e:any)=>{const dx=e.b.x-e.a.x,dz=e.b.z-e.a.z,t=THREE.MathUtils.clamp(((center.x-e.a.x)*dx+(center.z-e.a.z)*dz)/(e.length*e.length),0,1);return Math.hypot(center.x-e.a.x-t*dx,center.z-e.a.z-t*dz)>.65});
   if(safelyInside&&holes.length===0){const y=p.roofY(center),points=[{x:center.x-radius,z:center.z-radius},{x:center.x+radius,z:center.z-radius},{x:center.x+radius,z:center.z+radius},{x:center.x-radius,z:center.z+radius}];const bottom=Math.min(...points.map(q=>p.roofY(q)))-.1,top=Math.min(p.top,Math.max(...points.map(q=>p.roofY(q)))+.8);for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4];quad(roof,[[a.x,bottom,a.z],[b.x,bottom,b.z],[b.x,top,b.z],[a.x,top,a.z]],0x97836e)}quad(roof,points.map(q=>[q.x,top,q.z]),0x665747)}
  }
 }
 finish(){let triangles=0,meshes=0;for(const cell of this.cells.values()){
  let openingMesh:THREE.Mesh|undefined;
  for(const [name,material] of [['shell',stone],['render',plaster],['roof',tile],['openings',plain]] as const){const b=cell[name];if(!b.p.length)continue;const m=mesh(b,material);m.name=`architecture-${name}`;this.scene.add(m);triangles+=b.indices.length/3;meshes++;if(name==='openings')openingMesh=m;}
  if(!cell.recipes.some(p=>p.openings.length))continue;
  // The factory retains compact recipes, never far-away decorative vertex arrays.
  const slot=new THREE.Group();slot.name='architecture-detail-cache';slot.userData.architectureDetail=true;slot.userData.architectureStyle=this.style;slot.userData.centerX=cell.x;slot.userData.centerZ=cell.z;slot.userData.openingMesh=openingMesh;
  const recipes=cell.recipes,base=cell.openings,style=this.style;
  slot.userData.create=()=>{const b:Bucket={p:base.p.slice(),uv:base.uv.slice(),c:base.c.slice(),indices:base.indices.slice()};for(const p of recipes)fineDetails(b,p,style);const m=mesh(b,plain);m.name='architecture-detail';slot.add(m);};slot.visible=false;this.scene.add(slot);
 }
 const stats={version:this.style.id,buildings:this.buildings,inferredHeights:this.inferred,pitchedRoofs:this.roofs,openings:this.openings,cells:this.cells.size,meshes,triangles,generationMs:performance.now()-this.started,builds:1};this.scene.userData.architecture=stats;this.scene.userData.architectureAnchors=this.anchors;this.cells.clear();return stats;
 }
}
export function updateArchitectureLOD(scene:THREE.Object3D,camera:THREE.Camera,low=false){
 const slots:THREE.Object3D[]=[],requests:any[]=[];const stream=scene.userData.decorationStream;scene.traverse(o=>{if(o.userData.architectureDetail)slots.push(o)});
 const distance=(o:THREE.Object3D)=>Math.hypot(Math.max(0,Math.abs(camera.position.x-o.userData.centerX)-o.userData.architectureStyle.cellSize/2),Math.max(0,Math.abs(camera.position.z-o.userData.centerZ)-o.userData.architectureStyle.cellSize/2));
 slots.sort((a,b)=>distance(a)-distance(b));let generated=0;
 for(const o of slots){const wanted=detailVisible(o.visible,distance(o),low,o.userData.architectureStyle);
  if(o.userData.prepared&&!o.children.length){if(distance(o)<(low?65:125)+(stream?.policy.prefetchM??48))requests.push({id:o.userData.prepared,priority:distance(o)-(wanted?1000:0),d:distance(o),wanted,install:(data:any)=>{const start=performance.now();const m=new THREE.Mesh(data.meshes[0].geometry,plain);m.name='architecture-detail';m.receiveShadow=true;o.add(m);o.userData.builds=(o.userData.builds??0)+1;o.userData.generationMs=(o.userData.generationMs??0)+performance.now()-start;}});}
  else if(wanted&&!o.children.length&&generated===0){const start=performance.now();o.userData.create();o.userData.builds=(o.userData.builds??0)+1;o.userData.generationMs=(o.userData.generationMs??0)+performance.now()-start;generated++;}
  o.visible=wanted&&o.children.length>0;if(o.userData.openingMesh)o.userData.openingMesh.visible=!o.visible;
 }
 if(stream){const reserve=[...slots.filter(o=>!o.visible&&o.children.length).map(o=>({id:o.userData.prepared,d:distance(o)})),...requests.filter(r=>!r.wanted)].sort((a,b)=>a.d-b.d).slice(0,12);const keep=new Set(reserve.map(r=>r.id));stream.want('architecture',requests.filter(r=>r.wanted||keep.has(r.id)));}
 // Keep at most twelve invisible cached cells. Required visible cells always win.
 let hidden=0;for(const o of slots){if(o.visible||!o.children.length)continue;if(++hidden<=12)continue;for(const child of [...o.children]){(child as THREE.Mesh).geometry.dispose();o.remove(child)}o.userData.evictions=(o.userData.evictions??0)+1;if(o.userData.prepared)stream?.release(o.userData.prepared);}
}
export function architectureMemory(scene:THREE.Object3D){let triangles=0,bytes=0,meshes=0,detailCells=0,detailBuilds=0,detailMs=0,evictions=0;
 scene.traverse(o=>{if(o.userData.architectureDetail){detailCells+=Number(o.children.length>0);detailBuilds+=o.userData.builds??0;detailMs+=o.userData.generationMs??0;evictions+=o.userData.evictions??0;}if(!(o instanceof THREE.Mesh)||!o.name.startsWith('architecture-'))return;const g=o.geometry;triangles+=(g.index?.count??g.attributes.position.count)/3;meshes++;for(const a of Object.values(g.attributes) as THREE.BufferAttribute[])bytes+=a.array.byteLength;bytes+=g.index?.array.byteLength??0;});return {triangles,bytes,meshes,detailCells,detailBuilds,detailMs,evictions};
}

// Hydrate the exact offline buffers. Regional materials/animation remain runtime
// resources; no facade planning, triangulation or normal computation on a walk.
export function installPreparedArchitecture(scene:THREE.Object3D,prepared:any){
 const start=performance.now(),meshes:THREE.Mesh[]=[];for(const r of prepared.static.meshes){const kind=r.name.slice('architecture-'.length),material=kind==='shell'?stone:kind==='render'?plaster:kind==='roof'?tile:plain;const m=new THREE.Mesh(r.geometry,material);m.receiveShadow=true;m.name=r.name;meshes.push(m);scene.add(m)}
 for(const r of prepared.manifest.architectureSlots){const slot=new THREE.Group();slot.name='architecture-detail-cache';Object.assign(slot.userData,{architectureDetail:true,architectureStyle:POITOU,centerX:r.x,centerZ:r.z,openingMesh:meshes[r.openingIndex],prepared:r.id});slot.visible=false;scene.add(slot)}
 scene.userData.architecture={...prepared.manifest.architectureStats,generationMs:performance.now()-start,builds:1};scene.userData.architectureAnchors=prepared.manifest.architectureAnchors;
}
