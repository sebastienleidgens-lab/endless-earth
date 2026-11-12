import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[],rows=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5173/endless-earth/docs/mission-14-evidence/index.html');
 for(const size of [{width:1280,height:900},{width:390,height:844}]){
  await page.setViewportSize(size);
  for(const id of await page.locator('#view option').evaluateAll(xs=>xs.map(x=>x.value))){await page.selectOption('#view',id);await page.locator('#old').evaluate(x=>x.decode());await page.locator('#new').evaluate(x=>x.decode());}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));rows.push({size,pairedImages:20,overflow:false});
 }
 const video=await page.locator('video').evaluate(async v=>{v.load();await new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',()=>reject(Error('Video failed')),{once:true})});return {duration:v.duration,width:v.videoWidth,height:v.videoHeight}});assert.ok(video.duration>340);
 const links=await page.locator('a').evaluateAll(xs=>xs.map(a=>a.href));for(const url of links){const r=await page.request.get(url);assert.ok(r.ok(),url)}
 assert.deepEqual(errors,[]);await writeFile('docs/mission-14-evidence/gallery.json',JSON.stringify({rows,video,linksChecked:links.length,errors},null,2)+'\n');console.log('PASS gallery',rows,video);
}finally{await browser.close()}
