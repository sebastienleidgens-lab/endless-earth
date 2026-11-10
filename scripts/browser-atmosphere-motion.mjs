import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {injection} from './lib/browser-road-fixture.mjs';
await mkdir('work/m11-motion',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[],timeline=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+injection})});
 await page.goto('http://localhost:5173/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled,{timeout:180000});
 await page.evaluate(()=>window.earthTest.setup(['quality',-150,245,-1.1,-.15,0,'first']));await page.waitForTimeout(3000);
 await page.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.joystick,.help,#app>button{visibility:hidden}'});await page.locator('.nature-controls summary').click();
 const start=Date.now();let action=0,i=0;const commands=[{at:4,weather:'overcast'},{at:8,weather:'rain'},{at:13,moment:'night'},{at:18,moment:'morning',weather:'clear'}];
 while(Date.now()-start<24000){
  const elapsed=(Date.now()-start)/1000;
  if(commands[action]&&elapsed>=commands[action].at){const c=commands[action++];if(c.weather)await page.selectOption('[aria-label="Météo simulée"]',c.weather);if(c.moment)await page.selectOption('[aria-label="Moment de la journée"]',c.moment);timeline.push({elapsed,command:c})}
  const time=(Date.now()-start)/1000;await page.screenshot({path:`work/m11-motion/${String(i++).padStart(4,'0')}.jpg`,type:'jpeg',quality:85});timeline.push({frame:i-1,elapsed:time,climate:await page.evaluate(()=>window.endlessDiagnostics.climate)});await page.waitForTimeout(320);
 }
 const frames=timeline.filter(x=>'frame'in x);let concat='';for(let j=0;j<frames.length;j++){concat+=`file '${String(frames[j].frame).padStart(4,'0')}.jpg'\nduration ${j+1<frames.length?frames[j+1].elapsed-frames[j].elapsed:.5}\n`}concat+=`file '${String(frames.at(-1).frame).padStart(4,'0')}.jpg'\n`;await writeFile('work/m11-motion/frames.txt',concat);
 execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i','work/m11-motion/frames.txt','-fps_mode','vfr','-c:v','libx264','-pix_fmt','yuv420p','-crf','24','-movflags','+faststart','docs/mission-11-evidence/atmosphere-transition.mp4']);
 assert.deepEqual(errors,[]);await writeFile('docs/mission-11-evidence/motion.json',JSON.stringify({timeline,errors,method:'Actual RAF loop, fixed geographic camera. Screenshots spaced by real wall time (recorded timestamps preserved in variable-frame-rate MP4). Commands change through the live UI. Approximately 24 seconds, reduced capture rate under SwiftShader; no simulation speed-up, sound disabled, no audio review claimed.'},null,2));console.log('Recorded',frames.length,'real-time frames');
}finally{await browser.close()}
