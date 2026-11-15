import{execFileSync}from'node:child_process';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
for(const [root,out]of[['.','work/mission-25-2/compiled'],['work/mission-25-2/reference','work/mission-25-2/reference-compiled']])execFileSync(process.execPath,['scripts/build-mission-25-2.mjs',root,out],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const [version,port]of [['before',5373],['after',5372]]){
 const page=await browser.newPage({viewport:{width:640,height:480}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://localhost:'+port+'/endless-earth/?perf=1&evidence=1&spawnSeed=12345&date=2026-06-21T12:00:00Z&moment=afternoon');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&window.p252);
 const states=[];for(const [angle,yaw]of [['face',0],['profile',Math.PI/2],['rear',Math.PI]]){states.push(await page.evaluate(v=>window.p252.setup(v),{x:-620,z:-300,yaw,heading:0,zoom:1.8}));await page.evaluate(()=>window.p252.render());await page.screenshot({path:'docs/mission-25-2-evidence/'+version+'-'+angle+'.png'});}
 await page.evaluate(()=>window.p252.hold(false));await page.keyboard.down('Shift');await page.keyboard.down('w');await page.waitForTimeout(5000);await page.keyboard.up('w');await page.keyboard.up('Shift');await page.screenshot({path:'docs/mission-25-2-evidence/'+version+'-running.png'});const inspection={labels:['face','profile','rear'],states,errors,last:await page.evaluate(()=>window.p252.state())};await writeFile('work/mission-25-2/inspection-'+version+'.json',JSON.stringify(inspection,null,2));await writeFile('docs/mission-25-2-evidence/portraits-'+version+'.json',JSON.stringify(inspection,null,2));await page.close();
}}finally{await browser.close()}
