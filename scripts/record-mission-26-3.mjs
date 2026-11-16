import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {openMission} from './lib/mission-26-3-browser.mjs';
import {indexNativeWebM} from './lib/native-webm.mjs';
const label=process.argv[2]??'candidate',port=Number(process.argv[3]??5414),out='docs/mission-26-3-evidence/visual-regressions',route={...JSON.parse(await readFile('docs/mission-26-3-evidence/gait-scenes.json')).flat,points:JSON.parse(await readFile('docs/mission-26-3-evidence/gait-scenes.json')).flat.points.slice(6)},report={label,method:'Native canvas + original mixed stereo audio, no manual simulation steps, no position assignment during clips. Independent matched setup before clips; four camera angles are explicitly timed. 800x600 DPR1, seed12345, June21 clear. Software renderer: no hardware or perceptual validation.',cases:[],errors:[]};let browser,page;
const packets=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_packets','-show_entries','packet=pts_time,dts_time,size,data_hash','-show_data_hash','sha256','-of','json',file],{maxBuffer:8*1024*1024})).packets;
try{({browser,page,errors:report.errors}=await openMission(port,{width:800,height:600}));report.sourceSHA=await page.evaluate(()=>window.p262.source);
for(const [scene,profile,seconds]of [['walk-four-views','balanced',32],['run-four-views','balanced',32],...['eco','balanced','quality'].map(p=>['forest-birds-shadows',p,20]),['pilot-water','balanced',16]]){
 if(browser){await browser.close();({browser,page}=await openMission(port,{width:800,height:600}));page.on('pageerror',e=>report.errors.push(String(e.stack??e)));}const name=`${label}-${scene}-${profile}`,c={name,scene,profile,requestedWallSeconds:seconds,errorsBefore:report.errors.length,viewChanges:[]};
 try{
  if(scene.includes('four-views')){
   await page.evaluate(g=>window.q26.regionPlace(g,'foot','eco'),route.startGPS);
   await page.waitForFunction(p=>{const s=window.p263.support(p.x,p.z);return s.height!==null&&s.admission.ok&&s.fineReady;},route.points[0],{timeout:660000});
   const heading=Math.atan2(route.points[1].x-route.points[0].x,route.points[1].z-route.points[0].z);
   await page.evaluate(({route,heading,run})=>{window.p262.match({...route.points[0],heading,yaw:heading,zoom:8.5,profile:'balanced',date:'2026-06-21',weather:'clear'});window.p252.walk(route.points,run);},{route,heading,run:scene.startsWith('run')});
  }else if(scene==='pilot-water'){
   const site=JSON.parse(await readFile('docs/mission-25-1-evidence/swim-accesses.json'))[0].site;
   await page.evaluate(({site,profile})=>{window.p262.match({profile,date:'2026-06-21',weather:'clear'});window.p252.bank(site);window.p252.profile(profile);window.p252.action('boat');},{site,profile});
  }else await page.evaluate(profile=>window.p262.match({x:-620,z:-300,heading:0,yaw:0,zoom:4.2,profile,date:'2026-06-21',weather:'clear'}),profile);
  await page.evaluate(()=>{window.p252.hold(true);if(!window.p262.snapshot().audioEnabled)window.p252.audio();window.p252.render();});
  c.before=await page.evaluate(()=>window.p262.snapshot());await page.screenshot({path:`${out}/${name}-before.png`,timeout:15000});c.beforeImage=name+'-before.png';
  await page.evaluate(()=>{window.p263.resetCounter();window.q26.start();});const start=performance.now();
  let view=-1;while(performance.now()-start<seconds*1000){const elapsed=(performance.now()-start)/1000;if(scene.includes('four-views')){const v=Math.min(3,Math.floor(elapsed/(seconds/4)));if(v!==view){view=v;const angle=[0,Math.PI,Math.PI/2,-Math.PI/2][v];await page.evaluate(a=>window.p252.camera(window.q26.world().heading+a,.08),angle);c.viewChanges.push({wallSeconds:elapsed,view:['front','back','left','right'][v]});}}else if(scene==='forest-birds-shadows'&&elapsed>seconds/2&&view!==1){view=1;await page.evaluate(()=>window.p252.input(.2,0));c.viewChanges.push({wallSeconds:elapsed,view:'moving'});}await page.waitForTimeout(1000);}
  const data=await page.evaluate(()=>window.q26.stop()),file=name+'.webm';await mkdir(out+'/raw',{recursive:true});await writeFile(`${out}/${file}`,Buffer.from(data.base64,'base64'));c.media=await indexNativeWebM(`${out}/${file}`,`${out}/raw/${file}`);assert.deepEqual(packets(`${out}/raw/${file}`),packets(`${out}/${file}`));c.media.allAudioVideoPacketPTSAndPayloadsIdentical=true;c.media.streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',`${out}/${file}`])).streams.map(s=>({type:s.codec_type,codec:s.codec_name,channels:s.channels,sampleRate:s.sample_rate,width:s.width,height:s.height}));
  c.video=file;c.original='raw/'+file;c.frames=data.frames.length;c.wallSeconds=data.frames.length>1?(data.frames.at(-1).t-data.frames[0].t)/1000:0;c.averageRenderedFps=(data.frames.length-1)/c.wallSeconds;c.counter=await page.evaluate(()=>window.p263.counter());c.simulationSeconds=c.counter.simulationSeconds;
  let distance=0;for(let i=1;i<data.frames.length;i++)distance+=Math.hypot(data.frames[i].position[0]-data.frames[i-1].position[0],data.frames[i].position[2]-data.frames[i-1].position[2]);c.distanceM=distance;c.perceptualStatus='NON_VALIDE';c.framesWithBirds=data.frames.filter(f=>(f.birds?.individuals??0)>0).length;
  c.framesFile=name+'-frames.json.gz';c.transformsFile=name+'-transforms.json.gz';await writeFile(`${out}/${c.framesFile}`,gzipSync(JSON.stringify(data.frames),{mtime:0}));await writeFile(`${out}/${c.transformsFile}`,gzipSync(JSON.stringify(data.transforms),{mtime:0}));c.after=await page.evaluate(()=>window.p262.snapshot());c.captureValid=c.frames>1&&c.media.allAudioVideoPacketPTSAndPayloadsIdentical&&report.errors.length===c.errorsBefore;await page.screenshot({path:`${out}/${name}-after.png`,timeout:15000});c.afterImage=name+'-after.png';
 }catch(e){c.failure=String(e);console.log(name,c.failure);}report.cases.push(c);await writeFile(`${out}/${label}-native.json`,JSON.stringify(report,null,2));
}
}catch(e){report.failure=String(e);}finally{await writeFile(`${out}/${label}-native.json`,JSON.stringify(report,null,2));await browser?.close();}
