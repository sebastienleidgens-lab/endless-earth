import * as THREE from 'three';
// @ts-ignore shared runtime kernel
import { circleHitsPolygon, moveGrounded } from '../controls/walking.mjs';
// @ts-ignore deterministic geographic navigation
import { createNavigation } from './navigation.mjs';
import { toLocal } from './geo';
type Point = { x:number; z:number };
let navigation:(x:number,z:number,explain?:boolean)=>{clear:boolean;cameraClear?:boolean;support:number|null;slope:number;reasons?:unknown[]}=()=>({clear:true,support:null,slope:.7});
// Height, clearance and slope query the same immutable local topology several
// times per substep. Cache exact coordinates only, reset with its owner; never
// quantize a position across a narrow wall or a bridge edge.
const accessX=new Float64Array(16).fill(NaN),accessZ=new Float64Array(16).fill(NaN),accessValues:Array<ReturnType<typeof navigation>|undefined>=new Array(16);let accessCursor=0;
function accessAt(x:number,z:number){for(let i=0;i<16;i++)if(accessX[i]===x&&accessZ[i]===z)return accessValues[i]!;const value=navigation(x,z);accessX[accessCursor]=x;accessZ[accessCursor]=z;accessValues[accessCursor]=value;accessCursor=(accessCursor+1)%16;return value;}
export const hasWalkingSupport=(x:number,z:number)=>accessAt(x,z).support!==null;
let movementDiagnostic:Record<string,unknown>|null=null;
const footprintSources=new WeakMap<Point[],{id:string;provenance:string}>();
export const lastMovementDiagnostic=()=>movementDiagnostic;
export function inspectCollision(x:number,z:number){
 const access=navigation(x,z,true);
 const building=(cells.get(cellKey(x,z))??[]).find(poly=>circleHitsPolygon(x,z,poly));
 const reason=(access.reasons as any[]|undefined)?.find(r=>r.rule!=='mapped-water')??(access.reasons as any[]|undefined)?.[0];
 return {surface:access.support!==null?'verified-bridge':'terrain/road',obstacle:!Number.isFinite(x)||!Number.isFinite(z)?'numeric-error':Math.abs(x)>1000||Math.abs(z)>1000?'world-boundary':building?'building-footprint':!access.clear?reason?.rule??'geometric-collision':null,access,building:building??null,collider:building?{...footprintSources.get(building),shape:'polygon',points:building,radius:.3}:!access.clear?reason??null:null};
}
export const walkingHeight=(height:(x:number,z:number)=>number|null)=>(x:number,z:number)=>accessAt(x,z).support??height(x,z);
export function canTraverse(a:Point,b:Point,height:(x:number,z:number)=>number|null){
 const support=walkingHeight(height),p={x:a.x,z:a.z,y:support(a.x,a.z)},length=Math.hypot(b.x-a.x,b.z-a.z);
 if(!Number.isFinite(p.y)||!canWalk(a.x,a.z))return false;
 const chunks=Math.max(1,Math.ceil(length/20));
 for(let i=1;i<=chunks;i++){const x=a.x+(b.x-a.x)*i/chunks,z=a.z+(b.z-a.z)*i/chunks;moveGrounded(p,{x:x-p.x,z:z-p.z},canWalk,support,(x:number,z:number)=>accessAt(x,z).slope,false);if(Math.hypot(p.x-x,p.z-z)>1e-5)return false}
 return true;
}
let realFootprints: Point[][] | null = null;
const cells=new Map<string,Point[][]>();
const cellKey=(x:number,z:number)=>`${Math.floor(x/20)},${Math.floor(z/20)}`;
export function setBuildingFootprints(features: Array<{geometry?:{type:string;coordinates:unknown};properties?:Record<string,unknown>}>, verifiedDeckHeight?:(feature:unknown,lon:number,lat:number)=>number|null,verifiedSupport?:(feature:unknown,x:number,z:number)=>number|null) {
  const localFeatures=features.flatMap(feature=>{
    const geometry=feature.geometry;
    if(!geometry||!Array.isArray(geometry.coordinates))return [];
    const groups=geometry.type==='MultiPolygon'?geometry.coordinates.map((p:unknown)=>Array.isArray(p)?p[0]:[]):
      geometry.type==='Polygon'?[geometry.coordinates[0]]:geometry.type==='LineString'?[geometry.coordinates]:geometry.type==='Point'?[[geometry.coordinates,geometry.coordinates]]:[];
    return groups.flatMap(coordinates=>{
      if(!Array.isArray(coordinates))return [];
      // Existing OSM import has no verified vertical datum: arbitrary Z is not a deck.
      return [{tags:feature.properties??{},polygon:['Polygon','MultiPolygon'].includes(geometry.type),support:verifiedSupport?(x:number,z:number)=>verifiedSupport(feature,x,z):undefined,points:coordinates.flatMap((p:unknown)=>Array.isArray(p)&&typeof p[0]==='number'&&typeof p[1]==='number'?[{...toLocal({lon:p[0],lat:p[1]}),y:verifiedDeckHeight?.(feature,p[0],p[1])??undefined}]:[])}];
    });
  });
  navigation=createNavigation(localFeatures);
  accessX.fill(NaN);accessZ.fill(NaN);accessValues.fill(undefined);accessCursor=0;
  const polygons:Point[][]=[];
  for(const feature of localFeatures){
    if(feature.tags.building&&feature.polygon&&feature.points.length>=3){polygons.push(feature.points);footprintSources.set(feature.points,{id:`osm-building-${feature.tags.osm_id??polygons.length}`,provenance:'OSM building footprint; same metric geo.toLocal transform as rendered architecture; 0.3m body radius'});}
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
  if(!Number.isFinite(x)||!Number.isFinite(z))return false;
  if(Math.abs(x)>1000||Math.abs(z)>1000)return false;
  const access=accessAt(x,z);
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
export function moveWithCollision(position:THREE.Vector3,displacement:{x:number;z:number},height:(x:number,z:number)=>number|null=()=>0,slide=true,seconds=0){
  if(Math.hypot(displacement.x,displacement.z)<1e-12)return;
  movementDiagnostic=null;const previous={x:position.x,y:position.y,z:position.z};let refusal:any=null;
  moveGrounded(position,displacement,canWalk,walkingHeight(height),(x:number,z:number)=>accessAt(x,z).slope,slide,(d:any)=>{refusal??=d});
  if(refusal)movementDiagnostic={...refusal,...inspectCollision(refusal.requested.x,refusal.requested.z),previous,displacement:{...displacement},direction:Math.atan2(displacement.x,displacement.z),speed:seconds>0?Math.hypot(displacement.x,displacement.z)/seconds:null,allowed:{x:position.x,y:position.y,z:position.z},actualSpeed:seconds>0?Math.hypot(position.x-previous.x,position.z-previous.z)/seconds:null};
}

export const cameraClear=(x:number,z:number)=>canWalk(x,z,true);
