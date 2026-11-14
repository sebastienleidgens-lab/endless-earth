import {roadWidth} from '../world/road-style.mjs';
import {noise} from '../earthlife/sensitive-model.mjs';
/** Conservative subset of public OSM ways. A walking graph is never a motor graph. */
export function motorAdmissible(t={}){
 const denied=new Set(['no','private','destination','customers','delivery','agricultural','forestry','permit']);
 return ['secondary','tertiary','residential','unclassified','living_street'].includes(t.highway)
 && ![t.access,t.vehicle,t.motor_vehicle,t.motorcar].some(v=>denied.has(v))
 && !Object.keys(t).some(k=>/^(access|vehicle|motor_vehicle|motorcar):/.test(k))
 && (!t.oneway||['yes','no','1','0','true','false','-1'].includes(t.oneway))&&!t['oneway:conditional']
 && !t.bridge&&!t.tunnel&&!t.ford&&!t.construction&&!t.barrier
 && (!t.junction||t.junction!=='roundabout')&&roadWidth(t).metres>=4.8
 && (!t.maxwidth||Number.parseFloat(t.maxwidth)>=2.2)&&(!t.maxheight||Number.parseFloat(t.maxheight)>=1.8)&&(!t.maxweight||Number.parseFloat(t.maxweight)>=1.3);
}
function resample(points,step=1){
 const out=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],d=Math.hypot(b.x-a.x,b.z-a.z);for(let j=0;j<Math.ceil(d/step);j++){const t=j/Math.ceil(d/step);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t})}}out.push({...points.at(-1)});return out;
}
/** Incremental audit of the whole vehicle envelope, at <=1 m intervals.
 * No changes to roads, DEM, water, collision or access tags. */
export function* auditMotorRoutes(roads,support,clear){
 const report=[],routes=[];
 for(const road of roads){const tags=road.tags??{},row={id:tags.osm_id,name:tags.name??null,accepted:false,reason:'access/class/width/bridge',width:roadWidth(tags)};report.push(row);
  if(!motorAdmissible(tags))continue;
  const raw=road.points.filter((p,i,a)=>!i||Math.hypot(p.x-a[i-1].x,p.z-a[i-1].z)>.05);if(raw.length<2){row.reason='geometry';continue}
  const directions=tags.oneway==='-1'?[-1]:['yes','1','true'].includes(tags.oneway)?[1]:[1,-1];
  for(const sign of directions){const centre=resample(sign===1?raw:[...raw].reverse()),lane=[];let reason='',length=0;
   if(centre.length<280||centre.length>2200){reason='continuous way shorter than 280 m or outside bounded pilot';row.reason=reason;continue}
   for(let i=3;i<centre.length-3;i++){
    if(i%4===0)yield {routes,report};
    const a=centre[Math.max(0,i-3)],b=centre[Math.min(centre.length-1,i+3)],d=Math.hypot(b.x-a.x,b.z-a.z);if(d<.01){reason='degenerate turn';break}
    const dx=(b.x-a.x)/d,dz=(b.z-a.z)/d,offset=Math.min(1.35,row.width.metres/4),p={x:centre[i].x-dz*offset,z:centre[i].z+dx*offset,y:0,s:0,dx,dz};
    const heights=[];
    const onRoad=(x,z)=>raw.slice(1).some((b,j)=>{const a=raw[j],vx=b.x-a.x,vz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*vx+(z-a.z)*vz)/(vx*vx+vz*vz||1)));return Math.hypot(x-a.x-t*vx,z-a.z-t*vz)<=row.width.metres/2-.05});
    for(const along of [-1.95,0,1.95])for(const side of [-.9,0,.9]){const x=p.x+dx*along-dz*side,z=p.z+dz*along+dx*side,h=support(x,z);if(h===null||!Number.isFinite(h)||!clear(x,z)||!onRoad(x,z)){reason='blocked/unknown vehicle envelope';break}heights.push(h)}
    if(reason)break;
    p.y=support(p.x,p.z);if(p.y===null||Math.max(...heights)-Math.min(...heights)>.65){reason='crossfall or discontinuity';break}
    if(lane.length){const prev=lane.at(-1),step=Math.hypot(p.x-prev.x,p.z-prev.z),turn=Math.acos(Math.max(-1,Math.min(1,p.dx*prev.dx+p.dz*prev.dz)));
     if(step<.01||Math.abs(p.y-prev.y)/step>.14||turn/step>.11){reason='grade or turn radius';break}length+=step;
    }
    p.s=length;lane.push(p);
   }
   if(!reason&&length>=270){routes.push({id:String(row.id)+':'+sign,tags,width:row.width,points:lane,length,speed:tags.highway==='living_street'?3.3:Math.min(7,(Number.parseFloat(tags.maxspeed)||25)/3.6),rightHand:true});row.accepted=true;row.reason='entire envelope sampled, continuous support, right lane, grade <=14%, radius >=9 m';}
   else if(!row.accepted)row.reason=reason||'short lane';
  }
 }
 return {routes,report};
}
export function routePose(route,s,out={}){
 const p=route.points;let lo=0,hi=p.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(p[m].s<s)lo=m;else hi=m}const a=p[lo],b=p[hi],t=Math.max(0,Math.min(1,(s-a.s)/(b.s-a.s||1)));
 for(const k of ['x','y','z','dx','dz'])out[k]=a[k]+(b[k]-a[k])*t;out.s=s;return out;
}
export function trafficDelay(seed,sequence,hour,snow=0){
 const activity=hour>=7&&hour<18?1:hour>=5&&hour<22?.45:.07;
 return 120-Math.log(Math.max(.0001,1-noise(seed+sequence*71)))*1500/(activity*(1-Math.min(.8,snow)));
}
export function advanceVehicle(v,dt,player,weather={},out={}){
 const current=routePose(v.route,v.s),ahead=routePose(v.route,Math.min(v.route.length,v.s+5)),dx=player.x-current.x,dz=player.z-current.z,along=dx*current.dx+dz*current.dz,across=Math.abs(dx*current.dz-dz*current.dx),nearHeight=Math.abs(player.y-current.y)<2.8;
 let clearance=nearHeight&&across<2.4&&along>-3?Math.max(0,along-5):Infinity;
 for(const p of weather.pedestrians??[]){const x=p.x-current.x,z=p.z-current.z,a=x*current.dx+z*current.dz,b=Math.abs(x*current.dz-z*current.dx);if(Math.abs(p.y-current.y)<2.8&&b<2.4&&a>-3)clearance=Math.min(clearance,Math.max(0,a-5));}
 const curve=Math.acos(Math.max(-1,Math.min(1,current.dx*ahead.dx+current.dz*ahead.dz))),snow=weather.snowCover??0;
 const target=snow>.5?0:Math.min(v.route.speed*(1-(weather.rain??0)*.28),Math.sqrt(1.1*5/Math.max(.03,curve)),Math.sqrt(2*1.8*clearance));
 v.speed=Math.max(0,v.speed+Math.max(-2.4*dt,Math.min(.8*dt,target-v.speed)));
 // A person entering the near envelope between frames is never pushed or passed through.
 const step=Math.min(v.speed*dt,clearance);v.s=Math.min(v.route.length,v.s+step);if(step<.001&&target===0)v.speed=0;
 routePose(v.route,v.s,out);return out;
}
