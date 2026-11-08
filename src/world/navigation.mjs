// Geographic navigation independent of rendering and village. Local metres;
// optional point.y is a VERIFIED deck elevation in the terrain's relative datum.
import {circleHitsPolygon} from '../controls/walking.mjs';
export function lineWidth(tags) {
  const width=Number(tags.width);
  return Number.isFinite(width)&&width>0?Math.min(width,30):['path','footway','steps','cycleway'].includes(tags.highway)?2.5:5.5;
}
export function pedestrianAccess(tags) {
  const access=String(tags.foot??tags.access??'yes');
  return !['no','private','use_sidepath'].includes(access)&&!tags['access:conditional']&&!tags['foot:conditional'];
}
function nearest(x,z,points){
  let best={distance:Infinity,y:null};
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
    const distance=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
    if(distance<best.distance)best={distance,y:Number.isFinite(a.y)&&Number.isFinite(b.y)?a.y+(b.y-a.y)*t:null};
  }
  return best;
}
export function createNavigation(features) {
  const cells=new Map();
  for(const feature of features){
    const {tags,points}=feature;
    if(points.length<2)continue;
    if(!tags.highway&&!tags.waterway&&tags.natural!=='water'&&!tags.barrier)continue;
    const width=tags.highway?lineWidth(tags):tags.waterway?Number(tags.width)||6:.3;
    const item={...feature,width};
    const xs=points.map(p=>p.x),zs=points.map(p=>p.z),margin=width/2+.3;
    for(let x=Math.floor((Math.min(...xs)-margin)/20);x<=Math.floor((Math.max(...xs)+margin)/20);x++)
      for(let z=Math.floor((Math.min(...zs)-margin)/20);z<=Math.floor((Math.max(...zs)+margin)/20);z++){
        const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(item);
      }
  }
  return (x,z)=>{
    let water=false,blocked=false,support=null,steps=false;
    for(const item of cells.get(`${Math.floor(x/20)},${Math.floor(z/20)}`)??[]){
      const {tags,points,polygon,width}=item,n=nearest(x,z,points);
      const hits=polygon?circleHitsPolygon(x,z,points,.3):n.distance<width/2+.3;
      if(!hits)continue;
      if(tags.natural==='water'||tags.waterway)water=true;
      if(tags.barrier&&!['entrance','gate','lift_gate','bollard'].includes(tags.barrier))blocked=true;
      if(tags.barrier&&!pedestrianAccess(tags))blocked=true;
      if(tags.highway){
        if(!pedestrianAccess(tags)||['motorway','motorway_link','construction','proposed'].includes(tags.highway)||tags.tunnel&&tags.tunnel!=='no')blocked=true;
        if(tags.bridge&&tags.bridge!=='no'){
          // layer/clearance are NOT deck elevations. Unknown bridge blocks even on dry DEM.
          if(n.y===null)blocked=true;
          else if(n.distance<=Math.max(0,width/2-.3))support=n.y;
        }
        if(tags.highway==='steps'&&n.distance<=Math.max(0,width/2-.3))steps=true;
      }
    }
    return {clear:!blocked&&(!water||support!==null),support, slope:steps?1.2:.7};
  };
}
