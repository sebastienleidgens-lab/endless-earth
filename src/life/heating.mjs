import {hash} from './model.mjs';
import {circleHitsPolygon} from '../controls/walking.mjs';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
export function heatingAnchors(caps,buildings){
 const used=new Set(),out=[];for(const cap of caps){const b=buildings.find(b=>circleHitsPolygon(cap.x,cap.z,b.ring,0));if(!b)continue;const t=b.tags??{},type=t.building??'yes',area=Math.abs(b.ring.reduce((v,p,i)=>{const q=b.ring[(i+1)%b.ring.length];return v+p.x*q.z-q.x*p.z},0)/2),explicit=['house','residential','apartments','detached','terrace','semidetached_house'].includes(type);
  const inferred=type==='yes'&&area>=25&&area<=500&&b.height<=15&&!t.amenity&&!t.industrial&&!t.historic&&!t.office&&!t.shop;
  if(!explicit&&!inferred)continue;const id=String(b.id??cap.id);if(used.has(id))continue;used.add(id);out.push({...cap,buildingId:id,residential:explicit?'mapped building type':'inferred residential eligibility from generic building size and chimney',phase:hash(id)/4294967296});
 }return out;
}
/** Deterministic simulated household heating. No frustum or camera input. */
export function hearthStrength(anchor,climate){
 const temperature=climate?.metrics?.temperatureC??climate?.snow?.temperature??(climate?.season==='winter'?2:20),hour=climate?.localHour??12,seed=anchor.phase??hash(anchor.buildingId??anchor.id)/4294967296,time=climate?.elapsedSeconds??0;
 const cold=clamp((18-temperature)/20),occupation=.78+.12*Math.cos((hour-20-seed*4)*Math.PI/12),chance=cold*occupation;
 const scheduled=smooth(seed-.065,seed+.065,chance),variation=.82+.18*Math.sin(time*(.031+seed*.019)+seed*93.)**2;
 return cold*scheduled*variation;
}
