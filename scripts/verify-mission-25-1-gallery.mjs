import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch} from './lib/mission-24-browser.mjs';
const browser=await launch();
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const url='http://localhost:5360/endless-earth/docs/mission-25-1-evidence/index.html';await page.goto(url);const layouts=[];
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.screenshot({path:'docs/mission-25-1-evidence/gallery-'+viewport.width+'.png',fullPage:false});
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,videos:document.querySelectorAll('video').length,mapPoints:document.querySelectorAll('#map circle').length}));assert.equal(layout.width,layout.scroll);assert.equal(layout.videos,33);assert.equal(layout.mapPoints,6086);layouts.push(layout);
 }
 await page.selectOption('#rate','.5');assert.ok(await page.evaluate(()=>[...document.querySelectorAll('video')].every(v=>v.playbackRate===.5)));
 const links=await page.locator('a[href],img[src]').evaluateAll(elements=>elements.map(e=>e.href??e.src).filter(u=>u&&!u.includes('#'))),checked=[];
 for(const link of new Set(links)){const response=await page.request.head(link);assert.ok(response.ok(),link+' '+response.status());checked.push({url:new URL(link).pathname,status:response.status()});}
 assert.deepEqual(errors,[]);await writeFile('docs/mission-25-1-evidence/gallery-check.json',JSON.stringify({layouts,checked,errors,method:'Standalone local gallery, two viewports, no horizontal overflow, valid relative links/images, playback-rate control. Actual app validation is separate.'},null,2));console.log('PASS gallery layouts, links and native playback control');
}finally{await browser.close()}
