import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:480}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5173/endless-earth/?perf=1');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const state=()=>page.evaluate(()=>window.endlessDiagnostics);
 await page.mouse.move(430,300);await page.mouse.wheel(0,250);const zoom=(await state()).zoom;
 for(const mode of ['first','aerial','third']){await page.keyboard.press('v');await page.waitForFunction(m=>window.endlessDiagnostics.mode===m,mode);}assert.equal((await state()).zoom,zoom,'third person zoom remembered');
 await page.locator('#auto-walk').click();await page.mouse.move(430,300);await page.mouse.down();await page.mouse.move(570,300);const yaw=(await state()).yaw;
 await page.waitForTimeout(2000);assert.equal((await state()).yaw,yaw,'no recenter during drag');await page.mouse.up();await page.waitForTimeout(1000);assert.equal((await state()).yaw,yaw,'idle delay respected');
 await page.waitForTimeout(8500);const s=await state(),p=s.position,q=s.routePoints[s.routeIndex],heading=Math.atan2(p[0]-q.x,p[2]-q.z),error=Math.abs(Math.atan2(Math.sin(s.yaw-heading),Math.cos(s.yaw-heading)));assert.ok(error<.65,`camera returns behind, angle error ${error}`);
 await page.locator('#auto-walk').click();await page.waitForTimeout(500);
 const before=await state();
 const fixture=await page.evaluate(async()=>{
  const url=path=>performance.getEntriesByType('resource').findLast(e=>new URL(e.name).pathname==='/endless-earth/src/'+path)?.name??'/endless-earth/src/'+path;
  const collision=await import(url('world/collisions.ts'));const data=await(await fetch('/endless-earth/data/angles-osm.geojson')).json();
  const s=window.endlessDiagnostics,[x,,z]=s.position,dx=s.camera[0]-x,dz=s.camera[2]-z,d=Math.hypot(dx,dz),ux=dx/d,uz=dz/d;
  const cx=x+ux*1.1,cz=z+uz*1.1;
  const ring=[[-.1,-3],[.1,-3],[.1,3],[-.1,3],[-.1,-3]].map(([a,b])=>[.8844+(cx+ux*a-uz*b)/(111320*Math.cos(46.6953*Math.PI/180)),46.6953-(cz+uz*a+ux*b)/111320]);
  collision.setBuildingFootprints([...data.features,{properties:{barrier:'wall'},geometry:{type:'Polygon',coordinates:[ring]}}]);
  window.cameraTestCollision=collision;return {x,z,ux,uz};
 });
 await page.waitForTimeout(1000);const after=await state();assert.ok(Math.hypot(after.camera[0]-after.position[0],after.camera[2]-after.position[2])<Math.hypot(before.camera[0]-before.position[0],before.camera[2]-before.position[2]),'boom retracts before wall');
 assert.ok(await page.evaluate(()=>{const s=window.endlessDiagnostics;return window.cameraTestCollision.cameraClear(s.camera[0],s.camera[2]);}));
 assert.deepEqual(errors,[]);console.log('PASS camera: remembered wheel zoom, drag lock, idle delay, recenter, mapped wall collision, three views');
}finally{await browser.close();}
