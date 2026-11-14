import {execFileSync} from 'node:child_process';
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,open221} from './lib/mission-22-1-browser.mjs';
import {openWalker} from './lib/mission-15c-browser.mjs';
import {gunzipSync} from 'node:zlib';
const out='docs/mission-23-evidence',browser=await launch(),report={};
try{
 const blockedCase=JSON.parse(gunzipSync(await readFile(out+'/network-trace.json.gz'))).find(r=>r.after.reason?.collider?.points&&r.after.reason?.previous);
 assert.ok(blockedCase);
 const game=await open221(browser,{port:5373,viewport:{width:960,height:600},append:`window.block23=(a,d)=>{const p=new THREE.Vector3(a.x,walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(a.x,a.z),a.z);moveWithCollision(p,d,(x,z)=>activeTerrain.relativeHeight(x,z),false,1);return lastMovementDiagnostic()};`}),p=game.page;
 await p.evaluate(()=>{window.c15.setup(['inspection',-159,116,2.57,.12,5,'third']);window.c15.render()});
 await p.locator('#walk-menu-toggle').click();await p.locator('.menu-diagnostics').evaluate(e=>e.open=true);await p.getByRole('button',{name:'Inspecter le terrain',exact:true}).click();await p.getByLabel('Fermer le menu',{exact:true}).click();await p.locator('canvas').click({position:{x:650,y:480}});await p.locator('#walk-menu-toggle').click();
 const pre=p.locator('.menu-diagnostics pre');await pre.waitFor();const selected=JSON.parse(await pre.innerText());assert.equal(selected.kind,'selected-triangle');assert.equal(selected.vertices.length,3);assert.ok(selected.ground.provenance.surface);
 const saved=p.waitForEvent('download');await p.getByRole('button',{name:'Exporter le diagnostic',exact:true}).click();const download=await saved;await download.saveAs(out+'/diagnostic-export.json');const exported=JSON.parse(await readFile(out+'/diagnostic-export.json'));assert.equal(exported.schema,'endless-earth-local-diagnostic-v1');
 await p.evaluate(row=>{window.c15.setup(['blockage',row.from.x,row.from.z,Math.atan2(row.from.x-row.to.x,row.from.z-row.to.z),.2,4.6,'third']);window.block23(row.from,{x:row.to.x-row.from.x,z:row.to.z-row.from.z})},blockedCase);
 await p.getByRole('button',{name:'Inspecter le dernier blocage',exact:true}).click();const blockage=JSON.parse(await pre.innerText());assert.equal(blockage.kind,'movement');assert.equal(blockage.movement.collider.id,blockedCase.after.reason.collider.id);assert.ok(blockage.movement.previous&&blockage.movement.requested&&blockage.movement.allowed);assert.ok(blockage.movement.speed>0);await writeFile(out+'/diagnostic-blockage.json',JSON.stringify(blockage,null,2)+'\n');
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:out+'/diagnostic-mobile.png'});report.diagnostic={selected:exported,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors:game.errors,warnings:game.warnings};
 report.diagnostic.blockage=blockage;
 await p.close();
 const ordinary=await browser.newPage({viewport:{width:390,height:844}}),ordinaryErrors=[];ordinary.on('pageerror',e=>ordinaryErrors.push(String(e)));await ordinary.goto('http://localhost:5373/endless-earth/?spawnSeed=12345&moment=afternoon');await ordinary.waitForFunction(()=>document.querySelector('#auto-walk')?.disabled===false);await ordinary.locator('#walk-menu-toggle').click();report.ordinary={diagnosticButtons:await ordinary.getByRole('button',{name:'Exporter le diagnostic',exact:true}).count(),diagnosticGlobal:await ordinary.evaluate(()=>typeof window.endlessDiagnostics),overflow:await ordinary.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors:ordinaryErrors};assert.equal(report.ordinary.diagnosticButtons,0);assert.equal(report.ordinary.diagnosticGlobal,'undefined');assert.equal(report.ordinary.overflow,false);assert.deepEqual(ordinaryErrors,[]);await ordinary.close();
 const faulty=await openWalker(browser,5373,{viewport:{width:400,height:260},lighting:false,route:async page=>{await page.route('**/data/angles-ground-truth.json',async route=>{const response=await route.fetch(),m=await response.json();m.groundTruth.baseSurfaceSha256='stale-test-binding';await route.fulfill({response,json:m})})}});
 report.staleRepair={terrain:await faulty.page.evaluate(()=>window.endlessDiagnostics.terrain),warnings:faulty.warnings,errors:faulty.errors};assert.equal(report.staleRepair.terrain.repairCells,0);assert.equal(report.staleRepair.terrain.surface,'integrated');assert.ok(faulty.warnings.some(w=>w.includes('Terrain repair unavailable')));assert.deepEqual(faulty.errors,[]);await faulty.page.close();
 await writeFile(out+'/browser-validation.json',JSON.stringify({sourceCommit,...report},null,2)+'\n');assert.deepEqual(report.diagnostic.errors,[]);assert.equal(report.diagnostic.overflow,false);console.log('PASS diagnostic selection/export, ordinary mobile UI, stale terrain fallback');
}finally{await browser.close()}
