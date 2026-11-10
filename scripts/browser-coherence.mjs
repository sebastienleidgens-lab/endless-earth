import {chromium} from 'playwright';import {writeFile,mkdir,rename} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import {coherenceHook} from './lib/coherence-fixture.mjs';
const mode=process.argv[2]??'after',before=mode==='before',record=mode==='record',dir='docs/mission-11-evidence/coherence';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],rows=[],commands=[];
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();const body=(await response.text()).replaceAll(/renderer\.render\(scene,\s*camera\);/g,'renderer.render(scene,camera);window.coherenceHost?.capture();');await route.fulfill({response,body:body+coherenceHook})});
 await page.goto(`http://localhost:${before?5178:5173}/endless-earth/?perf=1&moment=morning&weather=clear&date=2026-05-10T06:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);await page.evaluate(()=>window.coherenceHost.setup());
 await page.locator('.nature-controls summary').click();await page.locator('#sound').click();await page.waitForFunction(()=>window.endlessDiagnostics.soundState==='running');await page.waitForTimeout(3000);
 const take=async(label)=>{const row=await page.evaluate(label=>{window.coherenceHost.label=label;return window.coherenceHost.sample()},label);rows.push(row);return row};
 const choose=async(label,moment,weather,seconds,real=false)=>{
  const start=await take(label);commands.push({label,moment,weather,wallMs:start.wallMs,frame:start.frames,audioTime:start.audioTime,real});
  if(real)await page.evaluate(()=>dispatchEvent(new CustomEvent('nature-test-date',{detail:null})));
  await page.selectOption('[aria-label="Moment de la journée"]',moment);await page.selectOption('[aria-label="Météo simulée"]',weather);await page.evaluate(()=>document.activeElement?.blur());
  const end=Date.now()+seconds*1000;while(Date.now()<end){await page.waitForTimeout(450);await take(label)}
  const row=await take(label);await page.screenshot({path:`${dir}/${record?'live':mode}-${label}.jpg`,type:'jpeg',quality:90});
  console.log(label,'frames',row.frames,'wind',row.environment.wind.speed.toFixed(3),'rain',row.environment.weather.rain.toFixed(3),'birds',row.audio.heardBirds,'layers',row.audio.layers?.map(l=>l.id).join(','));
  if(!before){assert.ok(row.sharedObject&&row.weatherReference);assert.equal(row.audio.worldTimeMs,row.environment.worldTimeMs);assert.equal(row.audio.localHour,row.environment.localHour);assert.equal(row.audio.weather.wind,row.environment.wind.speed);assert.deepEqual(row.uniforms.wind,[row.environment.wind.x,row.environment.wind.z]);assert.deepEqual(row.camera,row.rainCamera);assert.deepEqual(row.camera,[row.listener.x,row.listener.y,row.listener.z]);assert.equal(row.starUniform,row.environment.starVisibility);assert.ok(row.audio.voices<=row.audio.budget.voices&&row.audio.hrtf<=row.audio.budget.hrtf&&row.audio.cacheBytes<=24*1024*1024);if(weather==='clear')assert.ok(row.environment.weather.rain<.005&&!row.rain.visible);if(weather==='rain'||weather==='storm'){assert.ok(row.rain.visible);assert.ok(row.audio.layers.some(l=>l.id==='rain'&&l.actualBusGain>.15));assert.equal(row.starUniform,0)}if(moment==='night'){assert.ok(row.environment.solar.altitude<0);assert.ok(row.audio.activeSources.every(v=>!v.asset.startsWith('bird-')))}if(real){assert.ok(Math.abs(row.environment.worldTimeMs-row.wallMs)<1000);const hour=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hourCycle:'h23',hour:'2-digit',minute:'2-digit'}).format(row.wallMs);assert.ok(Math.abs(row.audio.localHour-(Number(hour.slice(0,2))+Number(hour.slice(3,5))/60))<.02)}}
  await writeFile(`${dir}/${record?'realtime':mode}.json`,JSON.stringify({mode,method:'Actual running game with WebGL submission and native UI choices. Inspection hook only exposes references and captures the rendered canvas plus post-limiter realtime AudioContext. No forced bird, gust, gain or animation clock. Fixed mapped forest station; May 10 reference until explicit true realtime return. SwiftShader software GPU; capture is not a physical GPU performance claim.',commands,rows,errors},null,2));
 };
 if(record)await page.evaluate(()=>window.coherenceHost.record());
 await choose('matin-ensoleille','morning','clear',record?65:6);
 await choose('apres-midi-venteux','afternoon','overcast',record?35:6);
 await choose('soir-pluvieux','evening','rain',record?30:6);
 await choose('nuit-claire','night','clear',record?25:6);
 await choose('nuit-orageuse','night','storm',record?40:6);
 await choose('retour-matin-calme','morning','clear',record?20:6);
 if(!before)await choose('temps-reel','real','clear',record?12:6,true);
 if(record){const data=await page.evaluate(()=>window.coherenceHost.stop());await writeFile(`${dir}/ambiances.webm`,Buffer.from(data,'base64'));execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',`${dir}/ambiances.webm`,'-c','copy',`${dir}/ambiances-seekable.webm`]);await rename(`${dir}/ambiances-seekable.webm`,`${dir}/ambiances.webm`)}
 assert.deepEqual(errors,[]);console.log('PASS',mode,rows.length,'observations');
}finally{await browser.close()}
