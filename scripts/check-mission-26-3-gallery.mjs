import {chromium} from 'playwright';
import {writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {missionBrowserOptions,missionContextOptions} from './lib/mission-26-browser.mjs';
const out='docs/mission-26-3-evidence',port=Number(process.argv[2]??5420);
const report={method:'Local autonomous proof gallery, desktop and CDP touch emulation. Checks links, layout, filters and native media metadata; no game FPS or human visual acceptance.',errors:[],cases:[]};
const browser=await chromium.launch(missionBrowserOptions());
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({...missionContextOptions,viewport:mobile?{width:390,height:844}:{width:1280,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))report.errors.push(r.status()+' '+r.url())});
  await page.goto(`http://127.0.0.1:${port}/${out}/index.html`,{waitUntil:'load'});
  const c={mobile,scenarios:await page.locator('#acceptance tbody tr').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),media:[]};
  assert.equal(c.scenarios,12);assert.equal(c.overflow,false);
  const links=await page.locator('[href],[src]').evaluateAll(elements=>elements.flatMap(e=>['href','src'].map(k=>e.getAttribute(k)).filter(Boolean)));
  c.localLinks=links.length;
  for(const link of links){assert.ok(!/^(https?:|data:|\/\/)/.test(link));await stat(resolve(out,decodeURIComponent(link.split('#')[0])))}
  await page.locator('#plans').uncheck();assert.ok(await page.locator('.plan').evaluateAll(e=>e.every(p=>p.style.display==='none')));await page.locator('#plans').check();
  await page.locator('#failed').uncheck();assert.ok(await page.locator('.trace[data-arrived="false"]').evaluateAll(e=>e.every(p=>p.style.display==='none')));await page.locator('#failed').check();
  await page.locator('#journey').selectOption('0');assert.equal(await page.locator('.trace').evaluateAll(e=>e.filter(p=>p.style.display!=='none').length),1);await page.locator('#journey').selectOption('all');
  for(const video of await page.locator('video').all()){
   await video.evaluate(async v=>{v.preload='metadata';v.load();await new Promise((ok,no)=>{if(v.readyState>=1)return ok();v.onloadedmetadata=ok;v.onerror=()=>no(Error('Invalid media '+v.src));setTimeout(()=>no(Error('Media timeout '+v.src)),15000)})});
   const m=await video.evaluate(v=>({src:v.getAttribute('src'),width:v.videoWidth,height:v.videoHeight,duration:v.duration}));assert.ok(m.width>0&&m.height>0&&m.duration>0);c.media.push(m);
  }
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/gallery-${mobile?'mobile':'desktop'}.png`});c.passed=true;report.cases.push(c);await page.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);report.passed=false;process.exitCode=1}
finally{await browser.close();await writeFile(out+'/gallery-check.json',JSON.stringify(report,null,2))}
console.log({passed:report.passed,cases:report.cases.map(c=>({mobile:c.mobile,scenarios:c.scenarios,media:c.media.length,links:c.localLinks,overflow:c.overflow})),failure:report.failure,errors:report.errors});
