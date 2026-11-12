import {allowed} from '../living/walk.mjs';
export const SPAWN_VERSION='verified-sector-start-v1';
export function seededStart(seed){let s=2166136261;for(const c of String(seed))s=Math.imul(s^c.charCodeAt(0),16777619);return ()=>{s+=0x6d2b79f5;let v=Math.imul(s^s>>>15,1|s);v^=v+Math.imul(v^v>>>7,61|v);return ((v^v>>>14)>>>0)/4294967296}}
export function inspectStart(p,{height,clear,supported=()=>false,view=true}){
 const h=height(p.x,p.z);if(!Number.isFinite(h)||!clear(p.x,p.z)||supported(p.x,p.z))return null;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;for(const r of [.35,1]){const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,y=height(x,z);if(!Number.isFinite(y)||Math.abs(y-h)>.25*r+.015||!clear(x,z)||supported(x,z))return null}}
 if(!view)return {x:p.x,y:h,z:p.z,sector:`${Math.floor(p.x/200)},${Math.floor(p.z/200)}`,directions:[0]};
 const directions=[];for(let i=0;i<16;i++){const yaw=i*Math.PI/8;let distance=0;for(let r=.5;r<=6;r+=.5){const x=p.x-Math.sin(yaw)*r,z=p.z-Math.cos(yaw)*r,y=height(x,z);if(!clear(x,z)||!Number.isFinite(y)||Math.abs(y-h)>.3*r)break;distance=r}directions.push({yaw,distance})}
 const best=Math.max(...directions.map(d=>d.distance));if(best<3)return null;
 return {x:p.x,y:h,z:p.z,directions:directions.filter(d=>d.distance>=Math.max(3,best-1)).map(d=>d.yaw),sector:`${Math.floor(p.x/200)},${Math.floor(p.z/200)}`};
}
export function prepareStarts(lines,access){
 const points=[],seen=new Set();let sampled=0;
 for(const line of lines){if(!allowed(line.tags??{}))continue;let carry=3;for(let i=1;i<line.points.length;i++){const a=line.points[i-1],b=line.points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(!length)continue;for(;carry<=length;carry+=12){const p={x:a.x+(b.x-a.x)*carry/length,z:a.z+(b.z-a.z)*carry/length};if(Math.abs(p.x)>950||Math.abs(p.z)>950)continue;sampled++;const key=`${Math.floor(p.x/6)},${Math.floor(p.z/6)}`;if(seen.has(key))continue;seen.add(key);const valid=inspectStart(p,{...access,view:false});if(valid)points.push(valid)}carry-=length}}
 points.sort((a,b)=>a.x-b.x||a.z-b.z);const sectors=new Map();for(const p of points){if(!sectors.has(p.sector))sectors.set(p.sector,[]);sectors.get(p.sector).push(p)}
 return {version:SPAWN_VERSION,sampled,points,access,sectors:[...sectors].sort(([a],[b])=>a<b?-1:a>b?1:0)};
}
export function chooseStart(pool,seed,revision=''){
 if(!pool?.sectors.length)return null;const random=seededStart(String(seed)+'|'+revision);
 for(let attempt=0;attempt<32;attempt++){const [sector,points]=pool.sectors[Math.floor(random()*pool.sectors.length)],p=points[Math.floor(random()*points.length)],checked=pool.access?inspectStart(p,pool.access):p;if(!checked)continue;
 return {version:SPAWN_VERSION,seed:String(seed),revision,sector,x:p.x,y:p.y,z:p.z,yaw:checked.directions[Math.floor(random()*checked.directions.length)],candidates:pool.points.length,sectors:pool.sectors.length}}
 return null;
}
