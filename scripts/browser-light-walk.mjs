// Native manual movement on the documented bridge. Only the initial test pose
// is placed; W input and heading commands drive the unchanged walking motor.
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('work/mission-14C',{recursive:true});
const forest=process.argv[2]==='forest',osm=JSON.parse(await readFile('public/data/angles-osm.geojson')),axis=osm.features.find(f=>f.properties?.osm_id===647696691).geometry.coordinates.map(([lon,lat])=>[(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),-(lat-46.6953)*111320]);const length=axis.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-axis[i][0],p[1]-axis[i][1]),0),observed={bridge:{axisXZ:axis,profile:[[length]]}};
let code=await readFile(new URL('browser-final-walk.mjs',import.meta.url),'utf8');
code=code.replace("port=phase==='before'?5181:5173,out='docs/mission-12-evidence/final'","port=phase==='before'?5181:5173,out='docs/mission-14-evidence/light'")
 .replaceAll('work/mission-12D/','work/mission-14C/')
 .replaceAll("from 'playwright'",`from '${import.meta.resolve('playwright')}'`)
 .replace('window.finalWalk={',`window.bridgeControl={place(axis){walker.stop();qualityAuto=false;const p=axis[0];avatar.position.set(p[0],walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(p[0],p[1]),p[1]);viewMode='first';avatar.visible=false;transitionElapsed=1;pitch=.02;this.turn(axis[1])},turn(target){yaw=Math.atan2(avatar.position.x-target[0],avatar.position.z-target[1]);return Math.hypot(avatar.position.x-target[0],avatar.position.z-target[1])}};window.finalWalk={`)
 .replace('valid:validPoint(avatar.position,activeTerrain),auto:',"valid:canWalk(avatar.position.x,avatar.position.z)&&Math.abs(avatar.position.y-walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(avatar.position.x,avatar.position.z))<.001,autoEligible:validPoint(avatar.position,activeTerrain),auto:");
code=code.replace("p.selectOption('[aria-label=\"Profil graphique\"]','eco')","p.selectOption('[aria-label=\"Profil graphique\"]','balanced')")
 .replace('state:window.endlessDiagnostics,','state:{...window.endlessDiagnostics,lighting:{...scene.userData.landscapeLighting}},')
 .replace('calls:renderer.info.render.calls,','lighting:{...scene.userData.landscapeLighting},calls:renderer.info.render.calls,')
 .replace('window.finalWalk={','window.finalWalk={lightingReady(){return scene.userData.landscapeLighting?.state===\"ready\"},')
 .replace(' const cdp=', ' await p.waitForFunction(()=>window.finalWalk.lightingReady());const cdp=');
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
code=code.replace('Per-frame data drained to Node every five seconds','Per-frame data drained to Node at most every two seconds');
code=code.replace('Continuous native game AutoWalk on the default 450 m OSM route, first-person, Eco, 640×360, June afternoon clear. No relocation, speed/time change or replay. Twelve-second rest at the end.', 'Continuous native manual motor on the mapped 83.775 m bridge axis, first-person, Balanced, 640×360, June afternoon clear. One initial test pose on the mapped road; W keyboard input and heading commands only during recording. No speed/time change, position replay or relocation. Six-second final rest. Default AutoWalk bridge policy remains unchanged.');
if(forest){
 const a=code.indexOf('\n const axis='),b=code.indexOf(' const file=',a);assert.ok(a>0&&b>a);
 code=code.slice(0,a)+`
 const axis=[[-426.72308821603656,346.51291632745415],[-427.4302,345.8058]],route={length:0,points:[axis[0]],source:'Separate stationary forest inspection, same existing accessible station; no route connection asserted'};
 await p.evaluate(axis=>window.bridgeControl.place(axis),axis);await p.waitForTimeout(3500);await p.evaluate(()=>{document.activeElement?.blur();window.finalWalk.record()});const start=Date.now();let last;
 for(let i=0;i<11;i++){await p.waitForTimeout(2000);last=await p.evaluate(()=>window.finalWalk.snapshot());frames.push(...last.frames);delete last.frames;rows.push({seconds:(Date.now()-start)/1000,...last})}
 assert.ok(last.metres<.01,'stationary inspection must not drift');
 `+code.slice(b);
 code=code.replace(/Continuous native manual motor on the mapped 83\.775 m bridge axis.*?unchanged\./,'Stationary native forest inspection, 22 seconds, first-person Balanced 640×360, June afternoon clear. One initial diagnostic pose at the existing forest station, no movement or clock change. Separate from the bridge route.');
}
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
if(!forest){process.env.EVIDENCE_DIR='docs/mission-14-evidence/light';process.env.NATIVE_VIDEO='work/mission-14C/after-native.webm';await import('./publish-mission-14-evidence.mjs');}
