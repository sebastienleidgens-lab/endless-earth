import {writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {launch,openSnowGame,settle,snowReady,views} from './lib/mission-15b-browser.mjs';
const mode=process.argv[2]??'snow-walk',out='docs/mission-15-evidence/snow-sky',scratch='work/mission15b',browser=await launch();
await mkdir(scratch,{recursive:true});
const audioProbe=`window.snowAudio={
 start(){const after=scene.onAfterRender;scene.onAfterRender=(...args)=>{after.apply(scene,args);const f=window.m15Frames.at(-1);if(f)f.snow={...scene.userData.snow}};const destination=sound.context.createMediaStreamDestination();sound.renderer.limiter.connect(destination);const stream=renderer.domElement.captureStream(8);for(const track of destination.stream.getAudioTracks())stream.addTrack(track);window.snowChunks=[];const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:800000,audioBitsPerSecond:64000});recorder.ondataavailable=e=>{if(e.data.size)window.snowChunks.push(e.data)};recorder.start(1000);this.recorder=recorder;this.destination=destination},
 async stop(){const recorder=this.recorder;await new Promise(r=>{recorder.onstop=r;recorder.stop()});sound.renderer.limiter.disconnect(this.destination);recorder.stream.getTracks().forEach(t=>t.stop());return Array.from(new Uint8Array(await new Blob(window.snowChunks).arrayBuffer()))}
};`;
try{
 const g=await openSnowGame(browser,5173,{query:mode==='light'?'&snowfall=.15':mode==='heavy'?'&snowfall=1':'',append:audioProbe}),p=g.page;
 // openSnowGame already appends its diagnostics; keep audio in the owning main
 // module as well, without importing a second instance of shared state.
 // The helper accepts an additional append below its standard diagnostics.
 await p.setViewportSize({width:800,height:540});
 const walk=mode==='snow-walk',melt=mode==='melt',v=walk?['depart',-12.277392682727118,-32.416383999943434,.65,.08,0,'first']:views[0];
 await p.evaluate(({v,melt})=>window.m15b.setup(v,'balanced',melt?'2026-07-21':'2026-01-21','clear'),{v,melt});await settle(p);
 if(!walk){await p.evaluate(()=>window.m15b.cover(.001));await snowReady(p);}
 await p.evaluate(({melt,walk})=>{window.m15b.cover(melt ? .24 : walk ? 0 : .3,!melt&&!walk);if(!melt&&!walk)window.m15b.weather('snow')},{melt,walk});
 await p.addStyleTag({content:'.living-panel{visibility:visible!important}#sound{visibility:visible!important}'});await p.locator('#sound').click();
 await p.evaluate(()=>window.m15.native(true));await p.waitForFunction(()=>window.m15Frames.length>=8);await p.waitForTimeout(1500);
 await p.addStyleTag({content:'.living-panel,#sound,#auto-walk{visibility:hidden!important}'});
 await p.evaluate(()=>window.snowAudio.start());if(walk)await p.evaluate(()=>window.m15b.weather('snow'));
 const begin=performance.now(),duration=melt?300:walk?120:30,observations=[];
 const checkpoints=melt?[0,60,120,180,240,300]:walk?[0,30,60,90,110,120]:[0,15,30];
 for(const seconds of checkpoints){
  let remain=seconds*1000-(performance.now()-begin);while(remain>0){await p.waitForTimeout(Math.min(30000,remain));remain=seconds*1000-(performance.now()-begin)}
  const state=await p.evaluate(()=>{const s=window.m15b.state();if(s.flowers)delete s.flowers.recipes;return s});observations.push({wallSeconds:(performance.now()-begin)/1000,state});
  await p.screenshot({path:`${out}/${mode}-${seconds}s.jpg`,type:'jpeg',quality:87});
  if(walk&&(seconds===30||seconds===110)){await p.addStyleTag({content:'#auto-walk{visibility:visible!important}.living-panel{visibility:visible!important}'});await p.locator('#auto-walk').click();await p.addStyleTag({content:'.living-panel,#auto-walk{visibility:hidden!important}'});}
  console.log(mode,'native wall',seconds,'cover',state.snow.cover.toFixed(4),'flakes',state.snow.flakes);
 }
 const result=await p.evaluate(async()=>{const data=await window.snowAudio.stop();window.m15.native(false);return {data,frames:window.m15Frames}});
 await writeFile(`${scratch}/${mode}-native.webm`,Buffer.from(result.data));
 execFileSync('ffmpeg',['-v','error','-y','-copyts','-i',`${scratch}/${mode}-native.webm`,'-map','0:v:0','-map','0:a:0','-c','copy',`${out}/${mode}.webm`]);
 assert.deepEqual(g.errors,[]);assert.deepEqual(g.warnings,[]);
 const first=observations[0].state.snow.cover,last=observations.at(-1).state.snow.cover;
 if(walk){assert.ok(first<.02&&last>.1&&last<.7);assert.ok(result.frames.filter(f=>f.walkable).length/result.frames.length>.99);const moved=result.frames.reduce((n,f,i,a)=>n+(i?Math.hypot(f.position[0]-a[i-1].position[0],f.position[2]-a[i-1].position[2]):0),0);assert.ok(moved>5);assert.ok(observations.at(-1).state.audio.steps>5)}
 if(melt){assert.ok(first>.20&&last<.01);assert.ok(observations.every((o,i,a)=>!i||o.state.snow.cover<=a[i-1].state.snow.cover));}
 assert.ok(observations.every(o=>!o.state.audio.layers.some(l=>l.id==='rain'&&l.targetGain>.001)));
 await writeFile(`${out}/${mode}.json`,JSON.stringify({method:`Native ordinary game loop, ${duration} wall seconds, no time acceleration or forced path. ${walk?'Natural snow begins at zero; AutoWalk is enabled at 30s and stopped at 110s using its ordinary button.':melt?'Initial .24 cover is a labelled diagnostic seed, unlocked before the native warmup; July clear sky melts it naturally.':'Fixed diagnostic .3 cover; actual snowfall intensity '+(mode==='light'?'.15':'1')+'.'} Native VP9/Opus canvas8fps plus the actual post-limiter audio bus; indexed by packet-copy only. SwiftShader capture timings are not physical GPU performance.`,environment:g.environment,observations,errors:g.errors,warnings:g.warnings},null,2)+'\n');
 await writeFile(`${out}/${mode}-trace.json.gz`,gzipSync(JSON.stringify(result.frames),{level:9}));console.log('PASS native motion',mode);
}finally{await browser.close()}
