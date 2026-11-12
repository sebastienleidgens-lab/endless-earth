import {launch,openGame,views,settle} from './lib/browser-landmarks.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2]??'after',dir='docs/mission-14-evidence/heritage';await mkdir(`${dir}/${phase}`,{recursive:true});const reference=phase==='after'?JSON.parse(await readFile(`${dir}/before.json`)):null,browser=await launch();
try{
 const game=await openGame(browser,phase==='before'?5179:5173),p=game.page,rows=[];
 const environment=await p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,resolution:[innerWidth,innerHeight]}});
 for(const v of views){
  const pose=reference?.rows.find(r=>r.id===v[0]).state.camera;await p.evaluate(({v,pose})=>window.m14b.setup(v,'balanced',pose),{v,pose});await settle(p);await p.evaluate(()=>window.earthTest.render());const state=await p.evaluate(()=>window.m14b.state());if(pose)assert.ok(state.camera.matrix.every((v,i)=>Math.abs(v-pose.matrix[i])<1e-12));
  await p.screenshot({path:`${dir}/${phase}/${v[0]}.jpg`,type:'jpeg',quality:90});rows.push({id:v[0],station:v,state,referenceCommit:'9bc0a253935518fcbe8e1768f65e9c1dd71e80e5'});console.log(phase,v[0]);
  await writeFile(`${dir}/${phase}.json`,JSON.stringify({phase,startupMs:game.startupMs,environment,rows,errors:game.errors,warnings:game.warnings},null,2)+'\n');
 }
 assert.deepEqual(game.errors,[]);
}finally{await browser.close()}
