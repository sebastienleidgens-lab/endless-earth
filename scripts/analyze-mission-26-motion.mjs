import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import * as THREE from 'three';
const root=resolve(process.argv[2]??'.'),label=process.argv[3]??'after';
const {createWalker}=await import(pathToFileURL(resolve(root,'src/character/walker.mjs')));
const folder='docs/mission-26-evidence/quality-fixes';await mkdir(folder,{recursive:true});
const summary=[],traces=[];
for(const cadence of [30,60,120,'irregular'])for(const speed of [0,1.45,3.2])for(const terrain of ['flat','slope']){
 const w=createWalker(),height=(x,z)=>terrain==='flat'?0:z*.15,wanted=['hips','spine','chest','head','hand-1','hand1','foot-1','foot1','travel-pack'],joints=[];
 w.avatar.traverse(o=>{if(o.isBone)joints.push(o)});w.update(0,1/60,height);
 let t=0,index=0,previous=null;const rows=[],peaks=[],max={angularSpeed:0,pelvisSpeed:0,soleError:0,plantError:0,steadyAngularSpeed:0,steadyPelvisSpeed:0,steadyPeaks:0};
 while(t<12){const dt=cadence==='irregular'?[1/120,1/60,.035,1/30,.11,1/60][index%6]:1/cadence;
  w.avatar.position.z+=speed*dt;w.avatar.position.y=height(0,w.avatar.position.z);w.update(speed*dt,dt,height);t+=dt;
  const state=joints.map(b=>({name:b.name,local:b.position.toArray(),rotation:b.quaternion.toArray(),world:b.getWorldPosition(new THREE.Vector3()).toArray(),worldRotation:b.getWorldQuaternion(new THREE.Quaternion()).toArray()}));
  let angularSpeed=0;
  if(previous){for(let j=0;j<state.length;j++)if(wanted.includes(state[j].name)){
   const a=new THREE.Quaternion().fromArray(previous.joints[j].rotation),b=new THREE.Quaternion().fromArray(state[j].rotation),v=a.angleTo(b)/dt;
   angularSpeed=Math.max(v,angularSpeed);if(t>2){max.steadyAngularSpeed=Math.max(max.steadyAngularSpeed,v);if(v>12)max.steadyPeaks++;}if(v>12)peaks.push({t,joint:state[j].name,angularSpeed:v,phase:w.motion.phase,stance:w.feet.map(f=>f.stance)});
  }const pelvisSpeed=Math.abs(w.hips.position.y-previous.pelvis)/dt;max.pelvisSpeed=Math.max(max.pelvisSpeed,pelvisSpeed);if(t>2)max.steadyPelvisSpeed=Math.max(max.steadyPelvisSpeed,pelvisSpeed);}
  max.angularSpeed=Math.max(max.angularSpeed,angularSpeed);max.soleError=Math.max(max.soleError,w.metrics.soleError);max.plantError=Math.max(max.plantError,w.metrics.plantError);
  const row={t,dt,phase:w.motion.phase,speed:w.motion.speed,pelvis:w.hips.position.y,root:w.avatar.position.toArray(),joints:state,footStates:w.feet.map(f=>({side:f.side,stance:f.stance,anchor:f.anchor.toArray(),target:f.target.toArray(),cycle:f.cycle})),...w.metrics};
  if(cadence===60)rows.push(row);previous=row;index++;
 }
 summary.push({cadence,speed,terrain,...max,peakCount:peaks.length,peaks:peaks.slice(0,30)});if(rows.length)traces.push({cadence,speed,terrain,frames:rows});w.dispose();
}
await writeFile(`${folder}/${label}-motion-summary.json`,JSON.stringify({label,root,method:'Numeric rig diagnostic; synthetic flat and regular slope, not native films or surveyed ground.',cases:summary},null,2)+'\n');
await writeFile(`${folder}/${label}-joint-traces.json.gz`,gzipSync(JSON.stringify(traces),{mtime:0}));
console.log(JSON.stringify(summary.map(({peaks,...s})=>s),null,2));
