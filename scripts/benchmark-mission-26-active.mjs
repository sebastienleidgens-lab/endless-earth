import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
const out='docs/mission-26-evidence/active-benchmarks.json',candidateOnly=process.argv[2]==='candidate',rows=candidateOnly?JSON.parse(await readFile(out,'utf8')).rows.filter(r=>r.version==='reference'):[];
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const scenes=[{name:'field',x:-37,z:190,yaw:.3,pitch:.12,zoom:5},{name:'forest',x:-620,z:-300,yaw:.7,pitch:.12,zoom:4.8}];
const quantile=(values,p)=>{const s=[...values].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(s.length*p))]??null;};
try{
 for(const [version,port]of (candidateOnly?[['candidate',5380]]:[['reference',5381],['candidate',5380]])){
  const p=await b.newPage({viewport:{width:640,height:420},deviceScaleFactor:1}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(`http://localhost:${port}/endless-earth/?perf=1&evidence=1&spawnSeed=12345&date=2026-06-21T12:00:00Z&moment=afternoon`);await p.waitForFunction(()=>window.q26,null,{timeout:120000});await p.evaluate(()=>{window.p252.profile('eco');window.p252.hold(false)});await p.waitForFunction(()=>window.endlessDiagnostics?.ready,null,{timeout:120000});await p.evaluate(()=>window.p252.audio());
  for(const profile of ['eco','balanced','quality'])for(const scene of scenes){
   await p.evaluate(q=>{window.p252.setup(q);window.p252.hold(false)},{...scene,profile});await p.waitForTimeout(3000);
   const before=await p.evaluate(q=>window.p252.setup(q),{...scene,profile});
   const samples=await p.evaluate(async()=>{
    window.p252.input(.65,.12);window.p252.hold(false);
    const start=performance.now(),samples=[];let previous=null;
    await new Promise(resolve=>{function observe(t){const now=performance.now();if(previous!==null)samples.push({t,frameMs:t-previous,cpuEnqueueMs:now-window.__missionFrameStart,animationMs:window.__missionAnimationMs,physicsMs:window.__missionPhysicsMs,position:window.q26.world().position,heap:performance.memory?.usedJSHeapSize});previous=t;if(now-start>=15000)resolve();else requestAnimationFrame(observe);}requestAnimationFrame(observe);});
    window.p252.input();window.p252.hold(true);return samples;
   });
   const after=await p.evaluate(()=>({state:window.p252.state(),world:window.q26.world(),adaptiveResolution:window.endlessDiagnostics.adaptiveResolution,audioEnabled:window.endlessDiagnostics.sound,audioState:window.endlessDiagnostics.soundState,canvas:{width:document.querySelector('#app canvas').width,height:document.querySelector('#app canvas').height,clientWidth:document.querySelector('#app canvas').clientWidth,clientHeight:document.querySelector('#app canvas').clientHeight}}));
   let distanceM=0;for(let i=1;i<samples.length;i++)distanceM+=Math.hypot(...samples[i].position.map((v,j)=>v-samples[i-1].position[j]));
   const row={version,profile,scene,viewport:[640,420],dpr:1,input:{forward:.65,strafe:.12,run:false},audioEnabled:after.audioEnabled,before,after,samples,distanceM,p50FrameMs:quantile(samples.map(s=>s.frameMs),.5),p95FrameMs:quantile(samples.map(s=>s.frameMs),.95),p95CpuEnqueueMs:quantile(samples.map(s=>s.cpuEnqueueMs),.95),errors:[...errors]};rows.push(row);
   const comparisons=rows.filter(r=>r.version==='candidate').map(r=>{const ref=rows.find(q=>q.version==='reference'&&q.profile===r.profile&&q.scene.name===r.scene.name),ratio=ref?.p95FrameMs?r.p95FrameMs/ref.p95FrameMs:null;return {scene:r.scene.name,profile:r.profile,p95Ratio:ratio,softwareRelativeThresholdMet:ratio!==null&&ratio<=1.05,scope:'This sample only; not a physical hardware or complete mission acceptance.'};});
   await writeFile(out,JSON.stringify({method:'Native active simulation, real input held for >=15 seconds per case, audio on, 640x420 DPR1, reference and candidate separately. RAF telemetry observes the existing game loop without recording video or simulating another world. CPU enqueue excludes completed GPU timing. Streaming, climate, shadows, actors, physics and audio remain active. Same parameters, not identical timesteps. Background preparations and adaptive resolution are disclosed per row; CSS DPR1 is not a locked drawing-buffer resolution. Final candidate rows also record the actual canvas dimensions. SwiftShader only; short samples cannot certify 60/30 FPS, long travel, perceptual quality or the full <=5% budget.',rows,comparisons},null,2));console.log(version,scene.name,profile,'p50',row.p50FrameMs,'p95',row.p95FrameMs,'samples',samples.length,'distance',distanceM.toFixed(2));
  }
  await p.close();
 }
}finally{await b.close();}
