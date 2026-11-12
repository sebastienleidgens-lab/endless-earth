import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const dir='docs/mission-14-evidence/heritage',browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(`http://localhost:5173/endless-earth/${dir}/index.html`);
 const ids=await page.locator('#scene option').evaluateAll(os=>os.map(o=>o.value));assert.equal(ids.length,11);
 for(const id of ids){await page.selectOption('#scene',id);await page.locator('#before').evaluate(i=>i.decode());await page.locator('#after').evaluate(i=>i.decode());assert.equal(await page.locator('#before').evaluate(i=>i.naturalWidth),960);assert.equal(await page.locator('#after').evaluate(i=>i.naturalWidth),960)}
 await page.selectOption('#scene','chateau-rive');await page.locator('#after').evaluate(i=>i.decode());await page.locator('#split').evaluate(i=>{i.value='35';i.dispatchEvent(new Event('input'))});assert.ok((await page.locator('#after').evaluate(i=>i.style.clipPath)).includes('35%'));
 await page.waitForFunction(()=>Number.isFinite(document.querySelector('video').duration));const duration=await page.locator('video').evaluate(v=>v.duration);assert.ok(duration>63&&duration<66);await page.locator('video').evaluate(v=>{v.currentTime=20;v.muted=true;return v.play()});await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>20.2&&v.videoWidth===640&&v.videoHeight===360});await page.locator('video').evaluate(v=>v.pause());
 const photos=await page.locator('.references img').count();assert.equal(photos,5);for(const i of await page.locator('.references img').all())await i.evaluate(i=>i.decode());
 const links=await page.locator('a').evaluateAll(as=>as.map(a=>a.getAttribute('href')).filter(h=>h&&!/^https?:|^#/.test(h)));for(const href of links)await access(resolve(dirname(dir+'/index.html'),decodeURIComponent(href.split('#')[0])));
 await page.screenshot({path:`${dir}/gallery-desktop.jpg`,type:'jpeg',quality:85});await page.setViewportSize({width:390,height:844});await page.locator('#scene').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/gallery-mobile.jpg`,type:'jpeg',quality:85});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 await writeFile(dir+'/gallery.json',JSON.stringify({views:11,capturesDecoded:22,referencePhotosDecoded:photos,localLinksChecked:links.length,duration,seekSeconds:20,actualPlayback:true,comparisonSlider:true,viewports:[[1280,800],[390,844]],noHorizontalOverflow:true,errors},null,2)+'\n');console.log('PASS 22 captures, five credited photos, slider, native AV playback, local links and responsive gallery');
}finally{await browser.close()}
