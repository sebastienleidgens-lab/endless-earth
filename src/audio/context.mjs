import {seasonAt} from '../nature/climate.mjs';
/** Acoustic context v1. Unknown values are null, never guessed observations.
 * geo: WGS84 degrees; altitudeM: absolute elevation or null (not render y).
 * position/listener/sources: metres in the SAME current render frame, +Y up,
 * forward/up unit vectors. Rebase all three together; identity uses only geo.
 * worldTimeMs: simulated UTC; elapsed visit time is supplied separately by host.
 * localHour: civil hour if timezone supplied, otherwise labelled solar estimate.
 * weather: normalized simulated EarthLife values; no extra weather simulation.
 * influences: [0,1] affinities, inferred from mapped habitat/proximity, not activity.
 * sources: optional known EarthLife emitters; no inferred animal sightings.
 */
export const clamp01=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export function geographicKey(geo){
 if(!geo||!Number.isFinite(geo.lat)||!Number.isFinite(geo.lon)||Math.abs(geo.lat)>90)return 'unknown';
 const lon=((geo.lon+180)%360+360)%360-180;
 return `wgs84-v1:${Math.floor((geo.lat+90)*512)}:${Math.floor((lon+180)*512)}`;
}
export function temporalContext(worldTimeMs,geo,timeZone=null){
 if(!Number.isFinite(worldTimeMs))return {localHour:null,timeBasis:'unknown',season:null};
 const d=new Date(worldTimeMs);let localHour=null,timeBasis='unknown';
 if(timeZone){try{const p=new Intl.DateTimeFormat('en-GB',{timeZone,hourCycle:'h23',hour:'2-digit',minute:'2-digit'}).formatToParts(d);localHour=Number(p.find(p=>p.type==='hour').value)+Number(p.find(p=>p.type==='minute').value)/60;timeBasis='civil'}catch{/* Invalid zones fall back to explicit solar estimate. */}}
 if(localHour===null&&Number.isFinite(geo?.lon)){localHour=((d.getUTCHours()+d.getUTCMinutes()/60+geo.lon/15)%24+24)%24;timeBasis='mean-solar-estimate'}
 const season=seasonAt(d.getUTCMonth()+1,geo?.lat);
 return {localHour,timeBasis,season};
}
export function acousticContext(input={}){
 const geo=input.geo??null,worldTimeMs=Number.isFinite(input.worldTimeMs)?input.worldTimeMs:null;
 return {version:1,geo,key:geographicKey(geo),worldTimeMs,...(input.temporal??temporalContext(worldTimeMs,geo,input.timeZone)),
 altitudeM:Number.isFinite(input.altitudeM)?input.altitudeM:null,habitat:input.habitat??'unknown',
 solarAltitude:Number.isFinite(input.solarAltitude)?input.solarAltitude:null,weather:input.weather??null,
 position:input.position??{x:0,y:0,z:0},water:input.water??null,emitters:input.emitters??[],ground:input.ground??null,influences:Object.fromEntries(Object.entries(input.influences??{}).map(([k,v])=>[k,clamp01(v)])),
 sources:input.sources??[],provenance:input.provenance??{geography:'unknown',weather:'unknown'},fixture:input.fixture??false};
}
/** Built once per dataset revision, not per frame. Long segments are indexed by
 * traversed metric cells. Query radius is bounded; returns closest point as well. */
export function proximityIndex(lines,cellSize=128){
 const cells=new Map();let segments=0;
 for(const line of lines)for(let i=1;i<line.length;i++){
 const a=line[i-1],b=line[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(!Number.isFinite(length))continue;
 const seg={a,b,id:segments++,surface:line.surface??null,tags:line.tags??null,width:line.width??null},steps=Math.max(1,Math.ceil(length/(cellSize*.5))),keys=new Set();
 for(let j=0;j<=steps;j++)keys.add(`${Math.floor((a.x+(b.x-a.x)*j/steps)/cellSize)}:${Math.floor((a.z+(b.z-a.z)*j/steps)/cellSize)}`);
 for(const key of keys){if(!cells.has(key))cells.set(key,[]);cells.get(key).push(seg)}
 }
 return {segments,cells:cells.size,query(p,radius=120){
 radius=Math.max(0,Math.min(radius,256));let distance=Infinity,point=null,surface=null,tags=null,width=null,checked=0;const seen=new Set();
 for(let z=Math.floor((p.z-radius)/cellSize);z<=Math.floor((p.z+radius)/cellSize);z++)for(let x=Math.floor((p.x-radius)/cellSize);x<=Math.floor((p.x+radius)/cellSize);x++)for(const s of cells.get(`${x}:${z}`)??[]){
 if(seen.has(s.id))continue;seen.add(s.id);checked++;const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.z-s.a.z)*dz)/n)):0,q={x:s.a.x+t*dx,z:s.a.z+t*dz},d=Math.hypot(p.x-q.x,p.z-q.z);if(d<distance&&d<=radius){distance=d;point=q;surface=s.surface;tags=s.tags;width=s.width}
 }return {distance,point,surface,tags,width,checked};
 }};
}
export const HABITAT_INFLUENCES=Object.freeze({wood:{vegetation:1,forest:1},forest:{vegetation:1,forest:1},riparian:{vegetation:.8,forest:.6},scrub:{vegetation:.6},meadow:{vegetation:.35,rural:.5},farmland:{vegetation:.2,rural:.7},garden:{vegetation:.6,rural:.3},built:{settlement:.6},rock:{exposure:.8},water:{water:.7},unknown:{}});
/** Blends a few queries of EarthLife's existing habitat provider; no new ecology. */
export function habitatInfluences(p,habitatAt){
 const out={};for(const [dx,dz,w] of [[0,0,.4],[-32,0,.15],[32,0,.15],[0,-32,.15],[0,32,.15]]){
 const h=habitatAt?.(p.x+dx,p.z+dz)??'unknown';for(const [k,v] of Object.entries(HABITAT_INFLUENCES[h]??{}))out[k]=(out[k]??0)+v*w;
 }return out;
}

/** Cheap frame synchronization. Spatial evidence retains its bounded cadence. */
export function syncEnvironment(context,environment){
 if(!context||!environment?.transition)return;
 context.worldTimeMs=environment.worldTimeMs;context.solarAltitude=environment.solar.altitude;
 context.localHour=environment.localHour;context.timeBasis='civil';context.season=environment.season;
 context.weather=environment.acousticWeather;context.environment=environment.transition;
}
