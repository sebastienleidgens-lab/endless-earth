import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {launch,open221} from './lib/mission-22-1-browser.mjs';
export const stations=[
 ['pont',-177,143,2.57,.1,7,'third'],['rue-du-pont',-159,116,2.57,.1,5,'third'],
 ['rue-facade',-55,70,.85,-.05,0,'first'],['foret',-426.723088216,346.512916,.785,.12,5,'third'],
 ['berge',-307.7,94.3,-1.515,-.05,5,'third'],['pente',-520,440,.65,-.12,5,'third'],
 ['chateau',-63,190,.2,.28,60,'aerial'],['talus',-23,223,.6,.3,55,'aerial'],
 ['relief-nord-ouest',-660,-560,.7,.3,65,'aerial'],['raccord',-161,108,.8,.12,6,'third'],
 ['objets',-205,30,.65,.12,8,'third'],['vallee',-100,155,.5,.5,210,'aerial']
];
if(process.argv[1]?.endsWith('capture-mission-23.mjs')){
 const version=process.argv[2]??'after',out='docs/mission-23-evidence',rows=[],browser=await launch();await mkdir(out+'/'+version,{recursive:true});
 try{
  const g=await open221(browser,{port:version==='before'?5371:5373,viewport:{width:960,height:600},query:''}),p=g.page;
  const ref=version==='after'?JSON.parse(await readFile(out+'/before.json')).rows:[];
  for(const station of stations)for(const snow of [false,true]){
   const name=station[0]+(snow?'-neige':'-sec');
   await p.evaluate(({station,snow})=>{window.c15.setup(station,'balanced','2026-01-15',snow?'snow':'clear');window.m21.date('2026-01-15T13:00Z');dispatchEvent(new CustomEvent('snow-test-cover',{detail:{cover:snow?1:0}}));window.m21.settle(120)},{station,snow});
   for(let i=0;i<45;i++){await p.evaluate(()=>window.c15.tick());await p.waitForTimeout(15)}
   const reference=ref.find(r=>r.name===name);if(reference)await p.evaluate(pose=>window.m221.matchCamera(pose),reference.state.camera);
   await p.evaluate(()=>window.c15.render());await p.screenshot({path:out+'/'+version+'/'+name+'.png'});
   rows.push({name,station,snow,state:await p.evaluate(()=>window.c15.snapshot()),ground:await p.evaluate(([x,z])=>window.endlessDiagnostics.inspectGround(x,z),station.slice(1,3))});console.log(version,name);
  }
  await writeFile(out+'/'+version+'.json',JSON.stringify({version,sourceCommit:version==='before'?'6b17ce324319716cb15859d2195bd5362f603fbe':execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Native engine control scenes derived from geographic data; these are not the missing owner screenshot locations. Matched January camera/time/profile/resolution, snow off/on. No image retouching.',rows,errors:g.errors,warnings:g.warnings,environment:g.environment},null,2)+'\n');
 }finally{await browser.close()}
}
