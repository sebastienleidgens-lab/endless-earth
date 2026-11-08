import {chromium} from 'playwright';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const dir='work/architecture-motion';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:800,height:600},recordVideo:{dir,size:{width:800,height:600}}});
 const page=await context.newPage();page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5173/endless-earth/?perf=1');await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);
 await page.addStyleTag({content:'.perf-panel{display:none}'});
 const initial=await page.evaluate(()=>window.endlessDiagnostics.architecture);
 const samples=[];
 const shot=async name=>{await page.waitForTimeout(750);samples.push({name,state:await page.evaluate(()=>window.endlessDiagnostics)});await page.screenshot({path:`${dir}/${name}.png`})};
 await shot('facade-0');
 await page.mouse.move(480,300);await page.mouse.down();for(let i=1;i<=4;i++){await page.mouse.move(480+i*22,300,{steps:4});await shot(`facade-${i}`)}await page.mouse.up();
 await page.getByRole('button',{name:/Forteresse/}).click();await page.waitForTimeout(2500);
 await page.mouse.move(480,300);await page.mouse.down();for(let i=0;i<5;i++){await page.mouse.move(480+i*24,300,{steps:4});await shot(`roof-${i}`)}await page.mouse.up();
 assert.deepEqual(await page.evaluate(()=>window.endlessDiagnostics.architecture),initial);assert.deepEqual(errors,[]);
 const video=page.video();await context.close();await video.saveAs(`${dir}/motion.webm`);await writeFile(`${dir}/samples.json`,JSON.stringify({samples,errors},null,2));console.log('PASS architecture motion: façade and roof orbits, stable generation, ten samples and video; manual visual review required.');
}finally{await browser.close()}
