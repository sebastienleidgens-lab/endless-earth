import * as THREE from 'three';
import { toLocal } from './geo';
type Point = { x:number; z:number };
let realFootprints: Point[][] | null = null;
export function setBuildingFootprints(features: Array<{geometry?:{type:string;coordinates:unknown};properties?:Record<string,unknown>}>) {
  const polygons:Point[][]=[];
  for(const feature of features){
    if(!feature.properties?.building || feature.geometry?.type!=='Polygon')continue;
    const ring=Array.isArray(feature.geometry.coordinates)?feature.geometry.coordinates[0]:null;
    if(!Array.isArray(ring))continue;
    const points:Point[]=ring.flatMap((p:unknown)=>{
      if(!Array.isArray(p)||typeof p[0]!=='number'||typeof p[1]!=='number')return [];
      return [toLocal({lon:p[0],lat:p[1]})];
    });
    if(points.length>=3)polygons.push(points);
  }
  realFootprints=polygons;
}
function inPolygon(x:number,z:number,poly:Point[]):boolean {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a.z>z)!==(b.z>z) && x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }
  return inside;
}
export function canWalk(x:number,z:number):boolean {
  if(Math.abs(x)>1000||Math.abs(z)>1000)return false;
  if(realFootprints!==null){
    // Polygon interiors only; detailed wall clearance comes later.
    return !realFootprints.some(poly=>inPolygon(x,z,poly));
  }
  // Colliders for the illustrative demo only.
  if(Math.abs(x)>205||Math.abs(z)>205)return false;
  for(let i=0;i<12;i++){
    const hx=(i%2?1:-1)*(20+(i%3)*7),hz=Math.floor(i/2)*35-90;
    if(Math.abs(x-hx)<7.6&&Math.abs(z-hz)<7.1)return false;
  }
  return true;
}
export function moveWithCollision(position:THREE.Vector3,displacement:THREE.Vector3){
  const steps=Math.max(1,Math.ceil(displacement.length()/.35));
  const dx=displacement.x/steps,dz=displacement.z/steps;
  for(let i=0;i<steps;i++){
    if(canWalk(position.x+dx,position.z+dz)){position.x+=dx;position.z+=dz;}
    else{
      if(canWalk(position.x+dx,position.z))position.x+=dx;
      if(canWalk(position.x,position.z+dz))position.z+=dz;
    }
  }
}
