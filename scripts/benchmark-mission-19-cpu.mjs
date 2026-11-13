// CPU-only owner microbenchmarks; no browser/GPU claim and no displacement replay.
import {performance} from 'node:perf_hooks';
import {writeFile} from 'node:fs/promises';
import {createWalker as create19} from '../src/character/walker.mjs';
import {createWalker as create18} from '../work/mission-19/baseline/src/character/walker.mjs';
import {lunar} from '../src/nature/moon.mjs';
const rounds=[],N=1200,rigs=[create18(),create19()];
function sample(rig,speed){const dt=1/60,d=speed*dt,start=performance.now();for(let i=0;i<N;i++){rig.avatar.position.z+=d;rig.avatar.rotation.y=Math.sin(i/200)*.15;rig.update(d,dt,()=>0)}return (performance.now()-start)/N}
try{for(const speed of [0,1.35,3.2]){for(let i=0;i<2;i++)for(const rig of rigs)sample(rig,speed);const rows=[[],[]];for(let round=0;round<10;round++)for(const idx of round%2?[1,0]:[0,1])rows[idx].push(sample(rigs[idx],speed));const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];rounds.push({speedMps:speed,updatesPerSample:N,baselineMedianMs:median(rows[0]),mission19MedianMs:median(rows[1]),samples:rows})}
 const dates=Array.from({length:8},(_,i)=>new Date(Date.UTC(2026,i,15,20))),moon=[];for(let r=0;r<8;r++){const t=performance.now();for(let i=0;i<10000;i++)lunar(dates[i%8],46.6953,.8844);moon.push((performance.now()-t)/10000)}
 await writeFile('docs/mission-19-evidence/cpu.json',JSON.stringify({protocol:'CPU-only Node/V8 microbenchmarks on real original/final rig owners; ten alternating samples after warm-up per speed, 1200 updates/sample at nominal 60Hz, flat support and restrained changing root orientation. No rendering, not GPU, Android or native footage. Lunar computation owner runs once per calendar second in production. Concurrent continuous browser session; timing is indicative and all raw samples are retained.',node:process.version,rig:rounds,moon:{callsPerSample:10000,samplesMsPerCalculation:moon,medianMsPerCalculation:[...moon].sort((a,b)=>a-b)[4],productionCadence:'cached once per shared calendar second'}},null,2)+'\n');console.log('CPU owner samples saved',rounds.map(r=>[r.speedMps,r.baselineMedianMs,r.mission19MedianMs]))
}finally{rigs.forEach(r=>r.dispose())}
