import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],failures=[];
try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()})});
  await page.goto(`http://localhost:${Number(process.env.MISSION20_PORT??5340)}/endless-earth/docs/mission-20-evidence/index.html`);
  await page.locator('details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
  const assets=await page.evaluate(async()=>{
    const images=await Promise.all([...document.images].map(async img=>{img.loading='eager';await img.decode();return {src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight}}));
    const videos=await Promise.all([...document.querySelectorAll('video')].map(async v=>{v.preload='metadata';v.load();if(!v.readyState)await new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',()=>reject(new Error(v.currentSrc)),{once:true})});return {src:v.getAttribute('src'),duration:v.duration,width:v.videoWidth,height:v.videoHeight}}));
    return {images,videos,links:[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(u=>u.startsWith(location.origin))};
  });
  for(const url of new Set(assets.links)){const response=await page.request.get(url);assert.ok(response.ok(),`${response.status()} ${url}`)}
  assert.ok(assets.images.every(i=>i.width>0&&i.height>0));
  assert.ok(assets.videos.every(v=>v.duration>0&&Number.isFinite(v.duration)&&v.width>0));
  const slider=page.locator('input[type=range]').first();
  await slider.fill('80');await slider.dispatchEvent('input');
  assert.equal(await slider.evaluate(n=>n.closest('article').querySelector('.compare').style.getPropertyValue('--split')),'80%');
  await slider.fill('50');await slider.dispatchEvent('input');
  const layouts=[];
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`docs/mission-20-evidence/gallery-${viewport.width}.jpg`,type:'jpeg',quality:86});
    const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
    assert.ok(dimensions.document<=dimensions.viewport);layouts.push(dimensions);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  await writeFile('docs/mission-20-evidence/evidence-check.json',JSON.stringify({method:'Gallery desktop/mobile layout, original image decoding, all video metadata, local links and comparison slider checked through Chromium. This does not constitute physical mobile performance or artistic approval.',assets,layouts,errors,failures},null,2)+'\n');
  console.log(`PASS ${assets.images.length} images, ${assets.videos.length} native videos, links, slider and two layouts`);
} finally {await browser.close()}
