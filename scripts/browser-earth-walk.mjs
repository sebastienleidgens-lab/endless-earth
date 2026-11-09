import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const dir='docs/mission-07-captures';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:480}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));

 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();
 body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'const earthFrameStart=performance.now();');
 body=body.replace(/renderer\.render\(scene,\s*camera\);\s*(?=if\s*\(qualityAuto)/,`const earthSubmitStart=performance.now();renderer.render(scene,camera);window.earthFrames??=[];if(window.earthFrames.length<8192)window.earthFrames.push({cpuMs:earthSubmitStart-earthFrameStart,submitMs:performance.now()-earthSubmitStart,intervalMs:elapsed*1000,terrain:activeTerrain?.metrics.farTiles,nature:natureMemory(scene)});\n`);
 assert.ok(body.includes('earthFrames.push'));await route.fulfill({response,body})});
 await page.goto('http://localhost:5173/endless-earth/?perf=1');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 const state=()=>page.evaluate(()=>window.endlessDiagnostics);assert.equal((await state()).mode,'third');
 // Survey every graph node, using the same terrain and collision predicate as runtime.
 const survey=await page.evaluate(async()=>{
 const url=path=>performance.getEntriesByType('resource').findLast(e=>new URL(e.name).pathname==='/endless-earth/src/'+path)?.name??'/endless-earth/src/'+path;
 const geo=await import(url('living/geography.ts')),terrain=await import(url('world/terrain.ts')),g=await import(url('living/graph.mjs'));
 const t=await terrain.fetchTerrain(),valid=p=>geo.validPoint(p,t),graph=g.buildGraph(geo.paths,valid);let best=null;
 for(const n of graph.nodes){const r=g.graphRoute(graph,n.point,valid,Infinity);if(r&&(!best||r.length>best.length))best=r;}
 return {nodes:graph.nodes.length,edges:graph.edges.length,longestFound:best?.length,longestPoints:best?.points};
 });console.log('SURVEY',JSON.stringify({...survey,longestPoints:undefined}));
 for(const [label,delta] of [['near',-10000],['medium',292],['far',10000]]){await page.mouse.move(400,280);await page.mouse.wheel(0,delta);await page.waitForTimeout(1500);await page.screenshot({path:`${dir}/walk-zoom-${label}.png`});}
 assert.equal((await state()).zoom,15);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:280,id:1},{x:400,y:280,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150,y:280,id:1},{x:450,y:280,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
 await page.waitForFunction(()=>window.endlessDiagnostics.zoom<15);assert.ok((await state()).zoom<15,'two pointer pinch zoom');
 const yaw=(await state()).yaw;await page.mouse.move(400,250);await page.mouse.down();await page.mouse.move(600,250);await page.mouse.up();assert.ok(Math.abs((await state()).yaw-yaw)>.5);
 await page.evaluate(()=>{window.walkEvidence={distance:0,frames:0,started:null,ended:null,last:window.endlessDiagnostics.position};const sample=()=>{const e=window.walkEvidence,s=window.endlessDiagnostics;if(s.autoWalk){e.started??=performance.now();e.distance+=Math.hypot(s.position[0]-e.last[0],s.position[2]-e.last[2]);e.frames++;}else if(e.started&&!e.ended){e.distance+=Math.hypot(s.position[0]-e.last[0],s.position[2]-e.last[2]);e.ended=performance.now();}e.last=s.position;requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 await page.locator('#auto-walk').click();assert.equal((await state()).autoWalk,true);
 const start=Date.now(),initial=await state();console.log('INITIAL',JSON.stringify(initial));let last=initial.position,total=0,samples=0;
 while(true){await page.waitForTimeout(1000);const s=await state();if(samples%30===0)console.log('PROGRESS',Math.round((Date.now()-start)/1000),Math.round(total),s.yaw);total+=Math.hypot(s.position[0]-last[0],s.position[2]-last[2]);last=s.position;samples++;if(samples%60===0)await page.screenshot({path:`${dir}/walk-${samples}.png`});if(!s.autoWalk){const evidence=await page.evaluate(()=>window.walkEvidence);assert.deepEqual(s.architecture,initial.architecture,'architecture is generated once for the entire promenade');const frames=await page.evaluate(()=>window.earthFrames);const measurement={cpuFrames:frames,cpuTraceCapped:frames.length===8192,traceScope:'all frames from startup through walk completion, including graph survey and camera checks',architecture:s.architecture,frameMeasuredMetres:evidence.distance,frameMeasuredSeconds:(evidence.ended-evidence.started)/1000,frames:evidence.frames,wallSeconds:(Date.now()-start)/1000,measuredMetres:total,plannedMetres:initial.routeLength,samples,message:s.walkMessage};console.log('COMPLETE',JSON.stringify(measurement));await writeFile(`${dir}/walk.json`,JSON.stringify(measurement,null,2));break;}if(Date.now()-start>1800000)throw new Error('No completion after 30 minutes');}
 for(const mode of ['first','aerial','third']){await page.keyboard.press('v');await page.waitForFunction(mode=>window.endlessDiagnostics.mode===mode,mode);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${dir}/walk-arrivee-mobile.png`});
 console.log('PERF',await page.locator('.perf-panel').innerText());console.log('GPU',await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown';}));
 await writeFile(`${dir}/walk-survey.json`,JSON.stringify(survey,null,2));assert.deepEqual(errors,[]);console.log('PASS Mission07 450m');
}finally{await browser.close();}
