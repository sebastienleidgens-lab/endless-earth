import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:480}});page.setDefaultTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5173/endless-earth/?perf=1');await page.waitForFunction(()=>window.endlessDiagnostics?.ready);
 await page.evaluate(async()=>{
  const base='/endless-earth/src/';
  const url=path=>performance.getEntriesByType('resource').findLast(e=>new URL(e.name).pathname===base+path)?.name??base+path;
  const [collision,geo,terrain]=await Promise.all([import(url('world/collisions.ts')),import(url('living/geography.ts')),import(url('world/terrain.ts'))]);
  const data=await(await fetch('/endless-earth/data/angles-osm.geojson')).json();
  window.safety={collision,geo,terrain:await terrain.fetchTerrain(),features:data.features,samples:[],recording:false};
  const sample=()=>{const s=window.safety;if(s.recording){const [x,,z]=window.endlessDiagnostics.position;s.samples.push({x,z,clear:collision.canWalk(x,z)});}requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 for(const tags of [{building:'yes'},{highway:'footway',access:'private'},{natural:'water'},{barrier:'wall'},{historic:'castle'}]){
  await page.evaluate(()=>window.safety.collision.setBuildingFootprints(window.safety.features));
  await page.locator('#auto-walk').click();await page.waitForFunction(()=>window.endlessDiagnostics.autoWalk);
  const barrier=await page.evaluate(tags=>{
   const s=window.safety,[x,,z]=window.endlessDiagnostics.position,p={x,z},route=s.geo.routeAt(p,s.terrain);
   if(!route)throw new Error(JSON.stringify({p,clear:s.collision.canWalk(x,z),valid:s.geo.validPoint(p,s.terrain),paths:s.geo.paths.length,ready:window.endlessDiagnostics}));
   const target=route.points.find(q=>Math.hypot(q.x-x,q.z-z)>2);if(!target)throw new Error('No test segment');
   const d=Math.hypot(target.x-x,target.z-z),ux=(target.x-x)/d,uz=(target.z-z)/d;
   const cx=x+ux*1.5,cz=z+uz*1.5;
   const ring=[[-.15,-4],[.15,-4],[.15,4],[-.15,4],[-.15,-4]].map(([a,b])=>({x:cx+ux*a-uz*b,z:cz+uz*a+ux*b}));
   const coordinates=ring.map(q=>[.8844+q.x/(111320*Math.cos(46.6953*Math.PI/180)),46.6953-q.z/111320]);
   s.collision.setBuildingFootprints([...s.features,{type:'Feature',properties:tags,geometry:{type:'Polygon',coordinates:[coordinates]}}]);
   s.samples=[];s.recording=true;return {x,z,ux,uz};
  },tags);
  await page.waitForFunction(()=>!window.endlessDiagnostics.autoWalk);
  const result=await page.evaluate(()=>{window.safety.recording=false;return {state:window.endlessDiagnostics,samples:window.safety.samples};});
  assert.match(result.state.walkMessage,/bloqué/);
  assert.ok(result.samples.length>0);assert.ok(result.samples.every(p=>p.clear));
  for(const p of result.samples)assert.ok((p.x-barrier.x)*barrier.ux+(p.z-barrier.z)*barrier.uz<1.35,'never crosses the obstruction');
  console.log('STOP PASS',tags,result.state.position,'samples',result.samples.length);
 }
 assert.deepEqual(errors,[]);console.log('PASS: live building, private area, water, wall and historic ruins injected AFTER Auto Walk starts; every sampled frame legal.');
}finally{await browser.close();}
