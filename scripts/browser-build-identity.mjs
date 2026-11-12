// Verify the actual production bundle, with no Git/version endpoint in the browser.
import {build,preview} from 'vite';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readBuildIdentity} from '../build/identity.mjs';
await mkdir('work/build-identity',{recursive:true});
const expected=readBuildIdentity(process.cwd(),'production');
assert.equal(expected.commit,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
await build();
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),requests=[],errors=[];
 page.setDefaultTimeout(90000);page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4173/endless-earth/');if(process.env.EARTHLIFE_WAIT_WORLD==='1')await page.waitForFunction(()=>!document.querySelector('#auto-walk')?.disabled&&document.querySelector('.hud>small')?.textContent.includes('Sources IGN'));const badge=page.locator('.build-indicator');await badge.waitFor({state:'attached'});assert.equal(await badge.isVisible(),false);await page.locator('#walk-menu-toggle').click();await page.locator('.menu-info').evaluate(e=>e.open=true);await badge.scrollIntoViewIfNeeded();
 assert.equal(await badge.getAttribute('data-commit'),expected.commit);assert.equal(await badge.getAttribute('data-environment'),'production');assert.equal(await badge.getAttribute('data-dirty'),String(expected.dirty));
 assert.equal(await page.locator('.build-indicator__mission').innerText(),`Mission ${expected.mission.number} — ${expected.mission.name}`);assert.match(await badge.innerText(),new RegExp(expected.shortCommit));assert.equal(await page.locator('.build-indicator__status').innerText(),'Production');
 const layouts=[];
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(viewport);await badge.scrollIntoViewIfNeeded();
  const layout=await badge.evaluate(element=>{
   const hud=element.closest('.hud').getBoundingClientRect(),rect=element.getBoundingClientRect(),mission=element.querySelector('.build-indicator__mission'),code=element.querySelector('code');
   const blocked=[...document.querySelectorAll('button,.joystick,.nature-controls,.living-panel')].filter(o=>{const r=o.getBoundingClientRect();return r.width&&r.height&&r.left<hud.right&&r.right>hud.left&&r.top<hud.bottom&&r.bottom>hud.top}).map(o=>o.className||o.id);
   return {viewport:[innerWidth,innerHeight],bounds:[rect.left,rect.top,rect.right,rect.bottom],hudBottom:hud.bottom,blocked,pointerEvents:getComputedStyle(element).pointerEvents,missionClipped:mission.scrollWidth>mission.clientWidth,commitClipped:code.scrollWidth>code.clientWidth,fontSize:getComputedStyle(code).fontSize};
  });
  assert.ok(layout.bounds[0]>=0&&layout.bounds[2]<=viewport.width&&layout.bounds[3]<=viewport.height);assert.deepEqual(layout.blocked,[]);assert.equal(layout.pointerEvents,'auto');assert.equal(layout.missionClipped,false);assert.equal(layout.commitClipped,false);layouts.push(layout);
  await page.screenshot({path:`work/build-identity/production-${viewport.width}x${viewport.height}.png`});
 }
 assert.ok(requests.every(url=>new URL(url).origin==='http://127.0.0.1:4173'));assert.ok(!requests.some(url=>/build-identity|api\.github|\.git\//.test(url)),'metadata embedded in bundle, never fetched');assert.deepEqual(errors,[]);
 await writeFile('work/build-identity/validation.json',JSON.stringify({expected,layouts,requests,errors},null,2));console.log('PASS compiled production identity, four layouts, no control overlap or metadata requests');
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
