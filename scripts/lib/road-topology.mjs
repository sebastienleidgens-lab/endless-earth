// Offline only: polygon-clipping is not imported by the browser renderer.
import pc from 'polygon-clipping';
import {ROAD_STYLES,roadStyle,roadWidth} from '../../src/world/road-style.mjs';
export const signedArea=r=>r.reduce((a,p,i)=>{const q=r[(i+1)%r.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2;
export const area=multi=>multi.reduce((a,poly)=>a+Math.abs(signedArea(poly[0]))-poly.slice(1).reduce((v,r)=>v+Math.abs(signedArea(r)),0),0);
export function capsule(a,b,width,rounded=true){
 const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.01)return null;
 const angle=Math.atan2(dz,dx),radius=width/2,ring=[];
 if(rounded){
  for(let i=0;i<=8;i++){const t=angle-Math.PI/2+i*Math.PI/8;ring.push([b[0]+Math.cos(t)*radius,b[1]+Math.sin(t)*radius])}
  for(let i=0;i<=8;i++){const t=angle+Math.PI/2+i*Math.PI/8;ring.push([a[0]+Math.cos(t)*radius,a[1]+Math.sin(t)*radius])}
 }else{const nx=-dz/length*radius,nz=dx/length*radius;ring.push([a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz])}
 ring.push([...ring[0]]);return [ring];
}
export function roadSegments(features,local=p=>p){
 const segments=[];
 for(const f of features){if(f.geometry?.type!=='LineString'||!f.properties?.highway)continue;
  const tags=f.properties,width=roadWidth(tags),style=roadStyle(tags),points=f.geometry.coordinates.map(local);
  for(let i=1;i<points.length;i++){
   const polygon=capsule(points[i-1],points[i],width.metres);if(!polygon)continue;
   const ring=polygon[0];segments.push({a:points[i-1],b:points[i],polygon,style,width:width.metres,estimated:width.estimated,id:tags.osm_id,
    box:[Math.min(...ring.map(p=>p[0])),Math.min(...ring.map(p=>p[1])),Math.max(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[1]))]});
  }
 }return segments;
}
export function segmentCells(segments,g){
 const cells=new Map();
 for(const s of segments){
  const x0=Math.max(0,Math.floor((s.box[0]-g.origin_x_m)/g.step_m)),x1=Math.min(g.width-2,Math.floor((s.box[2]-g.origin_x_m)/g.step_m));
  const z0=Math.max(0,Math.floor((s.box[1]-g.origin_z_m)/g.step_m)),z1=Math.min(g.height-2,Math.floor((s.box[3]-g.origin_z_m)/g.step_m));
  for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const key=z*g.width+x;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(s)}
 }return cells;
}
export function partitionRoads(segments,domain){
 let remaining=[domain];const parts=[];
 const styles=[...new Set(segments.map(s=>s.style))].sort((a,b)=>ROAD_STYLES[b].priority-ROAD_STYLES[a].priority);
 for(const style of styles){
  const shapes=segments.filter(s=>s.style===style).map(s=>s.polygon);
  const merged=pc.union(...shapes),clipped=pc.intersection(merged,remaining);
  if(clipped.length){parts.push({style,polygons:clipped});remaining=pc.difference(remaining,clipped)}
 }
 if(remaining.length)parts.push({style:0,polygons:remaining});
 return parts;
}
export function rectangle(x,z,size){return [[[x,z],[x+size,z],[x+size,z+size],[x,z+size],[x,z]]]}
export {pc};
