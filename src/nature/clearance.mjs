import {inside,ringDistance} from './ecology.mjs';
// A bounded spatial index built once at zone creation, never per frame/tree.
export function masonryClearance(features){
 const cells=new Map();
 for(const f of features){if(!f.rings?.length||!(f.tags.building||f.tags.historic))continue;
  const r=f.rings[0],xs=r.map(p=>p.x),zs=r.map(p=>p.z);
  for(let x=Math.floor((Math.min(...xs)-16)/64);x<=Math.floor((Math.max(...xs)+16)/64);x++)for(let z=Math.floor((Math.min(...zs)-16)/64);z<=Math.floor((Math.max(...zs)+16)/64);z++){
   const k=`${x}:${z}`;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(r);
  }
 }
 return p=>{let d=Infinity;for(const r of cells.get(`${Math.floor(p.x/64)}:${Math.floor(p.z/64)}`)??[])d=Math.min(d,inside(p,r)?0:ringDistance(p,r));return d};
}
