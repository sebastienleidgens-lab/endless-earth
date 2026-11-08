import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('work/visual/final',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:800,height:600},recordVideo:{dir:'work/visual/final',size:{width:800,height:600}}});
 const page=await context.newPage();page.setDefaultTimeout(60000);const errors=[],positions=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5173/endless-earth/?perf=1');await page.waitForFunction(()=>window.endlessDiagnostics?.ready);
 await page.addStyleTag({content:'.perf-panel{display:none!important}'});
 await page.keyboard.press('v');await page.waitForFunction(()=>window.endlessDiagnostics.mode==='first');await page.waitForTimeout(1500);
 await page.mouse.move(500,360);await page.mouse.down();await page.mouse.move(610,160,{steps:15});await page.mouse.up();
 await page.keyboard.down('d');
 for(let i=0;i<5;i++){await page.waitForTimeout(600);await page.screenshot({path:`work/visual/final/clouds-${i}.png`});positions.push(await page.evaluate(()=>window.endlessDiagnostics.position));}
 await page.keyboard.up('d');await page.keyboard.press('v');
 await page.getByRole('button',{name:/Forteresse/}).click();await page.waitForTimeout(1500);
 await page.mouse.move(520,340);await page.mouse.down();
 for(let i=0;i<5;i++){await page.mouse.move(520+i*25,340,{steps:4});await page.waitForTimeout(600);await page.screenshot({path:`work/visual/final/trees-${i}.png`});}
 await page.mouse.up();
 assert.notDeepEqual(positions[0],positions.at(-1),'cloud sequence includes player displacement');
 assert.deepEqual(errors,[]);await writeFile('work/visual/final/positions.json',JSON.stringify(positions,null,2));
 console.log('Visual sequences recorded: sky during walking and vegetation during camera orbit; manual inspection required.');
 console.log('VIDEO',await page.video().path());await context.close();
}finally{await browser.close();}
