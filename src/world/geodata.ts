import * as THREE from 'three';
import { toLocal } from './geo';
import { setBuildingFootprints } from './collisions';
type Feature = { geometry?: { type: string; coordinates: unknown }; properties?: Record<string,unknown> };
type Collection = { type: string; features: Feature[] };
function coordsToPoints(coords: unknown): THREE.Vector3[] {
  if(!Array.isArray(coords)) return [];
  return coords.flatMap((p:unknown) => {
    if(!Array.isArray(p)||typeof p[0]!=='number'||typeof p[1]!=='number') return [];
    const v=toLocal({lon:p[0],lat:p[1]}); return [new THREE.Vector3(v.x,0.12,v.z)];
  });
}
function addLine(scene:THREE.Scene,points:THREE.Vector3[],width:number,color:number){
  if(points.length<2)return;
  const mat=new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide});
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],d=b.clone().sub(a);
    const len=Math.hypot(d.x,d.z);
    if(len<.05)continue;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,len),mat);
    mesh.rotation.set(-Math.PI/2,0,-Math.atan2(d.x,-d.z));
    mesh.position.set((a.x+b.x)/2,.16,(a.z+b.z)/2);
    mesh.receiveShadow=true;scene.add(mesh);
  }
}
export async function loadAnglesGeography(scene:THREE.Scene):Promise<number>{
  const response=await fetch(`${import.meta.env.BASE_URL}data/angles-osm.geojson`);
  if(!response.ok) return 0;
  const data=await response.json() as Collection;
  if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('Invalid GeoJSON');
  let count=0;
  for(const f of data.features){
    const tags=f.properties??{};
    if(f.geometry?.type==='LineString'){
      const pts=coordsToPoints(f.geometry.coordinates);
      if(tags.highway){addLine(scene,pts,typeof tags.highway==='string'&&['footway','path','steps'].includes(tags.highway)?2.5:5.5,0xbda68b);count++;}
      else if(tags.waterway){addLine(scene,pts,6,0x729ea8);count++;}
    } else if(f.geometry?.type==='Polygon' && Array.isArray(f.geometry.coordinates)){
      const ring=coordsToPoints(f.geometry.coordinates[0]);
      if(ring.length<4)continue;
      if(tags.building){
        const shape=new THREE.Shape();
        ring.forEach((p,i)=>i===0?shape.moveTo(p.x,-p.z):shape.lineTo(p.x,-p.z));
        const geometry=new THREE.ExtrudeGeometry(shape,{depth:7,bevelEnabled:false});
        geometry.rotateX(-Math.PI/2);
        const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xd6c8af}));
        mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);count++;
      }
    }
  }
  if(count>0) setBuildingFootprints(data.features);
  return count;
}
