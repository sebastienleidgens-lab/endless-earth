import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const out='docs/mission-26-evidence',errors=[],report={errors};
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage({viewport:{width:960,height:640},deviceScaleFactor:1});p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://localhost:5380/endless-earth/?perf=1&evidence=1&spawnSeed=12345&date=2026-06-21T12:00:00Z');await p.waitForFunction(()=>window.q26);await p.evaluate(()=>{window.p252.profile('eco');window.p252.hold(false)});await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&window.endlessPlanetDiagnostics?.ready,null,{timeout:120000});
 await p.evaluate(()=>{window.p252.setup({x:-487.804873154947,z:-703.4874526406431,yaw:.9,pitch:.18,zoom:8,profile:'eco'});window.p252.hold(false)});
 await p.waitForFunction(()=>{const s=window.endlessPlanetDiagnostics.metrics.stream;return s.loaded>=2&&s.active===0&&s.queued===0},null,{timeout:120000});await p.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.p252.hold(true)});
 report.sourceCommit=await p.evaluate(()=>window.p252.state().commit);report.ownership=await p.evaluate(()=>window.q26.waterOwnership());report.passed=errors.length===0&&report.ownership.insideHits===0&&report.ownership.outsideHits>0;report.scope='Compiled final runtime, rendered departmental water batches tested independently of historical meshes. 729 interior rays and exterior triangle centroids. Diagnostic placement before still; not a navigation film or a fidelity/flow claim.';await p.screenshot({path:out+'/pilot-water-owner.png'});console.log(report);
}catch(e){report.failure=String(e);report.passed=false;console.log('WATER OWNER FAILED',String(e));}
finally{await writeFile(out+'/water-owner.json',JSON.stringify(report,null,2));await b.close();if(!report.passed)process.exitCode=1;}
