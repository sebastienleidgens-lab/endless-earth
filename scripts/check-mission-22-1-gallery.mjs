import {readFile,writeFile,stat} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
import {launch,out} from './lib/mission-22-1-browser.mjs';
const browser=await launch(),errors=[],missing=[],images=[],videos=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5363/endless-earth/'+out+'/index.html');
 const scenes=JSON.parse(await readFile(out+'/gallery-scenes.json','utf8'));assert.equal(scenes.comparisons,79);assert.equal(scenes.sameCamera,true);
 for(const r of scenes.rows)for(const file of [r.before,r.after]){const result=await page.evaluate(async file=>{const i=new Image();i.src=file;await i.decode();return {file,width:i.naturalWidth,height:i.naturalHeight}},file);assert.ok(result.width>0);images.push(result);}
 await page.selectOption('#scene','20');await page.locator('#after').evaluate(i=>i.decode());await page.locator('#split').fill('72');await page.locator('#split').dispatchEvent('input');assert.ok((await page.locator('#after').getAttribute('style')).includes('72%'));
 await page.locator('#next').click();assert.equal(await page.locator('#scene').inputValue(),'21');await page.locator('#previous').click();assert.equal(await page.locator('#scene').inputValue(),'20');
 for(const src of await page.locator('video').evaluateAll(v=>v.map(e=>e.getAttribute('src')))){
  const row=await page.evaluate(async src=>{const v=document.createElement('video');v.preload='metadata';v.src=src;await new Promise((ok,no)=>{v.onloadedmetadata=ok;v.onerror=()=>no(new Error(src))});const row={src,duration:v.duration,width:v.videoWidth,height:v.videoHeight};v.removeAttribute('src');v.load();return row},src);assert.ok(Number.isFinite(row.duration)&&row.duration>1);videos.push(row);
 }
 const playback=[];for(const src of ['pont-native.webm','family-routine.webm','audio/conversation-distante.webm']){const row=await page.evaluate(async src=>{const v=[...document.querySelectorAll('video')].find(v=>v.getAttribute('src')===src);v.muted=true;await v.play();await new Promise(r=>setTimeout(r,400));v.pause();const progressed=v.currentTime;const seek=Math.min(5,v.duration/2);v.currentTime=seek;await new Promise((ok,no)=>{v.onseeked=ok;v.onerror=no});return {src,progressed,seekedTo:v.currentTime}},src);assert.ok(row.progressed>0&&Math.abs(row.seekedTo-5)<.2);playback.push(row)}
 for(const href of await page.locator('a').evaluateAll(a=>a.map(e=>e.getAttribute('href'))))if(!/^(https?:|#)/.test(href)){try{await stat(path.resolve(out,href))}catch{missing.push(href)}}
 await page.selectOption('#scene','0');await page.locator('#after').evaluate(i=>i.decode());await page.locator('#split').fill('50');await page.locator('#split').dispatchEvent('input');await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/gallery-desktop.jpg'});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/gallery-mobile.jpg'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.equal(overflow,0);assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
 await writeFile(out+'/gallery-check.json',JSON.stringify({comparisons:scenes.comparisons,sameCamera:scenes.sameCamera,decodedImages:images.length,images,videos,playback,localLinksMissing:missing,mobileHorizontalOverflowPx:overflow,errors},null,2)+'\n');console.log('PASS gallery',images.length,'images',videos.length,'films');
}finally{await browser.close()}
