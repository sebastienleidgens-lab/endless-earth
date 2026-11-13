import {inside,ringDistance,segmentDistance,habitat} from './ecology.mjs';
import {coverClass,coverPriority} from '../world/landcover.mjs';
import {forestHash,forestLayout,FOREST_VERSION} from './forest-model.mjs';
// Integer mixing avoids libm sin differences between offline Node and Chromium.
const noise=(x,z,salt)=>{let h=forestHash(x,z,salt);h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967296};
const quantize=v=>Math.round(v*1e6)/1e6; // Rendering identity, not survey precision.


export function forestHabitat(features,height=()=>0){
 const cells=new Map(),objects=[];
 const add=(object,box,pad=0)=>{objects.push(object);for(let x=Math.max(-17,Math.floor((box[0]-pad)/64));x<=Math.min(17,Math.floor((box[2]+pad)/64));x++)for(let z=Math.max(-17,Math.floor((box[1]-pad)/64));z<=Math.min(17,Math.floor((box[3]+pad)/64));z++){const k=x+':'+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(object)}};
 for(const f of features){if(f.rings?.length){const r=f.rings[0],box=[Math.min(...r.map(p=>p.x)),Math.min(...r.map(p=>p.z)),Math.max(...r.map(p=>p.x)),Math.max(...r.map(p=>p.z))];if(box[0]>1050||box[1]>1050||box[2]<-1050||box[3]<-1050)continue;const t=f.tags??{};if(coverClass(t)||t.building||t.historic||t.natural==='water'||t.water||t.waterway)add({f,box,polygon:true},box,48)}
  if(f.line)for(let i=1;i<f.line.length;i++){const a=f.line[i-1],b=f.line[i],t=f.tags??{};if(t.highway||t.waterway||t.barrier||t.historic)add({a,b,t},[Math.min(a.x,b.x),Math.min(a.z,b.z),Math.max(a.x,b.x),Math.max(a.z,b.z)],48)}
 }
 const covers=(p,f)=>inside(p,f.rings[0])&&!f.rings.slice(1).some(r=>inside(p,r));
 const context=p=>{
  let cover=null,clearance=Infinity,water=Infinity,edge=Infinity;const nearby=cells.get(Math.floor(p.x/64)+':'+Math.floor(p.z/64))??[];
  for(const o of nearby){if(!o.polygon)continue;const {f}=o,t=f.tags??{};if(coverClass(t)&&covers(p,f)&&(!cover||coverPriority(f)>coverPriority(cover)))cover=f;
   if(t.building||t.historic){const inWall=covers(p,f);clearance=Math.min(clearance,inWall?0:Math.min(...f.rings.map(r=>ringDistance(p,r))))}
   if(t.natural==='water'||t.water){water=Math.min(water,covers(p,f)?0:Math.min(...f.rings.map(r=>ringDistance(p,r))))}
  }
  if(cover)edge=Math.min(...cover.rings.map(r=>ringDistance(p,r)));
  for(const o of nearby)if(!o.polygon&&['river','stream','canal'].includes(o.t.waterway))water=Math.min(water,segmentDistance(p,o.a,o.b));
  return {habitat:cover?habitat(cover.tags):null,cover:cover?.tags??null,clearance,water,edge,nearby};
 };
 const valid=(p,radius=.6)=>{const c=context(p),h=height(p.x,p.z);if(h===null||!Number.isFinite(h)||c.clearance<radius+1.3)return false;
  for(const [dx,dz]of [[2,0],[-2,0],[0,2],[0,-2]]){const q=height(p.x+dx,p.z+dz);if(q===null||Math.abs(q-h)/2>.58)return false}
  for(const o of c.nearby){if(o.polygon){if((o.f.tags.natural==='water'||o.f.tags.water||o.f.tags.waterway)&&covers(p,o.f))return false;continue}
   const t=o.t,margin=t.highway?(['path','footway','steps','track','pedestrian'].includes(t.highway)?1.25:2.75):t.waterway?3:1;
   if(segmentDistance(p,o.a,o.b)<margin+radius+.65)return false;
  }return true;
 };
 return {context,valid,height,cells,objects};
}
const smooth=(x,z,size)=>{const a=Math.floor(x/size),b=Math.floor(z/size),u=(x/size-a)**2*(3-2*(x/size-a)),v=(z/size-b)**2*(3-2*(z/size-b));return (noise(a,b,171)*(1-u)+noise(a+1,b,171)*u)*(1-v)+(noise(a,b+1,171)*(1-u)+noise(a+1,b+1,171)*u)*v};
export function planForest(anchors,features,height,models,{infill=true,maxAdded=2000}={}){
 const geo=forestHabitat(features,height),trees=anchors.map(p=>({...p})),index=new Map(),key=p=>Math.floor(p.x/16)+':'+Math.floor(p.z/16),add=p=>{const k=key(p);if(!index.has(k))index.set(k,[]);index.get(k).push(p)};trees.forEach(add);
 const nearby=p=>{const a=[];for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)a.push(...(index.get((Math.floor(p.x/16)+x)+':'+(Math.floor(p.z/16)+z))??[]));return a};
 const candidates=[];let woodSamples=0;
 if(infill)for(let z=-972;z<=972;z+=12)for(let x=-972;x<=972;x+=12){const p={x:quantize(x+(noise(x,z,174)-.5)*9),z:quantize(z+(noise(x,z,175)-.5)*9)},c=geo.context(p);if(c.habitat!=='wood')continue;woodSamples++;const patch=smooth(p.x,p.z,78)*.65+smooth(p.x,p.z,31)*.35;
  if(patch<.30||c.edge<3||noise(x,z,176)>.20+patch*.63||!geo.valid(p,1.1))continue;
  candidates.push({...p,y:quantize(height(p.x,p.z)),kind:c.water<32?'riparian':c.edge<14||noise(x,z,177)<.40?'young':'broadleaf',leaf:c.cover?.leaf_type==='needleleaved'?'needle':'broad',scale:quantize(.52+noise(x,z,178)*.50),mapped:false,forestAdded:true,patch,priority:forestHash(p.x,p.z,179)});
 }
 candidates.sort((a,b)=>a.priority-b.priority);
 let spacingRejected=0,clearanceRejected=0;
 for(const p of candidates){const local=nearby(p),minimum=p.kind==='young'?7.2:9.5;if(local.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<minimum)){spacingRejected++;continue}
  // Limit localized stems per 16 m neighbourhood, rather than filling every cell.
  if(local.filter(q=>Math.hypot(p.x-q.x,p.z-q.z)<16).length>=5)continue;
  const layout=forestLayout(p,geo.context(p),models);if(!layout.clear){clearanceRejected++;continue}delete p.priority;delete p.patch;trees.push(p);add(p);if(trees.length-anchors.length>=maxAdded)break;
 }
 const layouts=trees.map(p=>forestLayout(p,geo.context(p),models)),families={};for(const p of layouts)families[p.id]=(families[p.id]??0)+1;
 return {version:FOREST_VERSION,trees,layouts,geo,stats:{original:anchors.length,total:trees.length,added:trees.length-anchors.length,mapped:anchors.filter(p=>p.mapped).length,woodSamples,candidates:candidates.length,spacingRejected,clearanceRejected,additionLimit:maxAdded,limitReached:trees.length-anchors.length>=maxAdded,families,unsupported:layouts.filter(p=>!p.clear).length,provenance:'Original anchors preserved; supplementary inferred individuals only inside existing mapped wood, deterministic clustered infill. No surveyed trees/species/heights added.'}};
}
