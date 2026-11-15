import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,openBranch24,out} from './lib/mission-24-browser.mjs';
const b=await launch(),results=[];
try{
 for(const [version,port]of [['before',5361],['after',5360]]){
  const {page,errors}=await openBranch24(b,port);
  for(const family of ['spreading','high','pendant','young','needle'])for(const below of [false,true]){
   await page.evaluate(a=>window.b24.setup(...a),[family,1,below]);const pixels=await page.evaluate(()=>window.b24.raster());
   assert.ok(pixels.branchPixels>1000,'branch must actually be rasterized, a blank sky is not proof');assert.equal(pixels.glError,0);
   results.push({version,family,below,...pixels});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 for(const family of ['spreading','high','pendant','young','needle']){
  const find=(version,below)=>results.find(r=>r.version===version&&r.family===family&&r.below===below);
  assert.ok(find('before',true).whitenedFraction>.10,'the pinned baseline must reproduce underside whitening');
  assert.ok(find('after',true).whitenedFraction<.002,'audited underside remains free of white coating');
  assert.ok(find('after',false).whitenedFraction>.10,'upper deposit must remain visible');
  for(const below of [false,true])assert.equal(find('before',below).branchPixels,find('after',below).branchPixels,'silhouette must not change');
 }
 await writeFile(out+'/branch-raster.json',JSON.stringify(results,null,2)+'\n');console.log('Five real branch geometries rasterized above/below: underside error reproduced then removed; upper deposit and silhouettes retained.');
}finally{await b.close()}
