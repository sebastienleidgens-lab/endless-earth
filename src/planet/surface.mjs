import {sampleFine} from './fine-grid.mjs';
import {admitFeature} from './network.mjs';
export function inside(point,ring){let result=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point.y)!==(b[1]>point.y)&&point.x<(b[0]-a[0])*(point.y-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
export function nearestOnLine(point,points){let best=null,d=Infinity;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.y-a[1])*dy)/(dx*dx+dy*dy||1))),x=a[0]+t*dx,y=a[1]+t*dy,n=Math.hypot(point.x-x,point.y-y);if(n<d){d=n;best={x,y,distance:n,index:i,t,heading:Math.atan2(dx,-dy)};}}return best;}
export function sampleTile(tile,p){const [x0,y0,x1,y1]=tile.bounds,n=tile.grid.size,step=(x1-x0)/(n-1);if(p.x<x0||p.x>x1||p.y<y0||p.y>y1)return null;const fx=Math.min(n-1-1e-10,(p.x-x0)/step),fy=Math.min(n-1-1e-10,(p.y-y0)/step),x=Math.floor(fx),y=Math.floor(fy),u=fx-x,v=fy-y,h=tile.grid.heights,a=h[y*n+x],b=h[y*n+x+1],c=h[(y+1)*n+x],d=h[(y+1)*n+x+1];let height,dx,dy;if(u+v<=1){dx=(b-a)/step;dy=(c-a)/step;height=a+u*(b-a)+v*(c-a);}else{dx=(d-c)/step;dy=(d-b)/step;height=d+(1-u)*(c-d)+(1-v)*(b-d);}const l=Math.hypot(dx,1,dy);return {height,normal:{x:-dx/l,y:1/l,z:dy/l},slope:Math.hypot(dx,dy),tile:tile.id,datum:tile.grid.datum};}
export function roadWidth(tags){const parsed=Number.parseFloat(tags.width);if(Number.isFinite(parsed)&&parsed>=.5&&parsed<=45)return parsed;return ['motorway','motorway_link'].includes(tags.highway)?18:['trunk','primary'].includes(tags.highway)?7:['secondary','tertiary'].includes(tags.highway)?5.5:['residential','unclassified','living_street','service'].includes(tags.highway)?4.8:1.8;}
/** A shared geographic provider for rendered terrain, collisions and map. */
export class PlanetSurface {
 constructor(manifest){this.manifest=manifest;this.tiles=new Map();this.features=new Map();this.cells=new Map();this.cellSize=128;}
 cell(x,y){return Math.floor(x/this.cellSize)+','+Math.floor(y/this.cellSize);}
 add(tile){for(const _ of this.addSteps(tile)){} }
 *addSteps(tile){for(const f of tile.features){yield;const old=this.features.get(f.id);if(old){old.owners.add(tile.id);continue;}const record={feature:f,owners:new Set([tile.id]),keys:[]};this.features.set(f.id,record);const xs=f.points.map(p=>p[0]),ys=f.points.map(p=>p[1]),minx=Math.floor(Math.min(...xs)/this.cellSize),maxx=Math.floor(Math.max(...xs)/this.cellSize),miny=Math.floor(Math.min(...ys)/this.cellSize),maxy=Math.floor(Math.max(...ys)/this.cellSize);
   if((maxx-minx+1)*(maxy-miny+1)>20000)continue;
   for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++){const key=x+','+y;if(!this.cells.has(key))this.cells.set(key,new Set());this.cells.get(key).add(f.id);record.keys.push(key);if(record.keys.length%128===0)yield;}
  }this.tiles.set(tile.id,tile);}
 remove(tile){for(const _ of this.removeSteps(tile)){} }
 *removeSteps(tile){this.tiles.delete(tile.id);for(const f of tile.features){yield;const record=this.features.get(f.id);if(!record)continue;record.owners.delete(tile.id);if(record.owners.size)continue;for(const k of record.keys){yield;const cell=this.cells.get(k);cell?.delete(f.id);if(!cell?.size)this.cells.delete(k);}this.features.delete(f.id);}}
 query(p,radius=0){const ids=new Set();for(let y=Math.floor((p.y-radius)/128);y<=Math.floor((p.y+radius)/128);y++)for(let x=Math.floor((p.x-radius)/128);x<=Math.floor((p.x+radius)/128);x++)for(const id of this.cells.get(x+','+y)??[])ids.add(id);return [...ids].map(id=>this.features.get(id).feature);}
 sample(p){const s=this.manifest.tileSize,id=Math.floor(p.x/s)+':'+Math.floor(p.y/s),tile=this.tiles.get(id);if(tile){const fine=tile.contact?sampleFine(tile.contact,p):null;return fine?{...fine,tile:tile.id}:sampleTile(tile,p);}for(const tile of this.tiles.values()){const result=tile.contact?sampleFine(tile.contact,p):null;if(result)return {...result,tile:tile.id};const coarse=sampleTile(tile,p);if(coarse)return {...coarse,resolutionM:128};}return null;}
 habitat(p){for(const f of this.query(p))if(f.polygon&&inside(p,f.points)&&!(f.holes??[]).some(r=>inside(p,r))){const t=f.tags;if(f.kind==='hydro')return 'water';if(t.landuse==='forest'||t.natural==='wood')return 'wood';if(t.landuse==='farmland')return 'agriculture';if(['meadow','grass','orchard','residential'].includes(t.landuse))return t.landuse;}return 'unknown';}
 nearestRoad(p,mode='foot',max=30){let best=null;for(const f of this.query(p,max)){if(f.kind!=='road'||!admitFeature(f.tags,mode,this.manifest.accessDefaults).ok)continue;const q=nearestOnLine(p,f.points);if(q&&q.distance<=max&&(!best||q.distance<best.distance))best={...q,feature:f,width:roadWidth(f.tags)};}return best;}
 admission(p,mode='foot'){
  const support=this.sample(p);if(!support)return {ok:false,reason:'tile-loading'};
  for(const f of this.query(p,2)){
   const within=f.polygon&&inside(p,f.points)&&!(f.holes??[]).some(r=>inside(p,r));
   if(within&&(f.kind==='building'||f.kind==='hydro'||['private','no'].includes(f.tags.access)))return {ok:false,reason:f.kind==='hydro'?'unverified-water':'mapped-obstacle',...support};
   if(f.kind==='barrier'&&nearestOnLine(p,f.points)?.distance<.6)return {ok:false,reason:'mapped-barrier',...support};
  }
  const road=this.nearestRoad(p,mode,25),radius=mode==='car'?.05:.3;
  if(!road||road.distance>road.width/2-radius)return {ok:false,reason:'unknown-land-access',...support};
  if(support.slope>(mode==='car'?.45:.7))return {ok:false,reason:'steep-support',...support};
  const speed=Number.parseFloat(road.feature.tags.maxspeed),speedLimit=Number.isFinite(speed)?speed/3.6:['motorway','trunk'].includes(road.feature.tags.highway)?30.5:['primary','secondary','tertiary','unclassified'].includes(road.feature.tags.highway)?22.2:13.9;
  return {...support,ok:true,drivable:mode==='car',road:road.feature.id,width:road.width,speedLimit,provenance:'OSM road corridor + declared regional access policy; inferred width when absent'};
 }
 clear(){this.tiles.clear();this.features.clear();this.cells.clear();}
}
