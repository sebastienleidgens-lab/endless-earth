import * as THREE from 'three';
import {toLocal} from '../world/geo';
// Extend only a wall's foot when a local road/shoulder correction exposes it.
// Footprints, openings, eaves and inferred building heights are never relocated.
export function repairFoundationFeet(scene:THREE.Object3D,features:any[],sourceHeight:(x:number,z:number)=>number|null,correctedHeight:(x:number,z:number)=>number|null){
 const repairs:any[]=[];
 for(const f of features){if(!f.properties?.building||f.geometry?.type!=='Polygon')continue;const ring=f.geometry.coordinates[0].map(([lon,lat]:number[])=>toLocal({lon,lat})),old=ring.map((p:any)=>sourceHeight(p.x,p.z)),next=ring.map((p:any)=>correctedHeight(p.x,p.z));if(old.includes(null)||next.includes(null))continue;const from=Math.min(...old),to=Math.min(...next);if(from-to>.02)repairs.push({id:f.properties.osm_id,ring,from,to,vertices:0});}
 if(!repairs.length)return [];
 scene.traverse(o=>{if(!(o instanceof THREE.Mesh)||!['architecture-shell','architecture-render'].includes(o.name))return;const g=o.geometry,p=g.attributes.position;let changed=false;for(let i=0;i<p.count;i++)for(const r of repairs){if(Math.abs(p.getY(i)-r.from)>.0001)continue;let distance=Infinity;for(let j=1;j<r.ring.length;j++){const a=r.ring[j-1],b=r.ring[j],dx=b.x-a.x,dz=b.z-a.z,t=THREE.MathUtils.clamp(((p.getX(i)-a.x)*dx+(p.getZ(i)-a.z)*dz)/(dx*dx+dz*dz||1),0,1);distance=Math.min(distance,Math.hypot(p.getX(i)-a.x-t*dx,p.getZ(i)-a.z-t*dz));}if(distance>.02)continue;p.setY(i,r.to);r.vertices++;changed=true;break;}if(changed){p.needsUpdate=true;g.computeBoundingSphere();}});
 return repairs.filter(r=>r.vertices).map(({ring,...r})=>r);
}
