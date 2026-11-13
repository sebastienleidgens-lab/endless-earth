import * as THREE from 'three';
// @ts-ignore Deterministic, source id plus metric aperture identity.
import {windowIdentity} from './windows.mjs';
import {toLocal} from '../world/geo';
let cells=new Map<string,Array<{id:string;ring:Array<{x:number;z:number}>}>>();
export function configureWindowBuildings(features:any[]){
 cells=new Map();for(const f of features){if(!f.properties?.building||f.geometry?.type!=='Polygon')continue;const ring=f.geometry.coordinates[0].map(([lon,lat]:number[])=>toLocal({lon,lat})),entry={id:String(f.properties.osm_id??f.id),ring};
  const xs=ring.map((p:any)=>p.x),zs=ring.map((p:any)=>p.z);for(let x=Math.floor(Math.min(...xs)/40);x<=Math.floor(Math.max(...xs)/40);x++)for(let z=Math.floor(Math.min(...zs)/40);z<=Math.floor(Math.max(...zs)/40);z++){const key=x+':'+z;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(entry)}
 }
}
const inside=(x:number,z:number,ring:any[])=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)yes=!yes}return yes};
export function attachWindowSeeds(g:THREE.BufferGeometry){
 if(g.hasAttribute('windowSeed'))return;const p=g.attributes.position,a=g.attributes.architectureMaterial,index=g.index;if(!a||!index||!a.array.includes(7))return;
 const seeds=new Float32Array(p.count),done=new Set<number>();
 for(let k=0;k<index.count;k+=3){const first=index.getX(k);if(a.getX(first)!==7||done.has(first))continue;
  // Glass is a connected planar quad; its two indexed triangles share vertices.
  const ids=new Set([index.getX(k),index.getX(k+1),index.getX(k+2)]);if(k+5<index.count&&[0,1,2].some(j=>ids.has(index.getX(k+3+j))))for(let j=0;j<3;j++)ids.add(index.getX(k+3+j));
  let x=0,y=0,z=0;for(const i of ids){x+=p.getX(i)/ids.size;y+=p.getY(i)/ids.size;z+=p.getZ(i)/ids.size;done.add(i)}
  const building=(cells.get(Math.floor(x/40)+':'+Math.floor(z/40))??[]).find(b=>inside(x,z,b.ring));const seed=windowIdentity(building?.id??'unidentified-aperture',[x,y,z]);for(const i of ids)seeds[i]=seed;
 }
 g.setAttribute('windowSeed',new THREE.BufferAttribute(seeds,1));
}
export function facadeOutward(x:number,z:number){
 let best:{x:number;z:number;distance:number}|null=null;
 for(const b of cells.get(Math.floor(x/40)+':'+Math.floor(z/40))??[]){const r=b.ring,area=r.reduce((s,a,i)=>{const b=r[(i+1)%r.length];return s+a.x*b.z-b.x*a.z},0),sign=area>0?1:-1;
  for(let i=1;i<r.length;i++){const a=r[i-1],b=r[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(!length)continue;const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(length*length))),distance=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);if(!best||distance<best.distance)best={x:sign*dz/length,z:-sign*dx/length,distance};}
 }return best;
}
