import * as THREE from 'three';
// @ts-ignore shared runtime kernel
import { circleHitsPolygon, moveGrounded } from '../controls/walking.mjs';
import { toLocal } from './geo';
type Point = { x:number; z:number };
let realFootprints: Point[][] | null = null;
const cells=new Map<string,Point[][]>();
const cellKey=(x:number,z:number)=>`${Math.floor(x/20)},${Math.floor(z/20)}`;
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
  cells.clear();
  for(const poly of polygons){
    const xs=poly.map(p=>p.x),zs=poly.map(p=>p.z);
    for(let x=Math.floor((Math.min(...xs)-.3)/20);x<=Math.floor((Math.max(...xs)+.3)/20);x++)
      for(let z=Math.floor((Math.min(...zs)-.3)/20);z<=Math.floor((Math.max(...zs)+.3)/20);z++){
        const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(poly);
      }
  }
}
export function canWalk(x:number,z:number):boolean {
  if(Math.abs(x)>1000||Math.abs(z)>1000)return false;
  if(realFootprints!==null){
    // Uniform grid broad phase; exact polygon and 30 cm body clearance.
    return !(cells.get(cellKey(x,z))??[]).some(poly=>circleHitsPolygon(x,z,poly));
  }
  // Colliders for the illustrative demo only.
  if(Math.abs(x)>205||Math.abs(z)>205)return false;
  for(let i=0;i<12;i++){
    const hx=(i%2?1:-1)*(20+(i%3)*7),hz=Math.floor(i/2)*35-90;
    if(Math.abs(x-hx)<7.9&&Math.abs(z-hz)<7.4)return false;
  }
  return true;
}
export function moveWithCollision(position:THREE.Vector3,displacement:{x:number;z:number},height:(x:number,z:number)=>number|null=()=>0){
  moveGrounded(position,displacement,canWalk,height);
}
