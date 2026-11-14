// Geographic navigation independent of rendering and village. Local metres;
// optional point.y is a VERIFIED deck elevation in the terrain's relative datum.
import {circleHitsPolygon} from '../controls/walking.mjs';
import {roadWidth} from './road-style.mjs';
export function lineWidth(tags) {
  return roadWidth(tags).metres;
}
export function pedestrianAccess(tags) {
  const access=String(tags.foot??tags.access??'yes');
  return !['no','private','use_sidepath'].includes(access)&&!tags['access:conditional']&&!tags['foot:conditional'];
}
function nearest(x,z,points,closed=false){
  let best={distance:Infinity,y:null,outside:false};
  for(let i=1;i<points.length+(closed?1:0);i++){
    const a=points[i-1],b=points[i%points.length],dx=b.x-a.x,dz=b.z-a.z;
    const raw=((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),t=Math.max(0,Math.min(1,raw));
    const distance=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
    if(distance<best.distance)best={distance,y:Number.isFinite(a.y)&&Number.isFinite(b.y)?a.y+(b.y-a.y)*t:null,outside:!closed&&((i===1&&raw<0)||(i===points.length-1&&raw>1))};
  }
  return best;
}
export function createNavigation(features) {
  const cells=new Map();
  for(const feature of features){
    const {tags,points}=feature;
    if(points.length<2)continue;
    const historicWall=['citywalls','castle','ruins'].includes(tags.historic)||tags.barrier==='city_wall';
    if(!tags.highway&&!tags.waterway&&tags.natural!=='water'&&!tags.barrier&&!historicWall)continue;
    const width=historicWall?1.25:tags.highway?lineWidth(tags):tags.waterway?Number(tags.width)||6:Number(tags.width)||.3;
    const item={...feature,width,historicWall};
    // A shared provider also sees unknown bridges. Only a deck verified at its
    // mapped start may discard the old endpoint exclusion capsule.
    if(item.support&&tags.bridge&&tags.bridge!=='no'&&item.support(points[0].x,points[0].z)===null)item.support=undefined;
    const xs=points.map(p=>p.x),zs=points.map(p=>p.z),margin=width/2+.3;
    for(let x=Math.floor((Math.min(...xs)-margin)/20);x<=Math.floor((Math.max(...xs)+margin)/20);x++)
      for(let z=Math.floor((Math.min(...zs)-margin)/20);z<=Math.floor((Math.max(...zs)+margin)/20);z++){
        const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(item);
      }
  }
  return (x,z,explain=false)=>{
    let water=false,blocked=false,cameraBlocked=false,support=null,steps=false;const reasons=explain?[]:null;
    for(const item of cells.get(`${Math.floor(x/20)},${Math.floor(z/20)}`)??[]){
      const {tags,points,polygon,width,historicWall}=item,n=nearest(x,z,points,polygon);
      const hits=historicWall?n.distance<width/2+.3:polygon?circleHitsPolygon(x,z,points,.3):n.distance<width/2+.3;
      if(!hits)continue;
      const block=(rule,camera=false)=>{blocked=true;if(camera)cameraBlocked=true;reasons?.push({rule,id:tags.osm_id??null,name:tags.name??null,barrier:tags.barrier??null,highway:tags.highway??null,shape:polygon?'polygon':'polyline',points,width,provenance:'OSM/local documented collision; metric source transform shared with renderer'})};
      // Same 1.25 m footprint as the rendered ruin walls; keep courtyards free.
      if(historicWall&&n.distance<width/2+.3)block('historic-masonry',true);
      if(tags.natural==='water'||tags.waterway){water=true;reasons?.push({rule:'mapped-water',id:tags.osm_id??null,name:tags.name??null,shape:polygon?'polygon':'polyline',points,width,provenance:'OSM water outline; walking forbidden without verified deck'})}
      if(tags.barrier&&!['entrance','gate','lift_gate','bollard'].includes(tags.barrier))block('barrier',true);
      if(tags.barrier&&!pedestrianAccess(tags))block('barrier-access');
      if(tags.highway){
        if(!pedestrianAccess(tags)||['motorway','motorway_link','construction','proposed'].includes(tags.highway)||tags.tunnel&&tags.tunnel!=='no')block('pedestrian-access');
        if(tags.bridge&&tags.bridge!=='no'){
          if(item.support&&n.outside)continue;
          // layer/clearance are NOT deck elevations. Unknown bridge blocks even on dry DEM.
          const height=item.support?item.support(x,z):n.y;
          if(height===null)block('unverified-bridge-support');
          else if(n.distance<=Math.max(0,width/2-.3))support=height;
        }
        if(tags.highway==='steps'&&n.distance<=Math.max(0,width/2-.3))steps=true;
      }
    }
    return {cameraClear:!cameraBlocked,clear:!blocked&&(!water||support!==null),support, slope:steps?1.2:.7,...(reasons?{reasons}: {})};
  };
}
