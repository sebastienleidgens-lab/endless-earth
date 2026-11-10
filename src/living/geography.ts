import { toLocal } from '../world/geo';
import { canWalk } from '../world/collisions';
import type { Terrain } from '../world/terrain';
// @ts-ignore Pure module also exercised directly by Node tests.
import { allowed } from './walk.mjs';
// @ts-ignore Pure module.
import { buildGraph, graphRoute } from './graph.mjs';
type Point={x:number;z:number;perchY?:number};
export const paths:{points:Point[];surface:string;name:string;tags:Record<string,string>}[]=[];
export const nature:Point[]=[];
export const water:Point[]=[];
export const waterLines:Point[][]=[];
// Additional acoustic views of the same source; never change walking geometry.
export const riverAreas:{rings:Point[][];tags:Record<string,string>}[]=[];
export const riverLines:Point[][]=[];
export const mappedWeirs:Point[][]=[];
export const acousticRoads:{points:Point[];tags:Record<string,string>}[]=[];
let ready=false;
export function navigationReady(){return ready;}
export async function loadNavigation(){
 const response=await fetch(`${import.meta.env.BASE_URL}data/angles-osm.geojson`);
 if(!response.ok)throw new Error('Navigation OSM indisponible');
 const data=await response.json();
 for(const f of data.features){
  const t=f.properties??{},g=f.geometry;
  const local=(p:number[])=>toLocal({lon:p[0],lat:p[1]});
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
 const h=terrain.relativeHeight(p.x,p.z);
 if(h===null)return false;
 return [[.5,0],[-.5,0],[0,.5],[0,-.5]].every(([x,z])=>{const v=terrain.relativeHeight(p.x+x,p.z+z);return v!==null&&Math.abs(v-h)<.3;});
}
let graph:ReturnType<typeof buildGraph>|null=null;
export function routeAt(p:Point,terrain:Terrain|null){const valid=(q:Point)=>validPoint(q,terrain);graph??=buildGraph(paths,valid);return graphRoute(graph,p,valid);}
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
