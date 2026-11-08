import * as THREE from 'three';
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
const WALL_MATERIAL=new THREE.MeshLambertMaterial({color:0xcab89d});
const FLAT_ROOF_MATERIAL=new THREE.MeshLambertMaterial({color:0x9a6758});
const GABLE_ROOF_MATERIAL=new THREE.MeshLambertMaterial({color:0x975c4b,side:THREE.DoubleSide});
const ROAD_MATERIAL=new THREE.MeshLambertMaterial({color:0xbda68b,side:THREE.DoubleSide});
const RIVER_MATERIAL=new THREE.MeshLambertMaterial({color:0x729ea8,side:THREE.DoubleSide});
const WATER_MATERIAL=new THREE.MeshLambertMaterial({color:0x739da8,side:THREE.DoubleSide});
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
function addGableRoof(scene:THREE.Object3D,ring:THREE.Vector3[],top:number,height:number){
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
  const roof=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0x975c4b,side:THREE.DoubleSide}));
  roof.castShadow=true;roof.receiveShadow=true;scene.add(roof);
}
export function renderGeoFeatures(scene:THREE.Object3D, features:Feature[], terrain?:Terrain):number{
  let count=0;
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
        const mesh=new THREE.Mesh(geometry,[FLAT_ROOF_MATERIAL,WALL_MATERIAL]);
        mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
        if(tags['roof:shape']!=='flat' && tags['roof:shape']!=='skillion' && tags['roof:shape']!=='dome')
          addGableRoof(scene,ring,base+height+slopeRise,height);
        count++;
      } else if(tags.natural==='water'){
        const geometry=new THREE.ShapeGeometry(makeFootprint(ring));
        geometry.rotateX(-Math.PI/2);
        const water=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0x739da8,side:THREE.DoubleSide}));
        water.position.y=terrain?(Math.min(...ring.map(p=>p.y))+.05):.2;scene.add(water);count++;
      }
    }
  }
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

