import {random} from './events.mjs';
// Generic silhouettes only: habitat affinities are an artistic interpretation.
const BIRD_HABITATS=new Set(['wood','forest','riparian','grass','meadow','water']);
export function flockAt(time,cell,conditions,seed=9,out={}){
 const epoch=Math.floor(time/180);
 if(out.epoch!==epoch||out.cell!==cell||out.seed!==seed){const r=random(cell*37+epoch*11+seed);out.epoch=epoch;out.cell=cell;out.seed=seed;out.id=`${cell}:${epoch}`;out.start=epoch*180+12+r*120;out.duration=18+random(epoch+cell+seed)*22;out.count=r<.42?1:r<.7?2:3+Math.floor(r*4);out.angle=random(cell+epoch*7+seed)*Math.PI*2;out.cosAngle=Math.cos(out.angle);out.sinAngle=Math.sin(out.angle);out.gliding=r>.6;out.fast=r<.23;out.allowed=random(epoch*13+cell+seed)>.22;}
 out.age=time-out.start;out.active=BIRD_HABITATS.has(conditions.habitat)&&conditions.day>.2&&conditions.rain<.2&&conditions.wind<.85&&out.age>=0&&out.age<out.duration&&out.allowed;out.progress=Math.max(0,Math.min(1,out.age/out.duration));out.fade=out.active?Math.min(1,out.age/3,(out.duration-out.age)/4):0;out.lift=Math.sin(out.progress*Math.PI);return out;
}
export function birdPosition(flock,index,anchor,ceiling,out={}){
 const t=flock.progress,speed=flock.fast?420:260,turn=(flock.lift??Math.sin(t*Math.PI))*35;
 // Analytic sampling at render time: no tick/extrapolation seam. Individuals
 // retain their phase and steer around the same broad curve independently.
 const age=flock.age??t*flock.duration,phase=index*2.399963;
 const along=(t-.5)*speed-index*3+Math.sin(age*.37+phase)*.65;
 const across=turn+Math.sin(index*4)*4+Math.sin(age*.29+phase)*1.05;
 out.x=anchor.x+(flock.cosAngle??Math.cos(flock.angle))*along-(flock.sinAngle??Math.sin(flock.angle))*across;
 out.z=anchor.z+(flock.sinAngle??Math.sin(flock.angle))*along+(flock.cosAngle??Math.cos(flock.angle))*across;
 out.y=ceiling+12+(flock.lift??Math.sin(t*Math.PI))*8+index*.65+.08*(1+Math.sin(age*.43+phase));
 const alongV=speed/flock.duration+Math.cos(age*.37+phase)*.65*.37,acrossV=Math.cos(t*Math.PI)*35*Math.PI/flock.duration+Math.cos(age*.29+phase)*1.05*.29;
 out.vx=(flock.cosAngle??Math.cos(flock.angle))*alongV-(flock.sinAngle??Math.sin(flock.angle))*acrossV;
 out.vz=(flock.sinAngle??Math.sin(flock.angle))*alongV+(flock.cosAngle??Math.cos(flock.angle))*acrossV;
 out.heading=Math.atan2(out.vx,out.vz);return out;
}
export function birdPhase(id){let h=2166136261;for(const c of String(id)){h=Math.imul(h^c.charCodeAt(0),16777619)}return (h>>>0)/4294967296*Math.PI*2;}
export function perchedBirdAt(time,id,conditions,playerDistance,out={}){
 const clock=time+random(id*17.13)*140,epoch=Math.floor(clock/180),age=clock-epoch*180,start=10+random(id*71+epoch*13)*90;
 out.age=age-start;out.visible=conditions.day>.2&&conditions.rain<.2&&conditions.wind<.85&&out.age>=0&&out.age<48;
 out.flying=out.age>30||playerDistance<7;out.progress=Math.max(0,Math.min(1,(out.age-30)/18));out.fade=out.visible?Math.max(0,Math.min(1,out.age/3,(48-out.age)/4)):0;return out;
}
