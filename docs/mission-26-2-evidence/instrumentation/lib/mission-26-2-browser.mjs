import {chromium} from 'playwright';
import {missionBrowserOptions,missionContextOptions} from './mission-26-browser.mjs';
export async function openMission(port=5397,viewport={width:320,height:210}){
 const browser=await chromium.launch(missionBrowserOptions()),page=await browser.newPage({...missionContextOptions,viewport,deviceScaleFactor:1}),errors=[];
 try{
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://localhost:${port}/endless-earth/?perf=1&evidence=1&fixedResolution=1&spawnSeed=12345`);
 await page.waitForFunction(()=>window.p262,null,{timeout:60000});
 await page.evaluate(()=>{window.p252.profile('eco');window.p252.hold(false);});
 await page.waitForFunction(()=>window.p262.ready()&&window.endlessPlanetDiagnostics.metrics.stream?.loaded>=2&&!window.endlessPlanetDiagnostics.metrics.stream?.active,null,{timeout:240000});
 await page.evaluate(()=>{window.p252.prepare();window.p252.hold(true);});
 return {browser,page,errors};
 }catch(error){await browser.close();throw error;}
}
