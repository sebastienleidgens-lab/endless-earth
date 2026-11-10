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
 const along=(t-.5)*speed-index*3,across=turn+Math.sin(index*4)*4;
 out.x=anchor.x+(flock.cosAngle??Math.cos(flock.angle))*along-(flock.sinAngle??Math.sin(flock.angle))*across;
 out.z=anchor.z+(flock.sinAngle??Math.sin(flock.angle))*along+(flock.cosAngle??Math.cos(flock.angle))*across;
 out.y=ceiling+12+(flock.lift??Math.sin(t*Math.PI))*8+index*.65;return out;
}
