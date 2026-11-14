import {distance,clearSegment,allowed} from './walk.mjs';
// Only coincident source vertices connect; never infer crossings or repair gaps.
export function buildGraph(lines,valid,admit=allowed,sweep=null){
 const nodes=[],edges=[],cells=new Map();
 function node(p,layer){const key=`${Math.round(p.x*100)},${Math.round(p.z*100)},${layer}`,old=cells.get(key);if(old!==undefined&&distance(nodes[old].point,p)<.01)return old;const id=nodes.length;nodes.push({point:p,edges:[]});cells.set(key,id);return id;}
 for(const line of lines){if(line.tags&&!admit(line.tags))continue;
  for(let i=1;i<line.points.length;i++){const a=line.points[i-1],b=line.points[i];if(distance(a,b)<.01||!clearSegment(a,b,valid)||sweep&&(!sweep(a,b)||!sweep(b,a)))continue;
   const from=node(a,line.tags?.layer??'0'),to=node(b,line.tags?.layer??'0'),id=edges.length;
   const direction=line.tags?.['oneway:foot'],forward=direction!=='-1'&&line.tags?.['foot:forward']!=='no',backward=!['yes','1','true'].includes(direction)&&line.tags?.['foot:backward']!=='no';
   edges.push({from,to,forward,backward,length:distance(a,b),name:line.name,surface:line.surface});if(forward)nodes[from].edges.push(id);if(backward)nodes[to].edges.push(id);
  }
 }return {nodes,edges};
}
export function graphRoute({nodes,edges},position,valid,maxDistance=450){
 let best=null,beam=[];
 for(const e of edges){const a=nodes[e.from].point,b=nodes[e.to].point,dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/(dx*dx+dz*dz))),p={x:a.x+dx*t,z:a.z+dz*t};
  if(distance(position,p)>.8||!clearSegment(position,p,valid))continue;
  for(const end of [e.from,e.to]){if(end===e.from&&!e.backward||end===e.to&&!e.forward)continue;const q=nodes[end].point;beam.push({node:end,visited:new Set([e.from,e.to]),points:[position,p,q],length:distance(position,p)+distance(p,q),name:e.name,surface:e.surface});}
 }
 // Bounded beam search, no repeated nodes and hence no artificial backtracking.
 for(let depth=0;beam.length&&depth<512;depth++){const next=[];
  for(const state of beam){if(state.length>3&&(!best||state.length>best.length))best=state;
   for(const id of nodes[state.node].edges){const e=edges[id],to=e.from===state.node?e.to:e.from;if(state.visited.has(to))continue;const visited=new Set(state.visited);visited.add(to);next.push({...state,node:to,visited,points:[...state.points,nodes[to].point],length:state.length+e.length});}
  }next.sort((a,b)=>b.length-a.length);beam=next.slice(0,48);
 }if(!best)return null;
 const points=[best.points[0]];let length=0;
 for(const p of best.points.slice(1)){const a=points.at(-1),d=distance(a,p);if(d<.000001)continue;
  if(length+d>maxDistance){const fraction=(maxDistance-length)/d;points.push({x:a.x+(p.x-a.x)*fraction,z:a.z+(p.z-a.z)*fraction});length=maxDistance;break;}
  points.push(p);length+=d;
 }
 return {points,length,name:best.name,surface:best.surface};
}
