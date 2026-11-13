import {clearSegment,distance,allowed} from './walk.mjs';
import {pedestrianAccess} from '../world/navigation.mjs';
// Artistic weights, explicit and deterministic; never popularity/visitor scores.
export const TOUR_WEIGHTS=Object.freeze({heritage:5,bridge:4,nature:3,street:1.5,path:2});
export function tourAllowed(t){return pedestrianAccess(t)&&!t.construction&&!t['access:conditional']&&!t['foot:conditional']&&(!t.tunnel||t.tunnel==='no')&&(!t.ford||t.ford==='no')&&(allowed(t)||['secondary','tertiary','steps'].includes(t.highway))}
/** Dijkstra on source-connected, directed pedestrian edges. Short connectors
 * require BOTH physical validation and a caller's explicit public corridor. */
export function tourRoute(graph,position,destinations,valid,{history=[],connector=()=>false,maxLength=900,maxConnector=12}={}){
 const {nodes,edges}=graph,cost=new Float64Array(nodes.length).fill(Infinity),previous=new Int32Array(nodes.length).fill(-1),seeds=new Map(),done=new Uint8Array(nodes.length);
 for(const e of edges){const a=nodes[e.from].point,b=nodes[e.to].point,dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/(dx*dx+dz*dz))),p={x:a.x+dx*t,z:a.z+dz*t},off=distance(position,p);
  if(off>maxConnector||!clearSegment(position,p,q=>valid(q)&&(off<.05||connector(q))))continue;
  for(const end of [e.from,e.to]){if(end===e.from&&!e.backward||end===e.to&&!e.forward)continue;const d=off+distance(p,nodes[end].point);if(d<cost[end]){cost[end]=d;seeds.set(end,[{x:position.x,z:position.z},p,nodes[end].point])}}
 }
 for(let iteration=0;iteration<nodes.length;iteration++){let at=-1,best=maxLength;for(let n=0;n<nodes.length;n++)if(!done[n]&&cost[n]<best){best=cost[n];at=n}if(at<0)break;done[at]=1;
  for(const id of nodes[at].edges){const e=edges[id],to=e.from===at?e.to:e.from;if((e.from===at&&!e.forward)||(e.to===at&&!e.backward))continue;const d=best+e.length;if(d<cost[to]){cost[to]=d;previous[to]=at;seeds.delete(to)}}
 }
 const candidates=[];
 for(const dest of destinations){if(dest.id===history.at(-1))continue;let node=-1,closest=dest.radius??45;
  for(let i=0;i<nodes.length;i++){const d=distance(dest.point,nodes[i].point);if(d<closest&&cost[i]>=12&&cost[i]<=maxLength){node=i;closest=d}}
  if(node<0)continue;const recent=history.lastIndexOf(dest.id),penalty=recent<0?1:.25+.05*(history.length-1-recent),weight=TOUR_WEIGHTS[dest.kind]??1;
  const score=weight*penalty/(1+cost[node]/220+closest/100);candidates.push({dest,node,score,length:cost[node],distanceToFeature:closest});
 }
 candidates.sort((a,b)=>b.score-a.score||a.dest.id.localeCompare(b.dest.id));
 for(const c of candidates){const tail=[];let n=c.node;while(previous[n]>=0){tail.push(nodes[n].point);n=previous[n]}const points=[...(seeds.get(n)??[]),...tail.reverse()].filter((p,i,a)=>i===0||distance(p,a[i-1])>1e-6);if(points.length<2)continue;
  // Revalidate only the chosen path; no per-frame graph rebuild or teleport.
  if(points.slice(1).some((p,i)=>!clearSegment(points[i],p,valid)))continue;
  return {points,length:c.length,name:c.dest.name,destination:{...c.dest,distanceToFeature:c.distanceToFeature,approach:true},score:c.score,provenance:'OSM destination and directed graph; physically validated public approach, no invented entrance',candidates:candidates.length};
 }
 return null;
}
