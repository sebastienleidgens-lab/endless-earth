// Existing lifecycle/profile checks, redirected to this milestone's evidence.
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const script=new URL('browser-mission-13-checks.mjs',import.meta.url);
let source=await readFile(script,'utf8');
source=source.replace('docs/mission-13-evidence/checks','docs/mission-13-evidence/optimization/checks')
 .replaceAll("import.meta.resolve('playwright')",JSON.stringify(import.meta.resolve('playwright')))
 .replaceAll('import.meta.url',JSON.stringify(script.href));
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];
try{
 for(const mode of ['corrupt-hybrid','invalid-catalog','mission12']){
  const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(String(e)));
  if(mode==='corrupt-hybrid')await p.route('**/materials/france/poitou.png',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.from('invalid')}));
  if(mode==='invalid-catalog')await p.route('**/materials/france/catalog.json',r=>r.fulfill({status:200,contentType:'application/json',body:'{"schema":"invalid"}'}));
  await p.goto(`http://localhost:5173/endless-earth/?perf=1&materials=${mode==='mission12'?'mission12':'hybrid'}&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);
  await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
  const state=await p.evaluate(()=>window.endlessDiagnostics);assert.equal(state.authentic.active,'mission12');assert.equal(state.authentic.state,mode==='mission12'?'ready':'fallback');assert.equal(state.authentic.textureCount,0);assert.equal(state.natureAnchors,2500);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  rows.push({mode,authentic:state.authentic,position:state.position,geographyReady:state.ready,trees:state.natureAnchors,errors});await p.close();
 }
 await writeFile('docs/mission-13-evidence/optimization/checks/fallback.json',JSON.stringify({method:'Real pilot, optional new atlas or catalogue corrupted; original Mission 12 appearance and geographic navigation remain available. Mobile layout includes source credits.',rows},null,2)+'\n');
}finally{await browser.close()}
// Complete CPU/build checks before the continuous recording is allowed to start.
for(const [args,file] of [[['test'],'node-tests.log'],[['run','build'],'build.log']]){
 const r=spawnSync('npm',args,{encoding:'utf8',maxBuffer:8e6});
 await writeFile('work/mission-13D/'+file,(r.stdout??'')+(r.stderr??''));
 assert.equal(r.status,0,'npm '+args.join(' '));
}
