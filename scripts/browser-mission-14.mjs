import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,openGame,views,settle} from './lib/mission-14-browser.mjs';
const phase=process.argv[2]??'after',dir='docs/mission-14-evidence';await mkdir(`${dir}/${phase}`,{recursive:true});
const reference=phase==='after'?JSON.parse(await readFile(`${dir}/before.json`)):null;
const browser=await launch();
try{
 const game=await openGame(browser,phase==='before'?5177:5173),{page}=game,rows=[];
 for(const station of views.filter(v=>!process.env.TEST_VIEWS||process.env.TEST_VIEWS.split(',').includes(v[0]))){
  const pose=reference?.rows.find(r=>r.id===station[0]).state.camera;
  await page.evaluate(({station,pose})=>window.m14.setup(station,'balanced',pose),{station,pose});await settle(page);await page.evaluate(()=>window.earthTest.render());
  const state=await page.evaluate(()=>window.m14.state());if(pose){assert.deepEqual(state.camera.position,pose.position);assert.equal(state.camera.fov,pose.fov);assert.ok(state.camera.matrix.every((v,i)=>Math.abs(v-pose.matrix[i])<1e-12));}
  const samples=[];for(let i=0;i<3;i++)samples.push(await page.evaluate(()=>{const start=performance.now();return {...window.earthTest.render(),ms:performance.now()-start}}));
  await page.screenshot({path:`${dir}/${phase}/${station[0]}.jpg`,type:'jpeg',quality:90});
  rows.push({id:station[0],station,state,samples,sources:['IGN LiDAR HD MNT / IGN69, acquisition 2023-04-09','IGN/ASP normalized environment','OSM excerpt 2026-11-08'],referenceCommit:'03d963fb1afeea9e2f209800748bfde5d1fab5f8'});
  await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,environment:game.environment,startupMs:game.startupMs,rows,errors:game.errors,warnings:game.warnings},null,2)+'\n');console.log(phase,station[0]);
 }
 assert.deepEqual(game.errors,[]);
}finally{await browser.close()}
