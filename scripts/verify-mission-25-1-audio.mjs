import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch} from './lib/mission-24-browser.mjs';
const browser=await launch();
try{
 const page=await browser.newPage();
 await page.route('**/audio251.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Offline audio contract fixture</title>'}));
 await page.goto('http://localhost:5367/endless-earth/audio251.html');
 const result=await page.evaluate(async()=>{
  const {AcousticRenderer}=await import('/endless-earth/src/audio/renderer.ts');
  const c=new OfflineAudioContext(2,32000*3,32000),r=new AcousticRenderer(c,'/endless-earth/audio/',20);r.setProfile('eco');r.setVolume(1,true);r.listener({x:0,y:0,z:0},{x:0,y:0,z:-1},{x:0,y:1,z:0});
  const a=r.waterContact({id:1,kind:'stroke',position:{x:-3,y:0,z:-2}}),b=r.waterContact({id:2,kind:'paddle',position:{x:3,y:0,z:-2}}),duplicate=r.waterContact({id:2,kind:'paddle',position:{x:3,y:0,z:-2}});
  const stats=r.stats(),positions=stats.activeSources.map(v=>v.position),models=stats.activeSources.map(v=>v.panningModel);
  const buffer=await c.startRendering();const L=buffer.getChannelData(0),R=buffer.getChannelData(1);let l=0,rr=0,diff=0,peak=0;for(let i=0;i<L.length;i++){l+=L[i]**2;rr+=R[i]**2;diff+=(L[i]-R[i])**2;peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}
  const levels={rms:[Math.sqrt(l/L.length),Math.sqrt(rr/L.length)],differenceRms:Math.sqrt(diff/L.length),peak};r.dispose();return {a,b,duplicate,stats,models,positions,levels,after:r.stats()};
 });
 assert.ok(result.a&&result.b&&!result.duplicate);assert.equal(result.stats.waterContacts,2);assert.equal(result.stats.hrtf,1);assert.ok(result.models.includes('HRTF')&&result.models.includes('equalpower'));assert.ok(result.levels.differenceRms>0);assert.ok(result.levels.rms.every(v=>v>0));assert.equal(result.after.nodes,0);assert.equal(result.after.voices,0);assert.equal(result.after.waterBufferBytes,0);
 await writeFile('docs/mission-25-1-evidence/audio-contract.json',JSON.stringify({method:'OfflineAudioContext technical fixture using the production AcousticRenderer, explicitly synthetic positions. Proves bounded HRTF/equalpower fallback, unique contacts, audible stereo samples and disposal; not native pilot evidence.',result},null,2));console.log('PASS original water foley, stereo spatial fallback, one event per contact, disposal');
}finally{await browser.close()}
