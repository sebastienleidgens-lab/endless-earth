import {roadWidth} from '../world/road-style.mjs';
import {proximityIndex} from './context.mjs';
const inside=(p,ring)=>{let v=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)v=!v}return v};
/** Bank contours are OSM polygons, not a measured width/discharge. Index built
 * once; unknown footprints fall back explicitly to a centreline estimate. */
export function riverAcousticIndex(areas=[],rivers=[],weirs=[]){
 const banks=proximityIndex(areas.flatMap(a=>a.rings.map(r=>[...r,r[0]]))),centre=proximityIndex(rivers),falls=proximityIndex(weirs);
 const bounds=areas.map(a=>({...a,minX:Math.min(...a.rings[0].map(p=>p.x)),maxX:Math.max(...a.rings[0].map(p=>p.x)),minZ:Math.min(...a.rings[0].map(p=>p.z)),maxZ:Math.max(...a.rings[0].map(p=>p.z))}));
 return {query(p,altitudeAt=null,radius=160){
  const bank=banks.query(p,radius),line=centre.query(p,radius),weir=falls.query(p,60);
  const flooded=bounds.some(a=>p.x>=a.minX&&p.x<=a.maxX&&p.z>=a.minZ&&p.z<=a.maxZ&&inside(p,a.rings[0])&&!a.rings.slice(1).some(r=>inside(p,r)));
  const q=bank.point?bank:line;if(!q.point)return {water:null,checked:bank.checked+line.checked+weir.checked};
  const horizontal=flooded?0:q.distance,altitude=altitudeAt?.(q.point.x,q.point.z),dy=Number.isFinite(altitude)&&Number.isFinite(p.altitudeM)?Math.abs(p.altitudeM-altitude):0;
  const point=flooded?{x:p.x,z:p.z}:q.point;
  return {water:{distanceM:Math.hypot(horizontal,dy),horizontalDistanceM:horizontal,bankDistanceM:bank.point?(flooded?0:bank.distance):null,centrelineDistanceM:line.point?line.distance:null,verticalDistanceM:Number.isFinite(altitude)&&Number.isFinite(p.altitudeM)?dy:null,point,insideMappedWater:flooded,kind:bank.point||line.tags?.waterway==='river'?'river':'stream',weirDistanceM:weir.point?weir.distance:null,provenance:bank.point?'mapped OSM river polygon bank; cadastral outline where tagged; not a current bank survey':'mapped OSM waterway centreline fallback; unknown bank width',heightBasis:Number.isFinite(altitude)?'DEM approximation, not measured water level':'unknown'},checked:bank.checked+line.checked+weir.checked};
 }};
}
export function motorRoad(tags={}){
 return ['secondary','tertiary','residential','unclassified','living_street','service'].includes(tags.highway)
 &&![tags.access,tags.vehicle,tags.motor_vehicle,tags.motorcar].some(v=>['no','private','agricultural','forestry'].includes(v))
 &&!tags.construction&&!tags.tunnel&&!tags.ford&&!tags['motor_vehicle:conditional']&&!tags['access:conditional']
 &&!['driveway','parking_aisle','emergency_access'].includes(tags.service);
}
export function trafficRoadIndex(roads){return proximityIndex(roads.filter(r=>motorRoad(r.tags)).map(r=>Object.assign([...r.points],{tags:r.tags})))}
// Distant, behind the listener, and always on a legally plausible mapped road.
// The real recording itself contains the approach, pass and recession; no
// invisible close vehicle or fictional measured traffic flow is implied.
export function trafficCandidates(index,listener,altitudeAt=null){
 if(!listener?.position||!listener?.forward)return [];
 const p=listener.position,f=listener.forward,fl=Math.hypot(f.x,f.z);if(fl<.45)return [];
 const out=[],seen=new Set();
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4,q=index.query({x:p.x+Math.cos(angle)*110,z:p.z+Math.sin(angle)*110},45);if(!q.point)continue;
  const dx=q.point.x-p.x,dz=q.point.z-p.z,d=Math.hypot(dx,dz),dot=(dx*f.x+dz*f.z)/(d*fl||1);if(d<65||d>170||dot>-.25)continue;
  const id=`road:${q.tags?.osm_id??'unknown'}:${Math.round(q.point.x/25)}:${Math.round(q.point.z/25)}`;if(seen.has(id))continue;seen.add(id);
  const y=altitudeAt?.(q.point.x,q.point.z);if(!Number.isFinite(y)||Math.abs(y+.8-p.y)>25)continue;
  out.push({id,position:{...q.point,y:y+.8},distance:d,tags:q.tags,interpreted:true});
 }
 return out.sort((a,b)=>a.distance-b.distance).slice(0,4);
}
export function roadSourceHidden(position,listener){const dx=position.x-listener.position.x,dz=position.z-listener.position.z,d=Math.hypot(dx,dz),f=listener.forward,l=Math.hypot(f.x,f.z);return d>=45&&d<=210&&l>.4&&(dx*f.x+dz*f.z)/(d*l)<.15&&Math.abs(position.y-listener.position.y)<30}

// Foot material comes from every mapped road under an admitted physical step;
// AutoWalk eligibility and motor access do not erase explicit surface evidence.
export function footRoadIndex(roads){return proximityIndex(roads.map(road=>Object.assign([...road.points],{surface:road.tags?.surface??null,tags:road.tags,width:roadWidth(road.tags??{}).metres})))}
