// Native canvas + post-limiter audio recording. Actual wall time and RAF; no replay.
import {chromium} from 'playwright';
import {writeFile,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const phase=process.argv[2]??'after',port=phase==='before'?5178:5173,out='docs/mission-12-evidence/nature';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],rows=[];
try{
 const p=await b.newPage({viewport:{width:800,height:600}});p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replaceAll(/renderer\.render\(scene,\s*camera\);/g,'renderer.render(scene,camera);window.artWalk?.capture();');await route.fulfill({response,body:body+`
 window.artWalk={frames:[],capture(){if(!this.rec)return;const r=this.rec;r.ctx.drawImage(renderer.domElement,0,0);r.track.requestFrame();this.frames.push({ms:performance.now(),position:avatar.position.toArray(),auto:walker.active,wind:{...scene.userData.earthLife?.wind},weather:scene.userData.climate?.targetWeather,valid:validPoint(avatar.position,activeTerrain),camera:camera.position.toArray()})},record(){this.frames=[];const canvas=document.createElement('canvas');canvas.width=800;canvas.height=600;const ctx=canvas.getContext('2d'),track=canvas.captureStream(0).getVideoTracks()[0],destination=sound.context.createMediaStreamDestination();sound.renderer.limiter.connect(destination);const stream=new MediaStream([track,...destination.stream.getAudioTracks()]),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus',videoBitsPerSecond:1300000,audioBitsPerSecond:96000});this.rec={canvas,ctx,track,destination,stream,chunks,recorder};recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.start(1000)},async stop(){const r=this.rec;await new Promise(resolve=>{r.recorder.onstop=resolve;r.recorder.stop()});sound.renderer.limiter.disconnect(r.destination);r.stream.getTracks().forEach(t=>t.stop());this.rec=null;const bytes=new Uint8Array(await new Blob(r.chunks,{type:'video/webm'}).arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=16000)text+=String.fromCharCode(...bytes.subarray(i,i+16000));return {base64:btoa(text),frames:this.frames}},forest(){walker.stop();setViewMode('first');avatar.position.set(-432,activeTerrain.relativeHeight(-432,351),351);yaw=.5;pitch=-.35;eyeHeight=undefined;return validPoint(avatar.position,activeTerrain)},village(){walker.stop();avatar.position.set(-12.277392682727118,activeTerrain.relativeHeight(-12.277392682727118,-32.416383999943434),-32.416383999943434);yaw=.65;pitch=.12;eyeHeight=undefined;},state(){return {position:avatar.position.toArray(),climate:scene.userData.climate,audio:sound.stats(),auto:walker.active}}};`})});
 await p.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);await p.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);console.log('READY',phase);
 await p.locator('.quality-control summary').click();await p.selectOption('[aria-label="Profil graphique"]','balanced');await p.locator('.quality-control summary').click();
 await p.evaluate(()=>document.activeElement?.blur());await p.keyboard.press('v');await p.waitForFunction(()=>window.endlessDiagnostics.mode==='first');await p.locator('#sound').click();await p.waitForFunction(()=>window.endlessDiagnostics.soundState==='running');await p.waitForTimeout(2000);console.log('RECORDING',phase);
 const save=async name=>{
  const result=await p.evaluate(()=>window.artWalk.stop());const file=out+'/'+phase+'-'+name+'.webm';await writeFile(file,Buffer.from(result.base64,'base64'));
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',file,'-c','copy',file+'.seek.webm']);await rename(file+'.seek.webm',file);
  const frames=result.frames;let metres=0;for(let i=1;i<frames.length;i++)metres+=Math.hypot(frames[i].position[0]-frames[i-1].position[0],frames[i].position[2]-frames[i-1].position[2]);
  const state=await p.evaluate(()=>window.artWalk.state());assert.ok(frames.length>20);assert.ok(frames.every(f=>f.valid));
  if(name==='promenade'){assert.ok(metres>12);assert.ok(frames.some(f=>f.auto));}
  assert.ok(state.audio.voices<=state.audio.budget.voices&&state.audio.cacheBytes<=24*1024*1024);
  rows.push({name,wallSeconds:(frames.at(-1).ms-frames[0].ms)/1000,metres,frameCount:frames.length,frames,state});console.log(phase,name,metres,frames.length);
 };
 assert.ok(await p.evaluate(()=>window.artWalk.forest()));await p.waitForTimeout(4500);
 await p.locator('.nature-controls summary').click();await p.evaluate(()=>window.artWalk.record());
 for(const weather of ['clear','cloudy','storm']){await p.selectOption('[aria-label="Météo simulée"]',weather);await p.waitForTimeout(11000)}
 await save('vent');
 if(phase==='after'){
  await p.selectOption('[aria-label="Météo simulée"]','clear');await p.evaluate(()=>window.artWalk.village());await p.waitForTimeout(4500);
  await p.evaluate(()=>window.artWalk.record());await p.locator('#auto-walk').click();await p.waitForTimeout(32000);await p.locator('#auto-walk').click();await save('promenade');
 }
 await p.locator('#sound').click();await p.waitForFunction(()=>window.endlessDiagnostics.soundState==='suspended');
 assert.deepEqual(errors,[]);await writeFile(out+'/'+phase+'-motion.json',JSON.stringify({phase,method:'Native MediaRecorder VP8/Opus. Canvas frames captured immediately after actual WebGL render; original realtime post-limiter game sound, no gain change or normalization. Stationary woodland inspection at a collision-valid diagnostic pose, clear/cloudy/storm via ordinary weather controls for 11 seconds each. Separate after-only ordinary automatic OSM village walk, 32 seconds. 800×600 balanced, no simulation speed-up or claimed continuous walking connection between stations. Frames retain their actual timestamps; SwiftShader, not physical GPU performance.',rows,errors},null,2));
}finally{await b.close()}
