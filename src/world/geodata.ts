import * as THREE from 'three';
import { nature } from '../living/geography';
import { animateFoliage } from '../living/atmosphere';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toLocal } from './geo';
import { setBuildingFootprints } from './collisions';
import type { Terrain } from './terrain';
type Feature = { geometry?: { type: string; coordinates: unknown }; properties?: Record<string,unknown> };
type Collection = { type: string; features: Feature[] };
function coordsToPoints(coords: unknown, terrain?:Terrain): THREE.Vector3[] {
  if(!Array.isArray(coords)) return [];
  return coords.flatMap((p:unknown) => {
    if(!Array.isArray(p)||typeof p[0]!=='number'||typeof p[1]!=='number') return [];
    const v=toLocal({lon:p[0],lat:p[1]}); return [new THREE.Vector3(v.x,(terrain?.relativeHeight(v.x,v.z)??0)+0.12,v.z)];
  });
}
const LOCAL_LIMIT=1050;
// Shared materials avoid allocating thousands of identical GPU resources.
// Limestone, pale render and aged stone tones typical of the region.
const WALL_COLORS=[0xcab89d,0xd8c7ab,0xb8a991,0xe0d1b8,0xc4b69d,0xe1d5be,0xafa48e,0xd1bea2];
const WALL_MATERIALS=WALL_COLORS.map(color=>new THREE.MeshLambertMaterial({color}));
// Restrained regional roof palette; deterministic per footprint and GPU-shared.
const ROOF_COLORS=[0xa96049,0xb77559,0x995a49,0xb16a52,0x8d594b];
const FLAT_ROOF_MATERIALS=ROOF_COLORS.map(color=>new THREE.MeshLambertMaterial({color}));
const GABLE_ROOF_MATERIALS=ROOF_COLORS.map(color=>new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide}));
// Stylized facade details are illustrative, not surveyed OSM openings.
// Shared opaque materials allow them to join the existing building batches.
const WINDOW_MATERIAL=new THREE.MeshLambertMaterial({color:0x526b69,side:THREE.DoubleSide});
const DOOR_MATERIAL=new THREE.MeshLambertMaterial({color:0x725746,side:THREE.DoubleSide});
function addFacadeDetails(scene:THREE.Object3D,ring:THREE.Vector3[],base:number,wallHeight:number,sharedEdges:Set<string>,terrain?:Terrain):void{
  const corners=ring.slice();
  if(corners.length>1&&corners[0].distanceTo(corners[corners.length-1])<.01)corners.pop();
  if(corners.length<3||corners.length>24||wallHeight<3.6)return;
  const centerX=corners.reduce((s,p)=>s+p.x,0)/corners.length;
  const centerZ=corners.reduce((s,p)=>s+p.z,0)/corners.length;
  const windows:number[]=[],doors:number[]=[];
  const emit=(dest:number[],ax:number,az:number,bx:number,bz:number,y0:number,y1:number)=>{
    dest.push(ax,y0,az,bx,y0,bz,bx,y1,bz,ax,y0,az,bx,y1,bz,ax,y1,az);
  };
  const hash=(n:number)=>{n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return (n^(n>>>16))>>>0;};
  const seed=hash(Math.round(centerX*10)^Math.imul(Math.round(centerZ*10),31));
  let doorPlaced=false;
  for(let i=0;i<corners.length;i++){
    const a=corners[i],b=corners[(i+1)%corners.length];
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    if(length<5||length>65||sharedEdges.has(facadeEdgeKey(a,b)))continue;
    const nx=-dz/length,nz=dx/length;
    const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
    const outward=(nx*(mx-centerX)+nz*(mz-centerZ)>=0)?1:-1;
    const ox=nx*outward*.09,oz=nz*outward*.09;
    const variant=hash(seed^Math.imul(i+1,7919));
    const levels=Math.min(3,Math.max(1,Math.floor(wallHeight/3.1)));
    const count=Math.min(5,Math.floor(length/(3.7+(variant%4)*.35)));
    const width=[.36,.43,.5,.58][variant%4];
    const windowHeight=[.85,1.05,1.2][(variant>>>4)%3];
    const shift=((variant>>>8)%7-3)*.035;
    for(let level=0;level<levels;level++){
      const sill=base+1.35+level*3.1;
      if(sill+windowHeight>base+wallHeight-.55)continue;
      for(let j=0;j<count;j++){
        // A little asymmetry, but keep each opening safely within its wall.
        const t=THREE.MathUtils.clamp((j+1)/(count+1)+shift,.1,.9);
        const cx=a.x+dx*t+ox,cz=a.z+dz*t+oz;
        const ux=dx/length*width,uz=dz/length*width;
        const ground=terrain?.relativeHeight(cx,cz);
        // The DEM can climb above the building's level foundation.
        // Never draw an opening buried in that hillside.
        if(ground!==null&&ground!==undefined&&sill<ground+.45)continue;
        emit(windows,cx-ux,cz-uz,cx+ux,cz+uz,sill,sill+windowHeight);
      }
    }
    if(!doorPlaced&&length>=7){
      const t=.42+((variant>>>12)%5)*.04;
      const cx=a.x+dx*t+ox*1.2,cz=a.z+dz*t+oz*1.2;
      const ux=dx/length*.55,uz=dz/length*.55;
      const ground=terrain?.relativeHeight(cx,cz);
      // An entrance belongs near accessible ground, not beneath the slope.
      if(ground===null||ground===undefined||Math.abs(ground-base)<.8){
        emit(doors,cx-ux,cz-uz,cx+ux,cz+uz,base+.12,base+2.25);
        doorPlaced=true;
      }
    }
  }
  for(const [vertices,material] of [[windows,WINDOW_MATERIAL],[doors,DOOR_MATERIAL]] as const){
    if(!vertices.length)continue;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,material);
    mesh.castShadow=false;scene.add(mesh);
  }
}
// Quantized undirected OSM footprint edges: suppress illustrative openings on
// walls shared exactly by two mapped building polygons.
function facadeEdgeKey(a:THREE.Vector3,b:THREE.Vector3):string{
  const p=`${Math.round(a.x*10)},${Math.round(a.z*10)}`;
  const q=`${Math.round(b.x*10)},${Math.round(b.z*10)}`;
  return p<q?`${p}|${q}`:`${q}|${p}`;
}
function sharedBuildingEdges(features:Feature[]):Set<string>{
  const counts=new Map<string,number>();
  for(const feature of features){
    if(!feature.properties?.building||feature.geometry?.type!=='Polygon'||!Array.isArray(feature.geometry.coordinates))continue;
    const points=coordsToPoints(feature.geometry.coordinates[0]);
    if(points.length<3||!points.some(insideArea))continue;
    const ring=points.length>1&&points[0].distanceTo(points[points.length-1])<.01?points.slice(0,-1):points;
    for(let i=0;i<ring.length;i++){
      const key=facadeEdgeKey(ring[i],ring[(i+1)%ring.length]);
      counts.set(key,(counts.get(key)??0)+1);
    }
  }
  return new Set([...counts].filter(([,count])=>count>1).map(([key])=>key));
}
const ROAD_MATERIAL=new THREE.MeshLambertMaterial({color:0xbda68b,side:THREE.DoubleSide});
const RIVER_MATERIAL=new THREE.MeshLambertMaterial({color:0x729ea8,side:THREE.DoubleSide});
const WATER_MATERIAL=new THREE.MeshLambertMaterial({color:0x739da8,side:THREE.DoubleSide});
const WOOD_MATERIAL=new THREE.MeshLambertMaterial({color:0x557b4d,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const SCRUB_MATERIAL=new THREE.MeshLambertMaterial({color:0x7f9964,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const PARK_MATERIAL=new THREE.MeshLambertMaterial({color:0x94ae7b,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function insideArea(p:THREE.Vector3){return Math.abs(p.x)<=LOCAL_LIMIT&&Math.abs(p.z)<=LOCAL_LIMIT;}
function addLine(scene:THREE.Object3D,points:THREE.Vector3[],width:number,color:number,terrain?:Terrain){
  if(points.length<2)return;
  // One draw call per road/river, not one mesh per OSM segment.
  // Densify long segments so the road follows the elevation grid.
  const vertices:number[]=[];
  for(let i=1;i<points.length;i++){
    const start=points[i-1],end=points[i];
    const length=Math.hypot(end.x-start.x,end.z-start.z);
    if(length<.05)continue;
    const pieces=terrain?Math.min(120,Math.ceil(length/8)):1;
    for(let part=0;part<pieces;part++){
      const t0=part/pieces,t1=(part+1)/pieces;
      const a=start.clone().lerp(end,t0),b=start.clone().lerp(end,t1);
      // Ignore geometry outside the currently supported 2 km pilot area.
      if(!insideArea(a)&&!insideArea(b))continue;
      if(terrain){
        a.y=(terrain.relativeHeight(a.x,a.z)??a.y)+.19;
        b.y=(terrain.relativeHeight(b.x,b.z)??b.y)+.19;
      }else{a.y=.19;b.y=.19;}
      const dx=b.x-a.x,dz=b.z-a.z,segment=Math.hypot(dx,dz);
      if(segment<.01)continue;
      const nx=-dz/segment*width/2,nz=dx/segment*width/2;
      vertices.push(
        a.x+nx,a.y,a.z+nz,a.x-nx,a.y,a.z-nz,b.x+nx,b.y,b.z+nz,
        b.x+nx,b.y,b.z+nz,a.x-nx,a.y,a.z-nz,b.x-nx,b.y,b.z-nz
      );
    }
  }
  if(!vertices.length)return;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,color===0x729ea8?RIVER_MATERIAL:ROAD_MATERIAL);
  mesh.receiveShadow=true;scene.add(mesh);
}
// Historic OSM outlines are survey data; wall heights are deliberately
// illustrative until a verified height or architectural model is available.
const HISTORIC_WALL_MATERIAL=new THREE.MeshLambertMaterial({color:0xb8ad96});
function addHistoricWall(scene:THREE.Object3D,points:THREE.Vector3[],terrain?:Terrain,castle=false):void{
  // Only OSM-surveyed linework determines the wall plan. The fragmented
  // elevations below are illustrative and must not imply measured ruin heights.
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    if(!insideArea(a)&&!insideArea(b))continue;
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    if(length<.5||length>150)continue;
    const pieces=Math.max(1,Math.ceil(length/5));
    for(let j=0;j<pieces;j++){
      const t0=j/pieces,t1=(j+1)/pieces;
      const midT=(t0+t1)/2;
      const x=a.x+dx*midT,z=a.z+dz*midT;
      const ground=terrain?.relativeHeight(x,z)??(a.y+b.y)/2;
      // Fixed hash: no animated/random changes between page loads.
      const seed=Math.abs(Math.sin(x*12.9898+z*78.233)*43758.5453);
      const fraction=seed-Math.floor(seed);
      // Castle silhouettes rise above their curtain walls, as in the
      // supplied Angles-sur-l'Anglin reference photos. Heights remain
      // illustrative; only the OSM footprint is geographically anchored.
      // A few tall fragments are deliberately separated by lower ruins.
      const height=castle
        ? (fraction>.88?11+fraction*6:fraction<.18?2.1+fraction*5:4.5+fraction*4)
        : 2.3+fraction*2.8;
      const segmentLength=length/pieces;
      const geometry=new THREE.BoxGeometry(segmentLength+.04,height,1.25);
      const mesh=new THREE.Mesh(geometry,HISTORIC_WALL_MATERIAL);
      mesh.position.set(x,ground+height/2-.12,z);
      mesh.rotation.y=-Math.atan2(dz,dx);
      mesh.receiveShadow=true;scene.add(mesh);
    }
  }
}
function measuredMetres(value:unknown):number|null{
  if(typeof value!=='string'&&typeof value!=='number')return null;
  const text=String(value).trim().replace(',','.');
  // OSM height tags can be "8", "8 m" or "8.5m". Reject ambiguous units.
  if(!/^\d+(?:\.\d+)?\s*(?:m)?$/i.test(text))return null;
  const metres=Number.parseFloat(text);
  return Number.isFinite(metres)?metres:null;
}
function buildingHeight(tags:Record<string,unknown>):number{
  const explicit=measuredMetres(tags.height);
  if(explicit!==null&&explicit>=2&&explicit<=80)return explicit;
  const levels=Number(tags['building:levels']);
  if(Number.isFinite(levels)&&levels>=1&&levels<=20)return levels*3.1;
  // Illustrative fallback only when OSM has no usable height information.
  return 7;
}
function roofRise(tags:Record<string,unknown>,buildingHeightMetres:number):number|null{
  const height=measuredMetres(tags['roof:height']);
  if(height!==null&&height>=.3&&height<=12)return Math.min(height,buildingHeightMetres*.85);
  const levels=Number(tags['roof:levels']);
  if(Number.isFinite(levels)&&levels>=1&&levels<=3)return Math.min(levels*2.5,buildingHeightMetres*.85);
  return null;
}
function makeFootprint(ring:THREE.Vector3[]):THREE.Shape{
  const shape=new THREE.Shape();
  ring.forEach((p,i)=>i===0?shape.moveTo(p.x,-p.z):shape.lineTo(p.x,-p.z));
  return shape;
}
// A conservative gable roof for verified rectangular footprints only.
// Complex footprints keep their flat cap rather than inventing inaccurate geometry.
function addGableRoof(scene:THREE.Object3D,ring:THREE.Vector3[],top:number,height:number,material:THREE.Material,explicitRise:number|null){
  const corners=ring.slice();
  if(corners.length>4 && corners[0].distanceTo(corners[corners.length-1])<.01)corners.pop();
  if(corners.length!==4)return;
  const edges=corners.map((p,i)=>corners[(i+1)%4].clone().sub(p));
  const lengths=edges.map(e=>Math.hypot(e.x,e.z));
  if(lengths.some(l=>l<3)||Math.max(...lengths)>90)return;
  const dot=(i:number)=>Math.abs((edges[i].x*edges[(i+1)%4].x+edges[i].z*edges[(i+1)%4].z)/(lengths[i]*lengths[(i+1)%4]));
  if([0,1,2,3].some(i=>dot(i)>.18))return;
  if(Math.abs(lengths[0]-lengths[2])>Math.max(1,lengths[0]*.12)||Math.abs(lengths[1]-lengths[3])>Math.max(1,lengths[1]*.12))return;
  const ridgeHeight=explicitRise??Math.min(4,Math.max(1.2,Math.min(...lengths)*.23),height*.45);
  // Ridge runs parallel to the longer side of the rectangle.
  const shortSide=lengths[0]<lengths[1]?0:1;
  const a=corners[shortSide],b=corners[(shortSide+1)%4],d=corners[(shortSide+3)%4],cc=corners[(shortSide+2)%4];
  const mid=(p:THREE.Vector3,q:THREE.Vector3)=>new THREE.Vector3((p.x+q.x)/2,top+ridgeHeight,(p.z+q.z)/2);
  const r0=mid(a,b),r1=mid(d,cc);
  const vertex=(p:THREE.Vector3)=>[p.x,p.y,p.z];
  const atTop=(p:THREE.Vector3)=>new THREE.Vector3(p.x,top,p.z);
  const a0=atTop(a),b0=atTop(b),c0=atTop(cc),d0=atTop(d);
  const vertices=[
    ...vertex(a0),...vertex(d0),...vertex(r1),
    ...vertex(a0),...vertex(r1),...vertex(r0),
    ...vertex(b0),...vertex(r0),...vertex(r1),
    ...vertex(b0),...vertex(r1),...vertex(c0),
    ...vertex(a0),...vertex(r0),...vertex(b0),
    ...vertex(d0),...vertex(c0),...vertex(r1),
  ];
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  const roof=new THREE.Mesh(geometry,material);
  roof.castShadow=false;roof.receiveShadow=true;scene.add(roof);
}
// Four-sided pyramidal roof only when explicitly mapped in OSM.
// All corners meet a single apex; no extra geometry is invented for other shapes.
function addPyramidalRoof(scene:THREE.Object3D,ring:THREE.Vector3[],top:number,height:number,material:THREE.Material,explicitRise:number|null):void{
  const corners=ring.slice();
  if(corners.length>4&&corners[0].distanceTo(corners[corners.length-1])<.01)corners.pop();
  if(corners.length!==4)return;
  const edges=corners.map((p,i)=>Math.hypot(p.x-corners[(i+1)%4].x,p.z-corners[(i+1)%4].z));
  if(edges.some(length=>length<3||length>90))return;
  const centerX=corners.reduce((sum,p)=>sum+p.x,0)/4;
  const centerZ=corners.reduce((sum,p)=>sum+p.z,0)/4;
  const rise=explicitRise??Math.min(4,Math.max(1.2,Math.min(...edges)*.3),height*.45);
  const vertices:number[]=[];
  for(let i=0;i<4;i++){
    const a=corners[i],b=corners[(i+1)%4];
    vertices.push(a.x,top,a.z,b.x,top,b.z,centerX,top+rise,centerZ);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  const roof=new THREE.Mesh(geometry,material);
  roof.castShadow=false;roof.receiveShadow=true;
  scene.add(roof);
}
// Drape mapped land-cover polygons onto the DEM. Subdivide their triangles
// before sampling so large forest polygons do not cut through valley slopes.
function drapedCover(ring:THREE.Vector3[],terrain:Terrain|undefined,material:THREE.Material,holes:THREE.Vector3[][]=[],offset=.35):THREE.Mesh{
  const shape=makeFootprint(ring);
  // OSM interior rings are genuine clearings: don't paint over them.
  for(const hole of holes){
    if(hole.length<4)continue;
    const path=new THREE.Path();
    hole.forEach((p,i)=>i===0?path.moveTo(p.x,-p.z):path.lineTo(p.x,-p.z));
    shape.holes.push(path);
  }
  const flat=new THREE.ShapeGeometry(shape);
  const position=flat.getAttribute('position');
  const index=flat.getIndex();
  const vertices:number[]=[];
  const emit=(x:number,z:number)=>{
    const h=terrain?.relativeHeight(x,z)??0;
    vertices.push(x,h+offset,z);
  };
  const triangle=(a:[number,number],b:[number,number],c:[number,number],depth:number):void=>{
    const ab=Math.hypot(a[0]-b[0],a[1]-b[1]);
    const bc=Math.hypot(b[0]-c[0],b[1]-c[1]);
    const ca=Math.hypot(c[0]-a[0],c[1]-a[1]);
    if(terrain && depth<5 && Math.max(ab,bc,ca)>20){
      const m=(p:[number,number],q:[number,number]):[number,number]=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
      const abm=m(a,b),bcm=m(b,c),cam=m(c,a);
      triangle(a,abm,cam,depth+1);
      triangle(abm,b,bcm,depth+1);
      triangle(cam,bcm,c,depth+1);
      triangle(abm,bcm,cam,depth+1);
    }else{emit(...a);emit(...b);emit(...c);}
  };
  const point=(i:number):[number,number]=>[position.getX(i),-position.getY(i)];
  const triangles=index?index.count:position.count;
  for(let i=0;i+2<triangles;i+=3){
    const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,d=index?index.getX(i+2):i+2;
    triangle(point(a),point(b),point(d),0);
  }
  flat.dispose();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);
  mesh.receiveShadow=true;
  return mesh;
}
// Trees are placed only where OSM explicitly maps a tree.
// Instancing keeps hundreds of trees to two draw calls.
function pointInRing(x:number,z:number,ring:THREE.Vector3[]):boolean{
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a.z>z)!==(b.z>z) && x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }
  return inside;
}
function addMappedTrees(scene:THREE.Object3D,features:Feature[],terrain?:Terrain):number{
  const points:THREE.Vector3[]=[];
  // Precompute obstacles so generated trees cannot grow through mapped houses.
  // Only procedural trees are excluded; explicitly mapped OSM trees remain.
  const buildings:{ring:THREE.Vector3[];minX:number;maxX:number;minZ:number;maxZ:number}[]=[];
  for(const feature of features){
    if(feature.geometry?.type!=='Polygon'||!feature.properties?.building)continue;
    const coordinates=feature.geometry.coordinates;
    if(!Array.isArray(coordinates))continue;
    const ring=coordsToPoints(coordinates[0]);
    if(ring.length>=4)buildings.push({ring,minX:Math.min(...ring.map(p=>p.x))-2,maxX:Math.max(...ring.map(p=>p.x))+2,minZ:Math.min(...ring.map(p=>p.z))-2,maxZ:Math.max(...ring.map(p=>p.z))+2});
  }
  const clearOfBuildings=(x:number,z:number):boolean=>!buildings.some(b=>
    x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ&&pointInRing(x,z,b.ring));
  // Keep generated woodland clear of mapped roads and paths. Real OSM
  // tree points are never moved or discarded by this illustrative rule.
  const paths:{ax:number;az:number;dx:number;dz:number;lengthSq:number;minX:number;maxX:number;minZ:number;maxZ:number;clearanceSq:number}[]=[];
  for(const feature of features){
    if(feature.geometry?.type!=='LineString'||!feature.properties?.highway)continue;
    const coordinates=feature.geometry.coordinates;
    const line=coordsToPoints(coordinates);
    const highway=String(feature.properties.highway);
    const clearance=['footway','path','track','steps','pedestrian'].includes(highway)?2.5:4.5;
    for(let i=1;i<line.length;i++){
      const a=line[i-1],b=line[i],dx=b.x-a.x,dz=b.z-a.z;
      const lengthSq=dx*dx+dz*dz;
      if(lengthSq<.01)continue;
      paths.push({ax:a.x,az:a.z,dx,dz,lengthSq,
        minX:Math.min(a.x,b.x)-clearance,maxX:Math.max(a.x,b.x)+clearance,
        minZ:Math.min(a.z,b.z)-clearance,maxZ:Math.max(a.z,b.z)+clearance,
        clearanceSq:clearance*clearance});
    }
  }
  const clearOfPaths=(x:number,z:number):boolean=>!paths.some(p=>{
    if(x<p.minX||x>p.maxX||z<p.minZ||z>p.maxZ)return false;
    const t=THREE.MathUtils.clamp(((x-p.ax)*p.dx+(z-p.az)*p.dz)/p.lengthSq,0,1);
    const ox=x-(p.ax+t*p.dx),oz=z-(p.az+t*p.dz);
    return ox*ox+oz*oz<p.clearanceSq;
  });
  const add=(x:number,z:number)=>{
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>980||Math.abs(z)>980||points.length>=2500)return;
    const h=terrain?.relativeHeight(x,z);
    if(terrain && h===null)return;
    points.push(new THREE.Vector3(x,h??0,z));
  };
  for(const feature of features){
    const tags=feature.properties??{};
    if(feature.geometry?.type==='Point'&&tags.natural==='tree'){
      const coords=feature.geometry.coordinates;
      if(Array.isArray(coords)&&typeof coords[0]==='number'&&typeof coords[1]==='number'){
        const p=toLocal({lon:coords[0],lat:coords[1]});
        add(p.x,p.z);
      }
    }
    // The forest footprint is mapped, but individual tree positions are
    // illustrative. Deterministic 14 m spacing avoids flicker and GPU spikes.
    if(feature.geometry?.type==='Polygon' &&
       (tags.natural==='wood'||tags.landuse==='forest'||tags.landuse==='orchard')){
      const coords=feature.geometry.coordinates;
      if(!Array.isArray(coords))continue;
      const ring=coordsToPoints(coords[0]);
      if(ring.length<4)continue;
      const holes=coords.slice(1).map(hole=>coordsToPoints(hole)).filter(hole=>hole.length>=4);
      const minX=Math.max(-980,Math.min(...ring.map(p=>p.x)));
      const maxX=Math.min(980,Math.max(...ring.map(p=>p.x)));
      const minZ=Math.max(-980,Math.min(...ring.map(p=>p.z)));
      const maxZ=Math.min(980,Math.max(...ring.map(p=>p.z)));
      const spacing=tags.landuse==='orchard'?16:14;
      for(let z=Math.ceil(minZ/spacing)*spacing;z<=maxZ && points.length<2500;z+=spacing)
        for(let x=Math.ceil(minX/spacing)*spacing;x<=maxX && points.length<2500;x+=spacing){
          const seed=Math.sin(x*12.9898+z*78.233)*43758.5453;
          const jitter=(seed-Math.floor(seed)-.5)*spacing*.55;
          const px=x+jitter,pz=z+jitter*.7;
          if(pointInRing(px,pz,ring)&&!holes.some(hole=>pointInRing(px,pz,hole))&&clearOfBuildings(px,pz)&&clearOfPaths(px,pz))add(px,pz);
        }
    }
  }
  // Sparse illustrative vegetation inside mapped castle/ruin polygons.
  // The historic boundary is factual OSM data; individual trees are NOT.
  // Keep the courtyard predominantly open, avoid buildings and paths, and
  // leave a buffer from the perimeter so crowns don't swallow the ruins.
  const distanceToRing=(x:number,z:number,ring:THREE.Vector3[]):number=>{
    let nearest=Infinity;
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];
      const dx=b.x-a.x,dz=b.z-a.z,denom=dx*dx+dz*dz;
      if(denom<.001)continue;
      const t=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/denom,0,1);
      nearest=Math.min(nearest,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
    }
    return nearest;
  };
  for(const feature of features){
    const tags=feature.properties??{};
    if(feature.geometry?.type!=='Polygon'||!['castle','ruins'].includes(String(tags.historic)))continue;
    const coordinates=feature.geometry.coordinates;
    if(!Array.isArray(coordinates))continue;
    const ring=coordsToPoints(coordinates[0]);
    if(ring.length<4)continue;
    const holes=coordinates.slice(1).map(h=>coordsToPoints(h)).filter(h=>h.length>=4);
    const minX=Math.max(-970,Math.min(...ring.map(p=>p.x)));
    const maxX=Math.min(970,Math.max(...ring.map(p=>p.x)));
    const minZ=Math.max(-970,Math.min(...ring.map(p=>p.z)));
    const maxZ=Math.min(970,Math.max(...ring.map(p=>p.z)));
    const initial=points.length;
    const spacing=13;
    for(let z=Math.ceil(minZ/spacing)*spacing;z<=maxZ&&points.length-initial<32&&points.length<2500;z+=spacing){
      for(let x=Math.ceil(minX/spacing)*spacing;x<=maxX&&points.length-initial<32&&points.length<2500;x+=spacing){
        const noise=Math.sin(x*3.17+z*5.93)*18473.27;
        const fraction=noise-Math.floor(noise);
        if(fraction>.27)continue;
        const px=x+(fraction-.14)*9,pz=z+(fraction-.14)*6;
        if(!pointInRing(px,pz,ring)||holes.some(h=>pointInRing(px,pz,h)))continue;
        if(distanceToRing(px,pz,ring)<6||!clearOfBuildings(px,pz)||!clearOfPaths(px,pz))continue;
        add(px,pz);
      }
    }
  }
  // Riparian vegetation: mapped OSM river centerlines establish the corridor,
  // while individual bank trees are explicitly illustrative. Place them on
  // both sides, not in the water, and keep paths and houses unobstructed.
  // Do not use a second ground overlay: it caused terrain z-fighting.
  const riparianSegments:THREE.Vector3[][]=[];
  for(const feature of features){
    if(feature.geometry?.type!=='LineString'||feature.properties?.waterway!=='river')continue;
    const line=coordsToPoints(feature.geometry.coordinates);
    if(line.length>1)riparianSegments.push(line);
  }
  const nearExisting=(x:number,z:number)=>points.some(p=>
    Math.abs(p.x-x)<9&&Math.abs(p.z-z)<9&&Math.hypot(p.x-x,p.z-z)<9);
  for(const line of riparianSegments){
    for(let i=1;i<line.length&&points.length<2500;i++){
      const a=line[i-1],b=line[i];
      const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
      if(length<2)continue;
      const nx=-dz/length,nz=dx/length;
      const steps=Math.max(1,Math.ceil(length/26));
      for(let j=0;j<steps&&points.length<2500;j++){
        const t=(j+.5)/steps;
        const centerX=a.x+dx*t,centerZ=a.z+dz*t;
        for(const side of [-1,1]){
          if(points.length>=2500)break;
          const noise=Math.sin(centerX*1.37+centerZ*2.91+side*7.3)*17317.13;
          const fraction=noise-Math.floor(noise);
          // Deliberately sparse to preserve open views of the Anglin.
          if(fraction>.68)continue;
          const distance=12+fraction*18;
          const x=centerX+nx*side*distance,z=centerZ+nz*side*distance;
          if(!clearOfBuildings(x,z)||!clearOfPaths(x,z)||nearExisting(x,z))continue;
          add(x,z);
        }
      }
    }
  }
  if(!points.length)return 0;
  // Bird and sound anchors follow actual rendered vegetation, including clearly
  // illustrative riparian/woodland trees when OSM has no individual tree points.
  nature.push(...points.map(p=>({x:p.x,z:p.z})));
  // Partition instances into spatial cells. Distant cells hide trunks,
  // then crowns; no per-frame instance matrix rebuild is necessary.
  const cellSize=180;
  const cells=new Map<string,THREE.Vector3[]>();
  for(const p of points){
    const cx=Math.floor(p.x/cellSize),cz=Math.floor(p.z/cellSize);
    const key=`${cx}:${cz}`;
    if(!cells.has(key))cells.set(key,[]);
    cells.get(key)!.push(p);
  }
  const trunkGeometry=new THREE.CylinderGeometry(.25,.38,3.5,5);
  // Angles-sur-l'Anglin is dominated by broadleaf trees along the Anglin.
  // A faceted, rounded canopy is a better regional silhouette than a uniform
  // plantation of conifers. Still one instanced mesh and one draw call per cell.
  const crownGeometry=new THREE.IcosahedronGeometry(1,1);
  crownGeometry.scale(2.8,3.1,2.8);
  // Low, faceted undergrowth: restrained clusters near some mapped woodland
  // trees. Their exact positions are illustrative, never OSM-surveyed shrubs.
  const shrubGeometry=new THREE.IcosahedronGeometry(1,0);
  const shrubMaterial=new THREE.MeshLambertMaterial({color:0xffffff});
  const shrubPalette=[0x557b4b,0x658455,0x758c57,0x496c48].map(v=>new THREE.Color(v));
  const trunkMaterial=new THREE.MeshLambertMaterial({color:0x76614b});
  const crownMaterial=new THREE.MeshLambertMaterial({color:0xffffff});
  const foliagePalette=[0x486e47,0x587d4f,0x6b8958,0x426a4b,0x79905b].map(color=>new THREE.Color(color));
  const dummy=new THREE.Object3D();
  for(const [key,cellPoints] of cells){
    const [cx,cz]=key.split(':').map(Number);
    const group=new THREE.Group();
    group.userData.vegetationCell=true;
    group.userData.centerX=(cx+.5)*cellSize;
    group.userData.centerZ=(cz+.5)*cellSize;
    // Per-cell materials allow a smooth distance fade without rebuilding instances.
    const trunkCellMaterial=trunkMaterial.clone();
    const crownCellMaterial=crownMaterial.clone();
    animateFoliage(crownCellMaterial);
    // Opaque foliage writes depth normally: no ground bleeding through crowns.
    const trunks=new THREE.InstancedMesh(trunkGeometry,trunkCellMaterial,cellPoints.length);
    const crowns=new THREE.InstancedMesh(crownGeometry,crownCellMaterial,cellPoints.length);
    const shrubPoints=cellPoints.filter(p=>{
      const v=Math.sin(p.x*7.41+p.z*4.67)*13931.77;
      return v-Math.floor(v)<.32;
    });
    const shrubs=new THREE.InstancedMesh(shrubGeometry,shrubMaterial,shrubPoints.length);
    cellPoints.forEach((p,i)=>{
      const seed=Math.sin(p.x*12.9898+p.z*78.233)*43758.5453;
      const scale=.8+(seed-Math.floor(seed))*.45;
      const variation=Math.sin(p.x*5.73+p.z*3.19)*19341.91;
      const fraction=variation-Math.floor(variation);
      const width=.76+fraction*.5;
      const height=.85+(1-fraction)*.4;
      dummy.scale.set(.9*scale,scale*height,.9*scale);
      dummy.position.set(p.x,p.y+1.75*scale*height,p.z);
      dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
      dummy.scale.set(scale*width,scale*height,scale*width);
      dummy.position.set(p.x,p.y+5.05*scale*height,p.z);
      dummy.rotation.y=fraction*Math.PI*2;
      dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
      dummy.rotation.y=0;
      crowns.setColorAt(i,foliagePalette[Math.min(foliagePalette.length-1,Math.floor(fraction*foliagePalette.length))]);
    });
    shrubPoints.forEach((p,i)=>{
      const v=Math.sin(p.x*3.71-p.z*8.13)*29513.17;
      const t=v-Math.floor(v);
      const angle=t*Math.PI*2;
      const radius=1.6+t*1.4;
      const sx=p.x+Math.cos(angle)*radius,sz=p.z+Math.sin(angle)*radius;
      const ground=terrain?.relativeHeight(sx,sz)??p.y;
      const size=.65+t*.7;
      dummy.position.set(sx,ground+.55*size,sz);
      dummy.scale.set(size*1.5,size*.8,size*1.3);
      dummy.rotation.y=angle;
      dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);
      shrubs.setColorAt(i,shrubPalette[Math.floor(t*shrubPalette.length)]);
    });
    dummy.rotation.y=0;
    shrubs.instanceMatrix.needsUpdate=true;
    if(shrubs.instanceColor)shrubs.instanceColor.needsUpdate=true;
    trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;
    if(crowns.instanceColor)crowns.instanceColor.needsUpdate=true;
    trunks.castShadow=false;crowns.castShadow=false;
    trunks.frustumCulled=false;crowns.frustumCulled=false;
    shrubs.castShadow=false;shrubs.frustumCulled=false;
    group.add(trunks,crowns,shrubs);
    scene.add(group);
  }
  return points.length;
}
// Distance culling is conservative and hysteretic. No transparent foliage:
// transparency made the underlying terrain appear/disappear while orbiting.
export function updateVegetationLOD(scene:THREE.Object3D,camera:THREE.Camera):void{
  scene.traverse(object=>{
    if(!object.userData.vegetationCell)return;
    const x=object.userData.centerX as number,z=object.userData.centerZ as number;
    const distance=Math.hypot(camera.position.x-x,camera.position.z-z);
    const trunks=object.children[0] as THREE.InstancedMesh;
    const crowns=object.children[1] as THREE.InstancedMesh;
    // Preserve distant forests in the aerial view; opaque depth-tested trees
    // do not cause the former competing-ground z-fighting.
    trunks.visible=trunks.visible?distance<650:distance<620;
    crowns.visible=crowns.visible?distance<1050:distance<1020;
    const shrubs=object.children[2] as THREE.InstancedMesh|undefined;
    if(shrubs)shrubs.visible=shrubs.visible?distance<480:distance<450;
  });
}
// Merge the many separate road/river meshes into one mesh per material.
// This cuts draw calls without altering the OSM linework or its DEM heights.
function batchLinearFeatures(scene:THREE.Object3D):void{
  for(const material of [ROAD_MATERIAL,RIVER_MATERIAL]){
    const meshes=scene.children.filter((child):child is THREE.Mesh=>
      child instanceof THREE.Mesh && child.material===material);
    if(meshes.length<2)continue;
    const merged=mergeGeometries(meshes.map(mesh=>mesh.geometry),false);
    if(!merged)continue;
    for(const mesh of meshes){scene.remove(mesh);mesh.geometry.dispose();}
    const combined=new THREE.Mesh(merged,material);
    combined.receiveShadow=true;
    scene.add(combined);
  }
}
// Merge building surfaces by actual material, including the two material
// groups of ExtrudeGeometry. Keeping separate groups would retain draw calls.
function batchBuildings(scene:THREE.Object3D):void{
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const originals:THREE.Mesh[]=[];
  const materials:THREE.Material[]=[...FLAT_ROOF_MATERIALS,...WALL_MATERIALS,...GABLE_ROOF_MATERIALS,WINDOW_MATERIAL,DOOR_MATERIAL];
  const disposeTemporary=()=>{for(const geometries of buckets.values())for(const geometry of geometries)geometry.dispose();};
  try{
    for(const child of scene.children){
      if(!(child instanceof THREE.Mesh))continue;
      const assigned=Array.isArray(child.material)?child.material:[child.material];
      if(!assigned.every(material=>materials.includes(material)))continue;
      const source=child.geometry;
      const expanded=source.index?source.toNonIndexed():source.clone();
      try{
        const position=expanded.getAttribute('position');
        const normal=expanded.getAttribute('normal');
        if(!position||!normal)throw new Error('Building missing positions or normals');
        const groups=expanded.groups.length?expanded.groups:[{start:0,count:position.count,materialIndex:0}];
        for(const group of groups){
          const material=assigned[group.materialIndex];
          if(!material||group.start<0||group.count<0||group.start+group.count>position.count||group.count%3!==0)
            throw new Error('Invalid building material group');
          if(group.count===0)continue;
          const positions=new Float32Array(group.count*3);
          const normals=new Float32Array(group.count*3);
          for(let i=0;i<group.count;i++){
            const j=group.start+i;
            positions[i*3]=position.getX(j);positions[i*3+1]=position.getY(j);positions[i*3+2]=position.getZ(j);
            normals[i*3]=normal.getX(j);normals[i*3+1]=normal.getY(j);normals[i*3+2]=normal.getZ(j);
          }
          const geometry=new THREE.BufferGeometry();
          geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
          geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
          if(!buckets.has(material))buckets.set(material,[]);
          buckets.get(material)!.push(geometry);
        }
      }finally{expanded.dispose();}
      originals.push(child);
    }
    // Transactional: don't remove a single building until every merge succeeds.
    const combined:THREE.Mesh[]=[];
    try{
      for(const [material,geometries] of buckets){
        const merged=mergeGeometries(geometries,false);
        if(!merged)throw new Error('Building geometry merge failed');
        const mesh=new THREE.Mesh(merged,material);
        mesh.receiveShadow=true;
        combined.push(mesh);
      }
    }catch(error){
      for(const mesh of combined)mesh.geometry.dispose();
      throw error;
    }
    for(const mesh of originals){scene.remove(mesh);mesh.geometry.dispose();}
    for(const mesh of combined)scene.add(mesh);
  }catch(error){
    console.warn('Building batching skipped; retaining original geometry',error);
  }finally{disposeTemporary();}
}
export function renderGeoFeatures(scene:THREE.Object3D, features:Feature[], terrain?:Terrain):number{
  let count=addMappedTrees(scene,features,terrain);
  const sharedEdges=sharedBuildingEdges(features);
  for(const f of features){
    const tags=f.properties??{};
    if(f.geometry?.type==='LineString'){
      const pts=coordsToPoints(f.geometry.coordinates,terrain);
      if(tags.historic==='citywalls'||tags.historic==='castle'||tags.historic==='ruins'||tags.barrier==='city_wall'){addHistoricWall(scene,pts,terrain,tags.historic==='castle'||tags.historic==='ruins');count++;}
      else if(tags.highway){addLine(scene,pts,typeof tags.highway==='string'&&['footway','path','steps'].includes(tags.highway)?2.5:5.5,0xbda68b,terrain);count++;}
      else if(tags.waterway){addLine(scene,pts,6,0x729ea8,terrain);count++;}
    } else if(f.geometry?.type==='Polygon' && Array.isArray(f.geometry.coordinates)){
      const ring=coordsToPoints(f.geometry.coordinates[0],terrain);
      if(ring.length<4 || !ring.some(insideArea))continue;
      if(tags.historic==='castle'||tags.historic==='ruins'){
        // The mapped castle perimeter takes priority over generic building
        // extrusion: an intact terracotta-roofed house would be misleading.
        addHistoricWall(scene,ring,terrain,true);count++;
      } else if(tags.building){
        const shape=makeFootprint(ring);
        // A single level foundation avoids floating corners on sloping terrain.
        // The roof remains above the highest footprint vertex.
        const minGround=terrain?Math.min(...ring.map(p=>p.y))-.12:0;
        const maxGround=terrain?Math.max(...ring.map(p=>p.y))-.12:0;
        const slopeRise=Math.min(30,Math.max(0,maxGround-minGround));
        const base=minGround;
        const height=buildingHeight(tags);
        const geometry=new THREE.ExtrudeGeometry(shape,{depth:height+slopeRise,bevelEnabled:false});
        geometry.rotateX(-Math.PI/2);
        geometry.translate(0,base,0);
        // Stable spatial hashes, deliberately decorrelated: neighboring buildings
        // should not all share the same facade/roof pairing.
        const hx=Math.round(ring[0].x*10),hz=Math.round(ring[0].z*10);
        const mix=(x:number)=>{x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return (x^(x>>>16))>>>0;};
        const roofIndex=mix(hx^Math.imul(hz,31))%ROOF_COLORS.length;
        const wallIndex=mix(hz^Math.imul(hx,131)^0x5f3759df)%WALL_MATERIALS.length;
        const mesh=new THREE.Mesh(geometry,[FLAT_ROOF_MATERIALS[roofIndex],WALL_MATERIALS[wallIndex]]);
        mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);
        addFacadeDetails(scene,ring,base,height+slopeRise,sharedEdges,terrain);
        const roofShape=typeof tags['roof:shape']==='string'?tags['roof:shape']:'';
        const top=base+height+slopeRise;
        const rise=roofRise(tags,height);
        if(roofShape==='pyramidal')
          addPyramidalRoof(scene,ring,top,height,GABLE_ROOF_MATERIALS[roofIndex],rise);
        else if(roofShape===''||roofShape==='gabled')
          addGableRoof(scene,ring,top,height,GABLE_ROOF_MATERIALS[roofIndex],rise);
        count++;
      } else if(tags.natural==='wood'||tags.natural==='scrub'||tags.landuse==='forest'||tags.landuse==='orchard'||tags.leisure==='park'){
        // The DEM is already the ground. A second, independently triangulated
        // surface can intersect its triangles on slopes and flash with camera
        // motion (z-fighting). Preserve OSM polygons for tree placement, but
        // don't overlay a competing terrain mesh until DEM-cell clipping exists.
        count++;
      } else if(tags.historic==='castle'||tags.historic==='ruins'){
        // Preserve the mapped footprint without inventing an intact castle.
        // Only its surveyed perimeter is represented as a low schematic wall.
        addHistoricWall(scene,ring,terrain);count++;
      } else if(tags.natural==='water'){
        // Water surfaces remain level at their lowest mapped edge.
        const geometry=new THREE.ShapeGeometry(makeFootprint(ring));
        geometry.rotateX(-Math.PI/2);
        const water=new THREE.Mesh(geometry,WATER_MATERIAL);
        water.position.y=terrain?(Math.min(...ring.map(p=>p.y))+.05):.2;
        scene.add(water);count++;
      }
    }
  }
  batchLinearFeatures(scene);
  batchBuildings(scene);
  return count;
}
export async function loadAnglesGeography(scene:THREE.Object3D, terrain?:Terrain):Promise<number>{
  const response=await fetch(`${import.meta.env.BASE_URL}data/angles-osm.geojson`);
  if(!response.ok)return 0;
  const data=await response.json() as Collection;
  if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('Invalid GeoJSON');
  const count=renderGeoFeatures(scene,data.features,terrain);
  if(count>0)setBuildingFootprints(data.features);
  return count;
}

