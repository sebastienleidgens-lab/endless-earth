// Evidence page, media metadata and credits must remain usable on mobile.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),out='docs/mission-13-evidence/integration';
try{
 const p=await browser.newPage(),errors=[],requests=[],layouts=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>requests.push(r.url()));
 await p.goto('http://localhost:5173/endless-earth/docs/mission-13-evidence/integration/index.html');
 await p.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
 await p.waitForFunction(()=>[...document.images].length===36&&[...document.images].every(i=>i.complete&&i.naturalWidth===960));
 await p.waitForFunction(()=>[...document.querySelectorAll('video')].every(v=>Number.isFinite(v.duration)&&v.duration>350));
 const media=await p.locator('video').evaluateAll(v=>v.map(x=>({source:x.getAttribute('src'),seconds:x.duration,controls:x.controls})));
 const links=await p.locator('a').evaluateAll(links=>links.map(a=>a.href).filter(x=>!x.includes('#')));
 for(const href of new Set(links)){if(href.endsWith('.webm'))continue;const r=await p.request.get(href);assert.equal(r.status(),200,href)}
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await p.setViewportSize(viewport);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));layouts.push(viewport);
  if(viewport.width===390)await p.screenshot({path:out+'/gallery-mobile.jpg',type:'jpeg',quality:86});
 }
 await p.goto('http://localhost:5173/endless-earth/materials/authentic/credits.html');assert.match(await p.title(),/Auteurs/);assert.equal(await p.locator('li').count(),10);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);assert.ok(requests.every(url=>new URL(url).origin==='http://localhost:5173'));
 await writeFile(out+'/checks/gallery.json',JSON.stringify({images:36,media,layouts,localLinksChecked:new Set(links).size,credits:10,externalRequests:0,errors},null,2)+'\n');
 console.log('PASS gallery: 36 decoded images, two native videos with metadata, local links, four layouts and ten source credits');
}finally{await browser.close()}
