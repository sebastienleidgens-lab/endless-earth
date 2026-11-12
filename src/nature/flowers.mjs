import {buildingPlan,edgeKey} from '../architecture/plan.mjs';
export const FLOWER_VERSION='village-window-gardens-v1';
// Photos C16/C24 are typological references only. No photograph-to-building
// correspondence or present-day flower/species inventory is claimed.
export function villageFlowerRecipes(features,height){
 const buildings=features.filter(f=>f.tags.building&&!f.tags.historic&&f.rings?.length===1&&f.rings[0].some(p=>Math.abs(p.x)<650&&Math.abs(p.z)<650));
 const counts=new Map();for(const f of buildings){const r=f.rings[0];for(let i=1;i<r.length;i++){const k=edgeKey(r[i-1],r[i]);counts.set(k,(counts.get(k)??0)+1)}}
 const shared=new Set([...counts].filter(([,n])=>n>1).map(([k])=>k)),recipes=[];
 for(const f of buildings){
  if(['shed','garage','garages','hut','church','chapel'].includes(f.tags.building))continue;
  const p=buildingPlan(f.rings[0],f.tags,undefined,shared,height);if(!p)continue;
  for(const o of p.openings){
   if(o.kind!=='window'||!o.planter)continue;
   // Entire decoration remains in the existing window recess. Never a door,
   // free-standing obstacle, bridge attachment or invented roadside flowerbed.
   recipes.push({id:`${p.seed}:${o.edge}:${o.s.toFixed(3)}`,x:o.x,y:o.bottom+.26,z:o.z,
    ux:o.ux,uz:o.uz,nx:o.nx,nz:o.nz,width:o.width-.22,
    seed:(p.seed+o.edge*101+Math.floor(o.s*100))>>>0,kind:(p.seed+o.edge)%4===0?'climber':'planter',
    provenance:'artistic interpretation in a procedural window; local photographs document the type, not this placement'});
  }
 }
 // A stable cap with spatially spread hashes, independent of loading order.
 return recipes.sort((a,b)=>(a.seed%997)-(b.seed%997)||a.id.localeCompare(b.id)).slice(0,180).sort((a,b)=>a.id.localeCompare(b.id));
}
export function flowerSeason(date){
 const d=new Date(date);if(!Number.isFinite(+d))return {leaf:1,bloom:1};
 const m=d.getUTCMonth(),t=(d.getUTCDate()-1)/31;
 const blooms=[0,0,.04,.45,.9,1,.95,.75,.4,.06,0,0],leaves=[0,0,.12,.65,1,1,1,1,.85,.35,.04,0];
 return {leaf:leaves[m]+(leaves[(m+1)%12]-leaves[m])*t,bloom:blooms[m]+(blooms[(m+1)%12]-blooms[m])*t};
}
