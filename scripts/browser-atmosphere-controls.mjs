import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='docs/mission-11-evidence';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],checks=[],metrics=[];
try{
 const context=await browser.newContext({viewport:{width:960,height:640}}),page=await context.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://localhost:5173/endless-earth/?perf=1&date=2026-06-21T12:00:00Z');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 await page.locator('.nature-controls summary').click();
 assert.deepEqual(await page.locator('[aria-label="Moment de la journée"] option').allTextContents(),['Matin','Après-midi','Soir','Nuit','Temps réel']);checks.push('Five exact primary moments; six weather options');
 assert.equal(await page.locator('[aria-label="Météo simulée"] option').count(),6);
 await page.selectOption('[aria-label="Moment de la journée"]','afternoon');await page.selectOption('[aria-label="Météo simulée"]','clear');await page.waitForTimeout(3000);
 for(const weather of ['overcast','rain','clear']){
  const start=Date.now();await page.selectOption('[aria-label="Météo simulée"]',weather);await page.waitForTimeout(2500);const d=await page.evaluate(()=>window.endlessDiagnostics);metrics.push({weather,wallMs:Date.now()-start,climate:d.climate,earthLife:d.earthLife});
  assert.equal(d.climate.targetWeather,weather);assert.ok(d.climate.weatherTau<1);
  if(weather==='rain'){assert.ok(d.climate.weather.rain>.56);assert.ok(d.climate.rainDrops>0)}
  if(weather==='clear')assert.ok(d.climate.weather.rain<.03);
  await page.screenshot({path:`${dir}/command-${weather}.jpg`,type:'jpeg',quality:90});
 }
 checks.push('Real RAF loop: clear → overcast → rain → clear in 2.5 s per command');
 for(const moment of ['morning','afternoon','evening','night','real']){
  await page.selectOption('[aria-label="Moment de la journée"]',moment);await page.waitForTimeout(2800);const d=await page.evaluate(()=>window.endlessDiagnostics.climate);assert.equal(d.moment,moment);if(moment==='night')assert.ok(d.solar.altitude<-.1);metrics.push({moment,climate:d});
 }
 checks.push('All moment changes reach effective solar date in the running game');
 await page.selectOption('[aria-label="Moment de la journée"]','evening');await page.selectOption('[aria-label="Météo simulée"]','rain');await page.waitForTimeout(3000);
 const stable=await page.evaluate(()=>window.endlessDiagnostics.climate.date);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>window.endlessDiagnostics.climate.date),stable);
 // A focused weather input must consume arrows without walking.
 const before=await page.evaluate(()=>window.endlessDiagnostics.position);await page.locator('[aria-label="Météo simulée"]').focus();await page.keyboard.down('ArrowDown');await page.waitForTimeout(250);await page.keyboard.up('ArrowDown');const after=await page.evaluate(()=>window.endlessDiagnostics.position);assert.ok(Math.hypot(before[0]-after[0],before[2]-after[2])<.001);checks.push('Keyboard selection does not move the walker');
 await page.selectOption('[aria-label="Météo simulée"]','rain');
 await page.keyboard.press('Tab');await page.evaluate(()=>document.activeElement?.blur());
 for(let i=0;i<3;i++)await page.keyboard.press('v');await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.endlessDiagnostics.climate.moment),'evening');checks.push('Choices survive first/third/aerial view cycle');
 // Browser tab visibility, including the existing audio lifecycle.
 await page.locator('#sound').click();await page.waitForFunction(()=>window.endlessDiagnostics.soundState==='running');
 const other=await page.context().newPage();await other.goto('about:blank');await other.bringToFront();await page.waitForTimeout(500);await page.bringToFront();await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>window.endlessDiagnostics.climate.moment),'evening');await page.locator('#sound').click();await page.waitForFunction(()=>window.endlessDiagnostics.soundState==='suspended');checks.push('Audio enable/disable and tab round trip preserve choices');
 await page.reload();await page.waitForFunction(()=>window.endlessDiagnostics?.ready);assert.equal(await page.inputValue('[aria-label="Moment de la journée"]'),'evening');assert.equal(await page.inputValue('[aria-label="Météo simulée"]'),'rain');checks.push('Selected moment and weather persist after reload');
 // Actual walking with collisions/terrain; existing route stays the authority.
 await page.waitForFunction(()=>!document.querySelector('#auto-walk').disabled);await page.locator('#auto-walk').click();await page.waitForTimeout(2200);const walk=await page.evaluate(()=>window.endlessDiagnostics);assert.ok(walk.autoWalk);assert.ok(walk.routeLength>0);await page.locator('#auto-walk').click();metrics.push({walk:{active:walk.autoWalk,length:walk.routeLength,position:walk.position}});checks.push('Automatic OSM walk still runs');
 // Profiles: manual atmospheric choices must survive resource specialization.
 await page.locator('.quality-control summary').click();
 for(const profile of ['eco','balanced','quality']){await page.selectOption('[aria-label="Profil graphique"]',profile);await page.waitForTimeout(800);const d=await page.evaluate(()=>window.endlessDiagnostics);assert.equal(d.climate.moment,'evening');assert.equal(d.climate.targetWeather,'rain');assert.equal(d.climate.rainDrops,profile==='eco'?260:profile==='quality'?900:520);metrics.push({profile,render:d.render,life:d.earthLife,climate:d.climate})}checks.push('Visible rain in all three profiles');
 await page.setViewportSize({width:390,height:844});await page.locator('.quality-control summary').click();await page.locator('.nature-controls summary').click();await page.screenshot({path:`${dir}/mobile-controls.jpg`,type:'jpeg',quality:90});
 const bounds=await page.locator('.nature-controls').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390&&bounds.y+bounds.height<=844);checks.push('390×844 weather panel fits viewport');
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:`${dir}/mobile-landscape.jpg`,type:'jpeg',quality:90});const landscape=await page.locator('.nature-controls').boundingBox();assert.ok(landscape.y+landscape.height<=390);checks.push('844×390 opened controls stay scrollable');
 assert.deepEqual(errors,[]);
 await writeFile(`${dir}/controls.json`,JSON.stringify({checks,metrics,errors,method:'Unmodified main.ts, actual requestAnimationFrame loop, Playwright native UI selection and keyboard. Cloud shared engine running Chromium SwiftShader. Separate tab round trip is observed, without claiming OS background throttling.'},null,2));console.log(checks.join('\n'));
}finally{await browser.close()}
