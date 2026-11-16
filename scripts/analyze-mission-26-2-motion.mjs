import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
const root=resolve(process.argv[2]??'.'),label=process.argv[3]??'candidate',duration=Number(process.argv[4]??180);
const {createWalker}=await import(pathToFileURL(root+'/src/character/walker.mjs'));
const stats=a=>{a.sort((x,y)=>x-y);const q=p=>a[Math.min(a.length-1,Math.floor((a.length-1)*p))]??0;return {samples:a.length,p50:q(.5),p95:q(.95),p99:q(.99),max:q(1)};};
const cases=[];
for(const cadence of [4,8,30,60,120,'irregular'])for(const speed of [1.45,3.2])for(const terrain of ['flat','slope']){
 const w=createWalker(),height=(x,z)=>terrain==='flat'?0:z*.15;
 const joints=[];w.avatar.traverse(o=>{if(o.isBone)joints.push(o);});
 w.avatar.position.y=height(0,0);for(let i=0;i<60;i++)w.update(0,1/60,height);
 let time=0,n=0,previous=null,sole=0,slide=0,plant=0,consecutive=0,longest=0;
 const channels=joints.map(b=>({name:b.name,velocity:[],acceleration:[],jerk:[],peaks:[]}));
 while(time<duration-1e-8){
  const dt=Math.min(duration-time,cadence==='irregular'?[1/120,1/60,.035,1/30,.11,1/60][n%6]:1/cadence);
  w.avatar.position.z+=speed*dt;w.avatar.position.y=height(0,w.avatar.position.z);w.update(speed*dt,dt,height);time+=dt;
  const rotations=joints.map(b=>b.quaternion.clone()),vel=[],acc=[];
  if(w.metrics.mode==='run'){consecutive+=dt;longest=Math.max(longest,consecutive);}else consecutive=0;
  for(let j=0;j<joints.length;j++){
   const v=previous?rotations[j].angleTo(previous.rotations[j])/dt:0;
   const a=previous?(v-(previous.vel[j]??v))/dt:0,jerk=previous?(a-(previous.acc[j]??a))/dt:0;vel.push(v);acc.push(a);
   if(time>2){const c=channels[j];c.velocity.push(v);c.acceleration.push(Math.abs(a));c.jerk.push(Math.abs(jerk));if(v>20&&c.peaks.length<4)c.peaks.push({time,v,phase:w.motion.phase,stance:w.feet.map(f=>f.stance)});}
  }
  sole=Math.max(sole,w.metrics.soleError);slide=Math.max(slide,w.metrics.plantSlideM);plant=Math.max(plant,w.metrics.plantError);
  previous={rotations,vel,acc};n++;
 }
 const result={cadence,speed,terrain,simulatedSeconds:time,distanceM:speed*time,longestClassifiedRunSeconds:longest,frames:n,maxSoleErrorM:sole,maxPlantErrorM:plant,maxPlantSlideM:slide,joints:channels.map(c=>({name:c.name,angularVelocity:stats(c.velocity),angularAcceleration:stats(c.acceleration),angularJerk:stats(c.jerk),peaks:c.peaks}))};
 cases.push(result);w.dispose();console.log(label,cadence,speed,terrain,result.joints.toSorted((a,b)=>b.angularVelocity.max-a.angularVelocity.max).slice(0,3).map(j=>[j.name,j.angularVelocity.max]));
}
await writeFile('docs/mission-26-2-evidence/'+label+'-motion.json',JSON.stringify({sourceSHA:process.argv[5]??execFileSync('git',['rev-parse','HEAD']).toString().trim(),root,label,method:'Numeric rig-only test with imposed constant root velocity on synthetic flat and 15% slope, not a controller journey or native film. Finite differences of angular SPEED, not signed axis acceleration. All bones reported; first 2 s excluded only from steady distributions, foot-error maxima include startup.',cases},null,2));
