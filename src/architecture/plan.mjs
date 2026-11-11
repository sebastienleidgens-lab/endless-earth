import {POITOU} from './style.mjs';
import {buildingAppearance} from './appearance.mjs';
export function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function metres(v){const s=String(v??'').trim().replace(',','.');return /^\d+(\.\d+)?\s*m?$/.test(s)?Number.parseFloat(s):null}
export function edgeKey(a,b){const p=[a,b].map(p=>`${Math.round(p.x*100)},${Math.round(p.z*100)}`).sort();return p.join('|')}
export function cleanRing(ring){
 const r=ring.filter((p,i)=>!i||Math.hypot(p.x-ring[i-1].x,p.z-ring[i-1].z)>.01);
 if(r.length>1&&Math.hypot(r[0].x-r.at(-1).x,r[0].z-r.at(-1).z)<.01)r.pop();
 const area=r.reduce((s,a,i)=>{const b=r[(i+1)%r.length];return s+a.x*b.z-b.x*a.z},0);
 if(area<0)r.reverse();
 let first=0;for(let i=1;i<r.length;i++)if(r[i].x<r[first].x||r[i].x===r[first].x&&r[i].z<r[first].z)first=i;
 return [...r.slice(first),...r.slice(0,first)];
}
// Canonical footprint seed survives starting-vertex changes, winding and loading order.
export function buildingPlan(input,tags={},style=POITOU,shared=new Set(),ground=()=>0){
 const ring=cleanRing(input);if(ring.length<3||ring.some(p=>!Number.isFinite(p.x+p.z)))return null;
 const seed=hash(`${style.geometrySeed??style.id}:${tags.osm_id??tags['@id']??tags.id??ring.map(p=>`${p.x.toFixed(2)},${p.z.toFixed(2)}`).sort().join(';')}`);
 const area=ring.reduce((s,a,i)=>{const b=ring[(i+1)%ring.length];return s+a.x*b.z-b.x*a.z},0)/2;if(Math.abs(area)<1e-4)return null;
 const edges=ring.map((a,i)=>{const b=ring[(i+1)%ring.length],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);return {a,b,dx,dz,length,key:edgeKey(a,b),index:i}});
 const longest=[...edges].sort((a,b)=>b.length-a.length||a.key.localeCompare(b.key))[0],ux=longest.dx/longest.length,uz=longest.dz/longest.length;
 const along=p=>p.x*ux+p.z*uz,across=p=>-p.x*uz+p.z*ux;
 const v=ring.map(across),u=ring.map(along),vmin=Math.min(...v),vmax=Math.max(...v),width=vmax-vmin;
 const g=ring.map(p=>ground(p.x,p.z)??0),base=Math.min(...g),high=Math.max(...g);
 const small=['shed','garage','garages','hut'].includes(tags.building);
 const explicit=metres(tags.height),levels=Number(tags['building:levels']);
 const total=explicit&&explicit>=2&&explicit<=80?explicit:Number.isFinite(levels)&&levels>=1&&levels<=20?levels*style.floorHeight+1.6:small?3.4:7.2+(seed%4)*.38;
 const requestedShape=String(tags['roof:shape']??'gabled');
 const shape=['gabled','flat','hipped','pyramidal'].includes(requestedShape)?requestedShape:'flat';
 const angle=Number(tags['roof:angle']);
 const requested=metres(tags['roof:height'])??(Number(tags['roof:levels'])>0?Number(tags['roof:levels'])*2.5:null);
 const rise=shape==='flat'?0:requested!==null&&requested>0?Math.min(Math.max(0,total-2.2),requested):Math.min(total*.29,Math.tan((angle>5&&angle<65?angle:style.pitches[seed%style.pitches.length])*Math.PI/180)*width/2);
 const eaves=high+total-rise,top=high+total,mid=(vmin+vmax)/2;
 // Roof planes clipped to the actual footprint by the renderer. Boundary infill
 // closes irregular gables; no overhang extends into the navigation envelope.
 const uMin=Math.min(...u),uMax=Math.max(...u);
 const roofPlanes=shape==='flat'?[()=>0]:[p=>1+(across(p)-mid)/(width/2),p=>1-(across(p)-mid)/(width/2)];
 if(shape==='hipped'||shape==='pyramidal'){
  const endRun=shape==='pyramidal'?(uMax-uMin)/2:Math.min(width/2,(uMax-uMin)/2);
  roofPlanes.push(p=>(along(p)-uMin)/endRun,p=>(uMax-along(p))/endRun);
 }
 const roofY=p=>eaves+rise*Math.max(0,Math.min(...roofPlanes.map(f=>f(p))));
 const floors=Math.max(1,Math.min(6,Math.ceil((total-rise)/style.floorHeight)));
 const openings=[];let door=false;
 for(const edge of [...edges].sort((a,b)=>a.key.localeCompare(b.key))){
  const {a,dx,dz,length,key}=edge;if(width<.4||length<2.6||length>55||shared.has(key))continue;
  const nx=(area>0?1:-1)*dz/length,nz=(area>0?-1:1)*dx/length;
  const n=Math.min(7,Math.floor(length/2.8)),eh=hash(`${seed}:${key}`),w=.78+(eh%4)*.08,h=1.18+(eh%3)*.09;
  for(let floor=0;floor<floors;floor++)for(let col=0;col<n;col++){
   const s=length*(col+1)/(n+1);if(s-w/2<.65||s+w/2>length-.65)continue;
   const x=a.x+dx*s/length,z=a.z+dz*s/length,localGround=ground(x,z);if(localGround===null)continue;
   const entrance=!small&&!door&&floor===0&&col===Math.floor(n/2)&&localGround+2.5<eaves;
   const bottom=entrance?Math.max(base,localGround)+.025:high+.95+floor*style.floorHeight;
   const height=entrance?2.12:h;if(bottom+height>eaves-.28||bottom<(localGround??0)+(entrance?0:.45))continue;
   // Frames, shutters and planters are drawn recessed INSIDE the mapped wall.
   openings.push({edge:edge.index,s,x,z,nx,nz,ux:dx/length,uz:dz/length,width:entrance?1.02:w,height,bottom,kind:entrance?'door':'window',shutters:!entrance&&(eh+col)%4!==0,planter:!entrance&&floor===0&&(eh+col)%5===0});if(entrance)door=true;
  }
 }
 return {version:1,seed,ring,edges,base,eaves,top,total,rise,roofY,roofPlanes,ux,uz,mid,width,uMin,uMax,along,across,openings,floors,shape,appearance:buildingAppearance(seed,tags,style),
  wall:seed%style.walls.length,roof:(seed>>>5)%style.roofs.length,shutter:(seed>>>9)%style.shutters.length,
  inferred:{height:!((explicit!==null&&explicit>=2&&explicit<=80)||(Number.isFinite(levels)&&levels>=1&&levels<=20)),roof:!tags['roof:shape']||shape!==requestedShape,openings:true},
  // Future interaction anchors describe closed, decorative doors, never access.
  anchors:openings.filter(o=>o.kind==='door').map(o=>({x:o.x,y:o.bottom,z:o.z,interactive:false})),
 };
}
export function detailVisible(wasVisible,distance,low=false,style=POITOU){const d=low?style.detailDistance.low:style.detailDistance.high;return distance<d+(wasVisible?12:0)}
