// @ts-ignore Directed destination-oriented discovery; original spawn graph retained.
import {tourAllowed,tourRoute} from './tour.mjs';
// @ts-ignore Shared source metric corridor widths.
import {roadWidth} from '../world/road-style.mjs';
// @ts-ignore Access and physical roles remain separate from surface material.
import {roadCategory} from '../world/road-category.mjs';
// @ts-ignore Validated, source-bound derivative of this exact navigation graph.
import {readWalkGraph} from './walk-graph-cache.mjs';
import { toLocal } from '../world/geo';
import { canWalk,walkingHeight } from '../world/collisions';
import type { Terrain } from '../world/terrain';
// @ts-ignore Pure module also exercised directly by Node tests.
import { allowed } from './walk.mjs';
// @ts-ignore Pure module.
import { buildGraph, graphRoute } from './graph.mjs';
type Point={x:number;z:number;perchY?:number};
export const paths:{points:Point[];surface:string;name:string;tags:Record<string,string>}[]=[];
export const roadInventory:Array<{id:unknown;name:unknown;category:string;role:string;carAccess:string;surface:unknown;width:unknown;confidence:string}>=[];
export const nature:Point[]=[];
export const water:Point[]=[];
export const waterLines:Point[][]=[];
// Additional acoustic views of the same source; never change walking geometry.
export const riverAreas:{rings:Point[][];tags:Record<string,string>}[]=[];
export const riverLines:Point[][]=[];
export const mappedWeirs:Point[][]=[];
export const acousticRoads:{points:Point[];tags:Record<string,string>}[]=[];
let ready=false;const tourDestinations:any[]=[],tourHistory:string[]=[];let tourGraph:any=null;
export function navigationReady(){return ready;}
export async function loadNavigation(){
 const response=await fetch(`${import.meta.env.BASE_URL}data/angles-osm.geojson`);
 if(!response.ok)throw new Error('Navigation OSM indisponible');
 const data=await response.json();
 for(const f of data.features){
  const t=f.properties??{},g=f.geometry;
  if(g?.type==='LineString'&&t.highway)roadInventory.push({id:t.osm_id,name:t.name??null,...roadCategory(t)});
  const local=(p:number[])=>toLocal({lon:p[0],lat:p[1]});
  const coords=g?.type==='Point'?[g.coordinates]:g?.type==='Polygon'?g.coordinates[0]:g?.type==='LineString'?g.coordinates:[];
  const kind=t.historic?'heritage':t.bridge==='yes'?'bridge':t.building==='church'||t.building==='chapel'?'heritage':null;
  if(kind&&coords.length){const points=coords.map(local),point=points.reduce((a:any,p:any)=>({x:a.x+p.x/points.length,z:a.z+p.z/points.length}),{x:0,z:0});tourDestinations.push({id:'osm:'+t.osm_id,point,kind,name:kind==='bridge'?'les abords du pont':t.name?'les abords de '+t.name:'le patrimoine cartographié',radius:kind==='heritage'?85:55,source:'OSM '+t.osm_id})}
  if(g?.type==='LineString'&&tourAllowed(t)&&t.bridge!=='yes'&&(t.name||['footway','path','track'].includes(t.highway))){const p=local(g.coordinates[Math.floor(g.coordinates.length/2)]);tourDestinations.push({id:'way:'+t.osm_id,point:p,kind:['footway','path','track'].includes(t.highway)?'path':'street',name:t.name??'un sentier cartographié',radius:22,source:'OSM '+t.osm_id})}
  if(g?.type==='LineString'&&allowed(t))paths.push({points:g.coordinates.map(local),surface:t.surface??'',name:t.name??'Voie OSM',tags:t});
  if(g?.type==='Point'&&t.natural==='tree')nature.push(local(g.coordinates));
  if(g?.type==='LineString'&&t.waterway){const line=g.coordinates.map(local);water.push(...line);waterLines.push(line);}
  if(g?.type==='LineString'&&['river','stream'].includes(t.waterway))riverLines.push(Object.assign(g.coordinates.map(local),{tags:t}));
  if(g?.type==='LineString'&&t.waterway==='weir')mappedWeirs.push(g.coordinates.map(local));
  if(g?.type==='Polygon'&&t.natural==='water'&&t.water==='river')riverAreas.push({rings:g.coordinates.map((r:number[][])=>r.map(local)),tags:t});
  if(g?.type==='LineString'&&t.highway)acousticRoads.push({points:g.coordinates.map(local),tags:t});
 }
 ready=true;
}
export function validPoint(p:Point,terrain:Terrain|null){
 if(!canWalk(p.x,p.z))return false;
 if(!terrain)return true;
 const support=walkingHeight((x:number,z:number)=>terrain.relativeHeight(x,z));
 const h=support(p.x,p.z);
 if(h===null)return false;
 return [[.5,0],[-.5,0],[0,.5],[0,-.5]].every(([x,z])=>{const v=support(p.x+x,p.z+z);return v!==null&&Math.abs(v-h)<.3;});
}
let graph:ReturnType<typeof buildGraph>|null=null;
export const navigationGraphStats={state:'idle',nodes:0,edges:0};
export function walkingGraphBindings(terrain:Terrain){return {terrain:terrain.sourceSha256,refinement:terrain.relief?.sha256,surface:terrain.singleSurface?.manifest.binarySha256,osm:terrain.singleSurface?.manifest.osmSha256,policy:'capsule-0.3-grounded-0.7-landing0.18-v16'}}
const makeTourGraph=(terrain:Terrain)=>buildGraph(acousticRoads.map(r=>({...r,name:r.tags.name??'Voie piétonne OSM',surface:r.tags.surface??''})),(q:Point)=>validPoint(q,terrain),tourAllowed);
export function prepareGraphForDiagnostics(terrain:Terrain){if(new URLSearchParams(location.search).has('tourBuild'))tourGraph=makeTourGraph(terrain);graph=buildGraph(paths,(q:Point)=>validPoint(q,terrain));Object.assign(navigationGraphStats,{state:'prepared',nodes:graph.nodes.length,edges:graph.edges.length});return graph}
export function exportNavigationGraph(){return graph}
export function hasPreparedGraph(){return graph!==null}
export async function loadPreparedGraph(terrain:Terrain){navigationGraphStats.state='loading';try{graph=await readWalkGraph(import.meta.env.BASE_URL+'data/',walkingGraphBindings(terrain));Object.assign(navigationGraphStats,{state:'ready',nodes:graph!.nodes.length,edges:graph!.edges.length});tourGraph=new URLSearchParams(location.search).has('tourBuild')?makeTourGraph(terrain):await readWalkGraph(import.meta.env.BASE_URL+'data/',walkingGraphBindings(terrain),'angles-tour-graph').catch(()=>graph)}catch(error){graph=null;navigationGraphStats.state='unavailable';console.warn('Prepared walking graph unavailable; manual walking remains ready',error)}}
export function rememberTour(id:string){tourHistory.push(id);if(tourHistory.length>8)tourHistory.shift()}
export function exportTourGraph(){return tourGraph}
export function tourDiagnostics(){return {nodes:tourGraph?.nodes.length??0,edges:tourGraph?.edges.length??0,destinations:tourDestinations,history:[...tourHistory]}}
export function routeAt(p:Point,terrain:Terrain|null){
 if(!tourGraph)return null;
 // A short connection is allowed only inside an admitted mapped public way's
 // metric corridor. Unverified fields/private land never become shortcuts.
 const connector=(q:Point)=>acousticRoads.some(r=>{if(!tourAllowed(r.tags))return false;const width=roadWidth(r.tags).metres/2;return r.points.slice(1).some((b,i)=>{const a=r.points[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(q.x-a.x-t*dx,q.z-a.z-t*dz)<=Math.max(.35,width-.3)})});
 return tourRoute(tourGraph,p,tourDestinations,(q:Point)=>validPoint(q,terrain),{history:tourHistory,connector});
}
export function surfaceAt(p:Point){
 let best=Infinity,surface='grass';
 for(const line of paths)for(let i=1;i<line.points.length;i++){
  const a=line.points[i-1],b=line.points[i],dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz;
  const t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;
  const d=Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);
  if(d<3&&d<best){best=d;surface=line.surface;}
 }
 return surface;
}
