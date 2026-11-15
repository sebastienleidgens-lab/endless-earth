const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const CLOSED=new Set(['no','private','customers','permit','agricultural','forestry']);
const ROAD=new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','unclassified','residential','living_street','service']);
export function admitFeature(tags,mode,policy={publicRoadClasses:true}){
 if(!tags||CLOSED.has(tags.access)||tags.construction||tags.proposed||tags.disused==='yes'||tags.abandoned==='yes')return {ok:false,reason:'restricted-or-inactive'};
 if(tags.bridge==='yes'||tags.tunnel==='yes'||Number(tags.layer??0)!==0)return {ok:false,reason:'unverified-vertical-structure'};
 if(mode==='car'){
  if(CLOSED.has(tags.motor_vehicle)||CLOSED.has(tags.vehicle))return {ok:false,reason:'motor-access'};
  if(!ROAD.has(tags.highway))return {ok:false,reason:'not-a-motor-road'};
  if(tags.highway==='service'&&!['yes','permissive','designated'].includes(tags.access)&&!['yes','designated'].includes(tags.motor_vehicle))return {ok:false,reason:'unknown-service-access'};
  return policy.publicRoadClasses||['yes','permissive','designated'].includes(tags.motor_vehicle??tags.access)?{ok:true,provenance:'OSM tags + explicit regional road-class access policy; not field-verified'}:{ok:false,reason:'unknown-access'};
 }
 if(mode==='foot'){
  if(CLOSED.has(tags.foot)||['motorway','motorway_link','trunk','trunk_link','raceway'].includes(tags.highway))return {ok:false,reason:'pedestrian-access'};
  return ['footway','path','pedestrian','steps','track','cycleway','residential','living_street','unclassified','tertiary','secondary'].includes(tags.highway)?{ok:true,provenance:'OSM pedestrian access interpreted under regional policy'}:{ok:false,reason:'unknown-foot-access'};
 }
 if(mode==='rail')return tags.railway==='rail'&&!['disused','abandoned','construction','proposed'].some(k=>tags[k])?{ok:true}:{ok:false,reason:'inactive-rail'};
 if(mode==='boat')return tags.simulatedNavigation==='admitted'&&tags.clearance==='verified'?{ok:true}:{ok:false,reason:'unknown-water-clearance'};
 return {ok:false,reason:'unknown-mode'};
}
export function directed(tags,mode){return mode==='car'?(tags.oneway==='-1'?-1:['yes','1','true'].includes(tags.oneway)||tags.junction==='roundabout'?1:0):mode==='foot'&&tags['oneway:foot']==='yes'?1:0;}
export const nodeId=p=>`${Math.round(p.x*1000)},${Math.round(p.y*1000)},${p.level??0}`;
/** Exact source-node topology; geometric crossings never imply junctions. */
export class TiledNetwork {
 constructor(mode='foot',policy){this.mode=mode;this.policy=policy;this.tiles=new Map();this.features=new Map();this.nodes=new Map();this.metrics={features:0,nodes:0,edges:0,refused:0,routes:0,visited:0};}
 add(tile){this.remove(tile.id);const ids=[];for(const f of tile.features){if(!['road','rail','hydro'].includes(f.kind))continue;ids.push(f.id);const old=this.features.get(f.id);if(old){old.owners.add(tile.id);continue;}const admission=admitFeature(f.tags,this.mode,this.policy);const edges=[];this.features.set(f.id,{owners:new Set([tile.id]),feature:f,edges});if(!admission.ok){this.metrics.refused++;continue;}
   const direction=directed(f.tags,this.mode);
   for(let i=1;i<f.points.length;i++){
    const pa={x:f.points[i-1][0],y:f.points[i-1][1]},pb={x:f.points[i][0],y:f.points[i][1]},level=f.tags.layer??'0';
    const aid=f.nodes?.[i-1]?`osm:${f.nodes[i-1]}:${level}`:nodeId({...pa,level}),bid=f.nodes?.[i]?`osm:${f.nodes[i]}:${level}`:nodeId({...pb,level});if(aid===bid)continue;
    if(!this.nodes.has(aid))this.nodes.set(aid,{id:aid,...pa,links:new Map()});if(!this.nodes.has(bid))this.nodes.set(bid,{id:bid,...pb,links:new Map()});const a=this.nodes.get(aid),b=this.nodes.get(bid),length=distance(a,b);if(!Number.isFinite(length)||length<=0)continue;
    if(direction>=0){const id=f.id+':'+i+':f';a.links.set(id,{id,to:b.id,distance:length,feature:f});edges.push([a.id,id]);}
    if(direction<=0){const id=f.id+':'+i+':r';b.links.set(id,{id,to:a.id,distance:length,feature:f});edges.push([b.id,id]);}
   }
  }this.tiles.set(tile.id,ids);this.refresh();}
 remove(id){for(const fid of this.tiles.get(id)??[]){const f=this.features.get(fid);f.owners.delete(id);if(f.owners.size)continue;for(const [node,edge]of f.edges)this.nodes.get(node)?.links.delete(edge);this.features.delete(fid);}this.tiles.delete(id);const used=new Set();for(const n of this.nodes.values())for(const e of n.links.values()){used.add(n.id);used.add(e.to)}for(const id of this.nodes.keys())if(!used.has(id))this.nodes.delete(id);this.refresh();}
 refresh(){this.metrics.features=this.features.size;this.metrics.nodes=this.nodes.size;this.metrics.edges=[...this.nodes.values()].reduce((n,v)=>n+v.links.size,0);}
 nearest(p,max=25){let result=null,best=max;for(const n of this.nodes.values()){const d=distance(p,n);if(d<best){result=n;best=d;}}return result;}
 route(from,to,{maxVisited=30000}={}){const a=typeof from==='string'?this.nodes.get(from):this.nearest(from),b=typeof to==='string'?this.nodes.get(to):this.nearest(to);if(!a||!b)return null;this.metrics.routes++;const open=new Map([[a.id,0]]),g=new Map([[a.id,0]]),parents=new Map(),closed=new Set();let visited=0;
  while(open.size&&visited++<maxVisited){let id=null,score=Infinity;for(const [k,v]of open)if(v<score){score=v;id=k}open.delete(id);if(id===b.id){const points=[],features=[];let at=id;while(at){points.push(this.nodes.get(at));const p=parents.get(at);if(p)features.push(p.edge.feature.id);at=p?.from;}this.metrics.visited=visited;return {points:points.reverse().map(p=>({x:p.x,y:p.y,id:p.id})),features:features.reverse(),distance:g.get(id),mode:this.mode,complete:true};}closed.add(id);for(const e of this.nodes.get(id).links.values()){if(closed.has(e.to))continue;const next=g.get(id)+e.distance;if(next>=(g.get(e.to)??Infinity))continue;g.set(e.to,next);parents.set(e.to,{from:id,edge:e});open.set(e.to,next+distance(this.nodes.get(e.to),b));}}
  this.metrics.visited=visited;return null;
 }
 clear(){this.tiles.clear();this.features.clear();this.nodes.clear();this.refresh();}
}
