import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const p=await b.newPage({viewport:{width:1200,height:850}}),errors=[];p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://localhost:5173/endless-earth/docs/mission-12-evidence/final/index.html');
 await p.locator('img').evaluateAll(async imgs=>{imgs.forEach(i=>i.loading='eager');await Promise.race([Promise.all(imgs.map(i=>i.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Image decode timeout')),15000))])});
 assert.equal(await p.locator('img').count(),31);
 for(const name of ['Village','Nature et eau','Heures et météo']){await p.getByRole('button',{name,exact:true}).click();assert.equal(await p.locator('article:not([hidden])').count(),4)}
 await p.getByRole('button',{name:'Tout voir',exact:true}).click();assert.equal(await p.locator('article:not([hidden])').count(),12);
 await p.getByRole('button',{name:'C avant harmonie',exact:true}).click();await p.locator('.reference-image').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));if(imgs.some(i=>!i.src.includes('/prior-')))throw Error('Wrong reference')});
 await p.getByRole('button',{name:'Mission 11',exact:true}).click();await p.locator('.reference-image').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));if(imgs.some(i=>!i.src.includes('/before-')))throw Error('Wrong reference')});
 const durations=await p.locator('video').evaluateAll(async videos=>Promise.all(videos.map(v=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Video metadata timeout')),15000);const done=()=>{clearTimeout(timer);resolve(v.duration)};
  v.preload='metadata';v.onerror=()=>reject(Error('Video load'));v.onloadedmetadata=done;if(v.readyState)done();else v.load();
 }))));
 assert.equal(durations.length,4);for(let i=0;i<4;i++)assert.ok(durations[i]>[350,350,30,25][i]);
 await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:'work/mission-12D/gallery-mobile.jpg',type:'jpeg',quality:85});assert.deepEqual(errors,[]);
 await writeFile('docs/mission-12-evidence/final/gallery.json',JSON.stringify({images:31,pairedStations:12,filterCounts:[4,4,4],references:['Mission 11','C'],videoDurations:durations,mobileViewport:[390,844],horizontalOverflow:false,errors,method:'Actual browser decoding of all original images/video metadata, live filters, both references and mobile layout. Desktop gallery opened separately in shared Chromium.'},null,2));
 console.log('PASS final gallery: 31 images, 12 pairs, 2 references, 4 native videos, filters and mobile layout');
}finally{await b.close()}
