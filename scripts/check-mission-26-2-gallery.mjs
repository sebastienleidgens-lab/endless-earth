import {chromium} from 'playwright';
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {missionBrowserOptions,missionContextOptions} from './lib/mission-26-browser.mjs';
const port=Number(process.argv[2]??5403),out='docs/mission-26-2-evidence',report={method:'Local offline-capable HTML gallery over loopback; desktop and mobile emulation, not game performance or human review.',errors:[],cases:[]},browser=await chromium.launch(missionBrowserOptions());
try{
 const nativeFiles=[];for(const label of ['reference','candidate'])for(const c of JSON.parse(await readFile(`${out}/${label}-native.json`)).cases)if(c.video)nativeFiles.push(c.video);
 for(const mobile of [false,true]){
  const page=await browser.newPage({...missionContextOptions,viewport:mobile?{width:390,height:844}:{width:1280,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))report.errors.push(r.status()+' '+r.url());});
  await page.goto(`http://127.0.0.1:${port}/docs/mission-26-2-evidence/index.html`,{waitUntil:'domcontentloaded'});await page.locator('h1').waitFor();
  const c={mobile,scenarios:await page.locator('#acceptance + .scroll tbody tr').count(),videos:await page.locator('video').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};assert.equal(c.scenarios,22);assert.equal(c.videos,nativeFiles.length);assert.equal(c.overflow,false);
  const plans=page.locator('[data-layer="source-plan"]');await plans.uncheck();c.layerHidden=await page.locator('.map .source-plan').evaluateAll(gs=>gs.every(g=>g.style.display==='none'));assert.ok(c.layerHidden);await plans.check();
  if(nativeFiles.length){const first=page.locator('video').first();await first.evaluate(v=>v.load());await page.waitForFunction(()=>document.querySelector('video').readyState>=1,null,{timeout:30000});c.media=await first.evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration}));assert.equal(c.media.width,640);assert.equal(c.media.height,420);assert.ok(c.media.duration>1);await first.evaluate(v=>{v.currentTime=Math.min(10,v.duration/2)});await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.seeking&&v.currentTime>0},null,{timeout:30000});c.media.seekedTime=await first.evaluate(v=>v.currentTime);}
  await page.screenshot({path:out+'/'+(mobile?'gallery-mobile':'gallery-desktop')+'.png'});c.passed=true;report.cases.push(c);await page.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error);report.passed=false;process.exitCode=1;}finally{await browser.close();await writeFile(out+'/gallery-check.json',JSON.stringify(report,null,2));}console.log(report);
