import {coverAt} from '../world/landcover.mjs';
export function habitatIndex(features){
 const cells=new Map();
 for(const f of features){if(!f.rings?.[0])continue;const r=f.rings[0],xs=r.map(p=>p.x),zs=r.map(p=>p.z);for(let z=Math.floor(Math.min(...zs)/256);z<=Math.floor(Math.max(...zs)/256);z++)for(let x=Math.floor(Math.min(...xs)/256);x<=Math.floor(Math.max(...xs)/256);x++){const key=`${x}:${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(f)}}
 return (x,z)=>coverAt(x,z,cells.get(`${Math.floor(x/256)}:${Math.floor(z/256)}`)??[])??'unknown';
}
