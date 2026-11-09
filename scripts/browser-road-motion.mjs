import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {injection} from './lib/browser-road-fixture.mjs';
const phase=process.argv[2]??'after',port=phase==='before'?5175:5173,dir='docs/mission-07-1-captures';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));await route.fulfill({response,body:body+injection})});
 await page.goto(`http://localhost:${port}/endless-earth/?perf=1&date=2026-06-21T12:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 if(phase==='after')assert.equal((await page.evaluate(()=>window.earthTest.terrain())).surface,'integrated');
 await page.addStyleTag({content:'.perf-panel{visibility:hidden}'});
 const results={};
 for(const mode of ['fixe','lent','rapide','rotation','aerienne']){
  const frames=[];
  for(let i=0;i<6;i++){
   const d=mode==='lent'?i*.12:mode==='rapide'?i*1.8:0;
   const v=mode==='aerienne'?['motion',28+i*3,-20,.5+i*.04,.5,55+i*5,'aerial']:['motion',-18.43135941299998-Math.sin(.95)*d,-38.63917199989373-Math.cos(.95)*d,.95+(mode==='rotation'?i*.05:0),-.02,0,'first'];
   await page.evaluate(v=>{window.earthTest.setup(v);window.earthTest.lod();window.earthTest.render()},v);
   const pixels=await page.evaluate(async()=>{const bytes=window.earthReadback;const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('')});
   await page.screenshot({path:`${dir}/motion-${phase}-${mode}-${i}.png`});frames.push({station:v,pixelSha256:pixels});
  }
  if(mode==='fixe')assert.equal(new Set(frames.map(f=>f.pixelSha256)).size,1,'held camera and atmosphere must produce identical successive GL frames');
  else assert.ok(new Set(frames.map(f=>f.pixelSha256)).size>1,'camera must actually move');
  results[mode]=frames;console.log('PASS',phase,mode);
 }
 assert.deepEqual(errors,[]);await writeFile(`${dir}/motion-${phase}.json`,JSON.stringify({results,errors,method:'6 successive held-atmosphere renders per camera trajectory; raw WebGL pixel hashes. Fixed view must remain identical. Moving views visually reviewed as sequences, not compared for pixel identity.'},null,2));
}finally{await browser.close()}
