import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
const out='docs/mission-26-evidence/benchmarks.json',candidateOnly=process.argv[2]==='candidate',rows=candidateOnly?JSON.parse(await readFile(out,'utf8')).rows.filter(r=>r.version==='reference'):[];
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const scenes=[{name:'field',x:-37,z:190,yaw:.3,pitch:.12,zoom:5},{name:'forest',x:-620,z:-300,yaw:.7,pitch:.12,zoom:4.8}];
try{
 for(const [version,port,receipt]of (candidateOnly?[['candidate',5380,'work/mission-26/compiled/runtime-build.json']]:[['reference',5381,'work/mission-26/reference-compiled/runtime-build.json'],['candidate',5380,'work/mission-26/compiled/runtime-build.json']])){
  let build=null;try{build=JSON.parse(await readFile(receipt,'utf8'));}catch{}
  const p=await b.newPage({viewport:{width:480,height:320},deviceScaleFactor:1}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(`http://localhost:${port}/endless-earth/?perf=1&evidence=1&spawnSeed=12345&date=2026-06-21T12:00:00Z&moment=afternoon`);
  await p.waitForFunction(()=>window.p252,null,{timeout:120000});await p.evaluate(()=>{window.p252.profile('eco');window.p252.hold(false)});await p.waitForFunction(()=>window.endlessDiagnostics?.ready,null,{timeout:120000});
  for(const profile of ['eco','balanced','quality'])for(const scene of scenes){
   await p.evaluate(q=>{window.p252.setup(q);window.p252.hold(false)},{...scene,profile});await p.waitForTimeout(6000);await p.evaluate(()=>window.p252.hold(true));
   const state=await p.evaluate(()=>window.p252.state()),samples=await p.evaluate(async()=>{for(let i=0;i<4;i++){window.p252.render();await new Promise(requestAnimationFrame);}const samples=[];for(let i=0;i<16;i++){samples.push(window.p252.render());await new Promise(requestAnimationFrame);}return samples;});
   const sorted=samples.map(s=>s.ms).sort((a,b)=>a-b),row={version,build,profile,scene,viewport:[480,320],dpr:1,state,samples,medianMs:(sorted[7]+sorted[8])/2,p95Ms:sorted[15],buffers:await p.evaluate(()=>window.p252.buffers()),errors:[...errors]};rows.push(row);
   await writeFile(out,JSON.stringify({method:'Paired stationary render+gl.finish, 4 warmup and 16 samples, Chromium SwiftShader. Simulation held; excludes active shadow refresh, physics, animation, audio, input and streaming. These figures cannot close the <=5% active-frame or 60/30 FPS targets. Reference and candidate served separately with the same diagnostic API.',rows},null,2));console.log(version,scene.name,profile,row.medianMs.toFixed(2),row.p95Ms.toFixed(2));
  }
  await p.close();
 }
}finally{await b.close();}
