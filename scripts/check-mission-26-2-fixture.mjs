import {writeFile} from 'node:fs/promises';
import {openMission} from './lib/mission-26-2-browser.mjs';
const report={errors:[],functionalSuccess:false};let browser,page;
try{({browser,page,errors:report.errors}=await openMission(Number(process.argv[2]??5399)));Object.assign(report,await page.evaluate(()=>window.p262.fixture()));await page.screenshot({path:'docs/mission-26-2-evidence/fixture.png'});await page.evaluate(()=>window.__fixtureCleanup?.());report.functionalSuccess&&=report.errors.length===0;}catch(e){report.failure=String(e);}finally{await writeFile('docs/mission-26-2-evidence/fixture.json',JSON.stringify(report,null,2));await browser?.close();}console.log({success:report.functionalSuccess,failure:report.failure,physicalM:report.physicalM});
