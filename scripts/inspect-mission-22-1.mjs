import {writeFile} from 'node:fs/promises';
import {launch,open221,out,stations} from './lib/mission-22-1-browser.mjs';
const browser=await launch();
try{
 const game=await open221(browser,{append:`window.inspect221Axis=()=>{const p=activeTerrain.landmarks.objects.find(o=>o.id==='pont').parts[1].position,offset=Math.floor((p.length-15*8)/(15*8)/2)*15*8;const r=activeTerrain.singleSurface.manifest.walkCorrection.profiles[0];return [{name:'axe-tablier-source',x:p[offset+6],z:p[offset+8]},{name:'axe-rue-du-pont-source',x:(r.a.x+r.b.x)/2,z:(r.a.z+r.b.z)/2}]};`}),page=game.page;
 const rest=await page.evaluate(()=>window.endlessDiagnostics.publicRest);
 await writeFile(out+'/public-rest.json',JSON.stringify({sourceCommit:'91f0f8c6e87874d636cdd164be58ff40984e2587',method:'Actual loaded production-engine admission audit. Published POIs document public usage, not surveyed furniture or parcel boundaries. Interior garden approach is inferred and not a public OSM road.',audit:rest,errors:game.errors},null,2)+'\n');
 const rows=[];
 for(const [name,x,z]of stations.filter(s=>s[0]!=='vallee')){
  await page.evaluate(s=>window.c15.setup(s,'balanced'),stations.find(s=>s[0]===name));
  rows.push({name,...await page.evaluate(([x,z])=>window.endlessDiagnostics.inspectGround(x,z),[x,z])});
 }
 const axis=await page.evaluate(()=>window.inspect221Axis());
 for(const s of axis){await page.evaluate(s=>window.c15.setup([s.name,s.x,s.z,0,.1,5,'third'],'balanced'),s);rows.push({name:s.name,...await page.evaluate(s=>window.endlessDiagnostics.inspectGround(s.x,s.z),s)});}
 await writeFile(out+'/ground-inspection.json',JSON.stringify({sourceCommit:'91f0f8c6e87874d636cdd164be58ff40984e2587',method:'On-demand rendered terrain/deck downward ray versus exact production walking support at named control stations. Sample positions derived from source map, not the owner screenshots. Null rendered hits outside streamed visible tiles are retained, not converted to success. This is a bounded audit, not a territory-wide survey.',rows,errors:game.errors,warnings:game.warnings},null,2)+'\n');
 console.log('INSPECT',rest,rows.map(r=>({name:r.name,differenceM:r.differenceM,slope:r.slope})));
}finally{await browser.close()}
