// Native manual movement on the documented bridge. Only the initial test pose
// is placed; W input and heading commands drive the unchanged walking motor.
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('work/mission-14B',{recursive:true});
const observed=JSON.parse(await readFile('work/mission-14B/observations.json')),axis=observed.bridge.axisXZ;
let code=await readFile(new URL('browser-final-walk.mjs',import.meta.url),'utf8');
code=code.replace("port=phase==='before'?5181:5173,out='docs/mission-12-evidence/final'","port=phase==='before'?5179:5173,out='docs/mission-14-evidence/heritage'")
 .replaceAll('work/mission-12D/','work/mission-14B/')
 .replaceAll("from 'playwright'",`from '${import.meta.resolve('playwright')}'`)
 .replace('window.finalWalk={',`window.bridgeControl={place(axis){walker.stop();qualityAuto=false;const p=axis[0];avatar.position.set(p[0],walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(p[0],p[1]),p[1]);viewMode='first';avatar.visible=false;transitionElapsed=1;pitch=.02;this.turn(axis[1])},turn(target){yaw=Math.atan2(avatar.position.x-target[0],avatar.position.z-target[1]);return Math.hypot(avatar.position.x-target[0],avatar.position.z-target[1])}};window.finalWalk={`)
 .replace('valid:validPoint(avatar.position,activeTerrain),auto:',"valid:canWalk(avatar.position.x,avatar.position.z)&&Math.abs(avatar.position.y-walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(avatar.position.x,avatar.position.z))<.001,autoEligible:validPoint(avatar.position,activeTerrain),auto:");
const start=code.indexOf(' await p.evaluate(()=>window.finalWalk.record());await p.locator'),end=code.indexOf(' const file=',start);assert.ok(start>0&&end>start);
code=code.slice(0,start)+`
 const axis=${JSON.stringify(axis)},route={length:${observed.bridge.profile.at(-1)[0]},points:axis,source:'OSM way 647696691; manual native W input, headings from the mapped axis; default AutoWalk eligibility unchanged'};
 await p.evaluate(axis=>window.bridgeControl.place(axis),axis);await p.waitForTimeout(3500);await p.evaluate(()=>{document.activeElement?.blur();window.finalWalk.record()});const start=Date.now();let last,drain=0;
 await p.keyboard.down('w');
 for(const target of axis.slice(1)){
  while(true){
   const distance=await p.evaluate(target=>window.bridgeControl.turn(target),target);if(distance<.32)break;
   await p.waitForTimeout(200);
   if(Date.now()-drain>1500){last=await p.evaluate(()=>window.finalWalk.snapshot());frames.push(...last.frames);delete last.frames;rows.push({seconds:(Date.now()-start)/1000,...last});drain=Date.now();assert.ok(last.state.audio.cacheBytes<=24*1024*1024);if(rows.length%10===0)console.log('bridge seconds',Math.round((Date.now()-start)/1000),'metres',last.metres.toFixed(2));}
   if(Date.now()-start>150000)throw Error('Bridge traversal timed out');
  }
 }
 await p.keyboard.up('w');await p.waitForTimeout(6000);last=await p.evaluate(()=>window.finalWalk.snapshot());frames.push(...last.frames);delete last.frames;rows.push({seconds:(Date.now()-start)/1000,...last});assert.ok(last.metres>80&&last.metres<88,'full mapped bridge traversal');
`+code.slice(end);
code=code.replace('Continuous native game AutoWalk on the default 450 m OSM route, first-person, Eco, 640×360, June afternoon clear. No relocation, speed/time change or replay. Twelve-second rest at the end.', 'Continuous native manual motor on the mapped 83.775 m bridge axis, first-person, Eco, 640×360, June afternoon clear. One initial test pose on the mapped road; W keyboard input and heading commands only during recording. No speed/time change, position replay or relocation. Six-second final rest. Default AutoWalk bridge policy remains unchanged.');
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
process.env.EVIDENCE_DIR='docs/mission-14-evidence/heritage';process.env.NATIVE_VIDEO='work/mission-14B/after-native.webm';await import('./publish-mission-14-evidence.mjs');
