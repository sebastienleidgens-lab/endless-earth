// Actual game contexts + the same Web Audio renderer/director. Offline captures
// retain the game's gains (no output normalization). A separate realtime clip
// is recorded by browser-audio-immersive-live.mjs.
import {chromium} from 'playwright';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const phase=process.argv[2]??'after',before=phase==='before',planning=phase==='plan',dir='docs/mission-11-evidence/audio';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
import {immersiveHook as hook} from './lib/audio-immersive-fixture.mjs';
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[],requests=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));await page.addInitScript(()=>window.audioHold=true);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/const updateAtmosphere\s*=\s*naturalSky/,'let updateAtmosphere=naturalSky').replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.audioHold)return;');assert.ok(body.includes('if(window.audioHold)return;'));await route.fulfill({response,body:body+hook})});
 await page.goto(`http://localhost:${before?5177:5173}/endless-earth/?perf=1&moment=real&date=2026-05-10T06:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 assert.deepEqual(requests.filter(r=>r.endsWith('.flac')),[],'No audio before gesture');await page.locator('#sound').click();await page.evaluate(()=>window.immersiveHost.sound.setVolume(0));
 if(planning){await page.evaluate(()=>window.immersiveHost.reset(-150,245,'2026-05-10T06:00:00Z'));const plan=await page.evaluate(()=>window.immersiveHost.route());await writeFile(`${dir}/walk-route.json`,JSON.stringify(plan,null,2));console.log('PLAN',plan.extensionMetres,plan.total,plan.trace.length,plan.trace[0],plan.trace.at(-1));}
 else{
 const plan=JSON.parse(await readFile(`${dir}/walk-route.json`)),walkSeconds=plan.trace.length*.1,duration=2*walkSeconds+30;
 const all=[
 {id:'village',x:-12.277,z:-32.416,date:'2026-05-10T06:00:00Z',weather:'clear',duration:120},
 {id:'forest-spring-morning',x:214.42,z:530.66,date:'2026-05-10T06:00:00Z',weather:'clear',duration:180},
 {id:'forest-summer-afternoon',x:214.42,z:530.66,date:'2026-07-10T13:00:00Z',weather:'clear',duration:120},
 {id:'forest-autumn-evening',x:214.42,z:530.66,date:'2026-10-10T15:30:00Z',weather:'clear',duration:120},
 {id:'forest-winter-day',x:214.42,z:530.66,date:'2026-01-10T11:00:00Z',weather:'clear',duration:120},
 {id:'forest-night',x:214.42,z:530.66,date:'2026-07-10T00:00:00Z',weather:'clear',duration:120},
 {id:'river-bank',x:-150,z:245,date:'2026-05-10T06:00:00Z',weather:'clear',duration:90},
 {id:'river-weir',x:-155,z:180,date:'2026-05-10T06:00:00Z',weather:'clear',duration:90},
 {id:'river-walk',x:plan.trace.at(-1).x,z:plan.trace.at(-1).z,date:'2026-05-10T06:00:00Z',weather:'clear',duration,walk:true},
 {id:'wind-open',x:330,z:-400,date:'2026-07-10T13:00:00Z',weather:'overcast',duration:90,solo:'wind'},
 {id:'foliage',x:214.42,z:530.66,date:'2026-07-10T13:00:00Z',weather:'overcast',duration:90,solo:'foliage'},
 {id:'river-isolated',x:-150,z:245,date:'2026-05-10T06:00:00Z',weather:'clear',duration:90,solo:'water'},
 {id:'birds-isolated',x:214.42,z:530.66,date:'2026-05-10T06:00:00Z',weather:'clear',duration:180,solo:'birds'},
 {id:'village-traffic',x:-12.277,z:-32.416,date:'2026-05-10T10:00:00Z',weather:'clear',duration:660,solo:'traffic'}
 ];
 const scenarios=process.env.AUDIO_SCENES?all.filter(x=>process.env.AUDIO_SCENES.split(',').includes(x.id)):all,rows=[];
 for(const scenario of scenarios){
  const row=await page.evaluate(async ({scenario,plan,walkSeconds})=>{
   const {AcousticRenderer}=await import('/endless-earth/src/audio/renderer.ts'),{SoundDirector,hash}=await import('/endless-earth/src/audio/director.mjs'),{layerMix}=await import('/endless-earth/src/audio/profiles.mjs');
   const original=window.immersiveHost.reset(scenario.x,scenario.z,scenario.date,scenario.weather,scenario.id==='village-traffic'?1.8:0),duration=scenario.duration,c=new OfflineAudioContext(2,Math.ceil(32000*duration),32000),r=new AcousticRenderer(c,'/endless-earth/audio/',73),d=new SoundDirector({seed:hash(scenario.solo==='birds'?'forest-spring-morning':scenario.id)});r.setVolume(.7);
   let state=original,context=state.context;r.listener(context.listener?.position??{...context.position,y:context.position.y+1.65},context.listener?.forward??{x:0,y:0,z:-1},{x:0,y:1,z:0});
   for(const layer of layerMix(context).slice(0,r.budget.beds))for(const id of layer.assets.slice(0,2))await r.resources.request(id);for(const id of d.preload(context,0))await r.resources.request(id);
   const events=[],timeline=[];
   const positionAt=t=>{let i;if(t<walkSeconds)i=plan.trace.length-1-Math.min(plan.trace.length-1,Math.round(t*10));else if(t<walkSeconds+30)i=0;else i=Math.min(plan.trace.length-1,Math.round((t-walkSeconds-30)*10));return plan.trace[i]};
   const update=t=>{if(t)state=window.immersiveHost.at(scenario.walk?positionAt(t):{x:scenario.x,z:scenario.z},.5);context=state.context;r.listener(context.listener?.position??{...context.position,y:context.position.y+1.65},context.listener?.forward??{x:0,y:0,z:-1},{x:0,y:1,z:0});r.updateContext(context);if(scenario.solo)for(const b of r.beds.values())if(scenario.solo==='water'?!b.id.startsWith('water'):b.id!==scenario.solo){b.gain.gain.cancelScheduledValues(c.currentTime);b.gain.gain.value=0}};
   update(0);let next=c.suspend(.5),rendering=c.startRendering();
   for(let t=.5;t<duration;t+=.5){await next;update(t);for(const id of d.preload(context,t))await r.resources.request(id);for(const e of d.tick(context,t)){if(!scenario.solo||scenario.solo==='birds'&&e.id!=='traffic'||scenario.solo==='traffic'&&e.id==='traffic'){const played=r.event(e);events.push({...e,time:t,played})}}if(t%5===0)timeline.push({time:t,position:context.position,water:context.water,weather:context.weather,valid:state.valid,localHour:context.localHour,season:context.season,stats:r.stats()});if(t+.5<duration)next=c.suspend(t+.5);await c.resume()}
   const buffer=await rendering,channels=[buffer.getChannelData(0),buffer.getChannelData(1)],bytes=new Uint8Array(44+buffer.length*4),view=new DataView(bytes.buffer),str=(o,s)=>[...s].forEach((ch,i)=>view.setUint8(o+i,ch.charCodeAt(0)));str(0,'RIFF');view.setUint32(4,bytes.length-8,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,32000,true);view.setUint32(28,128000,true);view.setUint16(32,4,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,buffer.length*4,true);let peak=0,power=0,clipped=0;const seconds=[];
   for(let i=0;i<buffer.length;i++)for(let ch=0;ch<2;ch++){const x=channels[ch][i];peak=Math.max(peak,Math.abs(x));power+=x*x;clipped+=Number(Math.abs(x)>=.999);view.setInt16(44+i*4+ch*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true)}for(let t=0;t<Math.floor(duration);t++){let sum=0;for(let i=t*32000;i<(t+1)*32000;i++)sum+=(channels[0][i]**2+channels[1][i]**2)/2;seconds.push(10*Math.log10(sum/32000||1e-15))}
   let bin='';for(let i=0;i<bytes.length;i+=16000)bin+=String.fromCharCode(...bytes.subarray(i,i+16000));const stats=r.stats();r.dispose();return {scenario,original,timeline,events,stats,signal:{peak,rms:Math.sqrt(power/(buffer.length*2)),clipped,secondsDbFS:seconds},wav:btoa(bin)};
  },{scenario,plan,walkSeconds});
  const wav=`work/mission-11-b/renders/${phase}-${scenario.id}.wav`;await writeFile(wav,Buffer.from(row.wav,'base64'));delete row.wav;execFileSync('ffmpeg',['-y','-v','error','-i',wav,'-c:a','libopus','-b:a','96k',`${dir}/${phase}-${scenario.id}.ogg`]);assert.equal(row.signal.clipped,0);assert.ok(row.stats.peakVoices<=12);assert.ok(row.stats.peakBytes<=24*1024*1024);rows.push(row);await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,base:before?'dbafd13':'working B',method:'Actual pilot contexts from Soundscape on loaded IGN/OSM terrain. Same AcousticRenderer and SoundDirector in OfflineAudioContext, warm cache, master .7, no output normalization. Wind/time/weather sampled from the game at every 0.5 s replay step. Walk uses collision-validated AutoWalk trace, not a realtime capture. Source files are real licensed recordings; owner listening pending.',rows,errors},null,2));console.log('AUDIO',phase,scenario.id,'rms',row.signal.rms.toFixed(6),'played',row.events.filter(e=>e.played).length,'cache',row.stats.peakBytes);
 }
 assert.deepEqual(errors,[]);
 }
}finally{await browser.close()}
