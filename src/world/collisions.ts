import * as THREE from 'three';
// @ts-ignore shared runtime kernel
import { circleHitsPolygon, moveGrounded } from '../controls/walking.mjs';
// @ts-ignore deterministic geographic navigation
import { createNavigation } from './navigation.mjs';
import { toLocal } from './geo';
type Point = { x:number; z:number };
let navigation:(x:number,z:number)=>{clear:boolean;cameraClear?:boolean;support:number|null;slope:number}=()=>({clear:true,support:null,slope:.7});
export const walkingHeight=(height:(x:number,z:number)=>number|null)=>(x:number,z:number)=>navigation(x,z).support??height(x,z);
let realFootprints: Point[][] | null = null;
const cells=new Map<string,Point[][]>();
const cellKey=(x:number,z:number)=>`${Math.floor(x/20)},${Math.floor(z/20)}`;
export function setBuildingFootprints(features: Array<{geometry?:{type:string;coordinates:unknown};properties?:Record<string,unknown>}>, verifiedDeckHeight?:(feature:unknown,lon:number,lat:number)=>number|null) {
  const localFeatures=features.flatMap(feature=>{
    const geometry=feature.geometry;
    if(!geometry||!Array.isArray(geometry.coordinates))return [];
    const groups=geometry.type==='MultiPolygon'?geometry.coordinates.map((p:unknown)=>Array.isArray(p)?p[0]:[]):
      geometry.type==='Polygon'?[geometry.coordinates[0]]:geometry.type==='LineString'?[geometry.coordinates]:geometry.type==='Point'?[[geometry.coordinates,geometry.coordinates]]:[];
    return groups.flatMap(coordinates=>{
      if(!Array.isArray(coordinates))return [];
      // Existing OSM import has no verified vertical datum: arbitrary Z is not a deck.
      return [{tags:feature.properties??{},polygon:['Polygon','MultiPolygon'].includes(geometry.type),points:coordinates.flatMap((p:unknown)=>Array.isArray(p)&&typeof p[0]==='number'&&typeof p[1]==='number'?[{...toLocal({lon:p[0],lat:p[1]}),y:verifiedDeckHeight?.(feature,p[0],p[1])??undefined}]:[])}];
    });
  });
  navigation=createNavigation(localFeatures);
  const polygons:Point[][]=[];
  for(const feature of localFeatures){
    if(feature.tags.building&&feature.polygon&&feature.points.length>=3)polygons.push(feature.points);
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
export function canWalk(x:number,z:number, camera=false):boolean {
  if(Math.abs(x)>1000||Math.abs(z)>1000)return false;
  const access=navigation(x,z);
  if(camera?access.cameraClear===false:!access.clear)return false;
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
export function moveWithCollision(position:THREE.Vector3,displacement:{x:number;z:number},height:(x:number,z:number)=>number|null=()=>0,slide=true){
  moveGrounded(position,displacement,canWalk,walkingHeight(height),(x:number,z:number)=>navigation(x,z).slope,slide);
}

export const cameraClear=(x:number,z:number)=>canWalk(x,z,true);
