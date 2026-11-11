import {coverClass,coverPriority} from '../world/landcover.mjs';
// Regional interpretation, not a botanical survey. Metres, local coordinates.
export const POITOU=Object.freeze({id:'poitou-v2',spacing:14,maxSlope:.58,cellSize:128,detailRange:110,ecoRange:55});
export function noise(x,z,s=0){const v=Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453;return v-Math.floor(v)}
export function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes}return yes}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)}
export function ringDistance(p,r){return Math.min(...r.map((a,i)=>segmentDistance(p,a,r[(i+1)%r.length])))}
export function habitat(tags){if(tags['world:class'])return ['wood','scrub','meadow','orchard'].includes(tags['world:class'])?tags['world:class']:null;return tags.natural==='wood'||tags.landuse==='forest'?'wood':tags.landuse==='orchard'?'orchard':tags.natural==='scrub'?'scrub':['meadow','grass','village_green'].includes(tags.landuse)||tags.natural==='grassland'||tags.leisure==='park'?'meadow':null}
export function createEcology(features,height=()=>0,profile=POITOU){
 const polygons=features.filter(f=>f.rings?.length).map(f=>({...f,box:[Math.min(...f.rings[0].map(p=>p.x)),Math.min(...f.rings[0].map(p=>p.z)),Math.max(...f.rings[0].map(p=>p.x)),Math.max(...f.rings[0].map(p=>p.z))]}));
 const lines=features.filter(f=>f.line).flatMap(f=>f.line.slice(1).map((b,i)=>({a:f.line[i],b,tags:f.tags})));
 const covers=(p,f)=>p.x>=f.box[0]&&p.z>=f.box[1]&&p.x<=f.box[2]&&p.z<=f.box[3]&&inside(p,f.rings[0])&&!f.rings.slice(1).some(r=>inside(p,r));
 // A weir is transverse infrastructure, not a river centreline or habitat.
 const rivers=lines.filter(l=>['river','stream','canal'].includes(l.tags.waterway));
 const waterPolygons=polygons.filter(f=>f.tags.natural==='water'||f.tags.water);
 const waterDistance=p=>waterPolygons.reduce((d,f)=>Math.min(d,ringDistance(p,f.rings[0])),rivers.reduce((d,l)=>Math.min(d,segmentDistance(p,l.a,l.b)),Infinity));
 // Cache only local candidate lists, preserving source order and exact predicates.
 const habitats=polygons.filter(f=>coverClass(f.tags));
 const obstacles=polygons.filter(f=>f.tags.building||f.tags.natural==='water'||f.tags.water||f.tags.waterway||f.tags.historic);
 const segments=lines.filter(l=>l.tags.highway||l.tags.waterway||l.tags.barrier||l.tags.historic).map(l=>({...l,box:[Math.min(l.a.x,l.b.x),Math.min(l.a.z,l.b.z),Math.max(l.a.x,l.b.x),Math.max(l.a.z,l.b.z)]}));
 const localCache=new Map();
 const candidates=(p,radius)=>{const cx=Math.floor(p.x/128),cz=Math.floor(p.z/128),pad=Math.ceil((radius+6)/8)*8,key=`${cx}:${cz}:${pad}`;let result=localCache.get(key);if(!result){const touches=f=>f.box[0]<=(cx+1)*128+pad&&f.box[2]>=cx*128-pad&&f.box[1]<=(cz+1)*128+pad&&f.box[3]>=cz*128-pad;result={polygons:obstacles.filter(touches),lines:segments.filter(touches),habitats:habitats.filter(touches)};if(localCache.size>=128)localCache.delete(localCache.keys().next().value);localCache.set(key,result)}return result};
 const valid=(p,radius=.5)=>{
  const h=height(p.x,p.z);if(h===null||!Number.isFinite(h))return false;
  for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2]]){const q=height(p.x+dx,p.z+dz);if(q===null||Math.abs(q-h)/2>profile.maxSlope)return false}
  const local=candidates(p,radius);
  for(const f of local.polygons){const t=f.tags;if(p.x<f.box[0]-radius-2||p.z<f.box[1]-radius-2||p.x>f.box[2]+radius+2||p.z>f.box[3]+radius+2)continue;if(!t.building&&t.natural!=='water'&&!t.water&&!t.waterway&&!t.historic)continue;if(covers(p,f))return false;if((t.building||t.historic)&&Math.min(...f.rings.map(r=>ringDistance(p,r)))<radius+1.3)return false}
  for(const l of local.lines){const t=l.tags;if(!t.highway&&!t.waterway&&!t.barrier&&!t.historic)continue;const clearance=t.waterway?3:t.highway?(['path','footway','steps','track','pedestrian'].includes(t.highway)?1.25:2.75):1; if(segmentDistance(p,l.a,l.b)<clearance+radius+.6)return false}
  return true;
 };
 const biomeFeature=p=>{let best=null;for(const f of candidates(p,0).habitats)if(covers(p,f)&&(!best||coverPriority(f)>coverPriority(best)))best=f;return best};
 const biome=p=>{const f=biomeFeature(p);return f?habitat(f.tags):null};
 const trees=[],keys=new Set();
 const add=(p,mapped=false,tags={})=>{if(Math.abs(p.x)>980||Math.abs(p.z)>980||!valid(p,5.8))return;const k=`${Math.round(p.x)}:${Math.round(p.z)}`;if(keys.has(k))return;keys.add(k);const wet=waterDistance(p)<38,young=noise(p.x,p.z,3)<.16;trees.push({...p,y:height(p.x,p.z),kind:wet?'riparian':young?'young':'broadleaf',leaf:tags.leaf_type==='needleleaved'||tags.leaf_type==='mixed'&&noise(p.x,p.z,45)<.35?'needle':'broad',scale:young?.48+noise(p.x,p.z)*.24:.85+noise(p.x,p.z)*.7,mapped});};
 for(const f of features)if(f.point&&f.tags.natural==='tree')add(f.point,true,f.tags);
 for(const f of polygons){const type=habitat(f.tags);if(!type)continue;const step=type==='orchard'?16:profile.spacing;
  for(let z=Math.ceil(Math.max(-980,f.box[1])/step)*step;z<Math.min(980,f.box[3]);z+=step)for(let x=Math.ceil(Math.max(-980,f.box[0])/step)*step;x<Math.min(980,f.box[2]);x+=step){const p={x:x+(noise(x,z)-.5)*step*.8,z:z+(noise(x,z,1)-.5)*step*.8};if(!covers(p,f)||biomeFeature(p)!==f)continue;const n=noise(x,z,5);if(type==='meadow'&&n>.018||type==='scrub'&&n>.23)continue;add(p,false,f.tags)}
 }
 for(const l of rivers){const dx=l.b.x-l.a.x,dz=l.b.z-l.a.z,len=Math.hypot(dx,dz);if(!len)continue;const n=Math.ceil(len/27);for(let i=0;i<n;i++){const t=(i+.5)/n,x=l.a.x+dx*t,z=l.a.z+dz*t;for(const side of [-1,1]){if(noise(x,z,side)>.48)continue;const d=13+noise(x,z,8)*15,p={x:x-dz/len*d*side,z:z+dx/len*d*side};if(['wood','scrub'].includes(biome(p))&&!trees.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<10))add(p)}}}
 for(const f of waterPolygons){const r=f.rings[0];for(let i=1;i<r.length;i++){const a=r[i-1],b=r[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<1)continue;const n=Math.ceil(len/44);for(let j=0;j<n;j++){const t=(j+.5)/n,x=a.x+dx*t,z=a.z+dz*t;if(noise(x,z,31)>.42)continue;for(const side of [-1,1]){const offset=6+noise(x,z,32)*7,p={x:x-dz/len*offset*side,z:z+dx/len*offset*side};if(['wood','scrub'].includes(biome(p))&&!trees.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<12))add(p)}}}}
 // A global deterministic budget must not empty later source polygons. Keep
 // the lowest spatial hashes across the entire bounded pilot, with mapped
 // individual trees first. Selection changes density, never mapped outlines.
 if(trees.length>2500){const selected=new Set([...trees].sort((a,b)=>Number(b.mapped)-Number(a.mapped)||noise(a.x,a.z,91)-noise(b.x,b.z,91)||a.x-b.x||a.z-b.z).slice(0,2500));const kept=trees.filter(p=>selected.has(p));trees.splice(0,trees.length,...kept);}
 return {trees,valid,biome,waterDistance,profile};
}
export function detailRecipe(cx,cz,ecology,start=0,end=3200){
 const points=[],size=ecology.profile.cellSize;
 for(let i=start;i<Math.min(3200,end);i++){
  const x=(cx+noise(cx,cz,i+10))*size,z=(cz+noise(cx,cz,i+400))*size,p={x,z},biome=ecology.biome(p);
  if(!biome||!ecology.valid(p,.65))continue;
  const n=noise(x,z,9),patch=.55+.45*noise(Math.floor(x/7),Math.floor(z/7),44);
  if(n>.48*patch)continue;
  const wet=ecology.waterDistance(p)<18;
  const kind=biome==='wood'?(n<.10?'branch':n<.22?'fern':n<.245?'shrub':'leaf'):biome==='scrub'||biome==='orchard'?(n<.035?'shrub':wet&&n<.18?'reed':'grass'):wet&&n<.12?'reed':n<.009?'flower':n<.045?'stone':'grass';
  points.push({...p,y:0,kind,habitat:biome,wet,scale:.35+noise(x,z,13)*.65,angle:noise(x,z,21)*Math.PI*2});
 }
 return points;
}
