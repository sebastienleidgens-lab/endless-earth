import {tourAllowed} from '../living/tour.mjs';
import {roadWidth} from '../world/road-style.mjs';
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
/** Attach source restrictions to the EXISTING graph, without new connections. */
export function annotateGraph(graph,roads,habitat=()=> 'unknown'){
 if(!graph)return null;
 const cells=new Map();for(const r of roads){if(!tourAllowed(r.tags))continue;for(let j=1;j<r.points.length;j++){const a=r.points[j-1],b=r.points[j],segment={a,b,tags:r.tags};for(let x=Math.floor(Math.min(a.x,b.x)/32);x<=Math.floor(Math.max(a.x,b.x)/32);x++)for(let z=Math.floor(Math.min(a.z,b.z)/32);z<=Math.floor(Math.max(a.z,b.z)/32);z++){const k=x+','+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(segment)}}}
 const nodes=graph.nodes.map(n=>({point:{...n.point},edges:[...n.edges]}));
 const edges=graph.edges.map(e=>{const a=nodes[e.from].point,b=nodes[e.to].point,p={x:(a.x+b.x)/2,z:(a.z+b.z)/2};let tags=null,best=.12;
 for(const segment of cells.get(Math.floor(p.x/32)+','+Math.floor(p.z/32))??[]){const q=segment.a,s=segment.b,dx=s.x-q.x,dz=s.z-q.z,t=Math.max(0,Math.min(1,((p.x-q.x)*dx+(p.z-q.z)*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(p.x-q.x-t*dx,p.z-q.z-t*dz);if(d<best){best=d;tags=segment.tags}}
 const h=habitat(p.x,p.z),zone=tags?.bridge==='yes'?'bridge':h==='wood'?'forest':['path','track','footway'].includes(tags?.highway)?'path':tags?.highway==='residential'?'residential':'village';
 return {...e,tags,width:tags?roadWidth(tags).metres:0,zone,surface:tags?.surface??e.surface??'',admitted:!!tags};});
 return {nodes,edges};
}
export function modeAllowed(e,mode){const t=e.tags??{};if(e.admitted===false)return false;if(mode==='stroller')return e.width>=1.8&&!['steps','path','track'].includes(t.highway)&&!['no','limited'].includes(t.wheelchair)&&!['gravel','ground','dirt','sand','cobblestone'].includes(t.surface)&&!t.barrier;if(mode==='cycle')return ['residential','living_street','cycleway'].includes(t.highway)&&!['no','private','use_sidepath'].includes(t.bicycle)&&!t['bicycle:conditional']&&e.width>=3&&!t.bridge&&(!t.oneway||t.oneway==='no');return true;}
/** Bounded Dijkstra, once per intention; directed edges and nonrepeating nodes. */
export function lifeRoute(graph,origin,random,{mode='walk',min=65,max=600,avoid=[],goal:requestedGoal=null}={}){
 if(!graph?.nodes.length)return null;const {nodes,edges}=graph,n=nodes.length,cost=new Float64Array(n).fill(Infinity),prev=new Int32Array(n).fill(-1),via=new Int32Array(n).fill(-1),done=new Uint8Array(n);cost[origin]=0;
 for(let k=0;k<n;k++){let at=-1,best=max;for(let j=0;j<n;j++)if(!done[j]&&cost[j]<best){at=j;best=cost[j]}if(at<0)break;done[at]=1;for(const id of nodes[at].edges){const e=edges[id];if(!modeAllowed(e,mode))continue;const to=e.from===at?e.to:e.from;if(e.from===at&&!e.forward||e.to===at&&!e.backward)continue;const d=cost[at]+e.length;if(d<cost[to]){cost[to]=d;prev[to]=at;via[to]=id}}}
 const candidates=[];for(let j=0;j<n;j++)if(cost[j]>=min&&cost[j]<max&&!avoid.includes(j))candidates.push(j);if(!candidates.length)return null;
 const goal=requestedGoal===null?candidates[Math.floor(random()*candidates.length)]:candidates.includes(requestedGoal)?requestedGoal:null,chain=[];if(goal===null)return null;let j=goal;while(j!==origin){if(j<0||chain.length>n)return null;chain.push({node:j,edge:via[j]});j=prev[j]}chain.reverse();
 let length=0;const points=[{...nodes[origin].point,s:0,node:origin,edge:chain[0].edge}];for(const c of chain){const e=edges[c.edge];length+=distance(points.at(-1),nodes[c.node].point);points.push({...nodes[c.node].point,s:length,...c})}
 return {points,length,origin,goal,mode,zone:edges[chain[0].edge].zone??'village'};
}
export function pathPose(route,s,out={}){const a=route.points;let lo=0,hi=a.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(a[m].s<s)lo=m;else hi=m}const p=a[lo],q=a[hi],d=distance(p,q)||1,t=Math.max(0,Math.min(1,(s-p.s)/(q.s-p.s||1)));out.x=p.x+(q.x-p.x)*t;out.z=p.z+(q.z-p.z)*t;out.dx=(q.x-p.x)/d;out.dz=(q.z-p.z)/d;out.edge=q.edge;out.s=s;return out;}

/** Optional modes require the whole swept envelope and grade, not just a tag. */
export function validateLifeRoute(route,graph,height,clear){
 if(route.mode==='walk'||!height)return true;let last=null;
 for(let s=0;s<=route.length+.5;s+=.5){const p=pathPose(route,Math.min(s,route.length)),y=height(p.x,p.z);if(y===null||!Number.isFinite(y))return false;if(last&&Math.abs(y-last.y)/Math.max(.01,s-last.s)>(route.mode==='cycle'?.12:.10))return false;
 const width=route.mode==='cycle'?.65:.48;for(const side of [-width,width]){const x=p.x-p.dz*side,z=p.z+p.dx*side,h=height(x,z);if(!clear(x,z)||h===null||Math.abs(h-y)>.13)return false;}last={y,s};}return true;
}
