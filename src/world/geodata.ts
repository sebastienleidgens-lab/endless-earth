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
  const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide}));
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
      if(ring.length<4)continue;
      if(tags.building){
        const shape=makeFootprint(ring);
        const base=terrain?Math.min(...ring.map(p=>p.y))-.12:0;
        const height=buildingHeight(tags);
        const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});
        geometry.rotateX(-Math.PI/2);
        geometry.translate(0,base,0);
        const wall=new THREE.MeshLambertMaterial({color:0xcab89d});
        const roof=new THREE.MeshLambertMaterial({color:0x9a6758});
        const mesh=new THREE.Mesh(geometry,[roof,wall]);
        mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);count++;
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

