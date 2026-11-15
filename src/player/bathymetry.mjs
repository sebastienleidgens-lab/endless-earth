import {circleHitsPolygon} from '../controls/walking.mjs';
import {createWaterNetwork} from './water-network.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
/** Gameplay reconstruction only. Source outlines and rendered heights stay
 * immutable. This deliberately makes no claim about actual river depths. */
export function createEstimatedBathymetry({areas,lines=[],support,landClear,clear}){
 const rings=areas.flatMap(a=>a.rings.map((r,i)=>({points:r,hole:i>0,tags:a.tags}))),segments=[];
 for(const r of rings)for(let i=0;i<r.points.length;i++){
  const a=r.points[i],b=r.points[(i+1)%r.points.length],length=distance(a,b);if(length>.01)segments.push({a,b,length,ring:r});
 }
 const wet=(x,z)=>areas.some(a=>circleHitsPolygon(x,z,a.rings[0],0)&&!a.rings.slice(1).some(r=>circleHitsPolygon(x,z,r,0)));
 function shore(x,z){let best=null,d2=Infinity;for(const s of segments){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,t=clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/(s.length*s.length),0,1),px=s.a.x+t*dx,pz=s.a.z+t*dz,dd=(x-px)**2+(z-pz)**2;if(dd<d2){d2=dd;best={x:px,z:pz,distance:Math.sqrt(dd),segment:s};}}return best;}
 function contains(x,z){if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>998||Math.abs(z)>998)return false;if(wet(x,z))return true;return (shore(x,z)?.distance??Infinity)<.85;}
 function sample(x,z){
  const edge=shore(x,z),inside=wet(x,z);if(!edge||!inside&&edge.distance>.85)return null;
  let s=support(x,z),level=s?.height;
  if(!inside||s?.category!=='water'){
   const seg=edge.segment,dx=(seg.b.z-seg.a.z)/seg.length,dz=-(seg.b.x-seg.a.x)/seg.length;
   for(const sign of [1,-1]){const a=edge.x+dx*sign*.15,b=edge.z+dz*sign*.15;if(wet(a,b)){const q=support(a,b);if(q?.category==='water')level=q.height;break;}}
  }
  if(!Number.isFinite(level))return null;
  // Width and long-wave variability only change the central, saturated depth.
  // Shore gradient <= .42 prevents a discontinuity at shallow-water admission.
  let axis=Infinity;for(const line of lines)for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);axis=Math.min(axis,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));}
  const halfWidth=clamp(edge.distance+(Number.isFinite(axis)?axis:8),3,60),maximum=clamp(1.1+Math.sqrt(halfWidth)*.32,1.5,3.5),variation=1+.09*Math.sin(x*.023+Math.sin(z*.013))*.5;
  const depth=inside?maximum*Math.tanh(edge.distance*.38/maximum)*variation:0;
  const dry=support(x,z),bedY=inside?level-depth:Number.isFinite(dry?.height)?Math.max(level,dry.height):level;
  const reliable=inside?s?.category==='water':Number.isFinite(dry?.height)&&Math.abs(dry.height-level)<.14;
  return {surfaceY:Math.max(level,bedY),bedY,depth,source:'estimated',confidence:'low',reliable,allowed:reliable,provenance:'M25 artistic bed v1: OSM river outlines/axes + immutable rendered M23 water/shore support; NOT surveyed bathymetry or real-world safety information'};
 }
 const accesses=[],rejected=[];
 for(const seg of segments){if(seg.ring.hole)continue;for(let d=1;d<seg.length;d+=5){
  const x=seg.a.x+(seg.b.x-seg.a.x)*d/seg.length,z=seg.a.z+(seg.b.z-seg.a.z)*d/seg.length;
  for(const sign of [-1,1]){
   const nx=-(seg.b.z-seg.a.z)/seg.length*sign,nz=(seg.b.x-seg.a.x)/seg.length*sign,dry={x:x+nx*1.05,z:z+nz*1.05},entry={x:x+nx*.7,z:z+nz*.7},water={x:x-nx*2.2,z:z-nz*2.2};
   if(wet(dry.x,dry.z)||!wet(water.x,water.z))continue;
   const h=support(dry.x,dry.z),s=sample(entry.x,entry.z),w=sample(water.x,water.z);
   if(!h?.walkable||!landClear(dry.x,dry.z)||!s?.reliable||!w?.reliable||Math.abs(h.height-s.bedY)>.14||!clear(entry.x,entry.z)||!clear(water.x,water.z)){rejected.push({x,z,reason:'shore-support-clearance-or-height'});continue;}
   let pass=true;for(let t=0;t<=1;t+=.1){const px=dry.x+(water.x-dry.x)*t,pz=dry.z+(water.z-dry.z)*t;if(!clear(px,pz)){pass=false;break;}}
   if(pass)accesses.push({id:'estimated-bank-'+accesses.length,dry:{...dry,y:h.height},entry,water,normal:{x:nx,z:nz},source:'estimated',confidence:'low',outline:seg.ring.tags.osm_id??null});
  }
 }}
 // Immutable-world route admission is cached per exact metre cell, bounded.
 // Actual swept collision remains checked at each movement substep.
 const routes=new Map();
 const network=createWaterNetwork({areas,sample,contains,clear,accesses});
 network.prepare();
 function routeToExit(x,z){
  if(network.metrics.ready){const route=network.route({x,z},true);if(route)return route;}
  const candidates=accesses.map(a=>({a,d:distance({x,z},a.entry)})).filter(r=>r.d<110).sort((a,b)=>a.d-b.d).slice(0,16);
  for(const {a,d}of candidates){const count=Math.max(1,Math.ceil(d/.5)),route=[];let valid=true;
   for(let i=0;i<=count;i++){const q={x:x+(a.entry.x-x)*i/count,z:z+(a.entry.z-z)*i/count},s=sample(q.x,q.z);if(!s?.reliable||!contains(q.x,q.z)||!clear(q.x,q.z)){valid=false;break;}route.push(q);}
   if(valid)return route;
  }return network.route({x,z},true);
 }
 function returnRouteVerified(x,z){const key=Math.floor(x)+','+Math.floor(z);if(!routes.has(key)){if(routes.size>=2048)routes.clear();const ok=network.metrics.ready?network.connected(x,z)||!!routeToExit(x,z):!!routeToExit(x,z);if(ok||network.metrics.ready)routes.set(key,ok);return ok;}return routes.get(key);}
 function nearby(p,max=2.4){let best=null,d=max;for(const a of accesses){const n=distance(p,a.dry);if(n<d){d=n;best=a;}}return best;}
 return {contains,sample,routeToExit,returnRouteVerified,network,routeToBank:(x,z)=>network.route({x,z}),exitWalkable:(x,z)=>{const a=nearby({x,z},1.5);return !!a&&landClear(a.dry.x,a.dry.z);},nearby,accesses,rejected,metrics:{source:'estimated',confidence:'low',version:2,accesses:accesses.length,rejected:rejected.length,renderedBed:false,water:'opaque source surface; analytic reflection',realDepthClaim:false}};
}
