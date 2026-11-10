import {random} from './events.mjs';
// Generic silhouettes only: habitat affinities are an artistic interpretation.
export function flockAt(time,cell,conditions,seed=9){
 const epoch=Math.floor(time/180),r=random(cell*37+epoch*11+seed),start=epoch*180+12+r*120,age=time-start,duration=18+random(epoch+cell+seed)*22;
 const habitat=['wood','forest','riparian','grass','meadow','water'].includes(conditions.habitat);
 const active=habitat&&conditions.day>.2&&conditions.rain<.2&&conditions.wind<.85&&age>=0&&age<duration&&random(epoch*13+cell+seed)>.22;
 const count=r<.42?1:r<.7?2:3+Math.floor(r*4),angle=random(cell+epoch*7+seed)*Math.PI*2;
 return {id:`${cell}:${epoch}`,active,age,duration,count,angle,gliding:r>.6,fast:r<.23,progress:Math.max(0,Math.min(1,age/duration)),fade:active?Math.min(1,age/3,(duration-age)/4):0};
}
export function birdPosition(flock,index,anchor,ceiling,out={}){
 const t=flock.progress,speed=flock.fast?420:260,turn=Math.sin(t*Math.PI)*35;
 const along=(t-.5)*speed-index*3,across=turn+Math.sin(index*4)*4;
 out.x=anchor.x+Math.cos(flock.angle)*along-Math.sin(flock.angle)*across;
 out.z=anchor.z+Math.sin(flock.angle)*along+Math.cos(flock.angle)*across;
 out.y=ceiling+12+Math.sin(t*Math.PI)*8+index*.65;return out;
}
