import * as THREE from 'three';
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
const WALL_MATERIALS=[0xcab89d,0xd8c7ab,0xb8a991,0xe0d1b8].map(color=>new THREE.MeshLambertMaterial({color}));
// Restrained regional roof palette; deterministic per footprint and GPU-shared.
const ROOF_COLORS=[0xa96049,0xb77559,0x995a49,0xb16a52,0x8d594b];
const FLAT_ROOF_MATERIALS=ROOF_COLORS.map(color=>new THREE.MeshLambertMaterial({color}));
const GABLE_ROOF_MATERIALS=ROOF_COLORS.map(color=>new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide}));
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
function buildingHeight(tags:Record<string,unknown>):number{
  const explicit=typeof tags.height==='string'?Number.parseFloat(tags.height.replace(',','.')):NaN;
  if(Number.isFinite(explicit)&&explicit>=2&&explicit<=80)return explicit;
  const levels=Number(tags['building:levels']);
  if(Number.isFinite(levels)&&levels>=1&&levels<=20)return levels*3.1;
  return 7;
}
function makeFootprint(ring:THREE.Vector3[]):THREE.Shape{
  const shape=new THREE.Shape();
  ring.forEach((p,i)=>i===0?shape.moveTo(p.x,-p.z):shape.lineTo(p.x,-p.z));
  return shape;
}
// A conservative gable roof for verified rectangular footprints only.
// Complex footprints keep their flat cap rather than inventing inaccurate geometry.
function addGableRoof(scene:THREE.Object3D,ring:THREE.Vector3[],top:number,height:number,material:THREE.Material){
  const corners=ring.slice();
  if(corners.length>4 && corners[0].distanceTo(corners[corners.length-1])<.01)corners.pop();
  if(corners.length!==4)return;
  const edges=corners.map((p,i)=>corners[(i+1)%4].clone().sub(p));
  const lengths=edges.map(e=>Math.hypot(e.x,e.z));
  if(lengths.some(l=>l<3)||Math.max(...lengths)>90)return;
  const dot=(i:number)=>Math.abs((edges[i].x*edges[(i+1)%4].x+edges[i].z*edges[(i+1)%4].z)/(lengths[i]*lengths[(i+1)%4]));
  if([0,1,2,3].some(i=>dot(i)>.18))return;
  if(Math.abs(lengths[0]-lengths[2])>Math.max(1,lengths[0]*.12)||Math.abs(lengths[1]-lengths[3])>Math.max(1,lengths[1]*.12))return;
  const ridgeHeight=Math.min(4,Math.max(1.2,Math.min(...lengths)*.23),height*.45);
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
  if(!points.length)return 0;
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
  // Broad low-poly crowns retain a more stable silhouette at oblique angles.
  const crownGeometry=new THREE.ConeGeometry(2.8,6,5);
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
    // Opaque foliage writes depth normally: no ground bleeding through crowns.
    const trunks=new THREE.InstancedMesh(trunkGeometry,trunkCellMaterial,cellPoints.length);
    const crowns=new THREE.InstancedMesh(crownGeometry,crownCellMaterial,cellPoints.length);
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
      dummy.position.set(p.x,p.y+5.6*scale*height,p.z);
      dummy.rotation.y=fraction*Math.PI*2;
      dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
      dummy.rotation.y=0;
      crowns.setColorAt(i,foliagePalette[Math.min(foliagePalette.length-1,Math.floor(fraction*foliagePalette.length))]);
    });
    trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;
    if(crowns.instanceColor)crowns.instanceColor.needsUpdate=true;
    trunks.castShadow=false;crowns.castShadow=false;
    trunks.frustumCulled=false;crowns.frustumCulled=false;
    group.add(trunks,crowns);
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
  const materials:THREE.Material[]=[...FLAT_ROOF_MATERIALS,...WALL_MATERIALS,...GABLE_ROOF_MATERIALS];
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
  for(const f of features){
    const tags=f.properties??{};
    if(f.geometry?.type==='LineString'){
      const pts=coordsToPoints(f.geometry.coordinates,terrain);
      if(tags.highway){addLine(scene,pts,typeof tags.highway==='string'&&['footway','path','steps'].includes(tags.highway)?2.5:5.5,0xbda68b,terrain);count++;}
      else if(tags.waterway){addLine(scene,pts,6,0x729ea8,terrain);count++;}
    } else if(f.geometry?.type==='Polygon' && Array.isArray(f.geometry.coordinates)){
      const ring=coordsToPoints(f.geometry.coordinates[0],terrain);
      if(ring.length<4 || !ring.some(insideArea))continue;
      if(tags.building){
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
        const seed=Math.abs(Math.round(ring[0].x*31+ring[0].z*17));
        const roofIndex=seed%ROOF_COLORS.length;
        const mesh=new THREE.Mesh(geometry,[FLAT_ROOF_MATERIALS[roofIndex],WALL_MATERIALS[seed%WALL_MATERIALS.length]]);
        mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);
        if(tags['roof:shape']!=='flat' && tags['roof:shape']!=='skillion' && tags['roof:shape']!=='dome')
          addGableRoof(scene,ring,base+height+slopeRise,height,GABLE_ROOF_MATERIALS[roofIndex]);
        count++;
      } else if(tags.natural==='wood'||tags.natural==='scrub'||tags.landuse==='forest'||tags.landuse==='orchard'||tags.leisure==='park'){
        // The DEM is already the ground. A second, independently triangulated
        // surface can intersect its triangles on slopes and flash with camera
        // motion (z-fighting). Preserve OSM polygons for tree placement, but
        // don't overlay a competing terrain mesh until DEM-cell clipping exists.
        count++;
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

