import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const sourceRoot=resolve(process.argv[3]??'.'),{createWalker}=await import(pathToFileURL(sourceRoot+'/src/character/walker.mjs'));
const codeSHA=process.argv[4]??null;
import {writeFile,mkdir} from 'node:fs/promises';import {gzipSync} from 'node:zlib';import {execFileSync} from 'node:child_process';
const label=process.argv[2]??'reference',out='docs/mission-26-4-evidence';await mkdir(out,{recursive:true});const cases=[];
for(const speed of [1.45,3.2])for(const hz of [4,8,30,60,120,'irregular']){
 const w=createWalker();w.update(0,1/60,()=>0);let t=0,i=0,last=null,maxSlide=0,maxSole=0;const frames=[],vel={},acc={},dtAt=i=>hz==='irregular'?[1/60,1/120,.25,1/30,1/8][i%5]:1/hz;
 for(;t<24-1e-9;){const dt=Math.min(dtAt(i++),24-t);t+=dt;w.avatar.position.z+=speed*dt;w.update(speed*dt,dt,()=>0);const joints=w.avatar.getObjectByName('promeneur-articule').skeleton.bones.map(b=>({name:b.name,p:b.position.toArray(),q:b.quaternion.toArray()}));const frame={t,dt,position:w.avatar.position.toArray(),metrics:{...w.metrics},joints,feet:w.feet.map(f=>({side:f.side,stance:f.stance,cycle:f.cycle,anchor:f.anchor.toArray(),contact:f.contact.toArray()}))};
 maxSlide=Math.max(maxSlide,w.metrics.plantSlideM??0);maxSole=Math.max(maxSole,w.metrics.soleError);
 if(last)for(let k=0;k<joints.length;k++){const a=last.joints[k],b=joints[k],dot=Math.min(1,Math.abs(a.q.reduce((s,x,j)=>s+x*b.q[j],0))),v=2*Math.acos(dot)/dt;vel[b.name]=Math.max(vel[b.name]??0,v);if(last.vel?.[b.name]!==undefined)acc[b.name]=Math.max(acc[b.name]??0,Math.abs(v-last.vel[b.name])/dt);(frame.vel??={})[b.name]=v;}
 frames.push(frame);last=frame;
 }
 const path=`${label}-rig-${speed}-${hz}.json.gz`;await writeFile(out+'/'+path,gzipSync(JSON.stringify({method:'Isolated authored rig on synthetic flat plane, imposed root velocity for animation diagnostics ONLY. Not a physical journey or rendered cadence.',speed,hz,frames})));cases.push({speed,hz,frames:frames.length,maxSlideM:maxSlide,maxSoleErrorM:maxSole,maxAngularSpeed:vel,maxAngularAcceleration:acc,trace:path});w.dispose();
}
const report={method:'Synthetic rig input robustness, not perceived naturalness or physical controller travel.',sourceSHA:codeSHA??execFileSync('git',['rev-parse','HEAD']).toString().trim(),sourceRoot,sourceLimit:'Explicit source root imported before sampling. Early diagnostic prototypes have only an end-of-run HEAD and are not exact source reproductions; use final paired runs.',cases};await writeFile(out+'/'+label+'-rig.json',JSON.stringify(report,null,2));console.log(cases.map(c=>({speed:c.speed,hz:c.hz,slide:c.maxSlideM,sole:c.maxSoleErrorM,hipsAccel:c.maxAngularAcceleration.hips,kneeAccel:c.maxAngularAcceleration['shin-1']})));
