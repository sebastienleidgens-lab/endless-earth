// Tourism-office POIs establish a public rest use, not surveyed furniture.
// No bench, table, building opening or new rendered path is asserted.
export const PUBLIC_REST_SITES=Object.freeze([
 {id:'jardin-communal',lat:46.69503,lon:.88196,name:'Jardin communal / Champ de Foire',source:'https://www.cirkwi.com/fr/point-interet/5786185-aire-de-pique-nique-du-jardin-communal-d-angles-sur-l-anglin',updated:'2026-09-26'},
 {id:'quai-perivier',lat:46.6954931,lon:.8795271,name:'Aire de pique-nique du quai Périvier',source:'https://www.cirkwi.com/fr/point-interet/5775404-aire-de-pique-nique-quai-du-1er-president-perivier-a-angles-sur-l-anglin',updated:'2026-09-25'}
]);
export function publicRestGraph(original,height,clear){
 const graph={nodes:original.nodes.map(n=>({...n,point:{...n.point},edges:[...n.edges]})),edges:[...original.edges]},audit=[];
 for(const site of PUBLIC_REST_SITES){const source={x:(site.lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(site.lat-46.6953)*111320};let admitted=null;
 for(const dx of [0,-.75,.75,-1.5,1.5]){for(const dz of [0,-.75,.75]){
  const p={x:source.x+dx,z:source.z+dz},h=height(p.x,p.z);if(!Number.isFinite(h))continue;let flat=true;
  for(const x of [-.6,0,.6])for(const z of [-.6,0,.6]){const y=height(p.x+x,p.z+z);if(!clear(p.x+x,p.z+z)||!Number.isFinite(y)||Math.abs(y-h)>.07)flat=false;}if(!flat)continue;
  const nearest=original.nodes.map((n,i)=>({i,p:n.point,d:Math.hypot(n.point.x-p.x,n.point.z-p.z)})).filter(n=>n.d<24&&n.d>1&&original.nodes[n.i].edges.some(i=>graph.edges[i].admitted&&['service','footway','path','track'].includes(graph.edges[i].tags?.highway))).sort((a,b)=>a.d-b.d)[0];if(!nearest)continue;
  let safe=true,last=height(nearest.p.x,nearest.p.z);const ux=(p.x-nearest.p.x)/nearest.d,uz=(p.z-nearest.p.z)/nearest.d;
  for(let s=0;s<=nearest.d+.25;s+=.25){const t=Math.min(s,nearest.d),x=nearest.p.x+ux*t,z=nearest.p.z+uz*t,y=height(x,z);if(!Number.isFinite(y)||Math.abs(y-last)>.10)safe=false;for(const side of [-.35,0,.35])if(!clear(x-uz*side,z+ux*side))safe=false;last=y;}if(!safe)continue;
  const to=graph.nodes.length,edge=graph.edges.length;graph.nodes.push({point:p,edges:[edge],restSite:site.id});graph.nodes[nearest.i].edges.push(edge);graph.edges.push({from:nearest.i,to,forward:true,backward:true,length:nearest.d,width:1.4,zone:'public-rest',surface:'',admitted:true,tags:{highway:'footway',source:site.source,inferred:'short interior approach to documented public rest POI; collision/support checked, not an OSM or surveyed path'}});admitted={...site,point:p,node:to,origin:nearest.i,length:nearest.d,offsetM:Math.hypot(dx,dz),seating:'ground only; exact furniture location unknown'};break;
 }if(admitted)break;}
 audit.push(admitted??{...site,refused:'No flat clear seat with a supported unobstructed approach in the loaded engine'});
 }
 return {graph,audit};
}
export function restActivity(group,context,height,clear){
 if(!group.restSite||group.mode!=='walk'||context.rain>.08||context.snow>.01||context.storm>.1||context.hour<10||context.hour>18||context.temperatureC<14)return null;
 for(const m of group.members){if(m.person.age==='baby')return null;const p=m.position,h=height(p.x,p.z);if(!Number.isFinite(h))return null;for(const x of [-.45,0,.45])for(const z of [-.45,0,.45]){const y=height(p.x+x,p.z+z);if(!clear(p.x+x,p.z+z)||!Number.isFinite(y)||Math.abs(y-h)>.09)return null;}}
 return group.members.length>1?'picnic':'sit';
}
