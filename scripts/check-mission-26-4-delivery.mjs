// Inspect an already compiled production bundle, without diagnostic hooks.
import {preview} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readBuildIdentity} from '../build/identity.mjs';
import {missionBrowserOptions} from './lib/mission-26-browser.mjs';
const out='work/mission-26-4/delivery-check',expected=readBuildIdentity(process.cwd(),'production');
assert.equal(expected.mission?.number,'26.4');
assert.equal(expected.dirty,false,'Production identity must come from a clean committed payload');
await mkdir(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:5440,strictPort:true}});
const browser=await chromium.launch(missionBrowserOptions());
const report={method:'Actual production dist, no evidence hooks, embedded mission/commit identity and four responsive menu layouts. No physical-GPU or travel acceptance.',expected,requests:[],errors:[],layouts:[]};
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('request',r=>report.requests.push(r.url()));page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto('http://127.0.0.1:5440/endless-earth/');
 const badge=page.locator('.build-indicator');await badge.waitFor({state:'attached'});assert.equal(await badge.isVisible(),false);
 await page.locator('#walk-menu-toggle').click();await page.locator('.menu-info').evaluate(e=>e.open=true);await badge.scrollIntoViewIfNeeded();
 assert.equal(await badge.getAttribute('data-commit'),expected.commit);assert.equal(await badge.getAttribute('data-environment'),'production');assert.equal(await badge.getAttribute('data-dirty'),String(expected.dirty));
 assert.equal(await page.locator('.build-indicator__mission').innerText(),`Mission ${expected.mission.number} — ${expected.mission.name}`);
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(viewport);await badge.scrollIntoViewIfNeeded();
  const layout=await badge.evaluate(element=>{const rect=element.getBoundingClientRect(),mission=element.querySelector('.build-indicator__mission'),code=element.querySelector('code');return {viewport:[innerWidth,innerHeight],bounds:[rect.left,rect.top,rect.right,rect.bottom],missionClipped:mission.scrollWidth>mission.clientWidth,commitClipped:code.scrollWidth>code.clientWidth}});
  assert.ok(layout.bounds[0]>=0&&layout.bounds[2]<=viewport.width&&layout.bounds[3]<=viewport.height);assert.equal(layout.missionClipped,false);assert.equal(layout.commitClipped,false);report.layouts.push(layout);
  await page.screenshot({path:`${out}/production-${viewport.width}x${viewport.height}.png`});
 }
 for(const name of ['p252','p261','p262','p263','p264','q26'])assert.equal(await page.evaluate(name=>typeof window[name],name),'undefined');
 assert.ok(!report.requests.some(url=>/api\.github|build-identity|\.git\//.test(url)));assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);report.passed=false;process.exitCode=1}
finally{await browser.close();await new Promise(ok=>server.httpServer.close(ok));await writeFile(out+'/production-check.json',JSON.stringify(report,null,2))}
console.log({passed:report.passed,commit:expected.commit,dirty:expected.dirty,mission:expected.mission,layouts:report.layouts.length,failure:report.failure});
